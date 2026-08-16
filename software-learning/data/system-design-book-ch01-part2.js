(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_01;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
chapter.sections.push(
{
 id:'sd1-s06',order:6,title:'Cache Tier：降低延遲、保護下游，但別製造新的事故',duration:'28–38 分鐘',summary:'從 Cache-Aside、TTL、Hit Rate、Eviction、Cold Start 到一致性與故障模式，建立真正可操作的快取判斷。',
 research:[{label:'ByteByteGo — Cache section',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'},{label:'AWS Builders’ Library — Caching challenges and strategies',url:'https://aws.amazon.com/builders-library/caching-challenges-and-strategies'}],
 pages:[
  {id:'sd1-s06-p01',title:'什麼資料值得 Cache？先看重複使用率',blocks:[
   {type:'lead',text:'Cache 的價值來自「同一份結果會被很多 Request 重複使用」。如果每次查詢都高度唯一，Hit Rate 很低，Cache 只會增加複雜度。'},
   {type:'diagram',nodes:[['Request','GET product:42'],['Cache','Hit?'],['Database','Miss 才查'],['Cache Fill','存結果 + TTL']],caption:'常見 side-cache / cache-aside 思路：先查 cache；miss 時回源，再把結果寫回 cache。'},
   {type:'bullets',items:['適合：熱門商品、設定檔、權限結果、計算昂貴且更新不頻繁的資料。','不適合：每個 Request 都不同、資料極度即時、不能接受 stale 的關鍵交易狀態。','要量測：Hit Rate、Miss Rate、downstream QPS、cache CPU/memory、eviction count。']}
  ]},
  {id:'sd1-s06-p02',title:'TTL 與 Eviction：快取不是「放進去就好」',blocks:[
   {type:'compare',items:[['TTL 太短','Hit Rate 下降、回源增加，尖峰時可能把 DB 壓垮。'],['TTL 太長','資料更容易 stale，修改後舊資料存在更久。'],['容量不足','必須 eviction；LRU/LFU/FIFO 等策略決定誰先被淘汰。']]},
   {type:'p',text:'TTL 應由資料更新頻率與「可接受舊多久」決定，不該拍腦袋填 3600。快取容量與 TTL 也必須用真實 traffic distribution 驗證。'},
   {type:'callout',title:'Cold Start',text:'新節點或整批 cache flush 後，大量 miss 會同時打回 downstream。部署與故障恢復時尤其危險，因此要考慮 warm-up、request coalescing、rate limiting 或 load shedding。'}
  ]},
  {id:'sd1-s06-p03',title:'Cache 一致性與故障：快不代表正確',blocks:[
   {type:'stepper',steps:[['Write DB','資料先成功寫入 source of truth。'],['Invalidate / Update Cache','依策略刪除或更新對應 key。'],['Race Condition','若 DB 與 Cache 不是同一交易，並發下可能短暫不一致。'],['Failure Mode','Cache 掛掉時，要決定 fail-open 回源、serve stale、限流或降級。']]},
   {type:'bullets',items:['Cache 不應是唯一資料來源，除非產品本身就是用 cache-like store 作 authoritative store 且有明確 durability 設計。','Cache fleet outage 時，所有 Request 同時回 DB 可能造成二次事故。','熱門 Key 失效可造成 stampede；可用 jitter TTL、locking/request coalescing、stale-while-revalidate 類策略降低衝擊。']}
  ]}],
 quiz:[
  {id:'sd1-s06-q1',question:'哪種資料最適合優先評估 Cache？',reviewPageId:'sd1-s06-p01',explanation:'高重複讀取、更新相對少、可接受短暫 stale 的資料通常最能獲得高 Hit Rate。',options:[O('a','每次 Request 都完全不同且只查一次的資料',false,'這類資料重複使用率低，cache hit rate 可能很差。'),O('b','高頻讀取、低頻更新的熱門資料',true),O('c','唯一 authoritative 的付款扣款紀錄且不能 stale',false,'你忽略了 cache stale 與 durability 風險；付款真實狀態應由可靠 source of truth 保證。'),O('d','只因為 Redis 很快所以所有資料都放',false,'技術選擇要由 access pattern 與一致性需求驅動。')]},
  {id:'sd1-s06-q2',question:'TTL 設得過短最直接的風險？',reviewPageId:'sd1-s06-p02',explanation:'資料更頻繁過期，Miss 增加，downstream/DB QPS 上升。',options:[O('a','Hit Rate 下降、回源增加',true),O('b','資料永遠不更新',false,'TTL 短反而更常重新取得資料。'),O('c','所有 Cache 永遠塞滿',false,'短 TTL 通常會更快淘汰到期資料。'),O('d','DNS 解析失效',false,'DNS 與 application cache TTL 是不同層。')]},
  {id:'sd1-s06-q3',question:'整個 Cache Fleet 突然清空，最值得警戒的次生問題？',reviewPageId:'sd1-s06-p02',explanation:'Cold cache 會讓大量請求同時 Miss 並回源，可能把 DB/下游打掛。',options:[O('a','大量 Cache Miss 同時打 downstream',true),O('b','HTTP method 會全部變 POST',false,'Cache 狀態不會改變 HTTP method。'),O('c','Load Balancer 自動變 Database',false,'元件責任不會因 cache flush 改變。'),O('d','所有使用者 IP 改變',false,'與 cache cold start 無關。')]},
  {id:'sd1-s06-q4',question:'Cache 掛掉時直接讓全部流量無限制回 DB，為什麼危險？',reviewPageId:'sd1-s06-p03',explanation:'原本由 Cache 吸收的讀流量瞬間落到 DB，可能把下游壓垮，形成 cascading failure。',options:[O('a','可能造成 Cascading Failure',true),O('b','因為 DB 不支援任何讀取',false,'DB 當然支援讀，但未必能承受失去 cache 後的尖峰。'),O('c','因為 Cache 掛掉等於 DNS 掛掉',false,'是不同 failure domain。'),O('d','因為每個 Request 都會自動變成 write',false,'回源讀取仍可能是 read。')]}
 ]
},
{
 id:'sd1-s07',order:7,title:'CDN：把靜態內容放到離使用者更近的 Edge',duration:'22–30 分鐘',summary:'理解 Edge、Origin、Hit/Miss、TTL、Invalidation 與 CDN Failure，而不是只記「CDN 讓圖片變快」。',
 research:[{label:'ByteByteGo — CDN section',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'},{label:'Cloudflare Cache — Get started',url:'https://developers.cloudflare.com/cache/get-started/'},{label:'Cloudflare — CDN performance',url:'https://www.cloudflare.com/learning/cdn/cdn-performance/'}],
 pages:[
  {id:'sd1-s07-p01',title:'Origin 與 Edge：誰才是內容來源？',blocks:[
   {type:'diagram',nodes:[['User','Taipei'],['CDN Edge','Nearest POP'],['Origin','App / Object Storage']],caption:'Edge 先嘗試回應可快取內容；Miss 才回 Origin。Origin 才是原始內容來源。'},
   {type:'p',text:'CDN 用全球分散的 Edge 節點降低網路往返距離與 Origin 頻寬。圖片、CSS、JS、影片片段與下載檔案是最典型的 cacheable content。'},
   {type:'compare',items:[['CDN','Edge delivery + distributed cache，面向 Internet 使用者。'],['Redis / App Cache','通常靠近 application，用來減少 DB / service query。']]}
  ]},
  {id:'sd1-s07-p02',title:'Hit / Miss / TTL / Invalidation',blocks:[
   {type:'stepper',steps:[['First Request','Edge 沒有物件 → MISS。'],['Origin Fetch','Edge 向 Origin 取物件。'],['Cache','依 Cache-Control / CDN Rules / TTL 保存。'],['Next Request','TTL 內同 Edge 可直接 HIT。'],['Update','新版本可用 purge/invalidation 或版本化 URL 避免舊內容。']]},
   {type:'p',text:'TTL 太短會讓 Edge 經常回 Origin；太長會延長 stale content。對 immutable asset，常用 content hash / versioned filename 讓新版本走新 URL，舊版本可長時間 cache。'},
   {type:'callout',title:'CDN Failure',text:'若產品高度依賴 CDN，也要定義 outage 時的 fallback：是否可回 Origin、是否只保留核心頁面、是否能接受部分靜態資產失效。'}
  ]}],
 quiz:[
  {id:'sd1-s07-q1',question:'CDN Edge Cache Miss 時，典型下一步？',reviewPageId:'sd1-s07-p02',explanation:'Edge 向 Origin 取回內容，依規則快取後回給 Client。',options:[O('a','向 Origin Fetch',true),O('b','直接刪除 Database',false,'Cache miss 不代表資料庫需要刪除。'),O('c','永遠回 404',false,'若 Origin 有資源，Edge 應回源取得。'),O('d','把 Client 變成 Server',false,'不符合 CDN 流程。')]},
  {id:'sd1-s07-q2',question:'CDN 與 Redis App Cache 的核心差異？',reviewPageId:'sd1-s07-p01',explanation:'CDN 主要在全球 Edge 做內容傳遞與快取；Redis 類 Cache 常在 Application 旁減少 DB/Service 存取。',options:[O('a','CDN 是全球 Edge delivery；Redis 常是 App-side data cache',true),O('b','兩者完全相同且部署位置必然一致',false,'你忽略了 edge 與 application/data tier 的位置與用途差異。'),O('c','Redis 只能存圖片',false,'Redis 可存多種資料結構。'),O('d','CDN 只能處理 SQL',false,'CDN 不是 SQL query engine。')]},
  {id:'sd1-s07-q3',question:'JS 檔更新後使用 `app.9f8a.js` 新檔名，而不是覆蓋 `app.js`，主要好處？',reviewPageId:'sd1-s07-p02',explanation:'版本化 URL 讓新內容有新 cache key，可安全搭配長 TTL，降低 invalidation 複雜度。',options:[O('a','新版本形成新的 Cache Key',true),O('b','讓 DNS 不需要任何紀錄',false,'asset versioning 不取代 DNS。'),O('c','讓 Browser 不下載 JS',false,'Browser 仍需取得新資產。'),O('d','讓 Database 自動 sharding',false,'與 DB 無關。')]},
  {id:'sd1-s07-q4',question:'CDN TTL 過長最典型的產品風險？',reviewPageId:'sd1-s07-p02',explanation:'舊內容可能在 Edge 保存過久，使用者看到 stale asset/content。',options:[O('a','使用者可能看到過時內容',true),O('b','所有 Request 都直接打 Origin',false,'TTL 長通常會增加 Hit，而不是增加 Origin fetch。'),O('c','LB Health Check 消失',false,'不同元件。'),O('d','Replica 無法同步 binary log',false,'CDN TTL 與 DB replication 無直接關係。')]}
 ]
},
{
 id:'sd1-s08',order:8,title:'Stateless Web Tier：讓任何健康 Server 都能接任何 Request',duration:'24–32 分鐘',summary:'把 Session 與本機檔案狀態移出 Web Server，理解 Sticky Session 為何只是 workaround，以及 Stateless 如何支援 Auto Scaling。',
 research:[{label:'ByteByteGo — Stateless web tier',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'},{label:'AWS Well-Architected — Make systems stateless where possible',url:'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_stateless.html'}],
 pages:[
  {id:'sd1-s08-p01',title:'Stateful Server 的真正問題不是「有資料」，而是資料綁在單機',blocks:[
   {type:'diagram',nodes:[['User A','Session A'],['Server A','local session'],['User B','Session B'],['Server B','local session']],caption:'若 User A 下一次被送到 Server B，B 不知道 A 的 session，於是 LB 被迫做 Sticky Session。'},
   {type:'p',text:'Sticky Session 可以暫時讓同一使用者黏在特定 Server，但 Server 故障、擴縮容、部署與 rebalancing 都更麻煩。它是 workaround，不是理想的長期水平擴展模型。'}
  ]},
  {id:'sd1-s08-p02',title:'Stateless：把需要保存的狀態外移',blocks:[
   {type:'diagram',nodes:[['Client','Token / Session ID'],['LB','Any healthy server'],['Web Pool','No user-local state'],['Shared State','Redis / DB / Object Storage']],caption:'Web instance 可任意新增、移除、重啟；共享狀態由外部 store 管理。'},
   {type:'bullets',items:['Session：可放 shared cache/DB，或採自包含 token（需評估撤銷與安全）。','User upload：不要只寫某台 Web Server local disk；改用 shared/object storage。','Configuration：用一致的 config/secrets 管理，避免每台機器手工不同。','Auto Scaling：stateless instance 才容易根據負載快速增加或移除。']},
   {type:'callout',title:'注意',text:'Stateless Web Tier 不代表整個系統沒有 state；只是把 state 放到更合適、可共享與可持久化的層。'}
  ]}],
 quiz:[
  {id:'sd1-s08-q1',question:'Web Server 把 Session 只存在自己 RAM，水平擴展後最直接的問題？',reviewPageId:'sd1-s08-p01',explanation:'下一個 Request 若到別台 Server，可能找不到 Session，因此需要 sticky routing 或共享狀態。',options:[O('a','Request 到另一台就可能失去 Session',true),O('b','DNS 一定壞掉',false,'問題在 application state locality。'),O('c','Database 自動變 NoSQL',false,'無此因果。'),O('d','HTTP status code 會失效',false,'HTTP status 與 local session 無關。')]},
  {id:'sd1-s08-q2',question:'Stateless Web Tier 最重要的特性？',reviewPageId:'sd1-s08-p02',explanation:'任何健康 instance 都能處理 Request，因為需要的共享狀態不綁在單機。',options:[O('a','任何健康 Server 都能處理 Request',true),O('b','系統完全沒有任何資料',false,'state 只是外移，不是不存在。'),O('c','每個 User 永遠固定同一台 Server',false,'這是 stateful/sticky 的典型限制。'),O('d','不需要 Database 或 Cache',false,'共享 state 反而可能依賴這些 store。')]},
  {id:'sd1-s08-q3',question:'Sticky Session 為什麼不如 Stateless 易於 Auto Scaling？',reviewPageId:'sd1-s08-p01',explanation:'使用者與特定 instance 綁定，節點下線或新增時要處理重新分配與 session locality。',options:[O('a','因為使用者與 instance 有狀態綁定',true),O('b','因為 Sticky Session 會讓 CPU 永遠 0%',false,'沒有這種必然關係。'),O('c','因為它會刪除所有 cookie',false,'Sticky 甚至常依賴 cookie。'),O('d','因為它禁止 Load Balancer',false,'Sticky Session 通常正是 LB 提供的能力。')]},
  {id:'sd1-s08-q4',question:'使用者上傳圖片只存 Web Server local disk，在多台 Server 下最可能發生？',reviewPageId:'sd1-s08-p02',explanation:'不同 Server 的 local disk 不共享，下一次 Request 到別台時可能看不到檔案。',options:[O('a','不同節點看到的檔案不一致',true),O('b','所有節點自動同步 local disk',false,'除非你另外設計共享/同步機制，否則不會。'),O('c','CDN 自動幫你寫回所有 Server',false,'CDN 不會自動同步 web local filesystem。'),O('d','DB replication 會複製 local image',false,'DB replication 只複製 DB 內的資料變更。')]}
 ]
},
{
 id:'sd1-s09',order:9,title:'Multi-Data Center：Geo Routing、Failover 與跨區資料同步',duration:'28–38 分鐘',summary:'理解多機房不是多畫兩個框，而是多了一整組 traffic routing、data sync、deployment 與 failure-domain 問題。',
 research:[{label:'ByteByteGo — Data centers section',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'},{label:'AWS Well-Architected — Deploy workload to multiple locations',url:'https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_fault_isolation_multiaz_region_system.html'},{label:'AWS Well-Architected — Fail over to healthy resources',url:'https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_withstand_component_failures_failover2good.html'}],
 pages:[
  {id:'sd1-s09-p01',title:'為什麼要跨 Data Center / Region？',blocks:[
   {type:'compare',items:[['Latency','把使用者導向較近 Region，降低跨洲 RTT。'],['Availability','單一機房或 Region 故障時可把流量轉到健康位置。'],['Disaster Recovery','把基礎設施與資料複製到隔離 failure domain，降低區域性災難風險。']]},
   {type:'diagram',nodes:[['Global User','Geo / latency signal'],['Global Routing','DNS / Anycast / Accelerator'],['Region A','App + Data'],['Region B','App + Data']],caption:'Global routing 只是第一步；真正困難通常在 data locality 與 consistency。'}
  ]},
  {id:'sd1-s09-p02',title:'Traffic Failover 成功，不代表資料也準備好了',blocks:[
   {type:'stepper',steps:[['Detect','判斷 Region/endpoint 是否真的 unhealthy，避免過度敏感造成 flap。'],['Route','把新流量切到健康 Region。'],['Data','確認目標 Region 有足夠新鮮、完整、可寫入的資料。'],['Capacity','備援 Region 必須有足夠 capacity 承接突增流量。'],['Recover','原 Region 恢復後，還要定義 failback 與資料重新同步流程。']]},
   {type:'bullets',items:['Cross-region replication 常比同 AZ 有更高延遲，需決定同步或非同步策略。','若 Active-Active 可同時寫多區，要面對 conflict resolution。','若 Active-Passive，切換時要考慮 replica promotion 與 write endpoint。','Infrastructure as Code / automated deployment 能降低兩地設定漂移。']},
   {type:'callout',title:'面試陷阱',text:'「多 Region = 99.999%」不是答案。你必須說明 failure detection、routing、data replication、capacity、RPO/RTO 與 failback。'}
  ]}],
 quiz:[
  {id:'sd1-s09-q1',question:'Multi-Region Failover 時，只把 DNS/流量切過去還不夠，最重要還要確認？',reviewPageId:'sd1-s09-p02',explanation:'備援 Region 必須有可用且足夠新鮮的資料與 capacity，否則 traffic redirect 只會把錯誤移到另一區。',options:[O('a','目標 Region 的資料與容量是否可承接',true),O('b','CSS class 名稱是否相同',false,'不是核心 failover correctness。'),O('c','Browser Cache 是否全部清空',false,'不等於後端可承接 failover。'),O('d','所有 User 是否使用同型號手機',false,'與 Region failover 無關。')]},
  {id:'sd1-s09-q2',question:'Geo Routing 的主要目的之一？',reviewPageId:'sd1-s09-p01',explanation:'依位置/latency/health 等訊號把使用者導向合適 Region，可改善延遲並支援區域故障切換。',options:[O('a','把使用者導向較合適的 Region',true),O('b','讓 Database 不再需要備份',false,'Routing 不取代 backup。'),O('c','保證跨區資料零延遲一致',false,'跨區 replication 仍有延遲與一致性 trade-off。'),O('d','取代所有 Load Balancer',false,'Global routing 與區內 LB 可同時存在。')]},
  {id:'sd1-s09-q3',question:'Active-Active 多 Region 同時接受寫入時，比較容易增加哪種問題？',reviewPageId:'sd1-s09-p02',explanation:'多地同時寫入可能產生 concurrent updates，需要 conflict detection/resolution 與 consistency 策略。',options:[O('a','Write conflict / consistency',true),O('b','HTML tag 數量',false,'不是多區寫入的核心問題。'),O('c','DNS 不再解析',false,'Active-Active 仍可用 global routing。'),O('d','CPU 一定變 0%',false,'沒有這種必然效果。')]},
  {id:'sd1-s09-q4',question:'為什麼要自動化跨 Region Deployment / IaC？',reviewPageId:'sd1-s09-p02',explanation:'降低不同 Region 設定漂移，讓備援環境真的能在事故時啟用。',options:[O('a','降低環境設定漂移與人工錯誤',true),O('b','讓所有資料自動強一致',false,'IaC 管 infrastructure，不直接解決 data consistency。'),O('c','讓 Queue 不需要 Consumer',false,'不同問題。'),O('d','讓 CDN 永遠不會失效',false,'部署自動化無法保證第三方 CDN 零故障。')]}
 ]
}
);
})();