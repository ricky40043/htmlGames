(() => {
    const course = (window.SOFTWARE_LEARNING_COURSES || []).find(item => item.id === 'system-design');
    if (!course) return;

    course.lessons.push(
        {
            id: 'sd-11',
            title: 'Distributed ID：UUID、Snowflake 與全域唯一編號',
            level: '中階',
            duration: '30–40 分鐘',
            summary: '理解分散式系統為什麼不能只依賴單機 Auto Increment，以及 UUID、Database Sequence、Snowflake 類 ID 的取捨。',
            content: [
                { type: 'slides', title: '一個 ID，看起來簡單，分散式後就不簡單', slides: [
                    { kicker: 'SINGLE NODE', title: '單機 Auto Increment 很舒服', text: '一台 Database 用 1、2、3、4 往上加，簡單、可排序、Index 友善。問題是當寫入被拆到多個節點後，誰負責決定下一個數字？', visual: 'DB → 1001 → 1002 → 1003' },
                    { kicker: 'DISTRIBUTED', title: '多個 Writer 不能各自亂加', text: '如果 Shard A 與 Shard B 都從 1001 開始，就會碰撞。若每次都回中央 DB 取 ID，又把中央服務變成瓶頸與單點。', visual: 'Shard A → 1001\nShard B → 1001 ❌' },
                    { kicker: 'UUID', title: '隨機 ID 幾乎不用協調', text: 'UUID 很容易在不同節點自行產生，碰撞機率極低。但字串較長、可讀性差，隨機寫入也可能讓 B-Tree Index locality 變差。', visual: '550e8400-e29b-41d4-a716-446655440000' },
                    { kicker: 'SNOWFLAKE', title: '時間 + 節點 + Sequence', text: 'Snowflake 類設計把 timestamp、worker id、sequence 組成 64-bit ID。各節點可本地產生，且大致隨時間遞增。', visual: 'timestamp | worker | sequence' }
                ]},
                { type: 'heading', text: '1. 好的 Distributed ID 常見需求' },
                { type: 'bullet', text: '全域唯一：不同機器、不同 Region 不能產生相同 ID。' },
                { type: 'bullet', text: '高吞吐：不要每產一個 ID 都鎖住中央 Database。' },
                { type: 'bullet', text: '可用性：某個節點故障時，其它節點仍能產生 ID。' },
                { type: 'bullet', text: '排序性：如果 ID 大致隨時間增加，對 Timeline、Pagination、Index locality 常有幫助。' },
                { type: 'compare', items: [
                    { icon: '🔢', title: 'DB Sequence', text: '最直覺、遞增、容易理解，但中心 DB 可能成為協調點。可用 allocation range 降低頻率。', bestFor: '中小規模、強排序需求' },
                    { icon: '🆔', title: 'UUID', text: '節點可自行產生，幾乎不需協調；但較長、通常不具時間排序，作為 clustered key 時需評估。', bestFor: '跨系統、離線產生、去中心化' },
                    { icon: '❄️', title: 'Snowflake-like', text: '把時間、worker、sequence 編碼在固定長度 ID 中，高吞吐且大致有序，但需管理 worker id 與 clock rollback。', bestFor: '大型分散式服務、事件與貼文 ID' }
                ]},
                { type: 'heading', text: '2. Snowflake 類 ID 怎麼組？' },
                { type: 'diagram', nodes: [
                    { title: 'Timestamp', subtitle: '毫秒級時間' },
                    { title: 'Worker ID', subtitle: '哪個節點產生' },
                    { title: 'Sequence', subtitle: '同毫秒內計數' },
                    { title: '64-bit ID', subtitle: '拼接後輸出' }
                ], caption: '核心目的：不同 worker 在相同時間也不碰撞；同一 worker 在相同毫秒靠 sequence 區分。' },
                { type: 'code', text: '# 示意，不是完整 Snowflake 實作\ndef make_id(timestamp_ms, worker_id, sequence):\n    return (timestamp_ms << 22) | (worker_id << 12) | sequence' },
                { type: 'checkpoint', question: 'Snowflake 類 ID 產生器若系統時間突然往回跳，最需要防的是什麼？', options: ['可能生成重複或排序異常的 ID', 'CSS 失效', 'Redis 一定清空', 'DNS 不能解析'], answer: 0, explanation: 'Timestamp 是 ID 組成的一部分，clock rollback 必須被偵測與處理。' },
                { type: 'heading', text: '3. 不要只問「哪個最好」，要問 ID 被拿來做什麼' },
                { type: 'stepper', steps: [
                    { title: 'Primary Key', text: '如果直接當 Database clustered key，需要考慮大小與寫入 locality。' },
                    { title: 'Public ID', text: '若要暴露給 URL，不一定想讓使用者猜到訂單量或使用者數，純遞增 ID 可能洩漏商業資訊。' },
                    { title: 'Pagination', text: '時間有序 ID 可做 cursor，例如 `WHERE id < last_id ORDER BY id DESC LIMIT 20`。' },
                    { title: 'Cross-region', text: '多 Region 產生時，要確保 worker/region bits 不重複，並思考時鐘同步。' }
                ]},
                { type: 'callout', text: 'Distributed ID 的考點不是背 Twitter Snowflake 位元數，而是理解「唯一性、排序性、協調成本、時鐘、Index、可用性」之間的 trade-off。' }
            ],
            quiz: [
                { id: 'sd11-q1', type: 'choice', question: '多個獨立 Writer 都使用本機 Auto Increment，最大風險是？', options: ['ID 衝突', '一定 O(n²)', '無法使用 HTTP', 'CDN 失效'], answer: 0, explanation: '沒有協調時，不同節點可能產生相同編號。' },
                { id: 'sd11-q2', type: 'choice', question: 'UUID 的主要優點之一是？', options: ['可在不同節點自行產生，幾乎不需中央協調', '永遠遞增', '一定比 64-bit 整數小', '保證使用者看得懂'], answer: 0, explanation: 'UUID 很適合去中心化 ID 產生。' },
                { id: 'sd11-q3', type: 'choice', question: 'Snowflake-like ID 常見組成不包含哪一個？', options: ['Timestamp', 'Worker ID', 'Sequence', 'HTML DOM'], answer: 3, explanation: '典型設計由時間、節點識別與序號組成。' },
                { id: 'sd11-q4', type: 'choice', question: '時間有序 ID 對哪個場景特別有幫助？', options: ['Cursor pagination', 'CSS selector', '圖片去背', 'SMTP 寄信'], answer: 0, explanation: '可依 ID 大小近似時間順序做穩定 cursor。' },
                { id: 'sd11-q5', type: 'fill', question: '填空：Snowflake 類 ID 中，用來區分不同產生節點的欄位常稱為 Worker __。', answerText: 'ID', explanation: 'Worker ID 用來辨識是哪個節點產生。' }
            ]
        },
        {
            id: 'sd-12',
            title: 'Search System：Index、Inverted Index 與搜尋架構',
            level: '中階',
            duration: '35–45 分鐘',
            summary: '理解 Database LIKE 為什麼不是全文搜尋的終點，以及 Inverted Index、Indexing Pipeline、Ranking、Freshness 與搜尋一致性。',
            content: [
                { type: 'slides', title: '搜尋不是「把所有文字掃一遍」', slides: [
                    { kicker: 'NAIVE', title: 'LIKE %keyword% 很快遇到瓶頸', text: '對大量長文字做全文掃描，資料越多越慢，而且 Ranking、斷詞、同義詞、Typo tolerance 都很難處理。', visual: 'SELECT ... WHERE body LIKE "%redis%"' },
                    { kicker: 'INDEX', title: '先把文字建成可搜尋的結構', text: '搜尋系統會把 document 分析、斷詞、normalize，再建立 token → documents 的反向索引。', visual: 'redis → [doc2, doc8, doc10]' },
                    { kicker: 'QUERY', title: '查詢時直接找 token 對應文件', text: '不必每次掃所有文章，而是從 index 找候選 documents，再做 ranking、filter、pagination。', visual: 'query "redis cache" → candidates → rank → top 20' },
                    { kicker: 'FRESHNESS', title: 'Index 通常不是 Source of Truth', text: '資料真正來源可能仍是 Database。搜尋 Index 是衍生資料，因此要處理更新延遲、重建、重試與一致性。', visual: 'DB → Change/Event → Indexer → Search Index' }
                ]},
                { type: 'heading', text: '1. Inverted Index 直覺' },
                { type: 'code', text: 'documents = {\n  1: "redis cache fast",\n  2: "database cache index",\n  3: "redis queue"\n}\n\n# 反向索引概念\nredis    -> [1, 3]\ncache    -> [1, 2]\ndatabase -> [2]' },
                { type: 'paragraph', text: '一般 Database Index 常從 row/key 找資料；Inverted Index 則反過來，從「詞」找到有哪些 documents 包含它。這是全文搜尋的重要基礎。' },
                { type: 'heading', text: '2. Indexing Pipeline' },
                { type: 'diagram', nodes: [
                    { title: 'Source DB', subtitle: 'Source of Truth' },
                    { title: 'CDC / Event', subtitle: '資料變更' },
                    { title: 'Indexer', subtitle: 'Analyze / Tokenize' },
                    { title: 'Search Index', subtitle: '可搜尋資料' },
                    { title: 'Query API', subtitle: 'Search / Rank / Filter' }
                ], caption: '大型系統常把寫入與搜尋拆開：主交易 DB 保證業務資料，Search Index 專門為讀取與搜尋模式最佳化。' },
                { type: 'heading', text: '3. Search 結果為什麼可能延遲幾秒才看得到？' },
                { type: 'paragraph', text: '因為 indexing pipeline 常是 asynchronous。使用者更新商品名稱後，Database 已成功，但 CDC/Event 尚未被 Indexer 處理，Search Index 仍是舊內容。這是典型 eventual consistency。' },
                { type: 'checkpoint', question: '商品更新成功後，商品詳情 API 已顯示新名稱，但搜尋 2 秒內還是舊名稱，最合理原因？', options: ['Search Index 非同步更新延遲', 'Binary Search 邏輯', 'CSS cache', 'Load Balancer 一定故障'], answer: 0, explanation: '交易 DB 與搜尋 Index 常透過非同步 pipeline 同步。' },
                { type: 'heading', text: '4. 搜尋系統不只有 Matching，還有 Ranking' },
                { type: 'stepper', steps: [
                    { title: 'Analyze Query', text: '斷詞、大小寫、語言 normalize、同義詞、拼字修正。' },
                    { title: 'Candidate Retrieval', text: '從 index 快速找出可能相關 documents。' },
                    { title: 'Filter', text: '加入權限、價格、分類、時間等條件。' },
                    { title: 'Rank', text: '用文字相關性、熱門度、新鮮度、個人化等訊號排序。' },
                    { title: 'Top K', text: '通常只回前幾十筆，而不是把數百萬結果全部排序回傳。' }
                ]},
                { type: 'heading', text: '5. Source of Truth 與 Rebuild' },
                { type: 'bullet', text: 'Search Index 通常可視為衍生資料；Index 壞掉時應能從 Source DB / Event Log 重建。' },
                { type: 'bullet', text: '更新流程要有 retry / DLQ / monitoring，否則漏一筆事件會造成搜尋資料長期不一致。' },
                { type: 'bullet', text: 'Reindex 大資料量時通常要用新 Index 建好後再 alias/switch，避免長時間停機。' },
                { type: 'callout', text: '系統設計面試問「搜尋」時，不要只回答 Elasticsearch。先說資料模型、搜尋欄位、更新頻率、freshness、ranking、filter、Index rebuild 與容量。' }
            ],
            quiz: [
                { id: 'sd12-q1', type: 'choice', question: 'Inverted Index 最核心的概念是？', options: ['Token 對應哪些 Documents', 'Document 只對應一個 IP', '把所有檔案壓縮', '把 Cache 清空'], answer: 0, explanation: '反向索引由 term/token 找到相關 documents。' },
                { id: 'sd12-q2', type: 'choice', question: 'Search Index 常見角色是？', options: ['為搜尋查詢最佳化的衍生資料', '唯一不能重建的 Source of Truth', '只存圖片', '取代所有交易 DB'], answer: 0, explanation: '主業務資料通常仍有 Source DB，搜尋 Index 可從來源重建。' },
                { id: 'sd12-q3', type: 'choice', question: 'Database 已更新但 Search 尚未更新，常見原因？', options: ['Async indexing lag', 'CPU 一定壞掉', 'HTTPS 不支援搜尋', 'UUID 太短'], answer: 0, explanation: '非同步索引通常帶來 eventual consistency。' },
                { id: 'sd12-q4', type: 'choice', question: '搜尋流程的 Ranking 主要在做什麼？', options: ['決定候選結果的相關性與排序', '產生 TLS 憑證', '分配 IP', '重啟 Database'], answer: 0, explanation: 'Ranking 決定哪些結果應排在前面。' },
                { id: 'sd12-q5', type: 'fill', question: '填空：從「詞」找到相關 Documents 的資料結構常稱為 Inverted ____。', answerText: 'Index', explanation: 'Inverted Index 是全文搜尋核心結構之一。' }
            ]
        },
        {
            id: 'sd-13',
            title: 'Microservices、Service Discovery 與 Event-driven 架構',
            level: '中階 → 進階',
            duration: '40–50 分鐘',
            summary: '理解 Monolith 何時夠用、何時拆服務，以及 API Gateway、Service Discovery、同步呼叫、Event-driven 與分散式複雜度。',
            content: [
                { type: 'slides', title: 'Microservices 不是「比較高級的 Monolith」', slides: [
                    { kicker: 'MONOLITH', title: '單體往往是最好的起點', text: '一個部署單位讓 local transaction、debug、測試、部署與 refactor 都更簡單。團隊與產品還小時，這些優點非常重要。', visual: 'Web + Order + Payment + User → 1 App' },
                    { kicker: 'BOUNDARY', title: '先找到真正的 Domain Boundary', text: '不是每張資料表拆一個 Service。比較合理的是依業務能力與責任拆分，例如 Order、Payment、Inventory。', visual: 'Order | Payment | Inventory' },
                    { kicker: 'NETWORK', title: '函式呼叫變成網路呼叫後，失敗模式完全不同', text: 'Latency、Timeout、Partial Failure、Retry、Version、Tracing、Authentication 都會出現。Microservices 是把程式內複雜度換成分散式複雜度。', visual: 'function() → HTTP/gRPC → timeout?' },
                    { kicker: 'EVENT', title: '不是所有服務都要同步串成一條', text: '非同步 Event 可以降低耦合、吸收尖峰，但也帶來 eventual consistency、duplicate、ordering、replay 等問題。', visual: 'OrderPlaced → Queue/Bus → Email / Analytics / Inventory' }
                ]},
                { type: 'compare', items: [
                    { icon: '📦', title: 'Modular Monolith', text: '單一部署但內部模組邊界清楚。常比「過早 Microservices」更容易維運。', bestFor: '小中型團隊、Domain 還在快速變動' },
                    { icon: '🧩', title: 'Microservices', text: '服務可獨立部署與擴展，團隊邊界清楚；但網路、資料一致性、觀測與維運成本大幅提升。', bestFor: '邊界成熟、團隊/流量/部署需求真的需要獨立性' }
                ]},
                { type: 'heading', text: '1. API Gateway 解的是 Client 到多服務的入口問題' },
                { type: 'diagram', nodes: [
                    { title: 'Client', subtitle: 'Web / Mobile' },
                    { title: 'API Gateway', subtitle: 'Auth / Routing / Rate Limit' },
                    { title: 'Service A/B/C', subtitle: 'Domain Services' },
                    { title: 'DB per Service', subtitle: '各服務擁有資料' }
                ], caption: 'Gateway 可以集中處理外部入口，但不要把所有 Business Logic 都塞回 Gateway，否則只是做出新 Monolith。' },
                { type: 'heading', text: '2. Service Discovery：服務 IP 會變' },
                { type: 'paragraph', text: '容器/VM 動態擴縮時，Service A 不應硬編碼 Service B 的某台 IP。Service Registry、DNS-based discovery 或平台內建服務名稱，讓 caller 找到目前健康實例。' },
                { type: 'checkpoint', question: 'Kubernetes 中 Service A 呼叫 `http://payment-service`，而不是寫死 Pod IP，主要是在解哪類問題？', options: ['Service Discovery / Stable Endpoint', '全文搜尋', 'Graph DFS', 'Object Storage'], answer: 0, explanation: 'Pod 生命週期短，穩定服務名稱負責解析到健康實例。' },
                { type: 'heading', text: '3. Sync vs Async Integration' },
                { type: 'stepper', steps: [
                    { title: 'Synchronous', text: 'HTTP/gRPC 呼叫後等待結果。適合 caller 當下真的需要答案，但 latency 與 failure 會沿鏈路傳遞。' },
                    { title: 'Asynchronous', text: 'Producer 發 Event 後先完成自己的工作，Consumer 之後處理。解耦較強，也較能吸收 spike。' },
                    { title: 'Event Contract', text: 'Event schema 是跨服務 API；欄位改動也需要 versioning 與 backward compatibility。' },
                    { title: 'Idempotency', text: 'Event 可能重送，Consumer 必須能安全重複處理。' }
                ]},
                { type: 'heading', text: '4. Database per Service 的真正代價' },
                { type: 'paragraph', text: '當 Order DB 與 Payment DB 分開後，不能再靠一個本地 ACID transaction 更新兩邊。你會開始需要 Saga、Outbox、Eventual Consistency、Compensation 與 Reconciliation。這就是第 9 章內容在 Microservices 中變成實戰。' },
                { type: 'heading', text: '5. 什麼情況「不要拆」' },
                { type: 'bullet', text: '團隊很小，部署頻率與擴展需求沒有衝突。' },
                { type: 'bullet', text: 'Domain Boundary 還不清楚，需求快速變動。' },
                { type: 'bullet', text: '只是因為「大家都說 Microservices 比較專業」。' },
                { type: 'callout', text: '好的架構回答應該能說：「我們目前用 Modular Monolith，直到 X 團隊需要獨立部署 / Y 模組流量差異巨大 / Z 邊界已穩定，才拆服務。」這比直接說全站 Microservices 更成熟。' }
            ],
            quiz: [
                { id: 'sd13-q1', type: 'choice', question: 'Microservices 最大的新增成本之一是？', options: ['網路與分散式失敗模式', 'HTML 不能使用', '所有 DB 自動消失', '無法做 Authentication'], answer: 0, explanation: '函式呼叫變網路呼叫後會有 timeout、partial failure、retry 等問題。' },
                { id: 'sd13-q2', type: 'choice', question: 'Service Discovery 主要解決？', options: ['動態找到目前可用服務實例', '壓縮影片', '產生 UUID', 'SQL JOIN'], answer: 0, explanation: '服務實例 IP 可能變化，Discovery 提供穩定查找方式。' },
                { id: 'sd13-q3', type: 'choice', question: 'Event-driven Integration 最典型優點？', options: ['降低同步耦合並吸收尖峰', '保證零延遲', '保證永遠 exactly-once', '不需要監控'], answer: 0, explanation: '非同步可以解耦 producer/consumer，但會帶來一致性等新問題。' },
                { id: 'sd13-q4', type: 'choice', question: 'Database per Service 後，跨服務交易通常更難，因為？', options: ['無法直接使用同一個本地 ACID transaction', 'HTTP 不能傳 JSON', 'Redis 不支援 String', 'DNS 沒有 TTL'], answer: 0, explanation: '資料所有權分開後需要 Saga/Outbox 等協作。' },
                { id: 'sd13-q5', type: 'fill', question: '填空：集中外部 API 入口、Routing、Auth、Rate Limit 的元件常稱 API ______。', answerText: 'Gateway', explanation: 'API Gateway 常作為 Client 到多服務的入口層。' }
            ]
        },
        {
            id: 'sd-14',
            title: 'Multi-region：跨區部署、Failover 與資料一致性',
            level: '進階',
            duration: '40–55 分鐘',
            summary: '理解為什麼跨 Region 不只是多開一組 Server，並比較 Active-Passive、Active-Active、Global Routing、Replication 與資料衝突。',
            content: [
                { type: 'slides', title: '單 Region 99.99% 還不夠時，你才會開始付 Multi-region 的代價', slides: [
                    { kicker: 'REGION FAILURE', title: '一個 Region 也可能整體不可用', text: '機房網路、控制平面、電力、雲端 Region 級事故都可能讓單 Region HA 失效。', visual: 'Region A ❌\nNeed Region B' },
                    { kicker: 'ACTIVE-PASSIVE', title: '備援區平時不承接主要流量', text: '正常時集中在 Primary Region，故障才切換。架構較簡單，但切換速度、資料同步與演練很重要。', visual: 'Traffic → Region A\nRegion B = standby' },
                    { kicker: 'ACTIVE-ACTIVE', title: '兩區同時服務使用者', text: '延遲與容量更漂亮，但兩邊都可能寫資料，Conflict Resolution、Consistency、Global uniqueness 會複雜很多。', visual: 'US → US Region\nAsia → Asia Region' },
                    { kicker: 'DATA', title: 'App 跨區很容易，資料跨區才是真正難題', text: '同步 replication 增加 latency；非同步 replication 有 RPO 與 stale read。多主寫入還要處理衝突。', visual: 'Latency ↔ Consistency ↔ Availability' }
                ]},
                { type: 'compare', items: [
                    { icon: '🛟', title: 'Active-Passive', text: '一個主要 Region 提供服務，另一區做 standby。Failover 流程較容易理解，但要定期演練。', bestFor: 'DR、寫入一致性要求高、可接受切換時間' },
                    { icon: '🌐', title: 'Active-Active', text: '多 Region 同時承接流量，能降低使用者距離與單區依賴，但資料同步與衝突處理更難。', bestFor: '全球低延遲、超高可用、成熟平台' }
                ]},
                { type: 'heading', text: '1. Global Traffic Routing' },
                { type: 'diagram', nodes: [
                    { title: 'Global DNS / Anycast', subtitle: '依健康與地理路由' },
                    { title: 'Region A LB', subtitle: 'Asia' },
                    { title: 'Region B LB', subtitle: 'US' },
                    { title: 'Regional Services', subtitle: 'App + Cache + DB' }
                ], caption: '入口層需要知道 Region 健康狀態。DNS-based failover 要考慮 TTL；Anycast/global LB 則由平台網路層導流。' },
                { type: 'heading', text: '2. RPO / RTO 在 Multi-region 會變成具體設計數字' },
                { type: 'stepper', steps: [
                    { title: 'RPO = 0?', text: '如果一筆交易都不能丟，跨區同步寫可能增加使用者 latency，也可能在網路 partition 時犧牲 availability。' },
                    { title: 'RPO = 5 min', text: '可以接受最多 5 分鐘資料遺失時，非同步 replication 選擇更多、效能更好。' },
                    { title: 'RTO = 30 sec', text: '要求 30 秒內恢復，就不能只靠人工登入 DNS 改設定。需要自動化健康檢查與 failover。' },
                    { title: 'Drill', text: '紙上有 failover 不等於真的能 failover。要定期演練、量測實際 RTO/RPO。' }
                ]},
                { type: 'checkpoint', question: 'Active-Active 兩個 Region 都允許修改同一使用者資料，最核心的新問題？', options: ['Concurrent write conflict / consistency', 'CSS 顏色', '圖片大小', 'Python List index'], answer: 0, explanation: '多主寫入需要定義衝突與一致性策略。' },
                { type: 'heading', text: '3. Session、Cache、Queue 也有 Region 邊界' },
                { type: 'bullet', text: 'Session/Token：最好讓 Request 能在不同實例/Region 驗證，不依賴某台主機 RAM。' },
                { type: 'bullet', text: 'Cache：通常做 Regional Cache，避免每次跨洲讀 Redis；但 cache invalidation 可能要跨區。' },
                { type: 'bullet', text: 'Queue：事件在哪區產生、在哪區消費？Failover 後會不會重播？是否需要 global ordering？' },
                { type: 'bullet', text: 'Object Storage：可用 cross-region replication，但成本、延遲與資料主權要一起評估。' },
                { type: 'heading', text: '4. Data Residency 與 Compliance' },
                { type: 'paragraph', text: '全球架構不只是技術。有些個資、金融或政府資料不能任意跨國複製。這會直接影響 shard key、region routing、backup 與 analytics 架構。' },
                { type: 'callout', text: 'Multi-region 是昂貴且複雜的可靠性工具。沒有明確 SLA、RPO、RTO、全球延遲或合規需求時，不應只因為「看起來厲害」就使用。' }
            ],
            quiz: [
                { id: 'sd14-q1', type: 'choice', question: 'Active-Passive 的主要特徵？', options: ['主要 Region 服務，備援 Region 故障時接手', '所有 Region 永遠同時寫同一筆資料', '沒有 Failover', '不需要資料同步'], answer: 0, explanation: 'Passive Region 平時通常待命，故障時切換。' },
                { id: 'sd14-q2', type: 'choice', question: 'Active-Active 最大技術挑戰之一？', options: ['跨區多主寫入衝突與一致性', 'HTML table', 'CSS Media Query', 'Python enumerate'], answer: 0, explanation: '多區同時寫入讓 conflict resolution 變得重要。' },
                { id: 'sd14-q3', type: 'choice', question: 'RTO = 30 秒表示？', options: ['災難後希望 30 秒內恢復服務', '最多可丟 30 秒資料', 'QPS 只能 30', '只能有 30 台主機'], answer: 0, explanation: 'RTO 描述恢復服務時間目標。' },
                { id: 'sd14-q4', type: 'choice', question: '跨 Region 同步 Replication 的常見代價？', options: ['寫入 latency 增加', '一定沒有網路延遲', '完全不需要 quorum', '資料一定更小'], answer: 0, explanation: '同步等待遠端確認會把跨洲 RTT 帶進寫入路徑。' },
                { id: 'sd14-q5', type: 'fill', question: '填空：最多可接受遺失多少時間資料的目標稱為 R__.', answerText: 'RPO', explanation: 'RPO = Recovery Point Objective。' }
            ]
        },
        {
            id: 'sd-15',
            title: '完整設計題：URL Shortener 從需求到百萬級流量',
            level: '整合實戰',
            duration: '50–65 分鐘',
            summary: '把前 14 章真的串起來：需求、容量估算、ID、Cache、Database、CDN、Rate Limit、可靠性與 Multi-region，完成一題可面試的系統設計。',
            content: [
                { type: 'slides', title: '不要直接畫架構，先完成四個決策', slides: [
                    { kicker: 'REQUIREMENTS', title: '功能與非功能需求', text: '建立短網址、Redirect、可選自訂 alias、過期時間、基本統計。讀遠大於寫，Redirect 要低延遲、高可用。', visual: 'POST /links\nGET /{code} → 301/302' },
                    { kicker: 'ESTIMATE', title: '讀多寫少，Redirect 是主流量', text: '假設每天建立 1,000 萬短網址，但每天 Redirect 10 億次，Read:Write = 100:1。Cache 會非常有價值。', visual: 'Writes ≈ 116 QPS avg\nReads ≈ 11.6k QPS avg' },
                    { kicker: 'DATA', title: '最小資料模型其實不複雜', text: 'code → long_url 是核心映射，再加 owner、created_at、expires_at。真正難的是高流量 lookup 與唯一 code。', visual: 'code: "aZ91K" → https://...' },
                    { kicker: 'SCALE', title: '先單庫，再依瓶頸演化', text: 'Redirect 先用 Cache 降讀；寫量與容量真的超過單庫後才 Shard。全球需求再加入 CDN/Edge 或 Multi-region。', visual: 'Client → Edge/LB → Cache → Link Service → DB' }
                ]},
                { type: 'heading', text: '1. API 與資料模型' },
                { type: 'code', text: 'POST /api/links\n{ "url": "https://example.com/very/long/path" }\n\n201 Created\n{ "code": "aZ91K", "shortUrl": "https://sho.rt/aZ91K" }\n\nGET /aZ91K\n→ 302 Location: https://example.com/very/long/path' },
                { type: 'diagram', nodes: [
                    { title: 'Client', subtitle: 'Create / Redirect' },
                    { title: 'Global Edge / LB', subtitle: 'Route + TLS' },
                    { title: 'Link Service', subtitle: 'Resolve / Create' },
                    { title: 'Redis', subtitle: 'code → URL cache' },
                    { title: 'Database', subtitle: 'Source of Truth' }
                ], caption: 'Redirect path 應很短：先查 Cache，Miss 才回 DB。建立短網址則需生成唯一 code 並持久化。' },
                { type: 'heading', text: '2. Short Code 怎麼產生？' },
                { type: 'compare', items: [
                    { icon: '🔢', title: 'ID + Base62', text: '先產生全域唯一整數，再用 Base62 編碼成短字串。容易保證唯一，也能大致控制長度。', bestFor: '簡單、可控、搭配 Distributed ID' },
                    { icon: '🎲', title: 'Random Code', text: '隨機產生 6–8 字元後檢查衝突。實作容易，但高量時要處理 collision retry。', bestFor: '中等規模、可接受碰撞檢查' }
                ]},
                { type: 'code', text: 'alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"\n\ndef base62(number):\n    result = []\n    while number:\n        number, rem = divmod(number, 62)\n        result.append(alphabet[rem])\n    return "".join(reversed(result)) or "0"' },
                { type: 'heading', text: '3. Redirect Path：Cache-Aside' },
                { type: 'stepper', steps: [
                    { title: 'Request arrives', text: 'GET /aZ91K。' },
                    { title: 'Redis lookup', text: '先找 `link:aZ91K`，Hit 直接回 Location。' },
                    { title: 'Cache Miss', text: '查 Database；如果不存在，回 404。' },
                    { title: 'Populate Cache', text: '找到後放入 Redis，TTL 可依 expires_at 決定。' },
                    { title: 'Redirect', text: '回 301 或 302；產品需求會影響 browser/search engine cache 行為。' }
                ]},
                { type: 'checkpoint', question: 'URL Shortener 的 Redirect 流量遠大於 Create 流量，第一個高報酬擴展手段通常是？', options: ['把熱門 code→URL 放 Cache', '立刻拆 30 個 Microservices', '每次 Redirect 都寫 Kafka 再等結果', '先做 Sharding 不看瓶頸'], answer: 0, explanation: 'Read-heavy lookup 非常適合 Cache，先降低 DB 壓力。' },
                { type: 'heading', text: '4. Abuse、Hot Key 與 Analytics' },
                { type: 'bullet', text: 'Rate Limiting：Create API 要防濫用與機器人大量產生垃圾短網址。' },
                { type: 'bullet', text: 'Hot Key：超熱門短網址可能集中打單一 Redis key；可用 local cache、replica、edge cache 等分散。' },
                { type: 'bullet', text: 'Analytics：不要讓每次 Redirect 同步寫大型報表 DB；可送 event 到 Queue，後端非同步聚合。' },
                { type: 'bullet', text: 'Security：惡意網址、Phishing、Malware scanning、Blocklist 都是實際產品需求。' },
                { type: 'heading', text: '5. 什麼時候需要 Sharding / Multi-region？' },
                { type: 'paragraph', text: '如果映射資料量與寫入吞吐真的超過單一 Database，才能依 code/hash 做 sharding。全球低延遲可用 Regional Cache / Edge，真正要跨 Region 寫入時才處理 replication 與 failover。前面 14 章的原則在這題全部串起來：先需求、估算、最小架構，再逐一解瓶頸。' },
                { type: 'callout', text: '完整回答模板：Requirements → Estimation → API/Data Model → High-level Design → ID Generation → Read Path/Cache → DB Scaling → Abuse/Rate Limit → Async Analytics → Failure/Observability → Multi-region Trade-off。能完整走完這條線，比畫滿一張技術 Logo 圖有價值。' }
            ],
            quiz: [
                { id: 'sd15-q1', type: 'choice', question: 'URL Shortener 讀遠大於寫時，最典型的優化？', options: ['Cache code→URL mapping', '所有 Redirect 都做跨區同步寫', '拿掉 Index', '每次都 full table scan'], answer: 0, explanation: 'Redirect lookup 高頻且適合快取。' },
                { id: 'sd15-q2', type: 'choice', question: 'ID + Base62 的主要用途？', options: ['把唯一整數轉成較短 URL-safe code', '做全文搜尋', '取代 TLS', '壓縮圖片'], answer: 0, explanation: 'Base62 常把整數映射成 0-9a-zA-Z 字串。' },
                { id: 'sd15-q3', type: 'choice', question: 'Redirect Analytics 最適合哪種做法？', options: ['同步寫大量統計並阻塞 Redirect', '送事件到 Queue 非同步聚合', '完全不記錄錯誤', '每次重建 Search Index'], answer: 1, explanation: 'Analytics 通常不應拖慢核心 Redirect path。' },
                { id: 'sd15-q4', type: 'choice', question: '何時才應優先評估 Sharding？', options: ['單庫容量/寫入確實成為瓶頸，且較簡單優化已不足', '專案第一天', '只要用了 Redis', '只要 QPS > 1'], answer: 0, explanation: 'Sharding 有高複雜度，應由實際瓶頸驅動。' },
                { id: 'sd15-q5', type: 'fill', question: '填空：把 0-9、a-z、A-Z 共 62 個字元作為編碼字典，常稱 Base__。', answerText: '62', explanation: 'Base62 是短網址常見的短碼編碼方式。' }
            ]
        }
    );
})();