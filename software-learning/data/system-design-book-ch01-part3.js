(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_01;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
chapter.sections.push(
{
 id:'sd1-s10',order:10,title:'Message Queue：把同步耦合拆成可緩衝的非同步流程',duration:'24–32 分鐘',summary:'理解 Producer / Queue / Consumer、Backlog、獨立擴縮，以及為什麼 Queue 能吸收尖峰卻不能讓工作消失。',
 research:[{label:'ByteByteGo — Message queue section',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'},{label:'Amazon SQS Documentation',url:'https://docs.aws.amazon.com/sqs/'}],
 pages:[
  {id:'sd1-s10-p01',title:'Queue 解的是「時間上的解耦」',blocks:[
   {type:'diagram',nodes:[['Producer','Web / API'],['Queue','Durable buffer'],['Consumer','Workers'],['Result Store','DB / Object Storage']],caption:'Producer 只要成功把工作交給 Queue，就不必同步等 Consumer 完成。'},
   {type:'p',text:'Queue 把「收到請求」與「真正處理工作」分開。Producer 與 Consumer 可以在不同速度、不同可用性下工作，彼此也可獨立擴縮。'},
   {type:'bullets',items:['適合：圖片處理、Email、報表、非即時同步第三方服務、事件處理。','不適合：使用者當下必須立刻知道最終結果的強同步操作，除非你設計 polling/callback/status workflow。','Queue 是 buffer，不是無限容量；Consumer 長期跟不上，backlog 仍會持續增加。']}
  ]},
  {id:'sd1-s10-p02',title:'Backlog 是一個重要 Scaling Signal',blocks:[
   {type:'stepper',steps:[['Spike','短時間 Producer 產生大量 jobs。'],['Buffer','Queue 暫時累積 backlog，保護 Consumer 與 downstream。'],['Scale Consumer','依 queue depth / age 增加 workers。'],['Drain','處理速度大於產生速度後，backlog 逐步下降。'],['Scale In','長時間 queue 空時，減少 workers 降低成本。']]},
   {type:'callout',title:'不要只看 Queue Length',text:'真正重要還有 oldest message age、processing latency、retry count、DLQ、consumer error rate。Queue 很長可能只是尖峰，也可能是 Consumer 壞掉。'},
   {type:'p',text:'在可靠系統裡，Consumer 要預期重試與重複投遞的可能性，因此工作最好設計成 idempotent，或用 deduplication / transactional workflow 管理副作用。'}
  ]}],
 quiz:[
  {id:'sd1-s10-q1',question:'Message Queue 最核心的架構價值？',reviewPageId:'sd1-s10-p01',explanation:'在 Producer 與 Consumer 之間提供非同步 buffer，降低時間耦合並允許兩側獨立擴縮。',options:[O('a','Decouple Producer 與 Consumer',true),O('b','取代所有 Database',false,'Queue 主要是傳遞/緩衝工作，不等於完整 source of truth。'),O('c','保證任何工作 0ms 完成',false,'Queue 反而接受工作可能稍後處理。'),O('d','讓 HTTP 不再存在',false,'Web API 仍可用 HTTP 把工作送入 Queue。')]},
  {id:'sd1-s10-q2',question:'Queue backlog 持續增加數小時，最合理優先檢查？',reviewPageId:'sd1-s10-p02',explanation:'要比較 produce rate 與 consume rate，並檢查 Consumer error/latency/downstream，而不是只盲目增加 Queue 容量。',options:[O('a','Consumer 是否跟不上或失敗',true),O('b','直接刪除所有 messages',false,'這會造成資料/工作遺失且沒解 root cause。'),O('c','把 TTL 設 0 就會自動處理',false,'TTL 不會提高 Consumer throughput。'),O('d','把 DNS 換顏色',false,'與 backlog 無關。')]},
  {id:'sd1-s10-q3',question:'為什麼 Consumer 常需要 Idempotency？',reviewPageId:'sd1-s10-p02',explanation:'分散式 Queue 可能 retry / redeliver；相同 message 重處理時不應造成重複扣款、重複寄信等副作用。',options:[O('a','避免重複處理造成重複副作用',true),O('b','讓 Queue 變成 CDN',false,'Idempotency 不會改變元件類型。'),O('c','讓所有 message 永遠只投遞一次',false,'Idempotency 是在無法完全假設 exactly-once 時保護副作用。'),O('d','讓 Consumer 不需要 error handling',false,'仍然需要 retry、DLQ、alert。')]},
  {id:'sd1-s10-q4',question:'哪個工作最適合先放 Queue 非同步處理？',reviewPageId:'sd1-s10-p01',explanation:'圖片 resize 通常耗時且不必阻塞 upload API 到完成，可由 worker 背景處理。',options:[O('a','上傳後產生多尺寸縮圖',true),O('b','登入密碼立即驗證是否正確',false,'這通常是同步 response path。'),O('c','DNS lookup',false,'不是一般 app job queue 的責任。'),O('d','回傳 HTTP status line',false,'屬同步 HTTP response。')]}
 ]
},
{
 id:'sd1-s11',order:11,title:'Logging、Metrics、Tracing 與 Automation：系統大了以後你必須看得見',duration:'24–34 分鐘',summary:'從主機指標、服務指標到 Business Metrics，再補上 Log / Trace 與自動化部署，建立可營運的大型系統。',
 research:[{label:'ByteByteGo — Logging, metrics, automation',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'},{label:'OpenTelemetry — Observability primer',url:'https://opentelemetry.io/docs/concepts/observability-primer/'}],
 pages:[
  {id:'sd1-s11-p01',title:'Logs / Metrics / Traces 回答不同問題',blocks:[
   {type:'compare',items:[['Metrics','數值聚合：QPS、error rate、P95 latency、CPU、queue depth。適合趨勢與告警。'],['Logs','離散事件與上下文：某個 exception、特定 user/request 的錯誤細節。'],['Traces','把一個 Request 跨多服務的 spans 串起來，找出延遲與失敗發生在哪一跳。']]},
   {type:'p',text:'Observability 不是「裝一個 Dashboard」。它要求服務持續輸出足夠 telemetry，讓你在不知道內部哪裡壞的情況下，仍能從外部訊號推理 root cause。'},
   {type:'bullets',items:['Host：CPU、RAM、Disk I/O、Network。','Service：Request Rate、Error Rate、Latency、Saturation。','Data Tier：Query latency、connections、replication lag、cache hit rate。','Business：DAU、conversion、orders、revenue；系統健康不能只看 CPU。']}
  ]},
  {id:'sd1-s11-p02',title:'Automation 是降低大型系統人為變異',blocks:[
   {type:'p',text:'機器與 Region 變多後，靠 SSH 手動改設定、手動部署與手動回滾會快速失控。CI/CD、Infrastructure as Code、automated tests、health-based rollout 能把變更變成可重複流程。'},
   {type:'stepper',steps:[['Build','每次 commit 可重複產出 artifact。'],['Test','Unit / integration / security / smoke 自動驗證。'],['Deploy','相同 artifact 依策略部署到環境。'],['Observe','以 error/latency/health signals 驗證 rollout。'],['Rollback','達失敗條件時可快速回到已知健康版本。']]},
   {type:'callout',title:'面試加分',text:'談 Auto Scaling 前先說 Scaling Metric。Web 可看 CPU/request concurrency；Queue worker 更常看 backlog / message age；DB 不應只靠 CPU 就盲目加節點。'}
  ]}],
 quiz:[
  {id:'sd1-s11-q1',question:'要追查一個 Request 跨 8 個服務到底慢在哪一跳，最直接的 telemetry？',reviewPageId:'sd1-s11-p01',explanation:'Distributed Trace 把 request 的 spans 串成呼叫鏈，最適合跨服務定位 latency。',options:[O('a','Distributed Trace',true),O('b','只有 CPU 平均值',false,'CPU metric 不足以還原單一 request 的跨服務路徑。'),O('c','CDN asset 名稱',false,'不是 request trace。'),O('d','DNS A record',false,'只描述解析，不能追完整服務鏈。')]},
  {id:'sd1-s11-q2',question:'P95 API latency 屬於哪一類主要訊號？',reviewPageId:'sd1-s11-p01',explanation:'Latency percentile 是 service metric。',options:[O('a','Metric',true),O('b','Source code comment',false,'註解不是 telemetry。'),O('c','Shard key',false,'是資料分片欄位。'),O('d','Static asset',false,'不是 observability signal。')]},
  {id:'sd1-s11-q3',question:'多 Region 仍靠人工 SSH 改 config，最大風險之一？',reviewPageId:'sd1-s11-p02',explanation:'環境容易 configuration drift，事故時也難以重現與快速恢復。',options:[O('a','Configuration Drift 與人為錯誤',true),O('b','HTTP 自動變 stateful',false,'部署方式不會改 HTTP protocol 定義。'),O('c','所有 Cache 都變 CDN',false,'無關。'),O('d','SQL 無法使用 JOIN',false,'無直接因果。')]},
  {id:'sd1-s11-q4',question:'Queue Worker Auto Scaling 最值得搭配哪個指標？',reviewPageId:'sd1-s11-p02',explanation:'Queue depth / oldest message age 能直接反映 backlog 是否被消化。',options:[O('a','Queue depth / message age',true),O('b','網站 Logo 寬度',false,'與 processing capacity 無關。'),O('c','Browser tab 數量',false,'不是 worker backlog 指標。'),O('d','DNS TTL only',false,'不反映 Queue processing 壓力。')]}
 ]
},
{
 id:'sd1-s12',order:12,title:'Database Scaling：Vertical、Sharding、Shard Key 與 Hotspot',duration:'34–45 分鐘',summary:'把資料層從單機升級到 Sharding，理解真正困難在分片鍵、路由、重分片與跨 Shard 查詢。',
 research:[{label:'ByteByteGo — Database scaling section',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'},{label:'MongoDB Docs — Sharding',url:'https://www.mongodb.com/docs/manual/sharding/'}],
 pages:[
  {id:'sd1-s12-p01',title:'DB Scale Up 仍然是第一個合理選項',blocks:[
   {type:'compare',items:[['Vertical DB Scaling','加 CPU/RAM/IOPS/Storage，維持單一邏輯資料庫，簡單但有成本與硬體天花板。'],['Horizontal / Sharding','把 Dataset + Load 分散到多個 shard，容量可擴展但 routing、query、rebalancing 複雜。']]},
   {type:'p',text:'在進 Sharding 前，應先確認 index、query plan、N+1、connection pool、lock/contention、cache/read replica 等較低成本優化是否已處理。Sharding 是突破單機資料/吞吐上限的工具，不是「DB 慢」的第一反射。'}
  ]},
  {id:'sd1-s12-p02',title:'Shard Key 決定資料分布，也決定 Query 能不能精準路由',blocks:[
   {type:'diagram',nodes:[['Request','user_id=123'],['Router','hash/range shard key'],['Shard 0','subset'],['Shard 1','subset'],['Shard N','subset']],caption:'Query 帶 shard key 時可 targeted routing；缺少 shard key 時可能需要 scatter/gather。'},
   {type:'bullets',items:['好的 shard key：cardinality 足夠、分布均勻、符合主要 access pattern。','單調遞增 key 做 range sharding 可能把最新寫入集中到同一 shard。','Hashed sharding 更均勻，但 range query 可能更難 targeted。','Query 不帶 shard key 時，router 可能查多個甚至所有 shards。']}
  ]},
  {id:'sd1-s12-p03',title:'Sharding 的四個代價',blocks:[
   {type:'stepper',steps:[['Resharding','新增 shard 或分布失衡時，需要搬資料與更新 routing metadata。'],['Hotspot','Celebrity / hot tenant / hot key 可能讓單 shard 過載，即使總體很平均。'],['Cross-shard Query','JOIN、aggregate、sort、transaction 可能變成多節點協調。'],['Operations','Backup、restore、schema migration、capacity planning、failover 都變得更複雜。']]},
   {type:'callout',title:'真正的面試問題',text:'當你說「我要 Sharding」，面試官下一句通常會問：Shard Key 是什麼？為什麼？如何避免 hotspot？新增 shard 怎麼 re-balance？'}
  ]}],
 quiz:[
  {id:'sd1-s12-q1',question:'Sharding 與 Replication 的核心差別？',reviewPageId:'sd1-s12-p01',explanation:'Sharding 分割 dataset/load；Replication 建立副本。',options:[O('a','Sharding 分資料；Replication 複製資料',true),O('b','兩者只是不同名字',false,'你把 partitioning 與 redundancy 混在一起。'),O('c','Replication 一定提高 write throughput',false,'典型 single-primary replica 不會自動分散 writes。'),O('d','Sharding 是 Browser feature',false,'Sharding 是 data tier scaling。')]},
  {id:'sd1-s12-q2',question:'Shard Key 最重要的設計目標之一？',reviewPageId:'sd1-s12-p02',explanation:'讓資料與 workload 盡可能均勻分布，同時支援主要查詢的 targeted routing。',options:[O('a','均勻分布且符合 Access Pattern',true),O('b','永遠選最短欄位名',false,'欄位名稱長度與分布品質無關。'),O('c','讓所有資料都進同一 Shard',false,'這失去水平擴展效果。'),O('d','讓每次 Query 都查所有 Shards',false,'Scatter/gather 通常是要降低的成本。')]},
  {id:'sd1-s12-q3',question:'某明星所有資料都集中 Shard 3，該 shard CPU 100%，其他 shard 20%。這是？',reviewPageId:'sd1-s12-p03',explanation:'典型 Hotspot / Celebrity Problem：總體有多 shard，但 workload 不均。',options:[O('a','Hotspot / Celebrity Problem',true),O('b','Cache Hit',false,'不是 cache 命中問題。'),O('c','HTTP Keep-Alive',false,'與資料分片不均無關。'),O('d','DNS Propagation',false,'不是 DNS 問題。')]},
  {id:'sd1-s12-q4',question:'Query 不包含 Shard Key，最可能的代價？',reviewPageId:'sd1-s12-p02',explanation:'Router 可能無法精準定位，需 scatter/gather 到多個 shards，增加 latency 與資源。',options:[O('a','可能需要 Scatter/Gather',true),O('b','自動 O(1) 且只查一台',false,'缺 shard key 反而可能無法 targeted。'),O('c','所有 Replica 自動 Promotion',false,'與 failover 無關。'),O('d','CDN 會代替 DB Query',false,'CDN 不會自動執行 DB query。')]}
 ]
},
{
 id:'sd1-s13',order:13,title:'Millions of Users and Beyond：把所有元件串成「有理由的架構」',duration:'26–36 分鐘',summary:'不再新增名詞，改練習從瓶頸到解法的完整推導，以及如何在面試中說清楚每一次演化。',
 research:[{label:'ByteByteGo — Millions of users and beyond',url:'https://bytebytego.com/courses/system-design-interview/scale-from-zero-to-millions-of-users'}],
 pages:[
  {id:'sd1-s13-p01',title:'從零到百萬不是一張圖，是一連串 Trigger → Change',blocks:[
   {type:'stepper',steps:[['Baseline','Single Server：先工作。'],['Resource / Availability','App Scale Up → LB + multiple Web Servers。'],['Data Availability / Read Load','DB Replication + read split。'],['Latency / DB Pressure','Cache + CDN。'],['Elastic Web Tier','Externalize state → Stateless + Auto Scaling。'],['Global Users','Multi-location routing + data replication。'],['Slow / Async Work','Message Queue + Workers。'],['Operate at Scale','Logs/Metrics/Traces + automation。'],['Data Ceiling','Shard data tier when justified.']]},
   {type:'callout',title:'真正要背的是「因果」',text:'每個元件前面都應該有一句「因為 X 指標/需求出現，所以加入 Y；代價是 Z；我們用 W 監控」。'}
  ]},
  {id:'sd1-s13-p02',title:'大型架構的八個檢查點',blocks:[
   {type:'bullets',items:['Web Tier 是否 Stateless？','每個重要 Tier 是否有 Redundancy / Failover？','Cache 是否有 TTL、Hit Rate、Cold Start 與 outage 策略？','Static content 是否適合 CDN？','是否需要 Multi-AZ / Multi-Region？資料怎麼同步？','Async 工作是否適合 Queue？Consumer 是否可 Idempotent？','是否有 Logs / Metrics / Traces / Alert / automated deployment？','Data Tier 是否真的需要 Sharding？Shard Key 與 hotspot 怎麼處理？']},
   {type:'p',text:'這八點不是固定答案，而是 Review Checklist。不同產品會在不同位置停下；不需要的元件就是不要加。'}
  ]},
  {id:'sd1-s13-p03',title:'面試回答模板：Problem → Evidence → Change → Trade-off',blocks:[
   {type:'code',text:'Problem: Web Server CPU 在尖峰達 90%，且單機故障不可接受。\nEvidence: P95 latency 隨 CPU 飆升；DB 仍健康。\nChange: 加 Load Balancer + 多個 stateless Web instances。\nTrade-off: 多節點 deployment/state/observability 複雜度增加。\nMeasure: healthy targets、request rate、P95/P99、5xx、CPU。'},
   {type:'p',text:'如果你每次加元件都能說清楚這五句，系統設計回答就從「背名詞」變成「工程判斷」。'},
   {type:'callout',title:'Chapter 1 結束標準',text:'你不只要認得 Load Balancer、Cache、CDN、Replica、Queue、Shard，而要能從一個單機產品逐步推導出它們。完成小節後，進入 30 題 Chapter Exam。'}
  ]}],
 quiz:[
  {id:'sd1-s13-q1',question:'Chapter 1 最核心的學習方法是？',reviewPageId:'sd1-s13-p01',explanation:'從 observable bottleneck / requirement 出發，逐步加入解法並說明 trade-off。',options:[O('a','背完整最終架構圖',false,'最終圖沒有需求脈絡時容易變成堆名詞。'),O('b','Problem → Evidence → Change → Trade-off',true),O('c','每題一律 Kubernetes + Kafka',false,'工具要對應 bottleneck。'),O('d','永遠先 Sharding',false,'Sharding 是高成本 data scaling 手段。')]},
  {id:'sd1-s13-q2',question:'下列哪個最不像成熟的架構理由？',reviewPageId:'sd1-s13-p03',explanation:'「大家都用」沒有需求、證據或 trade-off 支撐。',options:[O('a','因 read QPS 高且 DB CPU 飽和，加 Read Replica',false),O('b','因 static asset 全球 latency 高，加 CDN',false),O('c','因大家都用 Kafka，所以先加 Kafka',true),O('d','因 web state 綁單機妨礙 autoscale，外移 session',false)]},
  {id:'sd1-s13-q3',question:'大型系統 Review 時，為什麼要逐 Tier 看 Failure Domain？',reviewPageId:'sd1-s13-p02',explanation:'某 Tier 有 redundancy 不代表 shared dependency 有 redundancy；整體可用性受最弱 failure path 影響。',options:[O('a','避免只強化 Web Tier 卻留下 DB/Cache 等單點',true),O('b','因為每個 Tier 一定要使用不同程式語言',false,'語言多樣性不是 resilience 目標。'),O('c','因為所有 Tier 都必須 Sharding',false,'不同 Tier 有不同需求。'),O('d','因為 CDN 可以修復所有 failure',false,'CDN 只能處理特定內容與路徑。')]},
  {id:'sd1-s13-q4',question:'如果系統目前單機足夠、SLA 低、流量穩定，最成熟的選擇？',reviewPageId:'sd1-s13-p01',explanation:'保持簡單並建立監控/容量門檻；當需求或瓶頸出現再演化。',options:[O('a','先保持簡單並定義觸發升級的指標',true),O('b','立即做 12 Region Active-Active',false,'複雜度與成本沒有需求支撐。'),O('c','立即 Shard 所有 table',false,'沒有 data ceiling 證據。'),O('d','刪掉監控，等使用者回報',false,'即使架構簡單也應保留基本 observability。')]}
 ]
}
);

const Q=(id,difficulty,question,reviewPageId,explanation,options)=>({id,difficulty,question,reviewPageId,explanation,options});
chapter.finalExam=[
// 基礎 10
Q('sd1-ex-e01','easy','DNS 在最小 Web 架構中最直接負責什麼？','sd1-s01-p02','把 domain name 解析到可連線的位址/服務入口。',[O('a','名稱解析',true),O('b','執行 SQL',false,'把網路名稱解析與 data tier 混淆。'),O('c','圖片 resize',false,'這是 application/worker 工作。'),O('d','保存 Session',false,'Session 是 application state。')]),
Q('sd1-ex-e02','easy','Scale Up 的定義？','sd1-s03-p01','提升單一節點的 CPU/RAM/Disk 等容量。',[O('a','增加單機資源',true),O('b','增加 Server 數量',false,'這是 Scale Out。'),O('c','建立資料副本',false,'這是 replication。'),O('d','切分資料',false,'這是 sharding/partitioning。')]),
Q('sd1-ex-e03','easy','Load Balancer 後端 Target 連續 Health Check 失敗，通常應？','sd1-s04-p02','暫停把新流量送至 unhealthy target。',[O('a','移出健康流量池',true),O('b','增加它的流量',false,'會放大失敗。'),O('c','刪 DB',false,'不是 target health 的修復。'),O('d','清 DNS 所有紀錄',false,'故障範圍過大。')]),
Q('sd1-ex-e04','easy','Read Replica 最直接分擔？','sd1-s05-p02','read-heavy workload。',[O('a','讀流量',true),O('b','所有寫入',false,'single-primary 模型寫入仍主要到 primary。'),O('c','CDN 流量',false,'不同 tier。'),O('d','DNS query',false,'不同系統。')]),
Q('sd1-ex-e05','easy','Cache Hit 表示？','sd1-s06-p01','所需資料已在 cache，可不回源。',[O('a','Cache 找到資料',true),O('b','一定要查 DB',false,'這是 miss path。'),O('c','Cache 掛了',false,'Hit 表示 cache 正常命中。'),O('d','資料一定強一致',false,'Cache 仍可能 stale。')]),
Q('sd1-ex-e06','easy','CDN 的 Origin 是？','sd1-s07-p01','Edge miss 時取得原始內容的來源。',[O('a','原始內容來源',true),O('b','使用者 Browser',false,'Browser 是 client。'),O('c','Shard Key',false,'資料分片概念。'),O('d','Health Check',false,'不是內容來源。')]),
Q('sd1-ex-e07','easy','Stateless Web Tier 的核心？','sd1-s08-p02','任何健康 Web instance 都可服務 request，state 不綁單機。',[O('a','任何健康 instance 可接 request',true),O('b','整個系統沒有任何 state',false,'state 仍存在 shared store。'),O('c','每個 user 固定 Server',false,'這是 stateful/sticky。'),O('d','不需資料庫',false,'無此推論。')]),
Q('sd1-ex-e08','easy','Message Queue 中發送工作的一方通常稱？','sd1-s10-p01','Producer / Publisher。',[O('a','Producer',true),O('b','Replica',false,'Replica 是資料副本。'),O('c','CDN Edge',false,'不是 queue sender 的角色。'),O('d','Shard',false,'資料分片。')]),
Q('sd1-ex-e09','easy','P95 latency、error rate、QPS 最主要屬於？','sd1-s11-p01','Metrics。',[O('a','Metrics',true),O('b','Shard Keys',false,'資料路由欄位。'),O('c','Static Assets',false,'內容資產。'),O('d','DNS records',false,'網域解析紀錄。')]),
Q('sd1-ex-e10','easy','Sharding 做的是？','sd1-s12-p01','把 dataset/load 分散到多個 shard。',[O('a','分割資料與負載',true),O('b','只複製完整資料',false,'這是 replication。'),O('c','只 Cache 圖片',false,'與 CDN/cache 混淆。'),O('d','只做 HTTP routing',false,'sharding 是 data tier。')]),
// 應用 10
Q('sd1-ex-m01','medium','網站單機 CPU 95%，DB 很健康，且短期只需多撐 2 倍流量。最低複雜度的第一個方案？','sd1-s03-p02','先評估 Scale Up，若可低成本解決短期 CPU ceiling，不必立即引入分散式複雜度。',[O('a','先評估 Scale Up',true),O('b','立即 DB Sharding',false,'DB 並非瓶頸。'),O('c','先 Multi-Region',false,'需求沒有 location/DR。'),O('d','先 Queue 所有 GET',false,'同步 GET latency 不一定適合 queue。')]),
Q('sd1-ex-m02','medium','三台 Web Server 中一台 process 已死，但 LB 仍把流量送過去。最應檢查？','sd1-s04-p02','Health Check path/threshold/registration。',[O('a','LB Health Check 設定',true),O('b','Shard Key',false,'不是 data routing。'),O('c','CDN TTL',false,'不控制 app target health。'),O('d','DB index',false,'process dead 與 index 無關。')]),
Q('sd1-ex-m03','medium','使用者剛改名字後立刻讀到舊名字，讀取路徑走 Replica。最可能？','sd1-s05-p03','Replication Lag。',[O('a','Replication Lag',true),O('b','DNS TTL',false,'題目指出的是 DB fresh read。'),O('c','Queue Backlog',false,'沒有 queue path。'),O('d','CDN asset version',false,'與 user DB record 無關。')]),
Q('sd1-ex-m04','medium','Cache Hit Rate 從 95% 突降到 10%，DB QPS 同時暴增。最合理第一步？','sd1-s06-p02','檢查大量 expiry/flush/eviction、cold start 與 cache health。',[O('a','檢查 Expiry/Eviction/Cold Start',true),O('b','直接刪 DB index',false,'會惡化 DB。'),O('c','關閉所有 metrics',false,'失去判斷依據。'),O('d','把 TTL 全設 0',false,'會讓 hit rate 更差。')]),
Q('sd1-ex-m05','medium','全球使用者下載相同 4MB 圖片，Origin 頻寬很高。最直接改善？','sd1-s07-p01','CDN edge caching。',[O('a','CDN',true),O('b','DB Read Replica',false,'圖片傳輸瓶頸不是 DB read。'),O('c','Topological Sort',false,'演算法無關。'),O('d','Sticky Session',false,'不解靜態內容。')]),
Q('sd1-ex-m06','medium','新增 Web Server 後，部分登入使用者突然變未登入；Session 只存在 local RAM。根因？','sd1-s08-p01','State 綁定單機，request 被 LB 分配到其他 instance。',[O('a','Stateful Session locality',true),O('b','Replica Lag',false,'Session 並未存在 DB replica。'),O('c','CDN Miss',false,'登入 session 不是 static asset。'),O('d','Shard Hotspot',false,'尚未涉及 sharding。')]),
Q('sd1-ex-m07','medium','Region A 掛掉，流量成功切到 Region B，但登入資料缺了一部分。哪一層設計不足？','sd1-s09-p02','跨 Region data replication / synchronization。',[O('a','Data Synchronization',true),O('b','CSS minify',false,'與 failover data 無關。'),O('c','Browser LocalStorage',false,'題目是後端區域資料缺失。'),O('d','Image CDN',false,'登入資料不是圖片 edge cache。')]),
Q('sd1-ex-m08','medium','圖片處理平均 8 秒，Upload API 必須 300ms 內回應。最佳方向？','sd1-s10-p01','Upload 接收後 enqueue job，Worker 非同步處理並提供 status。',[O('a','Queue + Async Worker',true),O('b','讓 HTTP Request 同步等 8 秒',false,'違反 latency requirement。'),O('c','把圖片存 DNS',false,'DNS 不是內容儲存。'),O('d','增加 DB Replica 就會縮圖',false,'replica 不執行 image transform。')]),
Q('sd1-ex-m09','medium','某 Request 偶發慢 3 秒，需要知道跨 6 個服務哪一跳最慢。最適合？','sd1-s11-p01','Distributed tracing。',[O('a','Trace',true),O('b','只看 DAU',false,'business metric 不能定位單 request path。'),O('c','只看 CDN TTL',false,'無法還原 6 service path。'),O('d','只看單台 Disk 空間',false,'訊息不足。')]),
Q('sd1-ex-m10','medium','user_id % 4 分片後，某些企業大客戶集中同一 shard。應優先重新檢視？','sd1-s12-p02','Shard key / distribution 與 access pattern。',[O('a','Shard Key / 分布策略',true),O('b','HTTP method',false,'與 data distribution 無關。'),O('c','CSS breakpoint',false,'前端議題。'),O('d','TLS certificate color',false,'無關。')]),
// 進階 10
Q('sd1-ex-h01','hard','App Server 已 6 台且健康，但所有 Request 都依賴同一台 DB；DB 掛掉全站停。這說明？','sd1-s13-p02','Web Tier redundancy 沒有消除 Data Tier SPOF；要按 failure domain 逐 tier 設計。',[O('a','只做 Web redundancy 不足以保證整體 HA',true),O('b','LB 沒有價值',false,'LB 解 Web tier 問題，只是整體仍有其他單點。'),O('c','應刪除所有 DB',false,'資料層仍需要，只需設計 HA。'),O('d','一定要取消 HTTP',false,'協定不是根因。')]),
Q('sd1-ex-h02','hard','Cache outage 時直接無限制 fail-open 到 DB，造成 DB 也掛掉。這屬於？','sd1-s06-p03','Cascading failure；需要限流、serve stale、backpressure 或 capacity guardrail。',[O('a','Cascading Failure',true),O('b','正常 Cache Hit',false,'Cache 已 outage。'),O('c','Shard Rebalancing',false,'沒有 shard migration。'),O('d','DNS Round Robin',false,'不是 name routing。')]),
Q('sd1-ex-h03','hard','Read Replica 能提升讀吞吐，但產品要求「改密碼後下一次讀一定看到新值」。應補什麼？','sd1-s05-p03','Read-your-writes / critical read route to primary 或更強 consistency policy。',[O('a','Read-your-writes 策略',true),O('b','把 Replica 再加 10 台就一定一致',false,'數量不消除 asynchronous lag。'),O('c','CDN Cache 密碼',false,'敏感動態資料不應這樣解。'),O('d','把 TTL 加長',false,'反而更可能 stale。')]),
Q('sd1-ex-h04','hard','CDN asset TTL 設 1 天，但重大 JS Bug 必須 5 分鐘內修掉。最佳長期做法？','sd1-s07-p02','版本化 asset URL + 必要 purge/invalidation；不要靠所有 client 等 TTL。',[O('a','Versioned URL 並支援 Purge',true),O('b','等 24 小時',false,'不符合修復時間。'),O('c','把所有 TTL 永久設 0',false,'犧牲 CDN cache 效益。'),O('d','增加 DB Shard',false,'與 asset cache 無關。')]),
Q('sd1-ex-h05','hard','Stateful Web Tier 使用 Sticky Session，某 Server 故障後該 Server 的使用者全部失去 Session。根本性改善？','sd1-s08-p02','把 session state 外移到 shared/durable store，使任何 instance 可承接。',[O('a','Externalize Session State',true),O('b','把 Sticky Session timeout 拉更長',false,'Server 已故障，local state 仍不可達。'),O('c','把 DNS TTL 拉長',false,'不解 local state loss。'),O('d','關閉 Health Check',false,'會讓故障更難隔離。')]),
Q('sd1-ex-h06','hard','Active-Passive 跨 Region，備援平時只有 10% capacity。主區故障切流後備援立即過載。前置設計缺失？','sd1-s09-p02','Failover capacity planning / scale-up readiness 未驗證。',[O('a','Failover Capacity Planning',true),O('b','多一個 CDN Logo',false,'不能提供 backend compute capacity。'),O('c','更多 SQL JOIN',false,'反而可能更重。'),O('d','關閉 Metrics',false,'不能增加 capacity。')]),
Q('sd1-ex-h07','hard','Queue oldest-message age 持續增加，但 queue depth 偶爾下降。為何仍需警戒？','sd1-s10-p02','舊工作可能被 starvation/retry 卡住，單看 length 無法反映處理延遲與 stuck messages。',[O('a','Oldest Age 揭露 backlog 品質與延遲',true),O('b','Queue Length 下降就保證所有工作健康',false,'可能仍有老訊息一直失敗。'),O('c','Message Age 與 Consumer 無關',false,'Consumer throughput/error 會直接影響 age。'),O('d','應立刻刪掉所有老訊息',false,'先找 root cause / DLQ 策略，不能盲刪。')]),
Q('sd1-ex-h08','hard','服務有完整 Logs，但只能知道「出錯了」，不知道跨服務路徑與哪個 dependency 慢。下一步 Observability 補強？','sd1-s11-p01','加入 correlated trace/span context；logs 與 traces 互補。',[O('a','Distributed Tracing + correlation',true),O('b','只印更多無 Request ID 的文字',false,'上下文仍難串接。'),O('c','移除 Metrics',false,'會降低可觀測性。'),O('d','關閉 Automation',false,'不會改善 request path visibility。')]),
Q('sd1-ex-h09','hard','Hashed Sharding 分布很平均，但產品大量做 user_id range scan。可能 Trade-off？','sd1-s12-p02','Hash 打散相近 key，range query 可能跨多 shards，targeting 變差。',[O('a','Range Query 可能需要更多 Scatter/Gather',true),O('b','Hashed Sharding 保證所有 range 只在一 shard',false,'hash 正是把相近原值打散。'),O('c','Hash 會自動變 Replication',false,'分片與副本不同。'),O('d','Range Query 會變 CDN Hit',false,'不同層。')]),
Q('sd1-ex-h10','hard','面試中最能證明你不是在背架構圖的回答方式？','sd1-s13-p03','對每次變更說明 problem/evidence/change/trade-off/measure。',[O('a','每個元件說出觸發條件、代價與觀測方式',true),O('b','把所有雲服務名字一次念完',false,'缺少因果與 trade-off。'),O('c','一定使用最多元件的圖',false,'複雜不等於正確。'),O('d','避免談 failure',false,'failure handling 是系統設計核心。')])
];
})();