'use strict';

const emailLessons = [
    {
        id: 'scope', title: '定義需求與估算規模',
        summary: '先畫出系統邊界，再用寄件量與保存量決定設計重心。',
        nodes: [
            ['client', '使用者', '10 億個帳號', '◎'],
            ['service', 'Webmail', '寄送、收件、已讀、搜尋', '▣'],
            ['send', '寄件流量', '10 封／人／日', '↗'],
            ['inbox', '收件資料', '40 封／人／日', '✉'],
            ['body', '郵件內容', '平均 50 KB／封', '▤'],
            ['file', '附件資料', '20% × 500 KB', '▧']
        ],
        edges: ['client>service', 'service>send', 'service>inbox', 'inbox>body', 'inbox>file'],
        cues: [
            ['client', '先假設服務有十億個帳號。'],
            ['service', '使用者能寄信、收信，以及查看資料夾。', 'client>service'],
            ['service', '信箱還要支援已讀篩選、全文搜尋和附件。'],
            ['inbox', '系統要擋下垃圾信與惡意附件，並保護已收下的郵件。', 'service>inbox'],
            ['service', '登入驗證沿用既有服務，這次聚焦郵件如何流動。'],
            ['send', '每人每天寄十封，平均每秒約十一萬六千次寄件。', 'service>send'],
            ['inbox', '每人每天收到四十封，一天就有四百億封入站。', 'service>inbox'],
            ['body', '每封內容以五十千位元組估算，一年約七百三十 PB。', 'inbox>body'],
            ['file', '兩成郵件含附件，附件儲存量一年約一千四百六十 PB。', 'inbox>file'],
            ['body', '這些數字都未計入副本、索引、保留政策和尖峰流量。']
        ],
        takeaway: '寄送用 QPS 估尖峰，保存用入站量 × 平均大小 × 保留時間估容量。'
    },
    {
        id: 'protocols', title: 'SMTP、IMAP、POP 與 DNS',
        summary: '一封信跨網域時走 SMTP。用什麼方式讀信，由客戶端與信箱服務決定。',
        nodes: [
            ['web', '瀏覽器', '透過 HTTPS 使用 Webmail', '▣'],
            ['relay', '寄件伺服器', 'SMTP 移交郵件', '↗'],
            ['dns', 'DNS', '查收件網域的 MX', '⌕'],
            ['mx', '收件伺服器', '優先 10，備援 20', '⇄'],
            ['reader', '桌面郵件程式', 'POP 下載／IMAP 同步', '▤'],
            ['mime', 'MIME', '文字、HTML、附件', '▧']
        ],
        edges: ['web>relay', 'relay>dns', 'relay>mx', 'mx>reader', 'mime>relay'],
        cues: [
            ['web', '在瀏覽器按下寄送時，Webmail 先發出加密的網頁請求。', 'web>relay'],
            ['relay', '接著由寄件伺服器使用 SMTP，把郵件交給另一個網域。'],
            ['dns', '寄件端先向 DNS 查收件網域的 MX 紀錄。', 'relay>dns'],
            ['mx', '優先值越小越先嘗試，十會排在二十前面。', 'relay>mx'],
            ['reader', 'POP 把郵件下載到本機，是否保留伺服器副本取決於設定。', 'mx>reader'],
            ['reader', 'IMAP 把信箱狀態留在伺服器，讓裝置可以同步資料夾與已讀狀態。'],
            ['mime', 'MIME 描述郵件各個部分的型別，讓文字和附件裝進同一封信。'],
            ['relay', '二進位附件常用 Base64 編碼，送出前需要計入額外大小。', 'mime>relay']
        ],
        takeaway: 'SMTP 負責傳遞，MX 找到目的地，IMAP / POP 負責讀取，MIME 描述內容。'
    },
    {
        id: 'architecture', title: '從單機信箱到分散式架構',
        summary: '保留 SMTP 互通，把收發、讀取、儲存、通知與索引拆成可獨立擴展的服務。',
        nodes: [
            ['maildir', '單機 Maildir', 'tmp → new → cur', '▣'],
            ['web', 'Web API', '列資料夾、分頁、取單封', '⌘'],
            ['smtp', 'SMTP 閘道', '對外的寄收邊界', '⇄'],
            ['meta', '郵件資料庫', '信箱主資料', '▤'],
            ['object', '物件與快取', '附件物件／近期列表快取', '▧'],
            ['async', '即時通知與搜尋', 'WebSocket／反向索引', '◫']
        ],
        edges: ['maildir>web', 'web>smtp', 'web>meta', 'meta>object', 'meta>async'],
        cues: [
            ['maildir', '單機郵件伺服器可以用 Maildir，每封信各存成一個檔案。'],
            ['maildir', '新信用暫存目錄寫入，再移到新信目錄，讀取過的郵件放在目前目錄。'],
            ['web', '郵件堆滿單機磁碟時，應把客戶端入口與儲存拆開。', 'maildir>web'],
            ['web', '建立郵件、列出資料夾，以及取得單封郵件，都有各自的 API。'],
            ['web', '收件匣用游標分頁，避免有新信插入時重複或漏看舊的列。'],
            ['smtp', '瀏覽器進 Web API，外部網域則和 SMTP 閘道互通。', 'web>smtp'],
            ['meta', '郵件資料庫保存標頭、正文和信箱狀態。', 'web>meta'],
            ['object', '附件另外存物件，最近常讀的列表另外放快取。', 'meta>object'],
            ['async', '線上狀態透過即時服務通知，全文搜尋由專門的索引服務處理。', 'meta>async']
        ],
        takeaway: '資料庫是信箱的主資料。快取、通知與搜尋索引各有自己的用途。'
    },
    {
        id: 'outgoing', title: '寄件、跨網域投遞與重試',
        summary: '將快的 Web 請求與可能慢很久的郵件投遞拆開。',
        nodes: [
            ['api', '寄件 API', '流量限制、格式、大小', '▣'],
            ['queue', '耐久寄件佇列', '保存工作與收件者狀態', '▥'],
            ['worker', '投遞 Worker', '內容檢查、冪等處理', '◇'],
            ['local', '同網域信箱', '已寄件與收件匣', '✉'],
            ['remote', '外部郵件主機', 'SMTP：250 / 4xx / 5xx', '⇄'],
            ['fail', '待重試與失敗', '退避、到期、回報', '◷']
        ],
        edges: ['api>queue', 'queue>worker', 'worker>local', 'worker>remote', 'remote>fail', 'fail>queue'],
        cues: [
            ['api', '按下寄送時，入口先限流，再檢查地址格式和附件大小。'],
            ['queue', '服務先把寄件工作耐久保存，才告訴使用者已受理。', 'api>queue'],
            ['worker', '背景工作程序讀出郵件，執行垃圾信和惡意附件檢查。', 'queue>worker'],
            ['local', '同網域可以直接寫入兩邊信箱，避開外部投遞。', 'worker>local'],
            ['remote', '跨網域則查 MX，透過 SMTP 交給收件端。', 'worker>remote'],
            ['remote', '對方回二五零，代表郵件已被對方接手，實際分類由對方決定。'],
            ['fail', '四開頭是暫時失敗，進退避重試。五開頭是永久失敗，記錄並回報。', 'remote>fail'],
            ['queue', '重試時各收件者分開追蹤，已成功的人不再寄一次。', 'fail>queue'],
            ['worker', '如果佇列持續變長，先看積壓是來自本端容量還是外站延遲。', 'queue>worker']
        ],
        takeaway: '區分已受理、對方接手和進收件匣。監控佇列最老工作的等待時間。'
    },
    {
        id: 'incoming', title: '收件、耐久寫入與即時通知',
        summary: '先收妥資料，再通知使用者。通知丟失時可從收件匣重新同步。',
        nodes: [
            ['gateway', 'SMTP 入口', '負載平衡與收信政策', '⇄'],
            ['queue', '耐久收件佇列', '保存郵件或附件引用', '▥'],
            ['scan', '收件 Worker', '掃描、分類、去重', '◇'],
            ['object', '附件物件', '耐久後再寫入引用', '▧'],
            ['mailbox', '信箱資料庫', '提交郵件與版本', '▤'],
            ['client', 'Webmail', 'WebSocket 提醒、HTTPS 補抓', '▣']
        ],
        edges: ['gateway>queue', 'gateway>object', 'object>queue', 'queue>scan', 'scan>mailbox', 'mailbox>client'],
        cues: [
            ['gateway', '外站先連到 SMTP 入口，由多台伺服器分擔連線。'],
            ['gateway', '入口可先拒絕無效收件人，減少後端處理成本。'],
            ['object', '附件太大時，先耐久保存，再把它的引用放進工作事件。', 'gateway>object'],
            ['queue', '佇列保存成功後才確認收下。暫存失敗時，回覆暫時錯誤。', 'gateway>queue'],
            ['scan', '背景工作程序再做掃描與分類，重送的內部工作要可安全重跑。', 'queue>scan'],
            ['mailbox', '驗證通過後提交信箱主資料，同步記錄索引與通知所需的事件。', 'scan>mailbox'],
            ['client', '人在網站上時，使用 WebSocket 提醒客戶端有變更。', 'mailbox>client'],
            ['client', '離線或錯過通知時，下次上線主動用 HTTPS 補抓。', 'mailbox>client']
        ],
        takeaway: '確認點要有耐久保證。即時通知只需提示有變更，信箱本身能重新讀取。'
    },
    {
        id: 'storage', title: '儲存分層與查詢導向建模',
        summary: '先列出信箱的讀取方式，再決定分區鍵、排序鍵和物件儲存。',
        nodes: [
            ['query', '信箱操作', '列資料夾／讀信／篩選', '⌕'],
            ['folder', '依使用者的資料夾', '分區鍵 user_id', '▣'],
            ['list', '依資料夾的郵件', 'user_id + folder_id', '▤'],
            ['detail', '郵件明細', 'user_id + email_id', '✉'],
            ['read', '已讀與未讀投影', '依狀態查詢', '◫'],
            ['object', '附件物件', '授權後取回檔案', '▧']
        ],
        edges: ['query>folder', 'query>list', 'list>detail', 'list>read', 'detail>object'],
        cues: [
            ['query', '信箱列表常讀標頭和摘要，內文與附件通常在開信時才取。'],
            ['folder', '列資料夾依使用者分區，可以直接讀取該帳號的資料。', 'query>folder'],
            ['list', '列表以使用者與資料夾分區，再按帶時間的郵件識別碼倒序。', 'query>list'],
            ['detail', '讀單封時，依帳號與郵件識別碼找明細，避免查遍所有資料夾。', 'list>detail'],
            ['object', '大附件放物件儲存，只有拿到授權的人才能讀取。', 'detail>object'],
            ['read', '要快速查未讀，可以為狀態另存查詢投影。', 'list>read'],
            ['read', '標成已讀時，多份資料必須一起收斂，並能在失敗後重建。'],
            ['detail', '中小型可從關聯式資料庫起步；超大規模再依磁碟輸入輸出和分片評估。'],
            ['list', '近期列表適合快取，過大的信箱可分時間桶，避免單一分區無限成長。']
        ],
        takeaway: '分區鍵決定資料位置，排序鍵決定讀取順序。複製讀取資料會提高寫入與修復成本。'
    },
    {
        id: 'threads', title: '對話串、複本與信箱主節點',
        summary: '對話串依標頭重建，信箱寫入由同一個主節點排序。',
        nodes: [
            ['root', '原始郵件', 'Message-ID = A', '✉'],
            ['reply', '回覆郵件', 'In-Reply-To = A', '↩'],
            ['thread', '對話串', 'References 保留關聯', '▤'],
            ['writer', '信箱主節點', '一個有效寫入者', '◆'],
            ['replica', '備援複本', '複寫郵件與狀態', '▣'],
            ['promote', '安全切換', '確認新主、隔離舊主', '↻']
        ],
        edges: ['root>reply', 'reply>thread', 'writer>replica', 'replica>promote', 'promote>writer'],
        cues: [
            ['root', '每封郵件可以帶有自己的 Message ID。'],
            ['reply', '回覆通常在 In Reply To 指出父郵件的識別碼。', 'root>reply'],
            ['thread', 'References 則提供較完整的對話關聯，讓缺了其中一封也能補起結構。', 'reply>thread'],
            ['thread', '同主旨可能來自不同對話，使用主旨分組時要特別保守。'],
            ['writer', '同一個信箱的寫入交給單一主節點，維持狀態順序。'],
            ['replica', '郵件與信箱狀態複寫到其他節點，讓節點失效後仍可恢復。', 'writer>replica'],
            ['promote', '切換期間可短暫停寫，等確認新主具備資格再恢復。', 'replica>promote'],
            ['writer', '恢復前要讓舊主失去寫入資格，防止兩個主節點同時接受寫入。', 'promote>writer']
        ],
        takeaway: '優先守住郵件與狀態的正確性，再決定故障時哪些讀取或寫入能繼續。'
    },
    {
        id: 'deliverability', title: '送達率、退信與寄件驗證',
        summary: '用分類、回饋和驗證維持合法寄件的品質與信任。',
        nodes: [
            ['in', '外站接手', '成功交付仍可能進垃圾匣', '⇄'],
            ['soft', '軟退信', '暫時錯誤，有界重試', '◷'],
            ['hard', '硬退信', '永久錯誤，停止重送', '⊘'],
            ['feedback', '使用者投訴', '回饋進獨立處理佇列', '◇'],
            ['auth', '網域驗證', 'SPF、DKIM、DMARC', '◆'],
            ['health', '寄件品質', '分類、監控、保護收件者', '◫']
        ],
        edges: ['in>soft', 'in>hard', 'in>feedback', 'soft>health', 'hard>health', 'feedback>health', 'auth>in'],
        cues: [
            ['in', '送達率要看收件者是否有機會看到信，不能只看 SMTP 成功數。'],
            ['soft', '收件端暫時忙碌屬於軟退信，按照退避策略再次嘗試。', 'in>soft'],
            ['hard', '確認地址不存在是硬退信，停送並回報，避免把資源浪費在無效地址。', 'in>hard'],
            ['feedback', '投訴是使用者回報垃圾郵件，應分開排隊處理並辨識異常寄送。', 'in>feedback'],
            ['auth', 'SPF 檢查送信主機是否獲信封寄件網域授權。', 'auth>in'],
            ['auth', 'DKIM 用網域簽章驗證簽署的標頭和內容。'],
            ['auth', 'DMARC 要求通過的 SPF 或 DKIM 網域，至少有一項和可見寄件網域對齊。'],
            ['health', '交易通知和行銷信可以分開監控，並遵循同意與退訂規則。', 'feedback>health'],
            ['health', '用分網域的拒收、投訴和延遲趨勢，及早找出問題。', 'hard>health']
        ],
        takeaway: '暫時錯誤可重試，永久錯誤要停止，投訴要進回饋流程。網域驗證能幫助判斷寄件身分。'
    },
    {
        id: 'search', title: '搜尋索引、延遲與 LSM',
        summary: '搜尋是衍生資料。先確保信箱正確，再讓索引快速追上。',
        nodes: [
            ['db', '信箱主資料', '寄送、接收、刪除與狀態變更', '▤'],
            ['events', '事件流', '耐久事件 → 索引 Worker', '▥'],
            ['index', '反向索引', '分詞 → 郵件 ID', '⌕'],
            ['results', '搜尋 API', '帳號範圍內同步回應', '▣'],
            ['memory', 'LSM 記憶體層', '先累積多筆小寫入', '◫'],
            ['disk', 'LSM 磁碟層', '排序檔、合併與寫放大', '▧']
        ],
        edges: ['db>events', 'events>index', 'index>results', 'events>memory', 'memory>disk'],
        cues: [
            ['db', '郵件搜尋只查目前使用者自己的信箱，還要支援寄件者和未讀篩選。'],
            ['events', '寄收刪信都會產生索引事件，使用者不用等背景更新做完。', 'db>events'],
            ['index', '反向索引用詞查出可能命中的郵件識別碼。', 'events>index'],
            ['results', '搜尋是同步查詢；索引更新是非同步工作，兩者的延遲分開看。', 'index>results'],
            ['index', 'Elasticsearch 上手較快，但郵件資料庫和搜尋叢集需要分別維護。'],
            ['index', '搜尋可依帳號路由，索引更新用事件版本防止舊資料覆蓋新資料。'],
            ['db', '索引追不上時，信箱列表仍從主資料讀取；查詢過期的索引要避免顯示已刪郵件。'],
            ['memory', '自製索引可以用 LSM 類結構，把頻繁的小寫入先累積在記憶體。', 'events>memory'],
            ['disk', '再成批寫成排序檔，讓磁碟合併工作換取讀取效率。', 'memory>disk'],
            ['disk', '合併會重寫一些資料。部署前要評估寫放大、磁碟占用和查詢成本。'],
            ['index', '常變更的資料夾狀態和較固定的郵件正文，可以分開維護。'],
            ['disk', '自製搜尋能針對信箱優化，也需要團隊自行長期維護。']
        ],
        takeaway: '用索引延遲、待處理量和版本差異衡量搜尋新鮮度，也要具備重建能力。'
    },
    {
        id: 'regions', title: '跨地區擴展與故障切換',
        summary: '把讀取路徑放近使用者，定義複寫落後與跨區切換時的行為。',
        nodes: [
            ['client', '使用者', '就近連入可用區域', '◎'],
            ['router', '區域路由', '健康探測與導流', '⇄'],
            ['primary', '主區信箱', '分片與主節點寫入', '◆'],
            ['replica', '備援區信箱', '地區間複寫', '▤'],
            ['guard', '故障切換', '確認進度與新主資格', '◇'],
            ['monitor', '營運監控', '複寫延遲、積壓、錯誤率', '◫']
        ],
        edges: ['client>router', 'router>primary', 'primary>replica', 'router>replica', 'replica>guard', 'guard>primary', 'replica>monitor'],
        cues: [
            ['router', '使用者優先連到延遲較低且健康的服務區域。', 'client>router'],
            ['primary', '不同帳號的信箱可分到不同分片，讀寫容量可以一起水平增加。', 'router>primary'],
            ['replica', '資料複寫到另一個地區，預先準備故障時的讀取與恢復能力。', 'primary>replica'],
            ['replica', '跨區網路中斷時，備援區若仍可讀，應標明可能讀到較舊的版本。', 'router>replica'],
            ['guard', '要恢復寫入時，先確認備援資料的進度，並確保同時只有一個主節點。', 'replica>guard'],
            ['primary', '舊主恢復後，先追上資料，再依照切換計畫決定角色。', 'guard>primary'],
            ['monitor', '演練故障切換時，記錄恢復時間、可能的資料落差和待處理郵件量。', 'replica>monitor']
        ],
        takeaway: '跨區可縮短讀取距離並提供備援。能否接續寫入取決於複寫進度及單一寫入者的保證。'
    },
    {
        id: 'review', title: '架構總結與設計取捨',
        summary: '用一封信把全章串起來，再檢查系統如何保護資料與處理故障。',
        nodes: [
            ['send', '寄件入口', '保存成功才確認受理', '↗'],
            ['receive', '收件入口', '區分暫時與永久錯誤', '⇄'],
            ['db', '信箱主資料', '依帳號分片，保證正確性', '▤'],
            ['index', '搜尋與通知', '非同步衍生，可補抓重建', '⌕'],
            ['secure', '隱私與保護', '加密、權限、保留與稽核', '◆'],
            ['blob', '附件去重', '內容指紋、授權、引用', '▧']
        ],
        edges: ['send>receive', 'receive>db', 'db>index', 'db>secure', 'secure>blob'],
        cues: [
            ['send', '面試時先交代規模，再從使用者按下寄送開始追一封郵件。'],
            ['receive', '追到跨網域的交接點，說明承諾收下之前，哪些資料必須持久保存。', 'send>receive'],
            ['db', '收件匣依使用者分片，清楚說明主資料和投影在哪裡。', 'receive>db'],
            ['index', '通知可能漏掉，搜尋可能落後。設計補抓、重放和核對流程。', 'db>index'],
            ['secure', '郵件含隱私資料，要考量存取權限、加密、稽核、資料地區與保留規則。', 'db>secure'],
            ['secure', '驗證網域並在開啟郵件前檢查惡意內容，降低釣魚信的傷害。'],
            ['blob', '多收件人可以共用附件的物件資料，但必須分別檢查存取權限。', 'secure>blob'],
            ['blob', '只有引用全部移除後，才考慮清理共用物件。'],
            ['index', '最後用故障演練驗證設計，例如外站不可用、索引堆積和主區失效。']
        ],
        takeaway: '守住耐久確認與信箱正確性，再用佇列、投影和區域備援承受流量與故障。'
    }
];
