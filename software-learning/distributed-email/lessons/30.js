addChapter('storage', '第 6 章', '第 3 步・深入①：詮釋資料、資料模型與一致性', [
    scene('workload', '郵件資料的存取形狀與 IOPS', '284–286', 'header~標頭與摘要~小、讀取頻率高~msg;body~正文~大小不一，通常只讀幾次~card;user~單一使用者~大部分操作不跨信箱~user;recent~近期郵件~存取集中在新資料~clock;disk~磁碟 IOPS~每秒輸入輸出操作數~db;recovery~可靠性要求~複本、可用性與增量備份~check', 'header>body header>recent user>recent recent>disk disk>recovery', [
        ['header|body', '看收件匣時，每一列只顯示寄件者、標題和預覽。這些欄位小而常讀。郵件的正文大小能差很多，通常只在打開郵件時才讀，不必每次刷新列表都把正文一起帶回。'],
        ['user|recent', '列郵件、標為已讀和搜尋通常都發生在同一個帳戶。課本引用一個郵箱研究，八成以上的讀取落在最近十六天，說明舊資料使用率會降低。這是工作負載研究的結果，不能當作每家公司的固定比例。'],
        ['recent|disk', '當每次請求都要讀寫很多零碎區塊，磁碟每秒輸入輸出操作數會限制吞吐。可以測量同一秒查詢需要觸碰幾頁，以及新舊資料的流量分布，再判斷快取和分層的實際收益。'],
        ['disk|recovery', '資料庫要能承受較大的欄位、保持需要的一致性、盡量減少磁碟輸入輸出，還要支援高可用、容錯和容易驗證的增量備份。只看單次查詢速度，會漏掉恢復和備份這兩個營運成本。'],
        ['header|user|recent', '想像一個長期用戶累積五十萬封信。大部分時候他只開最近幾封；若需要找三年前的帳單，搜尋索引應能定位資料。資料模型先反映這些操作，才決定拆成哪些讀取表。']
    ]),
    scene('choose-storage', '關聯式、物件儲存和 NoSQL 的權衡', '285–286', 'sql~MySQL / PostgreSQL~索引、查詢、交易~db;object~物件儲存~整封原始郵件、附件或備份~cloud;wide~Bigtable / Cassandra~用分區鍵定位資料~server;custom~自製鍵值儲存~可針對規模與 IOPS 最佳化~gear;features~驗收條件~一致性、可用性、備份與低 I/O~check', 'sql>features object>features wide>features custom>features', [
        ['sql', '關聯式資料庫可以對欄位做索引，也有成熟的交易語意。小型服務適合從它起步。若把大量又大的 HTML 或二進位內容都塞進列，再試著以未結構化內容查詢，磁碟和索引成本會上升。'],
        ['object', '整封原始郵件可保存在分散式物件儲存，適合大檔、備份和長期保留。若直接靠物件清單做查詢，已讀篩選、正文搜尋和重建對話串都要額外索引或讀取大量物件。'],
        ['wide', 'NoSQL 寬欄資料庫適合依查詢樣式建模。書中把 Gmail 使用 Bigtable 的公開例子與 Cassandra 候選放在一起討論。公開資料沒有說明所有搜尋細節，所以我們把它當作設計選項，而不是完整實作藍圖。'],
        ['custom|features', '極大規模可考慮依郵件工作負載自製鍵值儲存或和搜尋整合。那需要承擔更多開發與維運成本。面試通常不用現場造整個資料庫，先說清一致性、I/O、高可用及備份的約束比較實用。'],
        ['sql|wide|object', '我們的做法是用能分片的主資料庫管郵件記錄，把大物件分開，再維護快取和搜尋。你可以換成關聯式或寬欄技術，但需要說明同一組查詢如何被穩定地支援。']
    ]),
    scene('partition', '分區鍵、集群鍵與資料夾（表 8.1、8.2）', '286–287', 'user~user_id~帳戶範圍與分片鍵~user;folders~folders_by_user~PK user_id、CK folder_id~folder;list~emails_by_folder~PK (user_id, folder_id)~db;rank~email_id TIMEUUID~集群鍵降冪~clock;row~列表欄位~from、subject、preview、is_read~msg;hot~分區治理~熱門信箱或時間桶~gear', 'user>folders user>list list>rank rank>row list>hot', [
        ['user|folders', '表八點一的 folders by user 用 user id 做分區鍵，同一個人的資料夾存到同一分區。資料夾有 folder id 和 folder name。這讓取得某使用者所有資料夾變成指向單一分區的讀取。'],
        ['user|list', '表八點二的 emails by folder 用 user id 和 folder id 組成複合分區鍵。兩個人可能都叫收件匣，但帳戶和資料夾識別碼一起定位，資料就能各自放到對應的位置。'],
        ['list|rank', '分區鍵決定資料存到哪裡。集群鍵決定同一分區裡資料怎麼排序。教材使用帶時間資訊的 TIMEUUID 作為 email id，按降冪讓最新郵件排前面，又能用識別碼區分同時建立的多封信。'],
        ['rank|row', '列表保留寄件者、主旨、預覽與已讀布林值。讀取頁面時先依使用者和資料夾縮小範圍，再沿時間倒序走訪，不用先讀正文和附件，也不用回傳大量無關記錄。'],
        ['list|hot', '某個信箱若持續累積超多郵件，單一分區可能變熱或變大。補充做法是依時間加一層分桶，從最新桶往前查。這會增加跨桶分頁複雜度，適合確實遇到分區上限時再用。']
    ]),
    scene('detail-table', '正文與附件的明細表（表 8.3）', '287–288', 'list~emails_by_folder~讀取信箱摘要~folder;lookup~使用者＋郵件 ID~定位單封郵件，先驗證範圍~key;details~emails_by_user~from、to、subject、body~db;entries~attachments 表~email_id、filename、url~card;object~物件內容~每個附件的資料、大小與授權~cloud', 'list>lookup lookup>details details>entries entries>object', [
        ['list|lookup', '點進詳細頁時，先知道這封信屬於哪個帳戶。教材從 email id 的查詢意圖介紹，若採以 user id 為分區的寬欄資料庫，實作查詢必須把 user id 一起帶上，也要檢查登入者的存取範圍。'],
        ['lookup|details', 'emails by user 的鍵包含使用者與郵件識別碼。明細包含寄件者、收件者列表、主旨和正文，也可以記錄附件清單，像每項檔案的名稱和大小。這和資料夾的輕量列表是兩種讀取資料形狀。'],
        ['details|entries', '附件表可以依 email id 找到一封信的各份附件，再以 filename 辨識其中一項，記下用於儲存的參照。實務補強是給同名附件不同 id，下載網址也應受時間和權限限制。'],
        ['entries|object', '讀取附件時先檢查該使用者對這封郵件的權限，再從物件儲存取內容。需要空間最佳化時，郵件記錄可指向共用大型物件，但授權仍以各信箱的引用判定。'],
        ['details|list', '除了讀單封，這個設計也要支援建立和刪除。建立後更新列表投影，刪除時記錄信箱狀態並發事件給快取和索引。明細的寫入結果應可用來核對和修復衍生資料。']
    ]),
    scene('read-model', '已讀與未讀投影（表 8.4）', '288–289', 'list~emails_by_folder~一般列表及 is_read 欄位~folder;scan~直接過濾~關聯式索引或掃描取捨~key;unread~unread_emails~相同分區鍵，時間降冪~msg;read~read_emails~支援已讀列表~check;update~標為已讀~移出未讀投影並加入已讀~gear;repair~投影修復~冪等、版本、核對或重建~db', 'list>scan list>unread list>read unread>update update>read update>repair', [
        ['list|scan', '課本先比較關聯式查詢。用使用者和資料夾限制範圍，加上 is read 等於 true 或 false，再依時間排序。如果相關欄位有適當索引，資料庫可以直接支援這個查詢。'],
        ['scan|unread', '在某些依分區鍵和集群鍵讀取的寬欄資料庫裡，is read 只是普通欄位。把整個資料夾搬到應用程式做篩選會造成大量讀取。另一個做法是預先維護已讀和未讀兩個投影。'],
        ['unread|read', '表八點四的兩張表使用相同帳戶與資料夾分區，以及降冪的 email id。未讀表可以直接列出某信箱最近未讀。已讀表則對應已讀操作，兩張表都保存顯示列表需要的摘要。'],
        ['unread|update|read', '當信被標成已讀，要更新主資料，從未讀表移除同一筆，再放進已讀表。若中途故障，可能看到兩邊同時有或都沒有，因此需要版本和可重放的更新，讓投影最後收斂。'],
        ['update|repair', '去正規化讓讀取更直接，寫入卻會多出工作。設計時要說清真實狀態在哪裡，重試時如何避免舊事件覆蓋新事件，以及如何從主資料重建投影。它是一個用寫入成本換查詢表現的明確取捨。']
    ]),
    scene('thread-headers', '三個郵件標頭與回覆關係（表 8.5）', '289–290', 'a~原信 A~Message-ID = A~msg;b~回覆 B~In-Reply-To = A~msg;c~回覆 C~In-Reply-To = B~msg;refs~References~記錄對話相關識別碼~key;tree~對話串~由根節點和回覆重建~folder;missing~缺少父郵件~先保留關係，資料到達再補~queue', 'a>b b>c c>refs refs>tree tree>missing', [
        ['a|b', '本節的加分題是取回整串對話。表八點五列出三個常見標頭。Message ID 是郵件本身的識別碼，寄件端建立。當 B 回覆 A，B 有自己的識別碼，並在 In Reply To 裡指向 A。'],
        ['b|c|refs', 'C 回覆 B 時，In Reply To 可以直接指向 B。References 則可保存相關的祖先識別碼，例如 A 和 B。這讓應用程式在信件順序不同、或只先取得一部分時，也能知道可能的上下文。'],
        ['refs|tree', '教材提到 JWZ 的對話串演算法。這裡先理解其中的核心做法：用郵件識別碼建立容器，按回覆關係把節點接起來，再整理多餘或暫時沒有內容的容器，最後呈現對話樹。'],
        ['missing|tree', '假設 C 比 B 先同步到本機，可以先針對 B 建暫時節點，再把 C 掛在下面。等 B 之後到達，填內容即可。僅用主旨來分組會誤把不同的定期通知放在同一串，所以只能當保守輔助。'],
        ['a|c|tree', '是否共享同一封原始信件和是否把它們顯示成對話是兩件事。每個信箱可有自己的已讀標籤和刪除狀態，對話展示要依目前使用者能存取的郵件來建立。']
    ]),
    scene('primary', '一個信箱一個主節點', '290、297', 'writer~信箱寫入~寄件、移動、已讀和刪除~user;primary~主信箱~同一時間只有一位寫入者~server;copy~副本~故障時可恢復或提供讀取~db;partition~網路分區~讀寫能力與新鮮度取捨~warn;fence~舊主隔離~撤回寫入資格~lock;resume~安全恢復~追平、選主、重新接寫~check', 'writer>primary primary>copy copy>partition partition>fence fence>resume', [
        ['writer|primary', '分散式資料庫通常用複本提高可用性。教材強調同一個信箱只保留一個主節點管理寫入。這樣像先標已讀再刪除、或同時在兩台裝置移動資料夾，都有明確的順序。'],
        ['primary|copy', '主節點把資料複寫到副本。不同寫入可能要求不同的確認層級。若承諾在整區故障時也保住已確認寫入，就要解釋當時落在哪些位置，以及複寫落後時如何保護這個承諾。'],
        ['copy|partition', '切換期間，教材的設計讓信箱存取或更新暫停，優先保住一致性。實務如果產品允許，已同步的備援可以有限度讀取並標示延遲；這仍需要針對使用者看得到的能力清楚定義。'],
        ['partition|fence', '不能只看到備援在線就升主。如果舊主只是暫時連不到控制系統，還有可能繼續接受寫入。應透過租約或寫入世代之類的規則撤銷舊主資格，確保儲存層真的會拒絕舊主。'],
        ['fence|resume', '安全切換先核對資料進度和寫入資格，再恢復寫入。舊主回來時先追資料並遵循新角色。後面實驗會讓你分別調整複寫落後和舊主是否已隔離，看到少一個條件時為何要暫停。']
    ])
]);
