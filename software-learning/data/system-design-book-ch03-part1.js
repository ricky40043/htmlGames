(() => {
const chapter = window.SYSTEM_DESIGN_CHAPTER_03 = {
  id:'sd-book-03', order:3, title:'系統設計面試的框架',
  subtitle:'把開放式題目變成可控制的 45–60 分鐘設計流程：先釐清、再畫 HLD、選擇高價值 Deep Dive，最後用 Failure / Operations / Next Scale 收尾。',
  objective:'完成後，你應該能在沒有標準答案的 System Design Interview 中主動管理範圍、假設、時間與 Trade-off，讓面試官清楚看到你的判斷過程，而不是只看到一張元件圖。',
  sections:[], finalExam:[]
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const Q=(id,difficulty,question,reviewPageId,explanation,options)=>({id,difficulty,question,reviewPageId,explanation,options});
chapter.sections.push(
{
 id:'sd3-s01',order:1,title:'System Design Interview 到底在評估什麼？',duration:'22–30 分鐘',summary:'先建立正確心態：這不是元件背誦考試，而是觀察你如何合作、處理模糊、做假設與 Trade-off。',
 research:[
  {label:'ByteByteGo — A Framework For System Design Interviews',url:'https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews'},
  {label:'AWS Builders Library FAQ — 沒有唯一正確的系統設計做法',url:'https://aws.amazon.com/builders-library/faqs/'}
 ],
 pages:[
  {id:'sd3-s01-p01',title:'真正被評分的不是「你有沒有畫 Kafka」',blocks:[
   {type:'lead',text:'開放式 System Design 題沒有唯一正解。面試官更在意你能否把模糊問題轉成清楚的 requirements、解釋選擇、回應 feedback，並讓設計跟需求一起演化。'},
   {type:'compare',items:[['弱訊號','一開始就畫 CDN、Kafka、Redis、Kubernetes，但說不出哪個 requirement 需要它。'],['強訊號','先問範圍與量級，建立 baseline，再用 bottleneck / failure / SLO 推導下一個元件。']]},
   {type:'bullets',items:['問題拆解：你能否把一個「設計 X」拆成可回答的子問題。','技術判斷：能否比較多個方案而不是只背一個答案。','溝通合作：會不會確認面試官的優先級與 feedback。','成熟度：知道沒有完美架構，會主動談限制與下一步。']},
   {type:'callout',title:'面試官要的是可觀察訊號',text:'如果你心裡想很多但完全不說，面試官無法評估你的思路；如果你只說結論，也看不到推導。Think aloud 的目的是把關鍵判斷說出來，而不是不停講話。'}
  ]},
  {id:'sd3-s01-p02',title:'沒有「最好架構」，只有更符合這組限制的架構',blocks:[
   {type:'p',text:'同一個產品，在 1 萬 DAU 與 1 億 DAU、99.9% 與 99.999%、全球與單區域、強一致與 eventual consistency 下，合理架構會完全不同。'},
   {type:'diagram',nodes:[['Requirements','功能 / 規模 / SLO'],['Constraints','時間 / 團隊 / 成本 / 既有技術'],['Options','多個可行方案'],['Trade-off','可靠性 / 延遲 / 成本 / 複雜度'],['Decision','選目前最合適']],caption:'設計不是從「技術清單」開始，而是從需求與限制推到決策。'},
   {type:'callout',title:'AWS 也強調情境差異',text:'大型平台的最佳實務不一定適合每個公司；技術與最佳實務會隨需求與限制改變。面試時不要把某家大公司的架構當成唯一答案。'}
  ]},
  {id:'sd3-s01-p03',title:'常見 Red Flags：Over-engineering、僵硬、沉默',blocks:[
   {type:'stepper',steps:[['Over-engineering','需求還沒有要求 global scale，就先塞 multi-region、5 種資料庫與 event sourcing。'],['Premature deep dive','HLD 還沒形成共識，就花 10 分鐘講 B-tree 或 Kafka partition 細節。'],['Rigid answer','面試官改 requirement 後，仍堅持原本方案，不願重新評估。'],['Silent solving','長時間自己畫圖、不說假設與原因。'],['Perfect-system claim','說「這樣就沒有問題了」，沒有主動找 failure / bottleneck。']]},
   {type:'p',text:'這些行為的共同問題是：沒有把面試當成 collaborative design review。你要讓對方能在過程中修正 scope、選 Deep Dive、挑戰你的假設。'}
  ]}],
 quiz:[
  {id:'sd3-s01-q1',question:'System Design Interview 最主要想觀察哪種能力組合？',reviewPageId:'sd3-s01-p01',explanation:'除了技術知識，更重視問題拆解、處理模糊、Trade-off 與溝通合作。',options:[O('a','只看你背了多少產品架構',false,'你把開放式設計面試誤解成記憶考試。'),O('b','問題拆解、技術判斷、Trade-off 與溝通',true),O('c','只看程式碼語法',false,'這不是 coding round 的主要目標。'),O('d','只看能不能畫很多 boxes',false,'元件多不等於設計好。')]},
  {id:'sd3-s01-q2',question:'同一個 Chat 系統在 1 萬 DAU 與 1 億 DAU 應該完全相同架構嗎？',reviewPageId:'sd3-s01-p02',explanation:'設計要匹配規模、SLO、成本與限制；不同條件會產生不同合理答案。',options:[O('a','是，因為有唯一標準答案',false,'Open-ended design 沒有單一標準答案。'),O('b','否，應依 requirements 與 constraints 調整',true),O('c','只要都用 Redis 就相同',false,'單一技術不能消除其他需求差異。'),O('d','只取決於程式語言',false,'語言只是限制之一。')]},
  {id:'sd3-s01-q3',question:'一開始就畫 Kafka、Redis、Multi-region，卻還不知道使用者規模，最大的問題是？',reviewPageId:'sd3-s01-p03',explanation:'這是典型 over-engineering：技術沒有被 requirement 與 bottleneck 推導出來。',options:[O('a','元件名字太長',false,'核心不是名稱。'),O('b','技術選擇缺乏需求依據',true),O('c','Kafka 不能用於大型系統',false,'Kafka 可以有合理用途，問題是此時沒有證據。'),O('d','一定要先選 ORM',false,'不是此題重點。')]},
  {id:'sd3-s01-q4',question:'面試官把「強一致」改成「可接受數秒 eventual consistency」，最成熟的反應？',reviewPageId:'sd3-s01-p02',explanation:'Requirement 改變後應重新評估方案與 Trade-off，而不是把原設計當不可修改。',options:[O('a','重新評估資料流與可用性/延遲取捨',true),O('b','堅持原方案，因為先講的不能改',false,'僵硬是負面訊號。'),O('c','停止溝通',false,'設計面試需要合作。'),O('d','把所有 DB 刪掉',false,'需求改變不代表不需要持久化。')]}
 ]
},
{
 id:'sd3-s02',order:2,title:'Step 1：先把功能範圍問清楚，不要急著解題',duration:'28–38 分鐘',summary:'學會從模糊題目抽出核心 use cases、out-of-scope、actor 與成功條件。',
 research:[{label:'ByteByteGo — Step 1 Understand the problem and establish design scope',url:'https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews'}],
 pages:[
  {id:'sd3-s02-p01',title:'第一句不該是「我會用 Microservices」',blocks:[
   {type:'lead',text:'「設計 YouTube」可以代表上傳、轉碼、播放、推薦、搜尋、留言、直播、版權、廣告……45 分鐘不可能全部做。第一個責任是縮小 scope。'},
   {type:'bullets',items:['核心 actor 是誰？一般使用者、內容創作者、管理者、外部服務？','最重要的 2–3 個 use cases 是什麼？','哪些功能明確 out of scope？','成功條件是「能用」還是「低延遲 / 高可用 / 全球」？']},
   {type:'callout',title:'好問題會改變設計',text:'「是否需要一對一和群聊？」、「Feed 是否 ranking？」、「檔案最大多大？」都會直接改變資料模型與 HLD；這類問題比問無關緊要的 UI 細節更有價值。'}
  ]},
  {id:'sd3-s02-p02',title:'Functional Requirements：用動詞描述系統必須做到什麼',blocks:[
   {type:'stepper',steps:[['Actor','誰做這件事？'],['Action','建立、讀取、更新、刪除、傳送、搜尋、播放？'],['Object','訊息、影片、訂單、貼文、檔案？'],['Result','成功後使用者必須看到什麼？'],['Scope','這輪先做哪些，不做哪些？']]},
   {type:'code',text:'例：Design Chat\nFR1: 使用者可以傳送一對一文字訊息\nFR2: 接收者在線時可即時收到\nFR3: 離線後重新登入可讀到歷史訊息\nOut of scope: 語音/視訊、全文搜尋、群組管理'},
   {type:'p',text:'Functional Requirements 越具體，後面的 API、data model 與 flow 才能有依據。'}
  ]},
  {id:'sd3-s02-p03',title:'問到什麼程度才夠？避免把 15 分鐘花在 Clarification',blocks:[
   {type:'compare',items:[['高價值問題','會改變核心架構：規模、主要 use case、排序/一致性、media、read/write ratio、geo。'],['低價值問題','不影響核心架構：按鈕顏色、minor UI flow、非核心 edge feature。']]},
   {type:'p',text:'Step 1 的目標不是把 Product Requirement Document 問完整，而是拿到「足以畫第一版 HLD」的資訊。其餘未知可明確寫成 assumption。'},
   {type:'callout',title:'Assumption 要寫出來',text:'如果面試官說「你自己假設」，就把假設明確說出來，例如：10M DAU、read-heavy、跨區域 eventual consistency。後面設計變更時可以回頭檢查是哪個假設失效。'}
  ]}],
 quiz:[
  {id:'sd3-s02-q1',question:'被問「Design YouTube」時，第一個最重要動作？',reviewPageId:'sd3-s02-p01',explanation:'先縮小 scope，確認最重要 use cases 與非功能需求，再設計。',options:[O('a','立刻畫 20 個服務',false,'需求尚未確定。'),O('b','先確認要設計哪些核心功能',true),O('c','先選資料庫品牌',false,'Data model 都還不知道。'),O('d','先討論 CSS',false,'不是系統核心。')]},
  {id:'sd3-s02-q2',question:'哪一個最像 Functional Requirement？',reviewPageId:'sd3-s02-p02',explanation:'Functional requirement 描述系統必須支援的行為。',options:[O('a','使用者可以上傳影片並之後播放',true),O('b','99.99% availability',false,'這是 non-functional requirement。'),O('c','P99 < 200ms',false,'這是性能 SLO。'),O('d','每月成本 < 10 萬美元',false,'這是 constraint。')]},
  {id:'sd3-s02-q3',question:'面試官要你自行假設 DAU，最好的做法？',reviewPageId:'sd3-s02-p03',explanation:'明確提出合理假設並記錄，之後所有估算與設計都以此為前提。',options:[O('a','心裡想一個數字但不說',false,'面試官無法知道推導前提。'),O('b','提出並寫下假設，再繼續',true),O('c','拒絕做任何假設',false,'設計問題本來就需要 assumptions。'),O('d','永遠假設 1B DAU',false,'不符合情境。')]},
  {id:'sd3-s02-q4',question:'Clarification 的停止條件最合理是？',reviewPageId:'sd3-s02-p03',explanation:'拿到足以建立初版 HLD 的核心 scope 與 constraints 後即可前進，未知項目可標 assumptions。',options:[O('a','所有產品細節 100% 問完',false,'面試時間有限。'),O('b','足以畫第一版 HLD 且核心限制已知',true),O('c','只問一題就一定停止',false,'沒有固定題數。'),O('d','等面試官替你設計完',false,'失去主導。')]}
 ]
},
{
 id:'sd3-s03',order:3,title:'Step 1 延伸：Non-functional Requirements、規模與假設',duration:'30–42 分鐘',summary:'把「快、穩、很多人」轉成可設計的 latency、availability、consistency、traffic 與 growth assumptions。',
 research:[
  {label:'ByteByteGo — Framework / scale clarification',url:'https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews'},
  {label:'AWS Well-Architected — Evaluate trade-offs',url:'https://docs.aws.amazon.com/wellarchitected/latest/framework/perf_architecture_evaluate_trade_offs.html'},
  {label:'Google SRE Workbook — capacity planning / reliability engagement',url:'https://sre.google/workbook/engagement-model/'}
 ],
 pages:[
  {id:'sd3-s03-p01',title:'Non-functional Requirements 才真正決定大型系統怎麼長',blocks:[
   {type:'compare',items:[['Latency','P95/P99 要多快？讀與寫是否不同？'],['Availability','允許多少 downtime？是否可降級？'],['Consistency','哪些資料必須立即一致？哪些可延遲？'],['Durability','寫成功後可容忍資料遺失嗎？'],['Scale','DAU、QPS、資料量、growth、geo。']]},
   {type:'p',text:'「要很快」沒有設計價值；「Feed read P99 < 300ms，但 posting 可 1s，Feed 可數秒 eventual consistency」才會真正導出 cache、async fanout 等選擇。'}
  ]},
  {id:'sd3-s03-p02',title:'估算不是表演數學，而是用數字否定不合理架構',blocks:[
   {type:'stepper',steps:[['Traffic','DAU × actions/day → avg QPS → peak scenario。'],['Storage','objects/day × bytes × retention × overhead。'],['Bandwidth','peak QPS × payload size。'],['Concurrency','RPS × latency 粗估 in-flight requests。'],['Decision','數字是否足以要求 sharding、CDN、queue、更多 nodes？']]},
   {type:'callout',title:'Chapter 2 的能力在這裡開始被使用',text:'估算不是每題都要算十個數字。只算會改變架構決策的量級，例如「影片 egress 很大 → CDN」「metadata write QPS 其實很低 → 不急著 shard」。'}
  ]},
  {id:'sd3-s03-p03',title:'Requirement → Trade-off：不要追求所有指標同時最大化',blocks:[
   {type:'diagram',nodes:[['Requirement','例如 P99 < 100ms'],['Candidate design','Cache / replica / denormalize'],['Trade-off','staleness / cost / complexity'],['Validation','load test / SLI / metrics']],caption:'設計決策要能回答：它改善哪個 requirement？代價是什麼？怎麼驗證？'},
   {type:'p',text:'AWS Well-Architected 明確要求先理解 workload requirements，再評估性能、可靠性、安全與成本間的 Trade-off；效能改善不代表一定值得採用。'},
   {type:'callout',title:'Senior-level 語句',text:'「如果這個 SLO 是 hard requirement，我會接受額外成本做 X；如果只是 nice-to-have，我先保留簡單架構，等 metrics 顯示瓶頸再演進。」'}
  ]}],
 quiz:[
  {id:'sd3-s03-q1',question:'哪一個敘述最能直接影響系統架構？',reviewPageId:'sd3-s03-p01',explanation:'可量測的 P99 latency 與 consistency requirement 能直接約束設計。',options:[O('a','系統要很厲害',false,'不可量測。'),O('b','Feed P99 < 300ms，允許數秒 eventual consistency',true),O('c','UI 要漂亮',false,'不是此題核心架構 constraint。'),O('d','使用流行技術',false,'不是 requirement。')]},
  {id:'sd3-s03-q2',question:'為什麼做 Back-of-the-envelope estimation？',reviewPageId:'sd3-s03-p02',explanation:'目的是驗證 HLD 是否符合量級，找出哪些元件真的需要 scale。',options:[O('a','展示心算速度',false,'數學不是目的。'),O('b','用量級驗證架構決策',true),O('c','取代所有 load test',false,'粗估不能取代實測。'),O('d','一定要算到小數點五位',false,'粗估避免 false precision。')]},
  {id:'sd3-s03-q3',question:'Cache 可把 P99 從 500ms 降到 80ms，但引入資料陳舊風險，成熟回答應該？',reviewPageId:'sd3-s03-p03',explanation:'先對照 requirement 判斷 staleness 是否可接受，再做 Trade-off。',options:[O('a','Cache 一定要上',false,'沒有先看一致性要求。'),O('b','比較 latency 需求與 staleness 可接受程度',true),O('c','因為快就忽略 correctness',false,'Trade-off 可能不可接受。'),O('d','永遠不用 cache',false,'過度僵硬。')]},
  {id:'sd3-s03-q4',question:'估算得到 metadata write peak 只有 500 QPS，最不成熟的結論？',reviewPageId:'sd3-s03-p02',explanation:'500 QPS 本身不足以證明要立即切很多 shards；還要看資料量、query、SLO 與單節點能力。',options:[O('a','先驗證單庫是否已足夠',false,'這是合理判斷。'),O('b','立刻切 1000 shards，因為大型題一定要 shard',true,'你忽略量級證據。'),O('c','保留未來 partition path',false,'可作演進規劃。'),O('d','把 write QPS 記成 design assumption',false,'合理。')]}
 ]
}
);
})();