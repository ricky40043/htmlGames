(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_15={
 id:'sd-book-15',order:15,title:'設計 Google Drive',
 subtitle:'從 Resumable Upload、Object Storage、Metadata、Block Sync、Change Log、Offline Conflict、Sharing、Notification 到 Multi-Region，設計可靠檔案同步平台。',
 objective:'完成後，你能把 File Bytes、Metadata、Sync State、Change Feed 與 Notification 分離，解釋 upload/download/sync/conflict/versioning/ACL 與 offline recovery。',
 sections:[],finalExam:[]
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd15-s01',order:1,title:'需求與 Scope：Upload、Download、Sync、Share、Offline',duration:'36–52 分鐘',summary:'先釐清 Drive 與單純 Object Storage 的差異：多裝置一致視圖、資料夾/metadata、版本、分享與 offline sync。',
 research:[{label:'ByteByteGo — Design Google Drive',url:'https://bytebytego.com/courses/system-design-interview/design-google-drive'}],
 pages:[
  {id:'sd15-s01-p01',title:'Drive 題真正難的是 Sync',blocks:[
   {type:'compare',items:[['Object Storage','以 object key 存/取 bytes。'],['Drive','還要檔名/資料夾/ACL/version/change log/multi-device/offline。'],['Dropbox-like Sync','本機檔案系統與雲端狀態雙向收斂。']]},
   {type:'callout',title:'本章 Scope',text:'Upload/download、sync across devices、sharing、file version/history、offline changes；協作編輯器不是本題核心。'}
  ]},
  {id:'sd15-s01-p02',title:'Functional Requirements',blocks:[
   {type:'bullets',items:['Upload large files reliably。','Download / preview。','Sync changes across devices。','Create/move/rename/delete files/folders。','Share with users/links。','Version history / conflict handling。']}
  ]},
  {id:'sd15-s01-p03',title:'Non-functional Requirements',blocks:[
   {type:'compare',items:[['Durability','檔案不可因單機故障消失。'],['Sync Latency','裝置幾秒內看到更新。'],['Availability','暫時部分依賴失敗仍可操作/重試。'],['Security','ACL、encryption、audit。'],['Bandwidth Efficiency','只傳必要 bytes / delta。']]}
  ]}],
 quiz:[
  MC('sd15-s01-q1','Drive 與純 Object Storage 最大額外複雜度？','sd15-s01-p01','多裝置 metadata/change/conflict sync。','需要 sync state、change feed、ACL/version。',[["Drive 不能存 bytes","可以。"],["Object storage 一定沒有 durability","通常也有。"],["只差 UI icon","不是。"]]),
  MC('sd15-s01-q2','Offline device 回線後最核心需求？','sd15-s01-p02','把本機累積變更與 server changes 合併/解衝突。','Catch-up + conflict resolution。',[["直接覆蓋 server 全部資料","危險。"],["丟掉 offline changes","不符合。"],["只重新登入","不夠。"]]),
  MC('sd15-s01-q3','Drive capacity 不能只估 API QPS，還要？','sd15-s01-p03','File bytes、sync traffic、versions、change events。','Storage/bandwidth/version amplification。',[["只看 folder count","不足。"],["只看 CSS size","無關。"],["只看 login latency","不是主量級。"]]),
  MC('sd15-s01-q4','協作文字 OT/CRDT 是否本章必做？','sd15-s01-p01','不一定；Drive file sync 可先視 whole-file/version conflict。','先鎖定 file sync，real-time editor 是另一題。',[["一定要做完整 Google Docs","scope 爆炸。"],["Drive 不需要任何 conflict","錯。"],["只能處理 text file","不是。"]])
 ]
},
{
 id:'sd15-s02',order:2,title:'Back-of-the-envelope：Bytes、Versions、Sync Events',duration:'34–48 分鐘',summary:'用 users × files × average size × versions 估 storage，用 uploads/downloads/sync notifications 估 throughput。',
 research:[{label:'ByteByteGo — Google Drive estimation',url:'https://bytebytego.com/courses/system-design-interview/design-google-drive'}],
 pages:[
  {id:'sd15-s02-p01',title:'Storage = Current + Versions + Replication',blocks:[
   {type:'code',text:'logical_bytes = users × avg_files × avg_file_size\nphysical ≈ logical × version_factor × replication_factor'},
   {type:'p',text:'Version history、trash retention、replication、erasure coding、thumbnail/preview 都會增加 physical footprint。'}
  ]},
  {id:'sd15-s02-p02',title:'Sync Traffic 不是等於 Upload Traffic',blocks:[
   {type:'bullets',items:['One upload may notify N devices/collaborators。','Metadata-only rename 不應重新傳整個 file bytes。','Mobile background sync 有電量/網路限制。','大量 reconnect devices 可造成 catch-up read spike。']}
  ]},
  {id:'sd15-s02-p03',title:'Large File 與 Tiny File 是不同 Bottleneck',blocks:[
   {type:'compare',items:[['Large files','bandwidth、resumable upload、chunk retry。'],['Tiny files','metadata QPS、per-object overhead、directory listing。']]}
  ]}],
 quiz:[
  MC('sd15-s02-q1','為何 physical storage > logical user bytes？','sd15-s02-p01','版本、replication、preview 等放大。','Version/replication overhead。',[["因為 metadata 不可存","不是。"],["因為 object storage 會隨機複製無限次","不是。"],["只因 filename Unicode","不是。"]]),
  MC('sd15-s02-q2','Rename 一個 10GB file 是否應重新 upload 10GB？','sd15-s02-p02','不應；rename 是 metadata change。','Bytes 與 metadata 分離。',[["一定要重傳","浪費。"],["Drive 不支援 rename","錯。"],["只要壓縮即可","仍不該傳 bytes。"]]),
  MC('sd15-s02-q3','大量 devices 同時重連最可能造成？','sd15-s02-p02','Change catch-up / metadata read spike。','Reconnect storm / sync backlog。',[["Object bytes 自動消失","不會。"],["ACL 永久失效","不一定。"],["只有 DNS 增加","不只。"]]),
  MC('sd15-s02-q4','Tiny file workload 最容易卡？','sd15-s02-p03','大量 metadata/object operations 而非純 bandwidth。','Metadata QPS / per-object overhead。',[["只卡 egress Mbps","不一定。"],["一定需要 GPU","不需要。"],["只卡 transcoding","不是影片。"]])
 ]
},
{
 id:'sd15-s03',order:3,title:'High-Level Design：Metadata、Blob、Sync、Notification 分層',duration:'38–54 分鐘',summary:'把 metadata source of truth、binary object storage、change log/sync service、notification signal 與 client local DB 分開。',
 research:[{label:'ByteByteGo — Google Drive high-level design',url:'https://bytebytego.com/courses/system-design-interview/design-google-drive'}],
 pages:[
  {id:'sd15-s03-p01',title:'四個核心資料面',blocks:[
   {type:'diagram',nodes:[['Client','local DB + files'],['API/Metadata','file tree/ACL/version'],['Object Storage','chunks/objects'],['Change Log','ordered deltas'],['Notification','wake clients']],caption:'Notification 是 signal；真正同步內容由 change log/metadata 取得。'}
  ]},
  {id:'sd15-s03-p02',title:'Metadata DB 是命名空間 Source of Truth',blocks:[
   {type:'bullets',items:['file_id / parent_id / name','owner / ACL','current_version','size / checksum','state: active/trash/deleted','created/modified revision']}
  ]},
  {id:'sd15-s03-p03',title:'Object Storage 不應用 Path 當唯一 Key',blocks:[
   {type:'p',text:'Rename/move 若 blob key 綁 /folder/name，會迫使搬大物件。更常用 immutable content/object ID，path tree 由 metadata 管理。'}
  ]}],
 quiz:[
  MC('sd15-s03-q1','Notification 在 sync 架構中最安全的角色？','sd15-s03-p01','提醒 client 有變更，再由 change log 拉完整狀態。','Wake-up signal，而非唯一 source of truth。',[["通知 payload 就是唯一歷史","可能漏/重送。"],["取代 metadata DB","不是。"],["取代 object storage","不是。"]]),
  MC('sd15-s03-q2','Folder hierarchy 最適合主要由哪層管理？','sd15-s03-p02','parent_id/name/ACL 是 metadata。','Metadata DB。',[["直接從 object bytes 推導","不合理。"],["只靠 CDN","不是。"],["只靠 client memory","不一致。"]]),
  MC('sd15-s03-q3','Blob key 若直接等於完整 path 的缺點？','sd15-s03-p03','Rename/move 可能變成昂貴 blob copy。','Path 與 object identity 過度耦合。',[["無法下載","仍可。"],["不能做 ACL","可但複雜。"],["只會影響 UI","也影響 data movement。"]]),
  MC('sd15-s03-q4','current_version 放 metadata 的意義？','sd15-s03-p02','指出 file logical identity 目前引用哪個 immutable content/version。','支援 atomic version switch/history。',[["代表 user app 版本","不是。"],["等於 chunk size","不是。"],["等於 CDN TTL","不是。"]])
 ]
},
{
 id:'sd15-s04',order:4,title:'Resumable Upload：Session、Chunk、Checksum、Finalize',duration:'40–58 分鐘',summary:'沿用大型檔案可靠傳輸模式：建立 session、傳 chunks、查 offset、重試、checksum，最後 metadata commit 新 version。',
 research:[{label:'Google Drive API — Resumable uploads',url:'https://developers.google.com/workspace/drive/api/guides/manage-uploads'}],
 pages:[
  {id:'sd15-s04-p01',title:'Drive 官方也支援 Resumable Upload',blocks:[
   {type:'stepper',steps:[['Create session','建立 resumable URI。'],['Upload','傳完整檔或 chunks。'],['Resume','通信中斷後續傳。'],['Verify','size/checksum。'],['Commit','建立/切換 file version。']]}
  ]},
  {id:'sd15-s04-p02',title:'Chunk Upload 與 Metadata Commit 要分兩階段',blocks:[
   {type:'p',text:'某些 chunks 已上傳不代表新版本完整。只有所有 required chunks durable 且 hash/size 驗證通過後，metadata current_version 才能 atomic 指向新 content。'}
  ]},
  {id:'sd15-s04-p03',title:'Orphan Chunks 需要 GC',blocks:[
   {type:'p',text:'Client 建 session 後消失會留下未 finalize chunks。Upload session TTL + reference counting / background GC 回收未被任何 committed version 引用的 bytes。'}
  ]}],
 quiz:[
  MC('sd15-s04-q1','Resumable upload 最大價值？','sd15-s04-p01','中斷後可續傳，不需重傳大型檔案。','可靠且省 bandwidth。',[["讓 file 自動分享","無關。"],["取消 checksum","相反。"],["取代 metadata","不是。"]]),
  MC('sd15-s04-q2','為何 chunk 完成不立刻切 current_version？','sd15-s04-p02','可能只是部分 chunks，讀者會看到 incomplete version。','Finalize 全部 bytes 後 atomic metadata commit。',[["因為 metadata 不能更新","可以。"],["因為 chunk 沒有 ID","可以有。"],["只為 delay UI","不是。"]]),
  MC('sd15-s04-q3','Upload session abandoned 的 bytes 怎麼辦？','sd15-s04-p03','TTL + GC orphan chunks。','回收未被 committed version 引用的資料。',[["永久保留所有 orphan","浪費。"],["直接刪所有同 user bytes","危險。"],["交給 CDN","不是。"]]),
  MC('sd15-s04-q4','Finalize 前 checksum 不符應？','sd15-s04-p01','不要 publish version，重傳損壞 chunks/失敗。','Integrity failure，拒絕 commit。',[["仍然 READY","會 corrupt。"],["只改 filename","無效。"],["只增加 ACL","無關。"]])
 ]
},
{
 id:'sd15-s05',order:5,title:'Block Sync 與 Content Hash：只傳改變部分',duration:'42–60 分鐘',summary:'對大型檔案使用 chunk/block hash，避免只改 1MB 卻重傳 10GB；理解 dedup、chunking 與安全/隱私 trade-off。',
 research:[{label:'ByteByteGo — Google Drive block servers',url:'https://bytebytego.com/courses/system-design-interview/design-google-drive'}],
 pages:[
  {id:'sd15-s05-p01',title:'Whole-file Sync 的浪費',blocks:[
   {type:'p',text:'10GB VM image 只改 4MB，如果每次整檔 upload，bandwidth、時間、mobile battery 都極差。Block sync 先比較 chunks/content hashes，只上傳缺少或改變的 blocks。'}
  ]},
  {id:'sd15-s05-p02',title:'Chunk Map',blocks:[
   {type:'code',text:'version V7\n[chunkA hash=aa..]\n[chunkB hash=bb..]\n[chunkC hash=cc..]\nmetadata → ordered chunk IDs'},
   {type:'p',text:'File version 可由 ordered chunk refs 組成；未變 chunks 被新版本重用。'}
  ]},
  {id:'sd15-s05-p03',title:'Dedup 不等於無風險',blocks:[
   {type:'bullets',items:['Content hash collision 要用強 hash/size verify。','Cross-user dedup 可能洩漏「某內容是否存在」資訊。','Encrypted-per-user content 會限制 global dedup。','Reference counting/GC 要避免仍被舊 version 引用的 chunk 被刪。']}
  ]}],
 quiz:[
  MC('sd15-s05-q1','Block sync 最直接降低？','sd15-s05-p01','小改動時避免重傳整檔。','Bandwidth/time。',[["Metadata 完全不需要","仍需要。"],["所有 conflict 消失","不會。"],["ACL 不需要","仍需要。"]]),
  MC('sd15-s05-q2','File version 用 ordered chunk IDs 表示的好處？','sd15-s05-p02','未變 chunks 可共享，版本組合清楚。','Content-addressed/reusable blocks。',[["Chunk 順序不重要","通常重要。"],["所有 chunks 可隨機刪","不行。"],["不需 checksum","仍需要。"]]),
  MC('sd15-s05-q3','Cross-user dedup 的 privacy concern？','sd15-s05-p03','可能透過 dedup timing/existence oracle 推測他人已有內容。','內容存在性洩漏。',[["只增加 storage","相反可能省 storage。"],["只影響 UI","不是。"],["完全沒有 security impact","不一定。"]]),
  MC('sd15-s05-q4','GC chunk 前最重要？','sd15-s05-p03','確認沒有任何 committed/current/history version 引用。','Reference reachability/count。',[["只看 chunk age","可能仍被引用。"],["只看 filename","無關。"],["只看 last downloader","不足。"]])
 ]
},
{
 id:'sd15-s06',order:6,title:'Metadata Versioning：Atomic Commit、Rename、Delete、Trash',duration:'38–54 分鐘',summary:'讓 file logical identity 穩定，content version immutable；move/rename 只改 metadata，delete/trash 用 state/revision 傳播。',
 research:[{label:'Google Drive API — Files resource',url:'https://developers.google.com/workspace/drive/api/reference/rest/v3/files'}],
 pages:[
  {id:'sd15-s06-p01',title:'File ID 穩定，Version ID 變化',blocks:[
   {type:'compare',items:[['file_id','邏輯文件身份，rename/move 後不變。'],['version_id','每次 content commit 新版本。'],['chunk/object IDs','immutable bytes blocks。']]}
  ]},
  {id:'sd15-s06-p02',title:'Rename/Move 是 Metadata Transaction',blocks:[
   {type:'p',text:'更新 parent_id/name/revision，寫 change event；不必搬 binary。Directory uniqueness rule（同 parent 是否允許同名）由產品定義。'}
  ]},
  {id:'sd15-s06-p03',title:'Delete 先 Tombstone，再 GC',blocks:[
   {type:'stepper',steps:[['Trash/Delete','metadata state + revision'],['Sync','其他 devices 收到 deletion event'],['Retention','保留復原窗口'],['GC','確認 retention/refs 後移除 bytes']]}
  ]}],
 quiz:[
  MC('sd15-s06-q1','Rename 後應變的是 file_id 還是 metadata？','sd15-s06-p01','file_id 穩定，name/parent/revision 變。','Metadata 變，logical ID 不變。',[["每次 rename 產生新 file_id","會破壞 sync refs。"],["重寫所有 bytes","不需要。"],["只改 client UI 不寫 server","其他裝置看不到。"]]),
  MC('sd15-s06-q2','Version ID 為何 immutable？','sd15-s06-p01','方便 history、checksum、cache、conflict base revision。','每次修改建立新版本，不原地改舊版本。',[["為了不能 rollback","相反可 rollback。"],["為了省 storage 到 0","不是。"],["只為排序 folder","不是。"]]),
  MC('sd15-s06-q3','Delete 為何先 tombstone？','sd15-s06-p03','離線/其他 device 需要知道這筆刪除，而不是資料憑空消失。','讓 deletion 可同步/復原，再延後 GC。',[["因為 object storage 不能 delete","可以。"],["只為 audit UI","不只。"],["讓 bytes 永不刪","仍可 GC。"]]),
  MC('sd15-s06-q4','Move folder 最重要 atomicity？','sd15-s06-p02','namespace metadata 更新與 revision/change event 一致。','避免一半 client 看舊 parent、一半看無法解釋狀態。',[["所有 child bytes 必須搬物理位置","不一定。"],["一定全檔重傳","不需要。"],["只改 CDN cache","不是 source of truth。"]])
 ]
}
);
})();