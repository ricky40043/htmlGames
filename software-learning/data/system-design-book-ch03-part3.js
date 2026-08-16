(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_03;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const Q=(id,difficulty,question,reviewPageId,explanation,options)=>({id,difficulty,question,reviewPageId,explanation,options});
chapter.sections.push(
{
 id:'sd3-s07',order:7,title:'Step 4：Wrap-up 不是結束語，而是展示成熟度',duration:'26–36 分鐘',summary:'用 Bottleneck、Failure、Observability、Rollout、Next Scale 與 Recap 完成設計閉環。',
 research:[
  {label:'ByteByteGo — Step 4 Wrap up',url:'https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews'},
  {label:'Google SRE Workbook — reliability / capacity planning',url:'https://sre.google/workbook/engagement-model/'}
 ],
 pages:[
  {id:'sd3-s07-p01',title:'先主動指出：我的設計還有哪些瓶頸？',blocks:[
   {type:'lead',text:'成熟的設計者不會說「這樣就完成、沒有問題」。Wrap-up 應主動指出目前最可能的 bottleneck、已知 limitation 與下一步改善方向。'},
   {type:'bullets',items:['單一 metadata store 是否會成 write bottleneck？','某個 hot key / celebrity 是否會破壞平均分布？','Queue backlog 是否可能在 downstream failure 時爆增？','Cache miss storm 是否會把 DB 打垮？','跨區域 failover 是否會有 stale routing / data lag？']},
   {type:'callout',title:'好的語氣',text:'「在目前 assumptions 下這版可行；如果流量再 10x，我會優先看 X，因為目前它是最接近 capacity ceiling 的元件。」'}
  ]},
  {id:'sd3-s07-p02',title:'Failure + Operations：Production 不只看 happy path',blocks:[
   {type:'stepper',steps:[['Failure','server / network / dependency / region 掛掉會怎樣？'],['Detection','哪個 metric / alert 告訴你出事？'],['Mitigation','retry、fallback、failover、queue、circuit breaker？'],['Recovery','資料如何補、backlog 如何 drain、如何 reconcile？'],['Rollout','部署如何逐步驗證與 rollback？']]},
   {type:'p',text:'Google SRE 強調在正式上線前就要做 capacity planning、redundancy、spike/overload handling、monitoring 與 performance tuning。這些不是「營運之後再想」，而是系統設計的一部分。'}
  ]},
  {id:'sd3-s07-p03',title:'Recap：用 60 秒把整場設計重新壓縮',blocks:[
   {type:'code',text:'1. 我們鎖定的核心 requirements 是 ...\n2. HLD 的主要 write/read flow 是 ...\n3. 量級最大壓力在 ...\n4. 我選擇 X 而不是 Y，因為 ...\n5. 最大已知風險是 ...，下一步會 ...'},
   {type:'p',text:'Recap 的目的不是重講所有細節，而是幫面試官整理你整場最重要的 decisions 與 trade-offs。'},
   {type:'callout',title:'最後問 feedback',text:'如果還有時間，可以問「你想要我再深入哪一個 failure 或 trade-off？」讓面試官有機會取得最後需要的 signal。'}
  ]}],
 quiz:[
  {id:'sd3-s07-q1',question:'Wrap-up 時說「架構已經完美，沒有 bottleneck」為何是負面訊號？',reviewPageId:'sd3-s07-p01',explanation:'任何架構都有 assumptions、capacity ceiling 與 trade-offs；主動辨識限制顯示成熟度。',options:[O('a','因為任何架構都有已知限制與下一個瓶頸',true),O('b','因為一定要多加三個 DB',false,'不是元件數問題。'),O('c','因為不能說完美這個字',false,'重點是思考內容。'),O('d','因為面試不能結束',false,'不是。')]},
  {id:'sd3-s07-q2',question:'Production failure 討論最完整的順序？',reviewPageId:'sd3-s07-p02',explanation:'應涵蓋 failure、detection、mitigation、recovery 與 rollout/rollback。',options:[O('a','Failure → Detection → Mitigation → Recovery',true),O('b','只說 retry',false,'Retry 只是 mitigation 之一，且可能放大故障。'),O('c','只說有 monitoring',false,'還缺修復與恢復。'),O('d','忽略資料修復',false,'durable state 常需要 reconciliation。')]},
  {id:'sd3-s07-q3',question:'60 秒 Recap 最應該包含？',reviewPageId:'sd3-s07-p03',explanation:'核心 requirements、主要 flow、關鍵 decision/trade-off、最大風險與 next step。',options:[O('a','核心決策與風險',true),O('b','逐字重念 45 分鐘內容',false,'失去摘要目的。'),O('c','只重念題目',false,'沒有 decision。'),O('d','只說用了哪些雲服務',false,'不足以展示推導。')]},
  {id:'sd3-s07-q4',question:'「支援 1M users，下一個 10M users 要改什麼？」屬於哪種 Wrap-up 思考？',reviewPageId:'sd3-s07-p01',explanation:'這是 Next Scale Curve：找目前設計的下一個容量或架構轉折點。',options:[O('a','Next scale curve',true),O('b','Functional requirement',false,'這是擴展討論。'),O('c','CSS optimization',false,'無關。'),O('d','Unit test syntax',false,'不是。')]}
 ]
},
{
 id:'sd3-s08',order:8,title:'45 分鐘實戰節奏：把 Framework 變成可重複的肌肉記憶',duration:'38–50 分鐘',summary:'建立時間盒、白板結構、Think Aloud 與卡住時的復原策略，讓框架真的能在面試壓力下運作。',
 research:[{label:'ByteByteGo — Time allocation / Dos and Don’ts',url:'https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews'}],
 pages:[
  {id:'sd3-s08-p01',title:'45 分鐘參考 Timebox',blocks:[
   {type:'diagram',nodes:[['0–7m','Scope / FR / NFR'],['7–18m','HLD + estimate'],['18–40m','Deep Dive'],['40–45m','Wrap-up']],caption:'不是硬規則，而是防止你在某一段失控。ByteByteGo 提供的範圍也大致是 Step1 3–10m、Step2 10–15m、Step3 10–25m、Step4 3–5m。'},
   {type:'bullets',items:['如果 interviewer 很快鎖定 scope，Step 1 可以短。','Senior round 可能把更多時間放在 Deep Dive / bottleneck。','如果 20 分鐘還沒 HLD，通常已經過度停留在 clarification 或 estimation。']}
  ]},
  {id:'sd3-s08-p02',title:'白板/筆記固定四區，降低認知負擔',blocks:[
   {type:'compare',items:[['左上','Requirements / assumptions / numbers'],['中間','HLD / flows'],['右側','Deep Dive diagrams / data model'],['下方','Trade-offs / TODO / failure / metrics']]},
   {type:'p',text:'固定版面不是形式主義，而是讓你能快速回頭引用 assumptions、避免忘掉問題，並讓面試官看得懂設計如何演進。'}
  ]},
  {id:'sd3-s08-p03',title:'卡住時不要沉默：用「重新定位」復原',blocks:[
   {type:'stepper',steps:[['Restate','我現在要解的是 X requirement。'],['Identify unknown','我卡在 Y，因為需要決定 consistency / scale / ordering。'],['Offer options','可以選 A 或 B；A 的代價是…，B 的代價是…。'],['Ask signal','你希望我更偏向 latency 還是 correctness？'],['Proceed','做合理 assumption，記下來後往前。']]},
   {type:'callout',title:'不要假裝知道',text:'坦白某個產品細節不熟，然後從 first principles 推導，通常比自信地亂講更好。系統設計面試本來就在觀察如何處理模糊與未知。'}
  ]},
  {id:'sd3-s08-p04',title:'整章 Checklist：任何設計題都跑一次',blocks:[
   {type:'code',text:'□ Core use cases / out of scope\n□ DAU/QPS/storage/geo\n□ Latency / availability / consistency\n□ HLD + write/read flow\n□ API / data model（需要時）\n□ 1–3 個 Deep Dive\n□ Bottleneck / failure / race\n□ Monitoring / rollout / recovery\n□ Next 10x scale\n□ 60 秒 recap'},
   {type:'callout',title:'Chapter 4 開始正式套用',text:'下一章 Rate Limiter 會完全照這套：Step 1 鎖需求 → Step 2 HLD/algorithms → Step 3 distributed correctness → Step 4 failure/monitoring。'}
  ]}],
 quiz:[
  {id:'sd3-s08-q1',question:'45 分鐘面試到第 25 分鐘仍只在問 requirement，主要風險？',reviewPageId:'sd3-s08-p01',explanation:'時間盒失控，會沒有足夠時間展示 HLD、Deep Dive 與 failure reasoning。',options:[O('a','後面訊號不足',true),O('b','Requirement 問越久一定越好',false,'要取得足夠資訊，不是無限問。'),O('c','一定會加分',false,'不一定。'),O('d','可以不用 HLD',false,'通常不行。')]},
  {id:'sd3-s08-q2',question:'固定白板區域的主要價值？',reviewPageId:'sd3-s08-p02',explanation:'降低認知負擔並讓 assumptions、diagram、trade-offs 可被持續引用。',options:[O('a','讓資訊結構清楚可追蹤',true),O('b','面試官只看排版',false,'內容仍是核心。'),O('c','取代技術能力',false,'不能。'),O('d','保證一定通過',false,'沒有保證。')]},
  {id:'sd3-s08-q3',question:'卡住時最成熟的做法？',reviewPageId:'sd3-s08-p03',explanation:'重新說明 requirement、指出 unknown、提出 options/trade-off，必要時向面試官確認優先級。',options:[O('a','重新定位問題並提出 options',true),O('b','完全沉默直到想到',false,'無法展示思路。'),O('c','亂講一個名詞',false,'會產生錯誤訊號。'),O('d','直接放棄',false,'ByteByteGo 也明確建議不要放棄，可詢問 hints。')]},
  {id:'sd3-s08-q4',question:'Chapter 3 Framework 最重要的本質？',reviewPageId:'sd3-s08-p04',explanation:'讓你可重複地管理 ambiguity、scope、decision、trade-off、時間與 collaboration。',options:[O('a','把開放式問題變成可管理的合作流程',true),O('b','要求每題架構一樣',false,'每題不同。'),O('c','背固定產品答案',false,'不是。'),O('d','避免跟面試官說話',false,'相反。')]}
 ]
}
);
chapter.finalExam.push(
Q('sd3-ex-e01','easy','System Design Interview 最重要的第一步？','sd3-s02-p01','先理解問題與 scope，再提出方案。',[O('a','Clarify requirements',true),O('b','直接選 Kafka',false,'需求未知。'),O('c','先畫 20 個 services',false,'Over-engineering。'),O('d','先寫 code',false,'不是此 round 核心。')]),
Q('sd3-ex-e02','easy','Functional Requirement 主要描述？','sd3-s02-p02','描述系統必須支援的行為/use case。',[O('a','系統要做什麼',true),O('b','P99 latency',false,'NFR。'),O('c','Availability target',false,'NFR。'),O('d','成本上限',false,'Constraint。')]),
Q('sd3-ex-e03','easy','哪個是 Non-functional Requirement？','sd3-s03-p01','P99 latency 是性能約束。',[O('a','使用者可以發訊息',false,'FR。'),O('b','P99 < 200ms',true),O('c','建立貼文',false,'FR。'),O('d','搜尋影片',false,'FR。')]),
Q('sd3-ex-e04','easy','HLD 的主要目標？','sd3-s04-p01','建立核心 flow 與主要元件共識。',[O('a','建立 blueprint 共識',true),O('b','完成每個 class',false,'太細。'),O('c','決定每台 CPU 型號',false,'通常不是。'),O('d','寫完 deployment script',false,'不是 HLD。')]),
Q('sd3-ex-e05','easy','Deep Dive 應優先選？','sd3-s06-p01','核心機制、bottleneck、correctness/failure 風險。',[O('a','最有設計訊號的核心問題',true),O('b','最流行的技術',false,'流行不等於重要。'),O('c','每個 box 平均 3 分鐘',false,'優先級不同。'),O('d','UI 細節',false,'通常低價值。')]),
Q('sd3-ex-e06','easy','Wrap-up 建議主動討論？','sd3-s07-p01','Bottleneck、failure、operations、next scale 與 recap。',[O('a','限制與下一步',true),O('b','宣稱完美',false,'Red flag。'),O('c','只說謝謝',false,'少掉訊號。'),O('d','重畫所有圖',false,'不必要。')]),
Q('sd3-ex-e07','easy','估算的主要用途？','sd3-s03-p02','驗證設計是否符合量級。',[O('a','驗證 capacity/HLD',true),O('b','展示算術',false,'不是。'),O('c','取代 load test',false,'不能。'),O('d','拖時間',false,'不是。')]),
Q('sd3-ex-e08','easy','面試官叫你自行假設時？','sd3-s02-p03','提出合理假設並說明/記錄。',[O('a','明確寫下 assumption',true),O('b','拒絕',false,'無法前進。'),O('c','偷偷假設',false,'缺乏共享 context。'),O('d','永遠假設最大規模',false,'不合理。')]),
Q('sd3-ex-e09','easy','Timebox 的目的？','sd3-s08-p01','避免某一步耗盡整場時間。',[O('a','確保有時間展示完整流程',true),O('b','每分鐘都不能變',false,'只是 guide。'),O('c','限制提問數量為 3',false,'沒有固定。'),O('d','避免 Deep Dive',false,'相反。')]),
Q('sd3-ex-e10','easy','System design 沒有唯一答案的主要原因？','sd3-s01-p02','Requirements/constraints/trade-offs 不同會產生不同合理設計。',[O('a','條件不同會導出不同方案',true),O('b','技術都一樣',false,'相反。'),O('c','不需要 correctness',false,'錯。'),O('d','只靠運氣',false,'不是。')]),
Q('sd3-ex-m01','medium','題目是 News Feed，面試官說只做 reverse chronological feed。你應如何處理 ranking？','sd3-s02-p01','Ranking 已被明確排除，先記 out of scope，把時間用在核心 flow。',[O('a','記為 out of scope',true),O('b','仍花 15 分鐘設計 ML ranking',false,'違反 scope。'),O('c','改題目',false,'不必要。'),O('d','忽略面試官',false,'負面訊號。')]),
Q('sd3-ex-m02','medium','你估出影片 egress 遠大於 metadata traffic，HLD 最合理優先補什麼？','sd3-s04-p03','估算應推導設計；大 media egress 支持 Object Storage/CDN。',[O('a','Object Storage/CDN path',true),O('b','先把 metadata DB 切 1000 shards',false,'證據不支持。'),O('c','只優化 ORM',false,'不是主要量級。'),O('d','忽略估算',false,'浪費訊號。')]),
Q('sd3-ex-m03','medium','HLD 已畫完，面試官特別追問訊息 ordering。下一步？','sd3-s06-p01','這是明確 Deep Dive signal，應優先深入 ordering。',[O('a','深入 ordering / partition / sequence',true),O('b','改講 CDN',false,'沒有對準 feedback。'),O('c','重新問所有 FR',false,'不必要。'),O('d','結束',false,'錯過訊號。')]),
Q('sd3-ex-m04','medium','核心 API 要不要列，最好的判斷依據？','sd3-s05-p01','看 interface semantics 是否影響核心設計與 use cases。',[O('a','看是否有助於說清核心 flow',true),O('b','所有題都一定列 50 個',false,'過度。'),O('c','所有題都禁止 API',false,'過度。'),O('d','看面試官程式語言',false,'不是主要依據。')]),
Q('sd3-ex-m05','medium','面試官要求 99.999% availability，這應先影響什麼？','sd3-s03-p01','Availability target 應影響 redundancy/failure-domain/failover 設計。',[O('a','Failure isolation / redundancy / recovery',true),O('b','CSS framework',false,'無關。'),O('c','變數命名',false,'無關。'),O('d','只增加 cache TTL',false,'不足。')]),
Q('sd3-ex-m06','medium','某 query 很慢，你直接宣布要 shard。缺少哪一步？','sd3-s06-p02','應先定位 bottleneck/query plan/index/capacity，再選 sharding。',[O('a','Root cause / bottleneck validation',true),O('b','先換語言',false,'未證明。'),O('c','先加 CDN',false,'DB query 未必由 CDN 解。'),O('d','先改 UI',false,'無關。')]),
Q('sd3-ex-m07','medium','Use case walkthrough 中發現 client timeout 可能 retry 同一寫入，最自然的 Deep Dive？','sd3-s05-p03','應談 idempotency / dedup / write semantics。',[O('a','Idempotency / duplicate handling',true),O('b','CSS caching',false,'無關。'),O('c','DNS MX record',false,'無關。'),O('d','GPU selection',false,'無關。')]),
Q('sd3-ex-m08','medium','Step 1 花了 7 分鐘且已鎖定核心 scope，下一步？','sd3-s08-p01','應前進 HLD，而不是無限 clarification。',[O('a','進 Step 2 HLD',true),O('b','再問 20 分鐘 UI',false,'時間失控。'),O('c','直接 Wrap-up',false,'太早。'),O('d','結束面試',false,'錯。')]),
Q('sd3-ex-m09','medium','面試官修改 requirement，成熟的作法？','sd3-s01-p02','重新評估 assumptions 與方案。',[O('a','更新設計與 trade-off',true),O('b','拒絕更改',false,'僵硬。'),O('c','假裝沒聽到',false,'協作失敗。'),O('d','把所有元件刪掉',false,'過度反應。')]),
Q('sd3-ex-m10','medium','Wrap-up 時最值得補一個哪類指標？','sd3-s07-p02','應說如何觀測 critical SLI，例如 rate/errors/latency/backlog。',[O('a','關鍵 SLI / alert',true),O('b','頁面字體大小',false,'不是 service health。'),O('c','工程師人數',false,'不是直接 telemetry。'),O('d','Git branch 名稱',false,'無關。')]),
Q('sd3-ex-h01','hard','你設計全球檔案服務，Step 1 沒問單檔大小就直接選同步 upload through API servers。最大問題？','sd3-s02-p01','檔案大小會直接改 upload path、bandwidth、resumability 與 object storage design；這是高價值 requirement。',[O('a','漏問會改變架構的 requirement',true),O('b','API server 永遠不能 upload',false,'不是絕對。'),O('c','一定要 GraphQL',false,'無關。'),O('d','只要加 Redis 就好',false,'不解 upload bandwidth。')]),
Q('sd3-ex-h02','hard','HLD 有 15 個 services，但每個都沒有 failure/ownership boundary，如何改進最有效？','sd3-s04-p02','回到核心 flows 與 responsibilities，合併沒有獨立 scale/failure 理由的服務。',[O('a','以 flow/responsibility 重畫更簡潔的 HLD',true),O('b','再拆成 30 個',false,'加劇問題。'),O('c','只換圖示',false,'本質沒變。'),O('d','忽略',false,'可讀性與推導都有問題。')]),
Q('sd3-ex-h03','hard','估算顯示 read 100k QPS、write 100 QPS。Deep Dive 應如何受此影響？','sd3-s03-p02','Read-heavy 量級支持優先談 read path/cache/replica/hot-key，而非平均分配時間。',[O('a','優先讀路徑與 cache/replica',true),O('b','只談 write sharding',false,'量級不支持優先。'),O('c','完全不看比例',false,'浪費估算。'),O('d','先設計 UI',false,'無關。')]),
Q('sd3-ex-h04','hard','面試官說可以接受 5 秒 stale，但你仍堅持 synchronous cross-region consensus，問題？','sd3-s03-p03','你沒有利用 relaxed consistency requirement 重新評估 latency/availability trade-off。',[O('a','沒有根據 requirement 重新做 trade-off',true),O('b','Consensus 永遠錯',false,'某些場景合理。'),O('c','跨區域永遠不能同步',false,'不是絕對。'),O('d','只要改 DB 名稱',false,'無關。')]),
Q('sd3-ex-h05','hard','Deep Dive 只介紹 Redis command，沒說 cache miss/failure/invalidation，最大的缺陷？','sd3-s06-p03','變成產品介紹，沒有展示 requirement、failure、trade-off 與 system integration。',[O('a','缺少 system-level reasoning',true),O('b','Redis command 太少',false,'不是數量問題。'),O('c','一定要換 Memcached',false,'不是。'),O('d','不能談 Redis',false,'可以。')]),
Q('sd3-ex-h06','hard','某 dependency 失敗時你的 retry 會把 QPS 放大 3 倍。Wrap-up 應談什麼？','sd3-s07-p02','要談 timeout/retry budget/backoff/circuit breaker/load shedding，避免 failure amplification。',[O('a','Failure amplification 與 mitigation',true),O('b','只加更多 retry',false,'可能更糟。'),O('c','把 timeout 無限大',false,'會佔住資源。'),O('d','忽略 downstream',false,'錯。')]),
Q('sd3-ex-h07','hard','45 分鐘剩 5 分鐘，你還有 4 個未談細節。最佳策略？','sd3-s08-p01','停止無限 Deep Dive，做 wrap-up、主要風險與 recap，必要時指出若有更多時間會談哪些。',[O('a','Wrap-up 並列出 remaining priorities',true),O('b','每個再講 5 分鐘',false,'時間不夠。'),O('c','假裝時間無限',false,'時間管理失敗。'),O('d','不做 recap',false,'少掉重要訊號。')]),
Q('sd3-ex-h08','hard','面試官不同意你的 DB 選擇，最成熟的回應？','sd3-s01-p03','詢問他關心的 constraint，重新比較 alternatives/trade-offs，而不是防衛性爭辯。',[O('a','詢問 concern 並重新比較 trade-offs',true),O('b','堅持不改',false,'Rigid。'),O('c','說他錯了',false,'缺乏協作。'),O('d','停止作答',false,'不成熟。')]),
Q('sd3-ex-h09','hard','一個 HLD 能支援 current scale，但 single region 是已知風險。若 scope 明確只要求 regional service，該怎麼說？','sd3-s07-p01','承認限制並說在 current scope 下可接受；若需求升級再加入 multi-region。',[O('a','記錄 limitation 與演進條件',true),O('b','一定現在就 multi-region',false,'可能 over-engineering。'),O('c','宣稱沒有風險',false,'錯。'),O('d','刪除所有 HA',false,'過度。')]),
Q('sd3-ex-h10','hard','Framework 的最高價值不是固定答案，而是？','sd3-s08-p04','提供可重複的 decision process，在不同題目中管理 ambiguity/time/trade-off。',[O('a','可重複的決策與協作流程',true),O('b','讓所有題畫一樣',false,'不是。'),O('c','背 4 個詞',false,'太淺。'),O('d','避免 first-principles reasoning',false,'相反。')])
);
})();