const emailChapters = [];
function addChapter(id, no, title, scenes) {
    emailChapters.push({ id, no, title, scenes });
}
function scene(id, title, pages, specs, links, steps, exercise = null) {
    const nodes = specs.split(';').map(spec => spec.split('~'));
    return { id, title, pages, nodes, links: links ? links.split(' ') : [], steps, exercise };
}

addChapter('orientation', '序章', '課程導覽', [
    scene('brief', '這堂課要設計什麼？', '269、299', 'writer~寄件者~撰寫與寄送~msg;service~分散式郵件服務~交接、儲存、搜尋~cloud;reader~收件者~讀信與跨裝置同步~user;practice~實驗與測驗~以同一封信驗證設計~gear', 'writer>service service>reader reader>practice', [
        ['writer|service', '想像你寄出一封附有合約的信。按下寄送之後，畫面很快就回應了。可是收件方可能離線，對方的郵件主機可能暫時沒辦法接手，這封信依然得安全送到下一站。'],
        ['service|reader', '我們要設計的是這種支援十億帳號的大型郵件服務。課本用 Gmail、Outlook 和 Yahoo Mail 當例子，用歷史數字交代規模，接下來的容量計算則使用本章明確設定的假設。'],
        ['writer|service|reader', '課程照面試的四個步驟走。先把需求與規模定清楚，再畫出寄信、收信和儲存的高階設計。接著放大看資料模型、送達率、搜尋和跨區容錯，最後把取捨整理成能交代的答案。'],
        ['practice', '每個重點會在舞台上依序展開。右側說明紀錄可以點選，遇到互動實驗就先動手。最後你會用同一套設計處理寄件積壓、索引落後和主區故障，並完成期末考與值班模擬。']
    ])
]);

