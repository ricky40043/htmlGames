(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_14;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const F=(id,difficulty,question,page,explanation,correct,wrong)=>({id,difficulty,question,reviewPageId:page,explanation,options:[O(id+'-c',correct,true),...wrong.map((x,i)=>O(id+'-w'+(i+1),x[0],false,x[1]))]});
chapter.finalExam.push(
F('sd14-ex-e01','easy','YouTube 題兩條核心 flow？','sd14-s01-p01','Upload 與 Playback。','Upload 與 Playback。',[["Login 與 CSS","不是核心。"],["DNS 與 SMTP","無關。"],["只做 comments","scope 太窄。"]]),
F('sd14-ex-e02','easy','影片 bytes 應主要存哪？','sd14-s02-p02','大型 binary 適合 object storage。','Object Storage。',[["只放 metadata DB BLOB","大規模不理想。"],["只放 API memory","不 durable。"],["只放 CDN 無 origin","不可靠。"]]),
F('sd14-ex-e03','easy','Resumable upload 解什麼？','sd14-s03-p01','大檔斷線後從成功 offset 繼續。','避免從頭重傳。',[["取代 transcoding","無關。"],["讓影片壓縮","不是。"],["取消 checksum","相反。"]]),
F('sd14-ex-e04','easy','Upload 完成是否等於 READY？','sd14-s04-p01','還可能需 processing/moderation。','不一定。',[["一定等於 READY","錯。"],["永遠不能 READY","錯。"],["只看 title 就知道","不足。"]]),
F('sd14-ex-e05','easy','Transcoding queue 主要價值？','sd14-s05-p02','Upload 與 CPU/GPU-heavy processing 解耦。','Buffer + independent worker scaling。',[["取代 CDN","不是。"],["讓 encode 0ms","不會。"],["消除 storage","不是。"]]),
F('sd14-ex-e06','easy','Manifest 用途？','sd14-s06-p02','描述 renditions/segments 給 player。','Adaptive streaming playlist。',[["保存密碼","無關。"],["取代 source bytes","不是。"],["只做 comments","不是。"]]),
F('sd14-ex-e07','easy','CDN 最直接降低什麼？','sd14-s07-p01','Origin egress 與 playback latency。','讓 edge 提供熱門 segments。',[["Transcoding CPU","不直接。"],["Upload file size","不直接。"],["Metadata schema complexity","不是。"]]),
F('sd14-ex-e08','easy','ABR 在網速變差時通常？','sd14-s06-p03','降低 bitrate 避免 rebuffer。','切較低 bitrate rendition。',[["切最高 bitrate","更可能卡。"],["重新 upload","無關。"],["清 metadata DB","不需要。"]]),
F('sd14-ex-e09','easy','Poison video 應？','sd14-s09-p03','有限 retry 後 DLQ/隔離。','隔離並診斷，避免無限重試。',[["無限重跑","浪費資源。"],["直接標 READY","危險。"],["刪所有 queue","不合理。"]]),
F('sd14-ex-e10','easy','Private video 只靠難猜 URL 是否足夠？','sd14-s11-p02','不夠，需要 authorization/signed access。','不夠。',[["足夠，URL 長就安全","錯。"],["只要 robots.txt","不能保護 bytes。"],["只要 CDN cache","不是 auth。"]]),

F('sd14-ex-m01','medium','1GB upload 到 99% 斷線，成熟做法？','sd14-s03-p02','查 session offset 再 resume。','用 resumable session 從成功 range 繼續。',[["從 0 重傳","浪費。"],["直接標成功","可能缺 bytes。"],["只重送 metadata","不夠。"]]),
F('sd14-ex-m02','medium','API server CPU 很低但 network 被 upload bytes 打滿，怎麼改？','sd14-s02-p01','大檔 direct-to-storage。','讓 API 建 session/signed URL，client 直傳 object storage。',[["加更多 JSON cache","無關。"],["只加 DB index","不解 network。"],["把影片轉成 base64 經 API","更糟。"]]),
F('sd14-ex-m03','medium','Transcode complete event 重送兩次，怎麼避免重複發布？','sd14-s04-p03','Completion handler idempotent。','以 video_id + pipeline_version 去重。',[["每次生成新 video_id","更糟。"],["關掉 retry","會丟暫時失敗。"],["相信 queue exactly once","不能假設。"]]),
F('sd14-ex-m04','medium','720p 成功、1080p 失敗，是否可 READY？','sd14-s09-p02','由 minimum playable set 定義。','依產品 policy 決定 degraded publish。',[["一定不行","不一定。"],["一定可以","也不一定。"],["只看 thumbnail","不足。"]]),
F('sd14-ex-m05','medium','熱門影片 edge hit 95%，主要收益？','sd14-s07-p02','大部分 bytes 不回 origin。','降低 origin egress與 latency。',[["Metadata DB 不需備份","無關。"],["Transcoding 不需要","仍需要。"],["Upload 自動加速","不是主要。"]]),
F('sd14-ex-m06','medium','Player buffer 剩 1 秒且最近 throughput 降，應？','sd14-s08-p03','降 bitrate。','優先避免 rebuffer。',[["升到 4K","更危險。"],["停止下載","更糟。"],["重新 encode source","無關。"]]),
F('sd14-ex-m07','medium','長尾影片幾乎沒播放，4K encode 很貴，怎麼優化？','sd14-s10-p01','Lazy/on-demand high-cost renditions。','先基本版本，熱門後再補。',[["所有影片都先 8 種 codec","浪費。"],["刪 source immediately","可能失去恢復能力。"],["把 title 縮短","無關。"]]),
F('sd14-ex-m08','medium','Takedown 改 DB 為 blocked 後 edge 仍播放，漏了什麼？','sd14-s11-p03','CDN cached segments仍存在。','Purge/invalidate/short-lived auth token。',[["再改一次 title","無效。"],["重跑 transcoding","不需要。"],["增加 cache TTL","更糟。"]]),
F('sd14-ex-m09','medium','Transcode backlog age 持續升，先看？','sd14-s05-p02','Arrival vs worker service rate / failures。','Queue age、worker capacity、codec failure、downstream storage。',[["只看 viewer comments","無關。"],["只加 API servers","不解 worker bottleneck。"],["刪 metrics","相反。"]]),
F('sd14-ex-m10','medium','Startup time 高但 rebuffer 低，可能優先優化？','sd14-s08-p01','Manifest/auth/first-segment path。','縮短 first-byte/first-segment path，初始 bitrate 保守。',[["先提高最高 bitrate","不一定。"],["只增加 storage retention","無關。"],["刪掉 CDN","更差。"]]),

F('sd14-ex-h01','hard','Upload API 先回成功再 async 寫 object storage，server crash 後影片消失，root cause？','sd14-s03-p01','Ack 在 durable boundary 前。','只有 bytes/session durable 後才能回可靠 upload success。',[["WebSocket 問題","不是。"],["CDN TTL 太短","不是。"],["Title 太長","無關。"]]),
F('sd14-ex-h02','hard','同一 transcode job 在兩 region 同時跑且輸出 key 隨機，最可能？','sd14-s05-p03','重複昂貴 compute 與互相競爭 outputs。','需要 job lease/ownership + deterministic idempotent output。',[["一定更快且無代價","錯。"],["只影響 metadata UI","也影響 cost/correctness。"],["CDN 會自動去重所有檔","不能依賴。"]]),
F('sd14-ex-h03','hard','Signed CDN URL 把每次隨機 token 納入 cache key，會怎樣？','sd14-s07-p02','同 segment 被拆成大量 variants。','Cache fragmentation，hit ratio 下降。',[["提高 hit ratio","相反。"],["提升 transcoding quality","無關。"],["保證 private auth 更強","不一定。"]]),
F('sd14-ex-h04','hard','Codec A encode 貴 3 倍但 egress 少 35%，要不要用？','sd14-s10-p02','需看 watch volume/device support/compute vs egress economics。','做 ROI，不能只看 encode cost 或壓縮率。',[["一定用 A","不一定。"],["一定不用 A","也不一定。"],["只看 title clicks","不足。"]]),
F('sd14-ex-h05','hard','CDN outage 時所有 clients 直接 retry origin，最大風險？','sd14-s07-p03','Failover traffic storm 打垮 origin。','需要 origin capacity/bulkhead/retry jitter/alternate CDN 或 stale strategy。',[["Origin 一定自動無限 scale","不能假設。"],["只提高 client retry rate","更糟。"],["關閉 object storage replication","更差。"]]),
F('sd14-ex-h06','hard','1080p manifest 已發布，但一半 segments 尚未複製到 origin，問題？','sd14-s04-p02','Publish boundary不完整，viewer拿到不可滿足 manifest。','只有 required outputs durable/available後才能 publish version。',[["只影響 thumbnail","不是。"],["Player 會自己創造 segment","不會。"],["CDN 可以永久修補缺檔","沒有 source 就不行。"]]),
F('sd14-ex-h07','hard','影片服務 P99 playback 正常但 egress cost 暴增，應看？','sd14-s10-p03','QoE 正常不代表成本健康。','CDN hit ratio、rendition bitrate mix、regional origin egress、cache fragmentation。',[["只看 API CPU","不足。"],["只看 upload count","未必。"],["把所有 cache 關掉","通常更貴。"]]),
F('sd14-ex-h08','hard','Region A metadata READY 但 Region B object replication 尚未到，global routing 可能？','sd14-s12-p01','Viewer 被送 B 後拿不到 segments。','Publish/routing 要考慮 data readiness per region 或 fallback origin。',[["Metadata READY 等於全球 bytes ready","錯。"],["只需更長 DNS TTL","不解 data availability。"],["把 client 固定 B","更差。"]]),
F('sd14-ex-h09','hard','Live streaming 為何不能完全照 VOD pipeline？','sd14-s12-p03','內容持續產生、低 latency，不能等整檔完成。','需要 continuous ingest/encode/segment publish與不同 error budget。',[["Live 不需 encode","錯。"],["Live 不需 CDN","常需要。"],["Live 一定能重試幾小時","不符合 latency。"]]),
F('sd14-ex-h10','hard','完整 YouTube 設計最高價值的 trade-off 組合？','sd14-s12-p04','Upload reliability、processing compute、playback QoE、CDN/egress cost。','Durable resumable ingest + async transcode + adaptive CDN playback + cost/failure controls。',[["只選 SQL/NoSQL","太局部。"],["只談 CDN","漏 upload/processing。"],["只談 codec 名稱","沒有系統推導。"]])
);
})();