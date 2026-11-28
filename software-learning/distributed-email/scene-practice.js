'use strict';

const emailSceneExercises = (() => {
    const route = (title, scenario, rows) => ({ type: 'route', title, scenario, rows });
    const dispatch = (title, scenario, options, rows) => ({ type: 'dispatch', title, scenario, options, rows });
    const numbers = (title, scenario, rows) => ({ type: 'number', title, scenario, rows });
    return {
        brief: route('追蹤一封離線收件者的信', 'Alice 寄出合約時，Bob 的手機正在飛航模式。請從按下寄送開始，安排這封信走到 Bob 螢幕的三個動作。', [
            ['寄件服務受理合約信', '寄件端先保留可追蹤的工作。'],
            ['收件服務保存到 Bob 的信箱', 'Bob 離線時，伺服器仍能保管合約。'],
            ['手機重新連線並同步信箱', '客戶端讀回已經保存的信。']
        ]),
        requirements: dispatch('把需求放進本次設計範圍', '你要與面試官確認第一版要交付的功能。請把四張需求單分給對應的負責範圍。', ['郵件團隊實作', '沿用既有登入服務'], [
            ['驗證使用者的登入憑證', '沿用既有登入服務', '本章假設已有身分服務，信箱 API 使用它驗證過的身分。'],
            ['寄送帶附件的信', '郵件團隊實作', '附件和寄送狀態都在郵件服務的範圍內。'],
            ['在自己的信箱全文搜尋', '郵件團隊實作', '郵件團隊須定義索引、查詢與帳戶界線。'],
            ['將一封信標回未讀', '郵件團隊實作', '已讀狀態是信箱資料的一部分。']
        ]),
        nonfunctional: dispatch('用事故驗收非功能需求', '測試團隊提供四種觀察結果。請將每份紀錄交給對應的設計審查。', ['可靠性', '可用性', '擴展性', '可擴充性'], [
            ['服務回覆受理後重啟，工作仍在', '可靠性', '已承諾接手的信件能跨重啟保留。'],
            ['一台入口故障，用戶仍可進入信箱', '可用性', '其他入口繼續回應使用者。'],
            ['流量變成兩倍，新增 Worker 就能追平', '擴展性', '處理量隨投入的資源成長。'],
            ['加入一個新的內容分類器', '可擴充性', '系統允許接入新功能。']
        ]),
        estimate: numbers('重算十億帳戶的容量預算', '採十進位單位。十億人每人每日寄 10 封、收 40 封；每封正文 50 KB，20% 的入站信附有 500 KB 附件。一年 365 天，只算單份入站資料。請填整數，QPS 四捨五入。', [
            ['平均寄件量（封／秒）', 115741, '10 億 × 10 ÷ 86,400，四捨五入為 115,741 封／秒。'],
            ['一年正文（PB）', 730, '10 億 × 40 × 365 × 50 KB，折合 730 PB。'],
            ['一年附件（PB）', 1460, '10 億 × 40 × 365 × 20% × 500 KB，折合 1,460 PB。']
        ]),
        'protocol-roles': dispatch('替四種連線指定協定', '請替郵件工程師設定四段連線。每一段都要符合指定的用戶端行為。', ['SMTP', 'POP3', 'IMAP', 'HTTPS'], [
            ['兩家郵件主機之間交接郵件', 'SMTP', 'SMTP 將一封信交給下一家伺服器。'],
            ['桌面用戶端下載郵件至本機，毋須同步資料夾', 'POP3', 'POP3 提供收信及下載郵件的基本操作。'],
            ['手機和桌面用戶端同步伺服器資料夾與旗標', 'IMAP', 'IMAP 管理伺服器上的信箱狀態。'],
            ['瀏覽器呼叫 Webmail 的 REST 端點', 'HTTPS', 'Webmail 透過 HTTPS 與網站交換資料。']
        ]),
        mx: route('替收件網域挑下一站', '查得 example.net 有兩台 MX，偏好值分別為 5 與 10。第一台連線逾時，第二台可連線。請安排寄件主機的交接紀錄。', [
            ['查詢 example.net 的 MX', '使用收件地址 @ 後的網域取得候選。'],
            ['先連線偏好值 5 的 MX', '數字較小的 MX 優先。'],
            ['逾時後改連偏好值 10 的 MX', '較低順位的候選可接替暫時無法連線的主機。'],
            ['取得 SMTP 成功回覆，記錄交接', '對方已受理，這個收件者可以停止重試。']
        ]),
        mime: numbers('量出 Base64 的傳輸成本', '手上有一個 3 MiB 的二進位附件。每 3 個輸入位元組編成 4 個 Base64 字元，每個字元佔 1 byte。先忽略 MIME 標頭、換行和邊界。', [
            ['編碼後的附件大小（MiB）', 4, '3 MiB × 4 ÷ 3 = 4 MiB。'],
            ['比原附件多出的容量（KiB）', 1024, '4 MiB − 3 MiB = 1 MiB，也就是 1,024 KiB。']
        ]),
        'classic-flow': route('還原 Alice 到 Bob 的交接紀錄', 'Alice 使用 Outlook，Bob 使用另一個供應商的 Gmail。請依照這次跨網域投遞的因果順序排列紀錄。', [
            ['Outlook 客戶端提交給寄件主機', '寄件主機先取得郵件內容及收件地址。'],
            ['寄件主機查詢 Bob 網域的 MX', 'MX 告訴主機要連到哪個郵件交換站。'],
            ['連至 Gmail 的 SMTP 主機交接', '對方接受後接下投遞責任。'],
            ['Gmail 將郵件投遞到 Bob 的信箱', '持久化後 Bob 可以從信箱讀回。']
        ]),
        maildir: route('在 Maildir 安全發布一封新信', '單機程式正在接收一封尚未寫完的信。讀信程式不可看見半封信。請排列檔案的生命週期。', [
            ['在 tmp 建立檔案並寫完內容', '未寫完的資料先留在暫存目錄。'],
            ['將完整檔案原子移到 new', '讀信程式現在才可將它當作一封新信。'],
            ['客戶端處理後移到 cur', '已處理的信放在 cur，狀態可反映在檔名。']
        ]),
        'api-context': dispatch('決定信箱 API 的邊界', '收到三張整合工單。依照呼叫者和操作內容，選擇實際處理請求的介面。', ['Webmail HTTPS API', 'IMAP 端點', 'SMTP 接收端點'], [
            ['已登入網頁要列出自己的資料夾', 'Webmail HTTPS API', 'Web 層驗證工作階段並限制可讀帳戶。'],
            ['桌面客戶端要同步伺服器的未讀旗標', 'IMAP 端點', '原生客戶端可透過 IMAP 同步信箱。'],
            ['另一家供應商正在投遞一封新信', 'SMTP 接收端點', '服務間的郵件交接經過 SMTP。']
        ]),
        'write-and-folders': dispatch('連接網頁寄信與資料夾面板', '前端需要串接寄件與資料夾。選擇每個動作要呼叫的端點，或應保存的資料。', ['POST /v1/messages', 'GET /v1/folders', 'folder.id', '保留在投遞信封，從可見標頭移除'], [
            ['按下寄送以建立寄件工作', 'POST /v1/messages', '建立工作使用 POST；重送可帶相同請求識別碼。'],
            ['載入帳戶可使用的資料夾', 'GET /v1/folders', '資料夾列表回傳 id、name 與所屬帳戶。'],
            ['資料夾改名後仍要認出同一個資料夾', 'folder.id', '穩定識別碼可跨顯示名稱變動使用。'],
            ['處理收件者不該看見的 Bcc 地址', '保留在投遞信封，從可見標頭移除', '每位密件收件者仍須被投遞，其地址對其他收件者隱藏。']
        ]),
        'list-and-detail': route('讓下一頁避開剛插入的新信', 'Inbox 剛顯示最新 50 封；這時又來了 3 封。使用者要繼續讀舊信並開啟其中一封，請安排客戶端請求。', [
            ['保存第一頁末筆的時間與郵件 ID', '時間加上識別碼能穩定界定下一頁起點。'],
            ['帶游標向該資料夾請求下一頁摘要', '新插入的三封不會推動舊的游標邊界。'],
            ['以選中的 message ID 取得單封明細', '直到開信才讀正文、附件資訊與授權引用。']
        ]),
        overview: dispatch('把不同資料寫進適當元件', '一封帶簡報的郵件抵達。為四筆衍生的寫入或更新分配目的地。', ['信箱主資料庫', '物件儲存', '近期信件快取', '全文搜尋索引'], [
            ['郵件歸屬、寄件者與正文的權威記錄', '信箱主資料庫', '信箱資料決定這封信是否存在及屬於誰。'],
            ['18 MB 簡報的實際位元組', '物件儲存', '大物件可獨立傳輸，郵件記錄只保存引用。'],
            ['首頁最近十封信的可重建摘要', '近期信件快取', '快取支援高頻讀取，失效時能回主資料重建。'],
            ['關鍵字對應郵件 ID 的清單', '全文搜尋索引', '反向索引用詞彙尋找候選文件。']
        ]),
        'push-and-store': dispatch('讓離線手機補回新信', '值班員收到四個前端事件。請指定每件事的資料來源或連線。', ['WebSocket', '長輪詢', 'HTTPS 差異同步', '經授權的物件下載'], [
            ['連線正常，需要雙向即時更新', 'WebSocket', '長連線可承載持續的推送。'],
            ['環境不支援 WebSocket，仍要等候更新', '長輪詢', '伺服器可保留請求直到有變更。'],
            ['手機離線五分鐘，重連後漏了兩個通知', 'HTTPS 差異同步', '從最後確認的游標重新查主資料即可補齊。'],
            ['使用者選擇下載信內的大附件', '經授權的物件下載', '先驗證帳戶可讀取該信，再從物件服務傳輸內容。']
        ]),
        'send-flow': route('將傳出佇列接在正確位置', '有效的跨網域寄件請求剛抵達入口。請安排動作，讓外站變慢時，Web 請求仍能安全結束。', [
            ['入口做限流及基本格式檢查', '先擋下可在入口判定的無效工作。'],
            ['把寄件工作和附件引用寫入耐久佇列', '工作已保存，Web 端才能安全回覆受理。'],
            ['SMTP Worker 取件並完成內容檢查', '背景檢查與慢速的外站交接不占住 Web 入口。'],
            ['向收件網域投遞並記錄回覆', '依每位收件者的 SMTP 回覆更新工作狀態。']
        ]),
        'in-domain': dispatch('分流同一封信的三位收件者', '一封通知有三個目的地，請為每位收件者分別建立下一個動作。', ['檢查後本地投遞', '保留工作並退避重試', '停止投遞並回報'], [
            ['同網域、帳戶存在', '檢查後本地投遞', '可直接寫入本地寄件與收件狀態。'],
            ['外站回 451，服務暫時不可用', '保留工作並退避重試', '暫時錯誤只重試受影響的收件者。'],
            ['另一個外站回 550，指出信箱不存在', '停止投遞並回報', '確定永久無效的地址應結案。']
        ]),
        'receive-entry': route('為成功回覆設耐久界線', 'SMTP 入口接到一封有大型附件的信。請安排成功路徑，使入口在任一步驟重啟都不會失去已接手的郵件。', [
            ['確認本機願意接受該收件者', '先依收件政策檢查地址。'],
            ['持久保存附件並取得物件引用', 'Worker 接手時引用的檔案必須存在。'],
            ['將郵件及可用引用寫入耐久佇列', '佇列裡的工作足以在重啟後繼續。'],
            ['向寄件端回覆 SMTP 250', '現在才正式承諾由本機接手。']
        ]),
        'receive-delivery': route('補回手機漏掉的推送', '手機目前離線。接件 Worker 要處理新信，手機稍後重連。請安排這封信最終出現在手機上的步驟。', [
            ['從耐久佇列取得工作，掃描並分類', 'Worker 先完成郵件檢查。'],
            ['將信件寫入信箱並保存變更序號', '主資料與變更紀錄可支撐後續補抓。'],
            ['手機重連，帶上最後已知的序號', '斷線期間錯過的通知不會妨礙補抓。'],
            ['從信箱讀回差異並更新畫面', '手機資料與線上信箱重新一致。']
        ]),
        workload: numbers('估算開啟收件匣的 I/O', '一秒內有 120 人各讀一次最新摘要頁，每頁需要 2 次磁碟 I/O；其中 30 人另外開啟正文，每次再用 1 次 I/O。暫時不計快取。', [
            ['摘要讀取負載（IOPS）', 240, '120 次列表 × 每次 2 個 I/O = 240 IOPS。'],
            ['列表加正文的總負載（IOPS）', 270, '摘要的 240 加上 30 次正文讀取，合計 270 IOPS。']
        ]),
        'choose-storage': dispatch('替三種不同工作負載選儲存', '一個團隊已明確量出下面三種存取模式。請依這些限制挑選儲存。', ['關聯式資料庫', '物件儲存', '寬欄式分散式資料庫'], [
            ['小型管理服務要做跨列交易及多表查詢', '關聯式資料庫', '此處的交易與結構化查詢符合關聯式資料庫的設計。'],
            ['保存大量附件位元組，皆以物件鍵整份下載', '物件儲存', '透過鍵串流大型檔案，無須資料庫逐列查詢。'],
            ['按已知帳戶分區鍵，擴展大量連續信箱列表讀取', '寬欄式分散式資料庫', '可按照已知存取模式設計分區與集群鍵。']
        ]),
        partition: dispatch('組出一筆信箱列表的鍵', '同一使用者可以有多個資料夾，列表預設顯示最新信件。請替範例表 emails_by_folder 配置鍵。', ['分區鍵的一部分', '集群鍵，降冪排序', '一般資料欄位'], [
            ['user_id', '分區鍵的一部分', '帳戶與資料夾一起定位這個列表分區。'],
            ['folder_id', '分區鍵的一部分', '同一帳戶的不同資料夾可個別查詢。'],
            ['email_id（TIMEUUID）', '集群鍵，降冪排序', '同分區內依時間識別碼將最新郵件排在前面。'],
            ['subject', '一般資料欄位', '主旨隨列表回傳，並未用來定位分區。']
        ]),
        'detail-table': route('從信件摘要取得一個獲授權的附件', '已登入的使用者點開本人的郵件，再選擇下載附件。請跟著資料表和授權界線走一次。', [
            ['從列表取得所選的郵件 ID', '列表只需要提供摘要和識別碼。'],
            ['以登入帳戶及郵件 ID 查明細', '先確認郵件歸屬再開放其他內容。'],
            ['讀取該信的附件記錄與物件引用', '附件記錄將檔名和實體物件連起來。'],
            ['授權下載並傳輸物件內容', '物件下載沿用剛剛確認的讀取權限。']
        ]),
        'read-model': dispatch('把一封信從未讀搬到已讀', '信件 M7 目前未讀。你收到一次「標為已讀」事件，稍後相同事件又重送一次。請配置每次操作的目的。', ['設為已讀', '移除 M7', '加入 M7，依鍵覆寫', '沿用同一事件結果'], [
            ['主信箱的 is_read 狀態', '設為已讀', '主資料決定使用者看到的最終狀態。'],
            ['unread_emails 投影', '移除 M7', '未讀列表現在應少這一筆。'],
            ['read_emails 投影', '加入 M7，依鍵覆寫', '同一封信在已讀列表只有一筆。'],
            ['再次收到完全相同的事件 ID', '沿用同一事件結果', '冪等處理可避免計數或列表重複。']
        ]),
        'thread-headers': dispatch('替第三封回信補上標頭', '對話依序是原信 A、回覆 A 的 B，以及新的回信 C。C 正在直接回覆 B。選出 C 的三個標頭值。', ['C', 'B', 'A B'], [
            ['Message-ID', 'C', '每一封新信都有自己的唯一 ID。'],
            ['In-Reply-To', 'B', '這是直接被回覆的父郵件。'],
            ['References', 'A B', '本例的祖先鏈依序包含 A 與 B。']
        ]),
        primary: route('在單一寫入者模型中安全換主', '舊主與仲裁服務失聯，備援落後 12 筆。本演練要求零資料遺失，舊主紀錄稍後能取回。依序操作這次切換。', [
            ['暫停這個信箱的寫入並撤銷舊主資格', '先阻止另一個寫入者處理新要求。'],
            ['補齊並核對落後的 12 筆紀錄', '追到已確認位置後才符合本次零遺失要求。'],
            ['授予備援新的寫入資格', '新的世代權杖能拒絕舊主遲來的寫入。'],
            ['將寫入路由至新主並驗證', '測試新寫入可讀回，且舊主不能再寫。']
        ]),
        reputation: dispatch('讀懂四封投遞回報', '寄件看板將不同層級的訊號混在一起。請替每筆回報指定它真正證明的事。', ['遠端已接手', '已進收件匣', '信譽風險', '永久投遞失敗'], [
            ['送信紀錄只有 SMTP 250', '遠端已接手', 'SMTP 回覆無法單獨證明郵件出現在收件匣。'],
            ['受控測試信箱回報在 Inbox 看見郵件', '已進收件匣', '這項觀測來自收件端的實際分類。'],
            ['同一寄件來源的投訴突然升高', '信譽風險', '應調查收件同意及寄送來源。'],
            ['遠端以 550 拒絕不存在的地址', '永久投遞失敗', '可停止向該地址重送並更新回報。']
        ]),
        feedback: dispatch('將回饋事件投入處理佇列', '某次推播收到三份不同回覆。請讓每份都進入可執行下一步的佇列。', ['軟退信：延遲重試', '硬退信：停止並回報', '投訴：停止相關行銷並調查'], [
            ['收件主機回覆 451，暫時無法處理', '軟退信：延遲重試', '保留工作並使用受限的退避策略。'],
            ['收件主機確認使用者不存在，回覆 550', '硬退信：停止並回報', '這個地址的永久錯誤不會因立即重送而改善。'],
            ['供應商回傳使用者檢舉垃圾信', '投訴：停止相關行銷並調查', '抑制相關寄送並檢查收件同意和來源。']
        ]),
        authentication: dispatch('診斷三封信的 DMARC 對齊', '可見 From 都是 example.com，採嚴格網域對齊。請根據通過驗證的網域判定每封信的 DMARC 結果。', ['通過（SPF 對齊）', '通過（DKIM 對齊）', '失敗（沒有通過且對齊的網域）'], [
            ['SPF 通過 example.com；DKIM 驗證失敗', '通過（SPF 對齊）', '通過 SPF 的信封網域等於可見 From 網域。'],
            ['SPF 通過 relay.net；DKIM 通過 example.com', '通過（DKIM 對齊）', '至少有一個通過的驗證和 From 對齊。'],
            ['SPF 與 DKIM 都通過 relay.net', '失敗（沒有通過且對齊的網域）', '兩個成功結果都屬於不同網域，無法與 From 對齊。']
        ]),
        'search-workload': dispatch('在自己的信箱篩出真正的結果', 'Alice 查詢「報價」，條件是未讀且有附件。請逐筆決定搜尋 API 能否回傳以下文件。', ['列入結果', '排除：帳戶範圍', '排除：已讀狀態', '排除：缺少附件'], [
            ['Alice 的「報價五月版」，未讀、有附件', '列入結果', '帳戶、文字及兩個篩選條件皆符合。'],
            ['Bob 的「報價五月版」，未讀、有附件', '排除：帳戶範圍', '文件即使文字相符，也只可供檔案擁有者查閱。'],
            ['Alice 的「報價說明」，已讀、有附件', '排除：已讀狀態', '目前查詢僅限未讀。'],
            ['Alice 的「報價更新」，未讀、無附件', '排除：缺少附件', '這個結果未通過附件篩選。']
        ]),
        inverted: dispatch('手動建立一份反向索引', '已用空格分好詞。信件 A 是「租約 續約」，B 是「租約 附件」，C 是「發票 附件」。替每個詞寫下完整的郵件 ID 清單。', ['A', 'C', 'A、B', 'B、C'], [
            ['租約', 'A、B', 'A 與 B 都含有租約。'],
            ['續約', 'A', '只有 A 含有續約。'],
            ['附件', 'B、C', 'B 與 C 都含有附件。'],
            ['發票', 'C', '只有 C 含有發票。']
        ]),
        elastic: route('重放一次遺漏的索引更新', '信件已經提交，但 Elasticsearch 暫時離線。請安排從主資料到再次查得到該信的步驟。', [
            ['確認主資料與耐久的變更事件', '信箱已保存信件，變更事件可追蹤。'],
            ['恢復後由消費者讀取事件', '從保存的位置繼續重放。'],
            ['依帳戶、郵件 ID 與版本更新索引', '重放的舊事件不應覆蓋較新的版本。'],
            ['待索引可搜尋後以該帳戶查驗', '確認預期文件出現在可見結果內。']
        ]),
        lsm: route('將三次小寫入整理成磁碟索引', '你在值班時看見許多小型索引更新。請安排 LSM 的正常生命週期，讓寫入先聚合再逐層整理。', [
            ['在記憶體中收集這批索引更新', '多筆小變更先累積在記憶體結構。'],
            ['達到門檻後批次寫成排序檔', '連續寫入磁碟，降低零碎隨機寫入。'],
            ['在後台合併有重疊鍵的排序檔', '合併保留可見版本並整理過期紀錄。'],
            ['觀察背景重寫的 I/O 與空間成本', '整理也會消耗頻寬和暫存空間。']
        ]),
        'search-choice': dispatch('替兩個團隊選搜尋方案與風險', '甲團隊只有三位工程師，希望盡快上線全文搜尋；乙團隊已有儲存引擎專家，工作負載穩定，願意承擔長期維護。請分派架構與驗收工作。', ['採用現成 Elasticsearch', '評估整合式自製索引', '監看消費延遲與重放', '估計合併 I/O 及維護成本'], [
            ['替甲提出第一版引擎', '採用現成 Elasticsearch', '現成引擎能降低初期自行開發成本。'],
            ['替乙提出值得進一步原型測試的方案', '評估整合式自製索引', '有專門人力時，可對固定工作負載細緻調整。'],
            ['驗收甲的非同步索引管線', '監看消費延遲與重放', '主資料和搜尋結果可能在更新期間不同步。'],
            ['驗收乙的分層索引原型', '估計合併 I/O 及維護成本', '自製索引的收益必須能抵付長期工程及磁碟成本。']
        ]),
        regions: dispatch('依複寫狀態替區域入口導流', '主區故障。本演練要求零遺失寫入，允許有標示的落後唯讀資料。請根據各時刻的狀態選擇路由。', ['保留唯讀，暫停寫入', '可升主並開放寫入', '仍須隔離舊主'], [
            ['舊主已隔離，備援還差 15 筆', '保留唯讀，暫停寫入', '先補齊已承諾的 15 筆。'],
            ['備援已追平，但舊主寫入權仍有效', '仍須隔離舊主', '須撤銷舊主資格，避免同時寫入。'],
            ['備援已追平，仲裁確認舊主已隔離', '可升主並開放寫入', '具備切換條件後再驗證路由和讀寫。']
        ]),
        'failure-coverage': dispatch('從故障紀錄找回權威資料', '三個不同元件出現中斷。請選擇每件事故復原時應依靠的來源。', ['耐久寄件佇列', '信箱主資料與變更游標', '可重放的索引事件'], [
            ['SMTP Worker 重啟，先前排隊的郵件還要送', '耐久寄件佇列', '未確認完成的寄件工作可再次取得。'],
            ['WebSocket 關閉，手機漏了新信通知', '信箱主資料與變更游標', '通知遺漏可用持久信箱的狀態補抓。'],
            ['索引服務停機三分鐘，恢復後結果落後', '可重放的索引事件', '以保存的事件進度追趕並核對索引。']
        ]),
        'privacy-security': dispatch('替郵件資料操作選擇控制措施', '隱私與安全審查列出三筆工單。請選出直接處理每筆需求的控制措施。', ['檢查資料放置及跨區政策', '驗證權限並記錄稽核軌跡', '隔離並由郵件安全流程審查'], [
            ['準備將客戶信箱的備份複製至新地區', '檢查資料放置及跨區政策', '先釐清該客戶及資料類型適用的儲存與傳輸限制。'],
            ['支援人員需要短暫讀取一筆客戶資料', '驗證權限並記錄稽核軌跡', '授予處理工單所需的最小權限並留下紀錄。'],
            ['郵件掃描器偵測到疑似釣魚連結', '隔離並由郵件安全流程審查', '依政策檢查可疑內容，再決定分類或放行。']
        ]),
        dedup: numbers('替共用附件核對容量與引用', '相同的 12 MB 附件寄給四位收件者，每個信箱一個引用。系統按內容去重，忽略引用的少量空間。兩人之後各刪除自己的信。', [
            ['去重後物件資料佔用（MB）', 12, '四個信箱共用一份 12 MB 物件。'],
            ['比各存一份節省（MB）', 36, '4 × 12 − 12 = 36 MB。'],
            ['兩人刪除後的有效引用數', 2, '還有兩位使用者可合法讀取，不可刪除物件。']
        ]),
        recap: route('安排一場系統設計說明', '面試只剩最後十幾分鐘。請把四組白板內容排成從確認問題到驗收設計的順序。', [
            ['釐清需求、服務規模及容量假設', '需求與規模決定接下來要解決的問題。'],
            ['畫出 API、寄件和收件的高階路徑', '先建立端到端的共同圖像。'],
            ['深入資料模型、搜尋、送達與跨區取捨', '以具體限制驗證重要元件的設計。'],
            ['總結故障復原、隱私與可驗證的取捨', '以可觀察的結果收束設計。']
        ]),
        exam: dispatch('考前判讀三張值班快照', '作答前，先用三張獨立快照檢查自己能否判讀系統狀態。每一張的證據都只支持一種判讀。', ['交接成功，收件分類待確認', '主資料已提交，索引落後', '備援追平，舊主仍待隔離'], [
            ['遠端有 250 紀錄，沒有收件匣回報', '交接成功，收件分類待確認', '需要收件方訊號才能判斷 Inbox 落點。'],
            ['Inbox 看得到信，索引消費者落後 32 筆', '主資料已提交，索引落後', '搜尋和信箱的可見時間可以不同。'],
            ['跨區複寫差為 0，但舊主寫入權仍有效', '備援追平，舊主仍待隔離', '同時寫入可能造成狀態分岔。']
        ]),
        sandbox: numbers('先預測佇列，再到沙盒調整', '起始積壓 100 封，新信每秒 80 封。兩個 Worker 每個每秒可處理 30 封，外站每秒最多接 90 封。假設這些速率固定。', [
            ['目前每秒真正能投遞幾封', 60, '兩個 Worker 合計每秒 60 封，低於外站上限。'],
            ['10 秒後剩餘多少封', 300, '100 + (80 − 60) × 10 = 300 封。'],
            ['增為三個 Worker 後，每秒最多能投遞幾封（佇列有積壓）', 90, '三個 Worker 與外站上限皆為每秒 90 封。']
        ]),
        operations: route('交接一場尚在恢復的事故', '搜尋索引落後，信箱主資料仍可讀寫，且有可重放事件。你要交班前確認已恢復。請按順序操作並保存驗收紀錄。', [
            ['記錄主資料狀態與消費者最後位置', '先確認信件安全並找出要追趕的範圍。'],
            ['恢復消費者，從已保存的位置重放', '用冪等的事件處理追上新資料。'],
            ['核對落後筆數並抽查新增和刪除結果', '消費延遲及實際可見性都要驗證。'],
            ['將結果、時間與剩餘風險寫入交班紀錄', '下一班可以依紀錄確認事故緩解與後續工作。']
        ])
    };
})();

