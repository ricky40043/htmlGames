window.SOFTWARE_LEARNING_COURSES = [
    {
        id: 'system-design',
        title: '系統設計',
        icon: '🏗️',
        description: '從單機服務一路學到可擴展、高可用的大型系統。',
        lessons: [
            {
                id: 'sd-01',
                title: '從單機到水平擴展',
                level: '基礎',
                duration: '8 分鐘',
                summary: '理解 Scale Up、Scale Out 與什麼時候需要 Load Balancer。',
                content: [
                    { type: 'heading', text: '先從最簡單的架構開始' },
                    { type: 'paragraph', text: '剛上線的服務通常不需要一開始就做複雜分散式架構。單台應用伺服器搭配資料庫，往往已經足夠。真正遇到 CPU、記憶體、連線數或可用性瓶頸後，再決定擴展方式。' },
                    { type: 'heading', text: 'Scale Up vs Scale Out' },
                    { type: 'bullet', text: 'Scale Up：把同一台主機換成更強的 CPU、更多 RAM。簡單，但有硬體上限與單點故障問題。' },
                    { type: 'bullet', text: 'Scale Out：增加更多應用伺服器，讓流量分散到多台機器。通常會搭配 Load Balancer。' },
                    { type: 'callout', text: '面試重點：不要看到高流量就直接回答 Kubernetes。先說明瓶頸、流量與可用性需求，再選技術。' }
                ],
                quiz: [
                    { id: 'sd01-q1', type: 'choice', question: '把 4 Core / 8 GB 主機升級成 16 Core / 64 GB，屬於哪一種擴展？', options: ['Scale Out', 'Scale Up', 'Sharding', 'Replication'], answer: 1, explanation: '提升單台機器規格就是垂直擴展 Scale Up。' },
                    { id: 'sd01-q2', type: 'choice', question: '當多台 Web Server 同時提供服務時，通常會在前方加入什麼元件分配流量？', options: ['CDN', 'Load Balancer', 'Message Queue', 'Object Storage'], answer: 1, explanation: 'Load Balancer 的核心工作之一就是把流量分配到多台後端服務。' },
                    { id: 'sd01-q3', type: 'fill', question: '填空：增加更多伺服器共同承接流量稱為 Scale ____。', answerText: 'Out', explanation: 'Scale Out 指水平擴展。' }
                ]
            },
            {
                id: 'sd-02',
                title: 'Load Balancer 與 Stateless',
                level: '基礎',
                duration: '10 分鐘',
                summary: '理解為什麼水平擴展通常需要無狀態服務。',
                content: [
                    { type: 'heading', text: 'Load Balancer 解決什麼問題？' },
                    { type: 'paragraph', text: '當服務有多台實例時，需要一個入口決定每個 Request 要送到哪台伺服器。Load Balancer 可以做流量分配、健康檢查與故障節點移除。' },
                    { type: 'heading', text: '為什麼 Stateless 很重要？' },
                    { type: 'paragraph', text: '如果登入 Session 只存在某一台 Web Server 的記憶體中，下一個 Request 被分配到另一台時就可能找不到狀態。常見做法是把共享狀態放到 Redis、Database 等外部儲存。' },
                    { type: 'callout', text: '核心觀念：Web Server 越 Stateless，通常越容易水平擴展。' }
                ],
                quiz: [
                    { id: 'sd02-q1', type: 'choice', question: '哪個做法最有利於 Web Server 水平擴展？', options: ['Session 只存本機記憶體', '把共享 Session 放到 Redis', '所有 Request 固定同一台主機', '關閉 Load Balancer'], answer: 1, explanation: '共享狀態外移後，多台 Web Server 更容易互相替換。' },
                    { id: 'sd02-q2', type: 'choice', question: 'Load Balancer 的健康檢查主要用來做什麼？', options: ['壓縮圖片', '找出不可用節點', '建立資料表', '編譯程式碼'], answer: 1, explanation: '健康檢查可以避免繼續把流量送到失效節點。' }
                ]
            }
        ]
    },
    {
        id: 'frontend',
        title: '前端工程',
        icon: '🌐',
        description: '從瀏覽器、HTTP 到 JavaScript、Vue 與前端效能。',
        lessons: [
            {
                id: 'fe-01',
                title: '瀏覽器如何取得網頁',
                level: '基礎',
                duration: '7 分鐘',
                summary: '從網址、DNS、HTTP 到 HTML 被瀏覽器呈現。',
                content: [
                    { type: 'heading', text: '輸入網址之後發生什麼？' },
                    { type: 'paragraph', text: '瀏覽器通常先解析網域名稱，建立連線，再送出 HTTP Request。Server 回傳 HTML、CSS、JavaScript 等資源後，瀏覽器才開始解析與渲染。' },
                    { type: 'callout', text: '之後這條路線會再拆 DOM、JavaScript、Promise、Vue、效能與前端資安。' }
                ],
                quiz: [
                    { id: 'fe01-q1', type: 'choice', question: 'DNS 最主要的工作是什麼？', options: ['執行 JavaScript', '把網域名稱解析成 IP', '儲存 Session', '壓縮 HTML'], answer: 1, explanation: 'DNS 負責名稱解析。' },
                    { id: 'fe01-q2', type: 'choice', question: '瀏覽器向 Server 取得資源時最常使用哪個應用層協定？', options: ['HTTP', 'SSH', 'SMTP', 'MQTT'], answer: 0, explanation: '一般 Web 資源透過 HTTP/HTTPS 傳輸。' }
                ]
            }
        ]
    },
    {
        id: 'backend',
        title: '後端工程',
        icon: '⚙️',
        description: 'API、資料庫、Cache、Queue、Authentication 與部署基礎。',
        lessons: [
            {
                id: 'be-01',
                title: 'REST API 基礎',
                level: '基礎',
                duration: '8 分鐘',
                summary: '理解 Request、Response、Method 與 Status Code。',
                content: [
                    { type: 'heading', text: 'API 是系統之間的介面' },
                    { type: 'paragraph', text: 'HTTP API 通常用 Method 表達操作意圖，例如 GET 查詢、POST 建立、PUT/PATCH 更新、DELETE 刪除，再用 Status Code 表示結果。' },
                    { type: 'callout', text: '面試不要只背 CRUD；要能說明 idempotency、錯誤碼、validation 與 API versioning。' }
                ],
                quiz: [
                    { id: 'be01-q1', type: 'choice', question: '一般 REST API 中，GET 最常代表什麼？', options: ['查詢資源', '刪除資源', '建立資料表', '重啟 Server'], answer: 0, explanation: 'GET 通常用於讀取資源。' },
                    { id: 'be01-q2', type: 'choice', question: 'HTTP 404 通常代表什麼？', options: ['成功', '未授權', '找不到資源', '伺服器一定當機'], answer: 2, explanation: '404 Not Found 表示指定資源找不到。' }
                ]
            }
        ]
    },
    {
        id: 'python',
        title: 'Python',
        icon: '🐍',
        description: '容器、OOP、Typing、Async、FastAPI 與測試。',
        lessons: [
            {
                id: 'py-01',
                title: 'List、Set、Dict 查詢成本',
                level: '基礎',
                duration: '8 分鐘',
                summary: '從資料結構選擇理解 O(n) 與平均 O(1)。',
                content: [
                    { type: 'heading', text: '資料結構會直接影響效能' },
                    { type: 'paragraph', text: '在 List 中尋找某個值通常需要線性掃描，因此是 O(n)。Set 與 Dict 基於 Hash Table，平均查詢可以做到 O(1)。' },
                    { type: 'callout', text: '這也是 Two Sum 常用 Dict/Set，而不是雙層迴圈的原因。' }
                ],
                quiz: [
                    { id: 'py01-q1', type: 'choice', question: 'target in numbers，當 numbers 是 Python list 時，平均需要什麼時間複雜度？', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2, explanation: 'List membership 通常需要逐項搜尋。' },
                    { id: 'py01-q2', type: 'choice', question: 'target in seen，當 seen 是 set 時，平均查詢複雜度為？', options: ['O(1)', 'O(n)', 'O(n log n)', 'O(n²)'], answer: 0, explanation: 'Set 使用 Hash Table，平均 membership lookup 為 O(1)。' },
                    { id: 'py01-q3', type: 'fill', question: '填空：Python 中建立空集合應寫成 ____()。', answerText: 'set', explanation: '{} 建立的是 dict；空 set 要使用 set()。' }
                ]
            }
        ]
    },
    {
        id: 'csharp',
        title: 'C# / .NET',
        icon: '🔷',
        description: 'Collection、LINQ、DI、async/await、ASP.NET Core 與 EF Core。',
        lessons: [
            {
                id: 'cs-01',
                title: 'Collection 與 Dictionary',
                level: '基礎',
                duration: '8 分鐘',
                summary: '理解 List<T> 與 Dictionary<TKey,TValue> 的使用差異。',
                content: [
                    { type: 'heading', text: '先選對資料結構' },
                    { type: 'paragraph', text: 'List<T> 適合依序存放資料；Dictionary<TKey,TValue> 適合用 Key 快速找到對應 Value。Dictionary 的 Key 查詢平均可視為 O(1)。' },
                    { type: 'callout', text: '後續會延伸 LINQ、IEnumerable、Dependency Injection 與 async/await。' }
                ],
                quiz: [
                    { id: 'cs01-q1', type: 'choice', question: '需要用唯一 Key 快速找到物件時，哪個 Collection 通常比較合適？', options: ['List<T>', 'Dictionary<TKey,TValue>', 'Queue<T>', 'Stack<T>'], answer: 1, explanation: 'Dictionary 針對 Key 查詢最佳化。' },
                    { id: 'cs01-q2', type: 'fill', question: '填空：C# 泛型字典型別名稱為 ________<TKey, TValue>。', answerText: 'Dictionary', explanation: '標準泛型字典為 Dictionary<TKey,TValue>。' }
                ]
            }
        ]
    }
];