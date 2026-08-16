(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_05;if(!chapter)return;
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
const Q=(id,difficulty,question,reviewPageId,explanation,options)=>({id,difficulty,question,reviewPageId,explanation,options});
chapter.sections.push(
{
 id:'sd5-s05',order:5,title:'Basic Ring 的兩個問題：Partition 不均與 Key 分布不均',duration:'30–42 分鐘',summary:'理解「用了 Ring」仍不等於平均；node token 間距與 key distribution 都可能讓單一節點承擔過多資料。',
 research:[{label:'ByteByteGo — Two issues in the basic approach',url:'https://bytebytego.com/courses/system-design-interview/design-consistent-hashing'}],
 pages:[
  {id:'sd5-s05-p01',title:'問題一：Physical Nodes 在 Ring 上的間距可能很不平均',blocks:[
   {type:'diagram',nodes:[['S0','token 5'],['S1','token 10'],['S2','token 80'],['S3','token 90']],caption:'S2 前面的 range 很大，可能要承擔遠多於其他 nodes 的 key space。'},
   {type:'p',text:'如果每個 physical node 只有一個 token，隨機 token placement 容易產生大小差很多的 partitions；server add/remove 後 imbalance 也可能更明顯。'}
  ]},
  {id:'sd5-s05-p02',title:'問題二：Key Hash 分布也可能造成 Load Skew',blocks:[
   {type:'p',text:'即使 token ranges 看起來平均，實際 key frequency / access pattern 仍可能不平均。某些 range 可能 key 特別多，或某些 keys 是熱門內容，讓 owner node 過載。'},
   {type:'compare',items:[['Data skew','某個 range 裡 key 數量 / bytes 明顯更多。'],['Traffic skew','key 數量正常，但其中幾個 hot keys QPS 超高。'],['Capacity skew','不同 physical nodes CPU/RAM/SSD 能力不同。']]},
   {type:'callout',title:'平均 Key Space ≠ 平均 Real Load',text:'Consistent hashing 最容易平衡的是 token/key-space ownership，不保證每個 key 大小與 request frequency 完全一樣。'}
  ]},
  {id:'sd5-s05-p03',title:'Hot Key：Consistent Hashing 不能把「同一個 Key」拆成很多份',blocks:[
   {type:'diagram',nodes:[['celebrity:123','1 hot key'],['H(key)','single token'],['Owner','one primary range'],['QPS','all hits concentrate']],caption:'如果真正問題是一個 key 特別熱，單純更均勻的 ring 仍會把它導到同一個 owner。'},
   {type:'bullets',items:['可用 replication/read replicas 分散讀。','在 application 層拆 hot key / fanout / precompute。','加 local cache / CDN。','針對 hot tenant 做 dedicated partition / isolation。']}
  ]}],
 quiz:[
  {id:'sd5-s05-q1',question:'只有一個 token/physical node 的 basic ring，為何可能資料不均？',reviewPageId:'sd5-s05-p01',explanation:'Node token 間距不同會產生大小不同的 ownership ranges。',options:[O('a','Token ranges 大小不均',true),O('b','Ring 一定平均',false,'正是本節反例。'),O('c','Hash function 不存在',false,'存在。'),O('d','所有 key 相同',false,'不是必要條件。')]},
  {id:'sd5-s05-q2',question:'Ring ranges 很平均，但某 celebrity key QPS 極高，這屬於？',reviewPageId:'sd5-s05-p02',explanation:'Traffic skew / hot key，而非單純 token imbalance。',options:[O('a','Traffic skew / hot key',true),O('b','Modulo rehash',false,'不是。'),O('c','DNS issue',false,'無關。'),O('d','Clock drift',false,'無關。')]},
  {id:'sd5-s05-q3',question:'Consistent hashing 是否能自動把同一個 hot key 的流量平均到所有 nodes？',reviewPageId:'sd5-s05-p03',explanation:'不能；同一 key 通常仍有固定 owner，需要 replication/cache/application mitigation。',options:[O('a','不能',true),O('b','能，這就是 ring 的全部目的',false,'混淆 key-space balance 與 hot-key replication。'),O('c','只要 SHA-1 就能',false,'不會。'),O('d','只要 vnode=1 就能',false,'不會。')]},
  {id:'sd5-s05-q4',question:'Data skew、Traffic skew、Capacity skew 的共同點？',reviewPageId:'sd5-s05-p02',explanation:'都會讓 token-space 看似合理但實際負載不均，需要額外 capacity/routing 策略。',options:[O('a','都可能造成實際負載不均',true),O('b','都等於 hash collision',false,'不是。'),O('c','都由 DNS 造成',false,'不是。'),O('d','都只發生在 Cache',false,'也會在 datastore。')]}
 ]
},
{
 id:'sd5-s06',order:6,title:'Virtual Nodes：一台實體機在 Ring 上放很多 Tokens',duration:'36–50 分鐘',summary:'理解 vnode 如何降低 partition variance、支援 incremental scaling 與 heterogeneous capacity，並掌握 vnode 太多的 operational cost。',
 research:[
  {label:'ByteByteGo — Virtual nodes',url:'https://bytebytego.com/courses/system-design-interview/design-consistent-hashing'},
  {label:'Apache Cassandra — Multiple Tokens per Physical Node (vnodes)',url:'https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html'},
  {label:'Apache Cassandra — Production recommendations / tokens',url:'https://cassandra.apache.org/doc/stable/cassandra/getting-started/production.html'}
 ],
 pages:[
  {id:'sd5-s06-p01',title:'一個 Physical Node → 多個 Virtual Tokens',blocks:[
   {type:'diagram',nodes:[['Server A','A1 / A2 / A3 / A4'],['Server B','B1 / B2 / B3 / B4'],['Ring','interleaved tokens'],['Ranges','many small pieces']],caption:'Physical node 不再只吃一大段，而是擁有散布在 ring 上的多個小 ranges。'},
   {type:'p',text:'Vnode 越多，單一 physical node 的負載是很多小 partitions 的總和；隨機波動會被平均，distribution variance 通常下降。'}
  ]},
  {id:'sd5-s06-p02',title:'為什麼新增一台 Physical Node 會變得更平滑？',blocks:[
   {type:'stepper',steps:[['New node joins','配置多個新 vnode tokens。'],['Take small ranges','從多個既有 nodes 各接一小段。'],['Parallel streaming','資料可從多個 peers 搬移。'],['Balanced result','不必只從單一鄰居拿一大塊。']]},
   {type:'p',text:'Cassandra 官方指出，multiple tokens 讓新增 node 能從不同 ring members 取得近似等量資料；移除 node 時也能把 load 比較平均地分散出去。'}
  ]},
  {id:'sd5-s06-p03',title:'Weighted Capacity：更強的機器可以擁有更多 Vnodes',blocks:[
   {type:'compare',items:[['Equal hardware','每台配置相近 token count / range weight。'],['Bigger server','可給更多 tokens / ownership weight。'],['Smaller server','給較少 ownership，避免過載。']]},
   {type:'callout',title:'不是所有系統都用「vnode 數量」表達權重',text:'具體實作可能用 weighted tokens、partition count、load-aware placement；核心思想是讓 ownership 比例反映 capacity。'}
  ]},
  {id:'sd5-s06-p04',title:'Vnodes 越多越好嗎？不是',blocks:[
   {type:'bullets',items:['Token metadata 更多。','每個 node 與更多 peers 成鄰居，failure combinations 更複雜。','Repair / maintenance 需要處理更多離散 ranges。','Range scan / maintenance coordination 可能更重。']},
   {type:'p',text:'Cassandra 官方明確指出 multiple tokens 有 availability 與 maintenance trade-offs，因此後續版本加入 deterministic token allocator，希望用更少 tokens 仍保持 balance。'},
   {type:'callout',title:'面試加分',text:'說「用 100–200 vnodes」不是萬用答案；應說 vnode count 是 balance、metadata、repair、failure-domain 的 tuning parameter。'}
  ]}],
 quiz:[
  {id:'sd5-s06-q1',question:'Virtual Node 的核心概念？',reviewPageId:'sd5-s06-p01',explanation:'一個 physical node 在 ring 上擁有多個 token positions/ranges。',options:[O('a','一台實體機對應多個 ring tokens',true),O('b','每個 vnode 都是一台實體機',false,'Vnode 是 logical token。'),O('c','取消 hash',false,'仍使用 hash/token。'),O('d','把 ring 變 queue',false,'不是。')]},
  {id:'sd5-s06-q2',question:'Vnodes 為何有助新增 node 時平衡資料搬移？',reviewPageId:'sd5-s06-p02',explanation:'新 node 可從多個既有 nodes 各接手多個小 ranges。',options:[O('a','可從多個 peers 接小 ranges',true),O('b','完全不搬資料',false,'仍需搬。'),O('c','只從一個 neighbor 搬更大塊',false,'正好相反。'),O('d','因為 hash 不再使用',false,'仍使用。')]},
  {id:'sd5-s06-q3',question:'一台 server 容量是其他機器 2 倍，合理做法之一？',reviewPageId:'sd5-s06-p03',explanation:'給它較高 ownership weight / 更多 tokens，讓 data/load 比例匹配 capacity。',options:[O('a','給更多 ownership weight',true),O('b','一定給更少',false,'相反。'),O('c','不允許 heterogeneous capacity',false,'可設計。'),O('d','只改 DNS',false,'無關。')]},
  {id:'sd5-s06-q4',question:'Vnode 數量越多一定越好嗎？',reviewPageId:'sd5-s06-p04',explanation:'不是；balance 會改善，但 metadata、repair、neighbor/failure complexity 也會增加。',options:[O('a','不是，有 operational trade-off',true),O('b','是，無限多最好',false,'忽略成本。'),O('c','完全沒有 metadata',false,'有。'),O('d','只影響 UI',false,'不是。')]}
 ]
},
{
 id:'sd5-s07',order:7,title:'Replication 與 Failure Domains：Ring 只決定 Partition，可靠性還要再設計',duration:'38–52 分鐘',summary:'把 consistent hashing 與 replication factor、distinct physical nodes、rack/AZ awareness 串起來。',
 research:[
  {label:'Amazon Science — Dynamo: Amazon’s highly available key-value store',url:'https://www.amazon.science/publications/dynamo-amazons-highly-available-key-value-store'},
  {label:'Apache Cassandra — Replication Strategy / RF',url:'https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html'}
 ],
 pages:[
  {id:'sd5-s07-p01',title:'Owner 不等於只有一份資料',blocks:[
   {type:'diagram',nodes:[['Key token','42'],['Primary owner','first clockwise node'],['Replica 2','next distinct node'],['Replica 3','next distinct node']],caption:'Dynamo/Cassandra-style 系統常沿 ring 選多個 distinct physical nodes 作 replicas。'},
   {type:'p',text:'Consistent hashing 解 partition ownership；Replication Factor (RF) 解 durability/availability。兩者是相鄰但不同的問題。'}
  ]},
  {id:'sd5-s07-p02',title:'Virtual Nodes 下，Replica 要跳過同一台 Physical Node',blocks:[
   {type:'p',text:'如果 A1、A2、A3 都屬於 Server A，RF=3 不能把三份 replica 都算在同一 physical machine。Cassandra 會選 distinct physical nodes，必要時跳過屬於同一 host 的 vnodes。'},
   {type:'callout',title:'Failure Domain',text:'更進一步還要跨 rack / AZ 放 replicas；否則三份資料雖在三個 process，卻可能一起被同一電源、rack 或 AZ failure 打掉。'}
  ]},
  {id:'sd5-s07-p03',title:'Membership Change + Replication = 真正的 Rebalance Workflow',blocks:[
   {type:'stepper',steps:[['Detect membership','新增/移除 node。'],['Recompute ownership','Token map 更新。'],['Choose replicas','依 RF / topology 選 distinct nodes。'],['Stream ranges','搬 primary/replica data。'],['Repair/verify','確認 replicas converge。']]},
   {type:'p',text:'Dynamo/Cassandra 類系統還需要 failure detection、gossip、repair、version/conflict 等機制。Consistent hashing 只是其中的 partitioning component。'}
  ]}],
 quiz:[
  {id:'sd5-s07-q1',question:'Consistent hashing 與 replication 的關係？',reviewPageId:'sd5-s07-p01',explanation:'Hashing 決定 partition ownership；replication 決定額外 copies 與 availability/durability。',options:[O('a','是不同但互補的責任',true),O('b','完全同一件事',false,'不同。'),O('c','有 hashing 就不需 replicas',false,'錯。'),O('d','Replication 會取消 ring',false,'不會。')]},
  {id:'sd5-s07-q2',question:'RF=3，A1/A2/A3 都是同一 physical server A，能算三份 replica 嗎？',reviewPageId:'sd5-s07-p02',explanation:'不能；故障域沒有獨立，需 distinct physical nodes。',options:[O('a','不能',true),O('b','可以，vnode 名稱不同就算',false,'物理故障仍同時發生。'),O('c','只要 token 不同就安全',false,'不代表 failure isolation。'),O('d','只要同 rack 就安全',false,'反而 correlated failure。')]},
  {id:'sd5-s07-q3',question:'Replica 跨 AZ 的主要理由？',reviewPageId:'sd5-s07-p02',explanation:'降低 common-mode failure，同一 AZ 故障時仍有副本。',options:[O('a','Failure domain isolation',true),O('b','讓 hash 更快',false,'不是。'),O('c','減少 key 數量',false,'不會。'),O('d','取消 RF',false,'不是。')]},
  {id:'sd5-s07-q4',question:'Consistent hashing 自己會自動做 repair / conflict resolution 嗎？',reviewPageId:'sd5-s07-p03',explanation:'不會；這些是 datastore 另外的 replication/consistency mechanisms。',options:[O('a','不會',true),O('b','會，ring 包含所有分散式功能',false,'過度推論。'),O('c','只要 vnode 多就會',false,'無關。'),O('d','只有 cache 會',false,'不是。')]}
 ]
},
{
 id:'sd5-s08',order:8,title:'實務使用與邊界：Cache、Datastore、Load Balancing，以及它「沒有解什麼」',duration:'34–48 分鐘',summary:'把 Consistent Hashing 放回完整系統：何時用、何時不用、還需要哪些相鄰能力。',
 research:[
  {label:'ByteByteGo — Consistent hashing wrap up / real-world systems',url:'https://bytebytego.com/courses/system-design-interview/design-consistent-hashing'},
  {label:'Apache Cassandra — Dynamo-style architecture',url:'https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html'},
  {label:'Amazon Science — Dynamo',url:'https://www.amazon.science/publications/dynamo-amazons-highly-available-key-value-store'}
 ],
 pages:[
  {id:'sd5-s08-p01',title:'適合場景：Membership 會變，而且想降低 Remap',blocks:[
   {type:'compare',items:[['Distributed Cache','Node scale in/out 時降低 cache remap/miss storm。'],['Partitioned KV Store','把 keyspace 分到多個 storage nodes。'],['Request Sharding','Sticky routing / worker ownership，節點變更時降低 churn。'],['CDN/LB variants','某些 load balancing/edge 系統採相關 hashing 技術。']]},
   {type:'p',text:'真正訊號是「我要把大量 keys/objects/requests 映射到會動態變化的一組 nodes，而且希望 membership 變更時 mapping 穩定」。'}
  ]},
  {id:'sd5-s08-p02',title:'不適合或不需要：固定小集群、強複雜 Query、單一 Hot Key',blocks:[
   {type:'bullets',items:['Server pool 幾乎不變，simple modulo 可能就夠。','需要 range query / locality 時，純 hash partition 可能破壞自然順序。','單一 hot key 仍需 replication/cache/splitting。','需要 transactional co-location 時，partition key 必須配合 data model，不是任意 hash。']},
   {type:'callout',title:'Hashing 不是 Data Model',text:'一致性雜湊只回答「這個 key 去哪個 partition/node」。它不替你決定 schema、query、transaction boundary、replication consistency。'}
  ]},
  {id:'sd5-s08-p03',title:'完整 Interview Answer Checklist',blocks:[
   {type:'code',text:'□ 為何 modulo %N 會 rehash storm\n□ Hash space / ring\n□ Key/server mapping + clockwise successor\n□ Add/remove node affected range\n□ Basic ring imbalance\n□ Virtual nodes / weighted capacity\n□ Replication + failure domains\n□ Hot key / membership / repair 是另外問題'},
   {type:'callout',title:'Chapter 6 會直接用到',text:'下一章 Key-Value Store 會把 consistent hashing 當成 partitioning primitive，再加入 replication、consistency、failure detection、versioning 與 repair。'}
  ]}],
 quiz:[
  {id:'sd5-s08-q1',question:'Consistent hashing 最適合哪類問題？',reviewPageId:'sd5-s08-p01',explanation:'大量 keys 要映射到動態 node pool，且希望 node change 時 mapping 穩定。',options:[O('a','Dynamic node pool 的 stable partition mapping',true),O('b','SQL join optimization only',false,'不是。'),O('c','CSS routing',false,'不是。'),O('d','單機 recursion',false,'不是。')]},
  {id:'sd5-s08-q2',question:'需要大量 range query 時，純 hash partition 的潛在問題？',reviewPageId:'sd5-s08-p02',explanation:'Hash 會打散 natural key order，range locality 變差。',options:[O('a','破壞 range locality',true),O('b','Hash 會自動排序',false,'相反。'),O('c','一定不能儲存資料',false,'可以。'),O('d','會取消 replicas',false,'不相關。')]},
  {id:'sd5-s08-q3',question:'一個明星 ID 是單一超級 hot key，consistent hashing 最主要缺陷？',reviewPageId:'sd5-s08-p02',explanation:'Single key 仍映到固定 owner；需另外做 cache/replica/splitting/isolation。',options:[O('a','單 key 熱點仍存在',true),O('b','所有 keys 都會移動',false,'不是。'),O('c','Hash ring 不能 lookup',false,'可以。'),O('d','Modulo 反而一定更好',false,'沒有這種保證。')]},
  {id:'sd5-s08-q4',question:'Chapter 6 Key-Value Store 最可能如何使用 Consistent Hashing？',reviewPageId:'sd5-s08-p03',explanation:'作為 partitioning primitive，決定 key/token range 的 ownership，再疊加 replication/consistency。',options:[O('a','用來做資料分區 ownership',true),O('b','取代所有 storage engine',false,'不是。'),O('c','取代 consistency protocol',false,'不是。'),O('d','只用於 UI',false,'不是。')]}
 ]
}
);
chapter.finalExam.push(
Q('sd5-ex-e01','easy','hash(key) % N 最大缺點？','sd5-s01-p02','N 改變時大量 keys remap。',[O('a','Membership change 造成大量 remap',true),O('b','無法 hash',false,'可以。'),O('c','永遠不平均',false,'固定 N 可合理。'),O('d','不能 O(1)',false,'可快速計算。')]),
Q('sd5-ex-e02','easy','Consistent hashing 的主要目標？','sd5-s01-p03','降低 node add/remove 時的 key remapping。',[O('a','最小化 remap',true),O('b','提供 ACID',false,'不是。'),O('c','做 full-text search',false,'不是。'),O('d','取代 replication',false,'不是。')]),
Q('sd5-ex-e03','easy','Hash Ring 是？','sd5-s02-p01','首尾相接的邏輯 token space。',[O('a','Logical token space',true),O('b','實體網路 ring',false,'不是。'),O('c','Queue',false,'不是。'),O('d','SQL table',false,'不是。')]),
Q('sd5-ex-e04','easy','Key 的 owner 通常怎麼找？','sd5-s03-p01','Clockwise 找第一個 server/vnode。',[O('a','First clockwise server',true),O('b','Previous server',false,'基本 rule 不是。'),O('c','Random',false,'不是。'),O('d','所有 servers',false,'那是 replication 額外處理。')]),
Q('sd5-ex-e05','easy','Ring wrap-around 表示？','sd5-s03-p02','MAX 後回到 0 繼續找 successor。',[O('a','MAX 後回 0',true),O('b','Lookup 失敗',false,'不會。'),O('c','改 modulo',false,'不需要。'),O('d','刪 key',false,'不是。')]),
Q('sd5-ex-e06','easy','Virtual Node 是？','sd5-s06-p01','一個 physical node 的多個 logical tokens。',[O('a','多個 logical ring tokens',true),O('b','多台 physical server',false,'不是必然。'),O('c','Replication copy',false,'概念不同。'),O('d','Cache key',false,'不是。')]),
Q('sd5-ex-e07','easy','Vnodes 主要改善？','sd5-s06-p01','Partition/load distribution variance 與 incremental scaling。',[O('a','Distribution balance',true),O('b','Transaction isolation',false,'不是。'),O('c','DNS',false,'不是。'),O('d','SQL joins',false,'不是。')]),
Q('sd5-ex-e08','easy','Replication Factor 解決？','sd5-s07-p01','資料有多少 distinct copies / availability durability。',[O('a','Copies / availability',true),O('b','Hash function speed',false,'不是。'),O('c','Client auth',false,'不是。'),O('d','UI state',false,'不是。')]),
Q('sd5-ex-e09','easy','Consistent hashing 是否自帶 membership discovery？','sd5-s03-p03','不自帶。',[O('a','不自帶',true),O('b','自帶所有 cluster 功能',false,'過度推論。'),O('c','只要 SHA-1 就自帶',false,'不是。'),O('d','只在 browser 自帶',false,'不是。')]),
Q('sd5-ex-e10','easy','Consistent hashing 常見用途？','sd5-s08-p01','Distributed cache / partitioned datastore / request sharding。',[O('a','Partition mapping',true),O('b','CSS minify',false,'不是。'),O('c','SMTP auth',false,'不是。'),O('d','Image resize algorithm',false,'不是。')]),
Q('sd5-ex-m01','medium','4-node modulo cluster 移除一台後大量 cache miss，root cause？','sd5-s01-p03','%N 變更讓大量 keys 映到新 nodes。',[O('a','Global remap after N changes',true),O('b','TTL 一定歸零',false,'不是。'),O('c','Hash values 全改',false,'可不變。'),O('d','Client 不 hash',false,'不是。')]),
Q('sd5-ex-m02','medium','Key token 97，server tokens 10/30/60/90，owner？','sd5-s03-p02','Wrap 到 0 後第一個 token=10 的 server。',[O('a','token 10 server',true),O('b','token 90 server',false,'owner 是 successor。'),O('c','token 60 server',false,'不是。'),O('d','無 owner',false,'Ring wrap。')]),
Q('sd5-ex-m03','medium','加入 token 50 到原本 30→60 range，哪段主要改 owner？','sd5-s04-p01','(30,50] 由原 owner 60 的 node 交給新 node 50。',[O('a','30 到 50 的 range',true),O('b','整個 ring',false,'不是。'),O('c','60 到 90',false,'不受此 token 直接影響。'),O('d','完全沒有',false,'會移一段。')]),
Q('sd5-ex-m04','medium','Physical node tokens 很不均，最直接造成？','sd5-s05-p01','Partition size skew。',[O('a','Partition size skew',true),O('b','HTTP 429',false,'無關。'),O('c','Clock drift',false,'無關。'),O('d','Auth failure',false,'無關。')]),
Q('sd5-ex-m05','medium','Ring 很平均但一個 key 佔 40% QPS，應優先想？','sd5-s05-p03','Hot-key mitigation，如 replication/cache/splitting/isolation。',[O('a','Hot-key replication/cache/splitting',true),O('b','更多 vnode 一定自動解',false,'同 key 仍固定映射。'),O('c','改用 modulo',false,'不解 hot key。'),O('d','刪除 hash',false,'不解。')]),
Q('sd5-ex-m06','medium','為什麼 vnode 有助 heterogeneous capacity？','sd5-s06-p03','可讓強機器擁有更多 ownership weight。',[O('a','Ownership weight 可配 capacity',true),O('b','所有機器必須相同',false,'可做 weighted。'),O('c','Vnode 會升級硬體',false,'不會。'),O('d','只靠 DNS',false,'不是。')]),
Q('sd5-ex-m07','medium','RF=3 時三個 vnodes 都屬於同一 host，為何不夠？','sd5-s07-p02','同 physical failure domain，host 掛掉三份一起消失。',[O('a','Copies 不獨立',true),O('b','Vnode 名稱不夠長',false,'無關。'),O('c','Hash collision',false,'不是。'),O('d','RF 只能 1',false,'不是。')]),
Q('sd5-ex-m08','medium','新 node 加入 durable KV cluster，consistent hashing 計算新 ownership 後還缺什麼？','sd5-s04-p03','還要實際 stream/replicate data 與驗證。',[O('a','Data transfer / repair',true),O('b','什麼都不用',false,'Mapping 不會搬 bytes。'),O('c','只改 CSS',false,'無關。'),O('d','關閉 replication',false,'不合理。')]),
Q('sd5-ex-m09','medium','需要 range query 的資料模型，純 hash partition 的 trade-off？','sd5-s08-p02','Natural ordering/locality 被打散。',[O('a','Range locality 變差',true),O('b','Range query 自動更快',false,'不一定。'),O('c','Hash 會排序',false,'不會。'),O('d','不能存 key',false,'可以。')]),
Q('sd5-ex-m10','medium','Client-side token-aware routing 最大維運要求？','sd5-s03-p03','Client 要及時取得正確 token map/membership。',[O('a','Reliable metadata distribution',true),O('b','完全不要 metadata',false,'不可能。'),O('c','每次 random node',false,'失去 token-aware。'),O('d','所有 client 固定一台',false,'無法 scale。')]),
Q('sd5-ex-h01','hard','你把 10 TB durable data 用 consistent hashing 分到 8 nodes，新增第 9 台後只更新 routing table，不搬 data。會怎樣？','sd5-s04-p03','新 ownership 指向新 node，但 bytes 尚未存在，會讀不到/回源錯誤；需要 data streaming/replication。',[O('a','Routing 與實際 data placement 不一致',true),O('b','Hash 會自動 teleport data',false,'不會。'),O('c','什麼都不影響',false,'會影響 correctness。'),O('d','只影響 DNS',false,'不是。')]),
Q('sd5-ex-h02','hard','Basic ring 只有 4 physical nodes，即使 hash function 均勻，為何負載仍可能很歪？','sd5-s05-p01','Server token positions 隨機造成 ownership ranges variance 很大。',[O('a','Node token spacing variance',true),O('b','均勻 hash 保證 physical ranges 等大',false,'不保證。'),O('c','Vnode 太多',false,'此題沒有 vnodes。'),O('d','RF 太高 only',false,'不是主因。')]),
Q('sd5-ex-h03','hard','把 vnode 數從 16 提到 10000，為何不一定更好？','sd5-s06-p04','Balance 可能更細，但 metadata、repair、neighbor/failure complexity 增加。',[O('a','Operational overhead / repair complexity 上升',true),O('b','Vnodes 不占任何 metadata',false,'錯。'),O('c','更多 vnode 一定零風險',false,'錯。'),O('d','會停止 hashing',false,'不會。')]),
Q('sd5-ex-h04','hard','某 node 容量只有其他 node 1/4，但給相同 token weight，最可能？','sd5-s06-p03','它承擔相近 ownership，對小機器形成 capacity overload。',[O('a','Capacity skew / 小 node 過載',true),O('b','自動變快',false,'不會。'),O('c','Hash 會知道硬體規格自動調整',false,'需 placement/weight 策略。'),O('d','RF 變 0',false,'無關。')]),
Q('sd5-ex-h05','hard','Consistent hashing 讓 keys 分散很好，但明星 key 仍讓一 node 100% CPU。最成熟的結論？','sd5-s05-p03','Ring 解 key-space redistribution，不解單 key popularity，需要 replicas/cache/isolation。',[O('a','另做 hot-key mitigation',true),O('b','Consistent hashing 已失效，全部移除',false,'其核心功能仍有效。'),O('c','增加 hash bits 就會自動拆 key',false,'不會。'),O('d','只加 vnode 即可保證',false,'同 key 仍同 token。')]),
Q('sd5-ex-h06','hard','RF=3 三份 replicas 都在同一 AZ 不同 hosts，哪個風險仍未處理？','sd5-s07-p02','AZ-level common-mode failure。',[O('a','AZ common-mode failure',true),O('b','Host failure',false,'host 已分散。'),O('c','Hash collision',false,'不是。'),O('d','Client clock',false,'無關。')]),
Q('sd5-ex-h07','hard','Membership service 暫時讓一半 clients 看到舊 ring、一半看到新 ring，可能造成？','sd5-s03-p03','同一 key 被不同 clients 路由到不同 owners，出現 misses/錯誤寫入/雙重 ownership 過渡問題。',[O('a','Routing inconsistency during membership transition',true),O('b','Hash function 停止',false,'沒有。'),O('c','所有 data 自動 reconcile',false,'不會自動。'),O('d','只有 UI 影響',false,'是 data path。')]),
Q('sd5-ex-h08','hard','對 transactional relational workload 隨機 hash 所有 rows，可能最大問題？','sd5-s08-p02','Related rows 被打散，cross-partition joins/transactions 變昂貴；partition key 必須配合 data model。',[O('a','破壞 co-location / 增加 cross-shard transaction',true),O('b','Hash 一定讓 transaction 更簡單',false,'不一定。'),O('c','Relational DB 不能 partition',false,'可以。'),O('d','只要 vnode 多就解',false,'Data model 問題仍在。')]),
Q('sd5-ex-h09','hard','Cassandra 用 vnodes 時為何 replica selection 要看 physical host 而不是只看 token？','sd5-s07-p02','避免多個 vnode copies 落在同一 physical failure domain。',[O('a','確保 replicas 在 distinct physical nodes',true),O('b','Token 沒有值',false,'有。'),O('c','Vnode 不屬於 host',false,'正是屬於 host。'),O('d','只為排序',false,'不是。')]),
Q('sd5-ex-h10','hard','完整 Consistent Hashing 答案最應包含哪些相鄰邊界？','sd5-s08-p03','除 ring/vnode 外還要明確區分 membership、data movement、replication、hot key 等不是 hashing 自動解決的問題。',[O('a','Ring/vnode + membership/data movement/replication/hot-key boundaries',true),O('b','只畫一個圓',false,'太淺。'),O('c','只背 SHA-1 bit 數',false,'不是核心。'),O('d','只說 Dynamo 用過',false,'缺推導。')])
);
})();