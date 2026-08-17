(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_01;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
chapter.sections.push(
{
 id:'sd1-s06',order:6,title:'快取層：降低延遲、保護下游，但別製造新的事故',duration:'28–38 分鐘',summary:'從旁路快取、存留時間、命中率、淘汰、冷啟動到一致性與故障模式，建立真正可操作的快取判斷。',
 research:[{label:'ByteByteGo — Cache section',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'},{label:'AWS Builders’ Library — Caching challenges and strategies',url:'https://aws.amazon.com/builders-library/caching-challenges-and-strategies'}],
 pages:[
  {id:'sd1-s06-p01',title:'什麼資料值得快取？先看重複使用率',blocks:[
   {type:'lead',text:'快取的價值來自「同一份結果會被很多請求重複使用」。如果每次查詢都不同，命中率會很低，加入快取只會增加複雜度。'},
   {type:'diagram',nodes:[['請求','取得商品 42'],['快取','有命中嗎？'],['資料庫','沒命中才查'],['回填快取','儲存結果與存留時間']],caption:'常見的旁路快取流程：先查快取；沒命中時回到資料來源，再把結果寫回快取。'},
   {type:'bullets',items:['適合：熱門商品、設定檔、權限結果，以及計算昂貴但更新不頻繁的資料。','不適合：每次請求都不同、必須即時反映，或不能接受短暫舊資料的關鍵交易狀態。','要量測：命中率、未命中率、下游請求量、快取 CPU／記憶體使用量與淘汰次數。']}
  ]},
  {id:'sd1-s06-p02',title:'存留時間與快取淘汰：不是資料放進去就好',blocks:[
   {type:'compare',items:[['存留時間太短','命中率下降、回源請求增加，尖峰時可能把資料庫壓垮。'],['存留時間太長','資料可能過期，修改後的舊版本會留在快取裡更久。'],['容量不足','必須設定淘汰策略，例如最近最少使用、最不常使用或先進先出，決定哪些資料先被移除。']]},
   {type:'p',text:'存留時間應由資料更新頻率，以及產品能接受資料過期多久來決定；不要憑感覺填 3600 秒。快取容量與存留時間也要用真實流量分布驗證。'},
   {type:'callout',title:'冷啟動',text:'新節點或整批快取清空後，大量請求會同時回源，可能讓下游服務瞬間承受壓力。部署與故障恢復時尤其危險，因此要考慮快取預熱、請求合併、限流或負載卸除。'}
  ]},
  {id:'sd1-s06-p03',title:'快取一致性與故障：快不代表正確',blocks:[
   {type:'stepper',steps:[['寫入資料庫','資料先成功寫入真正的資料來源。'],['刪除或更新快取','依策略刪除或更新對應的鍵值。'],['並行競爭','資料庫與快取不在同一個交易中時，同時操作可能造成短暫不一致。'],['故障處理','快取掛掉時，要決定是否回源、提供舊資料、限流或降級。']]},
   {type:'bullets',items:['除非產品本身就是具備明確持久性的快取型資料庫，否則快取不應是唯一資料來源；真正的資料來源必須能在快取遺失後重建資料。','整個快取叢集故障時，所有請求同時回到資料庫，可能造成第二次事故。','熱門鍵值失效會造成大量請求同時回源；可用存留時間隨機抖動、請求鎖／合併，以及「提供舊資料、背景重新驗證」等策略降低衝擊。']}
  ]}],
 quiz:[
  {id:'sd1-s06-q1',question:'哪種資料最適合優先評估快取？',reviewPageId:'sd1-s06-p01',explanation:'高頻讀取、低頻更新，而且能接受短暫舊資料的資料，最容易得到高命中率。',options:[O('a','每次請求都不同，而且只會查一次的資料',false,'這類資料幾乎沒有重複讀取，快取命中率通常很低。'),O('b','高頻讀取、低頻更新，而且能接受短暫過期的熱門資料',true),O('c','唯一的付款真實紀錄，而且不能接受舊資料',false,'付款狀態需要可靠的真實來源；快取短暫過期可能造成錯誤判斷。'),O('d','只因為 Redis 很快，就把所有資料都放進去',false,'應先看資料的讀取模式、一致性與成本，不能只看工具速度。')]},
  {id:'sd1-s06-q2',question:'存留時間設得太短，最直接的風險是什麼？',reviewPageId:'sd1-s06-p02',explanation:'資料更快過期，快取未命中增加，更多請求會回到資料庫或下游服務。',options:[O('a','命中率下降、回源請求增加',true),O('b','資料永遠不會更新',false,'存留時間越短，反而越常重新取得新資料。'),O('c','所有快取永遠塞滿',false,'存留時間短會讓資料更快到期，不是更容易永久占滿。'),O('d','網域名稱系統解析失效',false,'網域名稱系統的存留時間與應用程式快取的存留時間是不同問題。')]},
  {id:'sd1-s06-q3',question:'整個快取叢集突然被清空，最需要警戒的次生問題是什麼？',reviewPageId:'sd1-s06-p02',explanation:'快取變冷後，大量請求同時未命中並回源，可能把資料庫或下游服務壓垮。',options:[O('a','大量快取未命中，同時回源打下游服務',true),O('b','所有請求方法都變成 POST',false,'快取狀態不會改變 HTTP 請求方法。'),O('c','負載平衡器自動變成資料庫',false,'元件的責任不會因快取清空而改變。'),O('d','所有使用者的 IP 都改變',false,'這與快取清空沒有關係。')]},
  {id:'sd1-s06-q4',question:'快取掛掉時，直接讓全部流量無限制回到資料庫，為什麼危險？',reviewPageId:'sd1-s06-p03',explanation:'原本由快取吸收的讀取流量會瞬間落到資料庫，可能把下游壓垮，形成連鎖故障。',options:[O('a','可能造成連鎖故障',true),O('b','因為資料庫不支援任何讀取',false,'資料庫可以讀取，但未必能承受失去快取後的尖峰流量。'),O('c','因為快取掛掉等於網域名稱系統掛掉',false,'快取與網域名稱系統是不同的故障範圍。'),O('d','因為每個請求都會自動變成寫入',false,'回源通常仍是讀取，不會自動變成寫入。')]}
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
 id:'sd1-s09',order:9,title:'跨機房與區域：流量切換、資料複寫與備援',duration:'28–38 分鐘',summary:'理解多機房不是多畫兩個框，而是要同時處理流量導向、資料同步、部署一致性與故障復原。',
 research:[{label:'ByteByteGo — Data centers section',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'},{label:'AWS Well-Architected — Deploy workload to multiple locations',url:'https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_fault_isolation_multiaz_region_system.html'},{label:'AWS Well-Architected — Fail over to healthy resources',url:'https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_withstand_component_failures_failover2good.html'}],
 pages:[
  {id:'sd1-s09-p01',title:'為什麼要跨機房與區域？',blocks:[
   {type:'compare',items:[['降低延遲','把使用者導向較近的區域，減少跨洲往返時間。'],['提高可用性','單一機房或區域故障時，可以把流量切到健康的區域。'],['災難復原','把基礎設施與資料複製到彼此隔離的故障範圍，降低區域性災難風險。']]},
   {type:'diagram',nodes:[['全球使用者','依地理位置與延遲'],['全球流量分派','DNS、Anycast 或加速器'],['區域 A','應用程式與資料'],['區域 B','應用程式與資料']],caption:'全球流量分派只是第一步；真正困難的是資料放在哪裡，以及不同區域如何保持一致。'}
  ]},
  {id:'sd1-s09-p02',title:'流量切換成功，不代表資料已準備好',blocks:[
   {type:'stepper',steps:[['偵測','判斷區域或服務端點是否真的故障，避免過度敏感造成反覆切換。'],['切換流量','把新請求導向健康的區域。'],['確認資料','確認目標區域有足夠新鮮、完整，而且可以寫入的資料。'],['確認容量','備援區域必須有足夠容量承接突然增加的流量。'],['恢復與切回','原區域恢復後，還要定義切回時機，以及資料重新同步的流程。']]},
   {type:'bullets',items:['跨區資料複寫通常比同一可用區更慢，必須決定要同步複寫還是非同步複寫。','如果多個區域同時接受寫入，就必須處理不同區域的資料衝突。','如果只有一個區域接受寫入，切換時要確認備援資料庫能升級接手，並更新寫入端點。','基礎設施即程式碼與自動化部署，可以降低不同區域的設定漂移。']},
   {type:'callout',title:'面試陷阱',text:'「多個區域就等於五個九的可用性」不是完整答案。你還要說明故障偵測、流量切換、資料複寫、容量、可接受的資料遺失量與恢復時間，以及如何切回。'}
  ]}],
quiz:[
  {id:'sd1-s09-q1',question:'跨區故障切換時，只把 DNS 或流量切過去還不夠，最重要還要確認什麼？',reviewPageId:'sd1-s09-p02',explanation:'備援區域必須有足夠新鮮且完整的資料，也要有容量接住流量；否則只是把故障移到另一區。',options:[O('a','目標區域的資料與容量能否承接流量',true),O('b','網頁樣式名稱是否相同',false,'這不會決定後端能否承接故障切換。'),O('c','是否清空所有瀏覽器快取',false,'清空瀏覽器快取無法補足後端資料與容量。'),O('d','所有使用者的手機型號是否相同',false,'與跨區故障切換無關。')]},
  {id:'sd1-s09-q2',question:'依使用者位置把流量導向不同區域，主要目的之一是什麼？',reviewPageId:'sd1-s09-p01',explanation:'可以讓使用者連到較近、較健康的區域，降低延遲，也支援區域故障切換。',options:[O('a','把使用者導向較合適的區域',true),O('b','讓資料庫不再需要備份',false,'流量導向不能取代資料備份。'),O('c','保證跨區資料完全沒有延遲地一致',false,'跨區複寫仍有延遲與一致性取捨。'),O('d','取代所有區域內的負載平衡器',false,'全球流量分派與區域內負載平衡可以同時存在。')]},
  {id:'sd1-s09-q3',question:'多個區域同時接受寫入時，比較容易增加哪種問題？',reviewPageId:'sd1-s09-p02',explanation:'不同區域可能同時修改同一筆資料，因此需要偵測衝突、決定哪個版本有效，並設計一致性規則。',options:[O('a','不同區域同時寫入造成資料衝突與一致性問題',true),O('b','網頁標籤數量增加',false,'與跨區寫入無關。'),O('c','網域名稱一定無法解析',false,'跨區寫入不會讓網域名稱自動失效。'),O('d','CPU 一定變成 0%',false,'沒有這種必然結果。')]},
  {id:'sd1-s09-q4',question:'為什麼要自動化跨區部署與基礎設施設定？',reviewPageId:'sd1-s09-p02',explanation:'自動化可以降低不同區域的設定漂移與人工錯誤，讓備援環境在事故時真的能啟用。',options:[O('a','降低不同區域的設定漂移與人工錯誤',true),O('b','讓所有資料自動保持即時一致',false,'自動化部署能同步設定，不會自動解決資料一致性。'),O('c','讓訊息佇列不需要消費者',false,'佇列仍需要服務取出並處理訊息。'),O('d','保證內容傳遞網路永遠不會故障',false,'自動化部署無法保證外部服務永不故障。')]}
]
}
);
})();
