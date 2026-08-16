(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_12={
 id:'sd-book-12',order:12,title:'設計聊天系統',
 subtitle:'從 WebSocket persistent connection 出發，設計 1:1、小群組、Message Ordering、多裝置同步、Presence 與 Offline Push。',
 objective:'完成後，你能解釋 Stateful Chat Server、Service Discovery、Message Sync Queue、KV History、Heartbeat 與 reconnect recovery。',
 sections:[],finalExam:[]
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd12-s01',order:1,title:'需求與規模：1:1、小群組、多裝置、Presence',duration:'30–42 分鐘',summary:'鎖定 50M DAU、group ≤100、text-only、history forever、多裝置與低延遲，再決定 realtime architecture。',
 research:[{label:'ByteByteGo — Design A Chat System / Requirements',url:'https://bytebytego.com/courses/system-design-interview/design-a-chat-system'}],
 pages:[
  {id:'sd12-s01-p01',title:'先問是哪一種 Chat',blocks:[
   {type:'compare',items:[['1:1 Messenger','低 latency、可靠 history、multi-device。'],['Small Group','fanout + ordering + membership。'],['Massive Channel','100k+ members 需要不同 broadcast architecture。'],['Voice/Game Chat','media/UDP/latency priorities 完全不同。']]},
   {type:'callout',title:'本章 Scope',text:'依 ByteByteGo：50M DAU、1:1 + group ≤100、text message、online presence、multi-device、push、history forever。'}
  ]},
  {id:'sd12-s01-p02',title:'Chat 的 Capacity 不是只有 Message QPS',blocks:[
   {type:'bullets',items:['Concurrent WebSocket connections。','Messages/sec、peak burst。','Message storage/day × retention。','Presence heartbeat/sec。','Group fanout amplification。','Reconnect storm / offline sync read QPS。']},
   {type:'p',text:'Chat server 常先卡 connection/file descriptor/memory/network，而不是 API CPU。1M persistent connections 即使每條只占少量 memory，failure blast radius 也不能只放一台。'}
  ]},
  {id:'sd12-s01-p03',title:'核心 SLO',blocks:[
   {type:'compare',items:[['Send Ack','Sender 幾十到幾百 ms 知道 server 接受/持久化。'],['Online Delivery','P95/P99 端到端 message latency。'],['History','不因 chat server crash 丟失。'],['Presence','允許數秒 eventual，不應每次網路抖動閃爍。']]}
  ]}],
 quiz:[
  MC('sd12-s01-q1','為什麼先問 group size？','sd12-s01-p01','100 人與 100k 人的 fanout/online presence 設計差異巨大。','它直接決定群組 fanout 與 presence scalability。',[["只影響 UI avatar 大小","不是。"],["Group size 不影響 backend","影響非常大。"],["只影響 SQL schema 名稱","太窄。"]]),
  MC('sd12-s01-q2','Chat capacity planning 為什麼要估 concurrent connections？','sd12-s01-p02','Persistent WebSocket 會長時間佔 server connection/memory。','Realtime tier 的主要 capacity dimension 之一是同時連線數。',[["因為每個 message 都新建 WebSocket","不是，通常持久。"],["因為 DB connection 等於 user connection","不是一回事。"],["因為 DNS 要為每 user 開 port","不是。"]]),
  MC('sd12-s01-q3','Presence 是否通常需要每毫秒 strong consistency？','sd12-s01-p03','不需要；短暫 eventual/debounce 常改善 UX。','通常允許數秒誤差，透過 heartbeat/timeout 平滑網路抖動。',[["需要全球 serializable transaction","多數產品不必要。"],["Presence 完全不需 storage","仍需共享狀態/last active。"],["只有 offline/online 不能有 timeout","反而常用 timeout。"]]),
  MC('sd12-s01-q4','Chat history forever 對架構最直接的影響？','sd12-s01-p02','需要 durable scalable message storage，不可只存在 connection server memory。','必須設計長期 history storage、partition、retention/backup。',[["只要 WebSocket 不斷線即可","server memory 不是永久 storage。"],["只要 client cache","多裝置/換手機會丟。"],["只要 presence KV","資料模型不同。"]])
 ]
},
{
 id:'sd12-s02',order:2,title:'Polling、Long Polling、WebSocket：為何 Chat 選 Persistent Connection',duration:'34–48 分鐘',summary:'比較 receiver-side communication 模型，理解 RFC 6455 handshake、bidirectional 與 connection management。',
 research:[
  {label:'ByteByteGo — Polling / Long Polling / WebSocket',url:'https://bytebytego.com/courses/system-design-interview/design-a-chat-system'},
  {label:'RFC 6455 — The WebSocket Protocol',url:'https://www.rfc-editor.org/rfc/rfc6455.html'}
 ],
 pages:[
  {id:'sd12-s02-p01',title:'Polling：大量「有新訊息嗎？」',blocks:[
   {type:'compare',items:[['Polling','固定週期 request；沒新訊息也花 request/CPU/network。'],['Long Polling','Server hold request 到新訊息或 timeout；比 polling 好但 reconnect/connection routing 複雜。'],['WebSocket','一次 handshake 後 persistent bidirectional connection。']]}
  ]},
  {id:'sd12-s02-p02',title:'WebSocket 從 HTTP Upgrade 開始',blocks:[
   {type:'code',text:'GET /chat HTTP/1.1\nUpgrade: websocket\nConnection: Upgrade\nSec-WebSocket-Version: 13\n\nHTTP/1.1 101 Switching Protocols'},
   {type:'p',text:'RFC 6455 定義 opening handshake 與 frames。建立後雙方都可主動送 message/control frame。Browser 還會帶 Origin；Server 應驗證可接受 origin/auth。'}
  ]},
  {id:'sd12-s02-p03',title:'Persistent Connection 的代價',blocks:[
   {type:'bullets',items:['Connection lifecycle、heartbeat、idle timeout。','Server draining：部署時不能粗暴斷百萬 connections。','Load balancer/proxy 要支援 WebSocket upgrade/idle timeout。','Backpressure：slow client 不能讓 send buffer 無限長。','Reconnect storm：Region/network 恢復時大量 client 同時重連。']},
   {type:'callout',title:'不是所有 API 都 WebSocket',text:'Login、profile、group management 等 stateless CRUD 仍可 HTTP；Realtime message/presence 才走 WS。'}
  ]}],
 quiz:[
  MC('sd12-s02-q1','Polling 最大浪費？','sd12-s02-p01','大量 request 回答「沒有新訊息」。','Client 週期性詢問，即使 idle 仍耗 server/network。',[["不能回任何 message","可以。"],["只能用 UDP","不是。"],["一定比 WebSocket 更 stateful","不是核心。"]]),
  MC('sd12-s02-q2','WebSocket 101 Switching Protocols 代表？','sd12-s02-p02','HTTP handshake 成功升級到 WebSocket protocol。','Server 接受 Upgrade，開始 WebSocket frames。',[["永久 HTTP redirect","那是 3xx。"],["Authentication 一定成功","101 本身不等於你的 auth policy。"],["Message 已寫 DB","無關。"]]),
  MC('sd12-s02-q3','為什麼 Chat 不把所有功能都改 WebSocket？','sd12-s02-p03','很多 CRUD/request-response 用 HTTP 更簡單、stateless、易 cache/observe。','Realtime 用 WS；一般 API 保持 HTTP 可降低 stateful complexity。',[["因為 WebSocket 不能雙向","它正是雙向。"],["因為 HTTP 不能登入","可以。"],["因為 WS 不可傳文字","可以。"]]),
  MC('sd12-s02-q4','100k clients 網路恢復同時 reconnect，叫什麼風險？','sd12-s02-p03','Reconnect storm/thundering herd。','瞬時 connection/auth/service-discovery 尖峰，需要 jitter/backoff。',[["Content dedup","不是。"],["Feed fanout","不是。"],["Hash collision only","不是。"]])
 ]
},
{
 id:'sd12-s03',order:3,title:'High-Level Design：Stateless API、Stateful Chat、Presence、KV、Push',duration:'38–54 分鐘',summary:'把長連線 realtime tier 和一般 HTTP services 分離，讓各自獨立擴縮。',
 research:[{label:'ByteByteGo — Chat High-Level Design',url:'https://bytebytego.com/courses/system-design-interview/design-a-chat-system'}],
 pages:[
  {id:'sd12-s03-p01',title:'Stateful vs Stateless',blocks:[
   {type:'diagram',nodes:[['Client','HTTP + WS'],['API Services','auth/profile/group'],['Service Discovery','pick chat server'],['Chat Servers','persistent WS'],['Presence','online state'],['Message Queue','sync/fanout'],['KV History','durable messages'],['Push','offline']],caption:'Stateful Realtime 與 stateless business API 分離。'},
   {type:'p',text:'Chat Server stateful 是因 client connection 綁在特定 server；同一 client 通常不會每個 message round-robin 到不同 server。'}
  ]},
  {id:'sd12-s03-p02',title:'History 為什麼常考慮 KV / Wide-column',blocks:[
   {type:'bullets',items:['寫入量極高、append-heavy。','讀取多集中最近 history，但也需按 conversation/message ID range 查。','Partition key 可用 conversation_id；sort key 用 message_id。','Old messages 可冷儲存/分層，但仍需 random access/jump/search。']},
   {type:'callout',title:'不是因為「NoSQL 比 SQL 快」',text:'選 storage 要從 message access pattern、partition、ordering、scale 推導。'}
  ]},
  {id:'sd12-s03-p03',title:'Realtime Server 不應是唯一 Message Storage',blocks:[
   {type:'p',text:'Chat server 可以 buffer in-flight message，但 sender ack 的 durability semantics 要明確：若答「sent」後 server crash，message 是否可能丟？通常至少要寫 durable queue/log/store 後再回可靠 ack。'},
   {type:'callout',title:'Ack Semantics',text:'Client-side single check / double check UX 背後其實是不同 delivery state：server accepted、recipient delivered、recipient read。'}
  ]}],
 quiz:[
  MC('sd12-s03-q1','Chat Server 為何是 stateful service？','sd12-s03-p01','它長時間持有 client WebSocket connection/session。','Connection 會綁在特定 realtime server。',[["因為所有 API 都存 SQL session","不是。"],["因為 WebSocket 不能 scale","可以 scale，但 connection有 ownership。"],["因為 HTTP 一定 stateful","相反。"]]),
  MC('sd12-s03-q2','Chat history storage 選型應看什麼？','sd12-s03-p02','主要看 conversation append/range read/scale access pattern。','Message access pattern、partition/order 與 throughput。',[["只看 NoSQL 品牌知名度","不是推導。"],["只看 UI framework","無關。"],["只看 DAU 不看 messages","不夠。"]]),
  MC('sd12-s03-q3','Server 回 sender「已送出」前最該定義？','sd12-s03-p03','Ack 到底代表 memory accepted、durable persisted、recipient delivered？','Ack semantics / durability boundary。',[["Icon 顏色","只是 UI 表現。"],["WebSocket frame 長度","不是核心。"],["User avatar","無關。"]]),
  MC('sd12-s03-q4','Presence Server 與 Chat Server 為何可分？','sd12-s03-p01','Presence 是高頻 ephemeral state/fanout，message delivery 是另一 concern，可獨立擴縮。','責任與 access pattern 不同，降低耦合。',[["因為 presence 不需要 WS","可透過 WS。"],["因為 Chat 不能知道 online","可以查 presence。"],["因為只有兩台 server 才能 scale","不是。"]])
 ]
},
{
 id:'sd12-s04',order:4,title:'Service Discovery、Connection Routing 與 Server Failover',duration:'36–50 分鐘',summary:'登入後選擇合適 chat server，維護 user→connection ownership，server failure 時安全重連。',
 research:[{label:'ByteByteGo — Service Discovery',url:'https://bytebytego.com/courses/system-design-interview/design-a-chat-system'}],
 pages:[
  {id:'sd12-s04-p01',title:'Service Discovery 不只是 DNS Round Robin',blocks:[
   {type:'stepper',steps:[['Authenticate','HTTP login。'],['Discover','依 region/capacity/server health 選 Chat Server。'],['Return endpoint','Client 得到 server hostname。'],['Connect','建立 WebSocket。'],['Register','user/device → chat_server/session mapping。']]}
  ]},
  {id:'sd12-s04-p02',title:'Connection Directory：Recipient 到底連在哪台？',blocks:[
   {type:'code',text:'user:42 -> [\n  {device:iphone, server:chat-17, conn:c881},\n  {device:laptop, server:chat-03, conn:c992}\n]'},
   {type:'p',text:'Send path 必須能找到 recipient 所有 active sessions。Directory 可由 presence/connection service 管理，並用 heartbeat/lease 避免 zombie mapping。'}
  ]},
  {id:'sd12-s04-p03',title:'Chat Server 掛掉：Reconnect，而不是透明搬 TCP',blocks:[
   {type:'p',text:'Persistent connection 無法魔法搬到另一 process。Server failure 後 client 偵測斷線，backoff+jitter 後重新 discovery/connect，再用 last message cursor 補 missed messages。'},
   {type:'callout',title:'Deploy Draining',text:'正常部署先停止接新 connection、通知/等待既有 client reconnect，再 terminate，降低集中斷線。'}
  ]}],
 quiz:[
  MC('sd12-s04-q1','Service discovery 選 Chat Server 最值得考慮？','sd12-s04-p01','地理位置、capacity、health、connection count。','Region/latency + server capacity/health。',[["隨機永遠最好","可能造成 overload/遠距。"],["只看 hostname 字母順序","無關。"],["只看 DB size","不是 connection placement 的唯一因素。"]]),
  MC('sd12-s04-q2','要把 message 推給 User B，先需要什麼？','sd12-s04-p02','知道 B 哪些 devices/sessions 連在哪些 chat servers。','Connection Directory / Presence mapping。',[["只知道 B 的 email","不足以 realtime route。"],["只知道 sender server","recipient 可能在另一台。"],["只知道 post ID","不是 chat。"]]),
  MC('sd12-s04-q3','Chat Server crash 後最合理 recovery？','sd12-s04-p03','Client reconnect + sync missed history。','Backoff/jitter → rediscovery → new WS → cursor sync。',[["透明搬原 TCP connection","一般無法跨 process 搬。"],["永久 offline","availability 太差。"],["刪除 history","不合理。"]]),
  MC('sd12-s04-q4','Connection mapping 為何要 heartbeat/lease？','sd12-s04-p02','避免 crash/network loss 後留下 zombie online session。','讓 stale mapping 自動過期，維持 routing correctness。',[["讓 message ID 變短","無關。"],["讓 WebSocket 變 HTTP","不是。"],["取代 history DB","不同責任。"]])
 ]
},
{
 id:'sd12-s05',order:5,title:'1:1 Message Flow：ID、Queue、Durability、Online/Offline',duration:'40–56 分鐘',summary:'逐步追一則訊息從 User A 到 User B，定義 message ID、durable boundary、online routing 與 push fallback。',
 research:[{label:'ByteByteGo — 1 on 1 Chat Flow',url:'https://bytebytego.com/courses/system-design-interview/design-a-chat-system'}],
 pages:[
  {id:'sd12-s05-p01',title:'完整 1:1 Flow',blocks:[
   {type:'stepper',steps:[['1','A → Chat Server 1：client_msg_id + conversation + body。'],['2','Server 驗證 membership/rate/size，配置 message_id。'],['3','寫 durable message sync queue/log。'],['4','Consumer 寫 KV history。'],['5a','B online → 找 Chat Server 2/session，推 WS。'],['5b','B offline → Push Notification。'],['6','B 收到後 client/server 更新 delivered/read state。']]}
  ]},
  {id:'sd12-s05-p02',title:'Message ID：Uniqueness + Ordering Scope',blocks:[
   {type:'compare',items:[['Global Snowflake-like','全局 unique、大致有序；需要 worker/clock 管理。'],['Conversation-local Sequence','只需在 conversation/group 內 monotonic，較容易滿足 message order。']]},
   {type:'p',text:'Chat 通常真正需要的是「同一 conversation 可建立穩定順序」，不一定要全世界 message IDs 完全連續。'}
  ]},
  {id:'sd12-s05-p03',title:'client_msg_id：Sender Retry 的 Dedup Key',blocks:[
   {type:'p',text:'手機送 message 後網路斷掉，沒收到 ack，會 retry。同一 client_msg_id 應映到原 server message_id，不應新增第二則。'},
   {type:'callout',title:'Offline-first',text:'Client 可先用 local temporary ID 顯示 optimistic bubble，server ack 後 reconcile 成 canonical message_id。'}
  ]}],
 quiz:[
  MC('sd12-s05-q1','Message durable 前就回 sender「server accepted」，server crash 可能？','sd12-s05-p01','若 ack semantics 表示可靠接受，卻只在 RAM，可能已顯示成功但 message 丟失。','造成 acknowledged-but-lost；應在 durable boundary 後回可靠 ack。',[["一定由 WebSocket 自動重放","協定不保證 application durability。"],["只會影響 presence","message 本身可能丟。"],["只要 client 在線就不會","server crash 仍可能。"]]),
  MC('sd12-s05-q2','為何 conversation-local sequence 可接受？','sd12-s05-p02','使用者需要同一聊天內穩定順序，不必全局連續。','Ordering requirement 通常是 per conversation。',[["因為不同 conversation message 不需 unique","仍可用 compound key 保證 unique。"],["因為時間戳永遠無 collision","不是。"],["因為 group 不需 order","仍需要。"]]),
  MC('sd12-s05-q3','Sender retry 同一 message，如何防雙發？','sd12-s05-p03','Stable client_msg_id/idempotency key。','同 client_msg_id 返回既有 message_id，不重複建立。',[["每次 retry 換新 ID","會失去 dedup。"],["關掉 retry","會降低 reliability。"],["只靠 recipient UI 去重","server history 仍會重複。"]]),
  MC('sd12-s05-q4','Recipient offline 時最常見 fallback？','sd12-s05-p01','Message 先 durable 存 history，另外送 Push 喚回 user。','持久化訊息，送 Push Notification；上線後同步 history。',[["只把 message 放 sender RAM","recipient 永遠拿不到。"],["丟掉 message","不符合 history requirement。"],["強制 recipient WebSocket 存在","offline 無法。"]])
 ]
}
);
})();