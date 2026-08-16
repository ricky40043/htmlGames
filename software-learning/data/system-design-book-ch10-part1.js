(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_10={
 id:'sd-book-10',order:10,title:'設計通知系統',
 subtitle:'從一個 send API 推導出多 Channel、Queue、Provider、Preference、Retry、Dedup 與 Delivery Tracking 的可靠通知平台。',
 objective:'完成後，你能設計支援 Push、Email、SMS、In-App 的通知平台，並清楚區分 accepted、sent、delivered、read 等不同狀態。',
 sections:[],finalExam:[]
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd10-s01',order:1,title:'需求與 Delivery Semantics：先定義「送到了」',duration:'30–42 分鐘',summary:'通知系統最容易把 provider acceptance、device delivery、user read 混成一件事；先拆 Channel、Priority 與 Delivery State。',
 research:[
  {label:'ByteByteGo — Typical Push Notification System',url:'https://bytebytego.com/guides/how-does-a-typical-push-notification-system-work/'},
  {label:'Apple — Setting up a remote notification server',url:'https://developer.apple.com/documentation/usernotifications/setting-up-a-remote-notification-server'}
 ],
 pages:[
  {id:'sd10-s01-p01',title:'先問：通知是 Push、Email、SMS 還是 In-App？',blocks:[
   {type:'compare',items:[['Push','依賴 APNs/FCM/device token；低成本、可即時，但使用者可能關閉 permission。'],['Email','依賴 SMTP/ESP；內容長、可搜尋，但 spam/reputation/退信是核心問題。'],['SMS','覆蓋廣但昂貴，provider rate/country compliance 重要。'],['In-App','平台自己控制，可持久化 inbox，但使用者沒開 App 就看不到。']]},
   {type:'callout',title:'設計 scope',text:'不同 channel 的 queue、provider、retry、tracking、成本與 compliance 不一樣；不要用一個 worker if/else 全包。'}
  ]},
  {id:'sd10-s01-p02',title:'「成功」至少有四層',blocks:[
   {type:'stepper',steps:[['Accepted','Notification API 已接受並持久化 request。'],['Dispatched/Sent','平台 worker 已送給第三方 provider。'],['Provider Accepted','APNs/FCM/ESP 回覆接受；不等於 user 已看到。'],['Delivered/Read','若 provider/OS/app 有 receipt 或 app 回報，才能進一步推估。']]},
   {type:'p',text:'很多 provider 是 best-effort；Push 在 device offline、power policy、user setting 下可能延後、coalesce 或不顯示。產品 SLO 必須定義在哪一層。'}
  ]},
  {id:'sd10-s01-p03',title:'Transactional、OTP、Marketing 的 Reliability 不同',blocks:[
   {type:'compare',items:[['OTP/Security','高 priority、短 TTL、強 rate limit、不能晚到 20 分鐘。'],['Transaction Receipt','可 retry、重複需 dedup、delivery audit 重要。'],['Marketing','可 batch/schedule、需 unsubscribe/quiet hours、成本與頻率控制重要。']]},
   {type:'callout',title:'一個 Queue 不夠',text:'Critical OTP 不應排在百萬封 marketing email 後面；priority 與 workload isolation 是 architecture requirement。'}
  ]}],
 quiz:[
  MC('sd10-s01-q1','APNs 回 2xx/接受 request，是否等於使用者一定已看到通知？','sd10-s01-p02','Provider acceptance 與 device/user-visible delivery 是不同狀態。','不等於；只代表 provider 接受處理，後續 delivery 仍受裝置與系統狀態影響。',[["等於，provider acceptance 就是 read receipt","把多層 delivery state 混在一起。"],["只有 Email 才有 delivery state","所有 channel 都有不同層次。"],["只要 App 安裝就一定顯示","permission/OS policy 仍會影響。"]]),
  MC('sd10-s01-q2','OTP 與 Marketing 為何最好不要共用同一優先序 queue？','sd10-s01-p03','兩者 latency/TTL/priority 完全不同，marketing burst 會阻塞 OTP。','避免低優先大量工作造成 critical notification head-of-line blocking。',[["因為 OTP 不能使用 queue","可以使用可靠 queue。"],["因為 marketing 不需 provider","仍需要 channel provider。"],["因為兩者 payload 格式不能是 JSON","格式不是核心。"]]),
  MC('sd10-s01-q3','In-App notification 最大特性？','sd10-s01-p01','平台可自己持久化與呈現，但使用者需進入 App 才能看到。','可由自己的 Inbox/DB 控制，不依賴 OS push 顯示。',[["一定比 Push 更即時","使用者不開 App 就看不到。"],["不需任何 storage","常需要持久化 inbox。"],["只能發 OTP","不是。"]]),
  MC('sd10-s01-q4','定義 Notification SLO 前最重要的事情？','sd10-s01-p02','要明確說是 API accepted、provider accepted、device delivered 或 user read。','先定義「成功」與 latency 測量終點是哪個 delivery stage。',[["先選 Kafka 品牌","工具不能代替語意。"],["只看 CPU","不是 user-facing SLO。"],["把所有通知都定 100% read","無法控制使用者是否閱讀。"]])
 ]
},
{
 id:'sd10-s02',order:2,title:'Device Token 與 Provider Integration：APNs / FCM 不是你的 DB',duration:'34–48 分鐘',summary:'學會 token lifecycle、provider request、無效 token 清理與多平台 routing。',
 research:[
  {label:'Apple — Registering your app with APNs',url:'https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns'},
  {label:'Firebase — FCM Architectural Overview',url:'https://firebase.google.com/docs/cloud-messaging/fcm-architecture'}
 ],
 pages:[
  {id:'sd10-s02-p01',title:'Device Token 是 App Instance Address，不是 User ID',blocks:[
   {type:'diagram',nodes:[['User','可能多台裝置'],['Device/App Instance','每 app instance token'],['Token Registry','user ↔ tokens'],['APNs/FCM','platform transport']],caption:'同一 user 可以有多個 tokens；token 也可能 refresh/失效。'},
   {type:'callout',title:'Apple 官方語意',text:'APNs device token 對 device + app 唯一；App 取得後要回傳 provider server。不要把 token 當永久不變 primary user identity。'}
  ]},
  {id:'sd10-s02-p02',title:'Token Registry 需要 Lifecycle',blocks:[
   {type:'bullets',items:['Register/update：App 啟動或 token refresh 時上報。','Associate：綁 user、device、platform、app version、locale。','Invalidate：provider 回無效 token 時停用。','Logout/privacy：依產品規則解除 user 綁定。','Last seen：長期無效/未使用 token 可清理。']},
   {type:'p',text:'不清理 dead tokens 會浪費 provider quota、queue capacity、成本與 metrics，還會讓 delivery rate 看起來很差。'}
  ]},
  {id:'sd10-s02-p03',title:'Provider Adapter：隔離 APNs / FCM / Email / SMS 差異',blocks:[
   {type:'compare',items:[['APNs Adapter','HTTP/2 + TLS、device token、APNs headers/payload。'],['FCM Adapter','trusted server → FCM backend → platform transport。'],['Email Adapter','ESP API、bounce/complaint/webhook。'],['SMS Adapter','phone normalization、country/provider、cost/rate。']]},
   {type:'callout',title:'Adapter Boundary',text:'Core notification service 應使用內部標準 message model；provider-specific payload/response 在 adapter 層轉換。'}
  ]}],
 quiz:[
  MC('sd10-s02-q1','同一使用者登入手機與平板，Push token 應怎麼建模？','sd10-s02-p01','Token 是 app instance/device address；一個 user 可對多 tokens。','User 1:N Device Tokens，發送時依 preference/active devices 選擇。',[["User 永遠只有一個 token","會漏掉多裝置。"],["Token 就是 user password","安全語意錯誤。"],["所有使用者共用 token","完全錯。"]]),
  MC('sd10-s02-q2','Provider 回 token invalid，最合理行為？','sd10-s02-p02','停用/移除 token，避免持續重試。','更新 Token Registry，標記 invalid 並停止對它發送。',[["永遠 retry","只會浪費 quota。"],["刪除 user account","過度。"],["把 token 改成 random string","無法讓 provider 認得。"]]),
  MC('sd10-s02-q3','Provider Adapter 的主要價值？','sd10-s02-p03','把 channel/provider-specific protocol 與 core orchestration 隔離。','Core service 不需知道 APNs/FCM/ESP 每個細節，可替換/新增 provider。',[["讓所有 provider 變 exactly-once","做不到。"],["取代 queue","不是。"],["把 device token 變成 user ID","不是。"]]),
  MC('sd10-s02-q4','FCM 架構中你的 App Server 主要做什麼？','sd10-s02-p03','Trusted environment 建立/target message request，交給 FCM backend。','建立、驗證、target 通知並呼叫 FCM；FCM 再負責 platform transport。',[["直接控制 Android radio hardware","不是。"],["取代 APNs 在 iOS 的 transport","FCM on Apple 仍會經 APNs。"],["只負責 UI animation","不是。"]])
 ]
},
{
 id:'sd10-s03',order:3,title:'High-Level Design：Gateway → Distribution → Router → Channel Worker',duration:'38–54 分鐘',summary:'建立可批次、可排程、可套 Template/Preference 的通知 pipeline。',
 research:[{label:'ByteByteGo — Typical Push Notification System',url:'https://bytebytego.com/guides/how-does-a-typical-push-notification-system-work/'}],
 pages:[
  {id:'sd10-s03-p01',title:'Notification Gateway 是入口，不應直接打 APNs',blocks:[
   {type:'diagram',nodes:[['Business Service','Order/Auth/Social'],['Notification Gateway','validate/idempotency'],['Distribution','template/preference/schedule'],['Channel Router','Push/Email/SMS/In-App'],['Queues','buffer/isolation'],['Workers','provider adapters']],caption:'入口快速接受 request；真正 delivery 走 async pipeline。'},
   {type:'p',text:'Business service 不應綁定 provider SDK。它只描述「誰、什麼事件、哪個 template/context、priority/idempotency key」。'}
  ]},
  {id:'sd10-s03-p02',title:'Template Repository：內容與程式碼分離',blocks:[
   {type:'stepper',steps:[['Template ID','order_shipped_v3'],['Locale','zh-TW / en-US'],['Variables','order_no, eta'],['Render','產生 channel-specific subject/body/payload'],['Version','舊事件重放時可追蹤使用哪版模板。']]},
   {type:'callout',title:'安全',text:'Template variable 要 escape/validate，避免 HTML injection、惡意 URL 或未授權敏感資訊被塞進通知。'}
  ]},
  {id:'sd10-s03-p03',title:'Preference Repository 是 Policy Engine 的輸入',blocks:[
   {type:'bullets',items:['User 是否允許該 channel/topic。','Quiet hours / timezone。','Marketing unsubscribe。','Transactional 是否不可關閉或改走其他 channel。','Frequency cap / digest preference。']},
   {type:'p',text:'Preference 應在 enqueue 前或 distribution stage 判斷，避免已知不該送的通知白白佔 worker/provider capacity。'}
  ]}],
 quiz:[
  MC('sd10-s03-q1','Business Service 直接整合 APNs SDK 的主要缺點？','sd10-s03-p01','造成 domain service 與 provider/channel 強耦合，難以統一 retry/preference/tracking。','Provider 細節散落各服務，難以治理與替換。',[["APNs 完全不能被 server 呼叫","可以。"],["Business Service 不能發事件","可以。"],["Queue 一定變慢到不可用","不是。"]]),
  MC('sd10-s03-q2','Template 為什麼需要 version？','sd10-s03-p02','排程/重放/稽核時要知道事件使用哪個內容版本。','支援可追蹤的內容變更與重放，避免舊事件被新模板意外改義。',[["因為模板每秒一定要改","不是。"],["為了增加 payload 大小","不是目的。"],["Version 會保證 provider delivery","不會。"]]),
  MC('sd10-s03-q3','已知 user 關閉 marketing push，最好在哪裡過濾？','sd10-s03-p03','越早在 distribution/policy stage 過濾越能省 queue/provider 資源。','在 routing/enqueue 前依 preference policy skip。',[["等 provider 拒絕再說","Provider 不一定知道你的 product preference。"],["發到 device 再由 user 忽略","浪費資源且違反 preference。"],["只在 analytics 階段標記","太晚。"]]),
  MC('sd10-s03-q4','Notification Gateway 成功接受 request 後，為什麼常採 async？','sd10-s03-p01','第三方 provider latency/failure 不應阻塞 business transaction path。','先 durable enqueue，再由 worker delivery，可吸收尖峰與隔離 provider 故障。',[["因為同步 HTTP 永遠不能用","不是絕對。"],["因為 async 保證 exactly-once","不保證。"],["因為 queue 不會故障","仍要處理故障。"]])
 ]
},
{
 id:'sd10-s04',order:4,title:'Channel Queue 與 Workload Isolation',duration:'32–46 分鐘',summary:'分 Channel、Priority、Tenant 的 queue，避免單一 provider outage 把所有通知拖死。',
 research:[
  {label:'ByteByteGo — Notification Architecture',url:'https://bytebytego.com/guides/how-does-a-typical-push-notification-system-work/'},
  {label:'Amazon SQS — Dead-letter queues',url:'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html'}
 ],
 pages:[
  {id:'sd10-s04-p01',title:'為什麼 Push / Email / SMS 要分 Queue？',blocks:[
   {type:'compare',items:[['Push Queue','APNs/FCM rate/latency/failure。'],['Email Queue','ESP reputation、bounce、bulk throughput。'],['SMS Queue','昂貴、provider/country rate。']]},
   {type:'callout',title:'Bulkhead',text:'SMS provider outage 時，SMS backlog 不應讓 OTP Push 或 Email receipt 卡在同一 queue 前面。'}
  ]},
  {id:'sd10-s04-p02',title:'Priority Queue：Critical 與 Bulk 分開',blocks:[
   {type:'stepper',steps:[['P0','OTP / security / critical ops：短 TTL。'],['P1','Transactional：訂單/付款/出貨。'],['P2','Social：like/comment。'],['P3','Marketing/bulk：可延後與 batch。']]},
   {type:'p',text:'Priority 不只影響 queue 順序，也應影響 retry budget、TTL、rate limit 與 provider fallback。'}
  ]},
  {id:'sd10-s04-p03',title:'Queue 要看 Age，不只看 Length',blocks:[
   {type:'bullets',items:['Queue depth：有多少待處理。','Oldest message age：使用者等多久。','Enqueue rate vs consume rate。','Retry/DLQ rate。','Per-priority backlog。']},
   {type:'callout',title:'Head-of-line',text:'10 萬封 24 小時內送完的 marketing backlog 與 100 個已等 30 秒的 OTP，對 SLO 的意義完全不同。'}
  ]}],
 quiz:[
  MC('sd10-s04-q1','SMS provider outage 時所有通知共用單一 FIFO，最大風險？','sd10-s04-p01','SMS 失敗/慢工作會造成其他 channel head-of-line blocking。','一個 channel 故障污染其他 channel latency，缺乏 bulkhead isolation。',[["Email 一定自動改 SMS","不一定。"],["Queue 會自動跳過失敗 provider","要看 worker design。"],["只要加 RAM 就完全解","不解耦 failure domain。"]]),
  MC('sd10-s04-q2','OTP queue 最值得監控哪個指標之一？','sd10-s04-p03','OTP 有短 latency SLO，oldest age 比單看 depth 更有意義。','Oldest message age / P95 delivery latency。',[["Template 字數平均","不是主要 SLO。"],["Worker hostname 長度","無關。"],["Marketing open rate only","不同 workload。"]]),
  MC('sd10-s04-q3','Priority 只改 dequeue 順序但所有 retry 都無限，問題？','sd10-s04-p02','Poison/失敗 critical message 仍可反覆佔資源，需要 retry budget/DLQ。','仍需 TTL、retry limit、backoff 與 DLQ，priority 不是可靠性機制。',[["Priority 自帶 exactly-once","沒有。"],["Critical 不會失敗","會。"],["只要 queue 是 FIFO 就好","不夠。"]]),
  MC('sd10-s04-q4','Queue depth 100 很低，但 oldest age 20 分鐘，能說健康嗎？','sd10-s04-p03','不能；少量訊息也可能因 stuck worker/provider 長期等待。','不能，age 顯示 latency/SLO 已出問題。',[["可以，depth 小一定健康","忽略等待時間。"],["只要 CPU 低就健康","不代表 delivery 正常。"],["刪掉 oldest metric","會失去訊號。"]])
 ]
}
);
})();