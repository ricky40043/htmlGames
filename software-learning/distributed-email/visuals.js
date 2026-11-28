'use strict';

const emailVisuals = {
    brief: { title: '圖 8.1｜大型電子郵件供應商與教材歷史數字', columns: ['服務', '本章用途', '書中引述的歷史規模'], rows: [
        ['Gmail', '大型 Webmail、郵件同步、搜尋', '逾 18 億活躍使用者（教材舉 2020 年例）'],
        ['Outlook.com', '大型郵件服務、裝置同步', '逾 4 億使用者（教材歷史數字）'],
        ['Yahoo Mail', '大型雲端郵件服務', '圖 8.1 的第三個服務例子']
    ], rowKeys: ['service', 'service', 'service'] },
    estimate: { title: '容量計算｜十進位單位', columns: ['路徑', '估算過程', '結果'], rows: [
        ['寄件 QPS', '10 億 × 10 ÷ 86,400 秒', '115,741／秒'],
        ['年度非附件資料', '10 億 × 40 × 365 × 50 KB', '730 PB'],
        ['年度附件', '10 億 × 40 × 365 × 20% × 500 KB', '1,460 PB']
    ], rowKeys: ['sent', 'body', 'attachment'] },
    mx: { title: '圖 8.2｜以教學網域重現查詢結果', code: [
        '$ nslookup -type=mx example.net', 'example.net  MX   5 mx1.example.net.',
        'example.net  MX  10 mx2.example.net.', 'example.net  MX  20 mx3.example.net.',
        'example.net  MX  30 mx4.example.net.', 'example.net  MX  40 mx5.example.net.'
    ], lineKeys: ['dns', 'main', 'alt', 'more', 'more', 'more'] },
    mime: { title: 'MIME 郵件結構', code: [
        'Content-Type: multipart/mixed; boundary="mail-part"', '--mail-part',
        'Content-Type: text/plain; charset=UTF-8', '附上本期合約，請查收。', '--mail-part',
        'Content-Type: application/pdf', 'Content-Transfer-Encoding: base64', '--mail-part--'
    ], lineKeys: ['mime', 'mime', 'body', 'body', 'mime', 'attachment', 'encode', 'receiver'] },
    maildir: { title: '圖 8.4｜每個帳號保有自己的 Maildir', code: [
        '/home/', '  user1/Maildir/{tmp,new,cur}', '  user2/Maildir/{tmp,new,cur}',
        'tmp → new → cur', '每封郵件對應一個獨立檔名'
    ], lineKeys: ['home', 'users', 'users', 'fresh', 'disk'] },
    'write-and-folders': { title: 'Webmail 寄件與資料夾端點', code: [
        'POST /v1/messages   { to, cc, bcc, subject, body, attachments }',
        'GET /v1/folders    [{ id, name, user_id }, …]',
        '特殊用途：All、Archive、Drafts、Flagged、Junk、Sent、Trash'
    ], lineKeys: ['send', 'folders', 'schema'] },
    'list-and-detail': { title: '列表、翻頁與郵件明細', code: [
        'GET /v1/folders/{folder_id}/messages?limit=50&cursor=…',
        'GET /v1/messages/{message_id}',
        '{ user_id, from: { name, email }, to: [{ name, email }],',
        '  subject, body, is_read, attachments: [{ name, size, url }] }'
    ], lineKeys: ['list', 'detail', 'fields', 'attach'] },
    'choose-storage': { title: '選型比較｜詮釋資料與附件', columns: ['選項', '適合', '要額外處理'], rows: [
        ['關聯式資料庫', '欄位索引、交易', '大量大列、全文索引及切分'],
        ['物件儲存', '原始郵件、大檔與備份', '已讀查詢、對話串、授權'],
        ['寬欄 NoSQL', '按查詢建模、分區', '多投影寫入、索引與修復'],
        ['自製鍵值儲存', '特化 IOPS 與容量', '工程及營運成本']
    ], rowKeys: ['sql', 'object', 'wide', 'custom'] },
    partition: { title: '表 8.1–8.2｜查資料夾與列表', columns: ['表', '分區鍵', '集群鍵／資料'], rows: [
        ['folders_by_user', 'user_id', 'folder_id、folder_name'],
        ['emails_by_folder', '(user_id, folder_id)', 'email_id TIMEUUID DESC'],
        ['列表摘要', '沿同一分區讀取', 'from、subject、preview、is_read']
    ], rowKeys: ['folders', 'list', 'row'] },
    'detail-table': { title: '表 8.3｜郵件內容與附件', columns: ['表', '取用鍵', '內容'], rows: [
        ['emails_by_user', 'user_id + email_id', 'from、to、subject、body、attachments'],
        ['attachments', 'email_id + filename', 'url（取得時驗證權限）']
    ], rowKeys: ['details', 'entries'] },
    'read-model': { title: '表 8.4｜已讀與未讀的讀取投影', code: [
        'SELECT * FROM unread_emails',
        'WHERE user_id = ? AND folder_id = ?',
        'ORDER BY email_id DESC;',
        'mark-as-read: 更新主資料 → 移除 unread 投影 → 寫入 read 投影'
    ], lineKeys: ['unread', 'list', 'read', 'update'] },
    'thread-headers': { title: '表 8.5｜回覆 C 的標頭示例', code: [
        'Message-ID: <c@example.net>', 'In-Reply-To: <b@example.net>',
        'References: <a@example.net> <b@example.net>'
    ], lineKeys: ['c', 'b', 'refs'] },
    authentication: { title: '圖 8.9｜去識別化的驗證標頭示例', code: [
        'From: alerts@bank.example',
        'SPF: PASS  smtp.mailfrom=bank.example',
        'DKIM: PASS header.d=bank.example',
        'DMARC: PASS header.from=bank.example'
    ], lineKeys: ['visible', 'spf', 'dkim', 'dmarc'] },
    'search-workload': { title: '表 8.6｜把兩種搜尋的需求分開', columns: ['比較', '一般網路搜尋', '郵件搜尋'], rows: [
        ['範圍', '公開網頁', '有權存取的信箱'],
        ['排序', '常依相符程度', '時間、未讀、附件等'],
        ['新鮮度', '依爬取與索引進度', '接近即時且驗證可見性']
    ], rowKeys: ['scope', 'sort', 'fresh'] },
    lsm: { title: '圖 8.11｜LSM 合併路徑', columns: ['層', '資料', '動作'], rows: [
        ['L0', '記憶體累積', '達門檻後整理及落盤'],
        ['L1', '排序磁碟檔', '讀取與接收新批次'],
        ['L2–L4', '更大的排序檔', '依門檻往下層合併']
    ], rowKeys: ['l0', 'l1', 'layers'] },
    'search-choice': { title: '表 8.7｜兩種搜尋方案', columns: ['比較', 'Elasticsearch', '自製或儲存原生搜尋'], rows: [
        ['開發維護', '快速整合，營運兩套服務', '工程成本高，可針對郵件最佳化'],
        ['一致性', '獨立索引需持續同步', '共用主資料或原生更新流程'],
        ['復原', '依主儲存重建索引', '依主儲存耐久性與復原設計']
    ], rowKeys: ['effort', 'consistency', 'loss'] }
};

