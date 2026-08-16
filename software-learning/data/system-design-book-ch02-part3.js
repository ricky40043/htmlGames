(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_02;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const Q=(id,difficulty,question,reviewPageId,explanation,options)=>({id,difficulty,question,reviewPageId,explanation,options});
chapter.sections.push(
{
 id:'sd2-s07',order:7,title:'Bandwidth / Egress：QPS 不高，也可能先卡網路',duration:'26–36 分鐘',summary:'把 payload size 與 QPS 相乘，估 ingress/egress、MB/s、Mbps，理解 media serving、CDN 與壓縮為什麼會直接改變成本與瓶頸。',
 research:[
  {label:'ByteByteGo — Back-of-the-envelope Estimation',url:'https://bytebytego.com/courses/system-design-interview/back-of-the-envelope-estimation'},
  {label:'Google SRE — Service Level Objectives / throughput',url:'https://sre.google/sre-book/service-level-objectives/'}
 ],
 pages:[
  {id:'sd2-s07-p01',title:'Bandwidth Formula：RPS × Average Payload',blocks:[
   {type:'lead',text:'CPU 不是唯一容量。若 API 每秒只 2,000 requests，但每個 response 平均 1MB，理論 egress 已約 2GB/s；這可能比 application CPU 更早成為瓶頸。'},
   {type:'code',text:'# 例：peak 6,000 RPS，平均 response 20KB\nbytes_per_sec = 6_000 * 20_000 = 120_000_000 B/s\n≈ 120 MB/s\n≈ 960 Mb/s  # 乘 8 轉 bits/s'},
   {type:'callout',title:'bit / byte 再次出現',text:'網路常寫 Mbps/Gbps（bit/s），payload 常寫 KB/MB（byte）。120 MB/s 約等於 960 Mb/s，不是 120 Mbps。'}
  ]},
  {id:'sd2-s07-p02',title:'Ingress 與 Egress 要分開',blocks:[
   {type:'compare',items:[['Ingress','Client 上傳到服務：圖片上傳、log ingestion、IoT telemetry。'],['Egress','服務送給 Client：Feed、video、image、download；雲端成本常特別關注 outbound egress。']]},
   {type:'p',text:'同一產品可能 write QPS 很低，但一筆內容被讀 1,000 次，egress 會遠大於 ingress。尤其圖片/影片產品，serving path 的 bandwidth 與 CDN cache hit 往往比 metadata DB 更關鍵。'}
  ]},
  {id:'sd2-s07-p03',title:'CDN、Compression、Pagination 都會改變 Bandwidth',blocks:[
   {type:'stepper',steps:[['CDN','Edge hit 會把大量 bytes 從 Origin egress 移到 CDN edge。'],['Compression','JSON/text 壓縮可能降低 response bytes；media 則取決於 codec/format。'],['Pagination','避免一次回傳數萬筆資料，降低 bytes/request 與 latency。'],['Thumbnail','列表頁用縮圖而不是原圖，可直接降低每次 response 的媒體流量。'],['Cacheability','同樣 QPS，cacheable content 與 personalized content 的 origin bandwidth 完全不同。']]}
  ]}],
 quiz:[
  {id:'sd2-s07-q1',question:'6,000 RPS、平均 response 20KB，egress 約多少 MB/s？',reviewPageId:'sd2-s07-p01',explanation:'6,000×20KB≈120,000KB/s≈120MB/s。',options:[O('a','約 120 MB/s',true),O('b','約 12 KB/s',false,'少了多個數量級。'),O('c','約 6 MB/s',false,'沒有乘完整 payload。'),O('d','一定 0 MB/s',false,'有 response payload 就有 egress。')]},
  {id:'sd2-s07-q2',question:'120 MB/s 約等於多少 Mbps？',reviewPageId:'sd2-s07-p01',explanation:'byte→bit 乘 8，因此約 960 Mb/s。',options:[O('a','約 960 Mbps',true),O('b','120 Mbps',false,'忘了 1 byte=8 bits。'),O('c','15 Mbps',false,'你反向除以 8。'),O('d','960 MBps',false,'題目問的是 Mbps。')]},
  {id:'sd2-s07-q3',question:'圖片平台讀遠多於寫，最可能哪一側 bandwidth 更大？',reviewPageId:'sd2-s07-p02',explanation:'同一圖片可能被大量下載，通常 egress 遠高於 upload ingress。',options:[O('a','Egress',true),O('b','Ingress 一定更大',false,'讀多寫少時通常相反。'),O('c','兩者永遠相等',false,'取決於讀寫比例與 payload。'),O('d','Bandwidth 與圖片無關',false,'media payload 直接影響 bandwidth。')]},
  {id:'sd2-s07-q4',question:'哪個改動最直接降低列表頁 Origin bandwidth？',reviewPageId:'sd2-s07-p03',explanation:'CDN hit、thumbnail、pagination/compression 都可減少 Origin bytes；若只能選一個，讓熱門靜態圖片在 CDN edge 命中最直接移走 Origin 流量。',options:[O('a','讓熱門圖片由 CDN Edge 命中',true),O('b','把 DB column 改名字',false,'不會直接移走圖片 bytes。'),O('c','把 Peak multiplier 設成 1',false,'改假設不會改真實流量。'),O('d','關掉 Cache-Control',false,'反而可能降低 cacheability。')]}
 ]
},
{
 id:'sd2-s08',order:8,title:'Cache / Memory Estimation：不是「放 Redis」就結束',duration:'28–40 分鐘',summary:'估 working set、hot data、cache hit rate、object overhead 與 cold-start headroom，知道 Cache 容量要從 access pattern 推導。',
 research:[
  {label:'ByteByteGo — Back-of-the-envelope Estimation',url:'https://bytebytego.com/courses/system-design-interview/back-of-the-envelope-estimation'},
  {label:'AWS Builders’ Library — Caching challenges and risks',url:'https://aws.amazon.com/builders-library/caching-challenges-and-strategies/'}
 ],
 pages:[
  {id:'sd2-s08-p01',title:'Cache Size 應該估 Working Set，不是整個 Database',blocks:[
   {type:'lead',text:'如果 DB 有 20TB，不代表 Redis 也要 20TB。真正要問的是「在 TTL/時間窗口內，哪些資料會被反覆讀？」也就是 hot working set。'},
   {type:'code',text:'# 例：每天 5M active users\n# 每個 user profile cache entry 平均 2KB\n# 若只快取 20% 最活躍 users：\n1_000_000 * 2KB ≈ 2GB raw payload\n\n# 真實 Redis/memory 還有 key/object/allocator/replication overhead。'},
   {type:'callout',title:'Hit Rate 是容量結果，也是 Access Pattern 結果',text:'Cache 加倍不一定讓 hit rate 加倍。若 workload 幾乎都是一次性掃描，cache 很大也不會有高 hit rate。'}
  ]},
  {id:'sd2-s08-p02',title:'Cache Capacity 要加 Overhead、Replication 與 Eviction 空間',blocks:[
   {type:'stepper',steps:[['Value Size','先估 payload。'],['Key + Object Overhead','資料結構、pointer、allocator 都會吃 RAM。'],['Replication','高可用 Cache 可能有 replica。'],['Eviction Headroom','不要把 memory 用到 100% 才開始處理。'],['Growth / Hot Shift','熱門 key 集合可能隨活動或時間改變。']]},
   {type:'p',text:'粗估可先用 payload×1.2、×1.5 等 safety factor 做 sensitivity analysis，但不要把某個 overhead factor 當固定真理；實際應用需要用真實 key/value 與 allocator profile 測量。'}
  ]},
  {id:'sd2-s08-p03',title:'Cold Cache 是容量測試一定要考慮的 Failure Mode',blocks:[
   {type:'p',text:'Cache fleet 重啟、failover、mass expiry 後，hit rate 可能瞬間下降，大量 request 回源 DB。若 downstream 只因平常有 95% hit rate 才能存活，Cold Start 就可能把 DB 打爆。'},
   {type:'diagram',nodes:[['Normal','95% cache hit'],['Cache Failure','hit rate → low'],['Origin','traffic suddenly × many'],['DB Saturation','latency/errors'],['Retry','可能再放大']],caption:'容量規劃要問：Cache 不在時，Origin 能扛多少？是否要 request coalescing、rate limit、warm-up、stale serve？'},
   {type:'callout',title:'估算的用途',text:'如果 100k QPS 中 95% 平常被 Cache 吸收，DB 只看到 5k QPS；Cache 掛掉時可能突然看到接近 100k QPS。這個差距比「Redis 要幾 GB」更重要。'}
  ]}],
 quiz:[
  {id:'sd2-s08-q1',question:'DB 20TB，是否代表 Cache 也必須 20TB？',reviewPageId:'sd2-s08-p01',explanation:'不一定；Cache 通常針對 hot working set，容量取決於 access pattern、TTL 與命中目標。',options:[O('a','不一定，應估 Hot Working Set',true),O('b','一定完全相同',false,'把 durable dataset 與 hot cache dataset 混為一談。'),O('c','Cache 一定比 DB 大 100 倍',false,'沒有這種規則。'),O('d','Cache 不需要 RAM',false,'in-memory cache 正需要 RAM 容量規劃。')]},
  {id:'sd2-s08-q2',question:'估 Redis payload 2GB 後，為什麼實際 RAM 通常要留更多？',reviewPageId:'sd2-s08-p02',explanation:'還有 key/object/allocator overhead、replication、eviction 與 growth headroom。',options:[O('a','有資料結構與 HA/Headroom overhead',true),O('b','因為 1 byte=100 bits',false,'1 byte=8 bits。'),O('c','因為 HTTP 一定複製 100 份',false,'沒有這種普遍規則。'),O('d','只是 UI 看起來比較大',false,'這是實際記憶體消耗。')]},
  {id:'sd2-s08-q3',question:'平常 DB 只承受 5k QPS，Cache 掛掉後突然 100k QPS，這說明容量測試漏了什麼？',reviewPageId:'sd2-s08-p03',explanation:'漏測 cold-cache / cache-failure 回源情境；downstream capacity 不能只看 steady-state hit rate。',options:[O('a','Cold Cache / Cache Failure Scenario',true),O('b','字型載入',false,'不會解釋 DB 回源暴增。'),O('c','Binary Search',false,'不是這個架構 failure mode。'),O('d','DNS 名稱長度',false,'與 cache miss amplification 無關。')]},
  {id:'sd2-s08-q4',question:'哪種 workload 即使 Cache 很大，hit rate 仍可能很低？',reviewPageId:'sd2-s08-p01',explanation:'幾乎不重複的一次性掃描沒有 temporal/locality，可快取價值低。',options:[O('a','大量一次性、不重複 key 的掃描',true),O('b','同一熱門 key 被重複讀',false,'這通常很適合 cache。'),O('c','熱門首頁資料每秒重複讀',false,'也通常有高 cacheability。'),O('d','固定少量 reference data',false,'通常很適合 cache。')]}
 ]
},
{
 id:'sd2-s09',order:9,title:'完整估算案例：把數字轉成架構決策',duration:'42–58 分鐘',summary:'用一個社群內容產品從 DAU 開始，完整推 read/write QPS、peak、concurrency、storage、bandwidth 與 availability，再判斷哪些架構元件真的有理由。',
 research:[
  {label:'ByteByteGo — Back-of-the-envelope Estimation',url:'https://bytebytego.com/courses/system-design-interview/back-of-the-envelope-estimation'},
  {label:'ByteByteGo — Framework / use estimation to validate high-level design',url:'https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews'},
  {label:'Google SRE — Service Level Objectives',url:'https://sre.google/sre-book/service-level-objectives/'}
 ],
 pages:[
  {id:'sd2-s09-p01',title:'案例假設：5M DAU 的內容平台',blocks:[
   {type:'lead',text:'題目：設計一個圖片型內容平台。先不急著畫 Redis、Kafka、Sharding，先用一組可討論的假設把規模具體化。'},
   {type:'bullets',items:['DAU：5,000,000。','每人每天讀 Feed/內容 20 次 → 100M reads/day。','每人每天平均產生 2 次 write → 10M writes/day。','讀 response 平均 20KB metadata/thumbnail refs。','每筆 write metadata 平均 1KB。','30% writes 帶一張平均 200KB 圖片。','假設 Peak = Average × 5。','API latency 粗估 200ms；章末再討論 percentile 與 headroom。']},
   {type:'callout',title:'這些是假設，不是真理',text:'面試時要說出來，讓 interviewer 可以改。估算的價值是讓雙方對 scale 有共同模型，不是猜中真實公司的內部數字。'}
  ]},
  {id:'sd2-s09-p02',title:'一步一步算：QPS、Concurrency、Storage、Bandwidth',blocks:[
   {type:'code',text:'READ\n100M/day ÷ 86,400 ≈ 1,157 avg read QPS\npeak ×5 ≈ 5,787 read QPS\n\nWRITE\n10M/day ÷ 86,400 ≈ 116 avg write QPS\npeak ×5 ≈ 580 write QPS\n\nCONCURRENCY（以 read peak + 200ms 粗估）\n5,787 × 0.2 ≈ 1,157 in-flight reads\n\nMETADATA STORAGE\n10M × 1KB ≈ 10GB/day ≈ 3.65TB/year raw\n\nIMAGE STORAGE\n3M images/day × 200KB ≈ 600GB/day ≈ 219TB/year raw\n\nREAD EGRESS（peak metadata only）\n5,787 × 20KB ≈ 116MB/s ≈ 926Mbps'},
   {type:'p',text:'數字最大的訊號不是 metadata DB，而是 image storage/serving。即使 write QPS 只有幾百，media storage 已是百 TB/年量級，而且圖片可能被多次讀取，因此 Object Storage + CDN 的優先級可能比「先 Shard metadata DB」更高。'}
  ]},
  {id:'sd2-s09-p03',title:'估算的終點不是數字，而是「所以我怎麼設計」',blocks:[
   {type:'stepper',steps:[['5–6k Peak Reads','單一現代服務可能撐得住，但仍需壓測；可先用 LB + 多個 stateless app nodes 取得 HA/headroom。'],['~580 Peak Writes','不代表立刻要 Sharding；先看 DB transaction/index/query 與 growth。'],['219TB/year Images','Object Storage、lifecycle、CDN、image processing 變成核心。'],['~1Gbps Metadata Egress','若實際 response 更大，network/CDN 很快成為重要成本。'],['Availability Target','若要求 99.99%，部署、依賴、failover、monitoring 都要能支持該 error budget。']]},
   {type:'callout',title:'好的估算答案會收斂',text:'你不需要算 CPU cycles、網卡封包、每個 JSON bracket。算到足以判斷「哪個元件最先值得討論」就停，然後把時間留給真正的系統設計。'}
  ]},
  {id:'sd2-s09-p04',title:'面試時的 6 分鐘估算模板',blocks:[
   {type:'stepper',steps:[['1. Clarify Scale','DAU/MAU、核心 action、retention、read/write ratio。'],['2. State Approximations','一天≈10^5 sec、1KB≈10^3B；明確說近似。'],['3. Throughput','Average QPS → Peak QPS → read/write split。'],['4. Size','bytes/object → daily growth → retention → replication/index。'],['5. Network & Concurrency','QPS×payload、RPS×latency。'],['6. Translate','指出 2–3 個真正影響 HLD 的結論，停止無意義計算。']]},
   {type:'callout',title:'面試加分句',text:'「這些都是 first-order estimates。接下來我會用 load test、production metrics 與真實 object-size distribution 校正，但這個量級已足以決定我們先討論哪些瓶頸。」'}
  ]}],
 quiz:[
  {id:'sd2-s09-q1',question:'案例中 100M reads/day 的平均 read QPS 約？',reviewPageId:'sd2-s09-p02',explanation:'100M/86,400≈1,157 QPS。',options:[O('a','約 1,157',true),O('b','約 100M',false,'每日總量不能直接當 QPS。'),O('c','約 11',false,'少了約兩個數量級。'),O('d','約 1M',false,'多了約三個數量級。')]},
  {id:'sd2-s09-q2',question:'此案例最明顯的長期 Storage 壓力來自哪裡？',reviewPageId:'sd2-s09-p02',explanation:'圖片約 600GB/day、219TB/year，遠大於 metadata 約 3.65TB/year。',options:[O('a','圖片 Blob',true),O('b','1KB metadata',false,'metadata 有成長，但量級遠小於 media。'),O('c','DNS record',false,'不是主要內容儲存。'),O('d','HTTP method',false,'不是 storage dataset。')]},
  {id:'sd2-s09-q3',question:'看到約 580 Peak Writes/s，是否足以直接證明必須 Sharding？',reviewPageId:'sd2-s09-p03',explanation:'不足以直接證明；還要看 DB 能力、query/index、transaction、growth、HA 與實測 saturation。',options:[O('a','不足以，應先驗證真正 DB bottleneck',true),O('b','一定要 100 shards',false,'這是過度設計且沒有容量證據。'),O('c','一定要移除 DB',false,'沒有必要。'),O('d','write QPS 與 DB 無關',false,'相關，但不能單靠這個數字決定 sharding。')]},
  {id:'sd2-s09-q4',question:'粗略估算做到什麼程度最合理？',reviewPageId:'sd2-s09-p04',explanation:'算到足以改變架構選擇與辨認主要瓶頸即可，之後用 benchmark/metrics 校正。',options:[O('a','足以辨認量級與設計方向就停止',true),O('b','一定算到每顆 CPU transistor',false,'不符合 back-of-the-envelope 的目的。'),O('c','完全不算任何數字',false,'會失去規模依據。'),O('d','追求所有假設零誤差',false,'早期估算本來就是近似。')]}
 ]
}
);

chapter.finalExam.push(
Q('sd2-ex-e01','easy','1 byte 等於？','sd2-s01-p01','1 byte = 8 bits。',[O('a','8 bits',true),O('b','10 bits',false,'混淆 decimal prefix。'),O('c','1024 bits',false,'混淆 KiB。'),O('d','1 bit',false,'bit 與 byte 不同。')]),
Q('sd2-ex-e02','easy','2^30 bytes 約落在哪個量級？','sd2-s01-p02','2^30 bytes = 1 GiB，約 10^9 bytes。',[O('a','GB/GiB 級',true),O('b','KB 級',false,'少了六個數量級。'),O('c','TB 級',false,'多了一個 2^10。'),O('d','bit 級',false,'題目是 bytes。')]),
Q('sd2-ex-e03','easy','哪個指標最能觀察 API 最慢的尾端體驗？','sd2-s02-p02','P95/P99 比單純 average 更能暴露 tail latency。',[O('a','P99 latency',true),O('b','平均 CPU 核心數',false,'不是 request tail。'),O('c','DB table 數量',false,'不直接描述 latency distribution。'),O('d','CSS rule 數量',false,'無關。')]),
Q('sd2-ex-e04','easy','99.99% availability 在 30 天約允許多少 downtime？','sd2-s03-p02','約 4.32 分鐘。',[O('a','約 4.3 分鐘',true),O('b','約 43 分鐘',false,'接近 99.9%。'),O('c','約 7.2 小時',false,'接近 99%。'),O('d','0 秒',false,'不是 100%。')]),
Q('sd2-ex-e05','easy','100M requests/day 平均 QPS 約？','sd2-s04-p01','約 1.16k QPS，量級約 10^3。',[O('a','約 1.2k',true),O('b','約 100M',false,'把每日量當每秒。'),O('c','約 100k',false,'少除一天秒數。'),O('d','約 1',false,'少三個數量級。')]),
Q('sd2-ex-e06','easy','Peak multiplier 的正確理解？','sd2-s05-p01','它是對流量尖峰的假設/歷史模型，需用真實 traffic 校正。',[O('a','用來把平均流量轉成尖峰估計',true),O('b','永遠固定 5 倍',false,'倍率依產品而異。'),O('c','等於 availability',false,'不同概念。'),O('d','等於 storage replication factor',false,'不同概念。')]),
Q('sd2-ex-e07','easy','Storage 最基本的成長公式？','sd2-s06-p01','單筆大小×新增筆數×retention 是核心。',[O('a','bytes/object × objects/time × retention',true),O('b','CPU×CSS',false,'與 storage growth 無關。'),O('c','QPS÷8 一定',false,'不完整。'),O('d','只看現在 disk 使用率',false,'缺少 growth。')]),
Q('sd2-ex-e08','easy','MB/s 轉 Mbps 要如何？','sd2-s07-p01','byte/s 乘 8 轉 bit/s。',[O('a','乘 8',true),O('b','除 8',false,'方向反了。'),O('c','乘 1024^3',false,'錯誤單位轉換。'),O('d','不用轉',false,'MB 與 Mb 不同。')]),
Q('sd2-ex-e09','easy','Cache capacity 最先應估哪個資料集合？','sd2-s08-p01','Hot working set，而非整個 durable dataset。',[O('a','Hot working set',true),O('b','整個 DB 必須 1:1',false,'cache 不一定保存全部。'),O('c','所有 log 永久資料',false,'不一定是 hot read set。'),O('d','DNS zone file',false,'無關。')]),
Q('sd2-ex-e10','easy','Back-of-the-envelope estimation 的主要目的？','sd2-s09-p04','建立量級直覺、驗證 HLD 是否符合規模，而非精準預測每個數字。',[O('a','判斷量級與設計方向',true),O('b','取代所有 load test',false,'落地仍需實測。'),O('c','得到財務報表級精度',false,'不是此目的。'),O('d','證明所有假設正確',false,'假設本來就需溝通與校正。')]),

Q('sd2-ex-m01','medium','Peak 8,000 RPS、平均 latency 250ms，粗估 concurrent requests 約？','sd2-s05-p02','8,000×0.25≈2,000。',[O('a','約 2,000',true),O('b','約 32,000',false,'把除法/單位弄錯。'),O('c','約 8,000',false,'忽略停留時間。'),O('d','約 250',false,'把 latency 數值直接當 concurrency。')]),
Q('sd2-ex-m02','medium','每天 20M writes、每筆 2KB，一年 raw metadata 約？','sd2-s06-p01','20M×2KB≈40GB/day；一年≈14.6TB。',[O('a','約 14.6 TB/year',true),O('b','約 14.6 GB/year',false,'少約 1000 倍。'),O('c','約 40TB/day',false,'多約 1000 倍。'),O('d','約 2KB/year',false,'忘了筆數與天數。')]),
Q('sd2-ex-m03','medium','API 平均 80ms，但 P99 2.5s，最合理的結論？','sd2-s02-p02','平均值掩蓋 tail latency，需要分析最慢 1% 的 path/queue/dependency。',[O('a','Tail latency 有問題',true),O('b','所有 request 都是 80ms',false,'P99 明確反駁。'),O('c','Latency 已不需觀測',false,'更需要。'),O('d','P99 一定是假資料',false,'沒有根據。')]),
Q('sd2-ex-m04','medium','平常 Cache hit 95%，DB 只看到 5k QPS；Cache 全失效最需要預估？','sd2-s08-p03','DB/Origin 是否能承受接近完整 request rate 的回源。',[O('a','Cold-cache 時 Origin capacity',true),O('b','Logo 尺寸',false,'無關。'),O('c','只增加 Cache TTL 到無限',false,'不解 cache fleet failure。'),O('d','把 QPS 指標刪除',false,'會更難容量規劃。')]),
Q('sd2-ex-m05','medium','99.9% 的三個必要同步依賴，假設獨立，端到端 availability 約？','sd2-s03-p03','0.999^3≈0.997，即約 99.7%。',[O('a','約 99.7%',true),O('b','100%',false,'增加必要依賴不會變完美。'),O('c','99.9% 完全不變',false,'必須同時成功時粗略會相乘。'),O('d','0.3%',false,'把 failure percentage 當 availability。')]),
Q('sd2-ex-m06','medium','3,000 RPS，每個 response 500KB，egress 約？','sd2-s07-p01','約 1.5GB/s，也就是約 12Gbps。',[O('a','約 1.5 GB/s',true),O('b','約 1.5 MB/s',false,'少 1000 倍。'),O('c','約 500 KB/s',false,'忘了乘 RPS。'),O('d','約 3 KB/s',false,'數量級錯。')]),
Q('sd2-ex-m07','medium','讀 QPS 50k、寫 QPS 500，最先適合討論的優化方向之一？','sd2-s04-p02','讀寫比 100:1，可優先看 cache/read scaling，但仍需確認 query/profile。',[O('a','Cache / Read scaling',true),O('b','因為有 500 writes 就一定 100 shards',false,'沒有足夠證據。'),O('c','移除所有 read API',false,'不是解法。'),O('d','只增加 write replicas',false,'典型 read replica 主要分攤讀。')]),
Q('sd2-ex-m08','medium','目前 raw 5TB、每天新增 2TB，哪個資訊更急迫？','sd2-s06-p01','Growth 2TB/day 代表很快碰容量門檻，必須立刻規劃 lifecycle/partition/storage expansion。',[O('a','每天 2TB 的 growth rate',true),O('b','只看現在 5TB 就夠',false,'幾天後容量就完全不同。'),O('c','前端字型',false,'無關。'),O('d','QPS 一定為 2',false,'storage growth 不能直接變 QPS。')]),
Q('sd2-ex-m09','medium','一天 10^5 秒近似在面試中最大的用途？','sd2-s04-p01','把每日量快速除成每秒量級，簡化心算。',[O('a','快速把 per-day 轉成 per-second',true),O('b','證明一天真的只有 100,000 秒',false,'一天實際 86,400 秒。'),O('c','計算 binary prefix',false,'不是主要用途。'),O('d','替代 production metrics',false,'只是粗估。')]),
Q('sd2-ex-m10','medium','如果 response payload 從 20KB 增加到 200KB、QPS 不變，最直接哪個資源放大約 10 倍？','sd2-s07-p01','Network egress bytes/s 約放大 10 倍。',[O('a','Network egress',true),O('b','DAU 自動 10 倍',false,'使用者數不由 payload 決定。'),O('c','Availability 自動 10 倍',false,'不同維度。'),O('d','DNS record 數量',false,'無關。')]),

Q('sd2-ex-h01','hard','同事說「平均 2k QPS，所以兩台各 1k capacity 剛好夠」。最大缺陷？','sd2-s05-p03','忽略 peak、headroom、node failure 與 autoscaling lag；容量不應剛好卡在平均。',[O('a','忽略 Peak / Failure Headroom',true),O('b','因為 2k QPS 一定需要 Kafka',false,'沒有因果。'),O('c','因為兩台一定比一台慢',false,'不一定。'),O('d','因為 QPS 無法量測',false,'可量測。')]),
Q('sd2-ex-h02','hard','服務 RPS 不變，但 downstream latency 5 倍，哪個 cascading effect 最合理？','sd2-s05-p02','in-flight concurrency/connection/memory 增加，可能進一步造成 queueing 與 retry amplification。',[O('a','Concurrency 上升並可能形成 queueing cascade',true),O('b','Concurrency 必然下降 5 倍',false,'方向相反。'),O('c','Storage 自動壓縮',false,'無關。'),O('d','Availability 一定 100%',false,'延遲惡化甚至可能降低可用性。')]),
Q('sd2-ex-h03','hard','一個 200TB raw dataset 做 3 replicas，再估 index 40%、預留 30% headroom。最合理 order-of-magnitude？','sd2-s06-p02','先 200×3=600TB；加 index 約 840TB；再留 headroom 約 >1PB，應以 PB 級規劃。',[O('a','PB 級',true),O('b','仍只有 200TB',false,'忽略 replica/index/headroom。'),O('c','20GB',false,'少四個數量級。'),O('d','2EB',false,'多太多。')]),
Q('sd2-ex-h04','hard','為何「P99 latency 500ms」比「平均 latency 100ms」更能約束大規模 fan-out 使用者體驗？','sd2-s02-p02','多依賴 fan-out 時，某個 tail request 被碰到的機率放大；average 容易掩蓋少數慢路徑。',[O('a','Fan-out 會放大碰到 Tail 的機率',true),O('b','因為 P99 永遠比 average 小',false,'通常相反。'),O('c','因為 average 不可計算',false,'可計算，只是資訊不同。'),O('d','因為 P99 代表 CPU 使用率',false,'它是 latency percentile。')]),
Q('sd2-ex-h05','hard','要求 99.999% availability，但所有 replicas 都在同一 power/network failure domain，最主要問題？','sd2-s03-p03','replica 數量不等於獨立冗餘；common-mode failure 仍可同時打掉全部。',[O('a','Failure domains 不獨立',true),O('b','Replica 太多一定降低 availability',false,'關鍵是獨立性與設計。'),O('c','Five nines 不需要 redundancy',false,'通常更需要。'),O('d','Availability 只由 CPU 決定',false,'不是。')]),
Q('sd2-ex-h06','hard','某 workload 幾乎每個 key 只讀一次；把 Cache 從 100GB 加到 1TB，為何可能幫助很小？','sd2-s08-p01','缺乏 temporal locality / reuse，working set 不是「容量不夠」而是「不會重複命中」。',[O('a','Access pattern 缺乏重複命中',true),O('b','Cache 越大 hit rate 一定線性增加',false,'不一定。'),O('c','因為 RAM 不能存 key',false,'可以。'),O('d','因為所有 cache 都是 CDN',false,'錯誤分類。')]),
Q('sd2-ex-h07','hard','估算得到 media 300TB/year、metadata 5TB/year、peak writes 800/s。哪個 HLD 討論最有證據優先？','sd2-s09-p03','media storage/serving 已顯著大於 metadata，Object Storage/CDN/lifecycle 更有量級依據；800 writes/s 尚不足以單獨證明 sharding。',[O('a','Object Storage + CDN / media lifecycle',true),O('b','立刻把 metadata DB 切 1000 shards',false,'沒有容量證據。'),O('c','先移除 CDN',false,'media serving 反而可能需要 CDN。'),O('d','只優化 CSS',false,'不是主要容量訊號。')]),
Q('sd2-ex-h08','hard','對一個新產品完全沒有 Peak 歷史資料，最成熟的估算方式？','sd2-s05-p01','明確做 2x/5x/10x sensitivity analysis，標註假設，再用壓測與 production data 校正。',[O('a','做多個 Peak scenario 並標註假設',true),O('b','宣稱 Peak 永遠 5x',false,'沒有根據。'),O('c','完全忽略 Peak',false,'會低估容量風險。'),O('d','假設所有人均勻使用 24 小時',false,'通常不現實。')]),
Q('sd2-ex-h09','hard','估算到第五位小數，但 DAU 本身可能誤差 3 倍，主要問題？','sd2-s09-p04','False precision；輸入假設不確定時，過度精細的輸出沒有價值，應做範圍/sensitivity。',[O('a','False precision，應看量級與範圍',true),O('b','小數位越多一定越準',false,'輸入假設不準時不是。'),O('c','應完全取消估算',false,'仍可用 range 做決策。'),O('d','只要改用 1024 就會正確',false,'核心不是 prefix。')]),
Q('sd2-ex-h10','hard','估算完成後最好的下一句是？','sd2-s09-p04','把數字轉成 HLD 優先項，並說明哪些會由 load test/production metrics 驗證。',[O('a','「這些量級顯示主要瓶頸在 X；接下來我用 HLD 解它，落地再實測校正。」',true),O('b','「數學做完了，所以架構不用設計。」',false,'估算只是服務 HLD。'),O('c','「所有數字都一定精準。」',false,'粗估本來就有假設。'),O('d','「接下來再算 40 分鐘無關數字。」',false,'應把時間留給設計。')])
);
})();