(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_16;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd16-s05',order:5,title:'Deep Dive Playbook：Trade-off、Failure、Hotspot、Backpressure',duration:'42–60 分鐘',summary:'Deep Dive 不是講 implementation trivia；優先挑 correctness、bottleneck、failure amplification 與最有訊號的 trade-off。',
 research:[{label:'ByteByteGo — Framework / Deep Dive',url:'https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews'}],
 pages:[
  {id:'sd16-s05-p01',title:'五個 Deep Dive 問題',blocks:[
   {type:'code',text:'1. What breaks first?\n2. What happens on retry/duplicate?\n3. What happens on partial failure?\n4. Where is the hot key/shard/fanout?\n5. Which trade-off did we choose and why?'},
   {type:'p',text:'這五題幾乎可以套在 Rate Limiter、Chat、Drive、YouTube、Feed、KV Store。'}
  ]},
  {id:'sd16-s05-p02',title:'Failure Amplification Checklist',blocks:[
   {type:'bullets',items:['retry storm','cache stampede','reconnect storm','fanout explosion','queue backlog','replication lag','cross-region failover traffic','provider throttling']}
  ]},
  {id:'sd16-s05-p03',title:'Backpressure 是「承認 Capacity 有限」',blocks:[
   {type:'compare',items:[['Reject/429','快速保護系統。'],['Queue','延後工作，但 backlog 有上限。'],['Load shedding','丟低優先級工作。'],['Degrade','低畫質、少 suggestions、stale cache。']]}
  ]}],
 quiz:[
  MC('sd16-s05-q1','Deep Dive 最不該變成？','sd16-s05-p01','產品 API trivia/指令背誦而沒有 trade-off。','應聚焦 bottleneck、correctness、failure。',[["討論 failure mode","這是好的。"],["討論 hot key","這是好的。"],["討論 retry semantics","這是好的。"]]),
  MC('sd16-s05-q2','Cache outage 後大量 requests 同時打 DB 是？','sd16-s05-p02','Cache stampede/failure amplification。','流量從 cache failure 放大到 source of truth。',[["正常 sharding","不是。"],["只是一個 UI bug","不是。"],["一定是 DNS poisoning","不是。"]]),
  MC('sd16-s05-q3','Queue backlog 一直長，單純加 queue capacity 可以解嗎？','sd16-s05-p03','不能；arrival 長期大於 service rate，capacity 只延後爆。','需提高 processing、shed load、降 arrival。',[["可以永久解","錯。"],["只需 TTL 無限","更糟。"],["只需更多 retries","會加劇。"]]),
  MC('sd16-s05-q4','Degraded mode 的例子？','sd16-s05-p03','YouTube 降畫質、Autocomplete 少 suggestions、cache stale serve。','犧牲部分品質保 availability/latency。',[["永久刪除 source data","不是 degrade。"],["關閉監控","不合理。"],["無限等待 dependency","相反。"]])
 ]
},
{
 id:'sd16-s06',order:6,title:'Observability 與 Operations：設計不是畫完就結束',duration:'40–56 分鐘',summary:'為每個 critical path 定義 SLI、alert、trace、capacity signal、deployment/rollback 與 disaster recovery。',
 research:[{label:'Google SRE Book — Service Level Objectives',url:'https://sre.google/sre-book/service-level-objectives/'},{label:'Google SRE Book — Table of Contents',url:'https://sre.google/sre-book/table-of-contents/'}],
 pages:[
  {id:'sd16-s06-p01',title:'四類通用 SLI',blocks:[
   {type:'compare',items:[['Traffic','QPS/messages/connections。'],['Errors','5xx、failed jobs、conflicts。'],['Latency','P50/P95/P99/end-to-end。'],['Saturation','CPU/memory/queue age/connection pool。']]}
  ]},
  {id:'sd16-s06-p02',title:'再加 Product-specific SLI',blocks:[
   {type:'bullets',items:['Chat delivery latency','Drive sync propagation','YouTube rebuffer ratio','Feed fanout lag','Autocomplete index age','Crawler useful-new-content/s']}
  ]},
  {id:'sd16-s06-p03',title:'Deployment 本身也是 Failure Mode',blocks:[
   {type:'stepper',steps:[['Build/Test','可重複 artifact'],['Canary','小流量'],['Observe','SLI/error budget'],['Progressive rollout','逐步放大'],['Rollback','已知好版本']]}
  ]}],
 quiz:[
  MC('sd16-s06-q1','為何只看 CPU 不夠？','sd16-s06-p01','使用者感知的 error/latency可能惡化但 CPU 正常。','需要 traffic/errors/latency/saturation與產品 SLI。',[["CPU 完全沒用","仍有用。"],["只看 RAM 就夠","也不夠。"],["只看 deploy count","不夠。"]]),
  MC('sd16-s06-q2','Drive 最有意義產品 SLI之一？','sd16-s06-p02','Change propagation/sync latency。','Server 改變到其他 device 看見的時間。',[["CSS render time only","不是核心 backend。"],["Git commit count","無關。"],["DNS TTL only","不是。"]]),
  MC('sd16-s06-q3','Canary deploy 主要降低？','sd16-s06-p03','壞版本 blast radius。','小流量先驗證。',[["讓 bugs 不可能存在","不能。"],["取消 monitoring","相反。"],["讓 rollback 不需要","仍需要。"]]),
  MC('sd16-s06-q4','Alert 最好基於？','sd16-s06-p01','可行動且接近 SLO/使用者影響的 signals。','例如 sustained error/latency/backlog，不是每個瞬時 spike。',[["任何 CPU 1% 變化","noise。"],["完全不設 threshold","不可操作。"],["只看 log 行數","不代表影響。"]])
 ]
},
{
 id:'sd16-s07',order:7,title:'如何讀真實世界架構：從技術名稱抽出設計原理',duration:'42–60 分鐘',summary:'依官方 Chapter 16 精神，閱讀 Facebook/Google/Amazon/Netflix 等真實系統時，不抄架構圖，而是問它解了什麼 constraint、犧牲了什麼。',
 research:[{label:'ByteByteGo — The Learning Continues / Real-world Systems',url:'https://bytebytego.com/courses/system-design-interview/the-learning-continues'}],
 pages:[
  {id:'sd16-s07-p01',title:'讀一篇 Architecture Blog 的六個問題',blocks:[
   {type:'code',text:'1. Workload / scale?\n2. Bottleneck before change?\n3. New invariant / data model?\n4. Why this technology?\n5. Failure / operational cost?\n6. What would not transfer to my system?'},
   {type:'p',text:'這能避免「Netflix 用 X，所以我也用 X」的 cargo cult。'}
  ]},
  {id:'sd16-s07-p02',title:'找 Shared Principles，不只找同產品',blocks:[
   {type:'compare',items:[['Facebook Timeline','Fanout/denormalization。'],['Dynamo/Cassandra','Partition/replication/eventual consistency。'],['Video systems','CDN/transcode/data plane。'],['Chat','connection state/order/offline sync。']]}
  ]},
  {id:'sd16-s07-p03',title:'建立自己的 Decision Notebook',blocks:[
   {type:'bullets',items:['Problem pattern','Options considered','Chosen design','Trade-off','Failure learned','When NOT to use it']},
   {type:'callout',title:'這比收藏 500 篇文章有用',text:'面試需要可取用的 decision model，不是 bookmarks 數量。'}
  ]}],
 quiz:[
  MC('sd16-s07-q1','讀真實架構最差的學法？','sd16-s07-p01','看到大公司用某技術就直接照抄。','Cargo cult，忽略 workload/constraint。',[["問瓶頸是什麼","好方法。"],["問 trade-off","好方法。"],["問哪些條件不可轉移","好方法。"]]),
  MC('sd16-s07-q2','跨不同產品最值得找？','sd16-s07-p02','共同設計原理/pattern。','例如 fanout、partition、queue、cache invalidation。',[["相同 logo","沒意義。"],["相同程式語言才算","不必要。"],["相同 UI","不是系統原理。"]]),
  MC('sd16-s07-q3','Decision Notebook 應記「When NOT to use」嗎？','sd16-s07-p03','應，trade-off boundary 才能避免萬用答案。','知道反例才是真的理解。',[["不應，只記優點","會形成偏誤。"],["只記 command syntax","太底層。"],["只記公司名稱","不足。"]]),
  MC('sd16-s07-q4','Dynamo architecture 最可重用的學習？','sd16-s07-p02','partition/replication/quorum/conflict 等原理。','不是照抄 Amazon 所有 infra。',[["品牌名稱","不是。"],["AWS logo","不是。"],["只記 paper 年份","不足。"]])
 ]
},
{
 id:'sd16-s08',order:8,title:'Final Interview Loop：45 分鐘模擬、復盤與下一階段',duration:'50–70 分鐘',summary:'把全書轉成可執行訓練：限時陌生題、口頭推導、failure challenge、錄音復盤、錯誤模式分類，最後進 30 題綜合 Final。',
 research:[{label:'ByteByteGo — The Learning Continues',url:'https://bytebytego.com/courses/system-design-interview/the-learning-continues'},{label:'ByteByteGo — Framework',url:'https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews'}],
 pages:[
  {id:'sd16-s08-p01',title:'45 分鐘模板',blocks:[
   {type:'code',text:'0–7m   Requirements + assumptions\n7–12m  Estimate + API/data model\n12–25m HLD + main flows\n25–38m 2–3 Deep Dives\n38–43m Failure/scale/ops\n43–45m Recap + next scale'}
  ]},
  {id:'sd16-s08-p02',title:'每次只修一類弱點',blocks:[
   {type:'compare',items:[['Scope 弱','容易做錯題。'],['Estimate 弱','設計沒有量級依據。'],['Trade-off 弱','只會列元件。'],['Failure 弱','像 mid-level happy path。'],['Communication 弱','有想法但 interviewer 看不到。']]}
  ]},
  {id:'sd16-s08-p03',title:'五個 Capstone 題型',blocks:[
   {type:'bullets',items:['Design Payment + ledger/idempotency。','Design Metrics Pipeline + time series/downsampling。','Design S3-like Object Storage。','Design Ride Matching / Nearby Service。','Design Stock Exchange / ordered execution。']},
   {type:'p',text:'不要立刻查答案；先用本書 framework 自己推 45 分鐘，再用公開資料比對。'}
  ]},
  {id:'sd16-s08-p04',title:'全書結束的真正標準',blocks:[
   {type:'callout',title:'不是 16/16 打勾',text:'看到陌生題時，你能先釐清、估算、畫 flow、找 bottleneck、講 trade-off、推 failure，再選技術。'},
   {type:'p',text:'Chapter 16 章末考刻意跨章混合；通過後，下一階段應是限時口試與真實架構閱讀，而不是繼續背更多靜態答案。'}
  ]}],
 quiz:[
  MC('sd16-s08-q1','45 分鐘面試最後應留時間做？','sd16-s08-p01','Failure/ops/recap，而不是 Deep Dive 無限延伸。','Wrap-up、風險與下一步。',[["最後 10 分鐘才開始問需求","太晚。"],["不停加服務到時間到","失控。"],["直接沉默","少掉訊號。"]]),
  MC('sd16-s08-q2','每次 mock 都換全新學習主題，卻不修重複錯誤，問題？','sd16-s08-p02','沒有針對 weakness loop。','應分類弱點並刻意練習。',[["題目越多自然一定會好","不一定。"],["只需背答案","不夠。"],["不需要復盤","會重複犯錯。"]]),
  MC('sd16-s08-q3','Capstone 題應先做什麼？','sd16-s08-p03','先自行限時推導，再比公開答案。','避免答案污染思考。',[["先背完整架構再假裝設計","失去訓練。"],["只看最後圖","不學 decision process。"],["只記 tech stack","不夠。"]]),
  MC('sd16-s08-q4','全書真正完成標準？','sd16-s08-p04','能對陌生題建立 reasoning process。','從 constraints 推 architecture，而非背 16 張圖。',[["只要考試 80 分就代表 production expert","不等於。"],["記住所有題選項位置","題目會洗牌且不是目的。"],["能說最多技術名詞","不代表會設計。"]])
 ]
}
);
})();