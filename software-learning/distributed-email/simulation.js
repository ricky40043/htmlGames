'use strict';

const emailShifts = [
    { kind: 'delivery', title: '早班尖峰', ready: 600, temp: 240, hard: 60, remote: 720, active: 'in-domain' },
    { kind: 'delivery', title: '外站限速', ready: 720, temp: 360, hard: 40, remote: 480, active: 'in-domain' },
    { kind: 'delivery', title: '多收件者退信', ready: 480, temp: 130, hard: 190, remote: 960, active: 'feedback' },
    { kind: 'receive', title: 'SMTP 入口重啟', total: 180, unsaved: 12, cost: 60, active: 'receive-entry' },
    { kind: 'receive', title: '大附件暫存', total: 240, unsaved: 24, cost: 55, active: 'mime' },
    { kind: 'receive', title: '佇列積壓與重送', total: 390, unsaved: 30, cost: 70, active: 'receive-delivery' },
    { kind: 'search', title: '新信搜尋落後', backlog: 120, events: 180, stale: 0, active: 'elastic' },
    { kind: 'search', title: '刪除後的過期命中', backlog: 240, events: 160, stale: 18, active: 'search-workload' },
    { kind: 'search', title: '索引重建尖峰', backlog: 330, events: 220, stale: 34, active: 'search-choice' },
    { kind: 'region', title: '主區離線', lag: 12, old: true, budget: 12, active: 'regions' },
    { kind: 'region', title: '跨區分區且舊主仍在線', lag: 0, old: true, budget: 0, active: 'primary' },
    { kind: 'region', title: '備援追趕，安全接手寫入', lag: 24, old: false, budget: 30, active: 'failure-coverage' }
];