addChapter('scope', '第 1 章', '第 1 步：釐清需求與粗略估算', [
    scene('requirements', '先問清楚功能和面試範圍', '269–270', 'actor~面試官~規模：10 億個帳號~user;login~既有登入~確認身份，沿用現有服務~lock;send~收發郵件~寄信、收信、附件~msg;folder~信箱資料夾~讀取、標示已讀或未讀~folder;search~搜尋~主旨、寄件者、正文~key;protect~郵件保護~反垃圾郵件與防毒~vpn', 'actor>login actor>send send>folder folder>search send>protect', [
        ['actor|login', '先問有多少使用者，以及客戶端怎麼連進來。面試官給的規模是十億個帳號。身份驗證本來是重要功能，不過本題把登入流程交給既有服務，設計時仍要知道現在代表哪個使用者。'],
        ['send|folder', '使用者要能寄信、收信、列出自己的資料夾和郵件，也要能開一封信。已讀和未讀要可篩選，手機或瀏覽器都應該看到屬於自己的狀態。先把這些操作列出，後面才能倒推資料模型。'],
        ['search|protect', '搜尋可以用主旨、寄件者或正文找信。信箱也要處理附件，並有垃圾郵件分類和惡意內容掃描。這些工作可能耗時，所以後面會看到搜尋、掃描和儲存有各自的執行路徑。'],
        ['login|send', '假設主要客戶端是 Webmail，也就是使用者用瀏覽器連自己的網站。這一段用 HTTP 介面並以 HTTPS 傳輸。郵件離開我們的服務、跨到別家網域時，仍沿用 SMTP。'],
        ['folder|search', '想一想你每天最常做的事，是列出最新郵件、讀單封，還是搜多年以前的附件？它們的頻率和延遲要求不同。把常見操作寫進需求，就不會對每一種操作套用同一個儲存模型。']
    ]),
    scene('nonfunctional', '可靠性、可用性與擴展性', '270、299', 'ack~可靠性~收到成功前要持久化~check;replica~可用性~節點失效仍可服務~db;scale~擴展性~承受帳號、郵件與尖峰增加~server;plugin~可擴充性~新功能可獨立加入~gear;case~故障測試~斷線、遺失、流量變動~warn', 'ack>replica replica>scale scale>plugin plugin>case', [
        ['ack', '可靠性首先是不要遺失已承諾保存的郵件。當系統回覆已接收，資料必須已經落到能在程序或機器重啟後取回的位置。把這個責任點畫在資料流上，比只寫可靠兩個字更具體。'],
        ['replica|case', '可用性要問哪些節點壞掉還能做什麼。多節點複製可以承受部分故障，手機也能在斷線後重抓進度。若主信箱正在切換，允許暫時唯讀或停寫，會比冒著兩邊同時修改更容易修復。'],
        ['scale', '擴展性要拆開看。十億帳號的收件匣大多互相獨立，可以依使用者分片。查詢量、寄件量、附件保存量、全文索引寫入量有不同瓶頸，負載變高的組件應能各自擴容。'],
        ['plugin', '可擴充性表示能加入新的分類、通知或搜尋功能，例如新增一個索引消費者。原生郵件協定能處理收發和讀信，Webmail 自己的介面則可表達更豐富的標籤、篩選或狀態。'],
        ['case', '將四種要求各自對到一個可驗證的情境。斷掉收件程序檢查郵件會不會消失，關一個節點看服務怎麼降級，流量加倍看哪裡排隊，最後試著新增功能看是否得改整條路。']
    ]),
    scene('estimate', '容量試算：QPS、730 PB 與 1,460 PB', '270–271', 'people~帳號基數~1,000,000,000~user;sent~寄件速率~10 封／人／日~msg;inbound~全年入站~40 封／人／日 × 365~queue;body~非附件資料~50 KB／封 → 730 PB／年~db;attachment~附件資料~20% × 500 KB → 1,460 PB／年~card;budget~容量校正~尖峰、副本、索引、保留期~gear', 'people>sent people>inbound inbound>body inbound>attachment body>budget attachment>budget', [
        ['people|sent', '十億個帳號，每人每天平均寄十封，就是每天約一百億次寄件。如果使用八萬六千四百秒除，得到每秒約十一萬五千七百四十一次。書中的面試估算採每天約十萬秒，因此寫約十萬 QPS，兩種是同一量級。'],
        ['inbound|body', '每人每天收到四十封，表示每天四百億封，一年十四點六兆封。書中把主旨、寄件者、內文等非附件資料合併估平均五十千位元組。以十進位單位換算，乘起來就是七百三十 PB。'],
        ['attachment', '有附件的比率是五分之一。四百億封乘上百分之二十，就是每天八十億封帶附件。每個有附件的郵件平均五百千位元組，乘以三百六十五天，得到一千四百六十 PB，約是前面兩倍。'],
        ['budget', '這個數字是原始資料量的粗估。實際要另計資料複本、全文索引、快取、工作佇列、刪除保留與壓縮效果。寄件的平均速率也別直接當成峰值，上線前應用可能的流量尖峰來校正。'],
        ['sent|attachment|budget', '試著把保留時間從一年改成九十天，再把副本數提高到三。你會發現流量不受保留期影響，儲存卻會依期間和副本一起變動。這就能區分要多加寄件 Worker，還是要擴充儲存。']
    ], 'capacity')
]);

