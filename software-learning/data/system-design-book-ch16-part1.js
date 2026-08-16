(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_16={
 id:'sd-book-16',order:16,title:'持續學習：System Design Interview Playbook',
 subtitle:'把前 15 章從「案例知識」整理成可重複的需求拆解、估算、HLD、Deep Dive、Failure、Observability 與演進方法。',
 objective:'完成後，你能面對陌生題目自行建模、選 building blocks、說明 trade-off、驗證 failure modes，並建立持續閱讀真實架構的學習循環。',
 sections:[],finalExam:[]
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd16-s01',order:1,title:'把 15 章壓縮成 Building Blocks 地圖',duration:'38–54 分鐘',summary:'不再背「某題答案」，而是辨認 traffic、state、data、async、cache、partition、consistency、delivery、observability 等可重用 building blocks。',
 research:[{label:'ByteByteGo — The Learning Continues',url:'https://bytebytego.com/courses/system-design-interview/the-learning-continues'}],
 pages:[
  {id:'sd16-s01-p01',title:'每個案例其實都在重組同一組積木',blocks:[
   {type:'compare',items:[['Traffic','LB、CDN、Rate Limit、Backpressure。'],['State','SQL/KV/Object Storage/Cache。'],['Distribution','Sharding、Consistent Hashing、Replication。'],['Async','Queue/Event Log/Workers。'],['Realtime','WebSocket/Presence/Push。'],['Correctness','Idempotency、Quorum、Version、Cursor。']]}
  ]},
  {id:'sd16-s01-p02',title:'先問「哪個資源會先爆？」',blocks:[
   {type:'bullets',items:['QPS/CPU','connections/memory','storage bytes','egress bandwidth','write amplification','fanout','hot key/shard','external provider quota','human operational complexity']},
   {type:'p',text:'系統設計不是把所有元件都畫上去，而是從量級與 access pattern 找最可能 bottleneck。'}
  ]},
  {id:'sd16-s01-p03',title:'同一元件可以解不同問題，但不能亂套',blocks:[
   {type:'callout',title:'Redis 不是萬用答案',text:'Cache、rate-limit state、presence、sorted set 都能用 Redis，但 durability、query、memory cost、hot key 與 failover semantics 不同。先說 problem，再說 technology。'}
  ]}],
 quiz:[
  MC('sd16-s01-q1','System Design 熟練後最重要能力？','sd16-s01-p01','從陌生題辨認可重用 patterns，而非背固定圖。','辨認 building blocks 與 trade-offs。',[["背完所有公司架構","做不到也沒必要。"],["每題都用同一張圖","錯。"],["只記產品名稱","不足。"]]),
  MC('sd16-s01-q2','為什麼先問哪個資源先爆？','sd16-s01-p02','bottleneck 驅動設計優先順序。','讓 scale decision 有量級依據。',[["為了先畫更多服務","不是。"],["因為所有資源都一樣重要","不一定。"],["只為估成本","也影響 architecture。"]]),
  MC('sd16-s01-q3','說「用 Redis」之前應先說？','sd16-s01-p03','要解的 access pattern/latency/durability 問題。','Problem/requirement first。',[["Redis logo 顏色","無關。"],["版本號越新越好","不是設計理由。"],["所有 state 都放 Redis","過度。"]]),
  MC('sd16-s01-q4','Queue 屬於哪種 building block？','sd16-s01-p01','Async decoupling/buffering。','Async workflow / backpressure buffer。',[["Primary relational join","不是。"],["Client rendering","不是。"],["DNS resolution only","不是。"]])
 ]
},
{
 id:'sd16-s02',order:2,title:'需求 Checklist：Functional、Scale、SLO、Consistency、Security',duration:'40–56 分鐘',summary:'把 Chapter 3 的 clarification 進化成可快速套用的 requirement matrix，避免一開口就畫架構。',
 research:[{label:'ByteByteGo — Framework for System Design Interviews',url:'https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews'}],
 pages:[
  {id:'sd16-s02-p01',title:'七組高價值問題',blocks:[
   {type:'code',text:'1. Core features / out-of-scope\n2. Users / QPS / data size / peak\n3. Read vs write / access pattern\n4. Latency / availability / durability SLO\n5. Consistency / ordering / freshness\n6. Geo / multi-device / offline\n7. Security / privacy / abuse / compliance'}
  ]},
  {id:'sd16-s02-p02',title:'問會改變架構的問題，不是問滿 20 題',blocks:[
   {type:'compare',items:[['高價值','Chat group 最大 100 還是 100k？'],['高價值','Payment 能不能重複扣？'],['高價值','Feed 可 stale 幾秒？'],['低價值','按鈕要藍色還綠色？']]}
  ]},
  {id:'sd16-s02-p03',title:'把 Assumption 寫出來',blocks:[
   {type:'p',text:'面試官不給數字時可以合理假設，但要明講：「我先假設 10M DAU、read:write=100:1、P99<200ms，後面如果需求不同我會調整。」'}
  ]}],
 quiz:[
  MC('sd16-s02-q1','哪種 clarification 最有價值？','sd16-s02-p02','會改變 architecture 的 constraint。','例如 group size、consistency、file size、global scope。',[["UI 顏色","通常不影響 backend。"],["公司 logo","無關。"],["IDE theme","無關。"]]),
  MC('sd16-s02-q2','面試官不給 DAU，最佳做法？','sd16-s02-p03','說明合理 assumption 並繼續。','不要卡住，也不要偷偷假設。',[["拒絕設計","沒必要。"],["假設無限流量","不實際。"],["完全不做估算","少掉訊號。"]]),
  MC('sd16-s02-q3','Consistency 問題為何要早問？','sd16-s02-p01','會直接影響 replication/quorum/async/multi-region 選擇。','Correctness requirement 會塑造 data path。',[["只影響 UI","錯。"],["只影響 storage price","不只。"],["所有系統都 strong consistency","錯。"]]),
  MC('sd16-s02-q4','Security 是否只在最後補一句 HTTPS？','sd16-s02-p01','不是；auth/ACL/abuse/PII 可改 data model與flow。','Security 是 architecture constraint。',[["是，HTTPS 足夠","太淺。"],["只有 payment 才需要","錯。"],["只需 WAF","不足。"]])
 ]
},
{
 id:'sd16-s03',order:3,title:'估算 Playbook：只算會改變設計的數字',duration:'38–54 分鐘',summary:'用 DAU→QPS→Peak、bytes→storage/egress、latency→concurrency、fanout→amplification，把 Chapter 2 變成決策工具。',
 research:[{label:'ByteByteGo — Back-of-the-envelope Estimation',url:'https://bytebytego.com/courses/system-design-interview/back-of-the-envelope-estimation'}],
 pages:[
  {id:'sd16-s03-p01',title:'四類最常用公式',blocks:[
   {type:'code',text:'avg_qps = events_per_day / 86400\npeak_qps ≈ avg × peak_factor\nconcurrency ≈ rps × latency_seconds\nstorage = objects × bytes × retention × overhead'}
  ]},
  {id:'sd16-s03-p02',title:'再加兩種放大量',blocks:[
   {type:'bullets',items:['Fanout amplification：1 post × 10k followers。','Replication/version amplification：logical 1TB → physical >1TB。','Retry amplification：dependency failure × retries。','Codec/rendition amplification：1 source → N outputs。']}
  ]},
  {id:'sd16-s03-p03',title:'估算結尾要接 Architecture Decision',blocks:[
   {type:'p',text:'好的回答不是「算出 23,148 QPS」，而是「peak 100k read QPS、write 500 QPS，所以我先優化 read/cache/CDN，而不是先 sharding writes」。'}
  ]}],
 quiz:[
  MC('sd16-s03-q1','Concurrency 粗估常用？','sd16-s03-p01','RPS × latency seconds。','Little’s-law-like approximation。',[["RPS ÷ storage","無關。"],["DAU × years","不是。"],["CPU × replicas only","不夠。"]]),
  MC('sd16-s03-q2','News Feed 1 post → 1M followers 屬於？','sd16-s03-p02','Fanout amplification。','單一 write 產生大量 downstream work。',[["Read amplification only","主要是 fanout。"],["Storage dedup","不是。"],["DNS amplification","不是。"]]),
  MC('sd16-s03-q3','估算最成熟的收尾？','sd16-s03-p03','把量級轉成設計優先順序。','說明哪個 bottleneck 因此值得解。',[["繼續算無關小數","浪費時間。"],["說數字一定精準","粗估不是。"],["算完就不需 HLD","錯。"]]),
  MC('sd16-s03-q4','Retry amplification 為何危險？','sd16-s03-p02','下游越慢，上游越重試，可能形成 positive feedback。','故障時流量反而放大。',[["Retry 永遠降低 load","相反。"],["只影響 client UI","會打 backend。"],["只在 message queue 發生","HTTP 也會。"]])
 ]
},
{
 id:'sd16-s04',order:4,title:'HLD Playbook：先畫 Flow，再畫 Services',duration:'40–58 分鐘',summary:'以主要 use cases 走資料流，標出 source of truth、cache、async boundary、external dependency；避免先畫 30 個 microservices。',
 research:[{label:'ByteByteGo — Framework / high-level design',url:'https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews'}],
 pages:[
  {id:'sd16-s04-p01',title:'先畫 1–2 條 Critical Flow',blocks:[
   {type:'stepper',steps:[['Client request','入口與 auth'],['Routing','LB/API'],['Source of truth','DB/object/log'],['Async side effects','queue/workers'],['Response','何時 ack'],['Read path','cache/replica/CDN']]}
  ]},
  {id:'sd16-s04-p02',title:'每個 Box 都要能回答三件事',blocks:[
   {type:'code',text:'Responsibility?\nState / source of truth?\nScale / failure boundary?'},
   {type:'p',text:'如果一個 service 拆出來卻沒有獨立 ownership、scale 或 failure reason，可能只是 distributed monolith。'}
  ]},
  {id:'sd16-s04-p03',title:'Ack Boundary 是 Senior-Level 訊號',blocks:[
   {type:'compare',items:[['Chat','durable message 後 ack。'],['Upload','bytes/session durable 後 success。'],['Payment','idempotent transaction state 後 response。'],['Async Job','queue durable 後可回 accepted。']]}
  ]}],
 quiz:[
  MC('sd16-s04-q1','HLD 先畫什麼最有效？','sd16-s04-p01','核心 use-case flow。','從資料流推 components。',[["先畫所有 microservices 名稱","容易 over-engineer。"],["先選 database logo","太早。"],["先畫 Kubernetes nodes","不是題目。"]]),
  MC('sd16-s04-q2','一個 service 沒有獨立 scale/failure/ownership 理由，可能？','sd16-s04-p02','只是多一個 network hop。','Distributed monolith smell。',[["一定更 modular","不一定。"],["一定更快","通常更慢。"],["必須保留","不是。"]]),
  MC('sd16-s04-q3','Ack boundary 為何重要？','sd16-s04-p03','定義 client 看到成功時系統承諾到哪個 durability/correctness。','Failure semantics。',[["只決定 HTTP status 顏色","不是。"],["與資料遺失無關","直接相關。"],["所有系統都 ack 在 memory","不應。"]]),
  MC('sd16-s04-q4','Source of truth 在 HLD 中要明確，因為？','sd16-s04-p01','cache/index/derived data 出錯時要知道從哪重建。','決定 durability/recovery/correctness。',[["所有資料都是 source of truth","不對。"],["只為畫箭頭","不是。"],["Cache 永遠等於 source of truth","通常不是。"]])
 ]
}
);
})();