(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_14;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const MC=(id,question,page,explanation,correct,wrong)=>({id,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.sections.push(
{
 id:'sd14-s07',order:7,title:'CDN、Origin 與 Hot Video',duration:'38–55 分鐘',summary:'把 viewer traffic 從 origin 移到 edge；理解 cache hit、origin shield、popular video、cold miss 與 signed delivery。',
 research:[{label:'ByteByteGo — CDN in YouTube design',url:'https://bytebytego.com/courses/system-design-interview/design-youtube'}],
 pages:[
  {id:'sd14-s07-p01',title:'Playback Bytes 主要走 CDN',blocks:[
   {type:'diagram',nodes:[['Viewer','manifest/segment'],['Edge CDN','hot chunks'],['Origin Shield','optional'],['Object Storage','source of truth']],caption:'API server 不承擔大部分 video egress。'}
  ]},
  {id:'sd14-s07-p02',title:'Hot Video 是 CDN 的甜蜜點',blocks:[
   {type:'p',text:'同一 segment 被大量 viewers 重複讀，edge hit ratio 高；origin bandwidth 大幅下降。新影片/長尾影片則更可能 cold miss。'},
   {type:'callout',title:'Cache Key',text:'video_id + rendition + segment/version，不能因 token/query noise 讓同一 segment 形成大量 cache variants。'}
  ]},
  {id:'sd14-s07-p03',title:'Origin 失敗要有 Degraded Strategy',blocks:[
   {type:'bullets',items:['edge stale serve where safe','multi-origin / replicated object storage','short retry budget','manifest fallback to available rendition','prewarm predictable premieres']}
  ]}],
 quiz:[
  MC('sd14-s07-q1','CDN 對影片系統最直接的價值？','sd14-s07-p01','把重複 playback bytes 從靠近使用者的 edge 提供。','降低 origin egress 與 latency。',[["取代 metadata DB","不是。"],["負責所有 transcoding","不是。"],["保證影片內容合法","不是。"]]),
  MC('sd14-s07-q2','Hot video 為何 CDN hit 高？','sd14-s07-p02','大量 viewers 讀相同 segments。','高重用讓 edge cache 有效。',[["因為影片一定更短","無關。"],["因為 hot video 不需 storage","錯。"],["因為每 user 都拿不同 bytes","相反。"]]),
  MC('sd14-s07-q3','Cache key 帶大量無關 query token 可能？','sd14-s07-p02','造成同一 segment 被分成很多 cache objects，hit ratio 下降。','Cache fragmentation。',[["提高 hit ratio","相反。"],["自動縮影片","不會。"],["解決 auth","不一定。"]]),
  MC('sd14-s07-q4','Origin 暫時失敗時哪個策略較成熟？','sd14-s07-p03','使用 edge cached/stale content、replicated origin、有限 retry。','Fail-soft，不要讓所有 viewers 同時打爆 origin。',[["所有 client 無限 retry","會放大故障。"],["刪 CDN cache","更糟。"],["重建全部影片","不合理。"]])
 ]
},
{
 id:'sd14-s08',order:8,title:'Playback Flow：Manifest、Segments、ABR 與 Startup Latency',duration:'38–54 分鐘',summary:'從點擊 Play 到第一個 frame，拆 manifest、auth、edge lookup、segment download、buffer 與 quality switch。',
 research:[{label:'ByteByteGo — Video streaming flow',url:'https://bytebytego.com/courses/system-design-interview/design-youtube'}],
 pages:[
  {id:'sd14-s08-p01',title:'Startup Path 要短',blocks:[
   {type:'stepper',steps:[['Get metadata','visibility + manifest URL'],['Fetch manifest','renditions'],['Choose initial bitrate','保守起播'],['Fetch first segment','prefer nearby edge'],['Decode','first frame'],['Adapt','subsequent segments']]}
  ]},
  {id:'sd14-s08-p02',title:'第一段不一定選最高畫質',blocks:[
   {type:'p',text:'為縮短 startup time，player 常保守選一個可快速取得的 rendition；累積 throughput/buffer evidence 後再升。'}
  ]},
  {id:'sd14-s08-p03',title:'Client Buffer 是重要 State',blocks:[
   {type:'bullets',items:['buffer seconds 過低 → 降 bitrate','buffer 健康 → 可嘗試升 bitrate','seek → 新 range/segments','playback speed 改變 consumption rate']}
  ]}],
 quiz:[
  MC('sd14-s08-q1','播放第一步為何不是直接拉 1GB 檔？','sd14-s08-p01','Streaming 以 manifest + segments 支援快速起播與 adaptive quality。','分段下載可快速開始播放。',[["因為 HTTP 不能傳大檔","可以。"],["因為 object storage 不能讀","可以。"],["只為縮短 URL","不是。"]]),
  MC('sd14-s08-q2','Initial bitrate 為何常保守？','sd14-s08-p02','先減少 startup/rebuffer 風險，再根據實測升畫質。','Startup latency 優先。',[["因為高畫質永久禁止","不是。"],["因為 CDN 沒高畫質","不一定。"],["因為 metadata 只支援 360p","不是。"]]),
  MC('sd14-s08-q3','ABR 為何看 buffer seconds？','sd14-s08-p03','Buffer 是抵抗網路抖動的安全墊。','決定能否承受更高 bitrate。',[["只為算 storage","不是。"],["因為 buffer 是 DB cache","不是。"],["因為 throughput 不重要","兩者都重要。"]]),
  MC('sd14-s08-q4','Seek 到影片尾端時典型行為？','sd14-s08-p03','請求新的 segments/range，不需下載前面全部內容。','Random access 到目標 segments。',[["必須從第 0 byte 重播","不必要。"],["重新 transcoding","不需要。"],["重新 upload","無關。"]])
 ]
},
{
 id:'sd14-s09',order:9,title:'Failure Recovery：Retry、Checkpoint、DLQ 與 Partial Success',duration:'40–56 分鐘',summary:'處理 upload 中斷、worker crash、部分 rendition 失敗、queue redelivery、CDN/origin outage 與 publish race。',
 research:[{label:'YouTube Data API — Resumable upload recovery',url:'https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol'}],
 pages:[
  {id:'sd14-s09-p01',title:'每一階段都要定義 Durable Boundary',blocks:[
   {type:'compare',items:[['Upload','range/checksum state durable。'],['Transcode','job state + deterministic output。'],['Publish','metadata READY transaction durable。'],['Playback','CDN edge 可從 replicated origin 恢復。']]}
  ]},
  {id:'sd14-s09-p02',title:'Partial Rendition Failure',blocks:[
   {type:'p',text:'1080p encode 失敗但 360/720p 成功，產品可以選擇先 READY 低畫質再補高畫質，或要求 minimum rendition set 完整後才 READY。'},
   {type:'callout',title:'這是產品 Requirement',text:'不要把「所有 rendition 都要成功」當成天然真理。'}
  ]},
  {id:'sd14-s09-p03',title:'Retry 要避免 Failure Amplification',blocks:[
   {type:'bullets',items:['exponential backoff + jitter','retry budget','per-stage circuit breaker','DLQ/manual inspection','poison file detection','worker lease/visibility timeout']}
  ]}],
 quiz:[
  MC('sd14-s09-q1','為何每 stage 要有 durable boundary？','sd14-s09-p01','Crash 後能知道從哪裡安全重做。','支援 recovery 與 exactly-once-like side effects。',[["讓所有 worker 無 state","不是。"],["取消 retry","相反。"],["只為 logging","不只。"]]),
  MC('sd14-s09-q2','1080p 失敗是否一定阻擋 READY？','sd14-s09-p02','取決於 minimum playable set / product requirement。','可以定義 degraded publish。',[["一定阻擋","不一定。"],["一定忽略","也不一定。"],["只看 thumbnail","不足。"]]),
  MC('sd14-s09-q3','Worker 失敗後所有 job 立即無限重試，風險？','sd14-s09-p03','Retry storm 放大依賴故障與成本。','Backoff/jitter/budget。',[["會自動修復 root cause","不會。"],["一定降低 backlog","不一定。"],["不影響下游","錯。"]]),
  MC('sd14-s09-q4','Poison video 指什麼？','sd14-s09-p03','某輸入每次都 deterministic 觸發 transcoder crash/failure。','需要隔離/DLQ，不應無限重試。',[["熱門影片","不是。"],["被 cache 的影片","不是。"],["只有 metadata 缺 title","不一定。"]])
 ]
},
{
 id:'sd14-s10',order:10,title:'Cost Engineering：Storage、Transcoding、CDN Egress',duration:'40–56 分鐘',summary:'影片平台要用架構控制成本：cold rendition、codec ROI、transcode priority、cache hit、lifecycle 與 regional egress。',
 research:[{label:'ByteByteGo — YouTube cost considerations',url:'https://bytebytego.com/courses/system-design-interview/design-youtube'}],
 pages:[
  {id:'sd14-s10-p01',title:'不是所有影片都值得產生所有 Rendition',blocks:[
   {type:'p',text:'長尾影片可能幾乎沒人看；可先產生基本格式，熱門度上升再補昂貴 codec/4K rendition，降低 wasted compute/storage。'}
  ]},
  {id:'sd14-s10-p02',title:'Codec 有 Compute vs Egress Trade-off',blocks:[
   {type:'compare',items:[['更高壓縮 codec','transcode CPU/GPU 更貴，但每次播放 bytes 更少。'],['舊 codec','encode 便宜、device support 廣，但 egress 可能更高。']]}
  ]},
  {id:'sd14-s10-p03',title:'Hot/Cold Tier',blocks:[
   {type:'bullets',items:['hot renditions CDN/fast storage','cold source archive','rare 4K can rehydrate/on-demand','lifecycle by retention/legal requirements','thumbnail/manifest small but very hot']}
  ]}],
 quiz:[
  MC('sd14-s10-q1','為何長尾影片不一定先做所有 codec？','sd14-s10-p01','可能花很多 compute/storage 但從沒被看。','可依 popularity lazy/eager transcoding。',[["因為長尾影片不能播放","可播放基本版本。"],["因為 codec 只給熱門影片法律允許","不是。"],["只為減 metadata","不是。"]]),
  MC('sd14-s10-q2','更高壓縮 codec 的典型 trade-off？','sd14-s10-p02','Encode 更貴，但 playback egress 可下降。','Compute cost vs bandwidth cost。',[["兩者都必然下降","不一定。"],["只影響 title","不是。"],["不影響 device compatibility","也可能影響。"]]),
  MC('sd14-s10-q3','Hot rendition 最適合？','sd14-s10-p03','放 CDN/fast tier，提高 hit與低 latency。','Hot tier / edge cache。',[["只放離線磁帶","太慢。"],["每次重新 encode","浪費。"],["只存 metadata","缺 bytes。"]]),
  MC('sd14-s10-q4','成本優化最不成熟做法？','sd14-s10-p03','不看 access pattern 就一律刪 source/rendition。','應以 popularity、retention、recovery requirement 驅動 lifecycle。',[["觀察 egress per rendition","合理。"],["量測 transcode minutes","合理。"],["追 CDN hit ratio","合理。"]])
 ]
},
{
 id:'sd14-s11',order:11,title:'Security、Copyright、Moderation 與 Access Control',duration:'38–54 分鐘',summary:'Upload pipeline 同時是 untrusted content ingestion；處理 malware、copyright、privacy、signed URL、takedown 與 sensitive metadata。',
 research:[{label:'ByteByteGo — Video takedowns / encryption',url:'https://bytebytego.com/courses/system-design-interview/design-youtube'}],
 pages:[
  {id:'sd14-s11-p01',title:'Upload 端把 File 當 Untrusted Input',blocks:[
   {type:'bullets',items:['MIME/container validation','resource limits / decompression bomb','malware scanning','copyright fingerprint','adult/illegal content moderation','metadata sanitization']}
  ]},
  {id:'sd14-s11-p02',title:'Private/Unlisted Video 不能只靠難猜 URL',blocks:[
   {type:'p',text:'Playback request 要經 authorization，CDN 可使用短效 signed URL/cookie/token；source object 不公開 bucket。'}
  ]},
  {id:'sd14-s11-p03',title:'Takedown 要能快速 Stop Serving',blocks:[
   {type:'stepper',steps:[['Policy decision','video blocked'],['Metadata','visibility=blocked'],['CDN','purge/invalidate token'],['Search/feed','remove discovery'],['Audit','retain evidence per policy']]}
  ]}],
 quiz:[
  MC('sd14-s11-q1','為何 upload worker 要 resource limits？','sd14-s11-p01','惡意/損壞媒體可能耗盡 CPU/RAM/disk。','Untrusted content sandbox/quota。',[["只因影片太熱門","不是。"],["只為縮短 title","無關。"],["因為 CDN 要求","不是核心。"]]),
  MC('sd14-s11-q2','Unlisted URL 很長是否等於 authorization？','sd14-s11-p02','不是；URL secrecy 不能取代 access control。','Private content 要真正 auth/signed access。',[["等於強 ACL","錯。"],["CDN 不支援 token","可支援多種 access pattern。"],["只需 robots.txt","無法保護 private bytes。"]]),
  MC('sd14-s11-q3','Takedown 後只改 DB flag 可能還看到影片，為何？','sd14-s11-p03','CDN edge 仍可能持有 cached segments。','需要 purge/invalidate/short auth TTL。',[["DB 一定沒寫成功","不一定。"],["因為 transcoding 自動恢復","不是。"],["因為 title cache only","不是唯一。"]]),
  MC('sd14-s11-q4','Copyright fingerprint 最適合放哪？','sd14-s11-p01','Upload/processing pipeline 非同步檢查。','Ingest pipeline 與 publish policy 整合。',[["每個 viewer 播放時重新掃整支","太貴。"],["只放 client","可被繞過。"],["只放 DNS","無關。"]])
 ]
},
{
 id:'sd14-s12',order:12,title:'Multi-Region、Observability 與 Live Streaming 邊界',duration:'42–58 分鐘',summary:'完成全球 upload/playback routing、replicated metadata、CDN、transcode locality、DR 與 QoE telemetry；最後區分 VOD 與 Live。',
 research:[{label:'ByteByteGo — YouTube wrap-up / live streaming',url:'https://bytebytego.com/courses/system-design-interview/design-youtube'}],
 pages:[
  {id:'sd14-s12-p01',title:'Region 不是每個 Component 都 Active-Active',blocks:[
   {type:'bullets',items:['Playback CDN 全球 edge。','Upload 可就近 ingress，再跨 region durable replicate。','Metadata 可 home-region + replica 或 globally distributed DB。','Transcode jobs 優先靠近 source/storage/GPU pool。']}
  ]},
  {id:'sd14-s12-p02',title:'QoE Metrics 比 CPU 更接近產品',blocks:[
   {type:'compare',items:[['Upload','success/resume rate、time-to-upload。'],['Processing','queue age、transcode time、failure by codec。'],['Playback','startup、rebuffer、quality switches、CDN hit、video start failure。'],['Cost','egress/video-minute、transcode-minute、storage/video。']]}
  ]},
  {id:'sd14-s12-p03',title:'Live Streaming 為何是另一題',blocks:[
   {type:'p',text:'Live 也有 ingest/encode/CDN，但不能等待完整檔案、latency 更敏感、segment 很短、producer 還在持續產生內容，故 recovery/ordering 與 delay trade-off 不同。'}
  ]},
  {id:'sd14-s12-p04',title:'完整 YouTube Interview Checklist',blocks:[
   {type:'code',text:'□ scope + video bytes estimate\n□ direct/resumable upload\n□ metadata + state machine\n□ transcode DAG + renditions\n□ object storage + CDN\n□ manifest/ABR playback\n□ retry/idempotency/DLQ\n□ cost + security/takedown\n□ multi-region + QoE metrics'}
  ]}],
 quiz:[
  MC('sd14-s12-q1','為什麼 transcoding worker 不一定全球 active-active 同一 job？','sd14-s12-p01','需要避免重複昂貴工作，通常有 job ownership/lease。','可多 region capacity，但單 job 要有明確 ownership/idempotency。',[["因為 GPU 不能跨 region","不是。"],["因為 queue 不能 replicate","可以。"],["因為影片只能一個 region 看","錯。"]]),
  MC('sd14-s12-q2','Playback 最重要 observability 之一？','sd14-s12-p02','startup/rebuffer 直接反映 viewer QoE。','Startup latency / rebuffer ratio。',[["只看 API CPU","不足。"],["只看 title update rate","不是。"],["只看 repository commits","無關。"]]),
  MC('sd14-s12-q3','Live 與 VOD 最大流程差異之一？','sd14-s12-p03','內容仍在生成，無法先完成全檔 transcoding再 publish。','低 latency continuous ingest/encode/delivery。',[["Live 不需要 CDN","仍常需要。"],["Live 不需要 encode","仍需要。"],["VOD 一定比 live 更即時","相反。"]]),
  MC('sd14-s12-q4','完整 YouTube 題最核心 cost drivers？','sd14-s12-p04','Storage、transcode compute、CDN/egress。','Media bytes 與 processing cost。',[["只有 metadata DB connections","太局部。"],["只有 login QPS","不是。"],["只有 DNS lookup","不是。"]])
 ]
}
);
})();