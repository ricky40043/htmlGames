(() => {
    const course = (window.SOFTWARE_LEARNING_COURSES || []).find(item => item.id === 'algorithm-python');
    if (!course) return;

    course.lessons.push(
        {
            id: 'algo-11',
            title: 'Union-Find：快速判斷兩個節點是否屬於同一群',
            level: '中階',
            duration: '35–45 分鐘',
            summary: '理解 Disjoint Set Union、Find、Union、Path Compression 與 Union by Rank，並用 Connected Components 建立直覺。',
            content: [
                { type: 'slides', title: 'Graph 不一定要每次都 DFS/BFS', slides: [
                    { kicker: 'QUESTION', title: '「A 跟 B 現在有沒有連通？」', text: '如果節點與連線一直新增，但你只想頻繁回答兩點是否在同一 Connected Component，每次都重跑 DFS/BFS 會浪費很多工作。', visual: 'A ─ B    C ─ D\nQuery: A connected to D?' },
                    { kicker: 'PARENT', title: '每個集合選一個代表 Root', text: 'Union-Find 用 parent 陣列記住「我的代表是誰」。同一個 root 的節點就屬於同一集合。', visual: '0 → 0\n1 → 0\n2 → 0\n3 → 3' },
                    { kicker: 'UNION', title: '連線時只要把兩個 Root 合併', text: 'Union(a,b) 不需要重新掃所有節點，只需找到 rootA、rootB，再把其中一棵掛到另一棵。', visual: 'rootA → rootB' },
                    { kicker: 'COMPRESSION', title: 'Find 時順便把路徑壓扁', text: 'Path Compression 讓走過的節點直接指向 root，後續查詢會越來越快。', visual: '4→3→2→1→0\n變成 4→0,3→0,2→0,1→0' }
                ]},
                { type: 'heading', text: '1. 最基本的 DSU 結構' },
                { type: 'code', text: 'class UnionFind:\n    def __init__(self, n):\n        self.parent = list(range(n))\n        self.rank = [0] * n\n\n    def find(self, x):\n        if self.parent[x] != x:\n            self.parent[x] = self.find(self.parent[x])\n        return self.parent[x]\n\n    def union(self, a, b):\n        ra = self.find(a)\n        rb = self.find(b)\n        if ra == rb:\n            return False\n\n        if self.rank[ra] < self.rank[rb]:\n            ra, rb = rb, ra\n\n        self.parent[rb] = ra\n        if self.rank[ra] == self.rank[rb]:\n            self.rank[ra] += 1\n        return True' },
                { type: 'heading', text: '2. Find 做的是「找代表」' },
                { type: 'stepper', steps: [
                    { title: 'parent[x] == x', text: '代表 x 自己就是 root，直接回傳。' },
                    { title: '不是 root', text: '遞迴往 parent[x] 繼續找。' },
                    { title: '找到 root', text: '把沿途節點直接改指 root，這就是 Path Compression。' },
                    { title: '之後更快', text: '同一批節點再次 find 時，通常只要走很短距離。' }
                ]},
                { type: 'heading', text: '3. Union by Rank / Size 為什麼重要？' },
                { type: 'paragraph', text: '如果每次都把大樹掛到小樹下面，Tree 可能變很高，Find 就會變慢。Union by Rank 或 Size 會讓較小/較矮的集合掛到較大/較高集合，避免退化。搭配 Path Compression 後，攤銷複雜度非常接近 O(1)。' },
                { type: 'checkpoint', question: 'Union-Find 最適合處理哪類問題？', options: ['動態合併集合並頻繁判斷連通性', '字串排序', 'Binary Search 邊界', 'HTML 渲染'], answer: 0, explanation: 'DSU 的核心就是快速 Union 與 Find。' },
                { type: 'heading', text: '4. Connected Components 範例' },
                { type: 'code', text: 'def count_components(n, edges):\n    uf = UnionFind(n)\n    components = n\n\n    for a, b in edges:\n        if uf.union(a, b):\n            components -= 1\n\n    return components' },
                { type: 'heading', text: '5. 常見題型' },
                { type: 'bullet', text: 'Graph 中 Connected Components 數量。' },
                { type: 'bullet', text: '是否加入某條 edge 會形成 cycle。' },
                { type: 'bullet', text: 'Kruskal Minimum Spanning Tree。' },
                { type: 'bullet', text: '帳號合併、群組合併、網路連通性。' },
                { type: 'callout', text: 'Union-Find 的思考方式：如果題目一直出現「合併兩群」與「這兩個現在是不是同一群」，就要想到 DSU，而不是每次重跑 traversal。' }
            ],
            quiz: [
                { id: 'a11-q1', type: 'choice', question: '`find(x)` 的主要目的？', options: ['找到 x 所屬集合的代表 root', '排序 x', '刪除 x', '找 x 的下一個字元'], answer: 0, explanation: 'Find 回傳集合代表。' },
                { id: 'a11-q2', type: 'choice', question: 'Path Compression 做什麼？', options: ['讓沿途節點更直接指向 root', '把資料排序', '增加 Tree 高度', '刪除 parent'], answer: 0, explanation: '壓縮路徑可以加速後續 Find。' },
                { id: 'a11-q3', type: 'choice', question: 'Union by Rank/Size 的目的？', options: ['避免集合樹變得過高', '讓值變成字串', '取代 visited', '保證 edge 有權重'], answer: 0, explanation: '小樹掛大樹可降低高度。' },
                { id: 'a11-q4', type: 'choice', question: '哪個場景最適合 DSU？', options: ['一直新增 friendships，並查兩人是否連通', '找排序陣列 target', 'Stack 括號配對', '計算字串長度'], answer: 0, explanation: '動態 connectivity 是典型 DSU 場景。' },
                { id: 'a11-q5', type: 'fill', question: '填空：Disjoint Set Union 常縮寫為 ___。', answerText: 'DSU', explanation: 'Union-Find 也常稱 DSU。' }
            ]
        },
        {
            id: 'algo-12',
            title: 'Trie：Prefix Search、Autocomplete 與字典樹',
            level: '中階',
            duration: '35–45 分鐘',
            summary: '理解 Trie 如何共享 Prefix、為什麼適合前綴搜尋，以及 Python 實作、記憶體代價與 Autocomplete。',
            content: [
                { type: 'slides', title: '如果你一直問「哪些字以 app 開頭？」', slides: [
                    { kicker: 'HASH SET', title: 'Set 很會回答「完整字是否存在」', text: '`word in words` 平均很快，但 Set 不知道哪些字共享 prefix。要找所有 app* 還是得掃很多字。', visual: '{apple, app, apply, banana}' },
                    { kicker: 'TRIE', title: '把共同 Prefix 共用同一條路徑', text: 'a→p→p 只存一次，apple、app、apply 從同一個 prefix 節點分叉。', visual: 'a → p → p → l → e\n          └→ y' },
                    { kicker: 'PREFIX', title: '找 prefix 只需要走 prefix 長度', text: '如果 prefix 長度是 k，定位到 prefix node 大致 O(k)，不需要掃整個字典。', visual: 'search prefix="app" → node(app)' },
                    { kicker: 'TRADE-OFF', title: '速度換來的是記憶體', text: '每個 node 都可能要保存 children map；字典很大時 Trie 可能比壓縮字串結構吃更多 RAM。', visual: 'Fast prefix lookup ↔ Memory cost' }
                ]},
                { type: 'heading', text: '1. Python Trie Node' },
                { type: 'code', text: 'class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_word = False\n\nclass Trie:\n    def __init__(self):\n        self.root = TrieNode()\n\n    def insert(self, word):\n        node = self.root\n        for ch in word:\n            node = node.children.setdefault(ch, TrieNode())\n        node.is_word = True' },
                { type: 'heading', text: '2. Search 與 StartsWith 不一樣' },
                { type: 'code', text: 'def search(self, word):\n    node = self.root\n    for ch in word:\n        if ch not in node.children:\n            return False\n        node = node.children[ch]\n    return node.is_word\n\ndef starts_with(self, prefix):\n    node = self.root\n    for ch in prefix:\n        if ch not in node.children:\n            return False\n        node = node.children[ch]\n    return True' },
                { type: 'paragraph', text: '`app` 可能是一個完整 word，也可能只是 `apple` 的 prefix。`is_word` 用來區分「走得到這裡」與「這裡本身是一個完整單字」。' },
                { type: 'checkpoint', question: 'Trie 中能走到 `app` 節點，但 `is_word=False`，代表什麼？', options: ['app 只是某些字的 prefix，不一定是完整單字', 'Trie 壞掉', 'app 一定不存在於任何單字', '一定形成 cycle'], answer: 0, explanation: '節點存在代表 prefix 存在；is_word 才表示完整字存在。' },
                { type: 'heading', text: '3. Autocomplete 怎麼做？' },
                { type: 'stepper', steps: [
                    { title: 'Walk Prefix', text: '先走到 `app` 對應節點。走不到就沒有候選。' },
                    { title: 'DFS from Node', text: '從 prefix node 往下 DFS，收集所有 is_word=True 的單字。' },
                    { title: 'Limit Top K', text: '實務通常只取前 5 或 10 個，不會回全部。' },
                    { title: 'Add Ranking', text: '可在 node 保存熱門度、Top K cache 或使用者歷史，讓 autocomplete 不只按字典序。' }
                ]},
                { type: 'heading', text: '4. Trie vs Hash Set' },
                { type: 'compare', items: [
                    { icon: '#️⃣', title: 'Hash Set', text: '完整 key membership 很快，實作簡單、記憶體通常更直接。', bestFor: '完整字是否存在' },
                    { icon: '🌲', title: 'Trie', text: 'Prefix sharing 與 prefix traversal 是強項，可以自然延伸 autocomplete、dictionary search。', bestFor: 'Prefix search、Autocomplete' }
                ]},
                { type: 'heading', text: '5. 常見延伸' },
                { type: 'bullet', text: 'Word Search 類題目：Trie + DFS/Grid。' },
                { type: 'bullet', text: '搜尋建議：Trie node 保存 top suggestions。' },
                { type: 'bullet', text: 'IP Routing 的 Prefix Match 也有類似 prefix tree 思維。' },
                { type: 'callout', text: 'Trie 不一定比 Hash 更「高級」。只有當 Prefix 本身是查詢條件時，它才真正展現價值。資料結構永遠要跟存取模式一起看。' }
            ],
            quiz: [
                { id: 'a12-q1', type: 'choice', question: 'Trie 最擅長哪種查詢？', options: ['Prefix search', '任意浮點排序', 'Matrix multiplication', 'Queue dequeue'], answer: 0, explanation: 'Trie 共享 prefix 路徑。' },
                { id: 'a12-q2', type: 'choice', question: '`is_word` 欄位主要用來？', options: ['標示目前節點是否代表完整單字結尾', '記錄 Tree 高度', '保存 parent index', '做 Binary Search'], answer: 0, explanation: 'Prefix node 不一定是完整 word。' },
                { id: 'a12-q3', type: 'choice', question: 'Trie 的主要代價之一？', options: ['可能消耗較多記憶體', '完全不能搜尋', '一定 O(n²)', '不能存字元'], answer: 0, explanation: '大量 node 與 children map 會增加記憶體。' },
                { id: 'a12-q4', type: 'choice', question: 'Autocomplete 常見流程？', options: ['走到 prefix node，再向下收集候選', '每次刪除 Trie', '先做 Heap Sort 全部資料', '只查 root'], answer: 0, explanation: 'Prefix node 是 autocomplete 的起點。' },
                { id: 'a12-q5', type: 'fill', question: '填空：Trie 也常被稱為 Prefix ____。', answerText: 'Tree', explanation: 'Trie 常稱 prefix tree。' }
            ]
        },
        {
            id: 'algo-13',
            title: 'Dijkstra：Weighted Graph 的最短路徑',
            level: '中階 → 進階',
            duration: '45–55 分鐘',
            summary: '從 BFS 無權最短路徑延伸到正權重 Graph，理解 Relaxation、Min-Heap、Distance Table 與為什麼負權重會破壞 Dijkstra。',
            content: [
                { type: 'slides', title: 'BFS 只知道「幾條邊」，不知道「每條邊多貴」', slides: [
                    { kicker: 'UNWEIGHTED', title: 'BFS：每條 Edge 成本都一樣', text: 'A→B→D 兩條邊，A→C→E→D 三條邊，所以 BFS 能直接按層找最少步數。', visual: 'edge cost = 1, 1, 1...' },
                    { kicker: 'WEIGHTED', title: 'Weighted Graph 中，邊數少不代表成本低', text: '一條 edge 可能 cost 100，三條 edge 可能每條 cost 2。這時只看層級就會錯。', visual: 'A→D = 100\nA→B→C→D = 2+2+2 = 6' },
                    { kicker: 'GREEDY', title: 'Dijkstra 每次先確定目前距離最小的節點', text: '用 Min-Heap 取出目前最便宜候選，然後嘗試改善它所有鄰居的距離。', visual: 'heap → smallest distance first' },
                    { kicker: 'RELAX', title: 'Relaxation = 發現更短路徑就更新', text: '若 dist[u] + weight(u,v) < dist[v]，就把 dist[v] 改小，並推進 heap。', visual: 'new = dist[u] + w\nif new < dist[v]: update' }
                ]},
                { type: 'heading', text: '1. Python Dijkstra' },
                { type: 'code', text: 'import heapq\n\ndef dijkstra(graph, start):\n    dist = {node: float("inf") for node in graph}\n    dist[start] = 0\n    heap = [(0, start)]\n\n    while heap:\n        current_dist, node = heapq.heappop(heap)\n\n        if current_dist != dist[node]:\n            continue\n\n        for neighbor, weight in graph[node]:\n            new_dist = current_dist + weight\n            if new_dist < dist[neighbor]:\n                dist[neighbor] = new_dist\n                heapq.heappush(heap, (new_dist, neighbor))\n\n    return dist' },
                { type: 'heading', text: '2. 為什麼 Heap 裡可能有同一節點多次？' },
                { type: 'paragraph', text: 'Python `heapq` 沒有直接 decrease-key API。當找到更短距離時，我們可以把新版 `(new_dist, node)` 再 push 一次。舊版之後 pop 出來時，用 `if current_dist != dist[node]: continue` 判斷它已過期。' },
                { type: 'checkpoint', question: 'Dijkstra 中 `dist[v]` 從 10 更新成 6，Heap 裡舊的 `(10,v)` 之後怎麼處理？', options: ['Pop 出來時發現不是目前 dist[v]，直接跳過', '一定要刪掉整個 Heap', '把 Graph 清空', '永遠不能出現重複'], answer: 0, explanation: 'Lazy deletion 是 heapq 常見做法。' },
                { type: 'heading', text: '3. Relaxation 的核心' },
                { type: 'stepper', steps: [
                    { title: 'Take u', text: '從 Min-Heap 取目前距離最小的 u。' },
                    { title: 'Inspect Edge', text: '看 edge u→v，權重 w。' },
                    { title: 'Candidate', text: '計算 candidate = dist[u] + w。' },
                    { title: 'Relax', text: '如果 candidate < dist[v]，更新 dist[v]。' },
                    { title: 'Push', text: '把新距離 `(candidate, v)` 放回 Heap。' }
                ]},
                { type: 'heading', text: '4. 為什麼負權重不能直接用 Dijkstra？' },
                { type: 'paragraph', text: 'Dijkstra 的貪心假設是：目前最小距離節點一旦被確定，後面不會再出現更便宜路徑。負權重可能讓你繞到後面再把已確定節點變得更小，破壞這個假設。這時要看 Bellman-Ford 等其它方法。' },
                { type: 'compare', items: [
                    { icon: '➡️', title: 'BFS', text: '每條 edge cost 相同時，Queue 按層展開。', bestFor: 'Unweighted shortest path' },
                    { icon: '⚖️', title: 'Dijkstra', text: 'Edge weight >= 0，用 Min-Heap 選目前距離最小節點。', bestFor: 'Non-negative weighted graph' }
                ]},
                { type: 'heading', text: '5. 常見實務映射' },
                { type: 'bullet', text: '地圖道路：weight = 距離或時間。' },
                { type: 'bullet', text: '網路路由：weight = cost / latency。' },
                { type: 'bullet', text: '任務轉換：weight = 成本。' },
                { type: 'callout', text: 'Dijkstra 不是「Weighted Graph 就背這個」。先確認 edge weight 是否非負，再理解為什麼每次拿最小候選是安全的。' }
            ],
            quiz: [
                { id: 'a13-q1', type: 'choice', question: 'Dijkstra 最典型的使用前提？', options: ['Edge weights 非負', 'Graph 一定沒有 edge', '所有值都相同', '只能 Tree'], answer: 0, explanation: '負權重會破壞 Dijkstra 的貪心正確性。' },
                { id: 'a13-q2', type: 'choice', question: 'Relaxation 指的是？', options: ['發現更短路徑時更新 dist', '刪除所有 nodes', '把 Heap 排成字串', '把 Graph 變 Tree'], answer: 0, explanation: 'Relaxation 是 shortest path 核心操作。' },
                { id: 'a13-q3', type: 'choice', question: 'Dijkstra 常搭配哪個資料結構選最小距離候選？', options: ['Min-Heap', 'Stack', 'Trie only', 'Set only'], answer: 0, explanation: 'Priority Queue/Min-Heap 可快速取得目前最小距離。' },
                { id: 'a13-q4', type: 'choice', question: '無權 Graph 最短路徑通常先用？', options: ['BFS', 'Dijkstra 一定', 'Heap Sort', 'Union-Find'], answer: 0, explanation: '每條 edge 成本相同時 BFS 更簡單。' },
                { id: 'a13-q5', type: 'fill', question: '填空：發現更短路徑並更新距離的操作稱為 ________。', answerText: 'Relaxation', explanation: 'Shortest path 演算法常稱這步為 relaxation。' }
            ]
        },
        {
            id: 'algo-14',
            title: 'Dynamic Programming：把重複子問題的答案存起來',
            level: '進階入門',
            duration: '50–65 分鐘',
            summary: '建立 DP 的真正辨識方式：狀態、轉移、Base Case、Memoization、Tabulation，並用 Climbing Stairs 與 House Robber 練習。',
            content: [
                { type: 'slides', title: 'DP 不是「看到題目很難就開 dp 陣列」', slides: [
                    { kicker: 'RECURSION', title: '先看到重複子問題', text: 'Climbing Stairs：f(n)=f(n-1)+f(n-2)。單純遞迴會反覆算相同 f(k)。', visual: 'f(5)\n├ f(4)\n│ ├ f(3)\n└ f(3) ← 重複' },
                    { kicker: 'MEMO', title: 'Top-down：算過就記住', text: 'Memoization 讓每個 state 只真正計算一次，保留遞迴思考方式。', visual: 'memo[n] = answer' },
                    { kicker: 'TABLE', title: 'Bottom-up：從最小 state 往上推', text: 'Tabulation 先準備 base case，再依 dependency 順序填 dp。', visual: 'dp[0] → dp[1] → dp[2] → ...' },
                    { kicker: 'STATE', title: '真正最難的是「State 定義」', text: '你必須說清楚 dp[i] 到底代表什麼。State 定義錯，轉移方程式通常也會跟著亂。', visual: 'dp[i] = ?' }
                ]},
                { type: 'heading', text: '1. Climbing Stairs：最小 DP 範例' },
                { type: 'code', text: 'def climb_stairs(n):\n    if n <= 2:\n        return n\n\n    prev2 = 1\n    prev1 = 2\n\n    for _ in range(3, n + 1):\n        current = prev1 + prev2\n        prev2, prev1 = prev1, current\n\n    return prev1' },
                { type: 'paragraph', text: 'State：`dp[i] = 到達第 i 階的方法數`。Transition：最後一步不是從 i-1 上來，就是從 i-2 上來，所以 `dp[i] = dp[i-1] + dp[i-2]`。這才是完整 DP 推導，而不是只背 Fibonacci。' },
                { type: 'heading', text: '2. DP 四步法' },
                { type: 'stepper', steps: [
                    { title: 'Define State', text: '用一句話定義 dp[i] 或 dp[i][j] 代表什麼。' },
                    { title: 'Transition', text: '找出目前 state 如何由更小 state 推導。' },
                    { title: 'Base Case', text: '最小問題的答案是什麼？哪些 state 不需要再拆？' },
                    { title: 'Order', text: 'Bottom-up 時，要確保計算 dp[i] 前，它依賴的 state 已經有答案。' }
                ]},
                { type: 'checkpoint', question: '如果你無法清楚說出 `dp[i]` 代表什麼，最可能發生什麼？', options: ['Transition 很容易亂掉', '程式一定自動正確', 'Python 會替你定義 state', '只影響變數名稱'], answer: 0, explanation: 'State 定義是 DP 推導核心。' },
                { type: 'heading', text: '3. House Robber：不是 Fibonacci，但一樣是選擇 DP' },
                { type: 'code', text: 'def rob(nums):\n    prev2 = 0\n    prev1 = 0\n\n    for money in nums:\n        current = max(prev1, prev2 + money)\n        prev2, prev1 = prev1, current\n\n    return prev1' },
                { type: 'paragraph', text: '對第 i 間房只有兩個決策：不搶 → 保留 dp[i-1]；搶 → dp[i-2] + nums[i]。因此 `dp[i] = max(dp[i-1], dp[i-2] + nums[i])`。這就是把「選或不選」轉成 state transition。' },
                { type: 'heading', text: '4. Memoization vs Tabulation' },
                { type: 'compare', items: [
                    { icon: '⬇️', title: 'Top-down Memoization', text: '從原問題遞迴拆小，遇到 state 先查 cache。直覺自然，但有 recursion overhead / stack depth。', bestFor: '狀態不一定全部會碰到、遞迴關係自然' },
                    { icon: '⬆️', title: 'Bottom-up Tabulation', text: '從 base case 往上填表。沒有 recursion stack，常更容易做空間壓縮。', bestFor: '依賴順序清楚、會遍歷大部分 state' }
                ]},
                { type: 'heading', text: '5. 什麼題目有 DP 味道？' },
                { type: 'bullet', text: '求最大/最小值、方法數、是否可達。' },
                { type: 'bullet', text: '問題可以拆成較小版本，而且子問題會重複。' },
                { type: 'bullet', text: '目前決策影響未來，但可以用有限 state 摘要「過去需要知道的資訊」。' },
                { type: 'bullet', text: '常見題型：Knapsack、Coin Change、LCS、Edit Distance、Grid Path。' },
                { type: 'callout', text: '學 DP 最有效的方法不是背 50 個公式，而是每題強迫自己先寫出：「State 是什麼？Transition 為什麼成立？Base Case 是什麼？」' }
            ],
            quiz: [
                { id: 'a14-q1', type: 'choice', question: 'DP 最核心的第一步通常是？', options: ['定義 State', '先寫兩層 for', '先建 Heap', '先排序所有輸入'], answer: 0, explanation: 'State 定義決定 transition 如何推導。' },
                { id: 'a14-q2', type: 'choice', question: 'Memoization 的主要作用？', options: ['保存已計算子問題，避免重算', '把 List 排序', '刪除 recursion', '保證 O(1)'], answer: 0, explanation: 'Top-down DP 用 cache 消除重複子問題。' },
                { id: 'a14-q3', type: 'choice', question: 'Climbing Stairs 常見 transition？', options: ['dp[i]=dp[i-1]+dp[i-2]', 'dp[i]=i*i 一定', 'dp[i]=0 永遠', 'dp[i]=heap[0]'], answer: 0, explanation: '最後一步可從前一階或前兩階而來。' },
                { id: 'a14-q4', type: 'choice', question: 'House Robber 中搶第 i 間房時，通常要搭配哪個先前 state？', options: ['dp[i-2]', 'dp[i+100]', '只有 dp[i]', 'root parent'], answer: 0, explanation: '相鄰不能搶，因此搭配 i-2 的最佳值。' },
                { id: 'a14-q5', type: 'fill', question: '填空：Top-down DP 儲存已計算結果的技巧稱 Memo______。', answerText: 'ization', explanation: '完整單字是 Memoization。' }
            ]
        },
        {
            id: 'algo-15',
            title: 'Greedy 與 Interval Problems：每一步選局部最佳，何時才真的正確？',
            level: '進階入門',
            duration: '45–60 分鐘',
            summary: '理解 Greedy 不是「看起來最划算就選」，而是需要可證明的 Greedy Choice Property；並用 Interval Scheduling、Merge Intervals 建立題型辨識。',
            content: [
                { type: 'slides', title: 'Greedy 最危險的地方：程式通常很好寫，但不一定正確', slides: [
                    { kicker: 'LOCAL', title: 'Greedy 每一步做當下最好的選擇', text: '它不回頭、不枚舉所有組合，也不保存大量 state，所以通常很快。', visual: 'choose best now → move on' },
                    { kicker: 'PROOF', title: '問題是：局部最佳會不會導致全域最佳？', text: '有些問題可以證明，例如 Activity Selection；有些問題不行，例如 0/1 Knapsack 不能單靠價值比 greedy。', visual: 'Local optimum ?= Global optimum' },
                    { kicker: 'INTERVAL', title: 'Interval 題常有明確排序策略', text: '最大化不重疊活動數：依 end time 排序，每次選最早結束的活動，能保留最多剩餘空間。', visual: '[1,2] [2,3] [1,10]\nchoose earliest end' },
                    { kicker: 'MERGE', title: '有些 Interval 題不是 Greedy optimization，而是排序 + 掃描', text: 'Merge Intervals 先依 start 排序，再維護目前合併區間。這也是面試很常見的 pattern。', visual: '[1,3],[2,6],[8,10] → [1,6],[8,10]' }
                ]},
                { type: 'heading', text: '1. Activity Selection：最大不重疊區間數' },
                { type: 'code', text: 'def max_non_overlapping(intervals):\n    intervals.sort(key=lambda x: x[1])\n\n    count = 0\n    last_end = float("-inf")\n\n    for start, end in intervals:\n        if start >= last_end:\n            count += 1\n            last_end = end\n\n    return count' },
                { type: 'paragraph', text: '為什麼選「最早結束」？因為它在不犧牲目前可選活動的前提下，替後面留下最多時間。這可以用 exchange argument 證明：任何最佳解的第一個活動，都可以換成最早結束的活動而不變差。' },
                { type: 'checkpoint', question: '最大化不重疊活動數時，典型 Greedy 排序依據？', options: ['End time 由小到大', 'Start time 由大到小一定', '區間長度最大', '隨機順序'], answer: 0, explanation: '最早結束能為後續活動保留最大空間。' },
                { type: 'heading', text: '2. Merge Intervals：排序 + 掃描' },
                { type: 'code', text: 'def merge(intervals):\n    intervals.sort(key=lambda x: x[0])\n    merged = []\n\n    for start, end in intervals:\n        if not merged or start > merged[-1][1]:\n            merged.append([start, end])\n        else:\n            merged[-1][1] = max(merged[-1][1], end)\n\n    return merged' },
                { type: 'stepper', steps: [
                    { title: 'Sort by Start', text: '先依起點排序，後面遇到的 interval 起點不會比前面更小。' },
                    { title: 'No Overlap', text: '若 start > merged[-1].end，新增一段。' },
                    { title: 'Overlap', text: '若有重疊，更新 end = max(old_end, end)。' },
                    { title: 'One Pass', text: '排序 O(n log n)，掃描 O(n)。' }
                ]},
                { type: 'heading', text: '3. Greedy vs DP：怎麼分？' },
                { type: 'compare', items: [
                    { icon: '⚡', title: 'Greedy', text: '每一步直接 commit，不回頭。需要證明 local choice 不會讓最佳解消失。', bestFor: '有 Greedy Choice Property、交換論證成立' },
                    { icon: '🧠', title: 'Dynamic Programming', text: '保留多個可能 state，系統性比較不同選擇的結果。', bestFor: '選擇會影響未來，無法安全只保留一個局部最佳' }
                ]},
                { type: 'heading', text: '4. Greedy 失敗範例：0/1 Knapsack' },
                { type: 'paragraph', text: '如果每件物品只能拿或不拿，單純選 value/weight 最大的物品不一定得到最佳總價值。這也是為什麼「Greedy 很直覺」不是正確性的證明。Fractional Knapsack 可以按比值 Greedy，但 0/1 Knapsack 通常要 DP。' },
                { type: 'heading', text: '5. 常見 Greedy 題型' },
                { type: 'bullet', text: 'Interval Scheduling / Meeting Rooms 的排序與掃描。' },
                { type: 'bullet', text: 'Jump Game 某些版本：維護目前可到最遠位置。' },
                { type: 'bullet', text: 'Huffman Coding、Minimum Spanning Tree（Kruskal/Prim）都有 Greedy 性質。' },
                { type: 'bullet', text: '排序後逐步做最有利決策，但一定要能說明為什麼不需回頭。' },
                { type: 'callout', text: '做到第 15 章，你現在看到新題應該先問：「資料結構是什麼？搜尋空間有沒有單調性？有沒有重複子問題？局部選擇能不能被證明安全？」這比背題號重要得多。' }
            ],
            quiz: [
                { id: 'a15-q1', type: 'choice', question: 'Greedy 演算法最大的正確性風險？', options: ['局部最佳不一定導致全域最佳', '一定太慢', '不能使用排序', '不能使用 List'], answer: 0, explanation: 'Greedy 必須有可證明的 greedy-choice property。' },
                { id: 'a15-q2', type: 'choice', question: 'Activity Selection 最大化不重疊活動數，典型策略？', options: ['每次選最早結束的活動', '每次選最長活動', '每次選最晚開始一定', '隨機'], answer: 0, explanation: 'Earliest finish 是經典正確 greedy 策略。' },
                { id: 'a15-q3', type: 'choice', question: 'Merge Intervals 的主要步驟？', options: ['依 start 排序後線性掃描合併', '一定用 Union-Find', '一定用 Trie', '不用排序也永遠 O(1)'], answer: 0, explanation: '排序讓相鄰可能重疊區間集中。' },
                { id: 'a15-q4', type: 'choice', question: '0/1 Knapsack 為什麼不能直接用 value/weight Greedy 保證最佳？', options: ['局部比值最佳可能阻擋更好的組合', '因為沒有重量', '因為 Python 不支援 float', '因為一定是 Graph'], answer: 0, explanation: '0/1 選擇不可切分，局部選擇不保證全域最佳。' },
                { id: 'a15-q5', type: 'fill', question: '填空：把重疊區間整理成不重疊結果的經典題稱 Merge ________。', answerText: 'Intervals', explanation: 'Merge Intervals 是常見排序 + 掃描題型。' }
            ]
        }
    );
})();