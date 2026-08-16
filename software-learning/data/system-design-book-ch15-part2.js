(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_15;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd15-s07',order:7,title:'Change Log 與 Incremental Sync：Page Token 是 Client Cursor',duration:'42–60 分鐘',summary:'用 per-user/per-drive ordered change feed 讓裝置只抓「上次之後」的 metadata changes；token/cursor 是恢復同步的關鍵。',
 research:[{label:'Google Drive API — changes.getStartPageToken',url:'https://developers.google.com/workspace/drive/api/reference/rest/v3/changes/getStartPageToken'},{label:'Google Drive API — changes.list',url:'https://developers.google.com/workspace/drive/api/reference/rest/v3/changes/list'}],
 pages:[
  {id:'sd15-s07-p01',title:'Full Scan 不可擴展',blocks:[
   {type:'p',text:'每次 App 開啟都 list 使用者全部 1M files 再比 modified_time 會浪費 DB/network。更好的方式是 durable ordered change log + cursor/page token。'}
  ]},
  {id:'sd15-s07-p02',title:'Cursor Flow',blocks:[
   {type:'stepper',steps:[['Bootstrap','拿 startPageToken / full snapshot。'],['Listen','收到 push 或定期 wake。'],['List changes','pageToken=T123。'],['Apply','依 revision 更新 local DB。'],['Advance','成功套用後存 newStartPageToken。']]}
  ]},
  {id:'sd15-s07-p03',title:'Cursor 只能在 Apply 成功後前進',blocks:[
   {type:'callout',title:'Exactly-once-like Client Apply',text:'如果先存新 token 再 crash，會永久跳過尚未套用 changes；應先 idempotent apply，再 durable advance cursor。'},
   {type:'p',text:'Change event 可重送，因此 local apply 需用 file_id + revision/version 判斷重複/舊事件。'}
  ]}],
 quiz:[
  MC('sd15-s07-q1','Change token 最大價值？','sd15-s07-p01','避免每次全量掃描所有 files。','增量抓上次 cursor 之後的 changes。',[["取代 object storage","不是。"],["取代 ACL","不是。"],["讓 conflict 不存在","仍可能。"]]),
  MC('sd15-s07-q2','Client 何時 durable 保存新 token？','sd15-s07-p03','成功 apply 對應 changes 後。','Apply first, then advance cursor。',[["收到 response header 前","可能跳資料。"],["永遠不存","每次重播。"],["只在 logout","太慢。"]]),
  MC('sd15-s07-q3','Change event 重送怎麼辦？','sd15-s07-p03','依 revision/version idempotent apply。','重複 change 不應重複副作用。',[["每次建立新 file_id","會錯。"],["直接丟棄所有事件","會漏。"],["相信 webhook exactly once","不能。"]]),
  MC('sd15-s07-q4','Bootstrap new device 只拿未來 start token 夠嗎？','sd15-s07-p02','不夠，還需要 current snapshot/metadata，token 只追之後 changes。','先建立 base state，再追增量。',[["夠，token 包含全部 bytes","不是。"],["只需 push notification","沒有目前狀態。"],["只需 object list","還缺 metadata/ACL。"]])
 ]
},
{
 id:'sd15-s08',order:8,title:'Push Notification：Wake-up Signal，不是 Change Payload Source',duration:'34–50 分鐘',summary:'用 watch/webhook 降低 polling；通知可能重複/延遲，因此真正 correctness 仍由 durable change list/cursor 保證。',
 research:[{label:'Google Drive API — Notifications for resource changes',url:'https://developers.google.com/workspace/drive/api/guides/push'},{label:'Google Drive API — changes.watch',url:'https://developers.google.com/workspace/drive/api/reference/rest/v3/changes/watch'}],
 pages:[
  {id:'sd15-s08-p01',title:'Notification 只告訴你「有事發生」',blocks:[
   {type:'diagram',nodes:[['Server change','revision 208'],['Webhook/Push','wake device/backend'],['Client','changes.list cursor=201'],['Apply','202..208'],['Cursor','save 208']],caption:'Push 不需要承載所有 change details。'}
  ]},
  {id:'sd15-s08-p02',title:'Push Channel 有 Lifecycle',blocks:[
   {type:'bullets',items:['channel expiration / renew','auth/verification token','duplicate/out-of-order notification tolerance','webhook retries','fallback periodic poll/catch-up']}
  ]},
  {id:'sd15-s08-p03',title:'Lost Push 不應造成 Lost Data',blocks:[
   {type:'p',text:'裝置若錯過 push，下一次啟動/heartbeat/periodic sync 仍從 cursor 拉 change log。Notification 提升 freshness，不承擔 durability。'}
  ]}],
 quiz:[
  MC('sd15-s08-q1','Push notification 最安全定位？','sd15-s08-p01','喚醒 client 去拉 durable changes。','Signal，不是唯一 change data。',[["唯一 source of truth","容易因漏通知丟狀態。"],["取代 cursor","不應。"],["直接放 file bytes","不適合。"]]),
  MC('sd15-s08-q2','Webhook 漏一則通知是否應永久漏 sync？','sd15-s08-p03','不應；cursor catch-up 可補。','Periodic/reconnect changes.list 修復。',[["應，notification 必須 exactly once","不可靠假設。"],["只能 full reinstall App","過度。"],["刪 local DB","不必要。"]]),
  MC('sd15-s08-q3','Notification channel expiration 要？','sd15-s08-p02','在到期前 renew/recreate。','管理 channel lifecycle。',[["忽略，永不過期","錯。"],["改 file_id","無關。"],["只增 cache TTL","不解。"]]),
  MC('sd15-s08-q4','Webhook token 的用途？','sd15-s08-p02','驗證/路由 channel，不應放敏感 OAuth secret。','防 spoof / route notification。',[["儲存 file bytes","不是。"],["取代 TLS","不是。"],["當 user password","不應。"]])
 ]
},
{
 id:'sd15-s09',order:9,title:'Offline Conflict：Base Revision、Optimistic Concurrency、Keep Both',duration:'42–60 分鐘',summary:'兩裝置離線修改同一 file 時，不能靠 last-write-wins 無腦覆蓋；以 base revision 偵測 concurrent edit，再依檔案類型決策。',
 research:[{label:'ByteByteGo — Google Drive sync conflicts',url:'https://bytebytego.com/courses/system-design-interview/design-google-drive'}],
 pages:[
  {id:'sd15-s09-p01',title:'Conflict 的定義',blocks:[
   {type:'code',text:'Server current revision = 10\nLaptop edit base_revision = 10 → commit revision 11\nPhone offline edit base_revision = 10 → server is now 11 → conflict'},
   {type:'p',text:'Phone 的修改不是「舊」而已，而是基於同一 ancestor 的 concurrent branch。'}
  ]},
  {id:'sd15-s09-p02',title:'Whole-file 常用 Keep Both / Conflict Copy',blocks:[
   {type:'compare',items:[['Binary/Office file','難自動 merge，保留 server + conflict copy。'],['Plain text','可嘗試 3-way merge。'],['Collaborative document','需要 OT/CRDT/operation log，是另一層系統。']]}
  ]},
  {id:'sd15-s09-p03',title:'LWW 很簡單，但可能默默丟資料',blocks:[
   {type:'p',text:'單純比較 client timestamp 會受 clock skew，且「較晚」不等於應該覆蓋另一人的工作。重要檔案至少需 revision precondition / ETag / version check。'}
  ]}],
 quiz:[
  MC('sd15-s09-q1','Conflict detection 最重要欄位？','sd15-s09-p01','Client edit 的 base revision 與 server current revision。','Version/revision precondition。',[["只看 filename","不足。"],["只看 client clock","不可靠。"],["只看 file size","不能判 concurrent edit。"]]),
  MC('sd15-s09-q2','Binary file concurrent edit 常見安全策略？','sd15-s09-p02','Keep both / conflict copy。','避免靜默覆蓋。',[["永遠 byte-level merge","通常不可行。"],["直接丟 client 版本","可能丟資料。"],["用 DNS 合併","無關。"]]),
  MC('sd15-s09-q3','LWW by client timestamp 最大風險？','sd15-s09-p03','Clock skew + 靜默遺失 concurrent update。','不能把較晚時間當成正確版本。',[["一定提高 durability","不一定。"],["只影響 UI 排序","也影響 data loss。"],["Server 沒有 clock","不是。"]]),
  MC('sd15-s09-q4','Google Docs 類即時共同編輯為何另題？','sd15-s09-p02','需要 operation-level concurrency/merge，而非 whole-file version。','OT/CRDT/operation log 複雜度更高。',[["因為文字不能存 object storage","不是。"],["因為不能 offline","也可設計。"],["只差 UI","不是。"]])
 ]
},
{
 id:'sd15-s10',order:10,title:'Sharing、ACL、Link Sharing 與 Security Boundary',duration:'38–56 分鐘',summary:'設計 user/group ACL、link token、inheritance、revocation、audit 與 signed download；cache 不能繞過權限。',
 research:[{label:'Google Drive API — Permissions resource',url:'https://developers.google.com/workspace/drive/api/reference/rest/v3/permissions'}],
 pages:[
  {id:'sd15-s10-p01',title:'Authorization 在 Metadata Plane',blocks:[
   {type:'bullets',items:['owner','reader/editor roles','user/group/domain/link principals','folder inheritance / shared drive policy','revocation revision']}
  ]},
  {id:'sd15-s10-p02',title:'Signed Download URL 要短效',blocks:[
   {type:'p',text:'Client 先向 API 驗 ACL，再取得短效 signed URL 直讀 object/CDN。撤權後要讓 token 很快過期，或支援 revocation/versioned auth。'}
  ]},
  {id:'sd15-s10-p03',title:'Cache Key 必須包含 Auth Context 或只 Cache Public Data',blocks:[
   {type:'callout',title:'嚴重漏洞',text:'若 private file response 只以 file_id 做 shared cache key，A 使用者的授權結果可能被 B 命中。'},
   {type:'bullets',items:['cache authorization decision 短 TTL','permission revision in key','private bytes signed token','audit share/download events']}
  ]}],
 quiz:[
  MC('sd15-s10-q1','Private file direct download 前要？','sd15-s10-p02','API 驗 ACL 再發短效 signed URL/token。','Authorization first。',[["只知道 object key 就能下載","不安全。"],["只靠檔名難猜","不是 auth。"],["只靠 CDN hit","不代表有權。"]]),
  MC('sd15-s10-q2','撤權後 signed URL 有效 7 天，問題？','sd15-s10-p02','被撤權者仍可持 token 下載很久。','Token TTL / revocation window 太大。',[["提高 availability","不是主要。"],["只影響 metadata","也影響 bytes。"],["沒有問題","有 security window。"]]),
  MC('sd15-s10-q3','ACL cache 只用 file_id key 的風險？','sd15-s10-p03','不同 requester auth context 混淆。','Authorization cache leak。',[["只會 cache miss","可能更嚴重。"],["只讓 DB 變慢","不是。"],["file_id 太短","不是根因。"]]),
  MC('sd15-s10-q4','Link sharing token 應具備？','sd15-s10-p01','高 entropy、可撤銷/過期、scope 清楚。','不可猜且可治理。',[["用遞增 1,2,3","易猜。"],["永久有效最好","風險高。"],["放 user password 在 URL","嚴重問題。"]])
 ]
},
{
 id:'sd15-s11',order:11,title:'Client Sync Engine：Local DB、File Watcher、Offline Queue、Reconnect',duration:'42–60 分鐘',summary:'真正 Drive client 需要本機 metadata index、filesystem watcher、upload queue、server cursor 與 retry/backoff；不能每次只掃資料夾。',
 research:[{label:'ByteByteGo — Google Drive sync flow',url:'https://bytebytego.com/courses/system-design-interview/design-google-drive'}],
 pages:[
  {id:'sd15-s11-p01',title:'Client 也有一個小型 Database',blocks:[
   {type:'bullets',items:['file_id ↔ local path','server revision','local content hash','sync state/pending op','last change token','conflict status']}
  ]},
  {id:'sd15-s11-p02',title:'兩條同步方向',blocks:[
   {type:'compare',items:[['Local → Cloud','Filesystem watcher → debounce → hash/chunk → upload → commit。'],['Cloud → Local','Push/wake → changes.list → metadata diff → download missing content → atomic local replace。']]}
  ]},
  {id:'sd15-s11-p03',title:'Offline Queue 也要 Idempotent',blocks:[
   {type:'p',text:'Rename/upload/delete operation 可帶 client_op_id；網路 timeout 重送時 server 不應建立兩個版本或重複 delete。'},
   {type:'callout',title:'Atomic Local Replace',text:'下載新檔先寫 temp + checksum，再 rename replace，避免 crash 留半檔。'}
  ]}],
 quiz:[
  MC('sd15-s11-q1','Client local DB 為何重要？','sd15-s11-p01','保存 server revision/cursor/local mapping，避免每次全掃與支援 offline。','Sync engine 的 durable local state。',[["只為 UI theme","不是。"],["取代 cloud metadata DB","不是。"],["只存 password","不應。"]]),
  MC('sd15-s11-q2','Local watcher event 為何要 debounce？','sd15-s11-p02','某些 editor save 會產生多次暫存/rename/write event。','合併短時間 filesystem noise。',[["讓 conflict 消失","不會。"],["讓 file 不需 hash","仍可能需要。"],["因為 watcher 不可靠所以不用","仍可配 periodic scan。"]]),
  MC('sd15-s11-q3','client_op_id 解什麼？','sd15-s11-p03','Retry ambiguous outcome 時 server 可 dedup。','Idempotent offline operation。',[["讓網路永不斷","不會。"],["取代 file_id","不是。"],["只做 analytics","不只。"]]),
  MC('sd15-s11-q4','下載到一半 App crash，怎麼避免本機原檔被毀？','sd15-s11-p03','寫 temp、驗 checksum、atomic rename replace。','Two-phase local replace。',[["直接覆寫原檔 streaming","crash 可能半檔。"],["刪除舊檔後再下載","風險更高。"],["只靠 UI progress","沒保護資料。"]])
 ]
},
{
 id:'sd15-s12',order:12,title:'Multi-Region、Durability、Backup、Observability 與完整收尾',duration:'42–60 分鐘',summary:'把 metadata replication、object durability、change log ordering、regional routing、DR、security/audit 與 sync SLI 串成可營運系統。',
 research:[{label:'ByteByteGo — Google Drive wrap-up',url:'https://bytebytego.com/courses/system-design-interview/design-google-drive'}],
 pages:[
  {id:'sd15-s12-p01',title:'Bytes 與 Metadata 的 DR 策略可以不同',blocks:[
   {type:'compare',items:[['Object bytes','multi-AZ/region replication or erasure coding、checksum、version history。'],['Metadata','transactional DB replication、backup/PITR。'],['Change Log','durable ordered stream，cursor 可 replay。']]}
  ]},
  {id:'sd15-s12-p02',title:'Sync SLI',blocks:[
   {type:'bullets',items:['upload success/resume rate','change propagation latency','sync backlog age','conflict rate','download checksum failures','notification-to-sync lag','orphan bytes / GC lag','ACL denied/invalid token rate']}
  ]},
  {id:'sd15-s12-p03',title:'Region Failure 時 Client 可 Catch Up',blocks:[
   {type:'p',text:'Client 本身已有 local state/cursor；切 region 後只要 metadata/change log 的 global ordering/replication語意清楚，就能從上次 cursor catch up，而不是整個 Drive 重下載。'}
  ]},
  {id:'sd15-s12-p04',title:'完整 Drive Interview Checklist',blocks:[
   {type:'code',text:'□ scope + storage/sync estimate\n□ metadata vs blob separation\n□ resumable/chunk upload\n□ block sync + checksum\n□ immutable version + tombstone\n□ change log + cursor\n□ push as signal\n□ offline conflict\n□ ACL/signed access\n□ client local DB/idempotency\n□ DR + observability'}
  ]}],
 quiz:[
  MC('sd15-s12-q1','Object replication 能取代 metadata backup 嗎？','sd15-s12-p01','不能，兩者資料/故障模式不同。','Bytes 與 metadata 都要自己的 durability/restore。',[["可以，只要 bytes 在就行","會丟 path/ACL/version。"],["Metadata 不需要 backup","錯。"],["只需 client cache","不可靠。"]]),
  MC('sd15-s12-q2','衡量 sync 健康最直接？','sd15-s12-p02','Change propagation latency / backlog age。','從 server change 到 device apply 的延遲。',[["只看 API CPU","不足。"],["只看 object count","不是。"],["只看 login success","太局部。"]]),
  MC('sd15-s12-q3','Region failover 後為何不必全量下載？','sd15-s12-p03','Client 有 base state + cursor，可 replay deltas。','Incremental catch-up。',[["因為 region 共享 RAM","不是。"],["因為 push 包全部 bytes","不是。"],["因為 file 永不改","錯。"]]),
  MC('sd15-s12-q4','完整 Drive 題最核心 correctness？','sd15-s12-p04','Bytes/version/metadata/change cursor 必須一致，offline retry/ conflict 不丟資料。','Durable version commit + replayable change sync + conflict-safe client。',[["只選 object storage 品牌","太局部。"],["只做 CDN","不是核心。"],["只做漂亮 folder tree","不足。"]])
 ]
}
);
})();