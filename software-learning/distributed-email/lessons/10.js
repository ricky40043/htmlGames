addChapter('api', '第 3 章', '第 2 步：Webmail API 設計', [
    scene('api-context', '哪一層提供哪一種郵件 API？', '276–278', 'native~原生客戶端~SMTP / POP / IMAP~phone;web~網頁客戶端~HTTPS RESTful API~cloud;service~Web 伺服器~身分、權限與分頁~server;remote~外部郵件服務~SMTP 交換~server;mailbox~信箱資料~依帳戶限制讀取~db', 'native>service web>service service>remote service>mailbox', [
        ['native|remote', '教材把郵件 API 分成三個使用時機。原生客戶端可用 SMTP、POP 或 IMAP。兩家郵件伺服器交接時用 SMTP。瀏覽器要做互動式 Webmail 時，用 HTTP 語意的 REST API 管理信箱和寄送。'],
        ['web|service', 'Web API 先驗證登入狀態，再把請求限制在使用者有權讀寫的信箱。查詢裡的 user id 只是資料欄位，伺服器必須依已驗證的身份判斷權限，不能接受客戶端自由指定其他帳號。'],
        ['service|remote', 'API 回應是給瀏覽器看的，投遞流程的結果另有狀態。已受理可以在工作耐久保存後快速回應。外站接手可能要幾秒或更久，接著透過查詢或狀態更新來呈現。'],
        ['mailbox', '下面實際畫出四個端點，涵蓋寄件、列出資料夾、列出資料夾內郵件，以及查看一封信的詳細內容。每個端點要知道它回傳的物件形狀、授權範圍，還有資料大小。']
    ]),
    scene('write-and-folders', '建立郵件與列出資料夾', '277', 'form~撰寫表單~To、Cc、Bcc、subject、body~msg;send~POST /v1/messages~驗證並建立寄件工作~gate;queue~寄件狀態~已受理與各收件者結果~queue;folders~GET /v1/folders~回傳帳號的所有資料夾~folder;schema~回應欄位~id、name、user_id~db', 'form>send send>queue folders>schema', [
        ['form|send', '寄信端點是 POST messages。輸入包括 To 主要收件人、Cc 副本、Bcc 密件副本，以及主旨、正文和附件引用。伺服器檢查地址結構、帳號權限和附件大小，再建立寄件工作。'],
        ['send|queue', '投遞要依每個收件者記錄結果。To 和 Cc 可以出現在收件者能看到的標頭，Bcc 要從複本中妥善移除，不暴露給其他人。當網頁請求重送時，使用相同請求識別碼找回同一個寄件工作。'],
        ['folders', '列出資料夾使用 GET folders。回應會包含資料夾獨立的 id、顯示 name，以及擁有者 user id。即使顯示名稱可以翻譯或修改，內部 id 還是用來定位資料。'],
        ['folders|schema', '教材參照特殊用途信箱規格，舉了 All、Archive、Drafts、Flagged、Junk、Sent 和 Trash。實際產品可以另外提供 Inbox 和使用者自訂資料夾，並用語意標記辨識已寄件或垃圾信，而不是依字面找名稱。'],
        ['schema|queue', '看兩個端點回應粒度。寄信回傳寄件識別碼與階段，資料夾查詢回傳一組小物件。拿到資料夾 id 之後，才用下一個請求去列那個資料夾的郵件。']
    ]),
    scene('list-and-detail', '郵件列表、分頁與單封明細', '277–278', 'folders~資料夾 ID~找到特定信箱區間~folder;list~GET /v1/folders/{id}/messages~摘要列表與下一頁游標~queue;cursor~分頁與檢查點~1–50、51–100、73–87~clock;detail~GET /v1/messages/{id}~單封完整資料~msg;fields~郵件欄位~user_id、from、to、subject、body、is_read~db;attach~附件清單~檔名、大小和經授權引用~card', 'folders>list list>cursor list>detail detail>fields detail>attach', [
        ['folders|list', 'GET folder id messages 回傳資料夾裡的郵件列表。典型列表只帶寄件者、主旨、摘要、已讀狀態和時間，先讓頁面能快速畫出來。每封信仍帶著獨立識別碼，點選時能取得詳情。'],
        ['list|cursor', '課本提到像第一到五十，以及第五十一到一百這類連續頁。如果前面插入新信，單純用偏移量會讓下一頁移位。帶上次最後一封的時間和識別碼當游標，可以從穩定的位置接續。'],
        ['cursor', '教材也要求能跳到例如第七十三到八十七的範圍。要支援指定範圍，可用檢查點或索引縮短走訪距離。設計時要說明要的是隨機跳頁能力，還是更常見的繼續向下捲動。'],
        ['detail|fields', 'GET messages 加郵件 id 會回傳一筆郵件。user id 是帳戶擁有者，from 帶姓名和地址，to 是收件者列表。其他重要欄位是主旨、正文，還有表示是否已讀的布林值。'],
        ['fields|attach', '讀取詳細頁再附上附件清單和經授權的取得方法。小型正文可以跟物件一起回傳，大附件由物件服務傳輸。你可以測試不用下載附件，就能連續列幾頁郵件。']
    ])
]);