const emailShiftModels = {
    delivery: {
        fields: [
            ['workers', '寄件 Worker', [['2','2 台'],['4','4 台'],['6','6 台'],['8','8 台']]],
            ['retry', '退信與暫時錯誤', [['all','全部立即重試'],['backoff','依收件者退避或結案']]]
        ],
        diagram: ['寄件入口','寄件佇列','SMTP Worker','遠端交接','退信回報'],
        describe: item => '現有 ' + item.ready + ' 封可交接、' + item.temp + ' 封暫時失敗、' + item.hard +
            ' 封地址無效。每台 Worker 每分鐘處理 150 封，遠端每分鐘最多接手 ' + item.remote +
            ' 封。目標是在遠端限額內交接最多正常信，保護所有待重試郵件，並結案永久退信。',
        run(item, { workers, retry }) {
            const capacity = Number(workers) * 150;
            const disciplined = retry === 'backoff';
            const wasted = disciplined ? 0 : Math.min(capacity, item.temp + item.hard);
            const delivered = Math.min(item.ready, item.remote, capacity - wasted);
            const goal = Math.min(item.ready, item.remote);
            return {
                passed: delivered === goal && disciplined,
                metrics: [['完成交接', delivered + ' / ' + goal], ['待退避', disciplined ? item.temp : 0],
                    ['永久退信結案', disciplined ? item.hard : 0], ['仍待交接', item.ready - delivered]],
                trace: [
                    ['佇列', '正常信 ' + item.ready + ' 封，處理額度 ' + capacity],
                    ['Worker', wasted ? wasted + ' 次額度用於立即重試' : '分收件者排定退避，已結案者停止發送'],
                    ['外站', '本班成功交接 ' + delivered + ' 封'],
                    ['待辦', item.ready > delivered ? '仍需交接 ' + (item.ready - delivered) + ' 封，下一班繼續' : '正常寄件已交接']
                ],
                hint: !disciplined ? '會浪費額度，也會讓無效地址反覆發送。改為按收件者判斷。' :
                    delivered < goal ? 'Worker 尚不足以使用遠端的可用額度。' : '達到遠端可接收的目標，並保留待重試工作。'
            };
        }
    },
    receive: {
        fields: [
            ['ack', '何時確認已接手', [['early','收到資料後立即回成功'],['durable','耐久保存後再回成功']]],
            ['workers', '收件處理 Worker', [['2','2 台'],['4','4 台'],['6','6 台'],['8','8 台']]]
        ],
        diagram: ['外站 SMTP','收件入口','耐久佇列','掃描 Worker','信箱主資料'],
        describe: item => '本班收到 ' + item.total + ' 封，入口在其中 ' + item.unsaved + ' 封尚未存妥時重啟。每台 Worker 一班可處理 ' +
            item.cost + ' 封。未收到成功的寄件端本班皆可重試。目標是零遺失，並讓所有本班郵件能進入信箱。',
        run(item, { ack, workers }) {
            const lost = ack === 'early' ? item.unsaved : 0;
            const durable = item.total - lost;
            const committed = Math.min(Number(workers) * item.cost, durable);
            return {
                passed: lost === 0 && committed === item.total,
                metrics: [['已耐久保存', durable], ['已進信箱', committed], ['未處理', durable - committed], ['遺失', lost]],
                trace: [
                    ['收件入口', '重啟發生於 ' + item.unsaved + ' 封未保存時'],
                    ['上游', lost ? '收到成功而停止重試，少 ' + lost + ' 封' : '尚未收到成功的郵件已重試'],
                    ['信箱', committed + ' 封已處理，其餘留在耐久佇列']
                ],
                hint: lost ? '成功回覆應放在耐久保存之後。' :
                    committed < item.total ? '資料完整，但處理量不足。增加 Worker 趕上本班負載。' : '入口安全恢復。所有郵件都已處理。'
            };
        }
    },
    search: {
        fields: [
            ['workers', '索引 Worker', [['1','1 台'],['3','3 台'],['4','4 台'],['6','6 台']]],
            ['guard', '查詢遇到過期結果時', [['hide','驗證主資料與授權'],['expose','直接回索引命中']]]
        ],
        diagram: ['信箱資料庫','變更事件','索引 Worker','搜尋引擎','驗證結果'],
        describe: item => '索引原有 ' + item.backlog + ' 筆，本班又有 ' + item.events + ' 筆新事件。每台 Worker 本班處理 100 筆。開始時有 ' +
            item.stale + ' 筆郵件已刪但索引仍能命中。目標是清空積壓，期間也不顯示已刪郵件。',
        run(item, { workers, guard }) {
            const remaining = Math.max(0, item.backlog + item.events - Number(workers) * 100);
            const exposed = guard === 'expose' ? item.stale : 0;
            return {
                passed: remaining === 0 && exposed === 0,
                metrics: [['起始索引事件', item.backlog + item.events], ['剩餘索引事件', remaining], ['過期誤顯示', exposed]],
                trace: [
                    ['主資料', '最新信箱狀態可獨立使用'],
                    ['搜尋結果', exposed ? '曾顯示 ' + exposed + ' 筆已刪郵件' : '過期命中依主資料與授權過濾'],
                    ['索引消費者', '剩餘待寫 ' + remaining + ' 筆']
                ],
                hint: exposed ? '過期索引可以提供候選，畫面顯示前仍要驗證可見性。' :
                    remaining ? '搜尋端的保護已生效，但索引處理量不足。' : '搜尋已追上，過期結果也未外露。'
            };
        }
    },
    region: {
        fields: [
            ['restore', '備援複寫進度', [['skip','維持目前進度'],['restore','從耐久紀錄補齊']]],
            ['fence', '舊主寫入資格', [['keep','保留既有狀態'],['revoke','驗證並撤銷舊主資格']]]
        ],
        diagram: ['區域路由','主信箱','耐久紀錄','備援信箱','接手檢查'],
        describe: item => '主區暫時無法服務，備援目前缺 ' + item.lag + ' 筆已確認寫入，' +
            (item.old ? '舊主仍保有寫入資格。' : '舊主的寫入資格已撤銷。') +
            ' 本班可從耐久紀錄最多補回 ' + item.budget + ' 筆。目標是安全恢復寫入。',
        run(item, { restore, fence }) {
            const remaining = Math.max(0, item.lag - (restore === 'restore' ? item.budget : 0));
            const old = item.old && fence !== 'revoke';
            const passed = remaining === 0 && !old;
            return {
                passed,
                metrics: [['複寫缺口', remaining + ' 筆'], ['舊主寫入', old ? '仍可寫入' : '已隔離'],
                    ['備援模式', passed ? '可讀寫' : '暫時唯讀']],
                trace: [
                    ['區域入口', '向正常區域提供有限的信箱讀取'],
                    ['資料核對', remaining ? '仍缺 ' + remaining + ' 筆已確認紀錄' : '備援已達安全資料位置'],
                    ['升主檢查', old ? '舊主仍可寫入，等待完成隔離' : '儲存層已排除舊主寫入資格'],
                    ['備援區', passed ? '安全接手新寫入' : '維持唯讀，避免資料不一致']
                ],
                hint: remaining ? '只有資料完整才能保證恢復既有信箱。' :
                    old ? '先隔離舊主，才能確保只有一個寫入者。' : '複本已追平，舊主已隔離，可以恢復寫入。'
            };
        }
    }
};

