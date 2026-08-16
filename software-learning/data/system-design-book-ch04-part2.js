(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_04;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
chapter.sections.push(
{
 id:'sd4-s05',order:5,title:'Token Bucket 與 Leaky Bucket：Burst 到底要不要放？',duration:'34–46 分鐘',summary:'掌握 Rate、Capacity、Burst 與 steady drain，理解 policing 與 shaping 的差異。',
 research:[
  {label:'ByteByteGo — Token bucket / Leaking bucket',url:'https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter'},
  {label:'Redis — Token bucket rate limiter',url:'https://redis.io/docs/latest/develop/use-cases/rate-limiter/redis-py/'},
  {label:'AWS API Gateway — Token bucket throttling',url:'https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-throttling.html'}
 ],
 pages:[
  {id:'sd4-s05-p01',title:'Token Bucket：平均速率受控，但允許「存下來的額度」形成 Burst',blocks:[
   {type:'diagram',nodes:[['Refill','r tokens/sec'],['Bucket','capacity B'],['Request','consume 1 token'],['Decision','token? allow : reject']],caption:'Capacity 控制最大 burst；refill rate 控制長期平均速率。'},
   {type:'code',text:'tokens = min(capacity, tokens + elapsed * refill_rate)\nif tokens >= cost:\n    tokens -= cost\n    allow\nelse:\n    reject'},
   {type:'bullets',items:['Capacity 大：允許更大瞬間 burst。','Refill rate 高：長期 throughput 更高。','可做 weighted token：昂貴 endpoint 一次消耗多個 token。','適合 traffic 平均有上限，但允許短時間突發的 API。']}
  ]},
  {id:'sd4-s05-p02',title:'Leaky Bucket：輸出像水龍頭，重點是「平滑」',blocks:[
   {type:'compare',items:[['Token Bucket','有 token 就可立即通過；允許 controlled burst。'],['Leaky Bucket policing','以固定 drain rate 接受/拒絕，burst 空間較小。'],['Leaky Bucket shaping','把 request/job 排隊後穩定輸出，超過 queue capacity 才 drop。']]},
   {type:'p',text:'如果 downstream 只能穩定吃 100 jobs/sec，而上游會瞬間 1000 jobs，shaping queue 能把 burst 攤平；但會增加 queue latency。'}
  ]},
  {id:'sd4-s05-p03',title:'Rate 與 Burst 是兩個不同參數',blocks:[
   {type:'diagram',nodes:[['Steady Rate','10 req/s'],['Bucket Capacity','100'],['Idle 10s','bucket fills'],['Sudden burst','可瞬間用掉 100'],['After burst','回到 refill pace']],caption:'「10 req/s」不代表任何 1 秒內絕不能超過 10；Token Bucket 允許累積 capacity。'},
   {type:'callout',title:'AWS API Gateway 也是 Rate + Burst',text:'AWS API Gateway 官方把 token refill rate 與 bucket capacity 分開設定，並把 throttling 視為 best-effort target；這正好說明「steady rate」與「burst」不能混為一談。'}
  ]}],
 quiz:[
  {id:'sd4-s05-q1',question:'Token Bucket 的 capacity 主要控制什麼？',reviewPageId:'sd4-s05-p01',explanation:'Capacity 決定最多可累積多少 tokens，因此控制可容許的 burst 大小。',options:[O('a','最大 burst',true),O('b','DNS TTL',false,'無關。'),O('c','DB replication factor',false,'無關。'),O('d','HTTP method',false,'無關。')]},
  {id:'sd4-s05-q2',question:'Token refill rate 主要控制？',reviewPageId:'sd4-s05-p01',explanation:'控制長期平均允許速率。',options:[O('a','長期平均 throughput',true),O('b','最大 object size',false,'無關。'),O('c','Cache eviction',false,'無關。'),O('d','TLS cipher',false,'無關。')]},
  {id:'sd4-s05-q3',question:'Downstream 只能穩定處理 100 jobs/s，但上游會 burst，若可接受排隊，較自然策略？',reviewPageId:'sd4-s05-p02',explanation:'Leaky-bucket shaping / queue 可以平滑輸出速率。',options:[O('a','Leaky bucket shaping / queue',true),O('b','取消所有限制',false,'會壓垮 downstream。'),O('c','只靠 DNS',false,'無關。'),O('d','只增加 burst capacity 無限大',false,'只會累積更大突發。')]},
  {id:'sd4-s05-q4',question:'10 req/s、capacity=100 的 Token Bucket，閒置很久後是否可能瞬間放超過 10 requests？',reviewPageId:'sd4-s05-p03',explanation:'可以；idle 後 token 累積到 capacity，能形成 controlled burst。',options:[O('a','可以，最多受 capacity 限制',true),O('b','不可能，永遠每秒剛好 10',false,'混淆 rate 與 burst。'),O('c','只有 SQL 才能',false,'無關。'),O('d','取決於 HTML',false,'無關。')]}
 ]
},
{
 id:'sd4-s06',order:6,title:'Rule Model 與 Key Design：真正的 Rate Limiter 是一套 Policy Engine',duration:'30–42 分鐘',summary:'設計規則來源、dimension、scope、priority、版本、cache 與多層 quota。',
 research:[{label:'ByteByteGo — Rate limiting rules / detailed design',url:'https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter'}],
 pages:[
  {id:'sd4-s06-p01',title:'一條 Rule 至少要回答五件事',blocks:[
   {type:'code',text:'rule_id: login-ip-v3\nscope: POST /login\ndimension: ip\nalgorithm: sliding_window_counter\nlimit: 5\nwindow: 60s\naction: reject\npriority: security'},
   {type:'bullets',items:['Who：user / IP / API key / tenant / global。','What：哪個 endpoint / operation / resource。','How much：limit、window、burst、cost。','Algorithm：fixed/sliding/token/leaky。','Action：reject、queue、degrade、challenge。']}
  ]},
  {id:'sd4-s06-p02',title:'多層 Limit 可以同時存在',blocks:[
   {type:'diagram',nodes:[['Request','tenant A / user 42'],['Per-user','100/min'],['Per-tenant','10k/min'],['Global provider','50k/min'],['Allow only if','全部 constraints 通過']],caption:'一個 request 可能同時消耗多層 quota；任何一層超限都可拒絕。'},
   {type:'p',text:'例如 SaaS LLM：每個 user 每分鐘 20 次、tenant 每分鐘 2000 次、全域 provider 每分鐘 50k 次。這能同時處理公平性、方案與第三方 capacity。'}
  ]},
  {id:'sd4-s06-p03',title:'Rules 要版本化與快取，不能每個 Request 都打設定 DB',blocks:[
   {type:'stepper',steps:[['Author','管理介面/Config repo 建立 rule。'],['Validate','檢查 syntax、衝突、unsafe limits。'],['Version','產生 immutable version。'],['Distribute','worker/pubsub 推到 regional cache。'],['Enforce','Limiter hot path 只讀 local/in-memory rule cache。']]},
   {type:'callout',title:'Control Plane vs Data Plane',text:'Rule management 是 control plane；每個 request 的 allow/deny 是 data plane。把兩者拆開能避免 rule DB 成為同步 request path。'}
  ]}],
 quiz:[
  {id:'sd4-s06-q1',question:'一條 rate limit rule 最重要要包含？',reviewPageId:'sd4-s06-p01',explanation:'至少需 scope/dimension/limit/window/algorithm/action 等 enforcement 語意。',options:[O('a','Who/What/How much/Algorithm/Action',true),O('b','只存顏色',false,'無 enforcement 語意。'),O('c','只存 user name',false,'不夠。'),O('d','只存 Redis host',false,'不是 policy。')]},
  {id:'sd4-s06-q2',question:'為什麼同一 Request 可能同時檢查 per-user 與 global quota？',reviewPageId:'sd4-s06-p02',explanation:'不同 quota 保護不同資源：user fairness 與 global downstream capacity。',options:[O('a','不同層級保護不同 constraint',true),O('b','因為一個 quota 永遠無效',false,'不是。'),O('c','為了增加 latency',false,'不是目的。'),O('d','因為 HTTP 要兩個 status code',false,'無關。')]},
  {id:'sd4-s06-q3',question:'為什麼 rule DB 不應每個 Request 同步查？',reviewPageId:'sd4-s06-p03',explanation:'會把設定儲存變 hot-path dependency，增加 latency 與 failure coupling。',options:[O('a','增加 hot-path latency 與 dependency',true),O('b','DB 不能存 config',false,'可以。'),O('c','Rule 不需要持久化',false,'通常需要。'),O('d','因為只能存在 browser',false,'錯。')]},
  {id:'sd4-s06-q4',question:'Control Plane / Data Plane 拆分的主要價值？',reviewPageId:'sd4-s06-p03',explanation:'Rule authoring/rollout 可以較慢且可靠；request enforcement 則保持快速與高可用。',options:[O('a','把管理流程與 request hot path 解耦',true),O('b','讓所有 rules 不用版本',false,'相反。'),O('c','取消 monitoring',false,'不是。'),O('d','讓 client 自行 enforcement',false,'不是。')]}
 ]
},
{
 id:'sd4-s07',order:7,title:'High-Level Architecture：Rule Cache + Limiter + Shared Counter Store',duration:'34–46 分鐘',summary:'把 Policy、Counter State、API path 與 metrics 串成完整資料流。',
 research:[
  {label:'ByteByteGo — High-level architecture / detailed design',url:'https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter'},
  {label:'Redis — Distributed rate limiter use case',url:'https://redis.io/docs/latest/develop/use-cases/rate-limiter/'}
 ],
 pages:[
  {id:'sd4-s07-p01',title:'Request Hot Path 應該短到可以放在每個 API 前面',blocks:[
   {type:'diagram',nodes:[['Client','request'],['Gateway/Limiter','identity + rule'],['Rule Cache','local/in-memory'],['Redis','counter/bucket state'],['API Server','only if allowed']],caption:'Rule 盡量 local read；shared quota state 走低延遲 store；allow 後才進昂貴 backend。'},
   {type:'bullets',items:['Rule lookup：應避免 remote DB hot path。','Counter update：需共享、低延遲、atomic。','Decision：allow / reject / queue / challenge。','Response：429 + retry information。','Metrics：allowed/blocked/latency/error/store health。']}
  ]},
  {id:'sd4-s07-p02',title:'為什麼 Redis 很常見？',blocks:[
   {type:'compare',items:[['In-memory latency','Limiter 每個 request 都查，latency 很重要。'],['TTL','Window state 可自動過期。'],['Atomic primitives','INCR、sorted sets、Lua/EVAL 可組成不同 algorithms。'],['Shared state','多 API servers 可共用 quota。']]},
   {type:'p',text:'Redis 官方也把 per-user/per-API/per-tenant distributed quota 列為典型 use case，並強調 local per-process counters 在 load balancer 後會失去全域正確性。'}
  ]},
  {id:'sd4-s07-p03',title:'不要讓 Redis 變成「單一超級熱點」',blocks:[
   {type:'stepper',steps:[['Key cardinality','不同 users/tenants 應分散 keys。'],['Hot global key','全域 counter 可能成單 key contention。'],['Sharding','依 rate-limit key hash 分 Redis shards。'],['Locality','regional limiter 儘量打 local store。'],['Batch/Approximation','某些 global soft quota 可接受 local budget + periodic reconcile。']]},
   {type:'callout',title:'Correctness vs Scale',text:'越想要「全球單一精準 counter」，跨區協調成本越高。很多 production design 會區分 hard security quota 與 soft fairness quota，選不同 consistency。'}
  ]}],
 quiz:[
  {id:'sd4-s07-q1',question:'Limiter hot path 為什麼要短？',reviewPageId:'sd4-s07-p01',explanation:'幾乎所有 API request 都會經過它，額外 latency 會直接加到 user response。',options:[O('a','它位於同步 request path',true),O('b','因為不能有任何 code',false,'仍需要 logic。'),O('c','因為 Redis 只能一行',false,'不是。'),O('d','因為 client 不會等待',false,'Client 會感受到 latency。')]},
  {id:'sd4-s07-q2',question:'Redis 適合 distributed limiter 的主要原因？',reviewPageId:'sd4-s07-p02',explanation:'共享低延遲 state、TTL 與 atomic primitives 很適合 quota algorithms。',options:[O('a','低延遲共享 state + TTL + atomic ops',true),O('b','它能取代所有 business DB',false,'不是。'),O('c','它沒有任何 failure',false,'仍會失敗。'),O('d','它完全不需 memory',false,'是 in-memory store。')]},
  {id:'sd4-s07-q3',question:'Global quota 全部寫同一 Redis key，最可能出現？',reviewPageId:'sd4-s07-p03',explanation:'Single hot key contention / shard bottleneck。',options:[O('a','Hot key / contention',true),O('b','DNS recursion',false,'無關。'),O('c','CDN cache miss',false,'無關。'),O('d','Graph cycle',false,'無關。')]},
  {id:'sd4-s07-q4',question:'全球 soft fairness quota 若可接受小誤差，哪種優化可能合理？',reviewPageId:'sd4-s07-p03',explanation:'Regional/local budget + periodic reconcile 可降低每 request 跨區同步。',options:[O('a','Regional budget + reconcile',true),O('b','每 request 全球 consensus regardless of need',false,'可能過度昂貴。'),O('c','取消所有 quota',false,'失去 fairness。'),O('d','只靠 browser counter',false,'不可信。')]}
 ]
},
{
 id:'sd4-s08',order:8,title:'Distributed Correctness：Race Condition、Atomicity、Clock 與 Duplicate',duration:'40–55 分鐘',summary:'理解多執行緒/多節點下 read-check-write 為何會超賣 quota，以及 Lua/atomic script、time source 與 idempotent decision。',
 research:[
  {label:'ByteByteGo — Rate limiter in a distributed environment',url:'https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter'},
  {label:'Redis — Rate limiter / Lua atomic operation',url:'https://redis.io/docs/latest/develop/use-cases/rate-limiter/'},
  {label:'Redis — INCR pattern and race discussion',url:'https://redis.io/docs/latest/commands/incr/'}
 ],
 pages:[
  {id:'sd4-s08-p01',title:'Read → Check → Increment 不是一個 Atomic Operation',blocks:[
   {type:'diagram',nodes:[['Req A','read count=9'],['Req B','read count=9'],['A','check 10 <= 10'],['B','check 10 <= 10'],['Both increment','actual count=11']],caption:'兩個 request 都看到舊值並判斷可通過，最後 quota 被 oversubscribe。'},
   {type:'callout',title:'Race 的根源',text:'問題不是 Redis INCR 本身不 atomic，而是你的「read + decide + update」若分成多個 round trips，就可能在中間被其他 request 插入。'}
  ]},
  {id:'sd4-s08-p02',title:'Lua / Server-side Script：把 Decision 放到 State 所在地',blocks:[
   {type:'code',text:'-- pseudo Lua\nstate = read_bucket(KEYS[1])\nrefill(state, now)\nif state.tokens >= cost then\n  state.tokens -= cost\n  write_bucket(state)\n  return ALLOW\nend\nreturn REJECT'},
   {type:'p',text:'Redis Lua script 在 server 端原子執行，可讓 check + update 變成不可被其他命令插入的單一 decision。這對 token double-spend、fixed-window expire race 都重要。'},
   {type:'callout',title:'Atomic ≠ Distributed Globally Consistent',text:'單一 Redis primary 上 atomic 不代表 multi-region replicas 之間沒有延遲或 split-brain trade-off。原子性解的是一個 state authority 內的 concurrent update。'}
  ]},
  {id:'sd4-s08-p03',title:'Time Source 也會影響演算法',blocks:[
   {type:'bullets',items:['Token Bucket/Sliding Window 都依時間計算 refill/eviction。','如果每台 app server clock drift 很大，可能產生不一致 decision。','可用 Redis/server time 或 monotonic clock strategy 降低 client clock 差異。','跨區域 global quota 若依不同 region 時鐘與 async replication，要明確接受誤差或做更強 coordination。']},
   {type:'callout',title:'面試進階點',text:'別只說「用 Redis 就解 distributed」。你還要說 authority、atomic boundary、replication lag、clock、failover 後 state continuity。'}
  ]}],
 quiz:[
  {id:'sd4-s08-q1',question:'兩個 request 都 read count=9、limit=10，再各自 check+increment，為何可能放過兩個？',reviewPageId:'sd4-s08-p01',explanation:'read-check-write 非原子，兩者都以 stale count 判斷可通過。',options:[O('a','Race condition',true),O('b','DNS cache',false,'無關。'),O('c','CDN TTL',false,'無關。'),O('d','HTTP keep-alive',false,'無關。')]},
  {id:'sd4-s08-q2',question:'Redis Lua 對 Rate Limiter 的核心價值？',reviewPageId:'sd4-s08-p02',explanation:'把 read/decision/update 放在 server 端原子執行，避免 concurrent interleaving。',options:[O('a','Atomic decision/update',true),O('b','自動 multi-region consensus',false,'Lua 不提供這個。'),O('c','取消所有 state',false,'仍需 state。'),O('d','自動處理 DDoS network layer',false,'不是。')]},
  {id:'sd4-s08-q3',question:'單一 Redis primary 上 Lua atomic，是否等於全球多區 quota 也完全強一致？',reviewPageId:'sd4-s08-p02',explanation:'不是；跨 region replication/authority/failover 仍有 consistency trade-off。',options:[O('a','不是',true),O('b','是，Lua 自動 global consensus',false,'錯。'),O('c','只要 TTL=1 就是',false,'無關。'),O('d','只要 HTTP/2 就是',false,'無關。')]},
  {id:'sd4-s08-q4',question:'Sliding Window 在多 app instances 使用各自不準的 wall clock，可能造成？',reviewPageId:'sd4-s08-p03',explanation:'不同 request 對 window/refill 的時間判斷不一致，造成 quota 誤差。',options:[O('a','Window/refill 判斷不一致',true),O('b','所有 Redis key 刪除',false,'不是必然。'),O('c','DNS 失效',false,'無關。'),O('d','資料庫自動 shard',false,'無關。')]}
 ]
}
);
})();