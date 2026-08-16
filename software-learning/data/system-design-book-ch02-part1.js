(() => {
const chapter = window.SYSTEM_DESIGN_CHAPTER_02 = {
  id: 'sd-book-02',
  order: 2,
  title: '粗略的估算',
  subtitle: '把模糊的「很多使用者」轉成 QPS、Latency、Storage、Bandwidth、Concurrency 與 Availability，讓架構選擇有量級依據。',
  objective: '完成後，你應該能在 5–10 分鐘內用清楚假設做容量估算，知道哪些數字值得算、哪些只是噪音，並把估算結果轉成架構決策。',
  sections: [],
  finalExam: []
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
chapter.sections.push(
{
 id:'sd2-s01',order:1,title:'資料單位與 Power of Two：先把量級算對',duration:'20–28 分鐘',summary:'建立 bit、byte、KB/KiB、MB/MiB、GB/GiB、TB/TiB 的量級直覺，並學會面試時如何快速近似。',
 research:[
  {label:'ByteByteGo — Back-of-the-envelope Estimation / Power of two',url:'https://bytebytego.com/courses/system-design-interview/back-of-the-envelope-estimation'},
  {label:'NIST — Prefixes for binary multiples',url:'https://physics.nist.gov/cuu/Units/binary.html'}
 ],
 pages:[
  {id:'sd2-s01-p01',title:'估算不是心算比賽：先把單位鎖死',blocks:[
   {type:'lead',text:'粗略估算最常見的錯誤不是乘法算錯，而是 bit/byte、KB/MB、每天/每秒混在一起。先標單位，再計算；單位會像型別檢查一樣幫你抓錯。'},
   {type:'compare',items:[['bit（b）','網路頻寬常用 bit/s，例如 Mbps、Gbps。'],['byte（B）','檔案與記憶體容量常用 byte；1 byte = 8 bits。'],['Decimal prefix','kB=10^3 B、MB=10^6 B、GB=10^9 B。'],['Binary prefix','KiB=2^10 B、MiB=2^20 B、GiB=2^30 B。']]},
   {type:'callout',title:'面試做法',text:'若題目沒要求精準制式，先說「我用 1 KB≈10^3 bytes、一天≈10^5 秒做量級估算」，保持整題一致即可。真正危險的是同一題一半用 1000、一半用 1024，卻沒有意識到。'}
  ]},
  {id:'sd2-s01-p02',title:'2 的次方：需要記的是錨點，不是背完整表',blocks:[
   {type:'code',text:'2^10 ≈ 10^3\n2^20 ≈ 10^6\n2^30 ≈ 10^9\n2^40 ≈ 10^12\n\n因此：\n1 KiB = 2^10 B\n1 MiB = 2^20 B\n1 GiB = 2^30 B\n1 TiB = 2^40 B'},
   {type:'p',text:'這些錨點讓你看到 64-bit ID、數十億筆資料、TB 級儲存時能快速抓量級。粗估的目標通常是判斷「單機 RAM 能不能放、單庫容量會不會爆、頻寬是不是先成為瓶頸」，不是追求小數點。'},
   {type:'bullets',items:['10^3、10^6、10^9、10^12 是面試估算很好用的量級階梯。','2^10=1024，與 10^3 很接近；資料越大差距會累積，但初步設計通常先抓 order of magnitude。','若題目是實際採購或 billing，則必須回到供應商定義與精確單位。']}
  ]},
  {id:'sd2-s01-p03',title:'一筆資料「看起來 100 bytes」不代表真的只佔 100 bytes',blocks:[
   {type:'stepper',steps:[['Payload','先估真正業務欄位，例如 user_id、timestamp、text。'],['Encoding','JSON、Protobuf、資料庫 row format 都有不同 overhead。'],['Index','常查欄位可能建立一個或多個 index。'],['Replication','3 副本代表 raw storage 可能先乘 3。'],['Headroom','還要留 compaction、temporary files、growth、backup 空間。']]},
   {type:'callout',title:'估算的層次',text:'面試第一輪可以先算 raw data；如果 raw data 已經 100 TB，就知道不能假裝單機解決。進一步 deep dive 再補 index、replication、compression、metadata 與 operational headroom。'}
  ]}],
 quiz:[
  {id:'sd2-s01-q1',question:'1 byte 等於多少 bits？',reviewPageId:'sd2-s01-p01',explanation:'1 byte = 8 bits；容量與頻寬換算時常需要乘或除 8。',options:[O('a','8 bits',true),O('b','10 bits',false,'你可能把十進位 prefix 與 byte 定義混在一起。'),O('c','1024 bits',false,'1024 是 2^10，常出現在 KiB，不是一個 byte 的 bit 數。'),O('d','1 bit',false,'bit 與 byte 是不同單位。')]},
  {id:'sd2-s01-q2',question:'面試粗估時使用 2^10≈10^3 的主要目的？',reviewPageId:'sd2-s01-p02',explanation:'用少量錨點快速抓量級，判斷容量是否跨越 MB/GB/TB 等級。',options:[O('a','快速取得量級直覺',true),O('b','證明 1024 完全等於 1000',false,'它是近似，不是數學等號。'),O('c','讓所有 billing 都忽略單位',false,'實際計費仍需精確定義。'),O('d','把 bit 和 byte 視為相同',false,'兩者仍差 8 倍。')]},
  {id:'sd2-s01-q3',question:'估出 raw data 為 20 TB 後，哪個因素最可能讓實際儲存需求更高？',reviewPageId:'sd2-s01-p03',explanation:'Index、replication、metadata、temporary space 與 operational headroom 都會讓實際需求高於 raw payload。',options:[O('a','Index 與 Replication',true),O('b','把 HTTP method 改成 GET',false,'HTTP method 不會自動消除儲存副本與 index。'),O('c','把 DNS TTL 設短',false,'DNS TTL 與資料庫 raw storage 無直接關係。'),O('d','降低螢幕亮度',false,'與服務端儲存無關。')]},
  {id:'sd2-s01-q4',question:'估算題中最好的單位習慣是？',reviewPageId:'sd2-s01-p01',explanation:'先聲明近似規則並在整題維持一致，避免 bit/byte、秒/天與 decimal/binary prefix 混用。',options:[O('a','先聲明假設並保持單位一致',true),O('b','每一步隨機選 1000 或 1024',false,'這會讓結果難以驗證，也容易累積錯誤。'),O('c','所有數字都保留 12 位小數',false,'粗略估算重點是量級與推理，不是小數精度。'),O('d','完全不寫單位',false,'沒有單位很容易把 requests/day 當成 requests/sec。')]}
 ]
},
{
 id:'sd2-s02',order:2,title:'Latency Numbers：掌握量級、Tail Latency 與依賴鏈',duration:'28–38 分鐘',summary:'不死背過時硬體數字，而是理解 CPU/Memory/Network/Disk/跨區呼叫的相對量級，以及 P95/P99 為什麼比平均值更能暴露風險。',
 research:[
  {label:'ByteByteGo — Back-of-the-envelope Estimation / Latency numbers',url:'https://bytebytego.com/courses/system-design-interview/back-of-the-envelope-estimation'},
  {label:'Google SRE Classroom — Latency Numbers Everyone Should Know resource',url:'https://sre.google/classroom/distributed-pubsub/'},
  {label:'Google SRE — Service Level Objectives',url:'https://sre.google/sre-book/service-level-objectives/'}
 ],
 pages:[
  {id:'sd2-s02-p01',title:'Latency 的第一直覺：跨邊界通常比本機操作貴',blocks:[
   {type:'lead',text:'硬體世代會變，精確 ns 數字也會變；但量級階層非常穩定：CPU cache / RAM 通常遠快於本機 storage，而跨網路、跨區域又會把 propagation、queueing、serialization、service processing 疊上去。'},
   {type:'diagram',nodes:[['CPU / Cache','ns 級量級'],['RAM','ns～sub-µs 量級'],['Local SSD','µs～ms 量級'],['Network Call','取決於 RTT + service'],['Cross Region','通常再多數十～數百 ms 量級']],caption:'這不是固定 SLA 表；是設計時用來辨認「把一次記憶體查詢換成跨區 RPC」會跨越多少量級。'},
   {type:'callout',title:'不要背死數字',text:'面試可以說「我知道相對量級，但實際 latency 會依硬體、距離、protocol、payload、queueing 改變；設計落地後要以 benchmark/production telemetry 校正」。'}
  ]},
  {id:'sd2-s02-p02',title:'平均 50ms 可能很好看，但 P99 可能已經 2 秒',blocks:[
   {type:'compare',items:[['Average','容易理解，但少量超慢 request 可能被大量快 request 稀釋。'],['P50','中位數；50% request 比它快，50% 比它慢。'],['P95','95% request 在此 latency 以下；開始看出尾端體驗。'],['P99','最慢的 1% 之外的界線；大型服務常用來觀察 tail latency。']]},
   {type:'p',text:'使用者一個頁面可能同時依賴很多 API。即使每個 downstream 只有小比例慢請求，整個頁面「至少一個依賴變慢」的機率會被放大。這也是大型 fan-out 系統非常在意 tail latency 的原因。'},
   {type:'callout',title:'面試語言',text:'不要只說「平均 latency 100ms」。說清楚測量窗口與 percentile，例如 P95<200ms、P99<500ms，才更接近可驗證的非功能需求。'}
  ]},
  {id:'sd2-s02-p03',title:'Latency Budget：串行依賴會相加，平行依賴看最慢者',blocks:[
   {type:'stepper',steps:[['入口 Budget','假設 API P95 目標 300ms。'],['Gateway','TLS / routing / auth 先花一部分。'],['Service','商業邏輯與 DB/cache 再花一部分。'],['Downstream','串行 RPC latency 會直接加總。'],['Headroom','還要留 queueing、GC、network variance 與 retry 的空間。']]},
   {type:'code',text:'# 粗略示意\nserial_total ≈ 20ms + 80ms + 120ms = 220ms\nparallel_total ≈ max(80ms, 120ms) + orchestration overhead\n\n# 但平行 fan-out 會增加資源使用與 tail-risk，不能只看公式。'},
   {type:'callout',title:'Retry 會改變 latency',text:'Timeout + retry 不是免費可靠性。Retry 可能把原本 300ms request 拉成 1s，也可能在 downstream 已經過載時製造更多流量。'}
  ]}],
 quiz:[
  {id:'sd2-s02-q1',question:'為什麼不應死背某一張「Latency Numbers」表的每個 ns？',reviewPageId:'sd2-s02-p01',explanation:'精確數字會隨硬體、距離、protocol 與 workload 改變；更重要的是掌握量級與用實測校正。',options:[O('a','因為實際 latency 依環境改變，應掌握量級並量測',true),O('b','因為 latency 永遠不重要',false,'Latency 是核心 SLI 之一。'),O('c','因為所有操作都是 1ms',false,'不同操作跨越多個量級。'),O('d','因為 P99 等於平均值',false,'Percentile 與 average 描述不同分布資訊。')]},
  {id:'sd2-s02-q2',question:'平均 latency 很低，但大量使用者仍抱怨偶爾很慢，最值得先看？',reviewPageId:'sd2-s02-p02',explanation:'查看 P95/P99 等 tail latency，平均值可能掩蓋少數非常慢的請求。',options:[O('a','P95/P99 Tail Latency',true),O('b','只看平均值更多位小數',false,'問題正是平均值可能掩蓋尾端。'),O('c','只看 CSS 檔大小',false,'可能相關但無法直接回答 API tail latency。'),O('d','關掉監控',false,'會讓問題更難定位。')]},
  {id:'sd2-s02-q3',question:'A→B→C 三個同步串行 RPC 各花 50ms、80ms、100ms，忽略 overhead，總 latency 約？',reviewPageId:'sd2-s02-p03',explanation:'串行依賴粗略相加：50+80+100=230ms。',options:[O('a','230ms',true),O('b','100ms',false,'100ms 只接近「全部完美平行」時的最大單一依賴，不適用串行。'),O('c','50ms',false,'你只取了第一段。'),O('d','23ms',false,'少了一個數量級。')]},
  {id:'sd2-s02-q4',question:'設定 API latency 目標時，哪個描述最可驗證？',reviewPageId:'sd2-s02-p02',explanation:'Percentile + threshold + measurement window 才能形成可觀測目標。',options:[O('a','99% requests < 500ms',true),O('b','要很快',false,'「很快」沒有可量測門檻。'),O('c','平均看起來不錯就好',false,'缺少明確 percentile/threshold，也可能忽略 tail。'),O('d','CPU 低於 100% 就代表 latency 一定好',false,'Latency 可能卡 DB、network、lock、queue 等。')]}
 ]
},
{
 id:'sd2-s03',order:3,title:'Availability Numbers：一個 9 到底差多少停機時間？',duration:'24–34 分鐘',summary:'理解 availability、durability、nines、error budget，並學會把 99.9% / 99.99% 轉成可感知的 downtime。',
 research:[
  {label:'ByteByteGo — Back-of-the-envelope Estimation / Availability numbers',url:'https://bytebytego.com/courses/system-design-interview/back-of-the-envelope-estimation'},
  {label:'Google SRE — Service Level Objectives',url:'https://sre.google/sre-book/service-level-objectives/'},
  {label:'Google SRE Workbook — Implementing SLOs',url:'https://sre.google/workbook/implementing-slos/'}
 ],
 pages:[
  {id:'sd2-s03-p01',title:'Availability 不是 Durability',blocks:[
   {type:'compare',items:[['Availability','服務在需要時能否成功提供功能；常以成功 request 比例或可用時間比例描述。'],['Durability','資料在長時間後仍被保留、不遺失的機率；storage 系統尤其重視。'],['Latency','即使服務「可用」，如果 30 秒才回應，使用者體驗仍可能不可接受。']]},
   {type:'callout',title:'常見錯誤',text:'「99.99% availability」不代表「99.99% 資料不會丟」，也不代表所有 request 都低 latency。這三個品質維度要分開討論。'}
  ]},
  {id:'sd2-s03-p02',title:'把 Nines 轉成 Downtime，才知道成本差異',blocks:[
   {type:'code',text:'30 天 ≈ 43,200 分鐘\n\n99%     → 約 432 分鐘/月\n99.9%   → 約 43.2 分鐘/月\n99.99%  → 約 4.32 分鐘/月\n99.999% → 約 0.432 分鐘/月 ≈ 26 秒/月\n\n一年估算：\n99.9%   → 約 8.76 小時\n99.99%  → 約 52.6 分鐘\n99.999% → 約 5.26 分鐘'},
   {type:'p',text:'每多一個 9，允許的 failure budget 大約再縮小 10 倍。這通常意味著更多 redundancy、automation、testing、operational discipline 與成本，所以不要沒有需求就喊 five nines。'},
   {type:'callout',title:'Error Budget',text:'若 SLO 是 99.9%，剩餘 0.1% 就是可容忍的失敗預算概念。Google SRE 用 error budget 平衡可靠性與開發速度。'}
  ]},
  {id:'sd2-s03-p03',title:'多個依賴串起來，整體 Availability 可能更低',blocks:[
   {type:'p',text:'若一個 request 必須同時依賴 A、B、C 三個服務都成功，而且故障近似獨立，粗略整體 availability 會接近各自 availability 的乘積。更多同步依賴通常增加 failure surface。'},
   {type:'code',text:'# 粗略示意（假設獨立）\nA = 0.999\nB = 0.999\nC = 0.999\nend_to_end ≈ A * B * C ≈ 0.997003  # 約 99.7%\n\n# 真實事故常有 shared dependency / correlated failure，不能盲目假設獨立。'},
   {type:'bullets',items:['Fallback 可以讓非核心 dependency 失敗時仍回傳降級結果。','Redundancy 只有在 failure mode 足夠獨立時才真正提高 availability。','同一 Region、同一 DB、同一 DNS provider 可能形成 common-mode failure。']}
  ]}],
 quiz:[
  {id:'sd2-s03-q1',question:'99.9% availability 在 30 天內大約允許多少 downtime？',reviewPageId:'sd2-s03-p02',explanation:'30 天約 43,200 分鐘；0.1% 約 43.2 分鐘。',options:[O('a','約 43 分鐘',true),O('b','約 4.3 分鐘',false,'那比較接近 99.99%。'),O('c','約 7.2 小時',false,'那比較接近 99%。'),O('d','完全不能停機',false,'任何低於 100% 的目標都有 failure budget。')]},
  {id:'sd2-s03-q2',question:'Availability 與 Durability 最主要差異？',reviewPageId:'sd2-s03-p01',explanation:'Availability 關心服務是否可取得/成功；Durability 關心資料是否長期保存不遺失。',options:[O('a','Availability 看服務可用；Durability 看資料長期保存',true),O('b','兩者完全相同',false,'它們是不同可靠性維度。'),O('c','Durability 只代表 latency',false,'Durability 不是延遲。'),O('d','Availability 只代表 storage 容量',false,'Availability 關心可提供服務的程度。')]},
  {id:'sd2-s03-q3',question:'三個 99.9% 的同步必要依賴串在一起，端到端 availability 一定仍是 99.9% 嗎？',reviewPageId:'sd2-s03-p03',explanation:'不一定；若每個都必須成功，粗略 availability 會下降，且真實系統還有 correlated failure。',options:[O('a','不一定，必要依賴會增加 failure surface',true),O('b','一定，因為百分比取最大值',false,'同步成功通常不是取最大值。'),O('c','一定變成 100%',false,'增加依賴不會憑空消除故障。'),O('d','只和 CSS 有關',false,'這是服務可靠性問題。')]},
  {id:'sd2-s03-q4',question:'為什麼不應對所有系統無腦要求 99.999%？',reviewPageId:'sd2-s03-p02',explanation:'每多一個 9 會大幅縮小 error budget，通常需要更多成本、冗餘與操作成熟度；目標應由業務需求驅動。',options:[O('a','可靠性提升有成本，應由需求決定',true),O('b','因為 99.999% 比 99% 更差',false,'數值上它更高，只是成本也通常更高。'),O('c','因為 availability 不能量測',false,'可用性是常見 SLI。'),O('d','因為所有系統都必須 100%',false,'100% 通常不是現實可行目標。')]}
 ]
}
);
})();