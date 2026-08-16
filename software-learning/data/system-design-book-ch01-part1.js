(() => {
const chapter = window.SYSTEM_DESIGN_CHAPTER_01 = {
  id: 'sd-book-01',
  order: 1,
  title: '使用者人數——從零到百萬規模',
  subtitle: '從一台 Server 開始，逐步用可驗證的瓶頸推導出大型 Web 系統。',
  objective: '完成後，你應該能從單機架構開始，解釋每一次擴展是為了解決哪個瓶頸、引入什麼新風險，以及下一步應觀察什麼。',
  sections: [],
  finalExam: []
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
chapter.sections.push(
{
 id:'sd1-s01',order:1,title:'單機起步：DNS、HTTP 與一次 Request 的完整路徑',duration:'18–25 分鐘',summary:'先理解最小可工作的 Web 架構，以及 Browser / App、DNS、HTTP、Web Server 各自負責什麼。',
 research:[
  {label:'ByteByteGo — Scale From Zero To Millions Of Users / Single server setup',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'},
  {label:'RFC 9110 — HTTP Semantics',url:'https://www.rfc-editor.org/rfc/rfc9110.html'}
 ],
 pages:[
  {id:'sd1-s01-p01',title:'為什麼高手反而從一台 Server 開始？',blocks:[
   {type:'lead',text:'系統設計不是「一開始就把所有大型元件畫上去」。正確做法是先建立最小可工作的系統，知道目前的 failure domain 與容量上限，再讓需求推動下一次演化。'},
   {type:'diagram',nodes:[['User','Browser / Mobile App'],['Web Server','HTTP + Business Logic'],['Data','先假設同機或本機儲存']],caption:'早期產品的價值是快速驗證需求。此時最大問題不是「不夠分散式」，而是你是否知道單機何時會成為瓶頸。'},
   {type:'bullets',items:['優點：部署簡單、成本低、除錯容易、交易邊界單純。','限制：CPU、RAM、Disk、Network、Connection 數都有單機上限。','可靠性風險：Web、資料與狀態集中時，單機故障可能讓整個服務不可用。']},
   {type:'callout',title:'面試判斷',text:'不要因為題目說「未來可能很多人」就直接跳 K8s。先說：我先畫單機 baseline，接著依 CPU、Latency、QPS、DB、可用性需求逐步擴展。'}
  ]},
  {id:'sd1-s01-p02',title:'輸入網址後：DNS 與 HTTP 各做哪一段？',blocks:[
   {type:'stepper',steps:[['1. 名稱解析','Client 先把網域名稱解析成可連線的位址。DNS 解的是「名字 → 位址/服務入口」問題。'],['2. 建立連線','Client 依 HTTP 版本與 URI scheme 建立適當傳輸連線；HTTPS 還包含 TLS 身分驗證與加密。'],['3. 送 Request','HTTP request 會帶 method、target、headers，必要時帶 body。'],['4. Server 處理','Web Server 執行 routing、驗證、商業邏輯與資料存取。'],['5. 回 Response','Response 以 status code、headers 與 representation/body 描述結果。']]},
   {type:'compare',items:[['DNS','解決「mysite.com 要去哪裡」；不是執行商業邏輯。'],['HTTP','定義 client/server request-response 的語意；不是資料庫。'],['Web Server / App','真正執行 endpoint、驗證、商業邏輯與資料存取。']]},
   {type:'callout',title:'重要釐清',text:'HTTP 是 stateless application-level request/response protocol；「HTTP stateless」不等於你的產品完全不能有登入 Session，而是協定本身不要求 Server 從前一個 Request 推斷下一個 Request 的語意。'}
  ]},
  {id:'sd1-s01-p03',title:'Web 與 Mobile 的流量最後都進同一個 Backend 嗎？',blocks:[
   {type:'p',text:'Browser 可能先拿 HTML/CSS/JS，再由 JavaScript 呼叫 API；Mobile App 通常直接呼叫 API，常見 payload 是 JSON。兩者可以共用相同 Backend，也可以依產品需求拆 API gateway / BFF，但 Chapter 1 先維持最簡單模型。'},
   {type:'code',text:'GET /api/users/12\nAccept: application/json\n\nHTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id":12,"name":"Ricky"}'},
   {type:'bullets',items:['Client 數量增加時，先觀察 Request Rate、P95/P99 latency、CPU、memory、connection pool。','單一 endpoint 慢，不代表一定需要 Scale Out；也可能是 query、外部 API 或 lock。','建立 baseline 的目的，是之後每增加一個元件都能說出它解決什麼。']}
  ]}],
 quiz:[
  {id:'sd1-s01-q1',question:'使用者輸入網域後，DNS 最直接負責哪件事？',reviewPageId:'sd1-s01-p02',explanation:'DNS 先協助把名稱解析成可連線的位址或服務入口。',options:[O('a','執行 SQL 查詢',false,'你把名稱解析與資料存取混在一起；SQL 是資料層工作。'),O('b','把網域名稱解析到可連線的位址',true),O('c','執行 Backend 商業邏輯',false,'DNS 不負責 endpoint 的商業邏輯。'),O('d','保存登入 Session',false,'Session 是應用層狀態，不是 DNS 的責任。')]},
  {id:'sd1-s01-q2',question:'為什麼早期產品採用單機架構不一定是錯誤？',reviewPageId:'sd1-s01-p01',explanation:'若目前流量與可用性需求低，單機可降低成本與複雜度；重點是知道何時需要演進。',options:[O('a','因為單機永遠比多機可靠',false,'單機通常反而有更明顯的單點故障。'),O('b','因為所有大型網站最後都只需要一台 Server',false,'這把早期 baseline 誤當最終架構。'),O('c','因為需求與流量尚低時，簡單架構能更快驗證產品',true),O('d','因為單機沒有 CPU、RAM 與連線上限',false,'任何單機都有資源上限。')]},
  {id:'sd1-s01-q3',question:'「HTTP 是 stateless」最準確的理解是？',reviewPageId:'sd1-s01-p02',explanation:'HTTP 的每個 request 具有可獨立理解的語意；產品仍可透過 cookie/token/shared session 等方式維持應用狀態。',options:[O('a','使用 HTTP 的網站不能登入',false,'你把 protocol stateless 誤解成 application 不能有狀態。'),O('b','Server 永遠不能使用任何資料庫',false,'HTTP stateless 與是否使用 DB 無關。'),O('c','每個 Request 的語意可獨立理解，不要求依賴前一個 Request',true),O('d','所有 HTTP Request 一定建立全新 TCP 連線',false,'connection reuse 與 HTTP stateless 是不同層次。')]},
  {id:'sd1-s01-q4',question:'單一 API 在尖峰變慢，下一步最合理的系統設計動作是？',reviewPageId:'sd1-s01-p03',explanation:'先量測 latency、CPU、DB query、connection 等瓶頸，再決定 Scale Up、Scale Out 或針對特定 dependency 優化。',options:[O('a','直接加入 Kafka',false,'你把流行元件當萬用解；Kafka 不會自動解決同步 API latency。'),O('b','先量測與定位瓶頸',true),O('c','直接 Sharding',false,'資料庫甚至可能不是瓶頸。'),O('d','先拆成 30 個 Microservices',false,'拆服務會增加分散式複雜度，需有明確理由。')]}
 ]
},
{
 id:'sd1-s02',order:2,title:'拆出 Database：Web Tier 與 Data Tier 分工',duration:'20–28 分鐘',summary:'理解為什麼 App 與 Database 要能獨立擴展，以及 SQL / NoSQL 應從資料模型與存取模式判斷。',
 research:[{label:'ByteByteGo — Database section',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'}],
 pages:[
  {id:'sd1-s02-p01',title:'第一個拆分：App 與 Database 分開',blocks:[
   {type:'diagram',nodes:[['Client','HTTP'],['Web/App Tier','CPU / connections / business logic'],['Database Tier','durable data / query / transaction']],caption:'拆開後可以獨立調整 App 與 DB 的機型、容量、備份與維運生命週期。'},
   {type:'p',text:'Web Server 與 Database 的資源型態不同：App 常吃 CPU、connection、runtime memory；Database 更重視 buffer pool、I/O、index、durability 與 transaction。放在同一台機器時，兩者會競爭資源，也無法獨立擴展。'},
   {type:'callout',title:'架構原則',text:'拆層的理由應該是「不同責任需要獨立伸縮與 failure isolation」，而不是因為三層架構看起來比較專業。'}
  ]},
  {id:'sd1-s02-p02',title:'SQL vs NoSQL：不要用「誰比較快」回答',blocks:[
   {type:'compare',items:[['Relational / SQL','表格、關聯、join、transaction 與 schema 約束成熟；適合訂單、交易、關聯資料。'],['Key-Value / Document','依 key 或 document access pattern 取得資料，常用於高擴展、低延遲或彈性 schema 場景。'],['Graph / Wide-column','各自服務特定關係查詢或大規模分散資料模型；NoSQL 不是單一產品類型。']]},
   {type:'bullets',items:['先問資料之間是否有強關聯與 transaction 邊界。','再問主要 access pattern：依 key？range？join？聚合？全文檢索？','最後才談 latency、throughput、operational complexity 與 scale。']}
  ]},
  {id:'sd1-s02-p03',title:'選 DB 的真正決策順序',blocks:[
   {type:'stepper',steps:[['資料正確性','需要哪些 constraint、transaction、consistency？'],['資料模型','資料天然是關聯式、document、key-value、graph 還是 time-series？'],['查詢模式','最常見 query 是 key lookup、range、join、aggregate 還是 search？'],['規模與延遲','資料量、QPS、P99 latency、讀寫比是多少？'],['維運成本','backup、restore、replication、schema evolution、團隊熟悉度。']]},
   {type:'callout',title:'常見錯誤',text:'「資料很多所以 NoSQL」太粗糙；SQL 也可以做 replication、partitioning/sharding。真正關鍵是你的資料與存取模式。'}
  ]}],
 quiz:[
  {id:'sd1-s02-q1',question:'把 App 與 Database 分到不同機器，最核心的架構收益是？',reviewPageId:'sd1-s02-p01',explanation:'兩層可依各自資源需求獨立擴展、維運並降低彼此資源競爭。',options:[O('a','讓 HTTP 不再需要 DNS',false,'DNS 與資料庫拆分沒有這種因果關係。'),O('b','讓 Web Tier 與 Data Tier 可以獨立擴展',true),O('c','保證永遠不會有故障',false,'拆層不是零故障保證。'),O('d','讓所有 query 變 O(1)',false,'查詢複雜度仍取決於 index 與 query plan。')]},
  {id:'sd1-s02-q2',question:'選 SQL 或 NoSQL 時，哪個判斷方式最合理？',reviewPageId:'sd1-s02-p03',explanation:'先看資料模型、transaction/consistency 與 access pattern，再考慮 scale 和運維。',options:[O('a','NoSQL 一定比 SQL 快',false,'你把不同資料模型簡化成單一效能排名。'),O('b','只看社群媒體上哪個熱門',false,'技術選擇需對應 workload。'),O('c','從資料模型、正確性與存取模式開始判斷',true),O('d','資料超過 1GB 就一定 NoSQL',false,'沒有這種通用門檻。')]},
  {id:'sd1-s02-q3',question:'訂單與付款需要跨多個關聯資料做一致 transaction，起始方案通常更偏向？',reviewPageId:'sd1-s02-p02',explanation:'關聯與 transaction 是 relational database 的典型強項，之後若有實證瓶頸再演進。',options:[O('a','Relational database',true),O('b','CDN',false,'CDN 是內容傳遞與 edge cache，不是交易資料庫。'),O('c','Message Queue 當唯一資料庫',false,'Queue 不是典型 durable relational source of truth。'),O('d','DNS',false,'DNS 不處理交易資料。')]},
  {id:'sd1-s02-q4',question:'某資料只用唯一 key 讀寫、幾乎沒有 join，且需要非常大規模水平擴展。最合理的下一步是？',reviewPageId:'sd1-s02-p02',explanation:'Key-value / document 類 NoSQL 值得評估，但仍需依一致性、查詢與維運要求驗證。',options:[O('a','先評估 Key-Value / Document store',true),O('b','一定要用 Graph DB',false,'Graph DB 的優勢在關係遍歷，與題目 access pattern 不符。'),O('c','一定用單機 SQLite 到永遠',false,'題目已明確要求大規模水平擴展。'),O('d','用 Load Balancer 取代資料庫',false,'LB 不保存業務資料。')]}
 ]
},
{
 id:'sd1-s03',order:3,title:'Vertical Scaling vs Horizontal Scaling：先救急還是開始分散？',duration:'16–22 分鐘',summary:'理解 Scale Up / Scale Out 解不同層級問題，以及單機極限與水平擴展帶來的新成本。',
 research:[{label:'ByteByteGo — Vertical scaling vs horizontal scaling',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'},{label:'MongoDB Docs — Sharding overview: vertical vs horizontal growth',url:'https://www.mongodb.com/docs/manual/sharding/'}],
 pages:[
  {id:'sd1-s03-p01',title:'Scale Up 與 Scale Out 的本質',blocks:[
   {type:'compare',items:[['Scale Up / Vertical','同一節點加 CPU、RAM、Disk。變更簡單，但有硬體上限，且不自然提供 redundancy。'],['Scale Out / Horizontal','增加節點分擔工作。容量與可用性更有彈性，但要處理 load balancing、state、deployment、consistency。']]},
   {type:'p',text:'早期遇到短期 CPU / RAM 壓力時，Scale Up 常是最便宜的工程解；但當 availability、流量彈性或硬體天花板成為核心需求，就必須開始 Scale Out。'},
   {type:'callout',title:'Lead 思維',text:'不要把 Scale Up 當低階答案。好的架構師會比較「解決問題的成本」；只要單機仍在可接受風險與成本內，Scale Up 可能是更好的決策。'}
  ]},
  {id:'sd1-s03-p02',title:'水平擴展不是免費容量',blocks:[
   {type:'bullets',items:['需要入口層分配流量，例如 Load Balancer。','需要處理 Session / file / local memory 等狀態，否則節點不可互換。','需要一致的 deployment/configuration，避免不同節點行為不一致。','需要 observability，否則問題分散到多台機器後更難定位。','若資料層也水平拆分，還會進一步面對 shard key、rebalancing、跨節點 query。']},
   {type:'stepper',steps:[['先量測','確認 CPU、RAM、I/O、DB、network 或 dependency 哪個先到極限。'],['能否 Scale Up','如果提升單機規格即可安全撐住成長，先選低複雜度方案。'],['是否需要 HA','若不能接受單點故障，即使容量還夠，也可能需要多節點。'],['開始 Scale Out','加入 LB、stateless/shared state、automation 與 failure handling。']]}
  ]}],
 quiz:[
  {id:'sd1-s03-q1',question:'把 8 Core / 16GB Server 升到 32 Core / 128GB，屬於？',reviewPageId:'sd1-s03-p01',explanation:'提升同一台機器規格是 Vertical Scaling / Scale Up。',options:[O('a','Scale Up',true),O('b','Scale Out',false,'Scale Out 是增加節點數量。'),O('c','Sharding',false,'Sharding 是資料水平分割的一種策略。'),O('d','Replication',false,'Replication 是建立資料副本。')]},
  {id:'sd1-s03-q2',question:'Scale Out 最容易額外引入哪一類問題？',reviewPageId:'sd1-s03-p02',explanation:'多節點後需要處理流量分配、共享狀態、部署一致性與節點故障。',options:[O('a','節點間狀態與流量分配',true),O('b','HTML 不再能顯示',false,'多節點不會讓 HTML 協定失效。'),O('c','DNS 永遠消失',false,'DNS 仍可能是入口流程的一部分。'),O('d','所有資料自動強一致',false,'多節點反而常讓 consistency 更需要設計。')]},
  {id:'sd1-s03-q3',question:'流量很小但服務要求單一 App Server 掛掉仍要可用，哪個需求會推動你提早 Scale Out？',reviewPageId:'sd1-s03-p01',explanation:'這不是容量問題，而是 availability / redundancy 要求。',options:[O('a','High Availability',true),O('b','字型大小',false,'UI 字型不構成 server redundancy 需求。'),O('c','SQL 語法風格',false,'與節點冗餘無直接關係。'),O('d','JSON 縮排',false,'payload 格式不解決單點故障。')]},
  {id:'sd1-s03-q4',question:'下列哪句最符合成熟的 Scaling 決策？',reviewPageId:'sd1-s03-p02',explanation:'先定位瓶頸，再選能以最低合理複雜度滿足容量與可靠性需求的方案。',options:[O('a','任何成長都先 Kubernetes',false,'工具應由需求驅動。'),O('b','能 Scale Up 就永遠不要 Scale Out',false,'HA 與硬體上限可能讓 Scale Out 必要。'),O('c','先量測瓶頸，再比較 Scale Up/Out 的成本與風險',true),O('d','多 Server 一定比較便宜',false,'運維、網路與工程複雜度也有成本。')]}
 ]
},
{
 id:'sd1-s04',order:4,title:'Load Balancer：流量分配、Health Check 與 Failure Handling',duration:'22–30 分鐘',summary:'理解 LB 不只是 Round Robin，而是讓多個健康節點形成可替換的 Web Tier。',
 research:[{label:'ByteByteGo — Load balancer section',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'},{label:'AWS ELB — Application Load Balancer health checks',url:'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html'}],
 pages:[
  {id:'sd1-s04-p01',title:'LB 解決的是「入口到多節點」問題',blocks:[
   {type:'diagram',nodes:[['Client','Public Internet'],['Load Balancer','Public entry + routing'],['Web A','Private target'],['Web B','Private target']],caption:'Client 面對 LB 的入口；後端節點可使用 private network，不必每台都直接暴露在 Internet。'},
   {type:'p',text:'多台 App Server 如果沒有統一入口，Client 不知道該連哪台，也缺少健康狀態與 failover 機制。LB 讓 Backend pool 變成一個可伸縮、可替換的服務集合。'}
  ]},
  {id:'sd1-s04-p02',title:'Health Check 比「平均分配」更重要',blocks:[
   {type:'p',text:'真正的 Load Balancing 不是盲目把 1/3 流量送到每台。LB 必須持續判斷 target 是否健康；連續失敗達門檻後，應暫時停止送新流量，健康恢復後再加入 pool。'},
   {type:'stepper',steps:[['Register','Server 加入 target pool。'],['Probe','LB 週期性以 TCP/HTTP/HTTPS 等方式檢查健康狀態。'],['Unhealthy','達失敗門檻後停止把新 request 路由到該 target。'],['Recover','連續成功達門檻後重新納入流量。']]},
   {type:'callout',title:'Health endpoint 設計',text:'只檢查 process 還活著通常不夠；但 health check 也不能做成昂貴的全系統整合測試。要依「能否安全承接新流量」設計適當深度。'}
  ]},
  {id:'sd1-s04-p03',title:'LB 後面的三個常見陷阱',blocks:[
   {type:'bullets',items:['Session 黏在單台機器：會迫使 sticky session，降低節點可替換性。','Connection draining 沒處理：部署或下線時，既有 request/connection 被硬切。','所有 Server 同時依賴同一個故障下游：LB 只能避開不健康 App，不能 magically 修復 shared DB outage。']},
   {type:'p',text:'因此 Load Balancer 提升的是 Web Tier 的容量與 resilience；整體系統可用性仍取決於 Data Tier、Cache、Queue 等其他依賴。'}
  ]}],
 quiz:[
  {id:'sd1-s04-q1',question:'Load Balancer 的核心作用是？',reviewPageId:'sd1-s04-p01',explanation:'把 incoming traffic 路由到後端健康節點，讓多個 instance 對外形成一個服務入口。',options:[O('a','把 Request 分配到後端節點',true),O('b','取代 Database',false,'LB 路由流量，不是資料持久層。'),O('c','產生所有 HTML',false,'HTML 可能由 App 或 CDN 等回傳，LB 本身不等於應用。'),O('d','保證下游 DB 不會故障',false,'LB 不能消除共享依賴的故障。')]},
  {id:'sd1-s04-q2',question:'某 Server health check 持續失敗，LB 最合理的動作？',reviewPageId:'sd1-s04-p02',explanation:'達 unhealthy threshold 後暫停把新流量送給該 target。',options:[O('a','仍固定送 50% 流量',false,'這會持續把使用者導向已知不健康節點。'),O('b','把它暫時移出可服務 target pool',true),O('c','刪掉 DNS 全部紀錄',false,'故障範圍只在 target，不需摧毀入口解析。'),O('d','清空 Database',false,'與 target health 無關且危險。')]},
  {id:'sd1-s04-q3',question:'加入 LB + 3 台 Web Server 後，Database 單點故障會自動被解決嗎？',reviewPageId:'sd1-s04-p03',explanation:'不會；Web Tier redundancy 與 Data Tier redundancy 是不同 failure domain。',options:[O('a','會，因為 LB 會複製 Database',false,'LB 不會自動複製資料庫。'),O('b','不會，仍需獨立設計 Data Tier 的 HA',true),O('c','會，因為 private IP 保證 DB 永遠可用',false,'private IP 是網路可達性/暴露範圍，不是 HA。'),O('d','只要 Round Robin 就會',false,'routing algorithm 不能處理 DB 單點。')]},
  {id:'sd1-s04-q4',question:'為什麼 Stateful Session 會讓 Load-Balanced Web Tier 更難維運？',reviewPageId:'sd1-s04-p03',explanation:'若 session 只在某台 RAM，request 必須固定路由到特定節點，新增、移除與故障切換都更困難。',options:[O('a','因為每台 Server 都可完全互換',false,'這正好描述 stateless，而不是問題。'),O('b','因為使用者狀態綁定單一節點，可能需要 Sticky Session',true),O('c','因為 HTTP 不允許 Session',false,'HTTP stateless 不禁止應用維護 session。'),O('d','因為 LB 不能做 health check',false,'LB 仍可 health check，只是 state locality 增加複雜度。')]}
 ]
},
{
 id:'sd1-s05',order:5,title:'Database Replication：Read Scaling、Replication Lag 與 Failover',duration:'28–38 分鐘',summary:'從 source/replica 複製機制理解讀寫分流、高可用，以及非同步複製真正會造成的資料新鮮度問題。',
 research:[{label:'ByteByteGo — Database replication section',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'},{label:'MySQL 8.4 — Replication Implementation',url:'https://dev.mysql.com/doc/refman/8.4/en/replication-implementation.html'},{label:'MySQL 8.4 — Source to Replica Replication',url:'https://dev.mysql.com/doc/refman/8.4/en/group-replication-primary-secondary-replication.html'}],
 pages:[
  {id:'sd1-s05-p01',title:'Replication 是複製資料，不是把資料切開',blocks:[
   {type:'diagram',nodes:[['App Write','INSERT / UPDATE / DELETE'],['Source / Primary','commit + change log'],['Replica 1','apply changes'],['Replica 2','apply changes']],caption:'Replica 通常保有資料副本；這和 Sharding「每個節點只持有部分資料」是不同概念。'},
   {type:'p',text:'以 MySQL 傳統 replication 為例，source 把資料變更寫入 binary log，replica 取得並套用這些事件。SELECT 一般不會進 binary log，因為它不修改資料。'},
   {type:'callout',title:'名詞更新',text:'現代文件常用 source/replica 或 primary/replica；舊資料常寫 master/slave。面試時能理解兩組術語即可。'}
  ]},
  {id:'sd1-s05-p02',title:'Read Replica 能分攤什麼？不能分攤什麼？',blocks:[
   {type:'compare',items:[['Write Path','典型 single-primary 模型仍把寫入送 primary/source。'],['Read Path','可把容忍延遲的 SELECT 分配給 replicas，增加讀吞吐。'],['HA','Replica 可作 failover 候選，但 promotion、DNS/endpoint、資料落後都必須處理。']]},
   {type:'p',text:'如果 workload 是 95% reads，增加 read replicas 很可能有效；如果主要瓶頸是 write throughput，單純增加 replicas 通常不會把 writes 平均分散。'},
   {type:'callout',title:'最常見面試誤區',text:'「多加 Replica 就能分攤所有 DB 負載」是錯的。要先問瓶頸在 Read 還是 Write。'}
  ]},
  {id:'sd1-s05-p03',title:'Replication Lag：為什麼剛寫完可能讀到舊資料？',blocks:[
   {type:'p',text:'典型 asynchronous replication 中，Primary commit 與 Replica 套用之間存在時間差。使用者剛更新個人資料，下一個 request 若被路由到尚未追上的 Replica，就可能看到舊值。'},
   {type:'stepper',steps:[['T0','Client 寫入 Primary，Primary commit 成功。'],['T1','Primary 回 200 OK。'],['T2','Replica 還沒套用最新 log。'],['T3','Client 立刻讀 Replica → stale read。'],['T4','Replica 追上後，讀到新值。']]},
   {type:'bullets',items:['Read-your-writes：剛完成關鍵寫入後，可短時間讀 Primary 或使用 session consistency 策略。','Failover：若 Primary 掛掉，選 Replica promotion 前要確認資料落後與資料遺失窗口。','Reporting / feed 類讀取通常比較能接受短暫 stale；付款餘額等資料則要更嚴格。']}
  ]}],
 quiz:[
  {id:'sd1-s05-q1',question:'Read Replica 最直接改善哪種瓶頸？',reviewPageId:'sd1-s05-p02',explanation:'Replica 可分擔大量讀取，尤其是 read-heavy workload。',options:[O('a','Read throughput',true),O('b','所有 write 自動平均分散',false,'你把 replication 當 sharding/multi-primary；典型 single-primary replication 的 write 仍進 primary。'),O('c','前端 bundle 大小',false,'這是前端/CDN 等議題。'),O('d','DNS TTL',false,'Replica 與 DNS TTL 不是同一層問題。')]},
  {id:'sd1-s05-q2',question:'剛 UPDATE 成功後立刻讀 Replica 卻看到舊值，最可能原因？',reviewPageId:'sd1-s05-p03',explanation:'非同步 replication 可能有 lag，Replica 尚未套用最新變更。',options:[O('a','Replication Lag',true),O('b','Load Balancer 一定故障',false,'即使 routing 正常，Replica 仍可能因同步延遲而 stale。'),O('c','HTTP 不能傳新資料',false,'HTTP 與資料副本新鮮度是不同問題。'),O('d','CDN 一定 Cache 了 SQL',false,'題目直接指出讀 Replica，應先檢查 replication freshness。')]},
  {id:'sd1-s05-q3',question:'Replication 與 Sharding 最重要的差異？',reviewPageId:'sd1-s05-p01',explanation:'Replication 建立資料副本；Sharding 把資料集分割到不同節點。',options:[O('a','Replication 複製資料；Sharding 分割資料',true),O('b','兩者完全相同',false,'你把 redundancy 與 partitioning 混為一談。'),O('c','Replication 只用於圖片',false,'DB replication 用於資料庫副本。'),O('d','Sharding 只是在 Browser Cache',false,'Sharding 是資料分割策略。')]},
  {id:'sd1-s05-q4',question:'Primary 掛掉後直接 Promotion 任一 Replica，最大需要注意什麼？',reviewPageId:'sd1-s05-p03',explanation:'Replica 可能尚未同步最新資料；promotion 還涉及 endpoint/routing、選主與資料恢復。',options:[O('a','Replica 是否落後、是否可能遺失最新寫入',true),O('b','CSS 是否 minify',false,'與 DB failover 無關。'),O('c','所有 Replica 一定 100% 同步所以不用檢查',false,'非同步 replication 不能這樣假設。'),O('d','把 Cache 永久關掉就能保證無資料遺失',false,'Cache 與 replication durability 是不同層次。')]}
 ]
}
);
})();