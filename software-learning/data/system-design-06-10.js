(() => {
    const course = (window.SOFTWARE_LEARNING_COURSES || []).find(item => item.id === 'system-design');
    if (!course) return;

    course.lessons.push(
        {
            id: 'sd-06',
            title: 'CDN、Object Storage 與 Edge：讓內容離使用者更近',
            level: '中階',
            duration: '25–35 分鐘',
            summary: '理解靜態內容、圖片與影片為什麼不該都從 App Server 傳送，以及 CDN Hit/Miss、Origin、TTL 與 Cache Invalidation。',
            content: [
                { type: 'slides', title: '一張 5 MB 圖片，為什麼不該每次都回到台灣主機？', slides: [
                    { kicker: 'WITHOUT CDN', title: '所有人都打 Origin', text: '全球使用者每次都跨洲連回同一個來源站。距離增加 RTT，也讓 Origin 頻寬與連線數一起上升。', visual: 'US 👤 ─────→ Taiwan Origin<br>EU 👤 ─────→ Taiwan Origin<br>JP 👤 ─→ Taiwan Origin' },
                    { kicker: 'EDGE', title: '把熱門內容複製到邊緣節點', text: 'CDN 在靠近使用者的 Edge POP 快取可快取的內容。命中時不必回 Origin，延遲與 Origin 負載都下降。', visual: '👤 → Edge POP ✅ HIT<br>　　　　↳ 不必回 Origin' },
                    { kicker: 'MISS', title: '第一次仍可能回源', text: 'Edge 沒資料或 TTL 已過期時會向 Origin 取回內容，再依規則快取。這就是 Cache Miss / Origin Fetch。', visual: '👤 → Edge MISS → Origin → Edge → 👤' },
                    { kicker: 'INVALIDATION', title: '快取最難的通常不是「存」，而是「何時更新」', text: '檔案更新後，舊 Edge 內容可能仍存在。常見策略是版本化檔名、合理 TTL、主動 Purge，而不是每次都設 no-cache。', visual: 'app.v41.js → app.v42.js<br>immutable asset + versioned URL' }
                ]},
                { type: 'heading', text: '1. Object Storage 與 CDN 解的是不同問題' },
                { type: 'compare', items: [
                    { icon: '🪣', title: 'Object Storage', text: '保存圖片、影片、備份、附件等大型 Blob。重點是耐久性、容量與物件式存取，不是執行商業邏輯。', bestFor: '原始檔、靜態資產、使用者上傳內容' },
                    { icon: '🌍', title: 'CDN', text: '把可快取內容放到靠近使用者的 Edge，降低 RTT、Origin 流量與熱門內容的尖峰壓力。', bestFor: '圖片、JS/CSS、影片片段、下載檔案、部分 GET Response' }
                ]},
                { type: 'diagram', nodes: [
                    { title: 'Client', subtitle: '台北 / 東京 / 美國' },
                    { title: 'CDN Edge', subtitle: '先查 Edge Cache' },
                    { title: 'Origin', subtitle: 'Nginx / App / Storage endpoint' },
                    { title: 'Object Storage', subtitle: '保存原始物件' }
                ], caption: 'CDN 是傳遞與邊緣快取層；Object Storage 是來源資料的持久儲存之一。兩者常搭配，但不是同一個元件。' },
                { type: 'heading', text: '2. CDN Hit / Miss 的完整流程' },
                { type: 'stepper', steps: [
                    { title: 'Request 到最近 Edge', text: 'DNS / Anycast 等機制把使用者導向合適的 CDN POP。實際路由策略由供應商與網路決定。' },
                    { title: 'Cache Hit', text: 'Edge 已有仍有效的物件，直接回傳。Origin 完全不需要參與。' },
                    { title: 'Cache Miss', text: 'Edge 沒有內容，向 Origin Fetch；成功後依 Cache Policy 保存一份。' },
                    { title: 'TTL / Revalidation', text: '過期不一定代表直接丟棄；可以重新驗證內容是否變更，再決定是否取新版本。' },
                    { title: 'Purge / Versioning', text: '緊急更新可 Purge；長效靜態檔則更常使用帶 hash/version 的 URL，避免「同 URL 不同內容」造成舊快取。' }
                ]},
                { type: 'code', text: '# 適合版本化靜態資產的概念\nGET /assets/app.a81f2c.js\nCache-Control: public, max-age=31536000, immutable\n\n# 更新版本時改 URL\nGET /assets/app.b94de1.js' },
                { type: 'checkpoint', question: '一個全球網站每天傳送大量相同產品圖片，Origin 頻寬很高。第一個最合理的改善方向？', options: ['所有圖片改存 Session', 'Object Storage + CDN', '把 DB 換成更大的 CPU', '把圖片內容放進 JWT'], answer: 1, explanation: '大量可重複讀取的靜態內容最適合用物件儲存保存、CDN 邊緣傳遞。' },
                { type: 'heading', text: '3. CDN 與 Redis Cache 不要混成同一件事' },
                { type: 'bullet', text: 'CDN 更靠近網路邊緣，主要降低地理距離、Origin 頻寬與靜態內容壓力。' },
                { type: 'bullet', text: 'Redis 通常靠近應用與資料層，快取 Query Result、Session、計數器等應用資料。' },
                { type: 'bullet', text: '同一系統可以同時有 Browser Cache、CDN Cache、Reverse Proxy Cache、Redis Cache，每層的失效策略都不同。' },
                { type: 'heading', text: '4. 常見 Trade-off' },
                { type: 'bullet', text: 'TTL 長：Hit Rate 高、Origin 輕，但內容更新延遲風險增加。' },
                { type: 'bullet', text: 'TTL 短：資料較新，但更多 Request 回源。' },
                { type: 'bullet', text: 'Private / 個人化 Response 通常不能直接當公共 CDN Cache 使用，必須清楚定義 Cache Key 與權限。' },
                { type: 'callout', text: '面試回答 CDN 時，不要只說「讓網站更快」。要能說出：減少 RTT、降低 Origin bandwidth/connection、Hit/Miss、TTL，以及更新內容時如何避免 stale cache。' }
            ],
            quiz: [
                { id: 'sd06-q1', type: 'choice', question: 'CDN 最直接改善的是？', options: ['把所有 SQL 變成 NoSQL', '讓可快取內容從更接近使用者的 Edge 回傳', '保證所有資料強一致', '取代所有 Database'], answer: 1, explanation: 'CDN 的核心價值是 Edge delivery / caching。' },
                { id: 'sd06-q2', type: 'choice', question: 'Cache Miss 在 CDN 情境通常代表？', options: ['Edge 沒有可用內容，需要向 Origin 取得', '使用者一定登入失敗', 'DB 一定掛掉', 'TLS 一定錯誤'], answer: 0, explanation: 'Miss 後通常需要 Origin Fetch。' },
                { id: 'sd06-q3', type: 'choice', question: '對長期不變、檔名帶內容 hash 的 JS/CSS，常見策略是？', options: ['長 TTL + immutable', '永遠 no-store', '每秒 Purge', '存進 Session'], answer: 0, explanation: '版本化 URL 可安全搭配長 TTL。' },
                { id: 'sd06-q4', type: 'choice', question: 'Object Storage 與 CDN 的核心差異？', options: ['完全相同', 'Object Storage 偏持久保存；CDN 偏邊緣傳遞與快取', 'CDN 只能存 SQL', 'Object Storage 只能執行 API'], answer: 1, explanation: '兩者職責不同，但非常常搭配。' },
                { id: 'sd06-q5', type: 'fill', question: '填空：CDN 邊緣節點沒有內容而需要回來源站取得，稱為 Cache ____。', answerText: 'Miss', explanation: 'Cache Miss 代表目前快取找不到可用內容。' }
            ]
        },
        {
            id: 'sd-07',
            title: 'Message Queue：把同步工作拆開，吸收尖峰與故障',
            level: '中階',
            duration: '30–40 分鐘',
            summary: '理解 Producer、Queue、Consumer、Ack、Retry、DLQ、Ordering 與 At-least-once，並知道何時不該硬塞 Queue。',
            content: [
                { type: 'slides', title: '寄信 3 秒、縮圖 8 秒，API 要等 11 秒嗎？', slides: [
                    { kicker: 'SYNC', title: '同步鏈越長，使用者等越久', text: '建立訂單後同步寄 Email、產報表、推播、寫分析資料，只要其中一個慢或掛掉，主 Request 就被拖累。', visual: 'API → DB → Email → Report → Push<br>　　　　　11 秒...' },
                    { kicker: 'ASYNC', title: '先完成必要交易，再發布工作', text: '主流程把「之後可以做」的工作放入 Queue，快速回應。Consumer 再獨立處理。', visual: 'API → DB → Queue → 200 OK<br>　　　　　　↓<br>　　　　 Workers' },
                    { kicker: 'BUFFER', title: 'Queue 也是尖峰緩衝區', text: '瞬間來 100,000 個工作，而 Worker 每秒只能做 2,000 個時，Queue 可以暫時累積 backlog，避免下游立刻被打爆。', visual: 'Burst 100k → [ Queue Queue Queue ] → Workers 2k/s' },
                    { kicker: 'REALITY', title: '非同步不是免費午餐', text: '你會得到 retry、重複訊息、順序、死信、積壓、監控與事件 schema 演進等新問題。', visual: 'Latency ↓ Coupling ↓<br>Operational Complexity ↑' }
                ]},
                { type: 'diagram', nodes: [
                    { title: 'Producer', subtitle: '建立 Message / Event' },
                    { title: 'Broker / Queue', subtitle: 'Buffer / Durable log' },
                    { title: 'Consumer', subtitle: '處理工作' },
                    { title: 'Ack', subtitle: '成功確認' },
                    { title: 'Retry / DLQ', subtitle: '失敗處理' }
                ], caption: '不同產品的語意不同，但 Producer → Broker → Consumer 是理解非同步訊息系統的共同起點。' },
                { type: 'heading', text: '1. Queue 最重要的三個價值' },
                { type: 'compare', items: [
                    { icon: '🔌', title: 'Decoupling', text: 'Producer 不需要同步等待 Consumer 完成，服務之間的時間耦合降低。', bestFor: 'Email、轉檔、通知、非同步工作' },
                    { icon: '🌊', title: 'Buffering', text: '短時間流量大於 Consumer 能力時，先形成 backlog，讓 Consumer 用自己的速度處理。', bestFor: '尖峰、批次匯入、影像處理' },
                    { icon: '📈', title: 'Independent Scaling', text: 'Producer 與 Consumer 可以分別擴展。哪個處理階段慢，就增加對應 Consumer。', bestFor: '工作成本差異大的 Pipeline' }
                ]},
                { type: 'heading', text: '2. Ack、Retry 與 At-least-once' },
                { type: 'paragraph', text: '實務訊息系統常見語意是「至少一次」：Consumer 處理完成前如果掛掉，Broker 可能重新投遞同一訊息。這代表 Consumer 必須預期重複，而不是假設一個 Message 永遠只執行一次。' },
                { type: 'stepper', steps: [
                    { title: 'Consume', text: 'Consumer 取得 message。' },
                    { title: 'Process', text: '執行 DB 更新、寄信、轉檔等業務邏輯。' },
                    { title: 'Ack', text: '成功後確認。Broker 才知道這筆可以視為已處理。' },
                    { title: 'Retry', text: '暫時性錯誤可重試，但要有上限與 backoff，否則壞訊息會形成無限迴圈。' },
                    { title: 'DLQ', text: '重試多次仍失敗的訊息進 Dead Letter Queue，交由觀察、修復或人工處理。' }
                ]},
                { type: 'heading', text: '3. Idempotency：重複收到，也只產生一次效果' },
                { type: 'code', text: '# 概念：message_id 做去重\nif processed_message_ids.contains(message.id):\n    ack(message)\n    return\n\nprocess_business_action(message)\nprocessed_message_ids.add(message.id)\nack(message)' },
                { type: 'checkpoint', question: 'Consumer 成功扣款後，在送出 Ack 前程序掛掉；Broker 之後重送相同 Message。最重要的保護？', options: ['把 CPU 升級', 'Consumer / 業務操作具備 Idempotency', '把 Queue 刪掉', '把 JSON 換成 XML'], answer: 1, explanation: '至少一次投遞可能造成重複處理；扣款等副作用必須可去重或冪等。' },
                { type: 'heading', text: '4. Ordering：不要隨口說 Queue 就有全域順序' },
                { type: 'bullet', text: '單一 partition / 單一 queue 可以較容易維持局部順序，但會限制平行度。' },
                { type: 'bullet', text: '分成多個 partition 後，常見保證是「同一 partition 內順序」，不是整個叢集全域順序。' },
                { type: 'bullet', text: '若同一 user / order 的事件需要有序，可以考慮用相同 key 路由到同一 partition。' },
                { type: 'heading', text: '5. Queue vs Log-based Streaming' },
                { type: 'paragraph', text: 'RabbitMQ 類 queue 與 Kafka 類 durable log 都能做非同步，但消費模型、保留方式、重播、partition 與 throughput 特性不同。系統設計面試不需要先站隊，先說需求：工作分派？事件重播？多個獨立 consumer group？順序範圍？保留多久？' },
                { type: 'callout', text: 'Queue 不是「流量大就加」。如果工作必須在同一 Request 內同步完成、需要立即一致結果，硬拆成 Queue 反而會讓流程更難理解。' }
            ],
            quiz: [
                { id: 'sd07-q1', type: 'choice', question: 'Message Queue 最適合解哪一類問題？', options: ['把可延後工作非同步化並吸收尖峰', '取代所有 Cache', '讓 CSS 置中', '保證所有操作零延遲'], answer: 0, explanation: 'Queue 常用於 decoupling、buffering 與 async processing。' },
                { id: 'sd07-q2', type: 'choice', question: 'At-least-once delivery 對 Consumer 的直接要求之一是？', options: ['假設永不重複', '考慮重複投遞與 Idempotency', '不能使用 DB', '所有工作必須單執行緒'], answer: 1, explanation: '至少一次代表有機會重送。' },
                { id: 'sd07-q3', type: 'choice', question: 'DLQ 主要用來？', options: ['保存多次重試仍無法成功的訊息', '加速 DNS', '存圖片', '做 Load Balance'], answer: 0, explanation: 'Dead Letter Queue 用於隔離無法正常處理的訊息。' },
                { id: 'sd07-q4', type: 'choice', question: '使用多個 Partition 後，較常見的順序保證是？', options: ['全世界所有訊息都絕對全域有序', '同一 Partition 內有序', '完全不能排序', '只有 HTTP 才有序'], answer: 1, explanation: '分區通常提供 partition-local ordering。' },
                { id: 'sd07-q5', type: 'fill', question: '填空：Consumer 成功處理後向 Broker 表示「這筆完成」的動作常簡稱為 ___。', answerText: 'Ack', explanation: 'Ack = acknowledgement。' }
            ]
        },
        {
            id: 'sd-08',
            title: 'Rate Limiting 與 Backpressure：系統不是撐到爆才拒絕',
            level: '中階',
            duration: '30–40 分鐘',
            summary: '學會 Token Bucket、Fixed/Sliding Window、429、分散式計數器，以及當下游已飽和時如何用 Backpressure 保護系統。',
            content: [
                { type: 'slides', title: '拒絕一部分 Request，有時反而讓系統更可用', slides: [
                    { kicker: 'OVERLOAD', title: '沒有保護：所有 Request 一起死', text: 'DB 最大只能處理 5,000 QPS，入口卻瞬間進來 50,000 QPS。全部放進去只會把 queue、connection pool、memory 與 latency 一起拖垮。', visual: '50k QPS → App → DB 5k QPS<br>Latency ↑↑ Timeout ↑↑' },
                    { kicker: 'RATE LIMIT', title: '入口先限制不合理或超額流量', text: '依 user、API key、IP、tenant、endpoint 等維度限制速率，讓系統在可承受範圍內工作。', visual: 'Client → Rate Limiter → ✅ Allowed<br>　　　　　　　　　↘ ⛔ 429' },
                    { kicker: 'BURST', title: '平均速率一樣，Burst 特性不同', text: 'Token Bucket 可以累積 token，因此允許一定程度瞬間 burst；Fixed Window 實作簡單但有邊界突刺問題。', visual: '🪣 tokens refill over time<br>request consumes token' },
                    { kicker: 'BACKPRESSURE', title: '下游滿了，上游就必須慢下來', text: 'Rate Limit 偏入口政策；Backpressure 是整條處理鏈根據容量讓上游減速、排隊、降級或拒絕，避免無限累積。', visual: 'Producer → Queue FULL → slow / reject / degrade' }
                ]},
                { type: 'heading', text: '1. 常見 Rate Limiting 演算法' },
                { type: 'compare', items: [
                    { icon: '▦', title: 'Fixed Window Counter', text: '例如每分鐘最多 100 次。實作簡單，但 12:00:59 與 12:01:00 可能跨視窗瞬間通過近 200 次。', bestFor: '簡單限制、可接受邊界誤差' },
                    { icon: '🪣', title: 'Token Bucket', text: '固定速度補 token；Request 消耗 token。桶子容量決定可允許的 burst 大小。', bestFor: '允許短 burst、平均速率受控' },
                    { icon: '🪟', title: 'Sliding Window', text: '依最近一段時間估算或記錄 Request，邊界較平滑，但資料結構與計算成本可能更高。', bestFor: '需要較精準的時間窗限制' }
                ]},
                { type: 'heading', text: '2. 限流到底放在哪裡？' },
                { type: 'diagram', nodes: [
                    { title: 'Client', subtitle: 'User / API Key' },
                    { title: 'Edge / API Gateway', subtitle: '粗粒度限流' },
                    { title: 'App', subtitle: '業務維度限流' },
                    { title: 'Redis / Counter Store', subtitle: '共享狀態' },
                    { title: 'Downstream', subtitle: 'DB / Queue / 3rd-party' }
                ], caption: '大型系統可能在不同層有不同限流：外部防濫用、租戶配額、昂貴 API 保護、第三方額度保護。' },
                { type: 'heading', text: '3. 分散式限流為什麼不能只用 App Memory？' },
                { type: 'paragraph', text: '如果有 App A、B、C 三台，而每台各自記「使用者今天用了幾次」，使用者被 Load Balancer 分到不同節點時會得到三份獨立計數，限制就被放大。共享限流狀態通常放在 Redis 等集中式/分散式儲存，並需要原子操作避免 race condition。' },
                { type: 'code', text: '# Token Bucket 概念\nrefill_tokens_by_elapsed_time()\nif tokens >= 1:\n    tokens -= 1\n    allow()\nelse:\n    reject(status=429)' },
                { type: 'checkpoint', question: '三台 Stateless API Server 各自用 RAM 記每個 User 的限流計數，最可能出現什麼問題？', options: ['計數彼此不同步，實際可用額度被放大', 'CSS 失效', 'CDN 無法存圖片', 'Binary Search 變 O(n²)'], answer: 0, explanation: '分散式節點需要共享或可協調的 rate limit state。' },
                { type: 'heading', text: '4. 429 只是開始，Client 也要知道怎麼退' },
                { type: 'bullet', text: 'HTTP API 常用 429 Too Many Requests 表示超過限制。' },
                { type: 'bullet', text: '可以提供 Retry-After 或 quota metadata，讓 Client 知道何時再試。' },
                { type: 'bullet', text: '不要讓所有 Client 同一秒整批重試，應搭配 exponential backoff + jitter。' },
                { type: 'heading', text: '5. Backpressure 與 Load Shedding' },
                { type: 'stepper', steps: [
                    { title: '觀察 Saturation', text: 'Queue depth、DB connections、CPU、thread pool、worker lag、latency 都能反映系統是否接近極限。' },
                    { title: '慢下來', text: 'Producer 降低速率，Consumer 控制 prefetch/concurrency，避免內部 buffer 無限增長。' },
                    { title: '降級', text: '關閉非必要功能、回傳舊 Cache、降低圖片品質、延後非核心工作。' },
                    { title: 'Load Shedding', text: '容量真的不夠時，主動拒絕低優先 Request，比讓所有 Request 一起 timeout 更健康。' }
                ]},
                { type: 'callout', text: 'Rate Limit 不是只有防駭客。它也是容量治理：保護昂貴 API、第三方額度、DB、每租戶公平性，以及在尖峰時保住核心功能。' }
            ],
            quiz: [
                { id: 'sd08-q1', type: 'choice', question: 'Token Bucket 的「桶容量」主要控制？', options: ['允許的 Burst 大小', 'DB Schema', 'DNS TTL', 'Replica 數量'], answer: 0, explanation: 'Bucket capacity 決定最多可累積多少 token，因此影響 burst。' },
                { id: 'sd08-q2', type: 'choice', question: 'HTTP API 超過限流時常見 Status Code？', options: ['201', '301', '404', '429'], answer: 3, explanation: '429 Too Many Requests。' },
                { id: 'sd08-q3', type: 'choice', question: '多台 App Server 做全域 User 限流，最需要注意？', options: ['共享計數與原子更新', '每台各存一份 RAM 一定最準', '不能使用 Load Balancer', '一定要 Sharding DB'], answer: 0, explanation: '多節點必須解決共享 state 與 race condition。' },
                { id: 'sd08-q4', type: 'choice', question: 'Backpressure 的核心目的？', options: ['讓上游無限送資料', '當下游飽和時讓上游減速/排隊/拒絕，避免整體崩潰', '取代 Authentication', '讓所有 Retry 同時發生'], answer: 1, explanation: 'Backpressure 是容量訊號向上游傳遞。' },
                { id: 'sd08-q5', type: 'fill', question: '填空：為避免大量 Client 同時重試，backoff 常搭配隨機擾動，英文稱為 ______。', answerText: 'Jitter', explanation: 'Jitter 可打散重試時間。' }
            ]
        },
        {
            id: 'sd-09',
            title: 'Consistency、CAP、Transaction 與 Idempotency：資料正確不是一句「強一致」',
            level: '中階',
            duration: '35–45 分鐘',
            summary: '建立 Strong/Eventual Consistency、Read-your-writes、CAP 的正確直覺，並理解 Transaction、Outbox/Saga 與 Idempotency 在分散式流程中的角色。',
            content: [
                { type: 'slides', title: '「我要一致性」其實還不夠精確', slides: [
                    { kicker: 'QUESTION', title: '誰必須立刻看到最新資料？', text: '銀行餘額、庫存扣減、社群按讚數的容忍度不同。先定義哪些讀寫不能看到舊資料，而不是一句「全部強一致」。', visual: 'Balance ≠ Like Count ≠ Analytics' },
                    { kicker: 'REPLICA', title: 'Replication 提高可用性，也帶來讀到舊值的可能', text: '非同步 Replica 會有 Lag。你可能需要 Primary Read、Read-your-writes、版本檢查或接受 eventual consistency。', visual: 'Primary v42 → Replica v41 → eventually v42' },
                    { kicker: 'PARTITION', title: 'CAP 是在 Network Partition 發生時的取捨', text: '分散式節點失去互相通訊時，你要偏向拒絕部分操作保住一致性，還是繼續回應並接受暫時不一致？', visual: 'Node A ╳ Network ╳ Node B<br>CP ↔ AP trade-off during partition' },
                    { kicker: 'WORKFLOW', title: '跨服務流程通常沒有一個神奇大 Transaction', text: '訂單、付款、庫存分屬不同服務時，常改用 Saga / Compensation、Transactional Outbox、Idempotency 等模式管理一致性。', visual: 'Order → Payment → Inventory<br>events + compensation' }
                ]},
                { type: 'heading', text: '1. Consistency 不是只有 Strong / Eventual 兩個按鈕' },
                { type: 'compare', items: [
                    { icon: '🔒', title: 'Strong Consistency', text: '成功寫入後，後續讀取必須看到符合最新寫入語意的值。通常成本是更高協調、延遲或較低可用性。', bestFor: '餘額、唯一性、關鍵狀態轉換' },
                    { icon: '🌱', title: 'Eventual Consistency', text: '短時間可以看到舊值，但若沒有新更新，副本最終會收斂。可換取較佳可用性或延遲。', bestFor: 'Feed、分析、部分計數與可容忍 stale 的讀取' },
                    { icon: '👤', title: 'Read-your-writes', text: '至少讓剛寫入的使用者自己立即看到新值，即使其他使用者仍可能短暫看到舊值。', bestFor: '個人設定、剛更新後的 UX' }
                ]},
                { type: 'heading', text: '2. CAP 最常被講錯的地方' },
                { type: 'paragraph', text: '在真實分散式系統中，Network Partition 不能假設永遠不會發生。CAP 的實用問題是：Partition 發生期間，你要選擇偏向 Consistency 還是 Availability。不是平常任何時刻都只能從 C/A/P 永久挑兩個標籤。' },
                { type: 'checkpoint', question: '兩個 Replica 因網路分區互相看不到。你拒絕其中一側寫入，避免產生衝突。這個決策偏向？', options: ['Consistency', 'Availability', 'CSS Performance', 'CDN Hit Rate'], answer: 0, explanation: '在 partition 期間拒絕部分請求以避免不一致，是偏向 Consistency。' },
                { type: 'heading', text: '3. Local Transaction 很強，但跨服務要換思維' },
                { type: 'code', text: '# 單一 Database transaction\nBEGIN\n  INSERT order\n  UPDATE inventory\nCOMMIT\n\n# 但如果 Payment 與 Inventory 是不同服務，\n# 就不能假設一個本機 DB transaction 能原子包住所有網路操作。' },
                { type: 'stepper', steps: [
                    { title: 'Saga', text: '把長流程拆成多個 local transactions；後一步失敗時，以 compensation 動作補償前面已成功的步驟。' },
                    { title: 'Transactional Outbox', text: '業務資料與待發布 Event 寫入同一個本機 transaction，再由 relay 發送，降低「DB 成功但 Message 沒送出」的不一致窗口。' },
                    { title: 'Idempotency Key', text: 'Client 重試 POST /payments 時帶相同 key；Server 記錄該 key 的結果，避免網路 timeout 後重試造成重複扣款。' },
                    { title: 'Reconciliation', text: '分散式流程不可能只靠 happy path。需要背景對帳找出「支付成功但訂單未更新」等不一致狀態。' }
                ]},
                { type: 'heading', text: '4. Exactly-once 不要當魔法詞' },
                { type: 'paragraph', text: '網路、Broker、Consumer、Database 跨多個故障邊界時，「端到端 exactly once」很難靠一句 broker 設定保證。實務通常依賴 at-least-once delivery + idempotent processing + transaction/outbox + deduplication，把最終業務效果做成一次。' },
                { type: 'heading', text: '5. 系統設計面試怎麼回答 Consistency？' },
                { type: 'bullet', text: '先列哪些資料必須強一致，哪些可以 stale 幾秒。' },
                { type: 'bullet', text: '說明讀寫路徑：Primary / Replica / Cache 是否可能看到舊值。' },
                { type: 'bullet', text: '跨服務流程說明 failure case：DB 成功、Message 失敗、Client timeout、重複 Retry 怎麼辦。' },
                { type: 'bullet', text: '最後才談 CAP、Quorum、Saga、Outbox 等工具，且每個工具都要對應具體需求。' },
                { type: 'callout', text: '一致性不是越強越高級。你真正要做的是定義「哪一筆資料，在什麼時間範圍內，對誰，必須看到什麼版本」，再付對應成本。' }
            ],
            quiz: [
                { id: 'sd09-q1', type: 'choice', question: 'Eventual Consistency 的合理描述？', options: ['任何時刻所有節點一定相同', '短時間可不一致，但在沒有新更新時最終收斂', '完全不需要 Replication', '一定比 Strong Consistency 慢'], answer: 1, explanation: 'Eventual consistency 允許暫時 stale，最終收斂。' },
                { id: 'sd09-q2', type: 'choice', question: 'CAP 的實務取捨主要在什麼情況特別明顯？', options: ['Network Partition', 'CSS 載入', '單機 for loop', 'HTML 排版'], answer: 0, explanation: 'Partition 發生時，需要在一致性與可用性間做取捨。' },
                { id: 'sd09-q3', type: 'choice', question: 'Transactional Outbox 主要降低哪種問題？', options: ['業務 DB 已提交，但 Event 沒成功發布', '圖片太大', 'DNS TTL 太短', 'Binary Search 邊界錯誤'], answer: 0, explanation: 'Outbox 把業務資料與待發事件放在同一本機 transaction。' },
                { id: 'sd09-q4', type: 'choice', question: '付款 API 因 Client timeout 被重送，最直接避免重複扣款的設計之一？', options: ['Idempotency Key', '更長的 CSS', '刪除 Retry', '只用 CDN'], answer: 0, explanation: '相同 idempotency key 應得到相同業務結果。' },
                { id: 'sd09-q5', type: 'fill', question: '填空：跨服務長交易拆成多個 local transaction，失敗時用補償動作回復，常稱為 ____ Pattern。', answerText: 'Saga', explanation: 'Saga 透過一系列 local transactions 與 compensation 管理長流程。' }
            ]
        },
        {
            id: 'sd-10',
            title: 'Reliability 與 Observability：Timeout、Retry、Circuit Breaker 到 SLO',
            level: '中階',
            duration: '35–45 分鐘',
            summary: '讓系統在「一定會故障」的前提下仍可控制影響範圍，並用 Metrics、Logs、Traces、SLI/SLO 找到真正瓶頸。',
            content: [
                { type: 'slides', title: '高可用不是「機器永遠不掛」', slides: [
                    { kicker: 'FAILURE IS NORMAL', title: '網路會 timeout、節點會重啟、依賴服務會慢', text: '分散式系統的設計目標不是消滅所有故障，而是限制故障範圍、快速偵測、可恢復、可降級。', visual: 'Timeout · Restart · Packet Loss · Slow DB<br>都會發生' },
                    { kicker: 'TIMEOUT', title: '沒有 Timeout，就可能永遠卡住', text: '每一個外部依賴都應有合理 timeout budget。Timeout 太長會佔滿 connection/thread；太短則容易誤判正常慢請求。', visual: 'Client 800ms budget<br>↳ Service A 500ms<br>↳ DB 200ms' },
                    { kicker: 'RETRY', title: 'Retry 可以救暫時故障，也可以製造 Retry Storm', text: '只重試暫時性錯誤，限制次數，使用 exponential backoff + jitter，並確保操作可安全重試。', visual: '1000 failures × immediate retry × 3<br>= 更大的尖峰 💥' },
                    { kicker: 'OBSERVE', title: '沒有觀測，就只能猜', text: 'Metrics 看趨勢，Logs 看事件細節，Traces 看一次 Request 跨服務花在哪裡。三者互補，不是互相取代。', visual: 'Metrics 📈 + Logs 📜 + Traces 🧭' }
                ]},
                { type: 'heading', text: '1. Timeout、Retry、Circuit Breaker 是一組，不是三個孤立名詞' },
                { type: 'stepper', steps: [
                    { title: 'Timeout', text: '限制等待依賴服務的最長時間，把故障從「無限等待」轉成可處理的失敗。' },
                    { title: 'Retry', text: '只對可能恢復的 transient error 重試；例如短暫網路錯誤。Validation error、權限錯誤通常不該重試。' },
                    { title: 'Backoff + Jitter', text: '每次重試間隔增加並加入隨機值，避免大量 Client 同步重試形成 thundering herd。' },
                    { title: 'Circuit Breaker', text: '依賴持續失敗時暫時快速失敗，不再每個 Request 都撞下游，等待一段時間後再試探恢復。' },
                    { title: 'Fallback / Degrade', text: '回 Cache、隱藏非核心區塊、延後工作，讓核心功能仍可用。' }
                ]},
                { type: 'diagram', nodes: [
                    { title: 'Request', subtitle: '有 deadline' },
                    { title: 'Service A', subtitle: 'timeout 500ms' },
                    { title: 'Circuit Breaker', subtitle: 'open / half-open / closed' },
                    { title: 'Service B', subtitle: '可能失敗' },
                    { title: 'Fallback', subtitle: 'Cache / degrade' }
                ], caption: 'Reliability 的目的不是隱藏錯誤，而是避免單一依賴故障擴散成整站故障。' },
                { type: 'checkpoint', question: '下游已經過載，所有上游都立刻重試 3 次，最可能造成？', options: ['Retry Storm，讓下游更糟', '自動變成強一致', 'CDN Hit Rate 100%', '一定立即恢復'], answer: 0, explanation: '無節制 retry 會把原本流量倍增，形成故障放大。' },
                { type: 'heading', text: '2. Bulkhead：不要讓一個功能吃光所有資源' },
                { type: 'paragraph', text: '像船艙隔板一樣，把 thread pool、connection pool、worker queue 或資源配額隔離。報表功能爆量時，不應該把登入 API 的全部 DB connections 一起吃光。' },
                { type: 'heading', text: '3. Metrics、Logs、Traces 各回答不同問題' },
                { type: 'compare', items: [
                    { icon: '📈', title: 'Metrics', text: '數字時間序列：QPS、error rate、P95/P99 latency、CPU、memory、queue depth、DB connections。', bestFor: '趨勢、告警、Dashboard、容量' },
                    { icon: '📜', title: 'Logs', text: '離散事件與上下文：錯誤訊息、user/order id、stack trace、重要狀態變更。', bestFor: '事件細節與問題證據' },
                    { icon: '🧭', title: 'Distributed Traces', text: '追蹤一個 Request 穿過多個服務與 span，找出時間花在哪個 hop。', bestFor: '跨服務 latency 與 dependency 分析' }
                ]},
                { type: 'heading', text: '4. SLI / SLO：把「穩定」變成可量測目標' },
                { type: 'bullet', text: 'SLI：實際量測指標，例如成功請求比例、P99 latency、可用性。' },
                { type: 'bullet', text: 'SLO：內部可靠性目標，例如 30 天內 99.9% Request 成功。' },
                { type: 'bullet', text: 'SLA：通常是對客戶/外部承諾，可能伴隨補償條款；不要把 SLA、SLO 當同義詞。' },
                { type: 'bullet', text: 'Error Budget：100% - SLO。若 SLO = 99.9%，代表允許 0.1% 的失敗/不可用預算。' },
                { type: 'heading', text: '5. Recovery：除了 HA，還要想災難復原' },
                { type: 'stepper', steps: [
                    { title: 'Backup', text: '有備份不代表能恢復。必須定期驗證 restore，否則只是心理安慰。' },
                    { title: 'RPO', text: 'Recovery Point Objective：最多可以接受遺失多少時間的資料，例如 5 分鐘。' },
                    { title: 'RTO', text: 'Recovery Time Objective：災難後多久必須恢復服務，例如 30 分鐘。' },
                    { title: 'Failover Drill', text: '故障切換如果從未演練，真正事故時很可能才發現 DNS、權限、資料同步或 runbook 有問題。' }
                ]},
                { type: 'callout', text: '系統設計做到第 10 章，你應該開始把每個架構圖都補上 Failure Path：哪個元件掛了？Timeout 多久？Retry 會不會放大？有沒有 fallback？怎麼觀測？多久恢復？' }
            ],
            quiz: [
                { id: 'sd10-q1', type: 'choice', question: '為什麼外部依賴通常需要 Timeout？', options: ['避免 Request 無限制等待並耗盡資源', '讓資料永遠強一致', '增加圖片解析度', '取代 Authentication'], answer: 0, explanation: 'Timeout 把無限等待變成可控制的失敗。' },
                { id: 'sd10-q2', type: 'choice', question: 'Exponential Backoff + Jitter 的主要目的？', options: ['讓 Retry 更集中', '降低同步重試造成的尖峰與 Retry Storm', '取代 DB Index', '保證零失敗'], answer: 1, explanation: 'Backoff 降低頻率，Jitter 打散重試時間。' },
                { id: 'sd10-q3', type: 'choice', question: '哪個工具最適合追一個 Request 跨多個 Microservices 的延遲？', options: ['Distributed Trace', 'CSS', 'Object Storage', 'DNS TXT'], answer: 0, explanation: 'Trace 透過 spans 呈現跨服務呼叫鏈。' },
                { id: 'sd10-q4', type: 'choice', question: 'RPO 描述的是？', options: ['最多可接受遺失多少時間的資料', '多久恢復服務', '每秒 QPS', 'CPU 核心數'], answer: 0, explanation: 'RPO 是可接受的資料損失窗口。' },
                { id: 'sd10-q5', type: 'fill', question: '填空：當下游長時間失敗時暫時快速拒絕呼叫，避免每個 Request 都撞下游，稱為 Circuit _______。', answerText: 'Breaker', explanation: 'Circuit Breaker 用於隔離持續故障的依賴。' }
            ]
        }
    );
})();
