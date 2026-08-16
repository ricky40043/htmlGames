(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_11;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd11-s05',order:5,title:'Fanout-on-Read 與 Celebrity Hybrid',duration:'38–54 分鐘',summary:'Pull Model 把成本移到讀取；Hybrid 用一般使用者 push、名人 pull，控制極端 fanout。',
 research:[{label:'ByteByteGo — Fanout on Read / Hybrid',url:'https://bytebytego.com/courses/system-design-interview/design-a-news-feed-system'}],
 pages:[
  {id:'sd11-s05-p01',title:'Pull Model：Read 時才 Merge',blocks:[
   {type:'diagram',nodes:[['User opens feed','read'],['Following list','N authors'],['Recent posts','per author'],['Merge/Sort','timestamp/rank'],['Return','top K']],caption:'Publish 便宜，但每次 read 要 fan-in 多來源。'},
   {type:'compare',items:[['優點','Inactive user 不浪費 precompute；celebrity 發文不會瞬間 50M writes。'],['缺點','Read latency 與 compute 高，following 多時 fan-in 很重。']]}
  ]},
  {id:'sd11-s05-p02',title:'Hybrid：普通人 Push，名人 Pull',blocks:[
   {type:'p',text:'大多數 user follower 數有限，push 能換取快讀；對 celebrity/high-fanout author，不做全量 push，讀 Feed 時再把其近期 posts merge 進 precomputed timeline。'},
   {type:'callout',title:'不是硬編碼「名人」',text:'可以依 follower count、fanout cost、posting rate、follower activity 動態決定 push/pull policy。'}
  ]},
  {id:'sd11-s05-p03',title:'Hybrid Read Path',blocks:[
   {type:'stepper',steps:[['Load precomputed IDs','一般 author 已 push 的 timeline。'],['Fetch pull authors','celebrity/high-fanout authors 的 recent posts。'],['Merge','依 timestamp/rank merge。'],['Trim','只留 top K + cursor。']]},
   {type:'p',text:'Hybrid 的複雜度在 duplicate、ordering、cursor consistency；同一 author policy 切換時要避免 post 同時從 push 與 pull 出現兩次。'}
  ]}],
 quiz:[
  MC('sd11-s05-q1','Fanout-on-read 最大成本搬去哪？','sd11-s05-p01','把 publishing 時的 write amplification 移到 retrieval 時的 fan-in/merge。','讀 Feed 時要抓多個 author 的 recent posts 並 merge。',[["完全沒有成本","只是換位置。"],["只增加 DNS","不是。"],["只增加 Post write","反而 publish 較便宜。"]]),
  MC('sd11-s05-q2','Hybrid 為何常對 celebrity 用 pull？','sd11-s05-p02','避免一篇 post 對數千萬 follower 全量 fanout。','控制極端 write amplification。',[["因為 celebrity 的 post 不需 cache","仍可 cache。"],["因為 celebrity 一定不排序","仍需排序。"],["因為 pull 永遠比 push 快","read path 反而通常更重。"]]),
  MC('sd11-s05-q3','Hybrid policy 切換最容易出現哪種 correctness 問題？','sd11-s05-p03','同 post 可能同時存在 push timeline 與 pull source。','Duplicate feed entry / ordering inconsistency。',[["HTTP 無法使用","無關。"],["Post ID 失去唯一性","ID 可仍唯一。"],["User token invalid","無關。"]]),
  MC('sd11-s05-q4','什麼情況 fanout-on-read 比較合理？','sd11-s05-p01','大量 inactive users 或 follower 極多 author 可避免預先寫大量無人讀的 timeline。','讀取頻率低、fanout cost 高的情境。',[["所有 user 都高頻 refresh 且 follower 少","push 可能更適合。"],["Post 沒有 timestamp","不是選型依據。"],["只有單一 author","也可很簡單，不代表需要 full pull。"]])
 ]
},
{
 id:'sd11-s06',order:6,title:'News Feed Cache 與 Hydration',duration:'36–50 分鐘',summary:'Feed Cache 存 ID/score；真正內容從 Post/User Cache hydrate，避免巨量重複資料。',
 research:[
  {label:'ByteByteGo — Newsfeed retrieval / cache architecture',url:'https://bytebytego.com/courses/system-design-interview/design-a-news-feed-system'},
  {label:'Redis Sorted Sets',url:'https://redis.io/docs/latest/develop/data-types/sorted-sets/'}
 ],
 pages:[
  {id:'sd11-s06-p01',title:'Timeline Cache 最小化：post_id + score',blocks:[
   {type:'code',text:'feed:user:42\nscore=1723810000  post_id=987\nscore=1723809900  post_id=811\nscore=1723809700  post_id=744'},
   {type:'p',text:'Ordered set/list 只存 ID 與 rank/timestamp。完整 post/user/media 不複製到每個 follower timeline。'}
  ]},
  {id:'sd11-s06-p02',title:'Hydration：IDs → 完整 Feed Cards',blocks:[
   {type:'stepper',steps:[['Feed IDs','取 20 個 post IDs。'],['Batch Post Cache','批量拿 post objects。'],['Batch User Cache','拿 author profile。'],['Counters/Actions','like/comment/user-liked。'],['Media CDN','只回 media URLs/metadata。']]},
   {type:'callout',title:'避免 N+1',text:'不要 20 posts × user/post/counter 各打一次 backend；使用 batch/mget/parallel fetch。'}
  ]},
  {id:'sd11-s06-p03',title:'Cache Miss 與 Source of Truth',blocks:[
   {type:'p',text:'Feed cache 可以是 derived data；miss 時可從 durable post/social graph rebuild。Post DB、Graph DB 才是 source of truth。這讓 cache loss 不等於資料永久遺失。'},
   {type:'callout',title:'Derived Cache',text:'可重建資料與不可重建資料要分清楚，會直接影響 persistence/replication 策略。'}
  ]}],
 quiz:[
  MC('sd11-s06-q1','Feed Cache 只存 post_id 的主要好處？','sd11-s06-p01','避免把 post/user 內容複製到每個 follower timeline。','大幅降低 memory 與更新重複。',[["因為 Redis 不能存文字","可以。"],["因為 post 不需要內容","retrieval 時仍需 hydrate。"],["因為 score 不能存","可以。"]]),
  MC('sd11-s06-q2','Hydration 最常見效能陷阱？','sd11-s06-p02','逐筆查 post/user/counter 造成 N+1。','大量細碎 RPC/DB calls，應 batch/parallel。',[["只用一個 batch 太快","不是問題。"],["CDN 一定不能用","media 很適合 CDN。"],["Post ID 太短","無關。"]]),
  MC('sd11-s06-q3','News Feed Cache 全失效是否等於 post 永久丟失？','sd11-s06-p03','若 feed cache 是 derived data，可由 source of truth rebuild。','不等於，應能從 Post DB + Social Graph 重建。',[["等於，cache 必須是唯一資料來源","風險高且不是此設計。"],["只要 Redis 就不需 DB","錯。"],["只能讓 user 重發文","不需要。"]]),
  MC('sd11-s06-q4','Redis Sorted Set 為何常適合簡單 chronological feed cache？','sd11-s06-p01','member unique + score ordered，可按 score/rank range 取資料。','可用 timestamp/rank 作 score 維持 ordered IDs。',[["它自動做 social graph","不會。"],["它自動 hydrate post","不會。"],["它保證全球 strong consistency","不保證。"]])
 ]
},
{
 id:'sd11-s07',order:7,title:'Pagination、Ranking、Consistency 與 Feed Mutation',duration:'38–54 分鐘',summary:'處理 cursor、tie-breaker、delete/edit、ranking freshness 與 read-your-writes。',
 research:[{label:'ByteByteGo — News Feed Retrieval Deep Dive',url:'https://bytebytego.com/courses/system-design-interview/design-a-news-feed-system'}],
 pages:[
  {id:'sd11-s07-p01',title:'Cursor 需要 Stable Ordering + Tie-breaker',blocks:[
   {type:'code',text:'ORDER BY created_at DESC, post_id DESC\ncursor = encode(last_created_at, last_post_id)'},
   {type:'p',text:'只有 timestamp 可能同毫秒 collision；加 unique post_id tie-breaker 才能 stable pagination。'}
  ]},
  {id:'sd11-s07-p02',title:'Delete/Edit 如何反映到 Derived Feed?',blocks:[
   {type:'compare',items:[['Delete','Post state 標 deleted；retrieval hydration filter，背景清 timeline cache。'],['Edit','Post content source 更新；timeline ID 不必重 fanout。'],['Privacy change','可能要 revoke visibility / background cleanup。']]},
   {type:'callout',title:'Cache 是 Derived',text:'不要為了每次 edit 更新 500 萬份 copied post object；feed 只存 ID 的價值就在這裡。'}
  ]},
  {id:'sd11-s07-p03',title:'Read-your-writes：自己剛發的 Post 應該看得到',blocks:[
   {type:'p',text:'Fanout eventual consistency 可能讓作者自己的 home feed 暫時沒新 post。可 special-case author timeline 同步寫入，或 retrieval merge own recent posts，提供 read-your-writes UX。'},
   {type:'callout',title:'不是全系統 Strong Consistency',text:'可以針對高價值 user invariant 局部加強，而不需要所有 follower timeline 同步一致。'}
  ]}],
 quiz:[
  MC('sd11-s07-q1','Cursor 為什麼需要 timestamp + post_id？','sd11-s07-p01','相同 timestamp 需要 deterministic tie-breaker。','提供 stable total order，避免 pagination duplicate/skip。',[["因為 post_id 可取代所有 timestamp","可做但不代表需求。"],["因為 cursor 必須是 JSON","格式不是重點。"],["因為 timestamp 一定唯一","不一定。"]]),
  MC('sd11-s07-q2','Post edit 為何不必重新 fanout 500 萬份完整內容？','sd11-s07-p02','Timeline 只存 post_id，content 在 source/cache hydrate。','更新 Post source/cache 即可，feed entry identity 不變。',[["因為 edit 不允許","可以允許。"],["因為 follower 不需要新內容","需要，但 hydrate 取得新版本。"],["因為 CDN 會改 DB","不會。"]]),
  MC('sd11-s07-q3','作者剛發文卻自己看不到，最適合哪種 consistency UX？','sd11-s07-p03','Read-your-writes。','讓作者自己的 retrieval 立即合併/看到新 post。',[["要求全世界同毫秒看到","成本不必要。"],["刪掉 fanout","不是。"],["只增加 CDN TTL","反而可能更 stale。"]]),
  MC('sd11-s07-q4','Delete post 後 timeline cache 還有 post_id，怎麼防止顯示？','sd11-s07-p02','Hydration 要尊重 source-of-truth delete/visibility state。','Render 前 filter deleted/inaccessible post，背景再清 cache。',[["只靠 client 記憶","不可靠。"],["永遠不允許 delete","產品不一定。"],["改 post_id 就好","舊 ID 仍在 cache。"]])
 ]
},
{
 id:'sd11-s08',order:8,title:'Cache Architecture：Feed、Content、Graph、Actions、Counters',duration:'34–48 分鐘',summary:'把 ByteByteGo 的五層 cache 拆成各自 access pattern，避免一個巨型 Redis namespace。',
 research:[{label:'ByteByteGo — News Feed Cache Architecture',url:'https://bytebytego.com/courses/system-design-interview/design-a-news-feed-system'}],
 pages:[
  {id:'sd11-s08-p01',title:'五類 Cache 的資料形狀不同',blocks:[
   {type:'compare',items:[['News Feed','user → ordered post IDs。'],['Content','post_id → post；hot content 可特別 cache。'],['Social Graph','followers/following/mute/block。'],['Actions','user liked/replied/bookmarked?'],['Counters','like/reply/follower counts。']]},
   {type:'p',text:'它們的 TTL、更新頻率、consistency requirement 不一樣；不要因為都叫 cache 就用相同 eviction/replication policy。'}
  ]},
  {id:'sd11-s08-p02',title:'Counters 常是 Eventually Consistent',blocks:[
   {type:'p',text:'Like count 10,001 vs 10,003 通常不值得阻塞 feed render 等全局 transaction；可以 event stream 聚合、async update cache。'},
   {type:'callout',title:'但 Action State 不同',text:'「我是否按讚」是 user-specific UX，通常比 global like count 更需要快速 read-your-writes。'}
  ]},
  {id:'sd11-s08-p03',title:'Hot Content / Hot Key',blocks:[
   {type:'p',text:'爆紅 post 會讓單一 post_id cache key QPS 激增。可 local cache、replica/read scaling、request coalescing、CDN media 分流；一致性雜湊只分不同 keys，無法拆同一 hot key。'},
   {type:'callout',title:'Chapter 5 回顧',text:'Consistent hashing 解 partition distribution，不自動解 single hot key。'}
  ]}],
 quiz:[
  MC('sd11-s08-q1','News Feed Cache 與 Content Cache 為何分開？','sd11-s08-p01','一個是 user ordered IDs，一個是 shared post objects，access pattern 不同。','可分別調 TTL、容量、sharding 與 invalidation。',[["因為 Redis 不能存兩種 key","可以。"],["因為 Content 不會更新","會。"],["因為 Feed 不需 order","需要。"]]),
  MC('sd11-s08-q2','Global like counter 為何常可 eventual？','sd11-s08-p02','少量短暫差異通常不影響核心 correctness。','可降低同步 write contention 與 render latency。',[["因為 counter 永遠不重要","不是。"],["因為 event stream 沒有順序","可有 partition order。"],["因為 UI 不顯示","通常會顯示。"]]),
  MC('sd11-s08-q3','單一爆紅 post key 打滿一個 cache shard，consistent hashing 加 node 一定解嗎？','sd11-s08-p03','不一定，同一 key 仍映射到單一 owner。','需要 hot-key-specific cache/replication/coalescing。',[["一定解，因為 ring 更大","同 key 不會自動拆。"],["只能刪 post","不合理。"],["只能關閉 cache","會把壓力轉 DB。"]]),
  MC('sd11-s08-q4','「我是否按讚」和 global like count consistency 一樣嗎？','sd11-s08-p02','User action 常需要 read-your-writes，global counter可稍 stale。','不一樣，應依 UX/invariant 分別設計。',[["完全一樣","會過度或不足設計。"],["Global count 必須 serializable","通常不必要。"],["User action 永遠可延遲一天","UX 差。"]])
 ]
},
{
 id:'sd11-s09',order:9,title:'Failure、Multi-region、Observability 與完整 Feed Design',duration:'42–58 分鐘',summary:'把 publishing/retrieval、hybrid fanout、cache、failure recovery 與 metrics 組成完整架構。',
 research:[{label:'ByteByteGo — News Feed Wrap Up',url:'https://bytebytego.com/courses/system-design-interview/design-a-news-feed-system'}],
 pages:[
  {id:'sd11-s09-p01',title:'完整架構',blocks:[
   {type:'stepper',steps:[['Publish','Post Service durable write + cache。'],['Event','PostPublished queue/log。'],['Fanout','Graph filter → normal users push。'],['Celebrity','標記 pull source。'],['Feed Cache','user ordered post IDs。'],['Retrieval','IDs + celebrity merge → hydrate。'],['Media','CDN。'],['Metrics','fanout lag、feed latency、cache hit、queue age。']]}
  ]},
  {id:'sd11-s09-p02',title:'典型 Failure Modes',blocks:[
   {type:'compare',items:[['Fanout worker crash','At-least-once retry + idempotent timeline insert。'],['Feed cache loss','由 durable post/social graph rebuild。'],['Graph service slow','Fanout backlog；不要阻塞 post durable write。'],['Post cache miss storm','Request coalescing/warmup/DB protection。']]}
  ]},
  {id:'sd11-s09-p03',title:'要監控什麼？',blocks:[
   {type:'bullets',items:['Publish API P95/P99。','PostPublished queue depth / oldest age。','Fanout completion lag。','Feed read P95/P99。','Feed/Post/User cache hit rate。','Hydration batch latency。','Celebrity merge latency。','Duplicate/missing feed rate。','Hot key/shard QPS。']},
   {type:'callout',title:'最終 Checklist',text:'能講清楚 push、pull、hybrid 的 cost model，並知道 feed cache 是 derived data、post/social graph 是 source of truth，才算真正掌握。'}
  ]}],
 quiz:[
  MC('sd11-s09-q1','Fanout worker crash 為什麼 timeline insert 要 idempotent？','sd11-s09-p02','重試同 batch 不應讓同一 post 出現兩次。','支援 at-least-once retry 而不污染 feed。',[["因為 queue 不能 retry","可以。"],["因為 post_id 會變","不該。"],["因為 CDN 要求","無關。"]]),
  MC('sd11-s09-q2','Feed Cache loss 最重要的 recovery 前提？','sd11-s09-p02','它必須是 derived、可由 durable sources rebuild。','Post DB / Social Graph 仍保存 source-of-truth。',[["Cache 必須是唯一資料來源","風險極高。"],["User 要重發所有 post","不需要。"],["只要重啟 Web Server","不能重建資料。"]]),
  MC('sd11-s09-q3','Fanout lag 高但 Publish API 正常，代表？','sd11-s09-p03','Post durable path 健康，但 async distribution 跟不上。','朋友看到新 post 會變慢，需要看 queue/workers/graph/cache。',[["Post 一定丟失","不一定。"],["Feed read 一定 0ms","無關。"],["應讓 Publish API 同步等待所有 fanout","可能把問題擴散到 write path。"]]),
  MC('sd11-s09-q4','完整 Feed System 的核心 trade-off？','sd11-s09-p03','Publish cost vs Read latency，以及 hot follower distribution。','在 fanout-on-write 與 fanout-on-read 間依 follower/activity 做 hybrid。',[["只選 SQL vs NoSQL","太窄。"],["只加 Redis","不能決定 fanout model。"],["只做 CDN","media 只是部分。"]])
 ]
}
);
})();