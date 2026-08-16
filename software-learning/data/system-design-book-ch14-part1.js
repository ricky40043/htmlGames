(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_14={
 id:'sd-book-14',order:14,title:'設計 YouTube',
 subtitle:'從大型影片上傳、Object Storage、Transcoding Pipeline、Adaptive Streaming、CDN、成本控制到版權與故障恢復，設計全球影片平台。',
 objective:'完成後，你能把 Upload 與 Playback 兩條 flow 分開，說清楚 resumable upload、transcoding DAG、rendition、CDN/Origin、metadata、queue、retry、cost 與 multi-region。',
 sections:[],finalExam:[]
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd14-s01',order:1,title:'需求、規模與成本：影片平台的瓶頸不是只有 QPS',duration:'36–52 分鐘',summary:'鎖定 upload/watch/quality change/global users，再估影片 bytes、watch minutes、egress、transcoding 與 storage amplification。',
 research:[{label:'ByteByteGo — Design YouTube / Scope & Estimation',url:'https://bytebytego.com/courses/system-design-interview/design-youtube'}],
 pages:[
  {id:'sd14-s01-p01',title:'先鎖定兩條核心 Flow',blocks:[
   {type:'compare',items:[['Upload','大檔、斷線恢復、原始檔、transcoding、metadata publish。'],['Playback','低 startup latency、adaptive bitrate、CDN、hot content、全球 egress。'],['非核心','comment/feed/recommendation/ads 可先排除。']]},
   {type:'callout',title:'面試 Scope',text:'ByteByteGo 本章聚焦快速 upload、smooth streaming、quality switching、低成本、HA/scale/reliability。'}
  ]},
  {id:'sd14-s01-p02',title:'影片系統要估 Bytes，不只 Requests',blocks:[
   {type:'bullets',items:['Uploads/day × average source size。','每個 source 轉出多個 resolution/codec，storage amplification。','Watch minutes/day × average delivered bitrate = egress。','Transcoding CPU/GPU minutes。','CDN hit ratio / origin egress。']},
   {type:'p',text:'影片平台通常 bandwidth、storage、transcoding 成本比 metadata QPS 更早成為主導。'}
  ]},
  {id:'sd14-s01-p03',title:'播放 SLO',blocks:[
   {type:'compare',items:[['Startup Time','點播放到第一個 frame。'],['Rebuffer Ratio','播放中等待 buffer 的時間比例。'],['Video Start Failure','manifest/chunk/auth/CDN 失敗。'],['Quality','平均 bitrate / quality switches。']]}
  ]}],
 quiz:[
  MC('sd14-s01-q1','YouTube 題最先該拆哪兩條 flow？','sd14-s01-p01','Upload 與 Playback 的 bottleneck 完全不同。','Upload flow 與 video streaming/playback flow。',[["Login 與 comments only","不是本章核心。"],["DNS 與 CSS","太淺。"],["只拆 frontend/backend","不足。"]]),
  MC('sd14-s01-q2','影片平台容量估算為何要重視 egress？','sd14-s01-p02','播放會持續傳大量 video bytes。','Watch minutes × bitrate 可形成巨大 bandwidth/cost。',[["因為 metadata 特別大","通常相反。"],["因為 CDN 不傳資料","會傳。"],["只為計算 DB row count","不是。"]]),
  MC('sd14-s01-q3','Rebuffer ratio 代表什麼？','sd14-s01-p03','播放過程因 buffer 不足而停頓的比例。','Streaming QoE 的核心 SLI。',[["Upload retry 次數","不是。"],["DB replication lag","不是。"],["Thumbnail count","不是。"]]),
  MC('sd14-s01-q4','為何一個 source video 可能占多倍 storage？','sd14-s01-p02','要產生多 resolution/bitrate/codec renditions。','Transcoding 產物造成 storage amplification。',[["因為 JSON metadata 太大","不是主要。"],["因為每個 user 都複製 source","不是。"],["因為 CDN 永久存所有版本","不一定。"]])
 ]
},
{
 id:'sd14-s02',order:2,title:'High-Level Design：API、Object Storage、Transcoding、CDN',duration:'36–52 分鐘',summary:'把 metadata/control plane 與 video bytes/data plane 分離；大檔不經 API server 中轉。',
 research:[{label:'ByteByteGo — YouTube high-level design',url:'https://bytebytego.com/courses/system-design-interview/design-youtube'}],
 pages:[
  {id:'sd14-s02-p01',title:'Control Plane vs Media Data Plane',blocks:[
   {type:'diagram',nodes:[['Client','upload/watch'],['API','auth/metadata/session'],['Object Storage','source + renditions'],['Transcode Queue','jobs'],['Workers','encode/package'],['CDN','playback bytes']],caption:'API server 不應成為每 GB 影片 bytes 的中轉瓶頸。'}
  ]},
  {id:'sd14-s02-p02',title:'Metadata 與 Blob 分離',blocks:[
   {type:'compare',items:[['Metadata DB','video_id、owner、title、status、duration、visibility、rendition manifest。'],['Object Storage','source video、transcoded segments、thumbnail。'],['Cache','熱門 metadata / authorization / manifest。']]}
  ]},
  {id:'sd14-s02-p03',title:'Ready State 是 Workflow，不是 Boolean',blocks:[
   {type:'code',text:'CREATED → UPLOADING → UPLOADED → PROCESSING\n        → READY\n        ↘ FAILED / QUARANTINED'},
   {type:'p',text:'狀態機讓 client、worker、retry、moderation 都能知道影片目前在哪一階段。'}
  ]}],
 quiz:[
  MC('sd14-s02-q1','為什麼大影片 bytes 不走 API server relay？','sd14-s02-p01','會放大 API bandwidth/memory/connection 壓力。','讓 client 直接對 object storage/upload endpoint，API 只控 metadata/session。',[["API server 不能傳 binary","可以，只是不划算。"],["Object storage 不能驗權限","可透過 signed/session URL。"],["CDN 只能 upload","不是。"]]),
  MC('sd14-s02-q2','Title/visibility 應主要放哪？','sd14-s02-p02','這些是 metadata。','Metadata DB。',[["直接寫在 video bytes 尾端 only","不利查詢。"],["只放 CDN cache","不是 source of truth。"],["只放 client localStorage","不可靠。"]]),
  MC('sd14-s02-q3','影片 READY 前為何需要 PROCESSING state？','sd14-s02-p03','Upload 完成後還可能 transcoding/package/moderation。','區分 bytes 已上傳與可播放。',[["Upload 完就一定可播放所有裝置","不一定。"],["只為 UI 動畫","有 backend workflow 意義。"],["因為 metadata 尚未存在","不一定。"]]),
  MC('sd14-s02-q4','Transcoding queue 解什麼？','sd14-s02-p01','Upload 與 CPU-heavy encoding 解耦並吸收尖峰。','非同步 buffer + worker scaling。',[["取代 object storage","不是。"],["保證 encode 0ms","不會。"],["讓 CDN 不需要 origin","不是。"]])
 ]
},
{
 id:'sd14-s03',order:3,title:'Resumable Upload：大檔與不穩網路的必要設計',duration:'38–55 分鐘',summary:'使用 upload session、byte range/chunk、checksum、retry 與 direct-to-storage，避免 1GB 影片因最後 1% 斷線全部重傳。',
 research:[{label:'YouTube Data API — Resumable Uploads',url:'https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol'}],
 pages:[
  {id:'sd14-s03-p01',title:'Upload Session',blocks:[
   {type:'stepper',steps:[['Create session','API 驗權限/metadata，回 upload URL。'],['Upload bytes','Client 對 session URL 傳 binary。'],['Checkpoint','Server 記錄已成功 range。'],['Resume','斷線後查 offset，從下一 byte 繼續。'],['Finalize','checksum/size 完整後標記 UPLOADED。']]}
  ]},
  {id:'sd14-s03-p02',title:'不要假設最後一個 Request 全收或全沒收',blocks:[
   {type:'p',text:'網路斷線時 client 可能不知道 server 已寫到哪。YouTube 官方 resumable protocol 可查 upload status，308 response Range 告訴已成功 byte offset，再續傳剩餘部分。'},
   {type:'callout',title:'Ambiguous Outcome',text:'Distributed upload 最危險的是 client timeout 後盲目重傳造成重複/覆寫；session + range state 解這個問題。'}
  ]},
  {id:'sd14-s03-p03',title:'Chunk Size Trade-off',blocks:[
   {type:'compare',items:[['大 Chunk','request overhead 少，但失敗重傳單位大。'],['小 Chunk','恢復細、progress 好，但 request/metadata overhead 高。'],['Parallel Chunks','更快但需排序/commit/checksum 與上限控制。']]}
  ]}],
 quiz:[
  MC('sd14-s03-q1','Resumable upload 最大價值？','sd14-s03-p01','斷線不必從 0 重傳大檔。','從已成功 offset 恢復。',[["讓 transcoding 不需要","無關。"],["讓影片永遠變小","不是。"],["讓 CDN 自動 encode","不是。"]]),
  MC('sd14-s03-q2','Client timeout 後為何先查 upload offset？','sd14-s03-p02','Server 可能已收到部分 bytes，結果具有 ambiguity。','避免盲目重傳或漏傳。',[["因為 HTTP 不支援 retry","支援。"],["因為 DB 一定掉線","不一定。"],["只為顯示進度條","不只。"]]),
  MC('sd14-s03-q3','Chunk 越小的代價？','sd14-s03-p03','更多 requests、headers、metadata/coordination。','Recovery granularity 換 request overhead。',[["一定更慢且不可用","不是絕對。"],["會讓 checksum 失效","不會。"],["會取消 resume","相反。"]]),
  MC('sd14-s03-q4','Upload finalize 前最應驗證？','sd14-s03-p01','預期 size/checksum/ranges 完整性。','確認 bytes 完整且未重疊/缺段。',[["只看 filename","不足。"],["只看 user agent","無關。"],["只看 thumbnail","太晚/無關。"]])
 ]
},
{
 id:'sd14-s04',order:4,title:'Metadata Flow 與 Publish Boundary',duration:'32–45 分鐘',summary:'Video bytes 與 metadata 可平行上傳，但只有 processing 完成且 policy 通過後才對觀看者 publish。',
 research:[{label:'YouTube Data API — Videos resource',url:'https://developers.google.com/youtube/v3/docs/videos'}],
 pages:[
  {id:'sd14-s04-p01',title:'Metadata 可以先寫，但 Public Read 要看 State',blocks:[
   {type:'p',text:'Title/description/privacy 可以在 upload session 前後更新；但 watch API 應檢查 video state=READY 且 visibility/ACL 通過。'}
  ]},
  {id:'sd14-s04-p02',title:'Publish Event 應在 Durable State 後',blocks:[
   {type:'diagram',nodes:[['Transcode Complete','all required outputs'],['Metadata Tx','READY + manifest version'],['Event','VideoReady'],['Cache/CDN','warm/invalidate'],['Viewer','discover/play']],caption:'不要先發 VideoReady 再發現 metadata transaction 失敗。'}
  ]},
  {id:'sd14-s04-p03',title:'Idempotent Completion Handler',blocks:[
   {type:'p',text:'Queue 可能重送 transcoding-complete event；handler 以 video_id + pipeline_version 去重，重複處理不能重複發布、重複計費或覆蓋新版本。'}
  ]}],
 quiz:[
  MC('sd14-s04-q1','Upload bytes 完成是否代表 viewer 一定可播放？','sd14-s04-p01','還可能需 transcoding/moderation/publish。','不一定，要等 READY。',[["一定可以","錯。"],["永遠不可以","也錯。"],["只看 title 是否存在","不足。"]]),
  MC('sd14-s04-q2','VideoReady event 最安全何時發？','sd14-s04-p02','READY/manifest durable commit 之後。','先 commit source of truth，再發事件。',[["Upload 開始就發","太早。"],["Client 打字 title 時","無關。"],["CDN miss 時才發","不是。"]]),
  MC('sd14-s04-q3','Completion handler 為何要 idempotent？','sd14-s04-p03','Queue/retry 可能重複 event。','避免重複 publish/side effect。',[["因為 event 永遠 exactly once","不能假設。"],["只為省 DB row","不只。"],["因為 CDN 不支援 retry","無關。"]]),
  MC('sd14-s04-q4','Manifest version 應跟什麼綁定？','sd14-s04-p02','一組可播放 renditions 的一致版本。','Pipeline/output version，避免混用半舊半新 segments。',[["User password version","無關。"],["Browser tab id","無關。"],["DNS TTL only","不是。"]])
 ]
},
{
 id:'sd14-s05',order:5,title:'Transcoding Pipeline：DAG、Queue、Worker 與 Idempotency',duration:'42–60 分鐘',summary:'把 encode、thumbnail、audio normalization、packaging 視為可重試工作 DAG；不同 stage 獨立擴縮。',
 research:[{label:'ByteByteGo — Video transcoding',url:'https://bytebytego.com/courses/system-design-interview/design-youtube'}],
 pages:[
  {id:'sd14-s05-p01',title:'Transcoding 是 DAG，不是一個大函式',blocks:[
   {type:'diagram',nodes:[['Source','original'],['Probe','codec/duration'],['Encode','360/720/1080'],['Package','segments+manifest'],['Thumbnail','frames'],['Publish','READY']],caption:'可平行的 stages 不要全部串成單 worker。'}
  ]},
  {id:'sd14-s05-p02',title:'Queue 讓 GPU/CPU Worker 吸收 Upload Spike',blocks:[
   {type:'bullets',items:['按 codec/resolution 分 queue/pool。','Job 帶 input version / output key。','Retry 有 backoff/budget。','長期失敗進 DLQ / manual review。','Progress state 可被 client 查詢。']}
  ]},
  {id:'sd14-s05-p03',title:'Idempotent Output Key',blocks:[
   {type:'code',text:'output_key = video_id / pipeline_version / rendition / segment_no'},
   {type:'p',text:'同一 job 重跑應覆寫/確認同一 deterministic output，而不是生成多份互相競爭的檔案。'}
  ]}],
 quiz:[
  MC('sd14-s05-q1','Transcoding 為何適合 DAG？','sd14-s05-p01','多個 stage 有依賴但也可平行。','能表達依賴、平行與局部 retry。',[["因為影片一定是 graph database","不是。"],["因為 API server 無法 encode","可，但不應。"],["只為畫圖好看","有 execution 意義。"]]),
  MC('sd14-s05-q2','Upload spike 時 queue 的主要價值？','sd14-s05-p02','把 ingest rate 與有限 transcoding capacity 解耦。','Buffer backlog + worker independent scaling。',[["讓 GPU 無限快","不會。"],["取消 storage","不是。"],["保證零等待","不會。"]]),
  MC('sd14-s05-q3','為何 output key deterministic？','sd14-s05-p03','Retry 可以安全寫同一 logical output。','支持 idempotent retry。',[["讓每次 retry 產生新檔才安全","會重複。"],["只為縮短 URL","不是。"],["避免使用 video_id","相反。"]]),
  MC('sd14-s05-q4','單一 rendition encode 一直失敗，應？','sd14-s05-p02','有限 retry 後 DLQ/標記 pipeline failed，不應無限重試。','Retry budget + DLQ + diagnostics。',[["無限 tight-loop retry","會燒資源。"],["直接標 READY","缺輸出。"],["刪 source","危險。"]])
 ]
},
{
 id:'sd14-s06',order:6,title:'Codec、Bitrate、Rendition 與 Adaptive Streaming',duration:'42–58 分鐘',summary:'理解為什麼同一影片要多個 bitrate/resolution；manifest 讓 player 根據 bandwidth/buffer 動態選 rendition。',
 research:[{label:'ByteByteGo — Video transcoding / streaming',url:'https://bytebytego.com/courses/system-design-interview/design-youtube'}],
 pages:[
  {id:'sd14-s06-p01',title:'不是只有 Resolution',blocks:[
   {type:'bullets',items:['Resolution：360p/720p/1080p/4K。','Bitrate：同 resolution 也可不同品質。','Codec：H.264/VP9/AV1 等 device support/cost 不同。','Audio tracks / subtitles / HDR 也可能形成 variants。']}
  ]},
  {id:'sd14-s06-p02',title:'Manifest 描述可切換的 Renditions',blocks:[
   {type:'code',text:'manifest\n - 360p @ 0.8Mbps\n - 720p @ 2.5Mbps\n - 1080p @ 5Mbps\n segments: 2–6s each'},
   {type:'p',text:'Player 先取 manifest，再逐段取 segment；網速變差可下一段切低 bitrate，而不是重新下載整支影片。'}
  ]},
  {id:'sd14-s06-p03',title:'Adaptive Bitrate 的輸入不只瞬時 Speedtest',blocks:[
   {type:'bullets',items:['estimated throughput','current buffer seconds','recent segment download time','device/display capability','data saver/user preference']},
   {type:'callout',title:'QoE Trade-off',text:'太激進升畫質會 rebuffer；太保守則畫質差。'}
  ]}],
 quiz:[
  MC('sd14-s06-q1','為何同影片做多 bitrate？','sd14-s06-p01','不同網路/裝置可用不同品質。','支援 adaptive playback 與 compatibility。',[["只為增加 storage cost","不是目的。"],["因為 CDN 只支援一種 bitrate","錯。"],["因為 metadata DB 要更多 rows","不是核心。"]]),
  MC('sd14-s06-q2','Manifest 的角色？','sd14-s06-p02','告訴 player 有哪些 renditions/segments 可選。','描述 adaptive streaming playlist。',[["保存 user password","無關。"],["取代 source video","不是。"],["只存 comments","不是。"]]),
  MC('sd14-s06-q3','Buffer 很低時 player 應傾向？','sd14-s06-p03','降低 bitrate 以縮短 segment download，避免 rebuffer。','優先穩定播放，再逐步升畫質。',[["立刻切最高 bitrate","更可能卡。"],["停止下載","會更糟。"],["重新 upload 影片","無關。"]]),
  MC('sd14-s06-q4','Adaptive bitrate 最重要的 UX trade-off？','sd14-s06-p03','Quality vs rebuffer/stability。','畫質與連續播放之間平衡。',[["SQL vs NoSQL","不是。"],["IPv4 vs IPv6 only","不是。"],["Title 長度","無關。"]])
 ]
}
);
})();