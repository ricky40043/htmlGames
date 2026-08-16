(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_04={
 id:'sd-book-04',order:4,title:'設計網路限速器',subtitle:'從需求與限流維度開始，逐步選演算法、設計共享狀態、處理分散式 race、HTTP 429、fail-open/closed 與 multi-region。',objective:'完成後，你應該能從 first principles 設計一個 low-latency、distributed、fault-tolerant 的 API Rate Limiter，並解釋 5 種常見演算法的 boundary、memory 與 burst trade-off。',sections:[],finalExam:[]
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
chapter.sections.push(
{
 id:'sd4-s01',order:1,title:'Step 1：先定義「要限制誰、限制什麼、限制到什麼程度」',duration:'28–38 分鐘',summary:'Rate Limiter 不是單一 counter；先鎖定 identity、scope、distributed requirement、latency 與 failure policy。',
 research:[
  {label:'ByteByteGo — Design A Rate Limiter / Step 1',url:'https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter'},
  {label:'Google Cloud Architecture — Rate limiting for overload protection',url:'https://docs.cloud.google.com/architecture/infra-reliability-guide/traffic-load'}
 ],
 pages:[
  {id:'sd4-s01-p01',title:'Rate Limiter 解的不是只有「惡意攻擊」',blocks:[
   {type:'lead',text:'限流的本質是控制某個 actor / resource 在某段時間內消耗系統能力的速度，保護公平性、成本與 downstream capacity。'},
   {type:'compare',items:[['Abuse / DoS','單一 client 大量打 API，避免資源飢餓。'],['Fairness','避免一個 tenant 把 shared capacity 用完。'],['Cost guardrail','第三方支付/LLM/信用查詢按次計費，限制失控成本。'],['Overload protection','當 downstream capacity 有上限時，先拒絕部分流量避免整體崩潰。']]},
   {type:'callout',title:'Rate limit ≠ DDoS 全解',text:'Application-level limiter 可處理 user/IP/API key quota，但大型 volumetric DDoS 還需要 network/WAF/CDN 等更前面的防護。'}
  ]},
  {id:'sd4-s01-p02',title:'Identity / Dimension：一個「limit key」到底長什麼樣？',blocks:[
   {type:'diagram',nodes:[['Request','user/ip/api-key/tenant'],['Key Builder','dimension + endpoint'],['Rule','limit + window'],['Counter/Bucket','shared state'],['Decision','allow / reject']],caption:'限流維度必須由產品規則決定；同一套服務可能同時存在 per-user、per-IP、per-route、global 多層限制。'},
   {type:'code',text:'user:42:POST:/messages\nip:203.0.113.5:login\ntenant:acme:llm:premium\nglobal:payment-provider'},
   {type:'bullets',items:['Per-user：公平與訂閱方案常用。','Per-IP：未登入、login abuse 常用，但 NAT/shared IP 可能誤傷。','Per-API-key / tenant：B2B quota 常用。','Global：保護昂貴 downstream 或整體容量。']}
  ]},
  {id:'sd4-s01-p03',title:'Non-functional Requirements：Limiter 自己不能變新瓶頸',blocks:[
   {type:'bullets',items:['Accuracy：超額請求要可預期地被限制。','Low latency：每個 request 都可能經過 limiter，因此同步 path 要很快。','Memory efficiency：client/key 數量可能很大。','Distributed：多 API servers 必須看到共享 quota state。','Fault tolerance：Limiter/Redis 故障不能任意拖垮整個產品。']},
   {type:'callout',title:'先問 Failure Policy',text:'Rate limiter state store 掛掉時，是 fail-open（先放行，保可用性）還是 fail-closed（先拒絕，保安全/成本）？不同 endpoint 答案可能不同。'}
  ]}],
 quiz:[
  {id:'sd4-s01-q1',question:'Rate limiting 最核心的系統目的？',reviewPageId:'sd4-s01-p01',explanation:'控制資源消耗速率，保護公平性、成本與 downstream capacity。',options:[O('a','控制某 actor/resource 的使用速率',true),O('b','取代 authentication',false,'Auth 與 quota 是不同問題。'),O('c','保證永不被 DDoS',false,'應用層 limiter 不是完整 DDoS 防護。'),O('d','把所有 request 變 async',false,'不是。')]},
  {id:'sd4-s01-q2',question:'未登入 Login API 要限制暴力嘗試，最直接可用維度？',reviewPageId:'sd4-s01-p02',explanation:'尚無 user id 時常先依 IP/device/fingerprint 等維度限制。',options:[O('a','IP/device 維度',true),O('b','已登入 user id only',false,'尚未登入可能沒有可信 user id。'),O('c','Database table name',false,'不是 client identity。'),O('d','CSS class',false,'無關。')]},
  {id:'sd4-s01-q3',question:'為何 distributed limiter 不能只用每台 API server 的 local counter？',reviewPageId:'sd4-s01-p03',explanation:'同一 client 經 LB 打到不同 instances 會各自計數，總體可繞過 quota。',options:[O('a','各 instance state 不共享，會超額放行',true),O('b','local memory 永遠很慢',false,'通常很快，問題是 correctness。'),O('c','LB 不會分流',false,'正因為會分流。'),O('d','HTTP 不支援 counter',false,'無關。')]},
  {id:'sd4-s01-q4',question:'Payment provider 每次 API 呼叫都付費，Limiter store 掛掉時哪個策略可能更合理？',reviewPageId:'sd4-s01-p03',explanation:'若成本/風險很高，可考慮 fail-closed 或 fallback conservative limit；不能一概 fail-open。',options:[O('a','視風險採 fail-closed / conservative fallback',true),O('b','任何 endpoint 永遠 fail-open',false,'可能造成無上限成本。'),O('c','刪除 quota',false,'失去保護。'),O('d','只看 UI',false,'無關。')]}
 ]
},
{
 id:'sd4-s02',order:2,title:'Step 2：Limiter 放 Client、API Server、Middleware 還是 Gateway？',duration:'24–34 分鐘',summary:'比較 enforcement point：可信度、重用、延遲、控制力與既有基礎設施。',
 research:[{label:'ByteByteGo — Where to put the rate limiter',url:'https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter'}],
 pages:[
  {id:'sd4-s02-p01',title:'Client-side 只能當「自我節流」，不能當強制規則',blocks:[
   {type:'compare',items:[['Client limiter','可改善 UX、避免自己打爆 API，但惡意 client 可改 code / forge request。'],['Server-side','可信 enforcement，但每個服務自行實作可能重複。'],['Gateway/Middleware','集中 policy、auth、quota，跨服務重用；但可能形成 critical dependency。']]},
   {type:'callout',title:'安全原則',text:'任何真正需要強制的 quota 都不能只相信 client。Client throttling 可做「善意節流」，Server/Gateway 才是權威 enforcement。'}
  ]},
  {id:'sd4-s02-p02',title:'API Gateway 適合集中哪些責任？',blocks:[
   {type:'bullets',items:['Authentication / API key extraction。','Per-route / per-client throttle。','IP allow/deny、WAF integration。','TLS termination、routing。','統一 429 / headers / metrics。']},
   {type:'p',text:'如果公司已經有 Gateway，直接掛 rate limiting 通常比每個 microservice 重寫一套更實際；但特殊商業規則可能仍需 service-level limiter。'}
  ]},
  {id:'sd4-s02-p03',title:'Placement 決策表：沒有絕對答案',blocks:[
   {type:'stepper',steps:[['Existing stack','已經有 Gateway / service mesh / Redis 嗎？'],['Rule flexibility','是否需要 endpoint-specific business rules？'],['Latency budget','每層 hop 是否可接受？'],['Failure domain','集中 limiter 掛掉會影響多少服務？'],['Ownership','誰維護 rules、rollout 與 observability？']]},
   {type:'callout',title:'面試回答方式',text:'先給預設：「我傾向 Gateway/Middleware 做共通 quota，特殊商業限制留 service 層。」再說這是基於現有 infra 與 ownership 的 trade-off，不是教條。'}
  ]}],
 quiz:[
  {id:'sd4-s02-q1',question:'為什麼 client-side limiter 不能作為唯一強制機制？',reviewPageId:'sd4-s02-p01',explanation:'Client 可被修改/偽造，不是可信 enforcement point。',options:[O('a','Client 不可信',true),O('b','Client 永遠沒有 clock',false,'不是核心。'),O('c','Client 不能發 HTTP',false,'可以。'),O('d','Client 沒有 memory',false,'有。')]},
  {id:'sd4-s02-q2',question:'公司已有 API Gateway 處理 auth/routing，新增共通 per-user quota 最自然放哪？',reviewPageId:'sd4-s02-p02',explanation:'Gateway 已在共同入口，適合集中共通 rate limit policy。',options:[O('a','Gateway/Middleware',true),O('b','每個手機 App 自己決定',false,'不可信。'),O('c','只放 DB trigger',false,'太晚且不合適。'),O('d','DNS',false,'不是 application quota。')]},
  {id:'sd4-s02-q3',question:'Gateway limiter 最大架構風險之一？',reviewPageId:'sd4-s02-p03',explanation:'集中 enforcement 可能成 critical dependency / bottleneck，需要 HA 與低 latency。',options:[O('a','成為集中式 critical dependency',true),O('b','一定無法做 per-route',false,'可以。'),O('c','一定不能用 Redis',false,'可以。'),O('d','一定會取消 auth',false,'不會。')]},
  {id:'sd4-s02-q4',question:'何時 service-level limiter 比共通 Gateway rule 更合理？',reviewPageId:'sd4-s02-p03',explanation:'當 quota 依複雜 business state / domain semantics 決定時，服務層更了解上下文。',options:[O('a','需要 domain-specific business rule',true),O('b','只是簡單 IP quota',false,'Gateway 通常可做。'),O('c','只因為 code 比較多',false,'不是理由。'),O('d','任何情況都應 service-level',false,'沒有絕對。')]}
 ]
},
{
 id:'sd4-s03',order:3,title:'Fixed Window Counter：最簡單，但 Window Boundary 會騙你',duration:'28–38 分鐘',summary:'理解固定視窗 counter、TTL、原子 INCR/EXPIRE，以及 boundary burst 為何可能接近 2 倍。',
 research:[
  {label:'ByteByteGo — Fixed window counter',url:'https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter'},
  {label:'Redis — INCR rate limiter pattern',url:'https://redis.io/docs/latest/commands/incr/'},
  {label:'Redis — 5 Rate Limiter Algorithms comparison',url:'https://redis.io/tutorials/howtos/ratelimiting/'}
 ],
 pages:[
  {id:'sd4-s03-p01',title:'每個時間窗一個 Counter',blocks:[
   {type:'diagram',nodes:[['Request','t=12:00:42'],['Window Key','user:42:12:00'],['INCR','count + 1'],['Compare','count <= limit?'],['TTL','自動清除']],caption:'固定視窗把時間切成不重疊 bucket，例如每分鐘一個 counter。'},
   {type:'code',text:'window = floor(timestamp / 60)\nkey = "rl:user:42:" + window\ncount = INCR(key)\nEXPIRE(key, 60+)\nallow = count <= 100'},
   {type:'bullets',items:['優點：簡單、O(1) state、memory 小。','適合：login attempt、一般 API quota、精度要求不極端。','缺點：邊界 burst。']}
  ]},
  {id:'sd4-s03-p02',title:'Boundary Burst：100/min 可能在 2 秒內放近 200 次',blocks:[
   {type:'diagram',nodes:[['11:59:59','99 requests'],['12:00:00','window reset'],['12:00:01','99 requests']],caption:'每個獨立 minute 都合法，但 rolling 2 秒觀察卻看到接近 198 requests。'},
   {type:'callout',title:'這不是 bug，是演算法定義',text:'Fixed Window 保證「每個固定 window 不超過 N」，不是保證「任意 rolling 60 秒都不超過 N」。若業務要求 rolling accuracy，需要 sliding family。'}
  ]},
  {id:'sd4-s03-p03',title:'Redis INCR + EXPIRE：要處理 Atomicity',blocks:[
   {type:'p',text:'如果 INCR 成功但 EXPIRE 因 client crash 沒執行，key 可能永不過期。Redis 官方文件示範可用 MULTI/EXEC 或 Lua 將 increment + expiry 組成正確操作。'},
   {type:'code',text:'local current = redis.call("INCR", KEYS[1])\nif current == 1 then\n  redis.call("EXPIRE", KEYS[1], ARGV[1])\nend\nreturn current'},
   {type:'callout',title:'原子不是只為效能',text:'Rate limiting 是 correctness path。多 request 同時 check/update 時，read → decide → write 若不是 atomic，可能 oversubscribe quota。'}
  ]}],
 quiz:[
  {id:'sd4-s03-q1',question:'Fixed Window 最大優點？',reviewPageId:'sd4-s03-p01',explanation:'State 小、邏輯簡單、counter + TTL 即可實作。',options:[O('a','簡單且 memory-efficient',true),O('b','任意 rolling window 都完全精準',false,'這是其弱點。'),O('c','完全沒有 race',false,'仍需 atomic update。'),O('d','不需要 state',false,'需要 counter。')]},
  {id:'sd4-s03-q2',question:'100 requests/min Fixed Window 為何可能在邊界短時間放近 200 次？',reviewPageId:'sd4-s03-p02',explanation:'前一 window 尾端與下一 window 開頭各有 quota，rolling 短時間會疊加。',options:[O('a','兩個固定 window 的 quota 在邊界相鄰',true),O('b','Redis INCR 會自動加 2',false,'不是。'),O('c','HTTP 會重送所有 request',false,'不是演算法原因。'),O('d','TTL 一定失效',false,'不是。')]},
  {id:'sd4-s03-q3',question:'INCR 後 client crash 導致沒 EXPIRE，最直接風險？',reviewPageId:'sd4-s03-p03',explanation:'Counter key 可能不會自動刪除，造成永久或長期錯誤限制。',options:[O('a','Key leak / quota 不會 reset',true),O('b','DNS 壞掉',false,'無關。'),O('c','所有 Redis data 清空',false,'相反。'),O('d','HTTP 變 stateful',false,'無關。')]},
  {id:'sd4-s03-q4',question:'業務要求「任意 rolling 60 秒絕不超過 100 次」，Fixed Window 是否完全符合？',reviewPageId:'sd4-s03-p02',explanation:'不符合，boundary burst 會違反 rolling-window 定義。',options:[O('a','不完全符合',true),O('b','完全符合',false,'混淆 fixed 與 rolling window。'),O('c','只要換 SQL 就符合',false,'演算法定義未變。'),O('d','只要 TTL=60 就符合',false,'邊界仍在。')]}
 ]
},
{
 id:'sd4-s04',order:4,title:'Sliding Window：用更多狀態換更準確的 Rolling Limit',duration:'32–44 分鐘',summary:'比較 Sliding Window Log 與 Sliding Window Counter：精準度、memory、運算與近似誤差。',
 research:[
  {label:'ByteByteGo — Sliding window log / counter',url:'https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter'},
  {label:'Redis — Rate limiting algorithm comparison',url:'https://redis.io/tutorials/howtos/ratelimiting/'}
 ],
 pages:[
  {id:'sd4-s04-p01',title:'Sliding Window Log：把每次 Request Timestamp 都記下來',blocks:[
   {type:'stepper',steps:[['Insert','把現在 timestamp 放入 sorted log。'],['Evict','移除 window 外的 timestamps。'],['Count','計算目前 rolling window 內有幾筆。'],['Decide','count <= limit 才 allow。']]},
   {type:'compare',items:[['優點','接近 exact rolling-window correctness。'],['缺點','每個 request 都可能佔一筆 state；高 limit / 高 cardinality 時 memory 大。']]},
   {type:'p',text:'Redis 可用 Sorted Set：score=timestamp；每次 ZREMRANGEBYSCORE 清舊資料，再 ZCARD / insert。需要 Lua/transaction 讓整個 decision atomic。'}
  ]},
  {id:'sd4-s04-p02',title:'Sliding Window Counter：用前後兩個 Window 做近似',blocks:[
   {type:'code',text:'effective = current_count\n          + previous_count * overlap_ratio'},
   {type:'p',text:'它不保存每個 request timestamp，而是假設 previous window 的 request 在時間上大致均勻，依 overlap 比例估算 rolling count。'},
   {type:'compare',items:[['Sliding Log','更精準、memory O(number of requests in window)。'],['Sliding Counter','近似但 memory 幾乎固定，適合 general-purpose API limits。']]}
  ]},
  {id:'sd4-s04-p03',title:'選演算法要先問「誤差成本」',blocks:[
   {type:'stepper',steps:[['低風險 API','少量 boundary/approximation 誤差通常可接受。'],['高價值操作','例如提款/claim reward，可能需要更嚴格 rolling semantics。'],['Cardinality','百萬 users × 高 request limit 時，log memory 可能很大。'],['Latency','每次 sorted-set cleanup/count 也有成本。']]},
   {type:'callout',title:'沒有免費精準度',text:'更準確通常代表更多 state / CPU / coordination。System Design 的問題不是「哪個 algorithm 最好」，而是「哪個誤差模型符合 requirement」。'}
  ]}],
 quiz:[
  {id:'sd4-s04-q1',question:'Sliding Window Log 為什麼較精準？',reviewPageId:'sd4-s04-p01',explanation:'它保存 rolling window 內實際 request timestamps，而不是用固定邊界或近似。',options:[O('a','保存實際 timestamps',true),O('b','完全不存 state',false,'相反。'),O('c','只用一個整數',false,'那更像 fixed counter。'),O('d','因為 HTTP 429',false,'無關。')]},
  {id:'sd4-s04-q2',question:'Sliding Window Log 的主要代價？',reviewPageId:'sd4-s04-p01',explanation:'高請求量/高 cardinality 下需要保存大量 timestamps，memory/operations 較高。',options:[O('a','Memory 與 sorted-set 操作成本',true),O('b','完全不精準',false,'它較精準。'),O('c','不能 distributed',false,'可配 shared store。'),O('d','不能做 per-user',false,'可以。')]},
  {id:'sd4-s04-q3',question:'Sliding Window Counter 為什麼是近似？',reviewPageId:'sd4-s04-p02',explanation:'它用 previous/current counters 與 overlap 比例推估，不知道 previous requests 的真實時間分布。',options:[O('a','不知道 previous window 內實際 timestamp 分布',true),O('b','因為沒有 clock',false,'仍依時間。'),O('c','因為不使用 counter',false,'正是使用 counters。'),O('d','因為一定用 SQL',false,'無關。')]},
  {id:'sd4-s04-q4',question:'提款 API 的 rolling quota 若誤差代價很高，較值得考慮？',reviewPageId:'sd4-s04-p03',explanation:'可選較精準的 sliding log 或更強 correctness policy，接受較高 state/cost。',options:[O('a','更精準的 rolling-window 方法',true),O('b','只因 memory 小永遠選 fixed window',false,'忽略 correctness。'),O('c','取消 limiter',false,'失去保護。'),O('d','只在 client 限制',false,'不可信。')]}
 ]
}
);
})();