const emailSessionPracticeCompleted = new Set();

function isEmailScenePracticeComplete(id) {
    return emailSessionPracticeCompleted.has(id) || (readEmailProgress().scenePracticeCompleted || []).includes(id);
}

function mountEmailScenePractice(container, entry, onComplete) {
    const exercise = emailSceneExercises[entry.id];
    const section = document.createElement('section');
    section.className = 'scene-practice';
    section.dataset.scene = entry.id;
    section.dataset.type = exercise.type;
    container.replaceChildren(section);

    function element(tag, parent, text, className) {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        parent.append(node);
        return node;
    }
    function makeButton(parent, label, handler) {
        const button = element('button', parent, label);
        button.type = 'button';
        button.addEventListener('click', handler);
        return button;
    }
    function shuffled(items) {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    element('h2', section, exercise.title);
    element('p', section, exercise.scenario, 'scene-scenario');
    const form = element('form', section);
    const fields = element('fieldset', form);
    const instruction = {
        route: '依序點選動作，組出本次的操作紀錄。',
        dispatch: '替每筆紀錄指定處理方式。',
        number: '填入你的試算結果。'
    };
    element('legend', fields, instruction[exercise.type]);
    const selected = [];
    const controls = [];
    let routeList;
    let routeTools;
    let submitted = false;

    function clearFeedback() {
        submitted = false;
        feedback.replaceChildren();
        delete feedback.dataset.result;
        feedback.hidden = true;
        form.querySelectorAll('.scene-row-feedback').forEach(node => node.remove());
        controls.forEach(input => input.removeAttribute('aria-invalid'));
        updateActions();
    }
    function updateActions() {
        const values = exercise.type === 'route' ? selected : controls.filter(field => field.value.trim() !== '');
        check.disabled = submitted || values.length !== exercise.rows.length;
        reset.disabled = values.length === 0;
    }
    function drawRoute() {
        routeList.replaceChildren();
        routeTools.querySelectorAll('button').forEach(button => {
            button.disabled = selected.includes(Number(button.dataset.actionIndex));
        });
        if (!selected.length) {
            element('li', routeList, '尚未加入動作', 'scene-empty');
        }
        selected.forEach((value, index) => {
            const row = element('li', routeList);
            element('span', row, exercise.rows[value][0]);
            const remove = makeButton(row, '移除', () => {
                selected.splice(index, 1);
                clearFeedback();
                drawRoute();
                routeTools.querySelector('[data-action-index="' + value + '"]').focus();
            });
            remove.setAttribute('aria-label', '移除步驟 ' + (index + 1) + ' ' + exercise.rows[value][0]);
        });
        updateActions();
    }
    if (exercise.type === 'route') {
        routeTools = element('div', fields, undefined, 'scene-tools');
        const order = shuffled(exercise.rows.map((_, i) => i));
        if (order.every((value, i) => value === i)) order.push(order.shift());
        order.forEach(i => {
            const button = makeButton(routeTools, exercise.rows[i][0], () => {
                selected.push(i);
                clearFeedback();
                drawRoute();
                const next = routeTools.querySelector('button:enabled');
                (next || check).focus({ preventScroll: true });
            });
            button.dataset.actionIndex = i;
        });
        element('h3', fields, '我的操作紀錄', 'scene-log-title');
        routeList = element('ol', fields, undefined, 'scene-route');
    } else {
        const assignments = element('div', fields, undefined, 'scene-assign');
        exercise.rows.forEach(([prompt], i) => {
            const row = element('div', assignments, undefined, 'scene-assignment-row');
            const id = 'scene-input-' + entry.id + '-' + i;
            element('label', row, prompt).htmlFor = id;
            const control = element(exercise.type === 'dispatch' ? 'select' : 'input', row);
            control.id = id;
            if (exercise.type === 'dispatch') {
                control.add(new Option('選擇處理方式', ''));
                shuffled(exercise.options).forEach(option => control.add(new Option(option, option)));
            } else {
                control.type = 'number';
                control.min = '0';
                control.step = '1';
                control.inputMode = 'numeric';
            }
            control.addEventListener('input', clearFeedback);
            control.addEventListener('change', clearFeedback);
            controls.push(control);
        });
    }

    const actions = element('div', form, undefined, 'scene-actions');
    const check = element('button', actions, '執行並檢查', 'primary');
    check.type = 'submit';
    check.dataset.sceneCheck = '';
    const reset = makeButton(actions, '重新操作', () => {
        selected.length = 0;
        controls.forEach(input => { input.value = ''; });
        clearFeedback();
        if (routeList) drawRoute();
        (routeTools?.querySelector('button') || controls[0]).focus();
    });
    reset.dataset.sceneReset = '';
    const feedback = element('div', form, undefined, 'scene-result');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.hidden = true;
    const priorPass = element('p', section, '', 'scene-history');
    function updateHistory() {
        priorPass.hidden = !isEmailScenePracticeComplete(entry.id);
        priorPass.textContent = '✓ 已完成本節練習，可再次操作。';
    }
    function rememberPass() {
        emailSessionPracticeCompleted.add(entry.id);
        const completed = new Set([...(readEmailProgress().scenePracticeCompleted || []), ...emailSessionPracticeCompleted]);
        saveEmailProgress({ scenePracticeCompleted: [...completed] });
        updateHistory();
        onComplete?.(entry.id);
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        if (check.disabled) return;
        feedback.replaceChildren();
        feedback.hidden = false;
        let passed;
        if (exercise.type === 'route') {
            const mismatch = selected.findIndex((value, i) => value !== i);
            passed = mismatch === -1;
            if (passed) {
                element('strong', feedback, '操作成功，處理紀錄如下。');
                const trace = element('ol', feedback);
                exercise.rows.forEach(([action, effect]) => element('li', trace, action + '。' + effect));
            } else {
                const completed = mismatch ? '前 ' + mismatch + ' 步已完成。' : '';
                element('strong', feedback, completed + '第 ' + (mismatch + 1) + ' 步需要調整。');
                element('p', feedback, '這時需要「' + exercise.rows[mismatch][0] + '」。' +
                    exercise.rows[mismatch][1] + '可移除步驟，再排一次。');
            }
        } else {
            let correct = 0;
            exercise.rows.forEach(([, expected, why], i) => {
                const control = controls[i];
                const matches = exercise.type === 'number' ? control.valueAsNumber === expected : control.value === expected;
                if (matches) correct++;
                control.setAttribute('aria-invalid', String(!matches));
                element('small', control.parentElement, (matches ? '✓ ' : '需調整　') + why, 'scene-row-feedback');
            });
            passed = correct === exercise.rows.length;
            element('strong', feedback, passed ? '操作成功，全部 ' + correct + ' 筆符合情境。' :
                '已完成 ' + correct + '／' + exercise.rows.length + ' 筆。可參考各列結果後直接修改。');
        }
        feedback.dataset.result = passed ? 'pass' : 'retry';
        submitted = true;
        updateActions();
        if (passed) rememberPass();
    });
    if (routeList) drawRoute();
    updateActions();
    updateHistory();
}