const emailReferences = [
    ['Gmail 歷史活躍使用者統計', 'https://financesonline.com/number-of-active-gmail-users/'],
    ['Outlook.com 歷史背景', 'https://en.wikipedia.org/wiki/Outlook.com'],
    ['全球郵件量估算的歷史背景', 'https://review42.com/resources/how-many-emails-are-sent-per-day/'],
    ['POP3 規格', 'https://www.rfc-editor.org/rfc/rfc1939'],
    ['ActiveSync 文件', 'https://learn.microsoft.com/exchange/clients/exchange-activesync/exchange-activesync'],
    ['郵件附件介紹', 'https://en.wikipedia.org/wiki/Email_attachment'],
    ['MIME 格式', 'https://www.rfc-editor.org/rfc/rfc2045'],
    ['郵件對話串介紹', 'https://en.wikipedia.org/wiki/Conversation_threading'],
    ['IMAP 特殊用途信箱', 'https://www.rfc-editor.org/rfc/rfc6154'],
    ['Apache James 郵件伺服器', 'https://james.apache.org/'],
    ['JMAP over WebSocket', 'https://www.rfc-editor.org/rfc/rfc8887'],
    ['Cassandra 資料型別與限制', 'https://cassandra.apache.org/doc/latest/cassandra/developing/cql/types.html'],
    ['反向索引', 'https://en.wikipedia.org/wiki/Inverted_index'],
    ['指數退避', 'https://en.wikipedia.org/wiki/Exponential_backoff'],
    ['QQ 郵箱效能研究', 'https://www.slideshare.net/areyouok/06-99-5431919'],
    ['磁碟 IOPS', 'https://en.wikipedia.org/wiki/IOPS'],
    ['Cassandra UUID 與 TIMEUUID', 'https://cassandra.apache.org/doc/latest/cassandra/developing/cql/types.html'],
    ['JWZ 對話串演算法', 'https://www.jwz.org/doc/threading.html'],
    ['全球垃圾郵件量歷史統計', 'https://www.statista.com/statistics/420391/spam-email-traffic-share/'],
    ['AWS SES 專用 IP 的信譽管理', 'https://docs.aws.amazon.com/ses/latest/dg/dedicated-ip-warming.html'],
    ['Verizon 資料外洩調查', 'https://www.verizon.com/business/resources/reports/dbir/'],
    ['SPF', 'https://www.rfc-editor.org/rfc/rfc7208'],
    ['DKIM', 'https://www.rfc-editor.org/rfc/rfc6376'],
    ['DMARC', 'https://dmarc.org/'],
    ['搜尋引擎系統排名的歷史來源', 'https://db-engines.com/en/ranking/search+engine'],
    ['LSM 日誌結構合併樹', 'https://github.com/facebook/rocksdb/wiki/Compaction'],
    ['Microsoft Exchange 的搜尋演講', 'https://www.youtube.com/watch?v=5EXGCSzzQak&t=2173s'],
    ['GDPR 歐盟條文', 'https://eur-lex.europa.eu/eli/reg/2016/679/oj'],
    ['依法調取與攔截技術概念', 'https://en.wikipedia.org/wiki/Lawful_interception'],
    ['Gmail 郵件安全', 'https://safety.google/gmail/']
];

const emailSourceDetails = {
    requirements: ['面試時間約 45 分鐘。先用澄清問題縮小需求範圍，再留時間給高階設計及重點深入。'],
    maildir: ['郵件功能從 1960 年代的早期純文字發展到多媒體、標籤、對話串與全文搜尋。'],
    'push-and-store': ['教材引述的 Cassandra 歷史例子：blob 理論大小約 2 GB，實務建議比規格上限低得多，該引文提及約 1 MB。設計依實際版本、讀寫成本和容量測試。'],
    workload: ['教材引用 QQ 郵箱的效能研究，82% 讀取針對 16 天以內的郵件。'],
    reputation: ['教材引述的研究把全球垃圾郵件比例用約一半作為歷史背景。教材亦引用 AWS 當時提供的新 IP 信譽養成時間約 2–6 週。'],
    lsm: ['大規模郵件每天累積 PB 級資料，單一帳戶可能已有 50 萬封以上。合併門檻依儲存引擎工作負載設定。']
};
