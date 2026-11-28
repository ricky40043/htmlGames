'use strict';

function mountEmailPractice(container, mode, review) {
    const isQuiz = mode === 'quiz';
    container.innerHTML = isQuiz ? '<div id="quiz-content"></div>' :
        '<div id="lab-tabs" role="group" aria-label="選擇實驗"></div><div id="lab-content"></div>';
    const $ = id => container.querySelector('#' + id);
    const integer = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 });
    const decimal = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 1 });
    const labs = [
        {
            id: 'capacity', title: '流量與容量',
            prompt: '改變使用者規模、保留期和副本數。每人每天收到 40 封，20% 有附件。觀察寄件速率和儲存量的差別。',
            fields: [
                ['users', '使用者數（百萬）', 1000, 1, 10000],
                ['sends', '每人每天寄幾封', 10, 1, 1000],
                ['days', '保留期（天）', 365, 1, 3650],
                ['copies', '每份資料的副本總數', 1, 1, 8]
            ],
            run({ users, sends, days, copies }) {
                const people = users * 1e6;
                const messages = people * 40 * days;
                const content = messages * 50e3 * copies / 1e15;
                const attachments = messages * .2 * 500e3 * copies / 1e15;
                return '<p>平均寄件 <strong>' + integer.format(people * sends / 86400) + ' 次／秒</strong></p>' +
                    '<p>保留 ' + days + ' 天的郵件內容 <strong>' + decimal.format(content) + ' PB</strong>，附件 <strong>' +
                    decimal.format(attachments) + ' PB</strong></p>' +
                    '<p>以十進位單位估算，容量已乘上副本總數。尖峰、搜尋索引和壓縮需另計。</p>';
            }
        },
        {
            id: 'routing', title: '選擇投遞路由',
            prompt: '選擇收件人的網域與主機回應，觀察郵件下一步會去哪。',
            fields: [
                ['recipient', '收件人', [['external', '外部網域'], ['local', '同網域']]],
                ['reply', '外站回應', [
                    ['accepted', '250 已接手'],
                    ['unreachable', '優先值 10 的主機無法連線'],
                    ['busy', '451 暫時處理失敗'],
                    ['invalid', '550 收件人不存在']
                ]]
            ],
            run({ recipient, reply }) {
                if (recipient === 'local') {
                    return route(['寄件入口', '內容檢查', '本地信箱'], '同網域直接投遞，寫入寄件者與收件者各自的信箱狀態。');
                }
                const base = ['寄件佇列', 'DNS 查 MX', 'SMTP'];
                const cases = {
                    accepted: ['外站接手', '收到 250 後完成本次交接。收件端仍可能將郵件分類到不同資料夾。'],
                    unreachable: ['改試優先值 20', '先嘗試優先值 10 的主機。連不上時依 MX 順序試備援主機。'],
                    busy: ['等待重試', '暫時性的回應可將工作留在耐久佇列，依退避時程重送。'],
                    invalid: ['退信回報', '確認收件人不存在後，停止對此收件人重送，並回報發信結果。']
                };
                const [operation, result] = cases[reply];
                return route([...base, operation], result);
            }
        },
        {
            id: 'queue', title: '寄件佇列積壓',
            prompt: '用一分鐘的簡化模型，試著把佇列消化完。設成外站降速時，加 Worker 會受到哪些限制？',
            fields: [
                ['incoming', '每秒進佇列', 130, 0, 10000],
                ['workers', '投遞 Worker', 4, 1, 100],
                ['limit', '外站可接收', [['500', '正常：每秒 500 封'], ['70', '降速：每秒 70 封']]]
            ],
            run({ incoming, workers, limit }) {
                const workerCapacity = workers * 30;
                const throughput = Math.min(workerCapacity, Number(limit));
                const growth = (incoming - throughput) * 60;
                const bottleneck = throughput < workerCapacity ? '外站接收速率' : '投遞 Worker';
                return '<p>每秒最多處理 <strong>' + integer.format(throughput) + ' 封</strong>，容量上限由' +
                    bottleneck + '決定。</p><p>現在積壓 1,200 封。一分鐘後約剩 <strong>' +
                    integer.format(Math.max(0, 1200 + growth)) + ' 封</strong>。</p>';
            }
        },
        {
            id: 'search', title: '搜尋索引追趕',
            prompt: '收下一封含「合約」的郵件，再調整索引 Worker 的進度，對照收件匣和搜尋結果。',
            fields: [
                ['action', '對郵件做什麼', [['add', '收下一封新郵件'], ['remove', '刪除原有郵件']]],
                ['events', '前面還有幾筆事件', 300, 0, 20000],
                ['rate', 'Worker 每秒更新幾筆', 25, 1, 1000],
                ['elapsed', '已過幾秒', 5, 0, 1200]
            ],
            run({ action, events, rate, elapsed }) {
                const pending = Math.max(0, events + 1 - elapsed * rate);
                const add = action === 'add';
                const visible = pending ? !add : add;
                const note = pending && !add
                    ? '仍需向主資料驗證搜尋命中並排除已刪除的郵件。'
                    : '變更與索引更新的時間差可以用索引延遲監控。';
                return '<p>收件匣 <strong>' + (add ? '已看到新信' : '已刪除') +
                    '</strong>。原始索引 <strong>' + (visible ? '仍可命中「合約」' : '沒有命中「合約」') +
                    '</strong>。</p><p>排在這封信以前或同時待做的事件剩 ' + integer.format(pending) + ' 筆。' + note + '</p>';
            }
        },
        {
            id: 'failover', title: '跨區故障切換',
            prompt: '主區已無法服務。選擇複寫狀態與舊主是否已隔離，決定備援區現在能做什麼。',
            fields: [
                ['lag', '備援區落後幾筆寫入', 12, 0, 1000],
                ['fence', '舊主寫入資格', [['unknown', '尚未確認已撤銷'], ['revoked', '已撤銷']]],
                ['mode', '使用者操作', [['write', '寫入信箱'], ['read', '開啟收件匣']]]
            ],
            run({ lag, fence, mode }) {
                if (mode === 'read') return route(['區域入口', '備援複本'], lag
                    ? '可讀取備援版本，但應在介面標示仍落後 ' + integer.format(lag) + ' 筆寫入。'
                    : '在這個模型中，備援區可提供已同步的信箱讀取。');
                if (fence !== 'revoked') return route(['區域入口', '暫停寫入'], '舊主尚有可能寫入，切換會引入雙主風險。');
                if (lag) return route(['區域入口', '暫停寫入'], '此情境要求零資料遺失，須先恢復剩餘 ' + integer.format(lag) + ' 筆寫入。');
                return route(['區域入口', '升級備援', '恢復寫入'], '備援區已追平，系統也已撤銷舊主資格。');
            }
        }
    ];

    function route(labels, result) {
        return '<div class="lab-route">' +
            labels.map(label => '<span>' + label + '</span>').join('<b aria-hidden="true">→</b>') +
            '</div><p>' + result + '</p>';
    }

    function renderLab(index) {
        const lab = labs[index];
        [...$('lab-tabs').children].forEach((button, step) => button.setAttribute('aria-pressed', String(step === index)));
        const form = document.createElement('form');
        form.className = 'lab-fields';
        form.addEventListener('submit', event => event.preventDefault());
        for (const [id, labelText, initial, min, max] of lab.fields) {
            const label = document.createElement('label');
            label.textContent = labelText;
            let field;
            if (Array.isArray(initial)) {
                field = document.createElement('select');
                initial.forEach(([value, name]) => field.add(new Option(name, value)));
            } else {
                field = document.createElement('input');
                field.type = 'number';
                field.required = true;
                field.min = min;
                field.max = max;
                field.value = initial;
            }
            field.name = id;
            label.append(field);
            form.append(label);
        }
        const prompt = document.createElement('p');
        prompt.textContent = lab.prompt;
        const output = document.createElement('div');
        output.className = 'lab-readout';
        output.setAttribute('role', 'status');
        const update = () => {
            if (!form.checkValidity()) {
                output.textContent = '請在欄位允許的範圍內輸入整數。';
                return;
            }
            const values = Object.fromEntries([...form.elements].map(field => [
                field.name,
                field.type === 'number' ? field.valueAsNumber : field.value
            ]));
            output.innerHTML = lab.run(values);
        };
        form.addEventListener('input', update);
        $('lab-content').replaceChildren(prompt, form, output);
        update();
    }

    if (!isQuiz) {
        for (const [index, lab] of labs.entries()) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = lab.title;
            button.addEventListener('click', () => renderLab(index));
            $('lab-tabs').append(button);
        }
        renderLab(Math.max(0, labs.findIndex(lab => lab.id === mode)));
        return;
    }

    const questions = [
        ['estimate', '估算年度附件容量時，哪一組因子適合用來計算？',
            '入站信數 × 有附件的比例 × 附件平均大小',
            ['寄件尖峰 QPS × 一年秒數 × 單封平均正文大小', '活躍帳號數 × 含附件比例 × 近期列表平均大小'],
            '保存量應依實際入站信數與附件大小估算，再納入保留時間和副本數。'],
        ['protocol-roles', '查到 MX 優先值 10 與 20，寄件端通常先試哪一個？',
            '優先值 10', ['優先值 20', '兩台都寄一份'],
            'MX 優先值越小越先嘗試。'],
        ['protocol-roles', '手機和桌面程式都要看到同一份資料夾與已讀狀態，哪種協定適合？',
            'IMAP', ['SMTP', 'POP'],
            'IMAP 支援與伺服器同步信箱狀態。'],
        ['overview', '郵件附件很大，但收件匣列表通常只顯示摘要。附件適合先存在哪裡？',
            '物件儲存，資料庫保存授權與引用', ['近期列表的快取，每次讀列表一起取出', '每份全文索引各存一份，與索引同步重建'],
            '物件儲存負責附件內容，列表與權限資訊可以獨立儲存。'],
        ['in-domain', '遠端 SMTP 回覆 451，接下來怎麼辦？',
            '保留工作，依有界退避策略重試', ['停止對該地址投遞並標記永久退信', '記錄已完成交接，等待對方主動回報'],
            '4xx 是暫時性錯誤，應用有界的重試排程。'],
        ['receive-delivery', '手機離線時錯過 WebSocket 通知，如何補齊郵件？',
            '上線時透過 HTTPS 從主資料補抓', ['從手機快取重新發送離線期間的郵件', '等遠端郵件主機察覺未讀，再發送一次'],
            '信箱提交和通知分開。客戶端可主動重新讀取信箱。'],
        ['partition', '想從新到舊列出某個使用者資料夾中的郵件，適合怎麼設計？',
            '使用者與資料夾定位分區，時間排序鍵倒序', ['附件檔名定位分區，依附件大小排序', '全信箱依已讀旗標散列，再掃描全部分片'],
            '先縮小查詢範圍到該使用者資料夾，再依排序鍵返回最近資料。'],
        ['thread-headers', '回覆信中，哪個標頭通常指向它直接回覆的郵件？',
            'In-Reply-To', ['Content-Type', 'Message-ID'],
            'Message-ID 識別回覆信自己，In-Reply-To 指向父郵件。'],
        ['reputation', '對方已回 250，能直接據此算進收件匣的比例嗎？',
            '不能。250 代表接手，仍須區分收件分類與後續回饋',
            ['可以。以 SMTP 已接手的數量當作進收件匣的數量', '可以。用 250 回覆與重試次數推算每封信的分類'],
            'SMTP 回應反映傳遞狀態。收件系統仍會執行分類。'],
        ['elastic', '信箱已刪除一封信，索引還沒更新。如何避免把它顯示在結果中？',
            '用信箱主資料驗證索引命中後再顯示',
            ['提高索引更新優先順序，直接顯示當下的索引結果', '把查詢結果放進短效快取，等它到期後重查'],
            '索引有延遲，使用者可見結果仍要遵守主資料的刪除與授權狀態。'],
        ['regions', '主區失效了，備援已追平但舊主資格尚未撤銷。現在可以開放寫入嗎？',
            '先停寫，確認舊主已被隔離，再升級備援',
            ['先升級備援，只靠改流量路由防止舊主繼續寫入', '先開放備援短暫接受寫入，待舊主恢復後再合併'],
            '備援同步進度與單一寫入者是兩個不同的條件。'],
        ['dedup', '多個收件者收到相同附件，共用物件時哪件事特別重要？',
            '每個信箱各自驗證授權，確認無引用才清理物件',
            ['以共用內容指紋作為讀取憑證，省下逐一驗證', '用寄件者決定物件的讀取期限，到期統一移除所有副本'],
            '去重節省物件容量，存取權和生命週期按照各信箱的引用管理。'],
        ['mime', '估算 Base64 附件的傳輸大小，哪個因素應納入？',
            '每 3 個原始位元組通常會產生 4 個編碼字元',
            ['附件原始大小與編碼後一樣，只需加主旨大小', '只要有 MIME 標頭，編碼就會把所有附件壓到原本的一半'],
            'Base64 是傳輸編碼，還要計入標頭及可能的換行。'],
        ['maildir', 'Maildir 如何避免使用者看到寫到一半的郵件？',
            '先在 tmp 完整寫入，再移到 new',
            ['先在 cur 顯示空白記錄，等下載附件後補正文', '先放入 new 讓客戶端下載，最後移到 tmp 確認'],
            '寫完才發布到可被讀取的目錄。'],
        ['list-and-detail', '收件匣有新信插入時，怎麼降低翻頁漏信或重複？',
            '帶上一頁最末郵件的時間和穩定 ID 接續',
            ['永遠用當前列表的列數跳過上頁範圍', '每次進到新的一頁時，從目前的第一封信開始讀取'],
            '穩定游標以郵件邊界為準，避免新信把偏移量推動。'],
        ['write-and-folders', '對 Bcc 收件者送信時，API 要維護什麼？',
            '對每位收件者仍要記錄投遞，但其他人看不到 Bcc',
            ['將 Bcc 原樣寫進所有人的可見標頭，用於狀態追蹤', '只有列在 To 的帳號才建立投遞工作，Bcc 只存草稿'],
            '密件副本仍有投遞行為，Bcc 資訊應妥善隱藏。'],
        ['receive-entry', 'SMTP 入口收到大附件後，何時可以回成功？',
            '附件及可重建郵件的工作都已達到耐久條件',
            ['附件上傳已開始，後面的佇列可以稍後再持久化', '入口在記憶體看到附件大小，便可要求對方放棄重試'],
            '收到成功後，寄件端通常會停止重試，收件端必須先承擔保存。'],
        ['read-model', '有 unread 和 read 投影，如何處理標為已讀的更新？',
            '更新主資料，移除未讀投影並建立已讀投影',
            ['只增加已讀投影，保留同一封信一直出現在未讀清單', '只刪除未讀投影，從搜尋服務反推是否已讀'],
            '投影分開後，更新需要可重放及核對。'],
        ['authentication', '何時可以通過 DMARC 的網域對齊檢查？',
            '通過的 SPF 或 DKIM 其一與可見 From 網域對齊',
            ['只要寄件者顯示名稱和主旨在同一封信中出現', '只要寄件 IP 曾送過成功郵件，就能略過網域對齊'],
            '通過驗證本身和驗證網域對齊是兩個條件。'],
        ['lsm', 'LSM 為何先把小寫入放到記憶體？',
            '可以整理成批次落盤，並用合併維持後續讀取',
            ['因為索引永遠只保存在記憶體，磁碟只有附件', '為了讓每筆新信都立即隨機改寫所有磁碟層'],
            '先累積再有序落盤，換來合併所需的 I/O 和空間。']
    ];

    const root = $('quiz-content');
    let round = [];
    let current = 0;
    let correct = 0;

    function shuffled(items) {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function quizButton(text, handler, primary = false) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        if (primary) button.className = 'primary';
        button.addEventListener('click', handler);
        return button;
    }

    function showQuestion() {
        const [lesson, question, answer, alternatives, explanation] = round[current];
        const progress = document.createElement('p');
        progress.className = 'quiz-progress';
        progress.textContent = '第 ' + (current + 1) + ' / ' + round.length + ' 題';
        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        const choices = document.createElement('div');
        choices.className = 'quiz-answers';
        legend.textContent = question;
        legend.tabIndex = -1;
        fieldset.append(legend, choices);
        shuffled([answer, ...alternatives]).forEach(value => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'answer';
            input.value = value;
            label.append(input, document.createTextNode(value));
            choices.append(label);
        });
        const feedback = document.createElement('p');
        feedback.className = 'quiz-feedback';
        feedback.setAttribute('role', 'status');
        feedback.hidden = true;
        const actions = document.createElement('div');
        actions.className = 'quiz-actions';
        const confirm = quizButton('確認答案', () => {
            const selected = choices.querySelector(':checked');
            const passed = selected.value === answer;
            if (passed) correct++;
            fieldset.disabled = true;
            [...choices.children].forEach(label => {
                const option = label.querySelector('input');
                label.classList.toggle('correct', option.value === answer);
                label.classList.toggle('incorrect', option.checked && !passed);
            });
            feedback.hidden = false;
            feedback.textContent = (passed ? '答對了。' : '正解是「' + answer + '」。') + explanation;
            const next = quizButton(current + 1 === round.length ? '看結果' : '下一題', () => {
                current++;
                if (current === round.length) finish();
                else showQuestion();
            }, true);
            const keepStudying = quizButton('回課程複習', () => review(lesson));
            actions.replaceChildren(next, keepStudying);
            next.focus({ preventScroll: true });
        }, true);
        confirm.disabled = true;
        choices.addEventListener('change', () => { confirm.disabled = false; });
        actions.append(confirm);
        root.replaceChildren(progress, fieldset, feedback, actions);
        legend.focus({ preventScroll: true });
    }

    function finish() {
        const score = Math.round(correct * 100 / round.length);
        const previous = readEmailProgress().exam || {};
        const passing = Math.ceil(questions.length * .75);
        const passedThisTime = correct >= passing;
        const exam = {
            ...previous,
            attempts: (previous.attempts || 0) + 1,
            bestScore: Math.max(previous.bestScore || 0, score),
            lastScore: score,
            passed: previous.passed || passedThisTime,
            updatedAt: new Date().toISOString()
        };
        saveEmailProgress({ exam });
        showStart('本次答對 ' + correct + ' / ' + round.length + ' 題，' + score + ' 分。' +
            (passedThisTime ? '已通過。' : '答對 ' + passing + ' 題即可通過。'));
        root.querySelector('button').focus({ preventScroll: true });
    }

    function showStart(message) {
        const previous = readEmailProgress().exam || {};
        const prompt = document.createElement('p');
        prompt.textContent = message || '共 ' + questions.length + ' 題，答對 ' + Math.ceil(questions.length * .75) + ' 題通過。每題都有解說。';
        const actions = document.createElement('div');
        actions.className = 'quiz-actions';
        actions.append(quizButton(previous.attempts ? '再做一次' : '開始測驗', () => {
            round = shuffled(questions);
            current = 0;
            correct = 0;
            showQuestion();
        }, true));
        root.replaceChildren(prompt, actions);
        if (previous.attempts) {
            const best = document.createElement('p');
            best.textContent = '已作答 ' + previous.attempts + ' 次 · 最高 ' + previous.bestScore + ' 分';
            actions.before(best);
        }
    }

    showStart();
}
