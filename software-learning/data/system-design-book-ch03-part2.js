(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_03;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
chapter.sections.push(
{
 id:'sd3-s04',order:4,title:'Step 2：High-Level Design 先取得共識，再往下鑽',duration:'30–42 分鐘',summary:'學會畫出足夠簡潔但能承載核心 flow 的 HLD，並用 estimation 與 feedback 驗證第一版 blueprint。',
 research:[{label:'ByteByteGo — Step 2 Propose high-level design and get buy-in',url:'https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews'}],
 pages:[
  {id:'sd3-s04-p01',title:'HLD 的目的不是畫滿，而是建立共同語言',blocks:[
   {type:'lead',text:'High-Level Design 要讓你和面試官對「核心 flow、主要 state、關鍵 boundaries」有共同理解。沒有共識就直接 Deep Dive，後面很容易發現你們其實在解不同問題。'},
   {type:'diagram',nodes:[['Client','Web / Mobile'],['Entry','LB / API Gateway'],['Core Service','主要商業 flow'],['Data Store','source of truth'],['Async / Cache','需求驅動才加入']],caption:'先畫最小足夠架構。每多一個 box，都應能說出它解決哪個 requirement 或 bottleneck。'},
   {type:'callout',title:'Get buy-in',text:'畫完第一版後可以直接問：「這個 HLD 是否符合我們剛剛鎖定的 scope？如果可以，我接著深入 X 與 Y。」這是在管理面試流程，不是沒自信。'}
  ]},
  {id:'sd3-s04-p02',title:'先畫核心資料流，再補元件名稱',blocks:[
   {type:'stepper',steps:[['Write flow','資料從哪裡進來？誰驗證？誰持久化？'],['Read flow','主要讀取如何取得資料？是否需要低延遲 cache？'],['Async flow','哪些工作可以排隊，避免阻塞同步路徑？'],['Failure boundary','哪個元件失敗會把整條 critical path 打斷？'],['Scale boundary','哪一層會先需要獨立 scale？']]},
   {type:'p',text:'如果你先從 flow 開始，元件會比較自然。例如「上傳影片後轉碼不必同步完成」才會推導 Queue + Worker，而不是因為題目很大所以自動加 Queue。'}
  ]},
  {id:'sd3-s04-p03',title:'用 Estimation 驗證 HLD，而不是另開一場數學考試',blocks:[
   {type:'compare',items:[['好估算','Peak read 80k QPS → 單 DB read path 不夠；需要 cache/read replicas。'],['差估算','花 8 分鐘算每個 header 幾 bytes，卻不影響任何架構決策。']]},
   {type:'p',text:'HLD 與估算應互相驗證：先有初步架構，再用 QPS/storage/bandwidth 找出最可疑的地方；或先有明顯量級，再決定需要 CDN/sharding/queue。'},
   {type:'callout',title:'先說目的再算',text:'「我想先估 egress，因為這題是 video-heavy，這會決定 CDN 是否是核心元件。」這句比直接埋頭算數字更能讓面試官看到判斷。'}
  ]}],
 quiz:[
  {id:'sd3-s04-q1',question:'HLD 階段最重要的成果？',reviewPageId:'sd3-s04-p01',explanation:'與面試官對核心 flow、主要元件與 scope 建立共識。',options:[O('a','把所有可能技術畫滿',false,'HLD 不是技術展示牆。'),O('b','建立核心架構共識',true),O('c','完成所有 class diagram',false,'過早進入低層細節。'),O('d','決定每台 server CPU 型號',false,'通常不是此階段重點。')]},
  {id:'sd3-s04-q2',question:'為什麼先走 Write/Read flow 再補元件較好？',reviewPageId:'sd3-s04-p02',explanation:'元件會由實際資料流與 requirement 推導，降低 over-engineering。',options:[O('a','可讓元件選擇更貼近實際需求',true),O('b','因為所有系統都只有兩個 flow',false,'只是常用起點。'),O('c','這樣不用 Data Store',false,'無此因果。'),O('d','可以跳過 requirements',false,'HLD 仍建立在 requirements 上。')]},
  {id:'sd3-s04-q3',question:'哪種 estimation 最有價值？',reviewPageId:'sd3-s04-p03',explanation:'能改變架構決策或驗證 capacity 的估算最有價值。',options:[O('a','算出會影響 CDN/shard/cache 決策的量級',true),O('b','任何能算的小數都算',false,'這會浪費時間。'),O('c','完全不說估算目的',false,'缺少設計脈絡。'),O('d','只算 DAU 不連結設計',false,'資訊價值低。')]},
  {id:'sd3-s04-q4',question:'HLD 畫完後最成熟的下一步？',reviewPageId:'sd3-s04-p01',explanation:'確認共識並讓面試官幫助選擇 Deep Dive 重點。',options:[O('a','確認 blueprint 是否符合 scope，再挑 Deep Dive',true),O('b','沉默 10 分鐘',false,'失去合作訊號。'),O('c','宣告設計已完美',false,'還沒進 Deep Dive。'),O('d','直接結束',false,'訊號不足。')]}
 ]
},
{
 id:'sd3-s05',order:5,title:'API、Data Model、Use Case Walkthrough：什麼時候講、講到多深？',duration:'28–40 分鐘',summary:'避免兩個極端：完全不談 interface/data model，或在 HLD 階段陷入欄位與 endpoint 細節。',
 research:[{label:'ByteByteGo — HLD / API and schema guidance',url:'https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews'}],
 pages:[
  {id:'sd3-s05-p01',title:'API 是系統 boundary 的具體化，不是 REST 語法考試',blocks:[
   {type:'p',text:'對 URL shortener、chat、file upload 等題目，列出核心 API 可以幫助你鎖定 request/response、idempotency、pagination、upload semantics；但大型 Google Search 類題目未必需要花很多時間列 endpoint。'},
   {type:'code',text:'POST /messages\n{conversation_id, client_message_id, body}\n\nGET /conversations/{id}/messages?cursor=...'},
   {type:'bullets',items:['API 只列核心 use cases。','說清 identifier、pagination、idempotency 等會影響 backend 的語意。','不要把時間花在 URL 命名風格爭論。']}
  ]},
  {id:'sd3-s05-p02',title:'Data Model 要從 Access Pattern 推，不是先畫漂亮 ERD',blocks:[
   {type:'stepper',steps:[['Entities','哪些資料是 durable state？'],['Primary access','最常用 key / range / lookup 是什麼？'],['Write pattern','append、update、fan-out、batch？'],['Consistency','哪些欄位需要 transaction / unique constraint？'],['Scale','partition key / index / retention 會不會成瓶頸？']]},
   {type:'callout',title:'深度由題目決定',text:'設計 Poker backend 可能需要細談 game state schema；設計全球 search engine，先把 crawling/index/query serving flow 講清楚通常更重要。'}
  ]},
  {id:'sd3-s05-p03',title:'Concrete Use Case Walkthrough 是最便宜的架構測試',blocks:[
   {type:'diagram',nodes:[['User Action','POST /upload'],['Auth / Validation','permission'],['Metadata Write','DB'],['Blob Upload','Object Store'],['Async Work','Queue / Worker'],['Read Later','CDN / metadata']],caption:'沿一個真實 request 走，可以快速發現漏掉的 state、failure 與 async boundary。'},
   {type:'p',text:'走 use case 時要問：哪裡同步？哪裡 durable？哪裡可能 retry？哪裡需要 idempotency？哪裡可能 timeout？這些問題會自然產生 Deep Dive 候選。'}
  ]}],
 quiz:[
  {id:'sd3-s05-q1',question:'何時值得在 HLD 階段列核心 API？',reviewPageId:'sd3-s05-p01',explanation:'當 interface 語意會幫助鎖定 use case、pagination、idempotency、upload 等設計時。',options:[O('a','當 API 語意會影響核心 backend flow',true),O('b','任何題都先列 50 個 endpoint',false,'會浪費時間。'),O('c','完全不能談 API',false,'過度僵硬。'),O('d','只有前端面試才談 API',false,'Backend/system boundary 很重要。')]},
  {id:'sd3-s05-q2',question:'Data Model 最應該先由什麼驅動？',reviewPageId:'sd3-s05-p02',explanation:'主要 entities、access patterns、write/consistency/scale requirements。',options:[O('a','Access pattern 與 correctness requirement',true),O('b','DB logo 顏色',false,'無關。'),O('c','ORM 預設 naming',false,'不是設計核心。'),O('d','先選 NoSQL 再找理由',false,'順序反了。')]},
  {id:'sd3-s05-q3',question:'Use case walkthrough 最容易發現什麼？',reviewPageId:'sd3-s05-p03',explanation:'可以暴露同步/非同步邊界、durability、retry、idempotency 與漏掉的元件。',options:[O('a','實際 flow 中缺少的 state/failure handling',true),O('b','CSS class 名稱',false,'不是核心。'),O('c','面試官履歷',false,'無關。'),O('d','CPU 指令集一定要選哪個',false,'通常不是此層。')]},
  {id:'sd3-s05-q4',question:'設計 Google Search 時一開始花 15 分鐘討論 endpoint 命名，主要問題？',reviewPageId:'sd3-s05-p01',explanation:'對大型問題而言，這種細節訊號低，會擠壓 HLD 與核心系統機制的時間。',options:[O('a','Deep dive 優先級錯誤',true),O('b','REST 永遠不能用',false,'不是。'),O('c','Search 不需要 API',false,'仍然有 interface。'),O('d','因為只能用 GraphQL',false,'沒有這種限制。')]}
 ]
},
{
 id:'sd3-s06',order:6,title:'Step 3：Deep Dive 要挑「最有訊號」的地方',duration:'34–46 分鐘',summary:'學會從核心機制、瓶頸、correctness 與 failure 中挑 1–3 個高價值 Deep Dive，而不是每個 box 平均講。',
 research:[
  {label:'ByteByteGo — Step 3 Design deep dive',url:'https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews'},
  {label:'AWS Well-Architected — Measure performance improvements / bottlenecks',url:'https://docs.aws.amazon.com/wellarchitected/latest/framework/perf_architecture_evaluate_trade_offs.html'}
 ],
 pages:[
  {id:'sd3-s06-p01',title:'Deep Dive 的選擇標準：它是否是這題的「靈魂」？',blocks:[
   {type:'compare',items:[['URL Shortener','短碼生成 / collision / redirect read path。'],['Chat','ordering、WebSocket routing、offline delivery。'],['News Feed','fan-out、celebrity problem、ranking/read path。'],['Rate Limiter','algorithm、distributed counters、race/failure policy。']]},
   {type:'p',text:'Deep Dive 不必把所有元件講一樣久。真正有價值的是能展示題目核心 trade-off、correctness 與 scale reasoning 的地方。'}
  ]},
  {id:'sd3-s06-p02',title:'瓶頸導向：先問哪裡最可能先壞',blocks:[
   {type:'stepper',steps:[['Critical path','哪條同步 path 直接決定 user latency？'],['Hot resource','DB write、hot key、fan-out、single partition？'],['Capacity','哪個元件最接近 throughput/storage 上限？'],['Failure','哪個 dependency 掛掉會級聯？'],['Correctness','duplicate、ordering、consistency、transaction 在哪裡最難？']]},
   {type:'callout',title:'不要只說「可以 Scale」',text:'Senior-level deep dive 要說 scale unit 是什麼、state 怎麼分、routing 怎麼做、失敗時怎麼恢復、觀測什麼指標。'}
  ]},
  {id:'sd3-s06-p03',title:'每個 Deep Dive 都用同一個五問法',blocks:[
   {type:'code',text:'1. 這個元件/機制解哪個 requirement？\n2. 正常路徑怎麼走？\n3. Scale bottleneck 在哪？\n4. Failure / race / consistency 會怎樣？\n5. 有哪些替代方案與 Trade-off？'},
   {type:'p',text:'這五問能避免你變成「只介紹技術」，因為會強迫你把元件放回整體系統。'},
   {type:'callout',title:'AWS 的同一精神',text:'架構優化應先找真正 hotspot/bottleneck，再評估改善是否值得其成本與複雜度，而不是看到一個可優化點就全部實作。'}
  ]}],
 quiz:[
  {id:'sd3-s06-q1',question:'設計 Chat System 時最有價值的 Deep Dive 候選？',reviewPageId:'sd3-s06-p01',explanation:'即時 routing、message ordering、offline delivery 是 Chat 的核心系統問題。',options:[O('a','WebSocket routing / ordering / offline delivery',true),O('b','首頁背景色',false,'不是 system core。'),O('c','JavaScript lint style',false,'不是此輪重點。'),O('d','員工組織圖',false,'無關。')]},
  {id:'sd3-s06-q2',question:'要找 Deep Dive 優先級，哪個問題最有用？',reviewPageId:'sd3-s06-p02',explanation:'找 critical path、hot resource、capacity/failure/correctness 才能聚焦高價值區域。',options:[O('a','哪裡最可能成為 bottleneck 或 correctness 風險？',true),O('b','哪個名詞最流行？',false,'流行度不是 design priority。'),O('c','哪個 box 最漂亮？',false,'無關。'),O('d','哪個元件字最多？',false,'無關。')]},
  {id:'sd3-s06-q3',question:'「我們可以 Scale Out」為何通常不夠？',reviewPageId:'sd3-s06-p02',explanation:'還要說明 state/routing/partition/failure，以及實際 scale unit。',options:[O('a','缺少怎麼切 state、routing 與 failure handling',true),O('b','Scale Out 永遠不可行',false,'它常常可行。'),O('c','一定只能 Scale Up',false,'沒有這種規則。'),O('d','因為要先寫 code',false,'System design 不一定寫 production code。')]},
  {id:'sd3-s06-q4',question:'Deep Dive 五問法中，哪一項最能防止「只介紹技術」？',reviewPageId:'sd3-s06-p03',explanation:'先問它解哪個 requirement，再談正常路徑、瓶頸、failure 與 alternatives。',options:[O('a','先說它解哪個 requirement',true),O('b','先背產品官網',false,'沒有設計連結。'),O('c','只列優點',false,'會忽略 trade-off。'),O('d','只講 happy path',false,'會漏 failure/correctness。')]}
 ]
}
);
})();