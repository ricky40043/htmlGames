(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_10;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd10-s05',order:5,title:'Idempotency、Dedup 與 Notification State',duration:'36–50 分鐘',summary:'Queue 與 provider retry 會產生重複；用穩定 notificationId/idempotencyKey 保護副作用。',
 research:[{label:'Amazon SQS — Outage recovery and duplicate processing',url:'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/designing-for-outage-recovery-scenarios.html'}],
 pages:[
  {id:'sd10-s05-p01',title:'Notification Request 要有穩定 Identity',blocks:[
   {type:'code',text:'notification_id = "notif_01..."\nidempotency_key = "order-778-shipped-user-42"\nchannel = "push"\nrecipient = "user-42"\ntemplate = "order_shipped_v3"'},
   {type:'p',text:'Business service timeout 後 retry 同一 send request 時，Gateway 應能辨識「這是同一個 logical notification」，而不是再創一筆。'}
  ]},
  {id:'sd10-s05-p02',title:'Exactly-once Delivery 不應當成 Provider Guarantee',blocks:[
   {type:'p',text:'你的 worker 可能在 provider 已接受後、寫 delivery state 前 crash；重試時 provider 可能再次收到。應以 idempotent state machine、dedup key、provider message ID 盡量降低重複。'},
   {type:'callout',title:'重點',text:'「At-least-once processing + idempotent effect」通常比宣稱 end-to-end exactly-once 更務實。'}
  ]},
  {id:'sd10-s05-p03',title:'State Machine：Created → Queued → Sent → ProviderAccepted → Delivered',blocks:[
   {type:'diagram',nodes:[['Created','request durable'],['Queued','channel queue'],['Sent','worker attempted'],['Accepted','provider accepted'],['Delivered','receipt if available'],['Read','app/user event if available']],caption:'不是每個 channel 都能觀察所有 state；狀態欄位要允許 unknown。'},
   {type:'callout',title:'Audit',text:'對重要通知保留 state transition + timestamps，才能查「到底卡在 platform 還是 provider」。'}
  ]}],
 quiz:[
  MC('sd10-s05-q1','Business service timeout 後重送同一 notification request，避免重複最直接？','sd10-s05-p01','穩定 idempotency key 讓 Gateway 返回原結果或不再建立新通知。','使用相同 idempotency key / notification identity。',[["每次產生全新 random key","會失去 dedup。"],["把 timeout 設無限","會拖住資源且不解 crash。"],["關閉 retry","會降低 availability。"]]),
  MC('sd10-s05-q2','Worker 已送 provider 但寫 DB 前 crash，為何可能重複通知？','sd10-s05-p02','重啟後看不到 sent state，可能再次處理同一 queue message。','存在 classic ambiguous outcome，需要 idempotency/dedup。',[["Provider 一定 rollback","通常不會。"],["Queue 一定 exactly-once","不能假設。"],["HTTP 2xx 會自動寫你的 DB","不會。"]]),
  MC('sd10-s05-q3','ProviderAccepted 與 Delivered 為何要分欄位？','sd10-s05-p03','Provider 接受處理不代表裝置或使用者真的收到。','兩者代表不同 delivery stage，診斷與 SLO 意義不同。',[["因為資料庫不能存一個欄位","不是技術限制。"],["ProviderAccepted 一定比 Delivered 晚","通常相反。"],["Delivered 等於 Read","也不等。"]]),
  MC('sd10-s05-q4','哪種語意較務實？','sd10-s05-p02','分散式 queue/provider pipeline 中常用 at-least-once + idempotent processing。','允許重試，但讓重複處理不造成重複副作用。',[["宣稱全鏈路 exactly-once 且不做 dedup","風險很高。"],["完全不 retry","會丟失 transient failure。"],["每次 retry 改 recipient","錯。"]])
 ]
},
{
 id:'sd10-s06',order:6,title:'Retry、Backoff、DLQ 與 Provider Failover',duration:'38–54 分鐘',summary:'區分 transient/permanent failure，設 retry budget、DLQ、fallback provider 與 circuit breaker。',
 research:[
  {label:'Amazon SQS — Dead-letter queues',url:'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html'},
  {label:'Apple — Handling APNs responses',url:'https://developer.apple.com/documentation/usernotifications/setting-up-a-remote-notification-server'}
 ],
 pages:[
  {id:'sd10-s06-p01',title:'先分類 Failure，再決定 Retry',blocks:[
   {type:'compare',items:[['Transient','timeout、429、5xx → backoff/retry。'],['Permanent','invalid token、malformed payload、hard bounce → 不要無限 retry。'],['Policy','user opt-out、expired TTL → skip/drop。']]},
   {type:'callout',title:'Retry Budget',text:'不是所有 5xx 都重試 100 次；要有 max attempts、TTL 與總時間 budget。'}
  ]},
  {id:'sd10-s06-p02',title:'DLQ 是診斷與人工處理區',blocks:[
   {type:'stepper',steps:[['Retry','Transient error + backoff。'],['Max attempts','超過 retry budget。'],['DLQ','保留 message/context/error。'],['Inspect','找 template/provider/data 問題。'],['Redrive','修正後有限速重新送回。']]},
   {type:'p',text:'DLQ retention 通常應比 source queue 長，避免還沒分析 message 就過期。'}
  ]},
  {id:'sd10-s06-p03',title:'Provider Failover 不是「任何錯都換一家」',blocks:[
   {type:'p',text:'Email/SMS 可配置多 provider；failover 應針對 provider-level outage/latency，不應把 invalid recipient 這種 permanent error 送去第二家再浪費成本。'},
   {type:'callout',title:'Circuit Breaker',text:'Provider error rate/latency 達 threshold 時暫時 stop sending，讓 traffic 切到 secondary，並持續 health probe。'}
  ]}],
 quiz:[
  MC('sd10-s06-q1','APNs 回 invalid device token，最佳處理？','sd10-s06-p01','這是 permanent token issue，不應無限 retry。','停用 token，更新 registry，不再對該 token 重試。',[["每秒 retry","只會持續失敗。"],["換 Email provider 重送同 token","token 只對 push provider 有意義。"],["把 TTL 設更長","不解 invalid。"]]),
  MC('sd10-s06-q2','DLQ 的主要價值？','sd10-s06-p02','隔離長期處理失敗 message，便於診斷與安全 redrive。','避免 poison message 無限重試，同時保留失敗上下文。',[["自動保證 message 成功","不能。"],["取代 primary queue","不是。"],["讓 provider 無限容量","不是。"]]),
  MC('sd10-s06-q3','SMS provider 5xx 大增，何時 failover 最合理？','sd10-s06-p03','Provider-level transient outage 可能切 secondary。','當 provider health/circuit breaker 判定 outage，切到備援 provider。',[["任何 invalid phone 都切 provider","recipient 問題換 provider也無效。"],["只有 CPU 高才切","不是唯一訊號。"],["永遠不切","會拉長 outage。"]]),
  MC('sd10-s06-q4','Retry 沒有 max attempts 最大風險？','sd10-s06-p01','Permanent error/poison message 可無限消耗 queue與provider資源。','形成無限重試與成本/壅塞放大。',[["會自動變 exactly-once","不會。"],["會讓 token refresh","不是。"],["會讓 template 更安全","無關。"]])
 ]
},
{
 id:'sd10-s07',order:7,title:'Scheduling、TTL、Batch、Rate Limit 與 Cost Control',duration:'34–48 分鐘',summary:'不同通知有不同 deadline；讓 scheduler、priority、frequency cap 與 provider quota 一起工作。',
 research:[{label:'Firebase — FCM architecture / server environment',url:'https://firebase.google.com/docs/cloud-messaging/server-environment'}],
 pages:[
  {id:'sd10-s07-p01',title:'Scheduled Notification 需要 Durable Scheduler',blocks:[
   {type:'p',text:'「明天 09:00 發」不能靠單一 process setTimeout。要保存 scheduled_at、timezone、status，再由 time bucket/delay queue/scheduler 可靠觸發。'},
   {type:'callout',title:'Timezone',text:'Marketing 的「早上 9 點」通常是 user local time，不是 UTC 09:00。'}
  ]},
  {id:'sd10-s07-p02',title:'TTL：晚到就失去價值',blocks:[
   {type:'compare',items:[['OTP','TTL 例如數分鐘；過期直接 drop。'],['Price Alert','可能數十分鐘仍有價值。'],['Receipt','可延遲但要最終可追蹤。'],['Marketing','可 batch，但 schedule window 仍重要。']]},
   {type:'p',text:'Worker dequeue 時要先檢查 expiry；不要把已過期 OTP 繼續 retry 送達。'}
  ]},
  {id:'sd10-s07-p03',title:'Provider Quota 與 Product Frequency Cap',blocks:[
   {type:'bullets',items:['Provider rate limit：保護第三方 quota/connection。','Per-user frequency cap：避免一天收到 100 封 social push。','Per-tenant budget：多租戶公平。','Batch API：provider 支援時降低 request overhead。']},
   {type:'callout',title:'兩種 Rate Limit',text:'Provider quota 保護系統；Frequency cap 保護使用者體驗。兩者不是同一條規則。'}
  ]}],
 quiz:[
  MC('sd10-s07-q1','排程明天 09:00 發通知，為什麼不能只用 process timer？','sd10-s07-p01','Process crash/redeploy 會丟 timer，且無法跨多節點可靠協調。','需 durable scheduled state + scheduler/queue。',[["Timer 永遠比 DB 慢","不是核心。"],["JavaScript 沒有 timer","有。"],["因為 Push 不能排程","平台可以自己排。"]]),
  MC('sd10-s07-q2','OTP 已超過 TTL，worker 還應 retry 嗎？','sd10-s07-p02','過期 OTP 到達只會造成混亂與風險。','不應；標記 expired/drop，停止送出。',[["應無限 retry 直到成功","晚到已無價值。"],["改成 marketing","語意錯誤。"],["只要換 provider 就有效","內容已過期。"]]),
  MC('sd10-s07-q3','Per-user 20 notifications/day 主要保護什麼？','sd10-s07-p03','Frequency cap 是 product UX/abuse policy。','避免通知疲勞與 spam，保護使用者體驗。',[["Provider TLS","無關。"],["Token uniqueness","無關。"],["Database transaction isolation","不是。"]]),
  MC('sd10-s07-q4','Provider rate limit 與 per-user frequency cap 差異？','sd10-s07-p03','前者是 provider/system capacity，後者是 product/user policy。','兩者限制的 resource/目的不同，應各自建模。',[["完全相同","會混淆 capacity 與 UX。"],["只需一個 global counter","無法表達 user-level policy。"],["只有 SMS 需要","所有 channel 都可能需要。"]])
 ]
},
{
 id:'sd10-s08',order:8,title:'Preference、Unsubscribe、Quiet Hours 與 Compliance',duration:'34–48 分鐘',summary:'使用者是否願意收到、何時可收到，和「系統能不能送」同樣重要。',
 research:[
  {label:'Apple User Notifications',url:'https://developer.apple.com/documentation/usernotifications'},
  {label:'Firebase Cloud Messaging',url:'https://firebase.google.com/docs/cloud-messaging'}
 ],
 pages:[
  {id:'sd10-s08-p01',title:'Preference Model 要分 Topic × Channel',blocks:[
   {type:'code',text:'user=42\nsecurity.push = ON\norder.push = ON\norder.email = ON\nmarketing.push = OFF\nmarketing.email = OFF\nquiet_hours = 22:00-08:00'},
   {type:'p',text:'只有一個 notification_enabled boolean 太粗；實務需要 topic/category、channel、priority 與 legal mandatory/optional。'}
  ]},
  {id:'sd10-s08-p02',title:'Quiet Hours 要考慮 User Timezone',blocks:[
   {type:'p',text:'若使用者在台北 23:30，Marketing 應延後，但 security alert 可能 bypass quiet hours。Scheduler 應保存 local-time policy 並轉換到 UTC execution。'},
   {type:'callout',title:'DST/Timezone Change',text:'不要把「每天 9:00 local」在建立 schedule 時一次換成固定 UTC 永久使用；時區/DST 改變會錯。'}
  ]},
  {id:'sd10-s08-p03',title:'Unsubscribe 與 Audit 不能靠 Cache 最終決定',blocks:[
   {type:'p',text:'Preference cache 可以加速，但 source of truth 要 durable。使用者剛 unsubscribe 後，stale cache 仍送 marketing 是 correctness/compliance 問題。'},
   {type:'callout',title:'Event-driven Invalidation',text:'Preference change 可發 event invalidation；對高風險 channel 可讀 strong source 或用短 TTL。'}
  ]}],
 quiz:[
  MC('sd10-s08-q1','只有 notification_enabled=true/false 最大不足？','sd10-s08-p01','無法表達不同 topic/channel 與 critical exception。','需要至少 category/topic × channel 的偏好模型。',[["Boolean 不能存在 DB","可以。"],["所有通知語意相同","不是。"],["會讓 queue 失效","不是直接問題。"]]),
  MC('sd10-s08-q2','Quiet hours 為什麼要保存 timezone-aware 規則？','sd10-s08-p02','使用者 local time 會因時區/DST 改變。','確保「晚上 10 點到早上 8 點」以使用者當地時間正確執行。',[["UTC 永遠和 local 一樣","錯。"],["Push provider 自動知道產品 quiet hours","通常不知道。"],["只要 template 有日期就好","不同 concern。"]]),
  MC('sd10-s08-q3','User 剛 unsubscribe，cache 還是 ON，風險？','sd10-s08-p03','Stale preference 會造成不該送的 marketing。','需要快速 invalidation/short TTL/強一致 source 以控制 stale policy。',[["重複 token 而已","不只。"],["只會影響 analytics","實際 delivery 也會錯。"],["Provider 會自動判斷 unsubscribe","Provider 不一定知道你的 topic preference。"]]),
  MC('sd10-s08-q4','Security alert 是否一定受 marketing quiet hours 限制？','sd10-s08-p02','要依 policy；critical/security 常有不同 bypass 規則。','不一定，應由 notification category/priority policy 決定。',[["一定全部靜音","可能犧牲安全需求。"],["一定全部 bypass","也可能違反產品規則。"],["只看 provider 種類","不是。"]])
 ]
},
{
 id:'sd10-s09',order:9,title:'Delivery Tracking、Analytics 與 Feedback Loop',duration:'34–48 分鐘',summary:'建立可觀測的 notification lifecycle，量 provider latency、bounce、open/click，而不是只看 enqueue 成功。',
 research:[
  {label:'ByteByteGo — Notification tracking and analytics',url:'https://bytebytego.com/guides/how-does-a-typical-push-notification-system-work/'},
  {label:'Apple — APNs Metrics',url:'https://developer.apple.com/documentation/usernotifications/setting-up-a-remote-notification-server'}
 ],
 pages:[
  {id:'sd10-s09-p01',title:'Delivery Event Stream',blocks:[
   {type:'diagram',nodes:[['Gateway','accepted'],['Queue','queued'],['Worker','attempted'],['Provider','accepted/rejected'],['Device/App','delivered/opened if known'],['Analytics','events + metrics']],caption:'每個 stage 產生 event，才能算 end-to-end latency 與 drop funnel。'},
   {type:'p',text:'Tracking event 要有 notification_id、channel、provider、attempt、timestamp、status/error_code，避免只有 free-text log。'}
  ]},
  {id:'sd10-s09-p02',title:'重要 Metrics',blocks:[
   {type:'bullets',items:['API accepted QPS / errors。','Queue depth / oldest age。','Worker throughput / retry / DLQ。','Provider acceptance rate / latency / 429/5xx。','Invalid token / bounce / complaint。','Delivered/open/click（可觀察才算）。','Per-channel cost / tenant budget。']},
   {type:'callout',title:'Funnel',text:'Accepted 99.99% 但 provider accepted 80%，不能說 notification platform 99.99% delivery。要分 stage 報表。'}
  ]},
  {id:'sd10-s09-p03',title:'Analytics 不能阻塞 Delivery Hot Path',blocks:[
   {type:'p',text:'Delivery worker 把 tracking event append 到 event stream，再由 analytics consumers 聚合；不要每送一封通知同步更新 12 張報表表格。'},
   {type:'callout',title:'Eventual Analytics',text:'報表延遲幾秒通常可接受；Critical delivery state 則可能要同步 durable write，兩者一致性需求不同。'}
  ]}],
 quiz:[
  MC('sd10-s09-q1','只監控 Notification API 2xx，為何不足？','sd10-s09-p02','2xx 只代表入口 accepted，後面 queue/provider/device 都可能失敗。','需要 stage-by-stage delivery metrics。',[["API 2xx 就等於 read","錯。"],["Provider 永遠成功","不成立。"],["Queue 沒有 latency","有。"]]),
  MC('sd10-s09-q2','Tracking event 最重要的 correlation key？','sd10-s09-p01','notification_id 可把各 stage attempt 串起來。','穩定 notification_id / attempt identity。',[["Worker IP only","worker 會變且無法代表 notification。"],["Template 顏色","無關。"],["Queue depth only","不能追單筆。"]]),
  MC('sd10-s09-q3','為什麼 analytics aggregation 適合 async consumer？','sd10-s09-p03','不應讓報表寫入阻塞 critical delivery。','把高成本聚合移出 delivery hot path，允許 eventual reporting。',[["因為 analytics 不需要資料","仍需 events。"],["因為 async 保證零延遲","不是。"],["因為 provider 不會回 status","會回部分 status。"]]),
  MC('sd10-s09-q4','Provider acceptance 70%、Gateway 99.99% accepted，能說 delivery 99.99% 嗎？','sd10-s09-p02','不能混淆 stage。','不能；需分別報 Gateway、Provider、Device/User-visible 指標。',[["可以，取最高數字","錯。"],["可以，只要 queue 很短","不相關。"],["只有 SMS 要分 stage","所有 channel 都應。"]])
 ]
},
{
 id:'sd10-s10',order:10,title:'Multi-region、Security 與完整 Notification Platform',duration:'42–58 分鐘',summary:'把前九節組成可 multi-region、可 failover、可 audit 的完整平台。',
 research:[
  {label:'Firebase — FCM Architecture',url:'https://firebase.google.com/docs/cloud-messaging/fcm-architecture'},
  {label:'Apple — APNs Provider Server',url:'https://developer.apple.com/documentation/usernotifications/setting-up-a-remote-notification-server'}
 ],
 pages:[
  {id:'sd10-s10-p01',title:'完整 Flow',blocks:[
   {type:'stepper',steps:[['Business Event','產生 notification intent + idempotency key。'],['Gateway','auth/validate/durable create。'],['Policy/Distribution','template、preference、schedule、TTL。'],['Router/Queues','依 channel/priority/tenant 分流。'],['Workers','dedup/retry/provider adapter。'],['Provider','APNs/FCM/ESP/SMS。'],['Tracking Stream','status events → analytics/alert。']]}
  ]},
  {id:'sd10-s10-p02',title:'Multi-region：不要重複送兩次',blocks:[
   {type:'p',text:'Active-active regions 若同一 business event 同時被兩地 consume，必須有 globally stable notification identity/idempotency strategy；否則 failover/duplicate event 可能造成雙重通知。'},
   {type:'callout',title:'Ownership',text:'可以按 user/tenant hash regional ownership，或使用 global dedup store/event identity；重點是明確誰有權產生 delivery attempt。'}
  ]},
  {id:'sd10-s10-p03',title:'Security / Privacy / Secrets',blocks:[
   {type:'bullets',items:['Provider credentials 放 secret manager，定期 rotate。','Template/context 避免把敏感資料直接放 lock-screen push。','Token registry 加密、access control、audit。','防 notification abuse：auth、rate limit、tenant quota。','Webhook/receipt 驗證來源，避免偽造 delivery events。']},
   {type:'callout',title:'最終 Checklist',text:'Channel isolation、idempotency、retry/DLQ、preference、TTL、tracking、provider failure、multi-region dedup 都能講清楚，才算完整通知平台。'}
  ]}],
 quiz:[
  MC('sd10-s10-q1','Active-active 兩區同時處理同一 order_shipped event，最大風險？','sd10-s10-p02','若沒有 global identity/dedup，同一 user 可能收到兩次。','Duplicate delivery；需要 stable event/notification ID 與 ownership/dedup。',[["APNs 會自動知道是同一業務事件","不能依賴。"],["只要 template 相同就不會重複","不會。"],["Queue 會自動全局去重","視產品而定，不能假設。"]]),
  MC('sd10-s10-q2','Push payload 為什麼不宜放完整敏感醫療資訊？','sd10-s10-p03','通知可能顯示在 lock screen，涉及 privacy exposure。','應最小化敏感內容，必要時只提示「有新訊息」並進 App 驗證後查看。',[["因為 Push 不能傳文字","可以。"],["因為 JSON 不支援 UTF-8","支援。"],["因為敏感資料只影響 Email","不是。"]]),
  MC('sd10-s10-q3','Provider credential 應放哪？','sd10-s10-p03','應集中安全管理、最小權限與 rotation。','Secret manager / secure credential store。',[["前端 JavaScript","會暴露。"],["Git repo 明文","高風險。"],["Push payload","完全錯。"]]),
  MC('sd10-s10-q4','完整 notification design 的核心不是？','sd10-s10-p01','不是「呼叫 APNs API」而已，而是可靠 orchestration + policy + tracking。','把 business intent 經可靠 pipeline、policy、provider adapter 送出並可追蹤失敗。',[["只寫一個 HTTP POST provider","太薄。"],["只做一張 template table","缺可靠性。"],["只看 open rate","缺 delivery path。"]])
 ]
}
);
})();