addChapter('protocols', '第 2 章', '第 2 步：郵件協定與傳統郵件伺服器', [
    scene('protocol-roles', 'SMTP、POP、IMAP 和 HTTPS 各管哪一段？', '272–274', 'sender~寄件端~提交要寄的訊息~user;relay~SMTP~伺服器間傳遞~server;pop~POP3~下載到本機~phone;imap~IMAP~伺服器信箱和狀態同步~folder;https~HTTPS Webmail~瀏覽器操作信箱~cloud;sync~ActiveSync~供應商的客戶端通訊例子~gear', 'sender>relay relay>pop relay>imap imap>https https>sync', [
        ['sender|relay', 'SMTP 全名是簡單郵件傳輸協定。本機客戶端可以用它向寄件伺服器提交郵件，兩個網域的伺服器也用它交接信件。先分清楚提交和轉送，等會就不會把讀信流程接在寄件閘道上。'],
        ['pop', 'POP 第三版是常見的取信協定。它的典型模式是把內容取回本機，依設定可以刪除或保留伺服器副本。若桌機把唯一副本取走，另一支手機就不會從伺服器看到同一封信。'],
        ['pop|imap', 'POP 典型用法是下載整封郵件，較大的附件也得跟著等。IMAP 的信箱仍以伺服器為準，裝置能先看標頭或摘要，開信時再讀內文或指定部分，也能共用資料夾和已讀狀態。'],
        ['imap|https', 'HTTP 本身是 Web 介面使用的協定。Webmail 一般用 HTTPS 連自己的 Web 服務來列信或寄信，介面可以更貼近網頁功能。跨網站的郵件傳送則仍需要伺服器間的 SMTP。'],
        ['sync', '課本也舉了 Outlook 搭配 ActiveSync 的例子，說明供應商可在 HTTPS 之上提供裝置同步規則。開發產品時先確定要支援哪些客戶端，再決定用傳統協定、網頁介面或其他同步協定。']
    ]),
    scene('mx', 'DNS MX 查詢與優先順序（圖 8.2）', '273、275', 'sender~寄件伺服器~取出 @ 後的收件網域~server;dns~DNS MX 查詢~nslookup：set q=mx~key;main~第 1 個 MX~歷史範例的偏好值 5~cloud;alt~第 2 個 MX~歷史範例的偏好值 10~server;more~其餘候選~20、30、40~queue;retry~延後重試~暫時不可達時保留工作~clock', 'sender>dns dns>main main>alt alt>more more>retry', [
        ['sender|dns', '寄往外站時，先從收件地址取出網域，再向 DNS 查郵件交換紀錄。教材的終端機範例先輸入 nslookup，將查詢類型設成 MX，再輸入收件網域。看到的是可交接郵件的主機及偏好值。'],
        ['dns|main', '圖中的歷史範例列了五個候選，數值分別是五、十、二十、三十和四十。偏好值越小越先試，因此先解析偏好值五的主機並建立 SMTP 連線。這些主機列表是示例，線上 DNS 會隨配置改變。'],
        ['main|alt', '第一台主機若無法連線，就依序試第二台，也就是偏好值十的主機。成功交接後更新該收件者的投遞紀錄。備援主機的目的，是讓第一站出問題時仍有可用的路徑。'],
        ['more|retry', '全部候選都暫時連不上時，把工作留在耐久佇列，排下一次重試。一致性受損或查詢暫時失敗時，要把錯誤分成可重試和永久失敗。這和收件地址已確定無效的處理方式不同。'],
        ['dns|main|alt', '做實驗時觀察兩個問題。主機的偏好值變動會改變連線順序嗎？如果第一台連得上，卻明確回覆地址無效，還應該把同一封信送到所有候選主機嗎？先分清網路和收件人的狀態。']
    ], 'routing'),
    scene('mime', 'MIME、Base64 與附件大小', '273–274', 'body~正文~純文字或 HTML~msg;attachment~二進位附件~相片、PDF、文件~card;encode~Base64~位元組轉成可傳輸文字~gear;mime~MIME 訊息~Content-Type、boundary、各部分~queue;limit~大小限制~帳戶、供應商與接收端規則~lock;receiver~收件端~辨識段落與解碼~user', 'body>mime attachment>encode encode>mime mime>limit limit>receiver', [
        ['body|attachment', '打開郵件時，你可能同時看到純文字、網頁格式和附件。傳輸時需要描述每個部分的種類和分隔方式。MIME 提供這套表示法，讓一封訊息裡可以放文字、圖片或一般檔案。'],
        ['attachment|encode', '二進位附件通常用 Base64 轉成字元序列。每三個原始位元組通常變成四個字元，還要加標頭和可能的換行。容量和限流要分清楚是在算原檔大小，或是在算整封信編碼後的大小。'],
        ['encode|mime|receiver', '例如一封有合約的信可以用外層的 multipart 型別，內層放文字正文和一份 application PDF。收件端依 boundary 找出每段，再看 Content-Type 和傳輸編碼來決定如何呈現。'],
        ['limit', '課本以當時的 Outlook 二十 MB 和 Gmail 二十五 MB 說明服務商會限制大小，也提醒不同帳戶和組織會有自己的規則。設計題把附件最大值當作可配置條件，不把歷史例子寫死成規則。'],
        ['attachment|limit|receiver', '附件若超過限制，寄件入口應在送出前提示。通過限制的檔案仍需掃描，儲存層可以保留大型物件及其權限引用。傳給外站時，再按既定 MIME 結構輸出實際郵件內容。']
    ]),
    scene('classic-flow', '傳統郵件流：Alice 寄給 Bob（圖 8.3）', '274–275', 'alice~Alice 的 Outlook 客戶端~撰寫與提交~user;outlook~Outlook 郵件主機~本地 SMTP 與信箱~server;dns~DNS~查 Bob 網域的 MX~key;gmail~Gmail SMTP 主機~接收外站投遞~server;store~Bob 的信箱儲存~寫入後可讀~db;bob~Bob 的 Gmail 客戶端~透過 IMAP 或 POP 取信~phone', 'alice>outlook outlook>dns outlook>gmail gmail>store store>bob', [
        ['alice|outlook', '第一步，Alice 登入自己的 Outlook 客戶端寫信，按寄送後由客戶端以 SMTP 提交給 Outlook 郵件主機。在這個傳統架構例子中，寄件服務和單機儲存可以放在同一台伺服器附近。'],
        ['outlook|dns', '第二步，Outlook 的寄件主機依 Bob 的地址查收件網域的 MX，找到 Gmail 的收件主機。DNS 在原圖的流程旁邊，用來定位下一站，郵件本身會直接透過 SMTP 對外發送。'],
        ['outlook|gmail', '跨網域的 SMTP 連線建立後，兩邊交換信封與郵件內容。收件主機成功接手後承擔後續保存責任。如果網路連線中斷，寄件端要依有沒有收到成功回覆來判斷如何處理。'],
        ['gmail|store', '第三步，Gmail 的伺服器保存郵件，將它掛到 Bob 可存取的信箱。網域接手信件和信件最後出現在收件匣是不同階段，內容可能還要依照收件方規則被分類或隔離。'],
        ['store|bob', '第四步，Bob 打開客戶端，透過 IMAP 或 POP 取得新信。就算 Alice 早就關掉電腦，只要伺服器各自完成接手，系統仍然能繼續傳遞。今天的大規模架構保留這些協定邊界。']
    ]),
    scene('maildir', 'Maildir 的目錄結構與單機極限（圖 8.4）', '275–276', 'home~home 目錄~各帳號有獨立目錄~folder;users~user1 與 user2~各自擁有 Maildir~user;temp~tmp~先寫暫存檔~queue;fresh~new~完成後移入新信~msg;current~cur~客戶端已處理郵件~folder;disk~單機磁碟~I/O、備份與可用性上限~db', 'home>users users>temp temp>fresh fresh>current current>disk', [
        ['home|users', '在早期架構裡，每封信可以是一個檔案，檔名獨立。每個使用者有自己的目錄和信箱設定。圖中的 home 下有 user 一和 user 二，各自有一份 Maildir，彼此不會混在同一個收件目錄。'],
        ['temp|fresh|current', 'Maildir 有三個主要子目錄。新信首先寫到 tmp。寫完移到 new，避免讀取程序看到只寫到一半的檔案。客戶端處理後，可以把信放到 cur 並記錄狀態。每封信獨立存取也讓操作容易理解。'],
        ['disk', '這種做法對於小量使用者足夠。當帳號和郵件高達數十億級時，列出很多小檔案、做備份和快速搜尋需要大量磁碟輸入輸出。單機也承擔磁碟損毀和整台伺服器故障的風險。'],
        ['users|current', '郵件從早期純文字發展到多媒體、對話串、標籤和全文搜尋。原本協定仍然重要，但可擴充性和讀取方式已改變，單靠原有目錄和服務堆疊，很難滿足新功能與規模。'],
        ['disk|home', '我們留住容易推理的責任邊界，再把信箱資料、附件、索引和快取放到能分片或複寫的組件。不要一開始就拿十億人的架構套在小站上。你可以先用單機，再用容量和故障要求說明升級的時機。']
    ])
]);
