(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_11={
 id:'sd-book-11',order:11,title:'設計動態訊息系統',
 subtitle:'把「發文」與「讀 Feed」拆成兩條資料流，深入 fanout-on-write、fanout-on-read、hybrid feed、cache 與 pagination。',
 objective:'完成後，你能從 publish/retrieval API 推導 Post Service、Fanout Service、News Feed Cache、Social Graph、Hydration 與 Celebrity Hot-key 處理。',
 sections:[],finalExam:[]
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd11-s01',order:1,title:'需求、規模與兩條核心 Flow',duration:'30–42 分鐘',summary:'先鎖 Feed 排序、朋友/追蹤上限、DAU、媒體內容，再把系統拆成 Publishing 與 Retrieval。',
 research:[{label:'ByteByteGo — Design A News Feed System',url:'https://bytebytego.com/courses/system-design-interview/design-a-news-feed-system'}],
 pages:[
  {id:'sd11-s01-p01',title:'先問 Feed 是 Chronological 還是 Ranked',blocks:[
   {type:'lead',text:'Feed 排序規則會改整個架構。若只要求 reverse chronological，score 可直接用 timestamp/message ID；若是 ML ranking，還要 candidate generation、feature、ranking service、online freshness。'},
   {type:'callout',title:'本章 Scope',text:'先採 reverse chronological，專注 fanout、cache、hot key 與 retrieval。最後再補 ranked feed 的擴充點。'}
  ]},
  {id:'sd11-s01-p02',title:'兩條 Flow：Publish 與 Read',blocks:[
   {type:'compare',items:[['Feed Publishing','User 發文 → Post Service 持久化 → Fanout → 將 post_id 推到朋友 feed。'],['News Feed Retrieval','User 開首頁 → 取得 feed post IDs → hydrate user/post/media → 回 JSON。']]},
   {type:'p',text:'這兩條 flow 的瓶頸不同：Publishing 受 follower count / fanout write amplification 影響；Retrieval 受 cache hit、hydration、pagination 與 ranking latency 影響。'}
  ]},
  {id:'sd11-s01-p03',title:'用數字辨識 Read-heavy / Fanout-heavy',blocks:[
   {type:'bullets',items:['DAU 10M。','平均每人每天讀 Feed 10 次 → 100M feed reads/day。','平均每人每天發 2 post → 20M posts/day。','平均 follower 200，若全 fanout-on-write → 4B timeline insert/day。']},
   {type:'callout',title:'關鍵',text:'原始 post write 不一定大，但「每篇 post 對多少 follower fanout」會把 write amplification 放大數百或數萬倍。'}
  ]}],
 quiz:[
  MC('sd11-s01-q1','為什麼 Feed 排序規則要先問？','sd11-s01-p01','Chronological 與 ranked feed 的 score 計算、資料 freshness、ranking dependency 完全不同。','它會直接改 retrieval/ranking pipeline 與 latency budget。',[["因為排序只影響 CSS","不是。"],["因為所有 feed 都一定 ML ranking","不是。"],["因為 timestamp 不能排序","可以。"]]),
  MC('sd11-s01-q2','News Feed System 的兩條主要 flow？','sd11-s01-p02','ByteByteGo 將設計拆成 publishing 與 building/retrieval。','發文/分發與讀取/組裝 Feed。',[["Login 與 Logout only","太窄。"],["DNS 與 TLS only","不是核心業務 flow。"],["Upload 與 Payment","不是本題主軸。"]]),
  MC('sd11-s01-q3','平均 follower 很大時 fanout-on-write 最大量級風險？','sd11-s01-p03','一篇 post 可能產生大量 timeline writes。','Write amplification。',[["一定沒有 cache hit","無關。"],["HTTP 會變 stateful","無關。"],["所有 post 都變 duplicate","不是。"]]),
  MC('sd11-s01-q4','原始 post QPS 不高，是否代表 Feed 系統很輕？','sd11-s01-p03','不一定；fanout 與 read/hydration 會放大量級。','不代表，需估 fanout insert 與 feed read QPS。',[["代表一定單機即可","未考慮 amplification。"],["只要 DB 有 index 就夠","架構還有 fanout/cache。"],["只看 DAU 就能決定","需要行為頻率。"]])
 ]
},
{
 id:'sd11-s02',order:2,title:'API、Post Model 與 Cursor Pagination',duration:'32–46 分鐘',summary:'設計 publish/get feed API，並用 cursor 避免 offset pagination 在動態 Feed 上跳頁/重複。',
 research:[{label:'ByteByteGo — Newsfeed APIs',url:'https://bytebytego.com/courses/system-design-interview/design-a-news-feed-system'}],
 pages:[
  {id:'sd11-s02-p01',title:'最小 API',blocks:[
   {type:'code',text:'POST /v1/me/feed\n{ content, media_ids[], idempotency_key }\n\nGET /v1/me/feed?cursor=<opaque>&limit=20'},
   {type:'p',text:'Publish API 要處理 auth/rate limit/idempotency；Retrieval API 要有 stable cursor 與 limit。'}
  ]},
  {id:'sd11-s02-p02',title:'為什麼不愛 OFFSET 10000？',blocks:[
   {type:'compare',items:[['Offset Pagination','新 post 插入前面時，page 2 的 offset 位置漂移，容易 duplicate/skip；深頁查詢也可能昂貴。'],['Cursor Pagination','用 last_score/last_post_id 做邊界，對 append-heavy timeline 更穩定。']]},
   {type:'callout',title:'Cursor 應 Opaque',text:'Client 不需要理解內部 shard/timestamp 格式；server 可 encode score + tie-breaker。'}
  ]},
  {id:'sd11-s02-p03',title:'Post Object 與 Feed Entry 不要混',blocks:[
   {type:'compare',items:[['Post','post_id、author_id、content、media refs、created_at。'],['Feed Entry','user_id、post_id、rank/timestamp、fanout metadata。']]},
   {type:'p',text:'Feed cache 只放 post_id/score 可大幅降低 memory；真正 post body 從 Post Cache/DB hydrate。'}
  ]}],
 quiz:[
  MC('sd11-s02-q1','動態 Feed 為什麼 cursor pagination 比 offset 穩？','sd11-s02-p02','新內容插入前端時 cursor 以邊界定位，不依賴整體位置。','降低新增資料造成 skip/duplicate 的問題。',[["因為 cursor 永遠 O(1)","不一定，取決於 storage/index。"],["因為 offset 不能用 SQL","可以。"],["因為 cursor 不需排序","仍需要 ordered key/score。"]]),
  MC('sd11-s02-q2','Feed Cache 為何常只放 post IDs？','sd11-s02-p03','避免每個 follower timeline 重複複製整個 post/user object。','降低 fanout cache memory 與更新重複資料。',[["因為 Redis 不能存 JSON","可以。"],["因為 Post 不需要內容","仍需要 hydrate。"],["因為 user_id 不能 cache","可以。"]]),
  MC('sd11-s02-q3','Publish API 的 idempotency_key 解什麼？','sd11-s02-p01','Client retry 不應建立兩篇相同 post。','避免 timeout/retry 造成 duplicate post。',[["避免 follower 太多","不是。"],["避免 pagination","不是。"],["避免 CDN miss","不是。"]]),
  MC('sd11-s02-q4','Feed Entry 與 Post 分表/分 cache 的優點？','sd11-s02-p03','Timeline 只需排序/引用，Post content 可獨立 cache/update。','分離 ordering metadata 與 content，降低複製與耦合。',[["讓所有資料變 strong consistent","不自動。"],["不用 Post DB","仍需 source of truth。"],["取消 fanout","不是。"]])
 ]
},
{
 id:'sd11-s03',order:3,title:'Publish Flow：Post Service、Fanout Service、Notification',duration:'36–50 分鐘',summary:'把「發文成功」與「推到所有人的 Feed」拆成 durable write + async fanout。',
 research:[{label:'ByteByteGo — Feed Publishing',url:'https://bytebytego.com/courses/system-design-interview/design-a-news-feed-system'}],
 pages:[
  {id:'sd11-s03-p01',title:'先持久化 Post，再 Fanout',blocks:[
   {type:'diagram',nodes:[['Client','POST'],['Web/API','auth/rate'],['Post Service','DB + Cache'],['Event/Queue','post published'],['Fanout Workers','followers'],['Feed Cache','append post_id']],caption:'Post durable 成功後才發布 fanout event；不要把 5000 follower writes 綁在同步 API transaction。'},
   {type:'callout',title:'User Experience',text:'Publish API 可在 Post durable 後回成功；朋友 timeline eventual 出現通常可接受。'}
  ]},
  {id:'sd11-s03-p02',title:'Fanout Service 需要 Social Graph',blocks:[
   {type:'stepper',steps:[['Get follower IDs','Graph DB / social graph cache。'],['Filter','block/mute/privacy/audience。'],['Enqueue batches','不要一筆 event 帶 10M IDs。'],['Workers','將 post_id 寫入各 user feed。']]},
   {type:'p',text:'Privacy filter 不能只在最後 render；否則不該看的人 post_id 已經進 cache，可能形成 data leak 或清理困難。'}
  ]},
  {id:'sd11-s03-p03',title:'Fanout 要 Async 與可重試',blocks:[
   {type:'p',text:'Worker crash、cache shard timeout、social graph partial failure 都可能讓部分 follower 漏寫。fanout job 需要 chunk identity、retry、idempotent timeline insert。'},
   {type:'callout',title:'At-least-once',text:'Timeline insert 最好用 post_id 去重；即使 batch 重試也不應出現同一 post 兩次。'}
  ]}],
 quiz:[
  MC('sd11-s03-q1','為什麼不在 Publish HTTP request 內同步寫完所有 follower timelines？','sd11-s03-p01','Follower count 可巨大，會讓 API latency/availability 綁死在 fanout。','應先 durable post，再 async fanout。',[["因為 HTTP 不能寫多筆","可以。"],["因為 cache 不能更新","可以。"],["因為 post 不需 DB","仍需 source of truth。"]]),
  MC('sd11-s03-q2','Fanout 前做 mute/block/privacy filter 的原因？','sd11-s03-p02','避免把不該可見內容寫入 recipient feed。','維持 audience correctness 並減少後續清理。',[["只為省 CPU","不只，還有 correctness/privacy。"],["因為 CDN 需要","無關。"],["因為 Post DB 不能 filter","不是。"]]),
  MC('sd11-s03-q3','Fanout batch retry 可能重複，timeline insert 應？','sd11-s03-p03','以 user_id + post_id 等 identity idempotent。','Dedup/idempotent insert。',[["每次改 post_id","會失去 identity。"],["關掉 retry","會漏資料。"],["只靠 UI 去重","storage 仍污染。"]]),
  MC('sd11-s03-q4','Post durable 後 fanout 晚 2 秒，是否一定不可接受？','sd11-s03-p01','Feed 通常可接受短暫 eventual consistency。','不一定，若產品允許 eventual feed freshness，這是合理 trade-off。',[["一定要 global transaction","代價高且未必需要。"],["代表 post 丟失","Post 已 durable。"],["代表 cache 壞掉","未必。"]])
 ]
},
{
 id:'sd11-s04',order:4,title:'Fanout-on-Write：快讀取的代價是寫入放大',duration:'36–50 分鐘',summary:'理解 Push Model 的優點、inactive user 浪費與 celebrity hot-key 問題。',
 research:[{label:'ByteByteGo — Fanout on Write',url:'https://bytebytego.com/courses/system-design-interview/design-a-news-feed-system'}],
 pages:[
  {id:'sd11-s04-p01',title:'Push Model：Publish 時預先計算 Timeline',blocks:[
   {type:'diagram',nodes:[['Author Post','1 write'],['Follower List','N users'],['Fanout Workers','N inserts'],['Feed Caches','precomputed']],caption:'Read path 非常快，因為 timeline 已經先算好。'},
   {type:'compare',items:[['優點','首頁讀取低延遲、簡單：直接拿 precomputed IDs。'],['缺點','Write amplification、inactive users 浪費、celebrity 發文爆量。']]}
  ]},
  {id:'sd11-s04-p02',title:'Inactive User Waste',blocks:[
   {type:'p',text:'如果 60% user 一週才開一次 App，為他們每篇朋友貼文即時寫 feed cache 可能是浪費。可以只維持最近 N 筆、依 active status 決定 fanout 或讓 inactive user 回來時 rebuild。'}
  ]},
  {id:'sd11-s04-p03',title:'Celebrity Problem：1 篇 Post → 50M Writes',blocks:[
   {type:'p',text:'名人 follower 數極高時，fanout-on-write 會把單一事件變成巨大 job。這不是單純「多加 worker」就完美解，因為會佔滿 queue、cache writes 與網路。'},
   {type:'callout',title:'Hybrid 將在下一節',text:'一般 user 用 push，celebrity 改 pull，是最常見的折衷。'}
  ]}],
 quiz:[
  MC('sd11-s04-q1','Fanout-on-write 最大優點？','sd11-s04-p01','Feed 已預先計算，read path 快。','讀 Feed 時只需取預先寫好的 timeline。',[["完全沒有寫成本","相反。"],["不需 social graph","fanout 仍需 follower list。"],["不需 cache","通常更依賴 feed cache。"]]),
  MC('sd11-s04-q2','為 inactive user 預先 fanout 的問題？','sd11-s04-p02','大量寫入可能永遠沒被讀。','浪費 compute/cache/storage write。',[["會讓 post 消失","不一定。"],["只會影響 DNS","不是。"],["會讓 HTTP 失效","不是。"]]),
  MC('sd11-s04-q3','Celebrity 50M followers 發一篇 post，push model 最主要壓力？','sd11-s04-p03','單 event 產生數千萬 timeline writes。','極大的 fanout write amplification / hot job。',[["Read QPS 立即變 0","不是。"],["Post DB 一定只能存一筆所以失敗","Post 本身一筆沒問題。"],["Cursor 不能使用","不是核心。"]]),
  MC('sd11-s04-q4','Push model 是否表示所有資料都 strong consistent？','sd11-s04-p01','不是；fanout worker 本身可 async/eventual。','不是，precompute timeline 與 consistency model 是不同問題。',[["是，只要寫 cache 就 strong","錯。"],["只有 SQL 才有 consistency","錯。"],["Push model 不能 retry","可以。"]])
 ]
}
);
})();