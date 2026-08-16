(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_13;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd13-s06',order:6,title:'Freshness 與 Update Strategy：Batch、Incremental、Snapshot Swap',duration:'34–48 分鐘',summary:'設計「多快反映熱門詞」的 SLA，並避免 update storm 破壞 query latency。',
 research:[{label:'Elasticsearch — Completion Suggester near real-time behavior',url:'https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html'}],
 pages:[
  {id:'sd13-s06-p01',title:'Freshness 是產品需求，不是越快越好',blocks:[
   {type:'compare',items:[['Batch 1h','簡單、穩定，trend 反應慢。'],['Mini-batch 1–5m','常見折衷。'],['Streaming delta','更即時，但 merge/state/rollback 複雜。']]},
   {type:'p',text:'若產品允許 5 分鐘 stale，就不需要為每一筆 query event 做 synchronous global update。'}
  ]},
  {id:'sd13-s06-p02',title:'Base Snapshot + Delta Layer',blocks:[
   {type:'diagram',nodes:[['Stable Snapshot','global top-k'],['Realtime Delta','trending/new'],['Query Service','merge + rerank'],['Top 10','response']],caption:'大部分資料走 immutable snapshot，小部分新熱詞走 delta。'},
   {type:'p',text:'這能避免每次微小更新重建整個 index，同時保留近期熱門詞。'}
  ]},
  {id:'sd13-s06-p03',title:'發布前要做品質 Gate',blocks:[
   {type:'bullets',items:['index size / memory budget','bad-word / PII scan','top queries regression','latency benchmark','canary region','rollback pointer']}
  ]}],
 quiz:[
  MC('sd13-s06-q1','為何不一定追求毫秒級 index freshness？','sd13-s06-p01','更新成本會與低 latency serving 衝突，需求常允許 eventual freshness。','先定 freshness SLA，再選 batch/streaming。',[["因為熱門詞永遠不變","會變。"],["因為 cache 不能更新","可以。"],["因為 Trie 不能 rebuild","可以。"]]),
  MC('sd13-s06-q2','Base snapshot + realtime delta 解什麼？','sd13-s06-p02','把穩定大資料與少量即時變化分層。','降低 rebuild 頻率，同時保留 trending freshness。',[["消除所有 merge cost","仍需 merge/rerank。"],["讓 storage 為零","不是。"],["保證沒有 abuse","仍需 filter。"]]),
  MC('sd13-s06-q3','新 snapshot 發布前為何做 memory gate？','sd13-s06-p03','完成 index 常駐 memory，過大可能造成 GC/OOM/latency。','防止 index size regression 破壞 serving。',[["只為省磁碟","主要是 runtime memory/latency。"],["因為 snapshot 不能放磁碟","可以。"],["只為 UI 顯示","不是。"]]),
  MC('sd13-s06-q4','Canary publish 的主要價值？','sd13-s06-p03','先在小流量驗證品質與 latency，再全量。','降低壞 ranking/index 的 blast radius。',[["讓所有人同時更新","相反。"],["取消 rollback","不是。"],["保證沒有任何 bug","不能保證。"]])
 ]
},
{
 id:'sd13-s07',order:7,title:'Sharding、Replication 與 Cache：Prefix 熱點怎麼辦',duration:'36–52 分鐘',summary:'比較依首字母、hash、locale 的分片策略；處理單字母 hot prefix、cache 與跨 shard top-k merge。',
 research:[{label:'Elasticsearch — completion across shards trade-off',url:'https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html'}],
 pages:[
  {id:'sd13-s07-p01',title:'按 Prefix Range 分片很直覺，但會 Skew',blocks:[
   {type:'p',text:'a–f / g–m / n–z 容易 routing，但英文字母頻率、語言與熱門品牌分布非常不均。單字母「s」可能遠比「q」熱。'},
   {type:'callout',title:'不要把「好路由」等同「好平衡」',text:'Prefix-based partition 需要 dynamic split 或更細 shard map。'}
  ]},
  {id:'sd13-s07-p02',title:'Hash Sharding 平衡 Load，但 Query 可能 Fan-out',blocks:[
   {type:'compare',items:[['Prefix Range','可定向 query，但容易 skew/hot partition。'],['Hash by Query','寫入平均，但 prefix candidates 散到多 shard，query 要 fan-out/merge。'],['Locale + Prefix','先按語言/區域縮小，再細分。']]}
  ]},
  {id:'sd13-s07-p03',title:'Cache 最適合短熱門 Prefix',blocks:[
   {type:'bullets',items:['「a」「s」「how」等高頻 prefix 可 edge/service cache。','Snapshot version 放進 cache key，避免新舊資料混淆。','Negative cache 可減少不存在 prefix 的重複查詢。','個人化結果不能錯用 global cache。']}
  ]}],
 quiz:[
  MC('sd13-s07-q1','按第一個字母分片最大的風險？','sd13-s07-p01','不同 prefix 流量差異大，容易 skew/hot shard。','簡單 range partition 可能嚴重不均。',[["prefix 無法路由","可以。"],["所有字母流量必定相同","錯。"],["不能 replication","可以。"]]),
  MC('sd13-s07-q2','Hash sharding 為何 query-time 可能更貴？','sd13-s07-p02','同 prefix 的 candidates 可能散在多 shard，需要 fan-out/merge。','平衡寫入換跨 shard top-k merge。',[["Hash 一定讓資料消失","不是。"],["Hash 不能存字串","可以。"],["因為 cache 無效","仍可 cache。"]]),
  MC('sd13-s07-q3','哪類 prefix 最值得 cache？','sd13-s07-p03','高頻短 prefix 的重複率最高。','熱門短 prefix 可大量減少 backend lookup。',[["每個 user 的 unique long prefix","重用率低。"],["password prefix","不應記錄。"],["隨機不存在字串 only","negative cache 可但不是最高收益。"]]),
  MC('sd13-s07-q4','個人化 suggestion 為何不能直接共用 global cache key？','sd13-s07-p03','不同 user/context 結果不同，會資料洩漏/錯誤內容。','Cache key 必須包含 personalization context 或分層處理。',[["因為 cache 不支援文字","錯。"],["因為 HTTP 不支援 user","錯。"],["因為 prefix 一定唯一","不是。"]])
 ]
},
{
 id:'sd13-s08',order:8,title:'Safety、Abuse、Privacy 與 Ranking Quality',duration:'34–48 分鐘',summary:'Autocomplete 直接把平台學到的 query 顯示給使用者，因此內容治理、PII、spam 與 feedback loop 是核心 correctness。',
 research:[{label:'Google Programmable Search — add/remove autocomplete terms',url:'https://developers.google.com/custom-search/docs/queries'}],
 pages:[
  {id:'sd13-s08-p01',title:'低頻 Query 不一定該進 Suggestions',blocks:[
   {type:'bullets',items:['可能含 email/電話/姓名等 PII。','可能是 harassment/explicit/illegal query。','可能是 attacker 刻意灌量。','低頻 query 缺乏群體證據，容易洩漏個人行為。']},
   {type:'callout',title:'Threshold + Policy Filter',text:'frequency threshold、allow/deny lists、ML classifier、manual override 可共同決定是否可曝光。'}
  ]},
  {id:'sd13-s08-p02',title:'Trending 很容易被 Manipulate',blocks:[
   {type:'p',text:'如果 ranking 只看最近 5 分鐘 count，botnet 可以把垃圾詞灌上榜。要看 unique users、device/IP reputation、velocity anomaly、click quality。'}
  ]},
  {id:'sd13-s08-p03',title:'Personalization 要做 Data Minimization',blocks:[
   {type:'bullets',items:['不把敏感 query 長期原文保留。','User history 可 TTL/aggregate。','Incognito/private mode 不應污染 profile。','提供 delete history / opt-out。']}
  ]}],
 quiz:[
  MC('sd13-s08-q1','為何設定最低 frequency threshold？','sd13-s08-p01','降低低頻敏感 query 被曝光與噪音。','兼顧 privacy 與 suggestion quality。',[["讓熱門詞消失","相反。"],["只為省 1 byte","不是。"],["保證沒有任何敏感內容","仍需 policy filter。"]]),
  MC('sd13-s08-q2','Trending 只看 raw request count 的風險？','sd13-s08-p02','容易被 bot/spam 操縱。','需要 unique-user/reputation/anomaly 等 anti-abuse signals。',[["會讓 latency 必定變慢","不是唯一問題。"],["會讓 Trie 不能查","不是。"],["會讓 CDN 失效","無關。"]]),
  MC('sd13-s08-q3','Personalization 的正確資料策略？','sd13-s08-p03','最小化、TTL、opt-out、敏感模式隔離。','不要為提升 ranking 無限保留原始私密 query。',[["永久保存所有 query 才最好","風險高。"],["把所有 user history 公開 cache","會洩漏。"],["完全不用任何 policy","不合理。"]]),
  MC('sd13-s08-q4','人工移除某 suggestion 後，什麼最容易讓它又出現？','sd13-s08-p01','下一版 builder 若沒有 policy override，raw popularity 又會把它建回。','Safety override 必須進 build pipeline，而非只刪目前 snapshot。',[["DNS TTL","無關。"],["瀏覽器 cache only","不是根源。"],["Unicode 一定造成","不一定。"]])
 ]
},
{
 id:'sd13-s09',order:9,title:'完整 HLD、Failure Modes 與 Observability',duration:'38–55 分鐘',summary:'把 Query Service、Cache、Completion Index、Event Pipeline、Builder、Snapshot Store 與 Policy Service 串成可營運系統。',
 research:[{label:'ByteByteGo — Autocomplete high-level design',url:'https://bytebytego.com/courses/system-design-interview/design-a-search-autocomplete-system'},{label:'Elasticsearch — Completion Suggester',url:'https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html'}],
 pages:[
  {id:'sd13-s09-p01',title:'Serving Path',blocks:[
   {type:'diagram',nodes:[['Client','debounce prefix'],['LB/API','auth/locale'],['Prefix Cache','hot top-k'],['Completion Shard','Trie/FST'],['Merge/Rank','policy/context'],['Response','top 10']],caption:'讀路徑要短、可 cache、可降級。'}
  ]},
  {id:'sd13-s09-p02',title:'Update Path',blocks:[
   {type:'diagram',nodes:[['Search Events','submitted/click'],['Log/Stream','durable'],['Aggregator','count/trend'],['Builder','index snapshot'],['Object Store','versioned'],['Query Nodes','warm + swap']],caption:'更新路徑可 async，發布前驗證。'}
  ]},
  {id:'sd13-s09-p03',title:'Failure 與 Metrics',blocks:[
   {type:'compare',items:[['Snapshot publish fail','繼續 serve previous good version。'],['One shard fail','cache/replica/partial degraded suggestions。'],['Aggregator lag','freshness 下降但 read path 可正常。'],['Policy outage','fail-safe 過濾敏感 suggestion。']]},
   {type:'bullets',items:['P50/P95/P99 suggestion latency','cache hit rate','empty result rate','suggestion accept/click rate','index age/freshness lag','bad suggestion reports','build size / heap usage']}
  ]},
  {id:'sd13-s09-p04',title:'面試收尾 Checklist',blocks:[
   {type:'code',text:'□ Scope: prefix top-k, latency, freshness\n□ Estimate: keystroke QPS + memory\n□ Query logs / aggregation\n□ Trie/FST + top-k\n□ Snapshot + delta\n□ Sharding/cache\n□ Safety/privacy\n□ Failure/observability'},
   {type:'callout',title:'核心 Trade-off',text:'把昂貴計算前移到 build/update path，用 memory 與 eventual freshness 換 query-time 低延遲。'}
  ]}],
 quiz:[
  MC('sd13-s09-q1','Aggregator lag 10 分鐘但 query nodes 正常，最可能影響？','sd13-s09-p03','舊 snapshot 仍可服務，只是熱門詞 freshness 變差。','Read availability 可正常，freshness lag 上升。',[["所有 autocomplete 立即 500","不必然。"],["所有歷史 suggestion 消失","snapshot 還在。"],["WebSocket 斷線","無關。"]]),
  MC('sd13-s09-q2','新 snapshot 驗證失敗，最成熟作法？','sd13-s09-p03','不要切換，繼續 previous known-good snapshot。','Versioned publish + rollback/fail-safe。',[["仍然全量發布","風險高。"],["刪掉舊 snapshot","更糟。"],["停止所有搜尋","沒必要。"]]),
  MC('sd13-s09-q3','衡量 autocomplete 品質除了 latency 還要看？','sd13-s09-p03','Accept/click、empty rate、bad reports 等 quality signals。','Suggestion usefulness 與 safety metrics。',[["只看 CPU","不等於品質。"],["只看字串長度","不足。"],["只看 DNS","無關。"]]),
  MC('sd13-s09-q4','本章最核心設計原則？','sd13-s09-p04','預計算/記憶體化 serving，用 async build 換低 latency。','把昂貴 ranking/indexing 前移，讀路徑保持簡短。',[["每次 request 即時計算全 corpus","太慢。"],["完全不要更新","freshness 不足。"],["所有 prefix 都打主 DB","會形成瓶頸。"]])
 ]
}
);
})();