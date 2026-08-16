(() => {
    const course = (window.SOFTWARE_LEARNING_COURSES || []).find(item => item.id === 'algorithm-python');
    if (!course) return;

    course.lessons.push(
        {
            id: 'algo-16',
            title: 'Topological Sort：有先後依賴時，怎麼排出合法順序？',
            level: '進階入門',
            duration: '45–60 分鐘',
            summary: '用 Course Schedule 理解 Directed Acyclic Graph、Indegree、Kahn BFS 與 DFS Cycle Detection。',
            content: [
                { type: 'slides', title: '「先做 A 才能做 B」其實就是 Directed Graph', slides: [
                    { kicker: 'DEPENDENCY', title: '依賴天然有方向', text: '課程 prerequisite、Build dependency、工作流程、部署順序，都可以畫成 A → B。', visual: 'Database → Backend → Integration Test' },
                    { kicker: 'ORDER', title: '合法順序不一定只有一個', text: '如果 A、B 互不依賴，它們誰先都可以。Topological Order 要求每條 edge u→v 中，u 一定排在 v 前面。', visual: 'A→C, B→C\nA,B,C 或 B,A,C 都合法' },
                    { kicker: 'CYCLE', title: '有 Cycle 就不可能完成', text: 'A 依賴 B、B 依賴 C、C 又依賴 A，沒有任何起點。', visual: 'A → B → C → A ❌' },
                    { kicker: 'INDEGREE', title: '先做目前沒有前置依賴的節點', text: 'Kahn Algorithm 從 indegree=0 的 nodes 開始，每完成一個就移除它的 outgoing edges。', visual: 'indegree 0 → queue → reduce neighbors' }
                ]},
                { type: 'heading', text: '1. Kahn Algorithm（BFS）' },
                { type: 'code', text: 'from collections import deque\n\ndef topo_sort(n, edges):\n    graph = [[] for _ in range(n)]\n    indegree = [0] * n\n\n    for u, v in edges:\n        graph[u].append(v)\n        indegree[v] += 1\n\n    queue = deque(i for i in range(n) if indegree[i] == 0)\n    order = []\n\n    while queue:\n        node = queue.popleft()\n        order.append(node)\n\n        for nxt in graph[node]:\n            indegree[nxt] -= 1\n            if indegree[nxt] == 0:\n                queue.append(nxt)\n\n    return order if len(order) == n else []' },
                { type: 'stepper', steps: [
                    { title: 'Build Graph', text: '建立 adjacency list，並統計每個 node 的 indegree。' },
                    { title: 'Seed Queue', text: '所有 indegree=0 的 node 都可以立即執行，先進 queue。' },
                    { title: 'Remove Node', text: '取出 node，加入答案，視為完成這個工作。' },
                    { title: 'Reduce Dependencies', text: '它指向的 neighbors 少一個 prerequisite，所以 indegree -= 1。' },
                    { title: 'Detect Cycle', text: '最後 order 長度若小於 n，代表剩餘 nodes 互相形成 cycle。' }
                ]},
                { type: 'checkpoint', question: 'Kahn Algorithm 最後只處理了 7/10 個 nodes，最可能代表？', options: ['存在 Cycle', '一定排序完成', 'Heap 壞掉', 'List 必須 reverse'], answer: 0, explanation: 'Cycle 中的節點無法降到 indegree=0。' },
                { type: 'heading', text: '2. DFS 也能做 Topological Sort' },
                { type: 'paragraph', text: 'DFS 用三色/狀態判斷：未訪問、正在 recursion path、已完成。若 DFS 遇到「正在 path」的 node，就是 back edge → cycle。完成 node 時 append，最後 reverse 即為 topological order。' },
                { type: 'compare', items: [
                    { icon: '➡️', title: 'Kahn BFS', text: 'Indegree + Queue，流程直觀，也能直接看哪些工作現在可執行。', bestFor: '排程、dependency processing' },
                    { icon: '⬇️', title: 'DFS', text: '透過 recursion state 偵測 cycle，postorder 形成 topological order。', bestFor: '已有 DFS 框架、dependency recursion' }
                ]},
                { type: 'heading', text: '3. 題型訊號' },
                { type: 'bullet', text: '「Prerequisite」、「Dependency」、「Before/After」。' },
                { type: 'bullet', text: '問能不能完成所有任務 → cycle detection。' },
                { type: 'bullet', text: '問一個合法執行順序 → topological order。' },
                { type: 'callout', text: 'Topological Sort 是 Graph 的「依賴排序」，不是一般數值排序。沒有 directed dependency，就不要硬套。' }
            ],
            quiz: [
                { id: 'a16-q1', type: 'choice', question: 'Topological Sort 適用於？', options: ['DAG 的依賴順序', '任意數字排序', 'Hash collision', 'Binary Search only'], answer: 0, explanation: 'Topological order 定義在 directed acyclic graph。' },
                { id: 'a16-q2', type: 'choice', question: 'Kahn Algorithm 一開始把哪些 node 放進 queue？', options: ['Indegree=0', 'Outdegree=0 only', '所有 node 重複放', '最大值 node'], answer: 0, explanation: '沒有 prerequisite 的節點可以先執行。' },
                { id: 'a16-q3', type: 'choice', question: '最後處理 node 數 < n 通常代表？', options: ['Graph 有 cycle', '答案一定唯一', 'Graph 無 edge', 'Queue 是 Stack'], answer: 0, explanation: 'Cycle 使剩餘節點無法降為 indegree 0。' },
                { id: 'a16-q4', type: 'choice', question: 'Topological order 是否一定唯一？', options: ['不一定', '一定唯一', '只有 Python 才唯一', '有兩個 node 就唯一'], answer: 0, explanation: '互不依賴的 nodes 可有多種合法相對順序。' },
                { id: 'a16-q5', type: 'fill', question: '填空：一個 node 有多少 incoming edges 稱為 ________。', answerText: 'Indegree', explanation: 'Kahn Algorithm 以 indegree 為核心。' }
            ]
        },
        {
            id: 'algo-17',
            title: 'Monotonic Stack：找下一個更大/更小元素',
            level: '進階入門',
            duration: '45–60 分鐘',
            summary: '理解單調 Stack 如何把 O(n²) 的「往右找第一個更大」壓成 O(n)，並練習 Daily Temperatures。',
            content: [
                { type: 'slides', title: '每個元素都往右掃，為什麼浪費？', slides: [
                    { kicker: 'BRUTE FORCE', title: '每一天都重新往右找 warmer day', text: '最壞情況每個位置都掃很多次，容易 O(n²)。', visual: '73 → scan 74...\n74 → scan 75...' },
                    { kicker: 'WAITING', title: 'Stack 保存「還在等答案的人」', text: '如果目前溫度不夠高，前面的 index 先留在 stack。', visual: 'stack = [indices waiting]' },
                    { kicker: 'POP', title: '新值夠大時，一次解決多個舊問題', text: '當 current > temperatures[stack[-1]]，代表 current 就是 stack top 等到的第一個更大值。', visual: '75 resolves 71,72,74?' },
                    { kicker: 'MONOTONIC', title: 'Stack 裡保持單調', text: 'Daily Temperatures 維持溫度單調遞減的 indices；每個 index 最多 push 一次、pop 一次，所以 O(n)。', visual: 'push once + pop once → O(n)' }
                ]},
                { type: 'heading', text: '1. Daily Temperatures' },
                { type: 'code', text: 'def daily_temperatures(temperatures):\n    answer = [0] * len(temperatures)\n    stack = []  # indices, temperatures decreasing\n\n    for i, temp in enumerate(temperatures):\n        while stack and temp > temperatures[stack[-1]]:\n            prev = stack.pop()\n            answer[prev] = i - prev\n\n        stack.append(i)\n\n    return answer' },
                { type: 'heading', text: '2. 為什麼要存 Index，不只存 Value？' },
                { type: 'paragraph', text: '題目要回答「幾天後」，所以找到 warmer day 時需要 `i - prev_index`。很多 Monotonic Stack 題都會存 index，因為距離、範圍與左右邊界都需要位置資訊。' },
                { type: 'checkpoint', question: '雖然有 for 裡包 while，為什麼 Daily Temperatures 是 O(n)？', options: ['每個 index 最多 push/pop 各一次', 'while 永遠不跑', 'Python 自動 cache', 'Stack 是 O(log n)'], answer: 0, explanation: '總 push/pop 次數是線性的。' },
                { type: 'heading', text: '3. Increasing vs Decreasing Stack' },
                { type: 'compare', items: [
                    { icon: '📈', title: 'Monotonic Increasing', text: 'Stack values 維持遞增，常用來找下一個更小、左/右更小邊界。', bestFor: 'Histogram、minimum boundary 類題' },
                    { icon: '📉', title: 'Monotonic Decreasing', text: 'Stack values 維持遞減，常用來找下一個更大。', bestFor: 'Daily Temperatures、Next Greater Element' }
                ]},
                { type: 'heading', text: '4. 題型訊號' },
                { type: 'bullet', text: 'Next Greater / Next Smaller。' },
                { type: 'bullet', text: '每個元素問「左/右第一個比我大/小」。' },
                { type: 'bullet', text: 'Largest Rectangle in Histogram、Stock Span 類邊界題。' },
                { type: 'callout', text: 'Monotonic Stack 的本質是：把「還沒找到答案的候選」依單調關係壓在 Stack 裡，新元素一來就批量淘汰/解答。' }
            ],
            quiz: [
                { id: 'a17-q1', type: 'choice', question: 'Daily Temperatures 的 Stack 通常存？', options: ['Index', '只有布林值', 'Database row', 'Graph edge only'], answer: 0, explanation: '需要計算距離，因此保存 index。' },
                { id: 'a17-q2', type: 'choice', question: '每個元素最多 push/pop 各一次，因此整體？', options: ['O(n)', 'O(n²) 一定', 'O(2^n)', 'O(1)'], answer: 0, explanation: '攤銷總操作次數為線性。' },
                { id: 'a17-q3', type: 'choice', question: 'Next Greater Element 常想到？', options: ['Monotonic Stack', 'Union-Find only', 'Trie only', 'DP table 一定'], answer: 0, explanation: '典型單調 Stack 題型。' },
                { id: 'a17-q4', type: 'choice', question: 'Daily Temperatures 遇到更高溫時對 stack top 做？', options: ['Pop 並填答案', '永遠不動', 'Sort 整個 stack', 'Binary Search DB'], answer: 0, explanation: 'Current 是先前等待中的第一個 warmer day。' },
                { id: 'a17-q5', type: 'fill', question: '填空：保持資料單調增減的 Stack 稱為 _________ Stack。', answerText: 'Monotonic', explanation: 'Monotonic Stack。' }
            ]
        },
        {
            id: 'algo-18',
            title: 'Prefix Sum 與 Difference：大量區間查詢不要每次重算',
            level: '中階',
            duration: '40–55 分鐘',
            summary: '掌握 Prefix Sum、Prefix Hash、2D Prefix 與 Difference Array，理解「預處理一次，查詢很多次」。',
            content: [
                { type: 'slides', title: '同一段資料被查很多次，先做預處理', slides: [
                    { kicker: 'QUERY', title: '每次區間加總都重新 for 很浪費', text: '如果有 100 萬筆資料與 10 萬個 range sum query，每次 O(n) 很快就爆。', visual: 'sum(nums[L:R]) repeated many times' },
                    { kicker: 'PREFIX', title: '先存「到目前為止總和」', text: 'prefix[i] 表示前 i 個元素總和，區間 [L,R] 可用兩個 prefix 相減。', visual: 'range(L,R) = prefix[R+1]-prefix[L]' },
                    { kicker: 'HASH', title: 'Prefix 不只存 Sum', text: '可以存 prefix balance / remainder / frequency state，再用 Hash Map 找符合關係的過去位置。', visual: 'prefix state → dict' },
                    { kicker: 'DIFF', title: '大量區間更新則反過來用 Difference', text: '對 [L,R] 全部 +x，不必每個元素都加，只在 diff[L]+=x、diff[R+1]-=x，最後 prefix 一次還原。', visual: 'range update O(1) → rebuild O(n)' }
                ]},
                { type: 'heading', text: '1. Prefix Sum 基本模板' },
                { type: 'code', text: 'def build_prefix(nums):\n    prefix = [0]\n    for x in nums:\n        prefix.append(prefix[-1] + x)\n    return prefix\n\ndef range_sum(prefix, left, right):\n    return prefix[right + 1] - prefix[left]' },
                { type: 'paragraph', text: '多放一個 `prefix[0]=0` 可以大幅降低邊界判斷。這種「多一格 sentinel」在演算法中非常常見。' },
                { type: 'heading', text: '2. Subarray Sum Equals K：Prefix + Hash' },
                { type: 'code', text: 'def subarray_sum(nums, k):\n    count = 0\n    prefix = 0\n    seen = {0: 1}\n\n    for x in nums:\n        prefix += x\n        count += seen.get(prefix - k, 0)\n        seen[prefix] = seen.get(prefix, 0) + 1\n\n    return count' },
                { type: 'paragraph', text: '若目前 prefix = P，而之前曾出現 prefix = P-k，那兩者之間的 subarray sum 就是 k。這題把 Two Sum 的 `needed = target-current` 思路搬到 Prefix Sum 上。' },
                { type: 'checkpoint', question: '為什麼 `seen` 一開始放 `{0:1}`？', options: ['讓從 index 0 開始、總和剛好 k 的 subarray 也能被計算', '為了排序 dict', '因為 set 不能用', '讓 prefix 永遠為 0'], answer: 0, explanation: '空前綴代表 prefix sum 0 已出現一次。' },
                { type: 'heading', text: '3. Difference Array：大量 Range Update' },
                { type: 'stepper', steps: [
                    { title: 'Update [L,R] +x', text: '只做 diff[L]+=x。' },
                    { title: 'Stop After R', text: '若 R+1 存在，做 diff[R+1]-=x。' },
                    { title: 'Many Updates', text: '所有區間更新都只改兩個邊界。' },
                    { title: 'Rebuild', text: '最後對 diff 做 prefix sum，得到每個位置真正累積值。' }
                ]},
                { type: 'heading', text: '4. 什麼時候想到 Prefix？' },
                { type: 'bullet', text: '很多個區間 Sum/Count Query。' },
                { type: 'bullet', text: 'Continuous subarray 問題，可轉成兩個 prefix state 的差。' },
                { type: 'bullet', text: '2D Matrix rectangle sum 可用 2D Prefix。' },
                { type: 'bullet', text: '大量 Range Update 則考慮 Difference Array。' },
                { type: 'callout', text: 'Prefix Sum 的核心是「把重複工作移到預處理」，讓後續每次 Query 從 O(n) 降到 O(1) 或接近 O(1)。' }
            ],
            quiz: [
                { id: 'a18-q1', type: 'choice', question: 'Prefix Sum 區間 [L,R] 常用？', options: ['prefix[R+1]-prefix[L]', 'prefix[L]+prefix[R] 一定', 'R-L only', 'Binary Search'], answer: 0, explanation: '前 R+1 個總和扣掉前 L 個總和。' },
                { id: 'a18-q2', type: 'choice', question: 'Prefix Array 多放 prefix[0]=0 的主要好處？', options: ['簡化邊界與從 0 開始的區間', '讓時間變 O(0)', '自動排序', '取代 nums'], answer: 0, explanation: 'Sentinel 讓公式一致。' },
                { id: 'a18-q3', type: 'choice', question: '大量區間加值更新常考慮？', options: ['Difference Array', 'Trie', 'Union-Find', 'Heap only'], answer: 0, explanation: 'Difference 可把一次 range update 壓成邊界操作。' },
                { id: 'a18-q4', type: 'choice', question: 'Subarray Sum Equals K 使用 Hash Map 是為了？', options: ['快速查過去 prefix-k 出現幾次', '排序 prefix', '保存 Graph edges', '取代 loop'], answer: 0, explanation: '利用 prefix 差值等於 k。' },
                { id: 'a18-q5', type: 'fill', question: '填空：大量區間查詢常先建立 ______ Sum。', answerText: 'Prefix', explanation: 'Prefix Sum 是核心 pattern。' }
            ]
        },
        {
            id: 'algo-19',
            title: 'Bit Manipulation：XOR、Mask 與二進位狀態',
            level: '進階入門',
            duration: '40–55 分鐘',
            summary: '建立 AND/OR/XOR/Shift 的直覺，理解 Single Number、Bit Mask、Power of Two 與狀態壓縮。',
            content: [
                { type: 'slides', title: 'Bit 題不是魔法，先記四個基本操作', slides: [
                    { kicker: 'AND &', title: 'AND：兩邊都是 1 才是 1', text: '常用來檢查某個 bit 是否開啟，或用 mask 清掉不需要的位置。', visual: '1101 & 0100 = 0100' },
                    { kicker: 'OR |', title: 'OR：至少一邊 1 就是 1', text: '常用來把某個 flag 打開。', visual: '1000 | 0010 = 1010' },
                    { kicker: 'XOR ^', title: 'XOR：相同為 0，不同為 1', text: '`x ^ x = 0`、`x ^ 0 = x`，所以很適合找成對消失後剩下的值。', visual: '5 ^ 5 ^ 7 = 7' },
                    { kicker: 'SHIFT', title: 'Shift：移動 bit 位置', text: '`1 << k` 會產生只有第 k bit 為 1 的 mask。', visual: '1 << 3 = 1000₂' }
                ]},
                { type: 'heading', text: '1. Single Number' },
                { type: 'code', text: 'def single_number(nums):\n    result = 0\n    for x in nums:\n        result ^= x\n    return result' },
                { type: 'paragraph', text: '因為 XOR 具交換/結合性，所有成對值最後都互相抵消成 0，只剩單獨那個數。時間 O(n)、額外空間 O(1)。' },
                { type: 'heading', text: '2. Check / Set / Clear Bit' },
                { type: 'code', text: 'def is_set(value, k):\n    return (value & (1 << k)) != 0\n\ndef set_bit(value, k):\n    return value | (1 << k)\n\ndef clear_bit(value, k):\n    return value & ~(1 << k)' },
                { type: 'checkpoint', question: '`x ^ x` 的結果是？', options: ['0', 'x', '1', '-1 一定'], answer: 0, explanation: '每個 bit 和自己 XOR 都是 0。' },
                { type: 'heading', text: '3. Power of Two 經典技巧' },
                { type: 'code', text: 'def is_power_of_two(n):\n    return n > 0 and (n & (n - 1)) == 0' },
                { type: 'paragraph', text: '2 的次方二進位只有一個 1，例如 8=1000；n-1 會變成 0111，兩者 AND 為 0。這個技巧也常用來「移除最低位的 1」。' },
                { type: 'heading', text: '4. Bit Mask 當成小型 Set' },
                { type: 'paragraph', text: '如果狀態數很小，例如 20 個技能是否選擇，可以用 integer 的每個 bit 表示布林狀態。這是 Bitmask DP / Subset Enumeration 的基礎。' },
                { type: 'stepper', steps: [
                    { title: 'Represent', text: '第 k bit = 1 表示第 k 個元素被選中。' },
                    { title: 'Check', text: '`mask & (1 << k)` 檢查是否選中。' },
                    { title: 'Add', text: '`mask | (1 << k)` 加入元素。' },
                    { title: 'Enumerate', text: '從 0 到 `(1<<n)-1` 可以枚舉所有 subsets，總共 2^n 個。' }
                ]},
                { type: 'callout', text: 'Bit Manipulation 在一般業務程式不一定天天寫，但面試與系統底層很常見。先把 mask 當「超精簡 boolean set」就容易理解。' }
            ],
            quiz: [
                { id: 'a19-q1', type: 'choice', question: '`x ^ x` 等於？', options: ['0', 'x', '2x', '1'], answer: 0, explanation: '相同 bits XOR 為 0。' },
                { id: 'a19-q2', type: 'choice', question: '`1 << k` 常用來？', options: ['建立第 k bit mask', '排序 list', '建立 Graph', '做 SQL Join'], answer: 0, explanation: '左移 k 位產生對應 bit mask。' },
                { id: 'a19-q3', type: 'choice', question: '檢查第 k bit 是否為 1 常用？', options: ['value & (1 << k)', 'value + k only', 'value.sort()', 'heapq'], answer: 0, explanation: 'AND mask 可檢查該 bit。' },
                { id: 'a19-q4', type: 'choice', question: '`n & (n-1)` 對 2 的次方會？', options: ['等於 0', '一定等於 n', '一定等於 1', '無法計算'], answer: 0, explanation: '唯一的 1 被清除。' },
                { id: 'a19-q5', type: 'fill', question: '填空：相同為 0、不同為 1 的 bit operation 是 ___。', answerText: 'XOR', explanation: 'XOR 是 exclusive OR。' }
            ]
        },
        {
            id: 'algo-20',
            title: 'Advanced DP：Knapsack、Coin Change 與 LCS',
            level: '進階',
            duration: '60–80 分鐘',
            summary: '把第 14 章 DP 四步法推進到 0/1 Knapsack、完全背包、Coin Change 與 Longest Common Subsequence。',
            content: [
                { type: 'slides', title: '進階 DP 的關鍵：多一個維度代表多一個決策條件', slides: [
                    { kicker: 'KNAPSACK', title: '物品 + 容量', text: 'State 不再只有 i，而可能是 `dp[i][capacity]`：看前 i 個物品、容量為 c 時的最佳值。', visual: 'item index × capacity' },
                    { kicker: 'CHOICE', title: '每個物品：選或不選', text: '0/1 Knapsack 每件最多一次，因此 transition 比較 skip 與 take。', visual: 'dp[i][c] = max(skip, take)' },
                    { kicker: 'COIN', title: '完全背包允許同一元素重複', text: 'Coin Change 中一個 coin 可以使用多次，loop order 與 transition 會和 0/1 Knapsack 不同。', visual: 'dp[a] = min(dp[a], dp[a-coin]+1)' },
                    { kicker: 'LCS', title: '兩個序列就常出現 2D State', text: '`dp[i][j]` 表示 text1 前 i 個字元與 text2 前 j 個字元的 LCS 長度。', visual: 'text1 index × text2 index' }
                ]},
                { type: 'heading', text: '1. 0/1 Knapsack' },
                { type: 'code', text: 'def knapsack(weights, values, capacity):\n    dp = [0] * (capacity + 1)\n\n    for w, v in zip(weights, values):\n        for c in range(capacity, w - 1, -1):\n            dp[c] = max(dp[c], dp[c - w] + v)\n\n    return dp[capacity]' },
                { type: 'paragraph', text: '為什麼 capacity 要倒著走？因為同一輪處理一件物品時，如果正著走，剛更新的 dp 會被後面再次使用，等於同一件物品被拿多次，就變成完全背包。' },
                { type: 'checkpoint', question: '0/1 Knapsack 使用一維 dp 時 capacity 常倒序的理由？', options: ['避免同一物品在同一輪被重複使用', '讓 list 自動排序', '節省所有時間到 O(1)', '因為 Python 規定'], answer: 0, explanation: '倒序確保 transition 使用的是上一輪物品狀態。' },
                { type: 'heading', text: '2. Coin Change（最少硬幣）' },
                { type: 'code', text: 'def coin_change(coins, amount):\n    INF = amount + 1\n    dp = [INF] * (amount + 1)\n    dp[0] = 0\n\n    for current in range(1, amount + 1):\n        for coin in coins:\n            if coin <= current:\n                dp[current] = min(dp[current], dp[current - coin] + 1)\n\n    return -1 if dp[amount] == INF else dp[amount]' },
                { type: 'paragraph', text: 'State：`dp[a] = 組成金額 a 的最少硬幣數`。Transition：最後一枚若是 coin，前面只需解 `a-coin`。這仍是第 14 章的 State → Transition → Base Case。' },
                { type: 'heading', text: '3. Longest Common Subsequence' },
                { type: 'code', text: 'def lcs(a, b):\n    m, n = len(a), len(b)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if a[i - 1] == b[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1] + 1\n            else:\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\n\n    return dp[m][n]' },
                { type: 'stepper', steps: [
                    { title: 'Define State', text: '`dp[i][j]` = a 前 i 個字元與 b 前 j 個字元的 LCS 長度。' },
                    { title: 'Same Char', text: '若最後字元相同，答案接在 `dp[i-1][j-1]` 後面 +1。' },
                    { title: 'Different Char', text: '至少捨棄其中一邊最後字元，取 `max(dp[i-1][j], dp[i][j-1])`。' },
                    { title: 'Base', text: '任何字串和空字串的 LCS 長度都是 0。' }
                ]},
                { type: 'heading', text: '4. DP 題真正要練的是分類' },
                { type: 'compare', items: [
                    { icon: '🎒', title: 'Knapsack Family', text: '物品是否選擇 + 容量/限制。', bestFor: 'subset sum、partition、resource allocation' },
                    { icon: '🪙', title: 'Coin / Complete Knapsack', text: '同一選項可重複使用，問最少、方法數或是否可達。', bestFor: 'coin change、combination counts' },
                    { icon: '🔤', title: 'Sequence DP', text: '兩個 index 表示兩段 prefix 狀態。', bestFor: 'LCS、Edit Distance' }
                ]},
                { type: 'heading', text: '5. 到第 20 章，你應該怎麼看陌生題？' },
                { type: 'bullet', text: '先問資料結構：Array、Linked List、Tree、Graph、Intervals？' },
                { type: 'bullet', text: '再問搜尋方式：一次掃描、Hash、Two Pointers、Binary Search、BFS/DFS、Heap？' },
                { type: 'bullet', text: '若有重複子問題與最佳化目標，再問 DP State 能不能有限描述過去。' },
                { type: 'bullet', text: '如果想 Greedy，要能說明為什麼局部選擇安全；說不出來就不能只靠直覺。' },
                { type: 'callout', text: '演算法前 20 章的目標不是讓你背 20 個模板，而是建立 Pattern Recognition：問題結構 → 可利用的性質 → 資料結構 → 複雜度 → 正確性理由。' }
            ],
            quiz: [
                { id: 'a20-q1', type: 'choice', question: '0/1 Knapsack 一維 dp capacity 倒序的主要原因？', options: ['避免同一物品重複使用', '讓數字變大', '避免 Hash', '因為 Heap 要求'], answer: 0, explanation: '正序可能在同一輪重用剛更新的 state。' },
                { id: 'a20-q2', type: 'choice', question: 'Coin Change 的 `dp[a]` 可以定義成？', options: ['組成金額 a 的最少硬幣數', '固定等於 a', 'Graph node 數', 'Heap root'], answer: 0, explanation: '清楚 state 定義才能推 transition。' },
                { id: 'a20-q3', type: 'choice', question: 'LCS 常用幾維 DP？', options: ['2D，因為要追兩個字串 prefix', '永遠 0D', '只能 3D', '不需要 state'], answer: 0, explanation: 'State 通常由兩個 index 組成。' },
                { id: 'a20-q4', type: 'choice', question: 'DP 解題第一步仍然應該？', options: ['明確定義 State', '先複製模板', '先建立 Trie', '先用 Greedy'], answer: 0, explanation: '進階 DP 仍然遵循 State → Transition → Base。' },
                { id: 'a20-q5', type: 'fill', question: '填空：Longest Common Subsequence 常縮寫為 ___。', answerText: 'LCS', explanation: 'LCS = Longest Common Subsequence。' }
            ]
        }
    );
})();