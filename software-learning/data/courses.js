window.SOFTWARE_LEARNING_COURSES = [
    {
        id: 'system-design',
        title: '系統設計',
        icon: '🏗️',
        description: '從需求拆解、單機瓶頸到 Load Balancer、Cache 與 Database Scaling，建立真正能推導架構的思考方式。',
        lessons: [
            {
                id: 'sd-01',
                title: '系統設計不是背架構：先學會拆需求',
                level: '基礎',
                duration: '18–25 分鐘',
                summary: '先建立系統設計的解題框架：需求、非功能需求、容量估算、高階設計，再逐步找瓶頸。',
                content: [
                    { type: 'slides', title: '一題系統設計，正確的開始方式', slides: [
                        { kicker: 'STEP 1', title: '先問「要做什麼」', text: '功能需求決定系統必須支援哪些行為。例如短網址至少需要建立短網址、重新導向；聊天室則需要傳訊息、收訊息、歷史訊息。', visual: 'Functional Requirements<br>「系統必須做得到什麼？」' },
                        { kicker: 'STEP 2', title: '再問「做到什麼程度」', text: '非功能需求才會真正影響架構：QPS、延遲、可用性、資料一致性、使用者數、資料量、全球部署與安全要求。', visual: 'Latency · Throughput · Availability<br>Consistency · Durability · Scale' },
                        { kicker: 'STEP 3', title: '先畫最簡單能工作的版本', text: '不要一上來就 Kafka、Kubernetes、Sharding。先讓 Client → App → Database 可以工作，再問瓶頸在哪裡。', visual: 'Client → App Server → Database' },
                        { kicker: 'STEP 4', title: '每次只解一個明確瓶頸', text: 'CPU 不夠、讀太慢、單點故障、資料太大、尖峰流量，每一種瓶頸的解法不同。系統設計的價值在「選擇與取捨」，不是元件越多越高級。', visual: 'Measure → Bottleneck → Change → Trade-off → Repeat' }
                    ]},
                    { type: 'heading', text: '1. Functional vs Non-functional Requirements' },
                    { type: 'compare', items: [
                        { icon: '🧩', title: '功能需求', text: '描述使用者或其他系統可以做什麼。例如建立貼文、搜尋、上傳檔案、付款、即時聊天。', bestFor: '回答：功能範圍是什麼？' },
                        { icon: '📈', title: '非功能需求', text: '描述系統品質與限制，例如 P95 latency < 200ms、99.99% availability、每秒 50k requests。', bestFor: '回答：系統要撐到什麼程度？' }
                    ]},
                    { type: 'callout', text: '面試常見失誤：需求還沒講清楚，就直接說「我會用 Redis + Kafka + K8s」。技術沒有需求支撐，就只是堆名詞。' },
                    { type: 'heading', text: '2. 容量估算不是考心算，是讓架構有理由' },
                    { type: 'stepper', steps: [
                        { title: 'DAU / MAU', text: '先知道使用者規模。例：100 萬 DAU 不代表每秒 100 萬 request，還要看每人每天操作次數。' },
                        { title: 'QPS', text: '平均 QPS ≈ 每日總 Request / 86,400。真正設計通常再乘尖峰倍率，例如 3～10 倍。' },
                        { title: 'Storage', text: '估每筆資料大小 × 每日新增量 × 保存時間。圖片、影片與純文字的量級完全不同。' },
                        { title: 'Bandwidth', text: '流量 ≈ QPS × Response 大小。若每次回 1 MB，即使 QPS 不高也可能先卡網路。' }
                    ]},
                    { type: 'code', text: '# 範例：100 萬 DAU，每人每天讀 20 次\nrequests_per_day = 1_000_000 * 20\navg_qps = requests_per_day / 86_400       # 約 231 QPS\npeak_qps = avg_qps * 5                    # 假設尖峰 5 倍 ≈ 1,157 QPS' },
                    { type: 'checkpoint', question: '某 API 單一使用者很快，但一到尖峰 10,000 人同時使用就變慢，主要是哪一類問題？', options: ['單一 Request 的功能需求', 'Scalability', '資料格式', 'UI 問題'], answer: 1, explanation: '單一使用者快、負載上升才慢，典型是 scalability 問題。' },
                    { type: 'heading', text: '3. 一條 Request 到底經過什麼？' },
                    { type: 'diagram', nodes: [
                        { title: 'Client', subtitle: 'Browser / App' },
                        { title: 'DNS', subtitle: '名稱解析' },
                        { title: '入口層', subtitle: 'LB / Reverse Proxy' },
                        { title: 'App', subtitle: 'Business Logic' },
                        { title: 'Storage', subtitle: 'DB / Cache / Object' }
                    ], caption: '真實系統可能更複雜，但先理解這條主幹，後面每一章都是在改善其中一段。' },
                    { type: 'demo', kind: 'request-flow', title: '送一次 Request 看完整路徑', text: '按按鈕觀察每個元件何時參與。' },
                    { type: 'heading', text: '4. 面試與實務通用的四步框架' },
                    { type: 'bullet', text: 'Clarify：功能、使用者規模、讀寫比例、延遲、可用性、一致性。' },
                    { type: 'bullet', text: 'Estimate：QPS、峰值、儲存量、頻寬，只抓量級，不追求小數點。' },
                    { type: 'bullet', text: 'High-level Design：先畫可工作的最小架構。' },
                    { type: 'bullet', text: 'Deep Dive：找瓶頸，針對 DB、Cache、Load Balancer、Queue、Sharding 等逐一深入並說明 trade-off。' },
                    { type: 'callout', text: '本課程後面所有章節都會沿著這個框架走。你應該能說出「因為遇到 X 瓶頸，所以加入 Y；代價是 Z」，而不是只背元件定義。' }
                ],
                quiz: [
                    { id: 'sd01-q1', type: 'choice', question: '系統設計開始時，最合理的第一步是？', options: ['先決定 Kafka partitions', '先確認功能與非功能需求', '先決定 Kubernetes node 數', '先做 Sharding'], answer: 1, explanation: '沒有需求與規模，就無法判斷後續技術是否必要。' },
                    { id: 'sd01-q2', type: 'choice', question: '「P95 API latency 要小於 200ms」屬於？', options: ['功能需求', '非功能需求', '資料表欄位', 'UI 規格'], answer: 1, explanation: 'Latency 是系統品質與限制，屬於非功能需求。' },
                    { id: 'sd01-q3', type: 'choice', question: '為什麼要做 Back-of-the-envelope estimation？', options: ['為了得到完全精準成本', '為了判斷系統量級與可能瓶頸', '為了取代壓力測試', '為了決定變數名稱'], answer: 1, explanation: '估算的目的在判斷量級，讓架構選擇有依據。' },
                    { id: 'sd01-q4', type: 'choice', question: '好的系統設計改進方式通常是？', options: ['一次加入所有流行技術', '先 Benchmark/觀察瓶頸，再針對瓶頸改善', '永遠先拆 Microservices', '永遠先用 NoSQL'], answer: 1, explanation: '架構應從可觀察到的需求與瓶頸迭代，而不是預先堆複雜度。' },
                    { id: 'sd01-q5', type: 'fill', question: '填空：平均 QPS 可粗略用「每日 Request 數 ÷ ______」估算。請輸入一天的秒數。', answerText: '86400', explanation: '一天有 86,400 秒。' }
                ]
            },
            {
                id: 'sd-02',
                title: '從單機到 Scale Up / Scale Out',
                level: '基礎',
                duration: '18–25 分鐘',
                summary: '理解單機架構為什麼其實是好起點，以及何時升級硬體、何時水平擴展。',
                content: [
                    { type: 'slides', title: '一個產品從 0 到成長的演化', slides: [
                        { kicker: '0 → 100 users', title: '單機其實完全合理', text: '流量很小時，把 Web App 與 Database 放在一台或少量資源上，開發與維運最簡單。不要為不存在的流量付複雜度成本。', visual: '👤 → 🖥️ App + DB' },
                        { kicker: '開始變慢', title: '先確認是哪種資源不夠', text: 'CPU 100%？RAM 不夠？DB query 慢？Connection pool 滿？磁碟 I/O？先量測，不要猜。', visual: 'CPU · RAM · Disk I/O · Network · DB Connections' },
                        { kicker: '簡單解法', title: 'Scale Up', text: '換更強機器最直覺：CPU、RAM、SSD 升級。適合快速解決早期瓶頸，但硬體有上限，也沒有消除單點故障。', visual: '4 Core / 8 GB → 32 Core / 128 GB' },
                        { kicker: '需要更多彈性', title: 'Scale Out', text: '把應用複製成多台，共同承載流量。這一步會引入 Load Balancer、Stateless、共享 Session、部署一致性等新問題。', visual: 'LB → App A / App B / App C' }
                    ]},
                    { type: 'demo', kind: 'scale', title: '切換三種擴展策略', text: '自己比較單機、垂直擴展與水平擴展。' },
                    { type: 'heading', text: '1. Scale Up 與 Scale Out 的真正差別' },
                    { type: 'compare', items: [
                        { icon: '⬆️', title: 'Scale Up / Vertical Scaling', text: '提升同一台主機規格。優點是簡單、應用幾乎不用改；缺點是昂貴、有硬體上限，而且單機故障仍可能整個服務停掉。', bestFor: '早期產品、單體 DB、快速救急' },
                        { icon: '↔️', title: 'Scale Out / Horizontal Scaling', text: '增加更多節點分攤負載。可提升容量與可用性，但必須處理流量分配、共享狀態、部署一致性與節點故障。', bestFor: '高流量、需要 HA、可平行處理的工作負載' }
                    ]},
                    { type: 'heading', text: '2. 為什麼 Stateless 是 Scale Out 的關鍵？' },
                    { type: 'paragraph', text: '假設使用者登入後，Session 只放在 App A 的 RAM。下一個 Request 被送到 App B，B 根本不知道這個人已登入。水平擴展最理想的 App Server 是「任何一台都能接任何 Request」。' },
                    { type: 'diagram', nodes: [
                        { title: 'Client', subtitle: '帶 Token / Session ID' },
                        { title: 'Load Balancer', subtitle: '任選健康節點' },
                        { title: 'App Servers', subtitle: '不保存使用者私有狀態' },
                        { title: 'Redis / DB', subtitle: '共享狀態集中保存' }
                    ], caption: '把共享狀態移出單一 App Server，節點才容易新增、移除、重啟與自動擴展。' },
                    { type: 'checkpoint', question: '三台 Web Server 後面掛 Load Balancer，但 Session 全存在各台自己的 RAM，最可能發生什麼？', options: ['一定更快', '使用者 Request 換到另一台時可能掉登入狀態', 'DB 自動 Sharding', 'DNS 失效'], answer: 1, explanation: '本機 Session 讓節點帶狀態，會讓 Request 不能任意分配。' },
                    { type: 'heading', text: '3. Scale Out 不是免費午餐' },
                    { type: 'bullet', text: 'App Server 變多，Database 同時連線數也會變多，下游可能反而先爆。' },
                    { type: 'bullet', text: '部署版本必須一致；否則不同節點行為可能不同。' },
                    { type: 'bullet', text: '需要 Health Check，壞掉的節點必須從流量池移除。' },
                    { type: 'bullet', text: '如果上傳檔案存在本機磁碟，下一台 Server 看不到；通常要改成 Object Storage 或共享儲存。' },
                    { type: 'callout', text: '資深面試回答的差異：不是只說「流量大就 Scale Out」，而是同時說明 Stateless、shared state、downstream pressure、health check 這些後果。' }
                ],
                quiz: [
                    { id: 'sd02-q1', type: 'choice', question: '把 8 Core / 16 GB 主機換成 32 Core / 128 GB，屬於？', options: ['Scale Out', 'Scale Up', 'Replication', 'Partitioning'], answer: 1, explanation: '提升單一節點規格就是垂直擴展。' },
                    { id: 'sd02-q2', type: 'choice', question: '水平擴展 Web Server 時，哪個設計最理想？', options: ['Session 只存本機 RAM', '使用者圖片只存本機 C 槽', '共享狀態放 Redis/DB，App 保持 Stateless', '每個人固定手動指定 Server'], answer: 2, explanation: 'Stateless App 讓任何健康節點都能處理 Request。' },
                    { id: 'sd02-q3', type: 'choice', question: 'Scale Out 後，下游最值得立即觀察哪件事？', options: ['Database/Cache 連線與負載是否增加', 'HTML 字體', '變數命名', 'IDE Theme'], answer: 0, explanation: '上游節點增加會帶來更多並行下游連線與請求。' },
                    { id: 'sd02-q4', type: 'choice', question: '哪個是 Scale Up 的主要限制？', options: ['完全不能提升效能', '硬體上限與單點故障仍存在', '一定要用 Redis', '一定要拆 Microservices'], answer: 1, explanation: 'Scale Up 簡單有效，但不能無限升級，也不自動提供高可用。' },
                    { id: 'sd02-q5', type: 'fill', question: '填空：讓任何 App Server 都能處理任何 Request 的設計，常稱為 ________ service。', answerText: 'stateless', explanation: 'Stateless service 不把使用者共享狀態綁在特定節點。' }
                ]
            },
            {
                id: 'sd-03',
                title: 'Load Balancer、Reverse Proxy、DNS 與流量入口',
                level: '基礎',
                duration: '20–28 分鐘',
                summary: '搞懂 Request 進站後誰負責解析、代理、健康檢查與分流，以及 L4/L7 的差異。',
                content: [
                    { type: 'slides', title: '使用者輸入網址之後', slides: [
                        { kicker: 'DNS', title: '先把名稱變成可以連線的位置', text: '使用者知道的是 api.example.com，網路傳輸需要找到對應 IP。DNS 負責名稱解析，但它不是拿來執行你的商業邏輯。', visual: 'api.example.com → 203.0.113.10' },
                        { kicker: 'EDGE / PROXY', title: 'Request 先進入口層', text: 'Nginx、HAProxy、Cloud Load Balancer 等可以在入口處處理 TLS、路由、健康檢查、限流或靜態內容。', visual: 'Client → Reverse Proxy / Load Balancer' },
                        { kicker: 'ROUTING', title: '決定送去哪一個後端', text: '多台 App Server 時，Load Balancer 根據演算法與健康狀態選節點；L7 還可以依 Host、Path、Header 等應用層資訊路由。', visual: '/api → API Pool<br>/video → Video Pool' },
                        { kicker: 'FAILURE', title: '故障節點要停止收流量', text: 'Health Check 讓 LB 知道哪些節點能接 Request。高可用架構還要思考 Load Balancer 自己是不是單點。', visual: 'A ✅　B ❌　C ✅<br>只送 A / C' }
                    ]},
                    { type: 'heading', text: '1. Reverse Proxy 跟 Load Balancer 一樣嗎？' },
                    { type: 'compare', items: [
                        { icon: '🔁', title: 'Reverse Proxy', text: '站在 Server 前方代表後端接收 Client Request。即使只有一台後端，也可以做 TLS termination、壓縮、路由、快取與隱藏內部服務。', bestFor: '單台或多台後端都可能使用' },
                        { icon: '🚦', title: 'Load Balancer', text: '重點是把工作分配到多個後端資源，並避開不健康節點。很多產品同時具備 Reverse Proxy 與 Load Balancing 功能。', bestFor: '多節點分流與可用性' }
                    ]},
                    { type: 'heading', text: '2. L4 與 L7 Load Balancing' },
                    { type: 'stepper', steps: [
                        { title: 'Layer 4', text: '依 TCP/UDP、IP、Port 等傳輸層資訊做分流。不需要理解 HTTP 內容，處理方式較底層。' },
                        { title: 'Layer 7', text: '理解 HTTP/HTTPS，可以根據 Host、URL Path、Header、Cookie 等決定路由。彈性高，但需要處理應用層協定。' },
                        { title: '實際選擇', text: '不是誰永遠比較好。你需要的是低層連線分流，還是 /api、/images、租戶、Header 等內容路由？由需求決定。' }
                    ]},
                    { type: 'demo', kind: 'load-balancer', title: '自己把 Server 打掛看看', text: '模擬 Round Robin 與健康節點移除。點 Server 可切換 healthy / DOWN。' },
                    { type: 'heading', text: '3. 常見 Load Balancing 策略' },
                    { type: 'bullet', text: 'Round Robin：依序輪流，簡單，但不考慮每個 Request 成本不同。' },
                    { type: 'bullet', text: 'Weighted Round Robin：較強機器拿較高權重。' },
                    { type: 'bullet', text: 'Least Connections：送到目前連線較少的節點。' },
                    { type: 'bullet', text: 'Consistent Hashing：常用於需要穩定映射到節點的情境；後面進階章節再深入。' },
                    { type: 'checkpoint', question: '你想把 /video/* 導到影片服務、/payment/* 導到付款服務，哪種能力最直接？', options: ['L7 routing', '只看 TCP Port 的 L4 routing', 'DB Replication', 'Sharding'], answer: 0, explanation: '依 URL Path 做決策需要理解 HTTP 應用層資訊。' },
                    { type: 'heading', text: '4. Load Balancer 也可能是單點' },
                    { type: 'paragraph', text: '如果只有一台 LB，它掛了，後面 100 台 App Server 全健康也沒有意義。真正高可用通常會讓入口層本身有冗餘、Managed LB、Failover 或多區部署。' },
                    { type: 'callout', text: '設計時每加一個「解決單點」的元件，都要反問：那這個新元件自己會不會成為下一個單點？' }
                ],
                quiz: [
                    { id: 'sd03-q1', type: 'choice', question: 'DNS 的核心工作是？', options: ['執行 SQL', '把名稱解析到可連線位置/IP', '保存 Session', '做 Python GC'], answer: 1, explanation: 'DNS 負責名稱解析。' },
                    { id: 'sd03-q2', type: 'choice', question: '哪個功能最典型屬於 Load Balancer？', options: ['把 Request 分配給多個健康後端', '設計資料表', '編譯 Vue', '儲存圖片'], answer: 0, explanation: 'LB 的核心是分流並避開不健康節點。' },
                    { id: 'sd03-q3', type: 'choice', question: '依 URL Path 做路由通常屬於哪一層能力？', options: ['L1', 'L2', 'L4', 'L7'], answer: 3, explanation: 'HTTP Path 是應用層資訊，對應 Layer 7。' },
                    { id: 'sd03-q4', type: 'choice', question: '只有一台 Load Balancer 可能帶來什麼風險？', options: ['它可能成為 Single Point of Failure', 'DB 一定變 NoSQL', 'Client 不需要 DNS', '所有 Request 都會被 Cache'], answer: 0, explanation: '入口層本身也需要高可用設計。' },
                    { id: 'sd03-q5', type: 'fill', question: '填空：依序把 Request 輪流分給 A、B、C 的常見策略叫 Round ______。', answerText: 'Robin', explanation: 'Round Robin 是最常見的輪詢分配方式之一。' }
                ]
            },
            {
                id: 'sd-04',
                title: 'Cache 與 Redis：快取不是「加了就變快」',
                level: '基礎 → 中階',
                duration: '22–30 分鐘',
                summary: '從 Cache Hit/Miss、Cache-Aside、TTL 到 stale data、stampede 與一致性問題。',
                content: [
                    { type: 'slides', title: '為什麼 Database 前面會多一層 Cache？', slides: [
                        { kicker: 'HOT DATA', title: '很多 Request 重複讀同一批資料', text: '熱門商品、使用者 Session、排行榜、設定值可能被反覆查詢。每次都打 Database，昂貴而且延遲較高。', visual: '10,000 reads → 同一個 product:42' },
                        { kicker: 'MEMORY', title: '把熱門資料放到更快的位置', text: 'Redis / Memcached 等 In-memory Cache 可以吸收大量重複讀取，讓 Database 專注處理必要的查詢與寫入。', visual: 'App → Redis HIT → Response<br>　　 ↘ MISS → DB' },
                        { kicker: 'TRADE-OFF', title: '快取開始後，資料有兩份', text: 'Database 更新了，Cache 還是舊值怎麼辦？TTL 要多久？Cache 掛了怎麼辦？熱門 Key 同時過期怎麼辦？效能換來的是一致性與失效策略複雜度。', visual: 'Fast ≠ Free<br>Staleness · Invalidation · Failure' }
                    ]},
                    { type: 'demo', kind: 'cache', title: '親手看到 Cache Miss → Hit', text: '第一次讀 DB，第二次直接命中 Cache。' },
                    { type: 'heading', text: '1. Cache-Aside：最常見的讀取模型' },
                    { type: 'stepper', steps: [
                        { title: '先查 Cache', text: 'App 先用 key 查 Redis。存在就直接回傳，這叫 Cache Hit。' },
                        { title: 'Miss 才查 DB', text: '如果 Redis 沒資料，才去 Database 讀。' },
                        { title: '寫回 Cache', text: 'DB 結果回來後放進 Cache，通常同時設定 TTL。' },
                        { title: '回傳 Client', text: '後續同一資料的讀取，在 TTL 或 invalidation 前就能直接 Hit。' }
                    ]},
                    { type: 'code', text: 'def get_product(product_id):\n    key = f"product:{product_id}"\n    product = redis.get(key)\n\n    if product is not None:          # cache hit\n        return product\n\n    product = db.get_product(product_id)  # cache miss\n    redis.setex(key, 300, serialize(product))\n    return product' },
                    { type: 'heading', text: '2. TTL 解決一部分 stale data，但不是全部' },
                    { type: 'paragraph', text: 'TTL 讓快取到期後重新取得資料，可以限制資料最多舊多久。但 TTL 太短會降低 hit rate；太長則可能讓舊資料存在太久。更即時的系統常在資料更新時主動刪除或更新 Cache。' },
                    { type: 'compare', items: [
                        { icon: '⏳', title: 'TTL', text: '簡單、能自動淘汰，但在 TTL 期間仍可能讀到舊資料。', bestFor: '允許短暫 stale、讀多寫少' },
                        { icon: '🧹', title: 'Invalidate on Write', text: '資料更新時主動刪掉 Cache，下次讀重新載入。更即時，但寫入流程與錯誤處理更複雜。', bestFor: '資料更新後希望較快反映' }
                    ]},
                    { type: 'heading', text: '3. 三個常見 Cache 災難' },
                    { type: 'bullet', text: 'Cache Stampede：熱門 Key 同時過期，大量 Request 一起穿透去 DB。可用 lock/single-flight、TTL jitter、提前刷新等方式減少。' },
                    { type: 'bullet', text: 'Cache Penetration：大量查詢「根本不存在」的 Key，每次都 Miss 打 DB。可短暫 cache negative result，或用 Bloom Filter 等策略。' },
                    { type: 'bullet', text: 'Cache Avalanche：大量 Key 在相近時間過期，瞬間把 DB 壓垮。TTL 加隨機抖動是常見緩解方式之一。' },
                    { type: 'checkpoint', question: '熱門 Key 一過期，10,000 個 Request 同時 Miss 後全部打 DB，這最接近哪個問題？', options: ['Cache Stampede', 'DNS Round Robin', 'Database Sharding', 'CSS Reflow'], answer: 0, explanation: '同一熱門資料失效後，大量請求同時回源，是典型 stampede。' },
                    { type: 'callout', text: '面試回答 Cache 時至少要說出：放什麼、key 怎麼設計、TTL、多大容量、更新/失效策略、Cache 掛掉怎麼辦、怎麼避免熱點或 stampede。' }
                ],
                quiz: [
                    { id: 'sd04-q1', type: 'choice', question: 'Cache Hit 代表什麼？', options: ['Cache 中找到資料，可直接使用', '一定要查 DB', 'Redis 掛了', '資料一定最新'], answer: 0, explanation: 'Hit 表示所需資料已存在 Cache。' },
                    { id: 'sd04-q2', type: 'choice', question: 'Cache-Aside 在 Cache Miss 後通常會？', options: ['直接回 500', '查 DB，並把結果放入 Cache', '刪掉 DB', '重啟 App'], answer: 1, explanation: 'Cache-Aside 由應用程式負責回源 DB 並回填 Cache。' },
                    { id: 'sd04-q3', type: 'choice', question: 'TTL 設太短最可能造成？', options: ['Hit rate 下降、更多 Request 回源', '資料永遠不更新', 'DNS 失效', 'LB 不做 Health Check'], answer: 0, explanation: '頻繁到期會造成更多 Miss 與 DB 壓力。' },
                    { id: 'sd04-q4', type: 'choice', question: '大量熱門 Key 幾乎同時過期，造成 DB 突然承受巨大流量，常被稱為？', options: ['Cache Avalanche', 'Scale Up', 'Read Replica', 'Binary Search'], answer: 0, explanation: '大量 Key 同時失效造成回源洪峰，是 Cache Avalanche。' },
                    { id: 'sd04-q5', type: 'fill', question: '填空：Redis 常見的 Key 過期時間縮寫為 ___。', answerText: 'TTL', explanation: 'TTL = Time To Live。' }
                ]
            },
            {
                id: 'sd-05',
                title: 'Database Scaling：Replication、Sharding 與一致性',
                level: '基礎 → 中階',
                duration: '25–35 分鐘',
                summary: '理解 Database 為何成為瓶頸，以及讀副本、分片、SQL/NoSQL 與資料一致性的取捨。',
                content: [
                    { type: 'slides', title: 'Database 不夠用了，先分清是哪種「不夠」', slides: [
                        { kicker: 'READ BOTTLENECK', title: '讀太多', text: '如果是讀取遠高於寫入，可以先考慮 Index、Query tuning、Cache，再到 Read Replica。不是所有慢 DB 都要 Sharding。', visual: 'Read-heavy → Index / Cache / Replica' },
                        { kicker: 'STORAGE / WRITE', title: '單庫容量或寫入吞吐到上限', text: '資料量太大、單台磁碟與 IOPS 撐不住、寫入無法再提升時，才可能需要 Partition / Sharding。', visual: 'Data → Shard A + Shard B + Shard C' },
                        { kicker: 'AVAILABILITY', title: '不能接受一台 DB 掛掉就全停', text: 'Replication 也能提高可用性，但 failover、replication lag、promotion 與資料一致性都需要設計。', visual: 'Primary → Replica<br>Failover when Primary DOWN' },
                        { kicker: 'TRADE-OFF', title: '資料分散後，查詢會變難', text: '跨 shard JOIN、transaction、排序、聚合、重新分片都比單庫複雜。Sharding 是突破上限的工具，不是免費效能按鈕。', visual: 'Scale ↑　Complexity ↑' }
                    ]},
                    { type: 'demo', kind: 'database', title: '切換 Single DB / Read Replica / Sharding', text: '看清楚三種架構各自在解決哪一類瓶頸。' },
                    { type: 'heading', text: '1. Replication：複製資料，不是切資料' },
                    { type: 'diagram', nodes: [
                        { title: 'App Write', subtitle: '寫入' },
                        { title: 'Primary', subtitle: '接受主要寫入' },
                        { title: 'Replication', subtitle: '複製變更' },
                        { title: 'Read Replica', subtitle: '承接部分讀取' }
                    ], caption: 'Replica 通常持有相同或近似相同資料副本；Sharding 則是不同節點持有不同資料子集。' },
                    { type: 'paragraph', text: '非同步 replication 可能產生 replication lag：Primary 已更新，但 Replica 還沒追上。如果使用者剛修改名字，下一秒從 Replica 讀，可能看到舊值。' },
                    { type: 'heading', text: '2. Sharding：把資料切成多份' },
                    { type: 'stepper', steps: [
                        { title: '選 Shard Key', text: '例如 user_id。好的 shard key 讓資料與流量分散均勻，也盡量讓常一起查詢的資料落在同一 shard。' },
                        { title: '路由', text: '應用或中介層根據 shard key 決定 Request 要去 Shard A、B 或 C。' },
                        { title: '避免 Hot Shard', text: '如果某些 key 特別熱門，單一 shard 仍會過熱。單純 hash 也不是所有場景都完美。' },
                        { title: 'Rebalancing', text: '新增 shard 時要重新分配資料。大規模搬移資料、雙寫、切流量都需要謹慎規劃。' }
                    ]},
                    { type: 'heading', text: '3. SQL vs NoSQL 不要用「誰比較快」回答' },
                    { type: 'compare', items: [
                        { icon: '🧮', title: 'Relational / SQL', text: 'Schema、關聯、JOIN、Transaction、ACID 能力通常成熟。適合關聯明確、需要複雜查詢與交易一致性的資料。', bestFor: '交易、訂單、關聯資料、強一致需求' },
                        { icon: '🗂️', title: 'NoSQL', text: 'Key-value、Document、Wide-column、Graph 各自解決不同資料模型與擴展需求。不能把 NoSQL 當成單一種類。', bestFor: '依存取模式、資料模型與擴展需求選擇' }
                    ]},
                    { type: 'checkpoint', question: '你有 1 個 Primary + 3 個 Read Replicas。使用者剛寫入後立刻從 Replica 讀到舊值，最可能原因？', options: ['Replication Lag', 'DNS TTL', 'Binary Search 錯誤', 'Load Balancer 一定故障'], answer: 0, explanation: '非同步複製可能讓 Replica 短時間落後 Primary。' },
                    { type: 'heading', text: '4. 正確的 Database Scaling 順序' },
                    { type: 'bullet', text: '先確認 Query、Index、N+1、Connection Pool、鎖與 Transaction 是否合理。' },
                    { type: 'bullet', text: '讀壓力：先看 Cache / Read Replica 是否就能解。' },
                    { type: 'bullet', text: '容量或寫入瓶頸：再評估 Partition / Sharding。' },
                    { type: 'bullet', text: '任何 replication / sharding 都要同步討論 consistency、failure、backup、recovery、rebalancing。' },
                    { type: 'callout', text: '「資料庫很慢，所以 Sharding」通常不是好回答。先說你如何證明瓶頸，再說更便宜的優化做完了嗎，最後才進到分散式資料庫複雜度。' }
                ],
                quiz: [
                    { id: 'sd05-q1', type: 'choice', question: 'Read Replica 最直接用來改善哪種情境？', options: ['讀取壓力很高', 'CSS 太慢', '前端 Bundle 太大', '使用者忘記密碼'], answer: 0, explanation: 'Read Replica 可以分攤讀流量。' },
                    { id: 'sd05-q2', type: 'choice', question: 'Replication 與 Sharding 的核心差異？', options: ['兩者完全相同', 'Replication 複製資料；Sharding 把資料切成不同子集', 'Sharding 只用於 Cache', 'Replication 只用於 DNS'], answer: 1, explanation: 'Replication 是副本；Sharding 是資料分片。' },
                    { id: 'sd05-q3', type: 'choice', question: 'Replication Lag 最可能造成？', options: ['Replica 暫時讀到舊資料', 'Primary 一定刪除', 'DNS 無法解析', '所有資料永久遺失'], answer: 0, explanation: 'Replica 尚未同步到最新變更時，可能讀到 stale data。' },
                    { id: 'sd05-q4', type: 'choice', question: 'Sharding 最大的代價之一是？', options: ['完全不能增加容量', '跨 shard 查詢、交易與 rebalancing 更複雜', '一定比單機便宜', '完全不需要 shard key'], answer: 1, explanation: '資料切開後，跨分片操作與重新平衡都會變複雜。' },
                    { id: 'sd05-q5', type: 'fill', question: '填空：用來決定資料應該落在哪個 Shard 的欄位通常稱為 Shard ___.', answerText: 'Key', explanation: 'Shard Key 是分片路由與分布的核心。' }
                ]
            }
        ]
    },
    {
        id: 'algorithm-python',
        title: '演算法（Python）',
        icon: '🐍',
        description: '不背答案，從時間複雜度與資料結構開始，逐步看指標、Hash、Stack、Window 與 Binary Search 怎麼動。',
        lessons: [
            {
                id: 'algo-01',
                title: 'Big-O：先學會看程式會跑幾次',
                level: '基礎',
                duration: '20–28 分鐘',
                summary: '建立 O(1)、O(log n)、O(n)、O(n log n)、O(n²) 的直覺，並連結 Python List / Set / Dict。',
                content: [
                    { type: 'slides', title: 'Big-O 到底在看什麼？', slides: [
                        { kicker: 'IDEA', title: '不是算「幾毫秒」', text: 'Big-O 描述的是資料量 n 成長時，工作量如何成長。不同電腦速度不同，但成長趨勢可以比較。', visual: 'n = 10 → 100 → 1,000 → 1,000,000' },
                        { kicker: 'O(1)', title: '資料再多，做的事差不多', text: '例如知道 index，直接取 list[index]；或一般情況下用 dict key 查值。', visual: 'items[500] → 直接定位' },
                        { kicker: 'O(n)', title: '資料變 10 倍，工作大致也 10 倍', text: '例如在 list 中找某個「值」，不知道它在哪，只能一路比較。', visual: 'for x in items: ...' },
                        { kicker: 'O(n²)', title: '雙層掃描會快速爆炸', text: '100 個元素約 10,000 次組合；10,000 個元素就可能到 100,000,000 等級。這是很多演算法優化的起點。', visual: 'for a in items:<br>　for b in items: ...' }
                    ]},
                    { type: 'demo', kind: 'complexity', title: '改變 n，看工作量怎麼長', text: '點 10、100、1,000，比較 O(1)、O(log n)、O(n)、O(n²)。' },
                    { type: 'heading', text: '1. 常見複雜度先建立直覺' },
                    { type: 'stepper', steps: [
                        { title: 'O(1)', text: '固定次數工作。例：arr[5]、一般情況下 dict[key]、set membership。' },
                        { title: 'O(log n)', text: '每一步都砍掉固定比例，最典型是已排序資料的 Binary Search。' },
                        { title: 'O(n)', text: '完整掃一次。例：for x in numbers，或 x in list。' },
                        { title: 'O(n log n)', text: '常見於有效率的比較式排序。比 O(n²) 好很多，但仍比單次掃描貴。' },
                        { title: 'O(n²)', text: '常見於兩層都跑 n 次的 nested loop，例如暴力比對所有 pair。' }
                    ]},
                    { type: 'heading', text: '2. Python 容器選擇會直接改變複雜度' },
                    { type: 'compare', items: [
                        { icon: '📃', title: 'list', text: '依 index 讀取快；但要找「某個值是否存在」通常需要從頭掃到找到為止。', bestFor: '有順序、依 index 操作、允許重複' },
                        { icon: '#️⃣', title: 'set / dict', text: '底層使用 hash table；一般情況下 membership / key lookup 可視為平均 O(1)。', bestFor: '快速查存在、Key → Value 映射' }
                    ]},
                    { type: 'code', text: 'numbers = [4, 8, 15, 16, 23, 42]\n\n# 找「值」：通常 O(n)\n23 in numbers\n\nseen = {4, 8, 15, 16, 23, 42}\n\n# Hash lookup：平均 O(1)\n23 in seen' },
                    { type: 'checkpoint', question: '如果你要重複做 100,000 次「這個 ID 存不存在？」查詢，而且不在意順序，哪個結構通常比 list 更合適？', options: ['set', '巢狀 list', '只用 tuple 因為名字短', '每次重新 sort'], answer: 0, explanation: '大量 membership lookup 通常適合 set。' },
                    { type: 'heading', text: '3. Big-O 只保留主導項' },
                    { type: 'paragraph', text: 'O(2n + 10) 仍寫成 O(n)；O(n² + n) 寫成 O(n²)。因為 n 很大時，最高成長階的項目主導整體。' },
                    { type: 'callout', text: '你不用一開始背完整 complexity table。先能看到「完整掃描一次」「砍一半」「雙層掃描」「Hash lookup」這四種形狀，後面題目就會開始有感。' }
                ],
                quiz: [
                    { id: 'a01-q1', type: 'choice', question: '單層 for loop 掃完整個 n 個元素，通常是？', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2, explanation: '每個元素最多被處理一次，工作量與 n 線性成長。' },
                    { id: 'a01-q2', type: 'choice', question: '兩層迴圈都各跑 n 次，通常是？', options: ['O(1)', 'O(n)', 'O(n log n)', 'O(n²)'], answer: 3, explanation: 'n × n = n²。' },
                    { id: 'a01-q3', type: 'choice', question: '`target in numbers`，numbers 是 Python list，通常是？', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], answer: 1, explanation: 'List membership 通常需要逐項比較。' },
                    { id: 'a01-q4', type: 'choice', question: '`target in seen`，seen 是 Python set，一般平均可視為？', options: ['O(1)', 'O(n)', 'O(n²)', 'O(2ⁿ)'], answer: 0, explanation: 'Set 使用 hash table，一般平均 membership lookup 為 O(1)。' },
                    { id: 'a01-q5', type: 'fill', question: '填空：O(n² + n + 100) 簡化後寫成 O(n^__)。', answerText: '2', explanation: '保留成長最快的 n²。' }
                ]
            },
            {
                id: 'algo-02',
                title: 'Hash Table：Two Sum 為什麼只要掃一次',
                level: '基礎',
                duration: '22–30 分鐘',
                summary: '真正理解 seen、needed 與「先查再放」的邏輯，把 O(n²) 降成平均 O(n)。',
                content: [
                    { type: 'slides', title: 'Two Sum 從暴力到 Hash', slides: [
                        { kicker: 'PROBLEM', title: '給 numbers 與 target，找兩個數', text: '例如 [2, 7, 11, 15]，target = 9。答案是 2 + 7。要求回傳兩個索引。', visual: '[2, 7, 11, 15] → target 9' },
                        { kicker: 'BRUTE FORCE', title: '最直覺：每個跟每個比', text: '第一個數配後面所有數，第二個再配後面所有數……最壞接近 n² 次比較。', visual: '2×7　2×11　2×15<br>7×11　7×15 ...' },
                        { kicker: 'REFRAME', title: '其實我只想知道「另一半看過沒」', text: '讀到 number 時，needed = target - number。如果 needed 已經出現在前面，就找到答案。', visual: 'number = 7<br>needed = 9 - 7 = 2' },
                        { kicker: 'HASH', title: '用 Dict 記住已看過的數', text: 'Dict 讓 needed lookup 一般平均 O(1)。整個 numbers 只需要走一次，所以整體平均 O(n)。', visual: 'seen = { 2: 0 }<br>2 in seen? ✅' }
                    ]},
                    { type: 'demo', kind: 'hash-two-sum', title: '一步一步跑 Two Sum', text: '按下一步，觀察 current、needed、seen 怎麼改變。' },
                    { type: 'heading', text: '1. 為什麼第一次一定找不到，不是 Bug？' },
                    { type: 'paragraph', text: '一開始 seen 是空的，所以第一個 number 算出的 needed 當然不會存在。這次查詢的目的不是「第一輪要成功」，而是確保不能拿同一個元素配自己，然後把第一個數記住，讓後面的數可以找它。' },
                    { type: 'code', text: 'def two_sum(numbers, target):\n    seen = {}\n\n    for index, number in enumerate(numbers):\n        needed = target - number\n\n        if needed in seen:\n            return [seen[needed], index]\n\n        seen[number] = index\n\n    return None' },
                    { type: 'heading', text: '2. 為什麼是「先查，再放」？' },
                    { type: 'compare', items: [
                        { icon: '✅', title: '先查再放', text: '避免同一個 index 被自己使用。讀到 3、target=6 時，只有前面真的出現過另一個 3 才會成功。', bestFor: 'Two Sum 標準寫法' },
                        { icon: '⚠️', title: '先放再查', text: '如果把自己先放進 seen，再問 needed 是否存在，target = number * 2 時可能誤把自己當另一個元素。', bestFor: '需要額外條件才能避免同 index' }
                    ]},
                    { type: 'checkpoint', question: 'numbers=[3,3]、target=6。第一次讀到 index 0 的 3 時應該怎麼做？', options: ['立即回傳 [0,0]', '因為 seen 空所以先存 3，繼續下一個', '把 target 改成 3', '排序後刪除重複'], answer: 1, explanation: '同一元素不能使用兩次；第二個 3 到來時才會用到第一個 3。' },
                    { type: 'heading', text: '3. 時間換空間' },
                    { type: 'paragraph', text: '暴力法幾乎不用額外資料結構，但時間 O(n²)。Hash 解法使用 O(n) 額外空間存 seen，換得平均 O(n) 時間。這就是常見的 time-space trade-off。' },
                    { type: 'callout', text: '看到「快速判斷某個值以前是否出現」「統計次數」「Key → Index」時，要開始想到 Dict / Set。不是因為 Two Sum 要背 Dict，而是問題本身需要快速 lookup。' }
                ],
                quiz: [
                    { id: 'a02-q1', type: 'choice', question: 'Two Sum Hash 解法中 `needed` 通常等於？', options: ['number - target', 'target - number', 'target + number', 'index - number'], answer: 1, explanation: '要找的另一個數 = target - current number。' },
                    { id: 'a02-q2', type: 'choice', question: '為什麼 `seen` 常用 dict 而不是 list？', options: ['因為 dict 一定比較省 RAM', '需要快速用 number 找到之前的 index', '因為 list 不能放數字', '因為 dict 會自動排序'], answer: 1, explanation: 'Dict 同時提供快速 key lookup 與 number → index 映射。' },
                    { id: 'a02-q3', type: 'choice', question: 'Two Sum Hash 解法平均時間複雜度？', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2, explanation: '只掃一次，每次 Hash lookup 一般平均 O(1)。' },
                    { id: 'a02-q4', type: 'choice', question: '使用 Hash 解法主要多付出什麼成本？', options: ['O(n) 額外空間', '一定 O(n²) 空間', '不能處理重複值', '不能回 index'], answer: 0, explanation: 'seen 最多存 n 個元素。' },
                    { id: 'a02-q5', type: 'fill', question: '填空：`if needed in ____:` 用來判斷另一半是否曾經出現。', answerText: 'seen', explanation: 'seen 保存之前已讀到的 number。' }
                ]
            },
            {
                id: 'algo-03',
                title: 'Stack / Queue：括號題與 Call Stack 的共同核心',
                level: '基礎',
                duration: '22–30 分鐘',
                summary: '理解 LIFO / FIFO、Push / Pop，並用 Valid Parentheses 看 Stack 為什麼自然適合「最近未完成工作」。',
                content: [
                    { type: 'slides', title: 'Stack 與 Queue 的直覺', slides: [
                        { kicker: 'STACK', title: '最後放進去，最先拿出來', text: '像疊盤子。Push 放上去，Pop 從最上面拿。這叫 LIFO：Last In, First Out。', visual: 'TOP → [ C ]<br>　　　[ B ]<br>　　　[ A ]' },
                        { kicker: 'QUEUE', title: '先來的人先處理', text: '像排隊。Enqueue 從尾巴加入，Dequeue 從前面拿。這叫 FIFO：First In, First Out。', visual: 'OUT ← [A][B][C] ← IN' },
                        { kicker: 'WHY STACK', title: '括號配對只關心「最近一個沒關掉的」', text: '讀到右括號 `]` 時，必須配最近尚未完成的左括號。這正好就是 Stack Top。', visual: '({ [ ← top<br>看到 ] → 配 [' },
                        { kicker: 'CALL STACK', title: '函式呼叫也是最近呼叫的先返回', text: 'main 呼叫 A，A 呼叫 B，B 完成後先回 A，再回 main。這也是 LIFO。', visual: 'main → A → B<br>B return → A return → main' }
                    ]},
                    { type: 'demo', kind: 'stack', title: '逐字讀 `({[]})`', text: '每次按一下，看 Push / Pop 與 Stack Top。' },
                    { type: 'heading', text: '1. Python 怎麼當 Stack？' },
                    { type: 'code', text: 'stack = []\n\nstack.append("(")   # push\nstack.append("[")   # push\n\ntop = stack[-1]     # peek\nvalue = stack.pop()  # pop' },
                    { type: 'paragraph', text: 'Python list 的尾端 append / pop 很適合當 Stack。若要高效率從「左側」加入/移除 Queue 元素，通常使用 collections.deque，避免 list.pop(0) 搬動後面元素。' },
                    { type: 'heading', text: '2. Valid Parentheses 思考流程' },
                    { type: 'stepper', steps: [
                        { title: '遇左括號', text: '把 `(`、`[`、`{` Push 進 Stack，代表這個工作尚未結束。' },
                        { title: '遇右括號', text: '如果 Stack 已空，代表根本沒有可以配對的左括號 → False。' },
                        { title: '比 Stack Top', text: 'Pop 最近左括號，確認是否與目前右括號同類型。不同就 False。' },
                        { title: '最後檢查', text: '整串讀完後 Stack 必須為空，否則代表還有左括號沒關閉。' }
                    ]},
                    { type: 'code', text: 'def is_valid(s: str) -> bool:\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n\n    for ch in s:\n        if ch in "([{":\n            stack.append(ch)\n            continue\n\n        if not stack or stack.pop() != pairs[ch]:\n            return False\n\n    return not stack' },
                    { type: 'checkpoint', question: '`([)]` 為什麼是 False？', options: ['因為字串長度是偶數', '讀到 ) 時 Stack Top 是 [，最近配對不符', '因為不能使用 list', '因為 Queue 才能配括號'], answer: 1, explanation: '括號必須符合巢狀順序，右括號要配最近尚未關閉的左括號。' },
                    { type: 'heading', text: '3. 什麼題型要想到 Stack？' },
                    { type: 'bullet', text: '最近尚未完成 / 最近加入的狀態最重要。' },
                    { type: 'bullet', text: '括號、HTML/XML tag 巢狀匹配。' },
                    { type: 'bullet', text: 'Undo / Redo、瀏覽器 Back 的概念。' },
                    { type: 'bullet', text: 'DFS 的 iterative 寫法、Monotonic Stack 等進階題。' },
                    { type: 'callout', text: 'Call Stack 不是「某個 Python 特有東西」，而是程式執行時管理函式呼叫 frame 的堆疊概念。遞迴太深會 Stack Overflow，正因為每一層呼叫都還沒 return。' }
                ],
                quiz: [
                    { id: 'a03-q1', type: 'choice', question: 'Stack 的順序是？', options: ['FIFO', 'LIFO', '隨機', '依字母排序'], answer: 1, explanation: 'Stack 是 Last In, First Out。' },
                    { id: 'a03-q2', type: 'choice', question: 'Queue 的順序是？', options: ['FIFO', 'LIFO', '只進不出', 'Hash order'], answer: 0, explanation: 'Queue 是 First In, First Out。' },
                    { id: 'a03-q3', type: 'choice', question: 'Valid Parentheses 為何適合 Stack？', options: ['只需要知道第一個括號', '要配對最近尚未關閉的左括號', '因為 Stack 會自動排序', '因為 Stack 是 O(n²)'], answer: 1, explanation: '最近未完成元素正好位於 Stack Top。' },
                    { id: 'a03-q4', type: 'choice', question: 'Python list 當 Stack 時，Push 常用？', options: ['append()', 'sort()', 'index()', 'clear()'], answer: 0, explanation: 'list.append() 從尾端加入元素。' },
                    { id: 'a03-q5', type: 'fill', question: '填空：Python list 當 Stack 時，拿掉並回傳最上層元素常用 .____()。', answerText: 'pop', explanation: 'list.pop() 預設移除尾端，符合 Stack Pop。' }
                ]
            },
            {
                id: 'algo-04',
                title: 'Two Pointers 與 Sliding Window：把重複掃描變成一次移動',
                level: '基礎 → 中階',
                duration: '25–35 分鐘',
                summary: '理解左右指標如何利用「已知狀態」避免重頭掃，並用最長不重複子字串建立 Sliding Window 直覺。',
                content: [
                    { type: 'slides', title: '為什麼需要兩個 Pointer？', slides: [
                        { kicker: 'ONE PASS', title: '很多問題不需要每次從頭開始', text: '如果我們能保留前一輪已知道的資訊，就可以讓 left / right 各自只往一個方向移動。', visual: 'left →　　　　　← right' },
                        { kicker: 'TWO POINTERS', title: '兩個位置一起描述「目前範圍」', text: '在排序陣列找 pair、反轉字串、移除重複、容器面積等問題，都常用兩個指標縮小搜尋範圍。', visual: '[ 1, 2, 4, 7, 11 ]<br>  L　　　　　R' },
                        { kicker: 'WINDOW', title: 'Sliding Window 是 Two Pointers 的常見型態', text: 'right 負責擴張視窗取得更多資料；條件不合法時，left 負責縮小直到重新合法。', visual: 'a [ b c a ] b c b b<br>　L　　　R' },
                        { kicker: 'KEY IDEA', title: '兩個指標都只往前', text: '即使看起來有 while 包在 for 裡，只要 left 總共最多移 n 次，right 也最多 n 次，整體仍可能是 O(n)，不是看到巢狀就一定 O(n²)。', visual: 'right ≤ n moves<br>left ≤ n moves<br>total ≤ 2n → O(n)' }
                    ]},
                    { type: 'heading', text: '1. Two Pointers：排序陣列找兩數和' },
                    { type: 'code', text: 'def two_sum_sorted(numbers, target):\n    left = 0\n    right = len(numbers) - 1\n\n    while left < right:\n        current = numbers[left] + numbers[right]\n\n        if current == target:\n            return left, right\n        if current < target:\n            left += 1\n        else:\n            right -= 1\n\n    return None' },
                    { type: 'paragraph', text: '因為資料已排序：和太小就提高 left；和太大就降低 right。每次移動都能安全排除一批不可能答案。這就是演算法能變快的原因：不是少寫幾行，而是每一步排除更多搜尋空間。' },
                    { type: 'heading', text: '2. Sliding Window：Longest Substring Without Repeating Characters' },
                    { type: 'demo', kind: 'window', title: '把 `abcabcbb` 的視窗滑給你看', text: '按按鈕觀察 left / right 與目前最佳長度。' },
                    { type: 'stepper', steps: [
                        { title: 'right 擴張', text: '每次把新字元加入目前 window。只要沒有重複，window 就維持合法。' },
                        { title: '遇到重複', text: '如果新字元讓 window 不合法，left 往右縮，移除左側元素。' },
                        { title: '恢復合法', text: '縮到重複問題消失，再更新目前 window 長度。' },
                        { title: '保存 best', text: '整個過程保存看過的最大合法 window 長度。' }
                    ]},
                    { type: 'code', text: 'def length_of_longest_substring(s: str) -> int:\n    seen = set()\n    left = 0\n    best = 0\n\n    for right, ch in enumerate(s):\n        while ch in seen:\n            seen.remove(s[left])\n            left += 1\n\n        seen.add(ch)\n        best = max(best, right - left + 1)\n\n    return best' },
                    { type: 'checkpoint', question: '上面的程式有 for 裡面包 while，為什麼整體仍可視為 O(n)？', options: ['因為 Python 會自動平行化', 'left 與 right 都只往前，每個字元最多被加入/移除有限次', 'while 永遠不執行', 'set 是排序資料結構'], answer: 1, explanation: '分析總操作次數：left 最多走 n、right 最多走 n，所以仍是線性量級。' },
                    { type: 'heading', text: '3. Sliding Window 題目的辨識訊號' },
                    { type: 'bullet', text: '題目在問連續 subarray / substring。' },
                    { type: 'bullet', text: '要求最長、最短、最大、最小，且 window 可以透過增加/移除元素維護條件。' },
                    { type: 'bullet', text: '你原本打算「每個起點都重新往後掃」時，要問能不能保留上一個 window 的資訊。' },
                    { type: 'callout', text: 'Two Pointers / Sliding Window 的核心不是模板，而是「利用已知資訊讓搜尋範圍單向前進」。只背 left/right 變數名稱很容易一換題就失效。' }
                ],
                quiz: [
                    { id: 'a04-q1', type: 'choice', question: '排序陣列兩數和中，如果 numbers[left] + numbers[right] 太小，通常應該？', options: ['left 往右', 'right 往左', '兩個都重置成 0', '重新排序'], answer: 0, explanation: '資料已排序，要讓和變大就提高左側較小值。' },
                    { id: 'a04-q2', type: 'choice', question: 'Sliding Window 最常應用在哪類資料範圍？', options: ['連續 substring / subarray', '完全隨機兩個節點', '只限 Tree', '只限 SQL'], answer: 0, explanation: 'Window 表示一段連續範圍。' },
                    { id: 'a04-q3', type: 'choice', question: 'Longest Substring 題中，遇到重複字元時通常？', options: ['把 right 歸零', '移動 left 縮小 window 直到合法', '刪掉整個字串', '一定使用 Binary Search'], answer: 1, explanation: 'Sliding Window 透過左側縮小恢復條件。' },
                    { id: 'a04-q4', type: 'choice', question: 'for 裡有 while 是否一定是 O(n²)？', options: ['一定', '不一定，要看總操作次數與 pointer 是否反覆重走', '只要 Python 就一定', '只有 C# 才不是'], answer: 1, explanation: '複雜度應看總操作次數；單向 pointer 常使總次數仍為 O(n)。' },
                    { id: 'a04-q5', type: 'fill', question: '填空：window 長度常用 `right - left + __` 計算。', answerText: '1', explanation: '兩端 index 都包含在 window 內，所以要 +1。' }
                ]
            },
            {
                id: 'algo-05',
                title: 'Binary Search：不是背 while，而是每次安全砍一半',
                level: '基礎 → 中階',
                duration: '25–35 分鐘',
                summary: '理解 Binary Search 為什麼是 O(log n)、low/high/mid 邊界，以及常見 off-by-one 錯誤。',
                content: [
                    { type: 'slides', title: 'Binary Search 的核心', slides: [
                        { kicker: 'PRECONDITION', title: '必須有可利用的單調/排序資訊', text: '如果資料完全無序，看中間值無法推論左邊或右邊哪一半不可能。Binary Search 能快，是因為比較結果能排除一整半。', visual: '[1, 3, 5, 7, 9, 11, 13]' },
                        { kicker: 'MID', title: '每次看中間', text: 'target 比 mid 大，就把左半邊全部排除；target 比 mid 小，就把右半邊全部排除。', visual: '1 3 5 [7] 9 11 13<br>target = 11 → discard left half' },
                        { kicker: 'LOG N', title: '搜尋空間一直 ÷2', text: '1,024 個元素最多大約比較 10 次；1,000,000 個元素也只約 20 次。這就是 O(log n) 的直覺。', visual: '1,048,576 → 524k → 262k → ... → 1<br>約 20 次' },
                        { kicker: 'BOUNDARY', title: '真正容易錯的是邊界定義', text: '你要先決定搜尋區間是 [low, high] 還是 [low, high)。不同定義對 while 條件、high 更新方式都不同。', visual: 'Closed interval: [low, high]<br>while low <= high' }
                    ]},
                    { type: 'demo', kind: 'binary', title: '找 11：每次真的砍一半', text: '按一次就是一次比較，灰掉的元素代表已安全排除。' },
                    { type: 'heading', text: '1. 最常見的 Closed Interval 寫法' },
                    { type: 'code', text: 'def binary_search(numbers, target):\n    low = 0\n    high = len(numbers) - 1\n\n    while low <= high:\n        mid = (low + high) // 2\n\n        if numbers[mid] == target:\n            return mid\n        elif numbers[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n\n    return -1' },
                    { type: 'heading', text: '2. 為什麼是 mid + 1 / mid - 1？' },
                    { type: 'paragraph', text: '因為 mid 已經比較過，而且已確定不是答案。如果只寫 low = mid，當 low 與 high 相鄰時 mid 可能一直等於 low，造成無限迴圈。排除 mid 本身，搜尋區間才會確實縮小。' },
                    { type: 'checkpoint', question: 'Closed interval `[low, high]` 寫法中，為什麼 while 常用 `low <= high`？', options: ['因為 low==high 時還有一個候選值沒檢查', '因為 Python 規定', '因為可以讓 list 自動排序', '因為 high 永遠等於 0'], answer: 0, explanation: 'low == high 仍代表區間內有一個元素，所以還需要比較一次。' },
                    { type: 'heading', text: '3. Binary Search 不只找「某個數」' },
                    { type: 'stepper', steps: [
                        { title: 'Exact Match', text: '最基本：已排序陣列中找 target index。' },
                        { title: 'Lower Bound', text: '找第一個 >= target 的位置。這是很多邊界題的核心。' },
                        { title: 'Upper Bound', text: '找第一個 > target 的位置，可以搭配 lower bound 計算重複元素範圍。' },
                        { title: 'Binary Search on Answer', text: '只要答案空間具有單調性，可以對「答案」做二分，例如最小可行速度、最小容量。' }
                    ]},
                    { type: 'heading', text: '4. 三個最常見 Bug' },
                    { type: 'bullet', text: '資料根本沒有排序/單調性，卻硬套 Binary Search。' },
                    { type: 'bullet', text: '搜尋區間定義跟 while 條件混用，例如 [low, high] 卻把 high 初始化成 len(numbers)。' },
                    { type: 'bullet', text: '更新成 low = mid / high = mid，導致區間沒有變小而卡死。' },
                    { type: 'callout', text: 'Binary Search 最重要的能力不是背模板，而是每次更新 low/high 時能說明：「為什麼被丟掉的那一半一定沒有答案？」只要這句說不清楚，就容易寫錯。' }
                ],
                quiz: [
                    { id: 'a05-q1', type: 'choice', question: 'Binary Search 最重要的前提是？', options: ['資料量一定小於 100', '比較結果能安全排除一部分搜尋空間，例如已排序/單調', '一定使用 set', '一定遞迴'], answer: 1, explanation: '沒有排序或單調資訊，就無法靠 mid 判斷哪一半能排除。' },
                    { id: 'a05-q2', type: 'choice', question: 'Binary Search 時間複雜度通常是？', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 1, explanation: '每次將搜尋空間大致減半。' },
                    { id: 'a05-q3', type: 'choice', question: 'Closed interval `[low, high]` 寫法常把 high 初始化為？', options: ['len(numbers)', 'len(numbers) - 1', '0', 'target'], answer: 1, explanation: '最後一個有效 index 是 len(numbers)-1。' },
                    { id: 'a05-q4', type: 'choice', question: '當 numbers[mid] < target 時，Closed interval 通常怎麼更新？', options: ['high = mid - 1', 'low = mid + 1', 'low = 0', 'high = len(numbers)'], answer: 1, explanation: 'target 更大，所以 mid 與其左側都能排除。' },
                    { id: 'a05-q5', type: 'fill', question: '填空：Python 整數中點常寫 `(low + high) // __`。', answerText: '2', explanation: '整數除以 2 取得中點。' }
                ]
            }
        ]
    }
];