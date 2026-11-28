'use strict';

(() => {
    const root = document.getElementById('simulation-content');
    const incidents = [
        {
            title: '外站退信與寄件塞車',
            description: '寄件佇列有 600 封可立即交接的信、240 封需要稍後重試，以及 60 封地址無效的信。每台 Worker 每分鐘最多處理 150 封。先處理可寄的 600 封，暫時失敗的郵件要保留，無效地址應停止重送。',
            fields: [
                ['workers', '寄件 Worker 數量', [['2', '2 台'], ['4', '4 台'], ['6', '6 台']]],
                ['retry', '收到錯誤時', [['all', '全部立即重試'], ['backoff', '依收件者退避或結束投遞']]]
            ],
            run({ workers, retry }) {
                const capacity = Number(workers) * 150;
                const retriesNow = retry === 'all';
                const wasted = retriesNow ? Math.min(capacity, 300) : 0;
                const delivered = Math.min(600, capacity - wasted);
                const passed = delivered === 600 && !retriesNow;
                const notes = [];
                if (retriesNow) notes.push('立即重送占用了 ' + wasted + ' 次處理額度，永久失敗也還沒有結案。');
                if (delivered < 600) notes.push('仍有 ' + (600 - delivered) + ' 封能寄的信滯留，讓可投遞郵件先用到足夠的 Worker。');
                if (passed) notes.push('正常郵件已交接，暫時失敗的信安排退避重試，無效地址已結案。');
                return {
                    passed, notes,
                    metrics: [
                        ['已交接', delivered + ' / 600 封'],
                        ['保留待退避', retriesNow ? '0 / 240 封' : '240 / 240 封'],
                        ['永久退信已結案', retriesNow ? '0 / 60 封' : '60 / 60 封']
                    ]
                };
            }
        },
        {
            title: '接收郵件與搜尋落後',
            description: '收件端收到 180 封新信，索引原本已排了 120 筆。第一台入口在 12 封還沒寫入時重啟。每台索引 Worker 每分鐘處理 100 筆，目標是在一分鐘內保住所有新信並清完待更新的索引。',
            fields: [
                ['ack', '寄件端何時收到成功回覆', [['early', '收到資料後立即回覆'], ['durable', '耐久保存後再回覆']]],
                ['workers', '索引 Worker 數量', [['1', '1 台'], ['2', '2 台'], ['3', '3 台']]]
            ],
            run({ ack, workers }) {
                const lost = ack === 'early' ? 12 : 0;
                const stored = 180 - lost;
                const pending = Math.max(0, 120 + stored - Number(workers) * 100);
                const passed = lost === 0 && pending === 0;
                const notes = [];
                if (lost) notes.push('入口已回成功，對方不會自動重寄尚未耐久保存的 12 封。');
                if (pending) notes.push('信箱已能讀到保存的郵件，搜尋還有 ' + pending + ' 筆索引事件待處理。');
                if (passed) notes.push('入口重啟後，尚未收到成功回覆的郵件重試成功。索引也已跟上信箱。');
                return {
                    passed, notes,
                    metrics: [
                        ['已耐久保存', stored + ' / 180 封'],
                        ['遺失', lost + ' 封'],
                        ['索引待處理', pending + ' 筆']
                    ]
                };
            }
        },
        {
            title: '主區故障與安全切換',
            description: '主區無法服務，備援區落後 12 筆。備援可以暫時提供已同步的讀取。恢復寫入前，必須補齊已確認的郵件，並撤銷舊主的寫入資格。',
            fields: [
                ['restore', '備援複寫進度', [['skip', '保留目前進度'], ['restore', '從耐久記錄補齊 12 筆']]],
                ['fence', '處理舊主的寫入資格', [['skip', '等待舊主自行恢復'], ['revoke', '撤銷舊主寫入資格']]]
            ],
            run({ restore, fence }) {
                const lag = restore === 'restore' ? 0 : 12;
                const fenced = fence === 'revoke';
                const passed = lag === 0 && fenced;
                const notes = [];
                if (lag) notes.push('備援還缺 12 筆已確認寫入。現在切換可能讓使用者看不到這些郵件。');
                if (!fenced) notes.push('舊主仍有寫入資格。切換前必須隔離舊主，避免兩邊都接受寫入。');
                if (passed) notes.push('複寫已追平，舊主也已隔離。備援區可升主並接手新的寫入。');
                return {
                    passed, notes,
                    metrics: [
                        ['複寫落後', lag + ' 筆'],
                        ['舊主寫入資格', fenced ? '已撤銷' : '仍有效'],
                        ['備援區服務', passed ? '可讀寫' : '暫時唯讀']
                    ]
                };
            }
        }
    ];
    let round = 0;

    function action(text, handler, emphasized = false) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        if (emphasized) button.className = 'primary';
        button.addEventListener('click', handler);
        return button;
    }

    function start() {
        round = 0;
        showIncident(true);
    }

    function showResult(container, { metrics, notes }) {
        const stats = document.createElement('dl');
        stats.className = 'simulation-metrics';
        for (const [label, value] of metrics) {
            const metric = document.createElement('div');
            const name = document.createElement('dt');
            const reading = document.createElement('dd');
            name.textContent = label;
            reading.textContent = value;
            metric.append(name, reading);
            stats.append(metric);
        }
        const feedback = notes.map(line => {
            const note = document.createElement('p');
            note.textContent = line;
            return note;
        });
        container.replaceChildren(stats, ...feedback);
    }

    function showIncident(moveFocus = false) {
        const incident = incidents[round];
        const progress = document.createElement('ol');
        progress.className = 'simulation-rounds';
        incidents.forEach(({ title }, index) => {
            const item = document.createElement('li');
            item.textContent = (index < round ? '✓ ' : '') + title;
            if (index === round) item.setAttribute('aria-current', 'step');
            progress.append(item);
        });
        const heading = document.createElement('h3');
        heading.textContent = '第 ' + (round + 1) + ' 回合｜' + incident.title;
        heading.tabIndex = -1;
        const description = document.createElement('p');
        description.textContent = incident.description;
        const fields = document.createElement('div');
        fields.className = 'lab-fields';
        for (const [name, label, choices] of incident.fields) {
            const field = document.createElement('label');
            const select = document.createElement('select');
            select.name = name;
            for (const [value, title] of choices) select.add(new Option(title, value));
            field.append(label, select);
            fields.append(field);
        }
        const result = document.createElement('div');
        result.className = 'lab-readout';
        result.setAttribute('role', 'status');
        result.hidden = true;
        const buttons = document.createElement('div');
        buttons.className = 'quiz-actions';
        const advance = action(round < incidents.length - 1 ? '下一回合' : '完成模擬', () => {
            round++;
            if (round === incidents.length) {
                saveEmailProgress({ simulationCompleted: true });
                showCompletion(true);
            } else {
                showIncident(true);
            }
        });
        advance.disabled = true;
        const run = action('套用設定', () => {
            const choices = Object.fromEntries([...fields.querySelectorAll('select')]
                .map(select => [select.name, select.value]));
            const outcome = incident.run(choices);
            advance.disabled = !outcome.passed;
            result.hidden = false;
            showResult(result, outcome);
        }, true);
        fields.addEventListener('change', () => {
            advance.disabled = true;
            result.hidden = true;
        });
        buttons.append(run, advance);
        root.replaceChildren(progress, heading, description, fields, buttons, result);
        if (moveFocus) heading.focus();
    }

    function showCompletion(moveFocus = false) {
        const status = document.createElement('p');
        status.className = 'lab-readout';
        status.textContent = '已完成 3 回合。寄件交接完成、搜尋已追上，備援區也已安全恢復寫入。';
        status.tabIndex = -1;
        const next = document.createElement('a');
        next.href = '#quiz';
        next.className = 'section-link';
        next.textContent = '前往章末測驗';
        const buttons = document.createElement('div');
        buttons.className = 'quiz-actions';
        buttons.append(next, action('重新挑戰', start));
        root.replaceChildren(status, buttons);
        if (moveFocus) status.focus();
    }

    if (readEmailProgress().simulationCompleted) showCompletion();
    else showIncident();
})();