addChapter('architecture', '第 4 章', '第 2 步：分散式高階架構設計', [
    scene('overview', '高階架構總覽（圖 8.5）', '278–280', 'web~Webmail~HTTPS 操作與 WebSocket 更新~phone;api~Web 伺服器~請求與回應、寄送讀取~server;rt~即時伺服器~長連線與新信推送~coord;meta~郵件資料庫~主旨、正文、寄收件者~db;obj~附件物件儲存~S3 類物件服務~card;cache~分散式快取~最新與近期郵件~cache;index~搜尋儲存~全文反向索引~key', 'web>api web>rt api>meta api>cache meta>obj meta>index meta>rt', [
        ['web|api|rt', '圖八點五先把瀏覽器畫在最前面。送出郵件、列資料夾和讀信往 Web 伺服器，新的郵件變更可以由獨立即時伺服器推給正在連線的客戶端。兩種連線的負責範圍清楚分開。'],
        ['api|meta', 'Web 伺服器對外提供請求和回應，還可以接登入、註冊及個人檔案。對本章而言，所有信箱 API 都從它進入，實際郵件資料由下游資料庫以帳號和郵件識別碼保存。'],
        ['meta|obj', '郵件資料庫保存主旨、正文、寄件和收件者等資料。大附件從這條讀寫路徑分開，實體內容存物件服務。信箱記錄保存引用和授權資訊，打開列表時不必把每份附件搬進來。'],
        ['cache|index', '分散式快取加快頻繁查看的近期郵件。搜尋儲存則是另一份衍生資料，用反向索引回答關鍵字查詢。這兩份資料需要能重建，儲存層的主資料仍決定信箱真實狀態。'],
        ['api|rt|meta', '傳統郵件伺服器常以單機來設計。跨機同步、故障切換和大流量投遞都會比較麻煩。把 Web、即時層、SMTP 和儲存各自分開後，可以分別量測與擴容。']
    ]),
    scene('push-and-store', '連線推送、附件、快取與索引', '279–280', 'ws~WebSocket 長連線~有狀態，即時更新~coord;poll~長輪詢~連線不便時的備援~clock;jmap~Apache James / JMAP~郵件同步的實例~server;object~Amazon S3 之類~大型附件與串流~card;wide~Cassandra~blob 的理論與實務差距~db;redis~Redis~近期列表與快取~cache;search~索引服務~文字到候選文件~key', 'ws>poll ws>jmap object>wide wide>redis redis>search', [
        ['ws|poll', '即時伺服器有狀態，因為得記住現在哪個使用者的連線在哪裡。可用 WebSocket 保持雙向連線，也可用長輪詢當作連線環境不支援時的備援。無論用哪一種，掉線後都要能補抓。'],
        ['jmap', '教材舉 Apache James 為例，說明 JMAP 也可以有 WebSocket 的子協定。它是一個真實的郵件應用例子，主要用來理解在長連線上傳送應用層郵件請求與變更。'],
        ['object|wide', '大型附件適合 S3 類物件儲存。書中用 Cassandra 的歷史規格做對照，理論 blob 上限和實務可接受大小有很大差距。讀寫大型列還會擠壓記憶體，讓常讀資料難以有效快取。'],
        ['redis', '最近的信才是高頻讀取路徑。Redis 的列表等資料結構可用來維護近期摘要，不需要將正文和每份附件都留在記憶體。快取失效時，能從信箱主資料補回來才有安全的降級路徑。'],
        ['search|object', '全文搜尋採反向索引。收到關鍵字後，先查哪些文件有詞，再依帳號、時間或已讀狀態過濾。附件儲存、熱資料快取和全文索引各對應一種工作，後面再拆它們如何跟主資料同步。']
    ])
]);