function mountEmailWorld(root, review) {
    const previous = readEmailProgress().fullSimulation || {};
    let round = Math.min(emailShifts.length, Math.max(0, Math.floor(Number(previous.round) || 0)));
    function addButton(label, handler, primary = false) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        if (primary) button.className = 'primary';
        button.addEventListener('click', handler);
        return button;
    }
    function persist() {
        saveEmailProgress({ fullSimulation: { round }, simulationCompleted: round === emailShifts.length });
    }
    function render() {
        if (round === emailShifts.length) {
            root.innerHTML = '<h2 tabindex="-1">🏁 12 回合值班完成</h2><p>寄件、收件、搜尋和備援的目標均已達成。</p>' +
                '<div class="quiz-actions"></div>';
            root.querySelector('.quiz-actions').append(
                addButton('重新挑戰', () => { round = 0; persist(); render(); }),
                addButton('回期末考', () => review('exam'), true)
            );
            return;
        }
        const item = emailShifts[round];
        const model = emailShiftModels[item.kind];
        root.innerHTML = '<ol class="world-rounds" aria-label="模擬回合"></ol><h3 tabindex="-1"></h3><p class="world-story"></p>' +
            '<div class="world-workbench"><section class="world-map" aria-label="模擬架構">' +
            '<div class="world-diagram"></div><progress class="world-clock" value="0" max="60" aria-label="本回合模擬時間"></progress>' +
            '<div class="world-meter">0 / 60 秒（模擬時間）</div><div class="world-results" aria-live="polite"></div>' +
            '</section><section class="world-console"><div class="world-tabs" role="group" aria-label="工作台面板"></div>' +
            '<div class="world-config"><div class="lab-fields"></div><div class="quiz-actions"></div></div>' +
            '<div class="world-incident" hidden></div></section></div>' +
            '<h4>請求追蹤與事故紀錄</h4><table class="world-trace"><thead><tr><th>模擬時間</th><th>節點</th><th>結果</th></tr></thead><tbody></tbody></table>';
        const rounds = root.querySelector('.world-rounds');
        emailShifts.forEach(({ title }, index) => {
            const li = document.createElement('li');
            li.title = title;
            li.textContent = index < round ? '✓ ' + (index + 1) : index + 1;
            if (index === round) li.setAttribute('aria-current', 'step');
            rounds.append(li);
        });
        root.querySelector('h3').textContent = '第 ' + (round + 1) + ' / ' + emailShifts.length + ' 回合｜' + item.title;
        root.querySelector('.world-story').textContent = model.describe(item);
        root.querySelector('.world-diagram').innerHTML = model.diagram.map(text => '<span>' + esc(text) + '</span>')
            .join('<b aria-hidden="true">→</b>');
        const fields = root.querySelector('.lab-fields');
        model.fields.forEach(([key, text, choices]) => {
            const label = document.createElement('label');
            const choice = document.createElement('select');
            choice.name = key;
            for (const [value, title] of choices) choice.add(new Option(title, value));
            label.append(text, choice);
            fields.append(label);
        });
        const output = root.querySelector('.world-results');
        const meter = root.querySelector('.world-meter');
        const clock = root.querySelector('.world-clock');
        const architecture = [...root.querySelectorAll('.world-diagram span')];
        const incident = root.querySelector('.world-incident');
        const requests = root.querySelector('.world-trace tbody');
        const settingsPanel = root.querySelector('.world-config');
        const tabs = root.querySelector('.world-tabs');
        let outcome;
        let stage = 0;
        let timer;
        let playing = false;
        let final = false;
        const next = addButton(round + 1 < emailShifts.length ? '下一回合' : '完成模擬', () => {
            round++;
            persist();
            render();
            root.querySelector('h2,h3').focus();
        });
        next.disabled = true;

        function showPanel(openSettings) {
            settingsPanel.hidden = !openSettings;
            incident.hidden = openSettings;
            for (const [index, button] of [...tabs.children].entries()) {
                button.setAttribute('aria-pressed', String(index === 0 ? openSettings : !openSettings));
            }
        }
        tabs.append(addButton('控制台', () => showPanel(true)), addButton('事故與結果', () => showPanel(false)));
        showPanel(true);
        incident.textContent = '執行回合後會出現各節點的處理結果。可點選下方紀錄查看細節。';

        function drawMetrics(elapsed, finished = false) {
            meter.textContent = elapsed + ' / 60 秒（模擬時間）';
            clock.value = elapsed;
            architecture.forEach((node, index) => {
                node.classList.toggle('is-active', index === stage);
                node.classList.toggle('is-past', index < stage);
            });
            if (!finished) return;
            output.innerHTML = '<div class="lab-readout"><dl class="simulation-metrics">' + outcome.metrics
                .map(([label, value]) => '<div><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>').join('') +
                '</dl><p><strong>' + (outcome.passed ? '已達目標' : '目前瓶頸') + '</strong>　' + esc(outcome.hint) + '</p></div>';
        }

        function addTrace(elapsed, name, message) {
            const row = document.createElement('tr');
            const time = document.createElement('td');
            const event = document.createElement('th');
            const description = document.createElement('td');
            event.scope = 'row';
            time.textContent = elapsed + ' 秒';
            event.append(addButton(name, () => {
                incident.textContent = name + '｜' + message;
                showPanel(false);
            }));
            description.textContent = message;
            row.append(time, event, description);
            requests.append(row);
        }

        function playTick() {
            if (!playing || !clock.isConnected || !root.closest('dialog')?.open) {
                playing = false;
                return;
            }
            const count = outcome.trace.length;
            if (stage < count) {
                const elapsed = Math.min(59, Math.round((stage + 1) * 60 / (count + 1)));
                const [node, message] = outcome.trace[stage++];
                addTrace(elapsed, node, message);
                drawMetrics(elapsed);
                timer = setTimeout(playTick, 290);
                return;
            }
            stage = architecture.length - 1;
            drawMetrics(60, true);
            incident.textContent = outcome.hint;
            next.disabled = !outcome.passed;
            playing = false;
            final = true;
            pauseRun.hidden = true;
            run.disabled = false;
        }

        function stop() {
            clearTimeout(timer);
            playing = false;
            pauseRun.hidden = true;
            run.disabled = false;
        }

        const pauseRun = addButton('暫停模擬', () => {
            if (playing) {
                clearTimeout(timer);
                playing = false;
                pauseRun.textContent = '繼續模擬';
            } else if (!final) {
                playing = true;
                pauseRun.textContent = '暫停模擬';
                timer = setTimeout(playTick, 290);
            }
        });
        pauseRun.hidden = true;
        const run = addButton('執行本回合', () => {
            const inputs = Object.fromEntries([...fields.querySelectorAll('select')].map(choice => [choice.name, choice.value]));
            outcome = model.run(item, inputs);
            stage = 0;
            final = false;
            playing = true;
            requests.replaceChildren();
            output.replaceChildren();
            incident.textContent = '本回合進行中。';
            pauseRun.hidden = false;
            pauseRun.textContent = '暫停模擬';
            run.disabled = true;
            next.disabled = true;
            drawMetrics(0);
            timer = setTimeout(playTick, 320);
        }, true);
        fields.addEventListener('change', () => {
            stop();
            stage = 0;
            next.disabled = true;
            output.replaceChildren();
            requests.replaceChildren();
            drawMetrics(0);
        });
        root.querySelector('.quiz-actions').append(run, pauseRun, next, addButton('回課程複習', () => review(item.active)));
    }
    render();
}
