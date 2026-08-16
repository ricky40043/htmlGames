(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_12;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd12-s06',order:6,title:'多裝置同步與離線 Catch-up',duration:'38–52 分鐘',summary:'每台裝置維護自己的同步 cursor，上線後只補 missed messages，不要求所有裝置即時完全一致。',
 research:[{label:'ByteByteGo — Multiple Devices / Message Synchronization',url:'https://bytebytego.com/courses/system-design-interview/design-a-chat-system'}],
 pages:[
  {id:'sd12-s06-p01',title:'每台 Device 都有自己的 Sync Cursor',blocks:[
   {type:'code',text:'device:iphone -> cur_max_message_id = 9810\ndevice:laptop -> cur_max_message_id = 9788\n\nSync query: messages > cur_max_message_id'},
   {type:'p',text:'手機可能已看到最新訊息，筆電離線一天。不能用 user-level 單一 cursor；每個 device/session 要各自知道同步到哪裡。'}
  ]},
  {id:'sd12-s06-p02',title:'Reconnect 後不是「等新訊息」，而是先補 Gap',blocks:[
   {type:'stepper',steps:[['Reconnect','建立新 WebSocket。'],['Authenticate device','帶 device/session identity。'],['Send cursor','最後已知 message_id。'],['Catch-up','拉取 cursor 後的 missed messages。'],['Live mode','補完後進 realtime stream。']]},
   {type:'callout',title:'Race',text:'Catch-up 與 live message 可能同時到達；需以 message_id/order buffer 去重與排序，不能假設同步 RPC 完成前不會有新訊息。'}
  ]},
  {id:'sd12-s06-p03',title:'History Gap 很大時要 Pagination',blocks:[
   {type:'p',text:'裝置離線三個月可能差 10 萬則訊息。Sync API 應分頁/stream，限制 batch size，並允許先取最近訊息、背景補舊歷史。'},
   {type:'callout',title:'UX Trade-off',text:'「先讓 user 看到最新 100 則」通常比等 10 萬則全部同步完再進聊天室更好。'}
  ]}],
 quiz:[
  MC('sd12-s06-q1','為什麼 multi-device 不能只保存一個 user-level cursor？','sd12-s06-p01','不同裝置的同步進度不同。','每台 device 可能離線時間不同，需要獨立 cursor。',[["因為 message_id 每台裝置都不同","canonical message_id 可相同。"],["因為 user 不能有多裝置","可以。"],["因為 cursor 只能放 RAM","可 durable 保存。"]]),
  MC('sd12-s06-q2','Reconnect 後直接只收 live messages 的風險？','sd12-s06-p02','斷線期間的訊息會形成 gap。','需要先依 cursor 補 missed history，再與 realtime stream 銜接。',[["WebSocket 會自動補 application messages","RFC 不保證你的業務歷史。"],["只要 Push 有送就不用補","Push 不是完整 history。"],["重新登入會自動重建訊息","不一定。"]]),
  MC('sd12-s06-q3','Catch-up 與 live message 同時到達，如何避免 duplicate/out-of-order？','sd12-s06-p02','以 canonical message_id/order 去重與排序。','Client/server sync layer 依 message ID 去重並建立穩定順序。',[["相信網路一定按業務順序到","不同路徑不保證。"],["每次改 message_id","會破壞 identity。"],["關閉 realtime","不是必要。"]]),
  MC('sd12-s06-q4','離線三個月有 10 萬則 history，最佳 UX？','sd12-s06-p03','分頁/stream，優先近期資料。','先載最近一批，背景/按需補舊歷史。',[["一次同步 10 萬則後才顯示 UI","延遲與記憶體差。"],["只丟掉舊訊息","違反 history requirement。"],["每則開一條 WebSocket","完全不合理。"]])
 ]
},
{
 id:'sd12-s07',order:7,title:'Small Group Chat：Fanout、Membership 與共享內容',duration:'40–56 分鐘',summary:'群組 ≤100 時可做 per-recipient fanout，但要處理 membership snapshot、retry、離群語意與重複。',
 research:[{label:'ByteByteGo — Small Group Chat Flow',url:'https://bytebytego.com/courses/system-design-interview/design-a-chat-system'}],
 pages:[
  {id:'sd12-s07-p01',title:'Small Group 可以直接 Fanout 到 Recipient Sync Queues',blocks:[
   {type:'diagram',nodes:[['Sender','group msg'],['Group Service','members ≤100'],['Message Store','one canonical message'],['Fanout','recipient IDs'],['Sync Queues','per user/device'],['Chat Servers','online sessions']],caption:'群組小時，O(group size) fanout 可接受，設計比大型 broadcast channel 簡單。'},
   {type:'p',text:'Message content 可只存一份 canonical record，recipient queue/timeline 只存 message_id/reference，避免把 body 複製 100 份。'}
  ]},
  {id:'sd12-s07-p02',title:'Membership Snapshot：送出當下誰有資格收到？',blocks:[
   {type:'p',text:'User A 送出訊息同時 User B 被踢群。要定義 membership cut：依 server accepted 時的 group version/member snapshot，決定這則 message recipients。'},
   {type:'callout',title:'不要用「worker fanout 當下」查最新成員',text:'Fanout 可能晚幾秒；若每個 worker 查到不同 membership version，同一 message recipients 會不一致。'}
  ]},
  {id:'sd12-s07-p03',title:'Group Fanout 也需要 Idempotency',blocks:[
   {type:'stepper',steps:[['Create canonical message','message_id unique。'],['Snapshot members','group_version。'],['Create fanout batches','batch identity。'],['Retry safely','recipient inbox insert 使用 (recipient,message_id) unique。']]},
   {type:'p',text:'Worker retry 不應讓同一群組訊息在某 member inbox 出現兩次。'}
  ]}],
 quiz:[
  MC('sd12-s07-q1','Small group message 為什麼可 per-recipient fanout？','sd12-s07-p01','Group size 上限約 100，O(N) fanout 成本可控。','成員數小，逐 recipient 建 sync entry 可接受。',[["因為 group message 不需 storage","仍要 durable history。"],["因為 WebSocket 自動 fanout","不是。"],["因為所有成員在同 server","不一定。"]]),
  MC('sd12-s07-q2','為什麼 canonical message body 不必複製 100 份？','sd12-s07-p01','Recipient queue 可只存 message_id/ref。','共享內容一份，recipient state 只保存 reference。',[["因為每人不需看到內容","仍會 hydrate。"],["因為 KV 不能 duplicate","可以但浪費。"],["因為 message_id 就是內容","不是。"]]),
  MC('sd12-s07-q3','Send 與 kick member 同時發生，怎麼決定 recipient？','sd12-s07-p02','需要明確 membership snapshot/version cut。','依 server 接受訊息時的 group version/member snapshot。',[["每個 worker 自己查最新成員","可能得到不同集合。"],["永遠都送給被踢的人","不一定符合語意。"],["完全忽略 group membership","會 data leak。"]]),
  MC('sd12-s07-q4','Fanout batch retry 後 recipient 收到兩份，缺什麼？','sd12-s07-p03','Recipient inbox insertion 不 idempotent。','以 recipient + message_id 去重/唯一約束。',[["更大的 group size","不解。"],["關掉 retry","會漏 delivery。"],["把 message body 改短","無關。"]])
 ]
},
{
 id:'sd12-s08',order:8,title:'Ordering、Ack、Dedup 與 Read Receipts',duration:'40–56 分鐘',summary:'Chat 不需要全球總順序，但要建立 conversation-level ordering、delivery state 與 retry-safe semantics。',
 research:[{label:'ByteByteGo — Message Sync / Message ID',url:'https://bytebytego.com/courses/system-design-interview/design-a-chat-system'}],
 pages:[
  {id:'sd12-s08-p01',title:'Ordering Scope：Per Conversation 通常就夠',blocks:[
   {type:'compare',items:[['Global Total Order','全世界所有 conversation 共用順序，協調成本高且多半沒 UX 價值。'],['Conversation Order','同一聊天內 message order 穩定，符合使用者認知。']]},
   {type:'p',text:'可使用 conversation-local sequence，或可排序 global ID + conversation-level tie-breaker。重點是同一 thread 不能因多 worker 競爭亂序。'}
  ]},
  {id:'sd12-s08-p02',title:'Ack State：Accepted、Delivered、Read',blocks:[
   {type:'stepper',steps:[['Accepted','Server 已可靠接收/持久化。'],['Delivered','至少一個 recipient device 已收到。'],['Read','Recipient client 明確回報已讀。']]},
   {type:'callout',title:'Multi-device',text:'Delivered/read 可以是 per-device，再聚合成 user-level semantics；例如任何一台 read 即顯示已讀。產品要先定義。'}
  ]},
  {id:'sd12-s08-p03',title:'Out-of-order Arrival 與 Dedup',blocks:[
   {type:'p',text:'不同 network path/retry/reconnect 可能讓 msg 102 先於 101 到 device。Client 可短暫 buffer，按 sequence 排序；若 gap 太久則觸發 sync fetch。'},
   {type:'callout',title:'At-least-once',text:'Delivery retry 可讓同一 message 多次到達；client 必須用 message_id dedup，而不是用 text/time 猜。'}
  ]}],
 quiz:[
  MC('sd12-s08-q1','Chat 為何通常不需要全球 message total order？','sd12-s08-p01','使用者只需要各 conversation 內可理解的順序。','全局順序協調成本高，per-conversation order 已滿足主要需求。',[["因為 message 不需排序","同聊天仍需。"],["因為 UUID 永遠自帶順序","不是所有 UUID。"],["因為 server 只有一台","大型系統不會。"]]),
  MC('sd12-s08-q2','Server Accepted 與 Recipient Read 差在哪？','sd12-s08-p02','前者是平台 durability stage，後者是 client/user action。','Accepted 只代表 server可靠接收；Read 要 recipient client 回報。',[["完全一樣","混淆狀態。"],["Read 一定先於 Accepted","不可能。"],["只有 group 才有 Read","1:1 也可。"]]),
  MC('sd12-s08-q3','msg 102 先於 101 到 device，最成熟處理？','sd12-s08-p03','按 sequence buffer/reorder，gap 長則 sync。','短暫 buffer 102 等 101；超時就 fetch missing gap。',[["直接永久顯示亂序","UX/correctness 差。"],["刪掉 102","可能丟資料。"],["改兩則 message_id","破壞 identity。"]]),
  MC('sd12-s08-q4','相同 message retry delivery 到 client 兩次，如何去重？','sd12-s08-p03','以 canonical message_id。','Client 維護已見 message IDs / sequence。',[["比較文字內容","不同訊息可能同文字。"],["比較接收時間","retry 時間不同。"],["完全不 retry","可靠性下降。"]])
 ]
},
{
 id:'sd12-s09',order:9,title:'Online Presence、Heartbeat 與 Large Group Trade-off',duration:'36–50 分鐘',summary:'Presence 是高頻 ephemeral state；用 heartbeat/lease、debounce 與按需查詢避免 fanout explosion。',
 research:[
  {label:'ByteByteGo — Online Presence',url:'https://bytebytego.com/courses/system-design-interview/design-a-chat-system'},
  {label:'Redis EXPIRE',url:'https://redis.io/docs/latest/commands/expire/'}
 ],
 pages:[
  {id:'sd12-s09-p01',title:'Login/Logout 只是最簡單情況',blocks:[
   {type:'p',text:'Mobile 網路切換、背景、省電模式都可能造成短暫 disconnect。如果每次 TCP 斷就立刻 broadcast offline，朋友列表會一直閃。'},
   {type:'callout',title:'Debounce',text:'短 disconnect 可等數秒 grace period；在 timeout 內 reconnect 則維持 online。'}
  ]},
  {id:'sd12-s09-p02',title:'Heartbeat + TTL/Lease',blocks:[
   {type:'diagram',nodes:[['Client','heartbeat'],['Chat/Presence','refresh lease'],['KV Presence','online + TTL'],['Timeout','expire → offline']],caption:'Heartbeat 不來就讓 lease 自然過期，避免 zombie online。'},
   {type:'p',text:'Presence store 常是 ephemeral KV；TTL 可自動清理 crash 後沒有 logout event 的 stale state。'}
  ]},
  {id:'sd12-s09-p03',title:'100k 人大群組不能把 Presence 全量 Fanout',blocks:[
   {type:'p',text:'小朋友列表可以 presence change push；若群組 100k 人，每一個 online/offline 都 broadcast 給所有人會是 O(N²) event storm。大型 group 可只顯示 aggregate count，或 user 展開成員時按需查。'},
   {type:'callout',title:'ByteByteGo 思路',text:'Group size 小時 fanout status 可行；大群組要改 pull/on-demand。'}
  ]}],
 quiz:[
  MC('sd12-s09-q1','TCP 短斷立刻 broadcast offline 最大 UX 問題？','sd12-s09-p01','Mobile network jitter 會造成 presence flapping。','狀態頻繁 online/offline 閃爍；應 debounce/grace period。',[["會讓 message ID collision","無關。"],["會讓 DB 無法寫","不是。"],["會讓 WebSocket 變 UDP","不會。"]]),
  MC('sd12-s09-q2','Presence TTL/lease 主要解什麼？','sd12-s09-p02','Server/client crash 沒 logout 時 stale state 可自動過期。','避免 zombie online session。',[["保證 message ordering","不同問題。"],["保存永久 history","presence 反而 ephemeral。"],["產生 Snowflake ID","無關。"]]),
  MC('sd12-s09-q3','100k group 每個 presence change broadcast 全員，主要風險？','sd12-s09-p03','Event fanout 近似 O(N²) 量級。','Presence fanout explosion。',[["Message body 太短","無關。"],["History storage 變 0","不是。"],["只有 DNS 壓力","不是主要。"]]),
  MC('sd12-s09-q4','大型群組 presence 更合理策略？','sd12-s09-p03','Aggregate / on-demand。','顯示 online count，查看成員時再按需 fetch status。',[["每毫秒全量 broadcast","更糟。"],["永遠不顯示任何狀態","可以是產品選擇但非唯一。"],["把 presence 寫 Post DB","資料型態不匹配。"]])
 ]
},
{
 id:'sd12-s10',order:10,title:'Production Chat：Backpressure、Reconnect Storm、Multi-region、Push、E2EE 與 Observability',duration:'44–60 分鐘',summary:'把長連線系統補上慢客戶端、draining、region affinity、offline push、媒體與可觀測性。',
 research:[
  {label:'RFC 6455 — WebSocket',url:'https://www.rfc-editor.org/rfc/rfc6455.html'},
  {label:'ByteByteGo — Chat Wrap Up',url:'https://bytebytego.com/courses/system-design-interview/design-a-chat-system'}
 ],
 pages:[
  {id:'sd12-s10-p01',title:'Slow Consumer：不要讓 Send Buffer 無限長',blocks:[
   {type:'p',text:'某 client 網路只剩 10KB/s，Server 卻每秒推 1MB。若每 connection buffer 無上限，單一 slow user 就可吃大量 RAM。'},
   {type:'bullets',items:['Per-connection send buffer limit。','Drop non-critical presence/typing events。','Message history 不 drop，改讓 client reconnect/sync。','超過 threshold 可主動斷線，避免 server OOM。']}
  ]},
  {id:'sd12-s10-p02',title:'Multi-region：Connection 就近，History 要可同步',blocks:[
   {type:'diagram',nodes:[['User TW','Asia Chat'],['User US','US Chat'],['Message Backbone','cross-region'],['History Store','partition/replicate'],['Push','offline fallback']],caption:'Realtime connection 通常 region-affine；跨區對話需 message routing/replication，不能要求兩人都連同一 data center。'},
   {type:'callout',title:'Ordering Scope',text:'跨 region 仍只需 conversation-level stable order；可指定 conversation/home shard/sequence authority，避免兩區同時產生衝突 sequence。'}
  ]},
  {id:'sd12-s10-p03',title:'Deploy Draining + Reconnect Jitter',blocks:[
   {type:'stepper',steps:[['Mark draining','停止接新 WS。'],['Notify/close gradually','讓 client 分批重連。'],['Jitter','隨機延遲 reconnect。'],['Sync cursor','新 server 補 missed history。'],['Terminate','舊 server connection 清空。']]},
   {type:'p',text:'直接 kill 一台承載 100k connections 的 server 會瞬間造成 reconnect storm；部署本身就是 traffic event。'}
  ]},
  {id:'sd12-s10-p04',title:'Media、Push、E2EE 與 Metrics',blocks:[
   {type:'compare',items:[['Media','大檔走 Object Storage + CDN；Chat message 只傳 media ref/metadata。'],['Offline Push','沿用 Chapter 10 Notification Platform 喚回裝置。'],['E2EE','Server 只能路由 ciphertext；搜尋/moderation/server-side preview 受限。'],['Metrics','active WS、handshake error、reconnect rate、message P99、queue age、sync lag、presence TTL expiry。']]},
   {type:'callout',title:'最終 Checklist',text:'能講 connection ownership、durable message、sync cursor、ordering、group fanout、presence、backpressure、reconnect/multi-region，才算完整 Chat System。'}
  ]}],
 quiz:[
  MC('sd12-s10-q1','Slow client 造成 per-connection buffer 無限成長，如何保護 server？','sd12-s10-p01','要有 send-buffer/backpressure policy。','限制每連線 buffer，必要時 drop ephemeral events 或斷線後讓 client sync。',[["把 buffer 設無限","會 OOM。"],["只增加 message size","更糟。"],["關閉 history DB","會丟可靠資料。"]]),
  MC('sd12-s10-q2','跨 region chat 為什麼不要求雙方連同一 chat server？','sd12-s10-p02','Realtime latency 應就近連線，再由 backbone 跨區 routing。','讓每位 user 連鄰近 region，message layer 負責跨區傳輸。',[["WebSocket 只能單 region","不是。"],["History 不需 replicate","仍需跨區可存取。"],["雙方 IP 必須相同","錯。"]]),
  MC('sd12-s10-q3','部署直接 kill 100k connections 最大風險？','sd12-s10-p03','Reconnect storm。','大量 client 同時 discovery/auth/connect，造成尖峰。',[["所有 message_id 會改變","不必然。"],["Only DNS cache miss","不只。"],["History 自動刪除","不應。"]]),
  MC('sd12-s10-q4','E2EE 對 server-side search/moderation 的主要影響？','sd12-s10-p04','Server 看不到 plaintext。','需要 client-side/indexing/metadata 或不同產品 compromise，不能照 plaintext pipeline。',[["E2EE 只影響 UI","不只。"],["E2EE 讓 provider 自動 moderation","不會。"],["E2EE 代表不需 auth","仍需身份驗證。"]])
 ]
}
);
})();