(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_02;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
chapter.sections.push(
{
 id:'sd2-s04',order:4,title:'QPS / TPS：把每日使用量轉成每秒負載',duration:'26–36 分鐘',summary:'從 DAU、每人操作次數推導平均 QPS，並分清 read QPS、write QPS、TPS 與 endpoint-specific load。',
 research:[
  {label:'ByteByteGo — Back-of-the-envelope Estimation',url:'https://bytebytego.com/courses/system-design-interview/back-of-the-envelope-estimation'},
  {label:'ByteByteGo — Web Crawler estimation example',url:'https://bytebytego.com/courses/system-design-interview/design-a-web-crawler'},
  {label:'Google SRE — Service Level Objectives / throughput as requests per second',url:'https://sre.google/sre-book/service-level-objectives/'}
 ],
 pages:[
  {id:'sd2-s04-p01',title:'第一個公式：每日 Request ÷ 一天秒數',blocks:[
   {type:'lead',text:'QPS/RPS 的粗估本質很簡單：先估一天總共會發生多少次操作，再除以一天的秒數。面試常把 86,400 秒近似成 10^5 秒，方便快速心算。'},
   {type:'code',text:'# 例：5,000,000 DAU，每人每天讀 20 次\nreads_per_day = 5_000_000 * 20      # 100,000,000\navg_read_qps = 100_000_000 / 86_400 # ≈ 1,157 QPS\n\n# 面試心算：100M / 100k ≈ 1,000 QPS'},
   {type:'callout',title:'兩個答案都可以',text:'用 86,400 算比較準；用 10^5 算比較快。關鍵是把近似講出來，並知道結果是在 10^3 QPS 量級，而不是糾結 1,000 與 1,157。'}
  ]},
  {id:'sd2-s04-p02',title:'不要只算「總 QPS」：Read / Write 路徑完全不同',blocks:[
   {type:'compare',items:[['Read QPS','可能大量命中 CDN/Cache，也可能打 DB replica；通常和 response payload/egress 強相關。'],['Write QPS','常進 Primary/leader、transaction、index 更新、queue/event；通常更受 consistency 與 storage write path 限制。'],['TPS','常描述 transaction per second；一個 transaction 內可能包含多個 query 或 downstream 操作。']]},
   {type:'p',text:'同樣 10k QPS，如果 99% 是 cacheable GET，和 50% 是 payment write，架構壓力完全不同。因此估算最好至少拆 read/write ratio，再拆最熱 endpoint。'}
  ]},
  {id:'sd2-s04-p03',title:'從產品行為反推流量，比直接猜 QPS 更可信',blocks:[
   {type:'stepper',steps:[['DAU','一天多少活躍使用者？'],['Actions/User','每人每天平均幾次核心操作？'],['Requests/Action','一次「發文」可能呼叫 metadata、upload、notification 等多個 API。'],['Read/Write Ratio','哪些是讀、哪些是寫？'],['Average QPS','總量除以一天秒數，得到 baseline。']]},
   {type:'callout',title:'避免 Double Count',text:'「每人每天 20 次 API call」和「每人每天 20 次頁面操作，每次 5 個 API」差 5 倍。先定義 action 與 request 的關係。'}
  ]}],
 quiz:[
  {id:'sd2-s04-q1',question:'1 億 requests/day 的平均 QPS 最接近哪個量級？',reviewPageId:'sd2-s04-p01',explanation:'100,000,000 / 86,400 ≈ 1,157，因此約 10^3 QPS。',options:[O('a','約 1,000 QPS',true),O('b','約 100,000 QPS',false,'你可能忘了還要除以一天約 10^5 秒。'),O('c','約 1 QPS',false,'少了約三個數量級。'),O('d','約 1,000,000 QPS',false,'把每日總量誤當每秒。')]},
  {id:'sd2-s04-q2',question:'為什麼 System Design 估算常把 Read QPS 與 Write QPS 分開？',reviewPageId:'sd2-s04-p02',explanation:'兩者會走不同 cache、replication、transaction、storage 與 consistency 路徑，瓶頸不同。',options:[O('a','因為讀寫路徑與瓶頸通常不同',true),O('b','因為 read 永遠不需要 DB',false,'Cache miss 或不可快取資料仍可能讀 DB。'),O('c','因為 write 一定比 read 快',false,'沒有這種普遍規則。'),O('d','只是為了讓公式變長',false,'拆分能直接影響架構選型。')]},
  {id:'sd2-s04-q3',question:'5M DAU，每人每天 2 次寫入，平均 write QPS 約？',reviewPageId:'sd2-s04-p01',explanation:'10M writes/day ÷ 86,400 ≈ 116 writes/s，約 10^2 QPS。',options:[O('a','約 116 QPS',true),O('b','約 11,600 QPS',false,'多了約 100 倍。'),O('c','約 5M QPS',false,'你把 DAU 當成每秒同時寫入。'),O('d','約 0.01 QPS',false,'少了數個數量級。')]},
  {id:'sd2-s04-q4',question:'估算一個「發文」功能時，哪個問題最能避免低估 QPS？',reviewPageId:'sd2-s04-p03',explanation:'要確認一次使用者 action 實際會觸發多少 requests / downstream operations，而不是把 action 與 request 默認成 1:1。',options:[O('a','一次發文實際觸發幾個 API / downstream calls？',true),O('b','按鈕是藍色還是綠色？',false,'UI 顏色不影響 request count。'),O('c','程式變數名稱多長？',false,'不影響流量模型。'),O('d','只看 DAU 就足夠',false,'DAU 不告訴你每人操作頻率。')]}
 ]
},
{
 id:'sd2-s05',order:5,title:'Peak QPS、Concurrency 與 Headroom：平均值不是容量上限',duration:'30–42 分鐘',summary:'理解平均流量、尖峰倍率、同時在途 requests、Little’s Law 直覺與容量安全餘裕。',
 research:[
  {label:'ByteByteGo — Back-of-the-envelope Estimation',url:'https://bytebytego.com/courses/system-design-interview/back-of-the-envelope-estimation'},
  {label:'Google SRE Classroom — Non-Abstract Large System Design resources',url:'https://sre.google/classroom/'},
  {label:'Google SRE — Service Level Objectives / latency and throughput',url:'https://sre.google/sre-book/service-level-objectives/'}
 ],
 pages:[
  {id:'sd2-s05-p01',title:'Average QPS 只有 baseline；系統通常死在 Peak',blocks:[
   {type:'lead',text:'使用者不會均勻分布在 24 小時。午休、下班、球賽、搶票、推播、批次工作都會製造尖峰。沒有歷史資料時可以先假設 peak multiplier，但必須明確說這是假設，不能把「5 倍」當宇宙常數。'},
   {type:'code',text:'avg_qps = 1_200\npeak_multiplier = 5   # 假設；應以 production traffic 校正\npeak_qps = 6_000\n\n# 設計容量還應 > peak_qps，保留 failure / deploy / growth headroom'},
   {type:'bullets',items:['新系統：用 2x、5x、10x 做 sensitivity analysis，比單押一個倍率更可靠。','成熟系統：用 historical percentile、seasonality、event traffic 做 capacity planning。','真正容量還要考慮單 AZ/單 node failure 時剩餘 fleet 能不能扛住 peak。']}
  ]},
  {id:'sd2-s05-p02',title:'Concurrency ≠ QPS：一個 Request 停留多久很重要',blocks:[
   {type:'p',text:'在穩態粗估下，可以用 Little’s Law 直覺：平均同時在系統中的工作數 ≈ 到達率 × 平均停留時間。對 API 可粗略寫成 concurrent requests ≈ RPS × latency(seconds)。'},
   {type:'code',text:'# Peak 6,000 RPS，平均 request 停留 200ms = 0.2s\nconcurrency ≈ 6_000 * 0.2 = 1_200 in-flight requests\n\n# 若 latency 惡化到 1s，即使 RPS 不變：\nconcurrency ≈ 6_000 * 1 = 6_000'},
   {type:'callout',title:'這就是雪崩的一個入口',text:'Downstream 變慢 → request 停留更久 → concurrency 增加 → connection/thread/memory 壓力上升 → queueing 更嚴重 → latency 再升高。'}
  ]},
  {id:'sd2-s05-p03',title:'Headroom：容量規劃不能剛好等於 Peak',blocks:[
   {type:'compare',items:[['0% Headroom','任何 traffic spike、node failure、GC、deploy 都可能立刻飽和。'],['合理 Headroom','允許單 node/AZ 故障、短尖峰與預測誤差仍不超過 saturation。'],['過度 Headroom','可靠但成本可能不合理；應由 SLO、autoscaling speed、failure model 驅動。']]},
   {type:'stepper',steps:[['Peak Load','先估正常高峰。'],['Failure Scenario','少一台 node / 一個 AZ 時剩多少 capacity？'],['Autoscaling Lag','Scale-out 需要幾十秒或數分鐘時，誰吸收這段流量？'],['Growth','未來 3–12 個月預期成長多少？'],['Load Test','用壓測找真正 saturation point，不靠紙上 QPS 自我感覺。']]}
  ]}],
 quiz:[
  {id:'sd2-s05-q1',question:'平均 1,200 QPS、假設 peak 5 倍，Peak QPS 約？',reviewPageId:'sd2-s05-p01',explanation:'1,200×5=6,000 QPS。',options:[O('a','6,000 QPS',true),O('b','240 QPS',false,'你做了除法而不是 peak multiplier。'),O('c','1,205 QPS',false,'5 倍不是加 5。'),O('d','60,000 QPS',false,'多乘了一個 10。')]},
  {id:'sd2-s05-q2',question:'6,000 RPS、平均 latency 200ms，穩態粗估 concurrent in-flight requests 約？',reviewPageId:'sd2-s05-p02',explanation:'200ms=0.2s；6,000×0.2≈1,200 concurrent requests。',options:[O('a','約 1,200',true),O('b','約 30,000',false,'你可能直接把 ms 當秒或乘錯單位。'),O('c','約 6',false,'少了兩個數量級。'),O('d','一定等於 6,000',false,'Concurrency 還取決於 request 停留時間。')]},
  {id:'sd2-s05-q3',question:'RPS 不變，但 latency 從 200ms 升到 1s，最直接的容量影響？',reviewPageId:'sd2-s05-p02',explanation:'每個 request 停留更久，因此同時在途 requests、connection/memory 壓力會上升。',options:[O('a','Concurrency 會顯著上升',true),O('b','Concurrency 一定下降',false,'停留時間變長通常讓在途工作更多。'),O('c','Storage 自動歸零',false,'無直接關係。'),O('d','Peak QPS 會自動變 0',false,'輸入 rate 不會因 latency 公式自動歸零。')]},
  {id:'sd2-s05-q4',question:'為什麼容量不應剛好 provision 到預估 Peak QPS？',reviewPageId:'sd2-s05-p03',explanation:'還要承受預測誤差、短尖峰、deploy、node/AZ failure 與 autoscaling lag。',options:[O('a','需要 Failure 與成長 Headroom',true),O('b','因為 Peak 永遠不會發生',false,'Peak 正是容量規劃的重要條件。'),O('c','因為 Server 越閒越專業',false,'Headroom 要有 SLO/failure model 理由，不是盲目浪費。'),O('d','因為 QPS 不能量測',false,'QPS/RPS 是常見 throughput 指標。')]}
 ]
},
{
 id:'sd2-s06',order:6,title:'Storage Estimation：從一筆資料算到一年、三年、五年',duration:'32–44 分鐘',summary:'估單筆資料、每日新增量、retention、replication、index 與 headroom，判斷單庫、分片、Object Storage 的量級。',
 research:[
  {label:'ByteByteGo — Back-of-the-envelope Estimation',url:'https://bytebytego.com/courses/system-design-interview/back-of-the-envelope-estimation'},
  {label:'ByteByteGo — Web Crawler storage estimation example',url:'https://bytebytego.com/courses/system-design-interview/design-a-web-crawler'}
 ],
 pages:[
  {id:'sd2-s06-p01',title:'Storage Formula：單筆 × 每日新增 × Retention',blocks:[
   {type:'code',text:'# 例：每天 10M 新 posts，metadata 平均 1KB\ndaily = 10_000_000 * 1_000 bytes ≈ 10 GB/day\nyearly ≈ 3.65 TB/year\n5_year_raw ≈ 18.25 TB\n\n# 這仍只是 raw payload，尚未加 replication/index/headroom。'},
   {type:'p',text:'先算 raw growth 能快速知道量級。若 5 年 raw 就只有 20 GB，過早談 sharding 很可疑；若一年就是 PB 級，storage architecture 會立刻成為核心。'},
   {type:'callout',title:'Growth Rate 比 Total Size 更有用',text:'「現在 5 TB」只是快照；「每天新增 2 TB」告訴你一年後一定會出事。容量規劃應同時看 current footprint 與 growth velocity。'}
  ]},
  {id:'sd2-s06-p02',title:'Raw Storage 之後還要加什麼？',blocks:[
   {type:'stepper',steps:[['Replication','例如 3 copies，raw data 先乘約 3。'],['Indexes','依 access pattern 建 index，會佔額外空間。'],['Metadata','object metadata、row overhead、manifest、tombstone。'],['Operational Space','compaction、migration、temporary files、backup。'],['Headroom','避免磁碟 100% 才擴容；storage 系統在接近滿載時常更難維運。']]},
   {type:'p',text:'壓縮會降低空間，但 compression ratio 取決於資料型態。不要在沒有資料分布時假設「一定壓到 10%」。比較好的說法是先算 uncompressed upper bound，再做 2:1、4:1 sensitivity analysis。'}
  ]},
  {id:'sd2-s06-p03',title:'Metadata 與大型 Blob 通常要分開估',blocks:[
   {type:'compare',items:[['Metadata','user_id、object_key、size、status、created_at；適合 database/index。'],['Blob / Media','圖片、影片、備份；單筆大、吞吐高，通常更適合 object storage。']]},
   {type:'code',text:'# 例：每天 3M 個圖片附件，平均 200KB\n3_000_000 * 200KB ≈ 600GB/day\n≈ 219TB/year raw\n\n# 相比之下 10M 筆 * 1KB metadata 只有約 10GB/day。'},
   {type:'callout',title:'架構訊號',text:'如果 metadata 只有 TB 級但 media 已經數百 TB/PB，別把大型 binary 全塞進同一個 relational row 再說「DB 很大」。先把不同資料型態拆開估。'}
  ]}],
 quiz:[
  {id:'sd2-s06-q1',question:'每天新增 10M 筆、每筆 1KB，raw storage 每天約？',reviewPageId:'sd2-s06-p01',explanation:'10,000,000×1KB≈10GB/day（十進位近似）。',options:[O('a','約 10 GB/day',true),O('b','約 10 MB/day',false,'少了約 1000 倍。'),O('c','約 10 TB/day',false,'多了約 1000 倍。'),O('d','約 1 KB/day',false,'忘了乘資料筆數。')]},
  {id:'sd2-s06-q2',question:'Raw data 100TB、採 3 replicas，光 replication 後至少約多少 storage？',reviewPageId:'sd2-s06-p02',explanation:'若三份完整副本，粗略先看 300TB，再另外考慮 index/headroom。',options:[O('a','約 300 TB',true),O('b','約 33 TB',false,'Replication 是增加副本，不是把資料除三。'),O('c','仍一定只有 100 TB',false,'忽略了副本空間。'),O('d','約 3 GB',false,'單位與數量級錯誤。')]},
  {id:'sd2-s06-q3',question:'為什麼大型圖片/影片與 metadata 應分開估算？',reviewPageId:'sd2-s06-p03',explanation:'Blob 的單筆大小、吞吐、storage/serving 模式與 metadata DB 完全不同，常決定整體容量與 CDN/Object Storage 架構。',options:[O('a','兩種資料型態的容量與存取模式不同',true),O('b','因為 metadata 永遠比影片大',false,'通常剛好相反。'),O('c','因為 Object Storage 不能存 binary',false,'Object Storage 正是常見 Blob 儲存方式。'),O('d','只為了讓 schema 比較漂亮',false,'核心是容量、I/O 與 serving pattern。')]},
  {id:'sd2-s06-q4',question:'容量估算時為什麼要看「每日新增量」而不只看「現在總容量」？',reviewPageId:'sd2-s06-p01',explanation:'Growth rate 決定多久會碰到下一個容量門檻，也直接影響 retention、partition、archival 與成本。',options:[O('a','因為 Growth Rate 決定未來何時撞容量上限',true),O('b','因為現在容量完全沒有意義',false,'Current footprint 仍是重要 baseline。'),O('c','因為每天新增量一定固定',false,'它只是模型，需隨業務成長校正。'),O('d','因為 storage 不需要 replication',false,'兩者無此因果。')]}
 ]
}
);
})();