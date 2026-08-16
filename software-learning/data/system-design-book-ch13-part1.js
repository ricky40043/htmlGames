(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_13={
 id:'sd-book-13',order:13,title:'設計搜尋文字自動補全系統',
 subtitle:'從 Prefix Query、Trie/FST、Top-K Ranking 到資料蒐集、更新、分片、個人化與安全過濾，設計低延遲 Search-as-you-type。',
 objective:'完成後，你能說明為何 autocomplete 與一般全文搜尋不同、如何預先計算熱門候選、如何處理 freshness/abuse，以及如何在記憶體、延遲與更新成本間取捨。',
 sections:[],finalExam:[]
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd13-s01',order:1,title:'需求與量級：Autocomplete 不是 Full-text Search',duration:'30–42 分鐘',summary:'先定義 prefix suggestions、top 5–10、低延遲、read-heavy、eventual freshness 與內容安全邊界。',
 research:[{label:'ByteByteGo — Design A Search Autocomplete System',url:'https://bytebytego.com/courses/system-design-interview/design-a-search-autocomplete-system'},{label:'Google Programmable Search — Autocompleting Queries',url:'https://developers.google.com/custom-search/docs/queries'}],
 pages:[
  {id:'sd13-s01-p01',title:'先把 Autocomplete 與 Search Results 分開',blocks:[
   {type:'compare',items:[['Autocomplete','輸入「sys」立刻回 system design / system engineer；目標是 prefix suggestion。'],['Full-text Search','輸入完整 query 後找 documents，ranking 訊號與 latency budget 都不同。'],['Spell Correction','did-you-mean 類問題，不等同 prefix completion。']]},
   {type:'callout',title:'面試 Scope',text:'通常只設計 query suggestions，不設計完整搜尋引擎。'}
  ]},
  {id:'sd13-s01-p02',title:'Latency Budget 比 Consistency 更嚴格',blocks:[
   {type:'bullets',items:['使用者每輸入一個字就可能打一個 request。','常見目標：P95/P99 幾十到百毫秒內。','新熱門詞可接受數秒到數分鐘才反映，通常不要求每次輸入即時重建。','讀流量遠大於寫入/聚合流量。']},
   {type:'p',text:'這直接導出 read path 要高度預計算與記憶體化，而 update path 可以批次或近即時。'}
  ]},
  {id:'sd13-s01-p03',title:'估算真正要回答的是記憶體與 QPS',blocks:[
   {type:'p',text:'假設 10M DAU、每人每天 20 次搜尋、平均每次輸入 10 個字元，Autocomplete request 約 2B/day；平均約 23k QPS，Peak 可再乘 2–5 倍。'},
   {type:'callout',title:'不要迷信精準數字',text:'面試重點是得出「極 read-heavy、低 latency、cache/trie 要進 memory、更新可 async」這些架構結論。'}
  ]}],
 quiz:[
  MC('sd13-s01-q1','Autocomplete 與全文搜尋最大的 scope 差異？','sd13-s01-p01','Autocomplete 主要根據 prefix 回 query suggestions；全文搜尋是從 document corpus 找結果。','Autocomplete 解 prefix suggestion，不等於完整 document search。',[["兩者完全相同，只是 UI 不同","資料結構與 latency/ranking 都可不同。"],["Autocomplete 只做拼字校正","那是另一類 suggester。"],["全文搜尋一定不能用 prefix","可以，但不是此題核心。"]]),
  MC('sd13-s01-q2','為什麼 Autocomplete read path 常高度預計算？','sd13-s01-p02','每 keystroke 都可能觸發查詢，低延遲比即時更新更重要。','用預計算 top-k / in-memory structure 換低 latency。',[["因為不能有任何更新","仍需更新，只是可 async。"],["因為一定只能單機","可分散式。"],["因為 suggestion 永遠固定","熱門度會變。"]]),
  MC('sd13-s01-q3','10M DAU × 20 searches/day × 10 keystrokes，最重要得到什麼？','sd13-s01-p03','得到 Autocomplete request 是十億級/day，證明 read-heavy 與 cache/partition necessity。','得到 request 量級，支撐低延遲讀架構。',[["證明一定要 SQL JOIN","沒有。"],["證明每字都要 synchronous DB write","相反。"],["證明不需 cache","錯。"]]),
  MC('sd13-s01-q4','熱門 query 晚 30 秒出現在 suggestions，通常屬哪類 trade-off？','sd13-s01-p02','以 eventual freshness 換更快、更穩定的 read path。','Freshness 與 read latency/更新成本的取捨。',[["Durability 不足","不是。"],["一定是資料遺失","不必然。"],["HTTP protocol 錯誤","無關。"]])
 ]
},
{
 id:'sd13-s02',order:2,title:'Query Log、Frequency Table 與 Ranking Signals',duration:'32–45 分鐘',summary:'Autocomplete 的候選不是憑空出現；先建立 query frequency pipeline，再決定 global/popularity/recency/context ranking。',
 research:[{label:'Google Programmable Search — autocomplete popularity',url:'https://developers.google.com/custom-search/docs/queries'}],
 pages:[
  {id:'sd13-s02-p01',title:'來源：使用者真的搜尋過什麼',blocks:[
   {type:'diagram',nodes:[['Search Events','query,user,time'],['Stream/Log','durable event'],['Aggregator','normalize + count'],['Frequency Store','query → score'],['Builder','Trie/FST snapshot']],caption:'Query service 與 data collection service 分離。'},
   {type:'p',text:'Autocomplete 候選常來自歷史 query、內容詞彙、人工詞庫，再依頻率與政策過濾。'}
  ]},
  {id:'sd13-s02-p02',title:'Normalize 之前先定義語意',blocks:[
   {type:'bullets',items:['大小寫、Unicode normalization。','前後空白與重複空白。','語言/locale。','敏感詞、PII、低頻 query。','同義詞是否 merge 要看產品。']},
   {type:'callout',title:'Normalization 不是越多越好',text:'把「C#」和「C」或「US」和「us」錯誤合併都會污染 suggestion quality。'}
  ]},
  {id:'sd13-s02-p03',title:'Frequency 只是第一版 Ranking',blocks:[
   {type:'compare',items:[['Popularity','長期 query count。'],['Recency','最近快速上升的 query。'],['Context','locale/device/category。'],['Personalization','個人歷史，但要注意 privacy。'],['Policy','unsafe/illegal/PII 降權或封鎖。']]}
  ]}],
 quiz:[
  MC('sd13-s02-q1','Autocomplete candidate 最常見資料來源？','sd13-s02-p01','Query logs/內容詞彙經聚合後形成候選。','歷史 query 與可控詞庫經 aggregation 建 index。',[["每次 keystroke 隨機生成","品質不可控。"],["只用 DNS records","無關。"],["只讀 user password","不應。"]]),
  MC('sd13-s02-q2','為什麼 query normalization 要有 domain rules？','sd13-s02-p02','過度 normalization 會合併語意不同字串。','避免錯誤合併造成 ranking/dedup 污染。',[["因為 Unicode 不能搜尋","可以。"],["因為 normalization 一定提高 correctness","不一定。"],["只為壓縮 storage","不是主要理由。"]]),
  MC('sd13-s02-q3','突發新聞 query 應比多年常青 query 快速上升，最需要哪個訊號？','sd13-s02-p03','Recency/trend 能反映近期增長。','加入 recency/trending score，而不是只看 lifetime count。',[["只看字串長度","無關。"],["只看 alphabet order","不是 ranking。"],["把 cache TTL 設一年","反而更 stale。"]]),
  MC('sd13-s02-q4','Personalized autocomplete 最大額外 concern？','sd13-s02-p03','Privacy、user isolation、cache key cardinality。','需要個人化資料治理與 per-user/context ranking。',[["只能用 SQL","不是。"],["不能有任何 cache","可做分層 cache。"],["一定比 global ranking 快","不一定。"]])
 ]
},
{
 id:'sd13-s03',order:3,title:'Trie：Prefix Lookup 的核心模型',duration:'36–50 分鐘',summary:'理解 Trie 節點、prefix traversal、subtree candidates，以及為何把 top-k 預存在節點能把 query latency 壓低。',
 research:[{label:'ByteByteGo — Trie data structure',url:'https://bytebytego.com/courses/system-design-interview/design-a-search-autocomplete-system'}],
 pages:[
  {id:'sd13-s03-p01',title:'Trie 把共同 Prefix 共用',blocks:[
   {type:'code',text:'root\n └─ s\n    └─ y\n       └─ s\n          ├─ system\n          └─ syscall'},
   {type:'p',text:'輸入 prefix 長度 p 時，先走 p 個節點到 prefix node；接著候選來自該 subtree。'}
  ]},
  {id:'sd13-s03-p02',title:'天真的 DFS 仍可能太慢',blocks:[
   {type:'p',text:'找到 prefix node 只是開始；若 subtree 有百萬個 queries，每次 DFS 全掃再排序 top 10 仍不可接受。'},
   {type:'callout',title:'關鍵優化',text:'在每個常用 prefix node 預存 top-k suggestions / scores，query 變成 O(prefix length + k)。'}
  ]},
  {id:'sd13-s03-p03',title:'Top-K at Node 的寫入成本',blocks:[
   {type:'compare',items:[['Read','極快：定位 prefix node 後直接回 top-k。'],['Build/Update','每個 query 會影響它沿途所有 prefix nodes。'],['Memory','同一 suggestion 可能出現在多個 prefix top-k list。']]}
  ]}],
 quiz:[
  MC('sd13-s03-q1','Trie 最直接支援哪類查詢？','sd13-s03-p01','依字元逐層走 prefix。','Prefix lookup。',[["任意 SQL transaction","不是。"],["影片 transcoding","無關。"],["Range scan by timestamp only","不是 Trie 核心。"]]),
  MC('sd13-s03-q2','找到 prefix node 後為何還可能慢？','sd13-s03-p02','Subtree 可能極大，DFS+排序成本高。','候選 subtree 太大，需要預存 top-k。',[["因為 Trie 無法存字串","可以。"],["因為 prefix 不存在就會掃全 DB","可直接 miss。"],["因為 cache 一定失效","不是。"]]),
  MC('sd13-s03-q3','每個 node 預存 top 10 的最大收益？','sd13-s03-p02','讀取不用遍歷整棵 subtree。','把查詢成本壓到 prefix traversal + small result read。',[["讓更新免費","更新反而較貴。"],["讓 memory 降為零","會增加 memory。"],["保證 ranking 永遠正確","仍需重建/更新。"]]),
  MC('sd13-s03-q4','Top-k-at-node 的主要代價？','sd13-s03-p03','額外 memory 與 rebuild/update amplification。','讀快是用 memory/更新成本換來的。',[["完全不能 sharding","可以。"],["一定失去 durability","snapshot 可持久化。"],["只能有一個 suggestion","不是。"]])
 ]
},
{
 id:'sd13-s04',order:4,title:'FST / Completion Index：Production Prefix Structure',duration:'32–46 分鐘',summary:'從 Trie 延伸到壓縮 automaton/FST 類結構；理解 production 搜尋系統常用 index-time build 換 query-time speed。',
 research:[{label:'Elasticsearch — Completion Suggester',url:'https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html'},{label:'Elasticsearch CompletionSuggestionBuilder — FST',url:'https://artifacts.elastic.co/javadoc/org/elasticsearch/elasticsearch/7.17.6/org/elasticsearch/search/suggest/completion/CompletionSuggestionBuilder.html'}],
 pages:[
  {id:'sd13-s04-p01',title:'FST 的直覺：把重複狀態壓縮',blocks:[
   {type:'p',text:'Production autocomplete 常用 compact trie/finite-state transducer 類 index，把共同 prefixes/suffix states 壓縮並在 index-time 建好。'},
   {type:'callout',title:'Elastic 實例',text:'Elasticsearch completion suggester 使用 index-time 建立的 FST 類結構，為低延遲 prefix completion 優化，代價是 build 與 heap/memory。'}
  ]},
  {id:'sd13-s04-p02',title:'Near Real-time 不等於 Per-keystroke Rebuild',blocks:[
   {type:'p',text:'Autocomplete index 可每幾秒/分鐘發布新 snapshot；query servers 讀 immutable snapshot，切換版本比邊查邊 mutate 大型 Trie 更容易控制 consistency 與 rollback。'},
   {type:'stepper',steps:[['Aggregate','收 query counts'],['Build','產生新 completion index'],['Validate','品質/大小/安全檢查'],['Publish','versioned snapshot'],['Swap','query nodes atomic switch']]}
  ]},
  {id:'sd13-s04-p03',title:'Immutable Snapshot 很適合 Cache 與 Rollback',blocks:[
   {type:'bullets',items:['可 checksum/version。','可預熱後再切流量。','壞 ranking 可 rollback。','不同 region 可漸進 rollout。']}
  ]}],
 quiz:[
  MC('sd13-s04-q1','Completion index 為何常在 index-time 建好？','sd13-s04-p01','把昂貴計算前移，讓 query-time prefix lookup 更快。','以 build cost 換低 latency read。',[["因為 query server 不能有 RAM","不是。"],["因為 FST 不能更新","可重建/替換。"],["因為每次輸入都要 compile code","不是。"]]),
  MC('sd13-s04-q2','Immutable snapshot 相比原地 mutate 的主要優點？','sd13-s04-p02','版本切換、驗證、rollback 更簡單。','可 atomic swap 與回滾，降低半更新狀態。',[["一定使用更少 storage","不一定。"],["完全沒有 freshness delay","仍可能。"],["不用做 cache warmup","仍需要。"]]),
  MC('sd13-s04-q3','Autocomplete 想每 30 秒更新熱門詞，合理做法？','sd13-s04-p02','近即時批次 build/publish，而不是每 key stroke 重建全 index。','短週期 incremental/snapshot publish。',[["每 request 重建全部 Trie","成本太高。"],["永遠不更新","freshness 差。"],["把 DB lock 30 秒","不必要。"]]),
  MC('sd13-s04-q4','Completion structure 主要 trade-off？','sd13-s04-p01','Query speed vs memory/index build cost。','低延遲通常靠更多 memory 與預計算。',[["CAP theorem only","不是核心。"],["只能選 relational DB","不是。"],["一定需要 GPU","不需要。"]])
 ]
},
{
 id:'sd13-s05',order:5,title:'Data Collection Pipeline：從 Raw Query 到 Top-K Snapshot',duration:'36–50 分鐘',summary:'把 query service 與 aggregation pipeline 分離；用 stream/log、windowed count、dedup、trend score 產出可部署 index。',
 research:[{label:'ByteByteGo — Data gathering service',url:'https://bytebytego.com/courses/system-design-interview/design-a-search-autocomplete-system'}],
 pages:[
  {id:'sd13-s05-p01',title:'Query Service 不同步更新 Trie',blocks:[
   {type:'diagram',nodes:[['Client','prefix'],['Query Service','serve suggestions'],['Event Log','search submitted'],['Aggregator','count/window'],['Builder','top-k index']],caption:'Serving path 與 learning/update path 解耦。'}
  ]},
  {id:'sd13-s05-p02',title:'只記 Final Search 通常比每個 Keystroke 更乾淨',blocks:[
   {type:'p',text:'若把每個輸入中間字串都當熱門 query，「s」「sy」「sys」會污染 frequency。通常蒐集真正提交/點擊的 query，再輔以 impression/click feedback。'},
   {type:'bullets',items:['submitted query count','suggestion impression','suggestion click/accept','zero-result query','abuse/spam signals']}
  ]},
  {id:'sd13-s05-p03',title:'Windowed Aggregation 支援 Trending',blocks:[
   {type:'code',text:'score = 0.55 * log(lifetime_count)\n      + 0.30 * recent_1h_count\n      + 0.15 * click_rate\n      - safety_penalty'},
   {type:'p',text:'實際公式依產品調整；重要的是資料 pipeline 能同時計算長期 popularity 與近期 velocity。'}
  ]}],
 quiz:[
  MC('sd13-s05-q1','為何 serving 與 aggregation 分離？','sd13-s05-p01','Autocomplete read path 要穩定低 latency，不該同步做全域統計。','把寫入/聚合移到 async pipeline，保護 read SLO。',[["因為 query 不需要資料","仍需要 index。"],["因為所有更新都要丟棄","不是。"],["因為 stream 只能 read","可處理 event。"]]),
  MC('sd13-s05-q2','把每個 keystroke 都當一個完整 query 的問題？','sd13-s05-p02','中間 prefix 會被過度計數，污染 ranking。','應區分 typing events 與真正 submitted/selected queries。',[["會讓 Trie 無法 prefix search","不是。"],["會讓 HTTPS 失效","無關。"],["會讓 DB 自動 sharding","不是。"]]),
  MC('sd13-s05-q3','要發現突然爆紅的新詞，應看什麼？','sd13-s05-p03','短時間 window 的增長/velocity。','Recent window count / trend velocity。',[["只看歷史總量","可能反應太慢。"],["只看字數","無關。"],["只看 user agent","不是主訊號。"]]),
  MC('sd13-s05-q4','Suggestion click event 的價值？','sd13-s05-p02','可衡量 suggestion 是否真的幫助使用者。','作為 ranking feedback，而非只看曝光。',[["證明 query 一定安全","不能。"],["取代所有 frequency data","不一定。"],["只為 logging compliance","不只。"]])
 ]
}
);
})();