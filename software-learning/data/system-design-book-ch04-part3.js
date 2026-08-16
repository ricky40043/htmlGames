(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_04;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const Q=(id,difficulty,question,reviewPageId,explanation,options)=>({id,difficulty,question,reviewPageId,explanation,options});
chapter.sections.push(
{
 id:'sd4-s09',order:9,title:'超限與故障策略：429、Retry-After、Drop、Queue、Fail-open / Fail-closed',duration:'34–48 分鐘',summary:'Limiter 的 allow/deny 只是第一步；真正 production design 還要定義 client contract 與 limiter 自己故障時怎麼辦。',
 research:[
  {label:'ByteByteGo — Exceeding the rate limit / headers',url:'https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter'},
  {label:'AWS Well-Architected — Throttle requests',url:'https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_mitigate_interaction_failure_throttle_requests.html'},
  {label:'Redis Token Bucket — 429 / Retry-After example',url:'https://redis.io/docs/latest/develop/use-cases/rate-limiter/redis-py/'}
 ],
 pages:[
  {id:'sd4-s09-p01',title:'HTTP 429：被限流不是 500',blocks:[
   {type:'lead',text:'超過 quota 是「client request rate 超出 policy」，不是 server internal error。對 HTTP API，常用 429 Too Many Requests，並搭配 remaining/reset/retry 資訊讓 client 能正確退避。'},
   {type:'code',text:'HTTP/1.1 429 Too Many Requests\nRetry-After: 12\nX-RateLimit-Limit: 100\nX-RateLimit-Remaining: 0'},
   {type:'callout',title:'Client 也要設計',text:'好的 client 會 respect Retry-After、exponential backoff、避免 retry storm。Rate limiter 不是只有 server-side component，也是一份 client/server contract。'}
  ]},
  {id:'sd4-s09-p02',title:'Reject、Queue、Degrade：超限後不一定只有丟掉',blocks:[
   {type:'compare',items:[['Reject','Login/API abuse：直接 429，最清楚。'],['Queue','可延後的 jobs/order sync：保存後晚點處理，但要控制 backlog。'],['Degrade','高成本功能降級，例如不跑推薦/AI，只回基本結果。'],['Challenge','Security case 可要求 CAPTCHA / stronger auth。']]},
   {type:'p',text:'是否 queue 取決於業務語意。把所有超額 request 都排隊可能只是把 overload 從同步 path 搬成 queue backlog；如果 arrival rate 長期高於 service rate，queue 最終仍會爆。'}
  ]},
  {id:'sd4-s09-p03',title:'Limiter 自己掛掉：Fail-open 還是 Fail-closed？',blocks:[
   {type:'diagram',nodes:[['Limiter Store Failure','Redis timeout'],['Policy','endpoint risk'],['Fail-open','availability first'],['Fail-closed','security/cost first'],['Fallback','local conservative budget']],caption:'Failure policy 應由 endpoint risk 決定，而不是全平台一刀切。'},
   {type:'bullets',items:['Search/read API：可能 fail-open，避免整站因 limiter 掛掉。','Payment/expensive provider：可能 fail-closed 或 local conservative budget。','Login abuse：安全風險高，fail-open 可能讓 brute-force 失控。','任何策略都要有 alert 與短 timeout，避免 limiter timeout 把所有 request latency 拉長。']}
  ]}],
 quiz:[
  {id:'sd4-s09-q1',question:'API 因 quota 超限，最典型 HTTP status？',reviewPageId:'sd4-s09-p01',explanation:'429 Too Many Requests。',options:[O('a','429',true),O('b','200',false,'會誤導 client 已成功。'),O('c','404',false,'不是 resource not found。'),O('d','500',false,'不是 server internal error。')]},
  {id:'sd4-s09-q2',question:'為何 Retry-After 有價值？',reviewPageId:'sd4-s09-p01',explanation:'告訴 client 何時再試，降低無意義 retry storm。',options:[O('a','幫助 client 合理退避',true),O('b','讓 quota 變無限',false,'不會。'),O('c','取代 auth',false,'不同責任。'),O('d','自動修 Redis',false,'不是。')]},
  {id:'sd4-s09-q3',question:'所有超限 request 都丟進 Queue，為何不一定安全？',reviewPageId:'sd4-s09-p02',explanation:'若 arrival rate 長期高於 processing rate，backlog 仍會無限增長並耗盡資源。',options:[O('a','Queue 不能消除長期容量差',true),O('b','Queue 永遠不能存 request',false,'可以。'),O('c','Queue 一定 exactly-once',false,'不是。'),O('d','Queue 不支援 async',false,'正是 async。')]},
  {id:'sd4-s09-q4',question:'Limiter store 掛掉時是否應全平台一律 fail-open？',reviewPageId:'sd4-s09-p03',explanation:'不應；要依 endpoint security/cost/availability risk 決定，甚至使用 local fallback budget。',options:[O('a','不應，一定要依風險分類',true),O('b','應，任何情況都放行',false,'高成本/安全 API 可能災難。'),O('c','應，任何情況都拒絕',false,'會讓 limiter 成全站 SPOF。'),O('d','只看 Redis 版本',false,'不是政策依據。')]}
 ]
},
{
 id:'sd4-s10',order:10,title:'Multi-region、Performance、Monitoring 與 Wrap-up',duration:'36–50 分鐘',summary:'完成全球化 limiter：regional locality、global quota trade-off、hot keys、SLO 與監控，最後整理硬/軟限流。',
 research:[
  {label:'ByteByteGo — Performance optimization / monitoring / wrap up',url:'https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter'},
  {label:'Redis — Distributed rate limiter',url:'https://redis.io/docs/latest/develop/use-cases/rate-limiter/'},
  {label:'AWS API Gateway — Token bucket throttling',url:'https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html'}
 ],
 pages:[
  {id:'sd4-s10-p01',title:'Regional Limiter：先把每個 Request 留在附近',blocks:[
   {type:'diagram',nodes:[['User','Taiwan'],['Edge/Gateway','nearest region'],['Regional Limiter','local rules/state'],['API','regional backend'],['Async Global','quota sync/reconcile']],caption:'每個 request 都跨 ocean 去查一個 global Redis 會把 limiter latency 直接加到 API。'},
   {type:'p',text:'如果 quota 可以分 regional budget，local decision 可以降低 latency 與跨區 dependency；但會帶來「全球 quota 近似」問題。若是 hard global quota，就要付更高 coordination cost。'}
  ]},
  {id:'sd4-s10-p02',title:'Monitoring：不能只看「Blocked Count」',blocks:[
   {type:'bullets',items:['Decision latency P50/P95/P99。','Allow / block rate，依 rule / tenant / endpoint 分解。','Redis errors / timeouts / replication lag。','Hot key / shard skew。','Rule distribution version lag。','429 後 client retry rate。','Fail-open / fail-closed fallback 次數。']},
   {type:'callout',title:'錯誤 rule 也是事故',text:'如果某次 rule rollout 把 100 req/min 誤改成 1 req/min，Redis 完全健康但產品會大面積 429。因此 rule version、block-rate anomaly 與 rollback 都要被觀測。'}
  ]},
  {id:'sd4-s10-p03',title:'Hard vs Soft Limit：最後把 Guarantees 說清楚',blocks:[
   {type:'compare',items:[['Hard limit','安全/金流等需要嚴格上限；更強 consistency，故障時可能 fail-closed。'],['Soft limit','Fairness/overload protection 可接受小誤差；可換取更低 latency / 更高 availability。'],['Best-effort throttle','雲 Gateway 常把 throttle 視為 target；不能把它當絕對 billing/security hard cap。']]},
   {type:'callout',title:'Chapter 4 Wrap-up',text:'完整答案應涵蓋：scope → placement → algorithm → policy/rule → Redis state → atomicity → 429/failure → multi-region → monitoring。只講 Token Bucket 大約只完成三分之一。'}
  ]}],
 quiz:[
  {id:'sd4-s10-q1',question:'為何全球 API 不一定每次都查單一遠端 global Redis？',reviewPageId:'sd4-s10-p01',explanation:'跨區 latency 與 dependency 會直接進同步 request path；可依 hard/soft quota 選 regional budget 或更強 coordination。',options:[O('a','跨區查詢會增加 latency 與 failure coupling',true),O('b','Redis 不能跨網路',false,'可以。'),O('c','HTTP 不支援全球服務',false,'錯。'),O('d','因為 token 不可序列化',false,'無關。')]},
  {id:'sd4-s10-q2',question:'Limiter monitoring 為什麼要看 rule version lag？',reviewPageId:'sd4-s10-p02',explanation:'不同 instances 使用不同版本 rules 會導致不一致 enforcement。',options:[O('a','避免不同節點執行不同 policy',true),O('b','因為 Redis key 一定等於 rule version',false,'不是必然。'),O('c','只為 UI',false,'是 correctness/ops。'),O('d','因為 HTTP 要版本',false,'無關。')]},
  {id:'sd4-s10-q3',question:'Soft global quota 最合理的設計方向之一？',reviewPageId:'sd4-s10-p03',explanation:'可接受小誤差時，用 regional budget/local decision 換低 latency 與 availability。',options:[O('a','Regional budget + async reconcile',true),O('b','每 request 強制跨全球 consensus',false,'可能過度。'),O('c','完全不 limit',false,'失去目的。'),O('d','只靠 client',false,'不可信。')]},
  {id:'sd4-s10-q4',question:'AWS API Gateway throttle 為何不能直接當成財務 hard cap？',reviewPageId:'sd4-s10-p03',explanation:'官方說 throttles/quotas 是 best-effort targets，可能被超出；hard billing/security constraint 要更強 enforcement。',options:[O('a','Managed throttle 是 best-effort target，不是絕對 ceiling',true),O('b','AWS 不支援 429',false,'支援。'),O('c','Token Bucket 沒有 capacity',false,'有。'),O('d','API Gateway 不限流',false,'會限流。')]}
 ]
}
);
chapter.finalExam.push(
Q('sd4-ex-e01','easy','Rate Limiter 主要控制？','sd4-s01-p01','控制 actor/resource 在時間內的使用速率。',[O('a','使用速率',true),O('b','DNS naming',false,'無關。'),O('c','HTML rendering',false,'無關。'),O('d','DB schema migration',false,'不是主要目的。')]),
Q('sd4-ex-e02','easy','未登入 Login API 常用哪個限流 identity？','sd4-s01-p02','常用 IP/device 等。',[O('a','IP/device',true),O('b','已登入 user id only',false,'可能不存在。'),O('c','Table name',false,'不是 client identity。'),O('d','CSS id',false,'無關。')]),
Q('sd4-ex-e03','easy','Fixed Window 的典型缺點？','sd4-s03-p02','Window boundary burst。',[O('a','Boundary burst',true),O('b','完全不能 TTL',false,'可以。'),O('c','不能 O(1) state',false,'通常可以。'),O('d','不支援 counter',false,'正是 counter。')]),
Q('sd4-ex-e04','easy','Sliding Window Log 的主要優點？','sd4-s04-p01','Rolling window 較精準。',[O('a','Rolling window 較精準',true),O('b','完全零 memory',false,'相反。'),O('c','不需要 timestamp',false,'需要。'),O('d','不需要 shared state',false,'distributed 仍要。')]),
Q('sd4-ex-e05','easy','Token Bucket 的 refill rate 控制？','sd4-s05-p01','長期平均速率。',[O('a','長期平均 rate',true),O('b','最大 burst only',false,'capacity 控 burst。'),O('c','DB size',false,'無關。'),O('d','TLS timeout',false,'無關。')]),
Q('sd4-ex-e06','easy','Token Bucket capacity 控制？','sd4-s05-p01','最大可累積 token，也就是 burst。',[O('a','Burst size',true),O('b','平均 rate only',false,'refill 控。'),O('c','Rule version',false,'無關。'),O('d','HTTP code',false,'無關。')]),
Q('sd4-ex-e07','easy','Redis 在 limiter 中最典型角色？','sd4-s07-p02','低延遲共享 quota state。',[O('a','Shared low-latency state',true),O('b','取代所有 source DB',false,'不是。'),O('c','DNS server',false,'不是。'),O('d','Frontend store',false,'不是。')]),
Q('sd4-ex-e08','easy','超限 API 最典型 HTTP status？','sd4-s09-p01','429 Too Many Requests。',[O('a','429',true),O('b','404',false,'不是。'),O('c','201',false,'不是。'),O('d','301',false,'不是。')]),
Q('sd4-ex-e09','easy','Client-side limiter 最大問題？','sd4-s02-p01','Client 不可信，不能作唯一 enforcement。',[O('a','Client 可被修改/forge',true),O('b','Client 沒 CPU',false,'有。'),O('c','Client 不能計時',false,'可以。'),O('d','Client 不能 HTTP',false,'可以。')]),
Q('sd4-ex-e10','easy','Distributed limiter local counter 的主要問題？','sd4-s01-p03','多 instances 各算各的，總 quota 會被繞過。',[O('a','State 不共享',true),O('b','Memory 一定慢',false,'不是。'),O('c','LB 不會分流',false,'會。'),O('d','Counter 不支援整數',false,'錯。')]),
Q('sd4-ex-m01','medium','100/min Fixed Window 在 59 秒與下一分鐘 1 秒各送 100 次，主要現象？','sd4-s03-p02','Boundary burst，rolling 短時間可能近 200。',[O('a','Boundary burst',true),O('b','Token refill',false,'不是 token bucket。'),O('c','Clock impossible',false,'不是。'),O('d','Exactly-once',false,'無關。')]),
Q('sd4-ex-m02','medium','需要允許短暫 burst 但控制長期平均 rate，優先選？','sd4-s05-p01','Token Bucket。',[O('a','Token Bucket',true),O('b','Strict leaky shaping only',false,'會抑制 burst。'),O('c','No limiter',false,'無控制。'),O('d','DNS round robin',false,'不是。')]),
Q('sd4-ex-m03','medium','要求任意 rolling 60 秒很精準，且每 user limit 小，優先？','sd4-s04-p01','Sliding Window Log 精準度高，memory 在小 limit 下可接受。',[O('a','Sliding Window Log',true),O('b','Fixed Window',false,'boundary error。'),O('c','Client counter',false,'不可信。'),O('d','Random allow',false,'無 correctness。')]),
Q('sd4-ex-m04','medium','Limiter rule DB 每 request 都查，主要架構問題？','sd4-s06-p03','把 control plane storage 變 hot-path dependency。',[O('a','Control plane 進同步 hot path',true),O('b','DB 不能讀',false,'可以，但不合適。'),O('c','Rule 不需持久化',false,'通常需要。'),O('d','Redis 不能 cache',false,'可以。')]),
Q('sd4-ex-m05','medium','同時有 per-user 100/min 與 global provider 50k/min，request 怎麼判？','sd4-s06-p02','兩層 quota 都要通過。',[O('a','所有 applicable limits 都通過才 allow',true),O('b','只看 user',false,'會超 global。'),O('c','只看 global',false,'失去 fairness。'),O('d','隨機選一個',false,'不正確。')]),
Q('sd4-ex-m06','medium','兩個 request 同時 read count=9、limit=10，再各 increment，為何可能超額？','sd4-s08-p01','Read-check-write race。',[O('a','Non-atomic read-check-write',true),O('b','TTL 太長 only',false,'不是。'),O('c','HTTP pipelining',false,'不是根源。'),O('d','DNS race',false,'無關。')]),
Q('sd4-ex-m07','medium','Redis Lua script 主要解哪個問題？','sd4-s08-p02','在單一 authority 內 atomic check/update。',[O('a','Concurrent atomic decision/update',true),O('b','全球 consensus',false,'不是。'),O('c','DDoS network filtering',false,'不是。'),O('d','Rule authoring UI',false,'不是。')]),
Q('sd4-ex-m08','medium','429 後 client 立刻無限 retry，可能造成？','sd4-s09-p01','Retry storm，加劇 overload。',[O('a','Retry storm',true),O('b','自動提高 quota',false,'不會。'),O('c','降低流量',false,'相反。'),O('d','修復 Redis',false,'不會。')]),
Q('sd4-ex-m09','medium','Limiter store 故障，Search API 可能選 fail-open，但 Payment API 可能 fail-closed，原因？','sd4-s09-p03','Endpoint 的 availability/security/cost risk 不同。',[O('a','Risk profile 不同',true),O('b','Search 沒有 HTTP',false,'有。'),O('c','Payment 不需 availability',false,'仍需要，只是 trade-off。'),O('d','Redis 只支援 payment',false,'錯。')]),
Q('sd4-ex-m10','medium','全球 soft quota 如何降低跨區 latency？','sd4-s10-p01','Regional budgets/local decisions + reconcile。',[O('a','Regional budget + reconcile',true),O('b','每 request 打單一遠端 state',false,'latency 高。'),O('c','取消 quota',false,'失去目的。'),O('d','只靠 device',false,'不可信。')]),
Q('sd4-ex-h01','hard','某 tenant quota 是 1000/min，但 100 個 API servers 各 local 限 1000/min。最大實際風險？','sd4-s01-p03','總體可能放到約 100x quota，因 state 沒共享。',[O('a','Global quota 被嚴重 oversubscribe',true),O('b','會變成 10/min',false,'相反。'),O('c','一定剛好 1000',false,'沒有共享。'),O('d','DNS 會拒絕',false,'無關。')]),
Q('sd4-ex-h02','hard','Fixed Window Redis 實作中 INCR 成功但 EXPIRE 永遠沒執行，可能造成？','sd4-s03-p03','Key 不過期，client 可能被長期錯誤限流。',[O('a','Counter key leak / 不 reset',true),O('b','Quota 自動變大',false,'不是。'),O('c','所有 key 清空',false,'相反。'),O('d','Token Bucket refill',false,'不是。')]),
Q('sd4-ex-h03','hard','高價值提款 API 需要 strict rolling quota，但百萬 users 每人 limit=100k/min。最大 trade-off？','sd4-s04-p03','Sliding log 精準但 memory 巨大；需要重新評估算法/aggregate state/業務 limit。',[O('a','Accuracy 與 memory/state 成本衝突',true),O('b','只要 log 就零成本',false,'錯。'),O('c','Fixed window 會更精準',false,'不是。'),O('d','Client limiter 即可',false,'不可信。')]),
Q('sd4-ex-h04','hard','Token Bucket rate=10/s capacity=100，某 client 長時間 idle 後瞬間 80 requests，是否可全部通過？','sd4-s05-p03','若 bucket 已滿且每 request cost=1，可以，burst 受 capacity 100 限制。',[O('a','可以',true),O('b','不可以，任何秒最多 10',false,'混淆 steady rate 與 capacity。'),O('c','一定只能 1',false,'錯。'),O('d','只有 fixed window 可 burst',false,'錯。')]),
Q('sd4-ex-h05','hard','全球 hard financial quota 要求任何時刻絕不超額，regional async budgets 是否天然足夠？','sd4-s10-p03','不一定；async reconcile 有誤差，hard quota 可能需要更強 coordination/central authority。',[O('a','不一定，需要更強 consistency/coordination',true),O('b','一定足夠',false,'會有同步延遲。'),O('c','只要 clock 一樣就足夠',false,'state 仍分散。'),O('d','只要 TTL 很短',false,'不能保證全球 hard cap。')]),
Q('sd4-ex-h06','hard','Rule rollout v7 只到 60% limiter nodes，最可能現象？','sd4-s10-p02','同一 request identity 因打到不同 nodes 可能收到不同 allow/deny decision。',[O('a','Policy enforcement 不一致',true),O('b','所有 request 都 200',false,'不一定。'),O('c','Redis 自動修 rule',false,'不是。'),O('d','DNS 自動版本化',false,'不是。')]),
Q('sd4-ex-h07','hard','Limiter Redis timeout=2s，而 API SLO P99=300ms，最大設計問題？','sd4-s09-p03','Limiter dependency timeout 本身已超過 API latency budget，故障會把整站拖慢。',[O('a','Limiter timeout 破壞整體 latency budget',true),O('b','2s 一定很快',false,'相對 SLO 太慢。'),O('c','只需更多 CPU',false,'不一定。'),O('d','429 會自動解',false,'Store timeout 尚未 decision。')]),
Q('sd4-ex-h08','hard','Global counter key 成 Redis hot key，哪個 mitigation 最符合 soft quota？','sd4-s07-p03','可拆 regional/local budgets 或 sharded counters + approximate aggregation。',[O('a','拆 budget / shard state 並接受小誤差',true),O('b','所有流量仍打單 key',false,'沒有解。'),O('c','把 key 名稱變長',false,'不解 contention。'),O('d','加 CDN',false,'不是 counter path。')]),
Q('sd4-ex-h09','hard','Queue 內 rate-limited jobs 的 arrival 2000/s、consumer 1000/s，長期結果？','sd4-s09-p02','Backlog 每秒淨增加約 1000，Queue 只是延後 overload。',[O('a','Backlog 持續增加',true),O('b','自動穩定為 0',false,'service rate 不足。'),O('c','Queue 會提高 consumer speed',false,'不會自動。'),O('d','所有 jobs 消失',false,'不是。')]),
Q('sd4-ex-h10','hard','完整 Rate Limiter 面試答案最關鍵的 Deep Dive 組合？','sd4-s10-p03','Algorithm trade-off + distributed state/atomicity + failure/client contract。',[O('a','Algorithm + distributed correctness + failure policy',true),O('b','只背 Token Bucket 圖',false,'太淺。'),O('c','只說 Redis',false,'缺 policy/algorithm/failure。'),O('d','只說 429',false,'只是一小段。')])
);
})();