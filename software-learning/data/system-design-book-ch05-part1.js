(() => {
const chapter=window.SYSTEM_DESIGN_CHAPTER_05={
 id:'sd-book-05',order:5,title:'設計具有一致性的雜湊做法',subtitle:'從 hash(key) % N 的 rehash storm 開始，推導 Hash Ring、clockwise ownership、增減節點時的最小資料移動。',objective:'完成後，你應該能手動畫出 consistent hash ring，判斷 key ownership、node add/remove 造成哪些 range remap，並說明它為何適合 cache/data partitioning 以及它沒有解決哪些問題。',sections:[],finalExam:[]
};
const O=(id,text,correct,misconception='')=>({id,text,correct,misconception});
chapter.sections.push(
{
 id:'sd5-s01',order:1,title:'Rehashing Problem：為什麼 hash(key) % N 在節點變動時會爆？',duration:'28–40 分鐘',summary:'先從最直覺 modulo hashing 推導問題：N 一改，幾乎所有 mapping 都可能改變，Cache 會出現 miss storm。',
 research:[
  {label:'ByteByteGo — Consistent Hashing / Rehashing problem',url:'https://bytebytego.com/courses/system-design-interview/design-consistent-hashing'},
  {label:'Apache Cassandra — Consistent Hashing using a Token Ring',url:'https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html'}
 ],
 pages:[
  {id:'sd5-s01-p01',title:'最直覺的分片：hash(key) % N',blocks:[
   {type:'code',text:'serverIndex = hash(key) % N\n\nN=4:\nhash(keyA)=13 → 1\nhash(keyB)=22 → 2'},
   {type:'bullets',items:['優點：非常簡單，固定 N 時可快速定位。','只要 hash distribution 好，固定 server pool 下通常可分得不錯。','問題：N 直接出現在公式裡；新增/移除 server 就會改變大量 remainder。']},
   {type:'callout',title:'核心觀察',text:'不是 hash value 變了，而是 divisor N 變了。相同 hash 在 %4 與 %3 下通常得到不同 server index。'}
  ]},
  {id:'sd5-s01-p02',title:'移除一台 Server，為什麼不是只搬那台上的 Key？',blocks:[
   {type:'diagram',nodes:[['Before','hash % 4'],['Node removed','N=3'],['Recompute','hash % 3'],['Most keys','new remainder'],['Result','大量 remap']],caption:'Modulo hashing 的 membership 變動會讓全體 key 重新計算不同 modulus。'},
   {type:'p',text:'例如原本 keyA %4=1、keyB %4=2；N 變 3 後可能變成 1、1。真正受影響的不只故障 node 的 keys，而是大量仍在健康 nodes 上的 keys。'}
  ]},
  {id:'sd5-s01-p03',title:'Cache Miss Storm：Rehashing 會把問題放大到 Database',blocks:[
   {type:'stepper',steps:[['Node change','Cache cluster add/remove node。'],['Mapping changes','Client 對大量 keys 算到新 server。'],['New server misses','新 owner 還沒有原 cache entry。'],['Fallback','大量 request 回源 DB。'],['Cascade','DB latency/error 上升，可能變成 outage。']]},
   {type:'callout',title:'Consistent Hashing 的真正動機',text:'讓 server pool 變動時只有小部分 keys 需要換 owner，降低 data movement 與 cache miss storm，而不是追求「完全不移動」。'}
  ]}],
 quiz:[
  {id:'sd5-s01-q1',question:'hash(key) % N 在節點增減時最大問題？',reviewPageId:'sd5-s01-p02',explanation:'N 改變使大量 keys 的 remainder 改變，造成大規模 remap。',options:[O('a','大量 key mapping 改變',true),O('b','Hash function 會消失',false,'hash 仍存在。'),O('c','所有 key 變相同',false,'不一定。'),O('d','不能 O(1) 計算',false,'計算本身仍快。')]},
  {id:'sd5-s01-q2',question:'移除一台 modulo-sharded cache server，為何其他健康 server 上的 keys 也可能移動？',reviewPageId:'sd5-s01-p02',explanation:'因 divisor N 改變，所有 key 的 modulo mapping 都可能重新分配。',options:[O('a','N 改變影響所有 modulo 結果',true),O('b','因為健康 server 一定壞掉',false,'不是。'),O('c','因為 hash value 全變',false,'hash value 可不變。'),O('d','因為 DNS TTL',false,'無關。')]},
  {id:'sd5-s01-q3',question:'Cache 大量 remap 後最危險的 downstream 效應？',reviewPageId:'sd5-s01-p03',explanation:'大量 cache miss 會回源 DB，造成 miss storm / cascading overload。',options:[O('a','Database 回源流量暴增',true),O('b','CSS 失效',false,'無關。'),O('c','所有 request 自動 cache hit',false,'相反。'),O('d','Hash ring 自動出現',false,'不會。')]},
  {id:'sd5-s01-q4',question:'Consistent Hashing 的主要目標？',reviewPageId:'sd5-s01-p03',explanation:'Membership 改變時最小化 remapping/data movement。',options:[O('a','最小化節點變動時的 key remap',true),O('b','讓單一 hot key 變冷',false,'不直接解。'),O('c','提供 transaction',false,'不是。'),O('d','取代 replication',false,'不是。')]}
 ]
},
{
 id:'sd5-s02',order:2,title:'Hash Space 與 Hash Ring：把線性範圍接成一個圓',duration:'26–36 分鐘',summary:'理解 hash output space、ring wrap-around，以及 server/key 都映射到同一個 token space。',
 research:[{label:'ByteByteGo — Hash space and hash ring',url:'https://bytebytego.com/courses/system-design-interview/design-consistent-hashing'}],
 pages:[
  {id:'sd5-s02-p01',title:'先有 Hash Space，再把兩端接起來',blocks:[
   {type:'diagram',nodes:[['0','minimum hash'],['...','continuous token space'],['MAX','maximum hash'],['wrap','MAX → 0']],caption:'Ring 是概念模型：最大值後面接回 0，讓 ownership 可以用 clockwise successor 定義。'},
   {type:'p',text:'書中用 SHA-1 的 0..2^160-1 說明 hash space；實務重點不是一定要 SHA-1，而是需要穩定、分布良好的 hash/token function。'}
  ]},
  {id:'sd5-s02-p02',title:'Servers 與 Keys 都被 Hash 到同一個 Ring',blocks:[
   {type:'code',text:'serverToken = H(server_id)\nkeyToken    = H(key)\n\nowner(key) = first server token clockwise from keyToken'},
   {type:'p',text:'Modulo hashing 把 key 映到 server index；consistent hashing 則把 key 與 server 都映到相同 token space，再依相對位置決定 ownership。'}
  ]},
  {id:'sd5-s02-p03',title:'Ring 上的「Partition」其實是 Token Range',blocks:[
   {type:'diagram',nodes:[['S0 token','start'],['Range A','(Sprev,S0]'],['S1 token','next'],['Range B','(S0,S1]']],caption:'一個 physical/virtual node 負責前一個 token 到自己 token 的 range（具體端點慣例依系統而異）。'},
   {type:'callout',title:'不要把 Ring 當 Network Topology',text:'Hash Ring 通常是資料分區的邏輯 token space，不代表 servers 真的用環狀網路線互相連。'}
  ]}],
 quiz:[
  {id:'sd5-s02-q1',question:'Hash Ring 最核心是什麼？',reviewPageId:'sd5-s02-p01',explanation:'把 hash token space 首尾相接，用 successor/clockwise 定義 ownership。',options:[O('a','首尾相接的邏輯 token space',true),O('b','實體網路一定接成圓',false,'Ring 是邏輯分區。'),O('c','Queue data structure',false,'不是。'),O('d','SQL index',false,'不是。')]},
  {id:'sd5-s02-q2',question:'Consistent Hashing 中 server 與 key 怎麼比較位置？',reviewPageId:'sd5-s02-p02',explanation:'兩者都 hash 到同一 token space。',options:[O('a','都映射到同一 hash/token space',true),O('b','Server 不需要 token',false,'需要位置。'),O('c','Key 直接用 server index',false,'那較像 modulo。'),O('d','只比較字串長度',false,'不是。')]},
  {id:'sd5-s02-q3',question:'Hash Ring 是否代表 servers 的實體 network topology？',reviewPageId:'sd5-s02-p03',explanation:'不是；它是邏輯 ownership/token space。',options:[O('a','不是',true),O('b','一定是',false,'常見誤解。'),O('c','只有 Wi-Fi 才是',false,'無關。'),O('d','只有 CDN 才是',false,'無關。')]},
  {id:'sd5-s02-q4',question:'選 hash function 最重要特性之一？',reviewPageId:'sd5-s02-p01',explanation:'需要穩定且讓 key/token 分布足夠均勻。',options:[O('a','穩定且分布良好',true),O('b','每次結果隨機不同',false,'Ownership 會不穩定。'),O('c','一定是 SHA-1',false,'概念不綁死單一 hash。'),O('d','輸出只能 0/1',false,'token space 太小。')]}
 ]
},
{
 id:'sd5-s03',order:3,title:'Server Lookup：Key 沿順時針找到第一個 Server',duration:'28–38 分鐘',summary:'手動判斷 ownership、wrap-around，建立對 ring lookup 的直覺。',
 research:[{label:'ByteByteGo — Hash servers / hash keys / server lookup',url:'https://bytebytego.com/courses/system-design-interview/design-consistent-hashing'}],
 pages:[
  {id:'sd5-s03-p01',title:'Successor Rule：第一個 Clockwise Server 就是 Owner',blocks:[
   {type:'diagram',nodes:[['Key token 12','start'],['S1 token 20','first clockwise'],['Owner','S1']],caption:'如果 key 落在兩個 server tokens 之間，它由順時針下一個 server 擁有。'},
   {type:'p',text:'這個 rule 讓每個 server 自然擁有前一段 token range，並讓 add/remove node 只影響鄰近 range。'}
  ]},
  {id:'sd5-s03-p02',title:'Wrap-around：Key 在最後一個 Token 後面怎麼辦？',blocks:[
   {type:'diagram',nodes:[['S3','token 90'],['Key','token 97'],['MAX','99'],['wrap to 0','→'],['S0','token 10']],caption:'Clockwise 走到 hash space 終點後回到 0，所以 key 97 的 owner 是 S0。'},
   {type:'callout',title:'Ring 的價值就在這裡',text:'如果沒有 wrap-around，最後一段 range 需要特殊處理；Ring 把 ownership rule 統一成「找 successor」。'}
  ]},
  {id:'sd5-s03-p03',title:'Routing Metadata：Client/Coordinator 怎麼知道 Ring？',blocks:[
   {type:'p',text:'實務中需要某種 membership/token map，讓 client library、proxy 或 coordinator 知道哪些 token 屬於哪些 endpoints。Ring 演算法本身沒有自動解決 membership discovery。'},
   {type:'compare',items:[['Client-side routing','Client 持 token map，少一跳但 metadata 更新要可靠。'],['Proxy/coordinator','集中 lookup，client 簡單，但 proxy 本身需 scale/HA。']]},
   {type:'callout',title:'重要界線',text:'Consistent hashing 是 partition mapping 技術；cluster membership、health detection、routing metadata distribution 是另外的系統問題。'}
  ]}],
 quiz:[
  {id:'sd5-s03-q1',question:'Key token 12，下一個 clockwise server token 是 20，owner？',reviewPageId:'sd5-s03-p01',explanation:'第一個 clockwise server S1(token20) 擁有該 key。',options:[O('a','token 20 的 server',true),O('b','前一個 server',false,'基本 rule 是 successor。'),O('c','隨機 server',false,'不是。'),O('d','所有 server',false,'那是 replication 另議。')]},
  {id:'sd5-s03-q2',question:'Key hash 落在 ring 最大 token 後方，lookup 怎麼做？',reviewPageId:'sd5-s03-p02',explanation:'Wrap 到 0，找最小 token 的第一個 server。',options:[O('a','Wrap 到 0 繼續找 successor',true),O('b','報錯',false,'Ring 定義可處理。'),O('c','改用 modulo',false,'不需要。'),O('d','存本機',false,'不是。')]},
  {id:'sd5-s03-q3',question:'Consistent hashing 自己是否包含 health detection / membership discovery？',reviewPageId:'sd5-s03-p03',explanation:'不包含；它定義 mapping，membership/token metadata 仍需其他機制。',options:[O('a','不包含',true),O('b','全部自動包含',false,'常見過度推論。'),O('c','只有 DNS 就全部解決',false,'不一定。'),O('d','只要 SHA-1 就包含',false,'Hash function 不提供 membership。')]},
  {id:'sd5-s03-q4',question:'Client-side token-aware routing 的主要 Trade-off？',reviewPageId:'sd5-s03-p03',explanation:'可少一個 proxy hop，但每個 client 必須及時取得一致的 token map。',options:[O('a','少一跳，但 metadata 更新更重要',true),O('b','完全不用 metadata',false,'仍需要。'),O('c','一定比 proxy 慢',false,'不一定。'),O('d','不能 failover',false,'可設計。')]}
 ]
},
{
 id:'sd5-s04',order:4,title:'Add / Remove Node：真正的價值是「只搬鄰近 Range」',duration:'30–42 分鐘',summary:'推導加入與移除節點時哪些 keys/ranges 改 owner，理解 incremental scaling。',
 research:[{label:'ByteByteGo — Add a server / Remove a server',url:'https://bytebytego.com/courses/system-design-interview/design-consistent-hashing'}],
 pages:[
  {id:'sd5-s04-p01',title:'加入新 Node：只接手它前一段 Range',blocks:[
   {type:'diagram',nodes:[['Before','S0 owns (S3,S0]'],['Add S4','placed before S0'],['After','S4 owns (S3,S4]'],['S0','keeps (S4,S0]']],caption:'新 node 只從它 clockwise successor 接走一部分 range；其他遠端 ranges 不變。'},
   {type:'p',text:'這就是 incremental scaling：加一台 server 不需要把所有 key 重新分配，只搬該 token 所切出的 range。'}
  ]},
  {id:'sd5-s04-p02',title:'移除 Node：它的 Range 交給下一個 Clockwise Node',blocks:[
   {type:'diagram',nodes:[['S1 fails','owned range R1'],['Ring removes S1','membership update'],['Successor S2','takes R1'],['Other ranges','unchanged']],caption:'只有故障 node 所擁有的 range 需要重新 owner；遠端 mappings 保持。'},
   {type:'callout',title:'Cache vs Durable Storage',text:'Cache 可以接受 miss 後回源重建；durable datastore 則還需要 replication/data transfer，不能因 owner 改變就假設資料自動出現在新 node。'}
  ]},
  {id:'sd5-s04-p03',title:'「少量 Remap」不等於「零資料搬移」',blocks:[
   {type:'stepper',steps:[['Membership changes','Token map 更新。'],['Ownership changes','部分 ranges 新 owner。'],['Data movement','Durable store 要 stream/replicate range。'],['Load shifts','新 owner 承擔 requests。'],['Stabilize','監控 rebalance latency / errors / capacity。']]},
   {type:'p',text:'Consistent hashing 降低 remap 範圍，但 rebalance 本身仍消耗 network/disk/CPU；production 系統通常要 throttling/streaming/repair。'}
  ]}],
 quiz:[
  {id:'sd5-s04-q1',question:'加入一個 ring node 時，哪些 key 通常需要 remap？',reviewPageId:'sd5-s04-p01',explanation:'主要是新 node 前一段、原本屬於其 clockwise successor 的 range。',options:[O('a','新 node 接手的鄰近 range',true),O('b','所有 keys',false,'這正是要避免的。'),O('c','完全沒有 key',false,'仍會移一部分。'),O('d','只移 hash=0',false,'不是。')]},
  {id:'sd5-s04-q2',question:'移除 S1 後，它原本的 range 通常交給？',reviewPageId:'sd5-s04-p02',explanation:'下一個 clockwise successor。',options:[O('a','Clockwise successor',true),O('b','隨機所有 nodes',false,'不是基本 rule。'),O('c','永遠 S0',false,'取決於位置。'),O('d','Client',false,'不是 storage owner。')]},
  {id:'sd5-s04-q3',question:'Consistent hashing 是否保證 durable data 不需要搬移？',reviewPageId:'sd5-s04-p03',explanation:'不保證；它只縮小 ownership change，實際 data transfer/replication 仍需處理。',options:[O('a','不保證',true),O('b','保證零搬移',false,'錯。'),O('c','只要 cache 才搬移',false,'Durable store 更需要。'),O('d','只要 SHA-1 就不用',false,'無關。')]},
  {id:'sd5-s04-q4',question:'Consistent hashing 支援 incremental scaling 的核心原因？',reviewPageId:'sd5-s04-p01',explanation:'新增節點只切分局部 token range，不需要 global remap。',options:[O('a','局部 range ownership 改變',true),O('b','所有 node 重新 hash',false,'不是。'),O('c','不需要 membership',false,'仍需要。'),O('d','只有一個 server',false,'相反。')]}
 ]
}
);
})();