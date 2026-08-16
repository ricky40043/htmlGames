(() => {
    const course = (window.SOFTWARE_LEARNING_COURSES || []).find(item => item.id === 'algorithm-python');
    if (!course) return;

    course.lessons.push(
        {
            id: 'algo-06',
            title: 'Linked List：不是找 Index，而是改變 Node 的連線',
            level: '中階',
            duration: '30–40 分鐘',
            summary: '理解 Linked List 的 Node/next、O(1) 插入與 O(n) 尋找，並實作 Reverse Linked List 與 Fast/Slow Pointer Cycle Detection。',
            content: [
                { type: 'slides', title: 'List 與 Linked List 的思考方式完全不同', slides: [
                    { kicker: 'ARRAY / LIST', title: 'Python list 擅長依 index 直接定位', text: 'list[500] 能快速取得元素，因為底層是連續/可直接定位的陣列式結構。中間插入通常需要搬移後方元素。', visual: '[10][20][30][40]<br> index: 0　1　2　3' },
                    { kicker: 'LINKED LIST', title: 'Node 只知道「下一個是誰」', text: 'Linked List 節點散落在記憶體，每個 Node 保存 value 與 next reference。要找第 500 個，必須從 head 一路走。', visual: '[10|•] → [20|•] → [30|•] → None' },
                    { kicker: 'INSERT', title: '知道位置後，改 pointer 可以是 O(1)', text: '如果你已經拿到某個 Node，插入新節點只需要調整少量 reference，不必把後面全部搬家。', visual: 'A → B<br>A → NEW → B' },
                    { kicker: 'REVERSAL', title: '反轉就是把每個 next 指回前一個', text: '核心只有三個變數：prev、current、next_node。真正容易錯的是你先改 current.next 後，把原本下一個節點弄丟。', visual: 'None ← A ← B　 C → D<br>　　 prev　cur　next' }
                ]},
                { type: 'heading', text: '1. 最小 Linked List Node' },
                { type: 'code', text: 'class ListNode:\n    def __init__(self, value, next=None):\n        self.value = value\n        self.next = next\n\nhead = ListNode(10, ListNode(20, ListNode(30)))' },
                { type: 'compare', items: [
                    { icon: '📦', title: 'Python list', text: '依 index 讀取通常 O(1)；尾端 append 常見為 amortized O(1)；中間插入/刪除可能需要搬移元素。', bestFor: '大量 index access、一般序列資料' },
                    { icon: '🔗', title: 'Singly Linked List', text: '依序尋找第 k 個為 O(n)；若已知要操作的 Node/前一個 Node，改 next 可 O(1)。', bestFor: '頻繁 pointer 操作、面試資料結構題' }
                ]},
                { type: 'heading', text: '2. Reverse Linked List：最重要的是先保存 next' },
                { type: 'code', text: 'def reverse_list(head):\n    prev = None\n    current = head\n\n    while current:\n        next_node = current.next   # 1. 先保存原本下一個\n        current.next = prev        # 2. 反轉箭頭\n        prev = current             # 3. prev 前進\n        current = next_node        # 4. current 前進\n\n    return prev' },
                { type: 'stepper', steps: [
                    { title: '保存 next_node', text: '先記住 current.next。這一步漏掉，改箭頭後你就找不到剩餘串列。' },
                    { title: 'current.next = prev', text: '把目前節點箭頭反過來。第一個節點會指向 None。' },
                    { title: 'prev = current', text: '已反轉區域往前擴一格。' },
                    { title: 'current = next_node', text: '移到尚未處理的下一個節點。' },
                    { title: 'current == None', text: '全部處理完，prev 就是新的 head。' }
                ]},
                { type: 'checkpoint', question: 'Reverse Linked List 中，為什麼一定要在 `current.next = prev` 前先保存 `next_node = current.next`？', options: ['否則會失去尚未處理的後半段串列', '因為 Python 不允許修改 next', '因為 prev 必須是 int', '為了排序節點'], answer: 0, explanation: '改 current.next 後，原本向右的 reference 被覆蓋；若沒先保存，就無法繼續走。' },
                { type: 'heading', text: '3. Fast / Slow Pointer：不用 Set 也能找 Cycle' },
                { type: 'paragraph', text: '如果 Linked List 有環，slow 每次走 1 格、fast 每次走 2 格；在有限長的 cycle 中，fast 最終一定會追上 slow。若 fast 先走到 None，代表沒有 cycle。' },
                { type: 'code', text: 'def has_cycle(head):\n    slow = head\n    fast = head\n\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow is fast:\n            return True\n\n    return False' },
                { type: 'slides', title: 'Fast / Slow Pointer 追逐', slides: [
                    { kicker: 'START', title: '兩個都從 Head 開始', text: 'slow 走 1、fast 走 2。', visual: 'S,F<br>A → B → C → D → E<br>　　　　↑　　　↓<br>　　　　G ← F' },
                    { kicker: 'STEP 1', title: 'Fast 逐漸追近', text: '進入環後，兩者都不會離開 cycle；fast 每輪相對 slow 多走 1 格。', visual: 'S at C<br>F at E' },
                    { kicker: 'MEET', title: '有限環中最終相遇', text: '相對位置每次改變 1 格，不可能永遠錯開。', visual: '　　　　S,F<br>... → D → E → F → G<br>　　　↑　　　　↓' }
                ]},
                { type: 'heading', text: '4. Linked List 題目常見陷阱' },
                { type: 'bullet', text: 'Head 本身可能被刪除或改變時，常用 Dummy Node 簡化邊界。' },
                { type: 'bullet', text: '比較 Node 是否同一物件用 identity 思維，不要只比較 value；兩個不同節點可以有相同值。' },
                { type: 'bullet', text: '先畫箭頭再寫程式。Linked List Bug 通常不是語法問題，而是 reference 更新順序錯。' },
                { type: 'callout', text: 'Linked List 的面試核心不是背 20 題模板，而是能在紙上追蹤「我現在改了哪一條箭頭？舊箭頭還找得到嗎？」' }
            ],
            quiz: [
                { id: 'a06-q1', type: 'choice', question: 'Singly Linked List 要找第 k 個節點，通常時間複雜度？', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2, explanation: '沒有 random access，必須從 head 往後走。' },
                { id: 'a06-q2', type: 'choice', question: 'Reverse Linked List 最先應做哪件事？', options: ['current.next = prev', '保存 current.next', '刪掉 head', '排序節點'], answer: 1, explanation: '必須先保存下一個節點，避免失去後半段。' },
                { id: 'a06-q3', type: 'choice', question: 'Cycle Detection 中 Fast Pointer 一般每輪走幾步？', options: ['0', '1', '2', 'n'], answer: 2, explanation: '經典 Floyd Cycle Detection：slow 1、fast 2。' },
                { id: 'a06-q4', type: 'choice', question: '知道某個節點與其前後 reference 後，單純改 next 連線通常是？', options: ['O(1)', 'O(n)', 'O(n log n)', '一定 O(n²)'], answer: 0, explanation: '固定次數 pointer assignment 是 O(1)。' },
                { id: 'a06-q5', type: 'fill', question: '填空：反轉串列常用三個變數 prev、current、next_____。', answerText: 'node', explanation: 'next_node 用來保存尚未處理的下一個節點。' }
            ]
        },
        {
            id: 'algo-07',
            title: 'Recursion 與 Backtracking：Choose → Explore → Unchoose',
            level: '中階',
            duration: '35–45 分鐘',
            summary: '理解遞迴的 Base Case / Call Stack，並用 Subsets 與 Permutations 學會 Backtracking 搜尋樹、狀態回復與剪枝。',
            content: [
                { type: 'slides', title: 'Recursion 不是「函式自己叫自己」這麼簡單', slides: [
                    { kicker: 'STATE', title: '每一次呼叫都有自己的區域狀態', text: '參數、local variables、return address 都會形成新的 stack frame。上一層會停在呼叫點，等待下一層回傳。', visual: 'solve(3)<br>└─ solve(2)<br>　└─ solve(1)<br>　　└─ solve(0)' },
                    { kicker: 'BASE CASE', title: 'Base Case 決定什麼時候停止展開', text: '沒有能抵達的 base case，就會不停建立新的 stack frame，直到超過 recursion limit / stack capacity。', visual: 'n == 0 → return 1 ✅' },
                    { kicker: 'BACKTRACK', title: 'Backtracking 是「試一條路，回來，再試下一條」', text: '它把所有候選決策形成搜尋樹；進入下一層前做選擇，回來後撤銷選擇。', visual: '　　　　[]<br>　　/　　　\\<br>　[1]　　　[]<br> /　\\　　 /　\\' },
                    { kicker: 'PRUNE', title: '能提早知道不可能，就不要繼續搜', text: 'Pruning 是 Backtracking 真正的效能關鍵之一。條件越早檢查，越多無效子樹可以整棵跳過。', visual: 'valid? ❌ → prune entire branch' }
                ]},
                { type: 'heading', text: '1. Recursion 的四個問題' },
                { type: 'stepper', steps: [
                    { title: 'Function State 是什麼？', text: '每層需要知道哪些參數？例如 index、remaining、path、current node。' },
                    { title: 'Base Case 是什麼？', text: '何時代表答案完成，或何時不必再往下？' },
                    { title: 'Recursive Step 怎麼縮小問題？', text: '下一層一定要更接近 base case，例如 index + 1、tree child、remaining - value。' },
                    { title: '回傳值 / Side Effect 是什麼？', text: '有些 recursion 回傳答案；Backtracking 常把 path 加入 result，再回復 path。' }
                ]},
                { type: 'code', text: 'def factorial(n):\n    if n <= 1:          # base case\n        return 1\n    return n * factorial(n - 1)' },
                { type: 'heading', text: '2. Subsets：每個元素只有「選 / 不選」兩條路' },
                { type: 'code', text: 'def subsets(nums):\n    result = []\n    path = []\n\n    def dfs(index):\n        if index == len(nums):\n            result.append(path.copy())\n            return\n\n        # 選 nums[index]\n        path.append(nums[index])\n        dfs(index + 1)\n        path.pop()\n\n        # 不選 nums[index]\n        dfs(index + 1)\n\n    dfs(0)\n    return result' },
                { type: 'checkpoint', question: '為什麼 `result.append(path.copy())` 不能直接寫 `result.append(path)`？', options: ['因為 path 之後還會被 append/pop 修改，所有結果可能指向同一個 list', '因為 copy 會排序', '因為 list 不能 append', '因為 recursion 不支援 list'], answer: 0, explanation: 'Backtracking 重複修改同一個 path，保存答案時要保存當下快照。' },
                { type: 'heading', text: '3. Backtracking 的共通骨架' },
                { type: 'code', text: 'def backtrack(state):\n    if is_solution(state):\n        save_answer(state)\n        return\n\n    for choice in choices(state):\n        if not valid(choice, state):\n            continue          # prune\n\n        apply(choice)         # choose\n        backtrack(state)      # explore\n        undo(choice)          # unchoose' },
                { type: 'heading', text: '4. Permutations 與 Subsets 的差異' },
                { type: 'compare', items: [
                    { icon: '🌿', title: 'Subsets', text: '每個元素通常考慮選或不選，結果數量約 2^n。', bestFor: '所有子集合、include/exclude 題型' },
                    { icon: '🔀', title: 'Permutations', text: '每一層從「尚未使用的元素」選下一個，結果數量約 n!。', bestFor: '所有排列、順序重要' }
                ]},
                { type: 'heading', text: '5. 看到什麼關鍵字想到 Backtracking？' },
                { type: 'bullet', text: '列出所有 combinations / permutations / subsets。' },
                { type: 'bullet', text: '在多個選擇間搜尋可行解，例如 N-Queens、Sudoku、word search。' },
                { type: 'bullet', text: '問題可以形成「決策樹」，而且做錯選擇後可以回復狀態。' },
                { type: 'callout', text: 'Backtracking 最容易寫錯的不是 recursion，而是「狀態沒有 undo」。請養成固定節奏：Choose → Explore → Unchoose。' }
            ],
            quiz: [
                { id: 'a07-q1', type: 'choice', question: 'Recursion 最重要的停止條件稱為？', options: ['Base Case', 'Shard Key', 'Cache Hit', 'Token Bucket'], answer: 0, explanation: 'Base Case 定義何時不再遞迴。' },
                { id: 'a07-q2', type: 'choice', question: 'Backtracking 中 `path.pop()` 最主要扮演？', options: ['Choose', 'Explore', 'Unchoose / Restore State', 'Sort'], answer: 2, explanation: '回到上一層前要撤銷本層選擇。' },
                { id: 'a07-q3', type: 'choice', question: 'n 個元素的所有 subsets 數量級約為？', options: ['n', 'log n', '2^n', 'n² 一定'], answer: 2, explanation: '每個元素選/不選，總共 2^n 組合。' },
                { id: 'a07-q4', type: 'choice', question: 'Pruning 的目的？', options: ['提早排除不可能分支，避免繼續搜尋整棵子樹', '讓 recursion 無限執行', '把 list 變成 dict', '增加答案數'], answer: 0, explanation: '剪枝可以大幅減少無效搜尋。' },
                { id: 'a07-q5', type: 'fill', question: '填空：Backtracking 常見節奏是 Choose → Explore → ________。', answerText: 'Unchoose', explanation: '探索完要撤銷選擇並恢復狀態。' }
            ]
        },
        {
            id: 'algo-08',
            title: 'Tree Traversal：DFS、BFS 與 Recursion 真正連起來',
            level: '中階',
            duration: '35–45 分鐘',
            summary: '建立 Binary Tree 的結構直覺，學會 Preorder/Inorder/Postorder、BFS Level Order，以及 DFS/BFS 的空間複雜度。',
            content: [
                { type: 'slides', title: 'Tree 題其實是「每個 Node 都做一樣的事」', slides: [
                    { kicker: 'STRUCTURE', title: 'Tree 是遞迴資料結構', text: '一個 Tree Node 的 left/right 本身又是 Tree。這也是 recursion 在樹題中特別自然的原因。', visual: '　　　8<br>　　/　\\<br>　 4　　12<br>　/ \\　/ \\' },
                    { kicker: 'DFS', title: 'Depth First：先一路走到底', text: 'Preorder / Inorder / Postorder 的差別，主要只是「處理 current node」放在 left/right recursion 的前、中、後。', visual: 'Pre: Root → Left → Right<br>In: Left → Root → Right<br>Post: Left → Right → Root' },
                    { kicker: 'BFS', title: 'Breadth First：一層一層走', text: 'BFS 使用 Queue。先進去的節點先展開，天然適合 Level Order、最少步數（無權圖）等問題。', visual: 'Level 0: [8]<br>Level 1: [4, 12]<br>Level 2: [2, 6, 10, 14]' },
                    { kicker: 'CHOICE', title: 'DFS 與 BFS 沒有誰永遠比較好', text: '要看題目需要深度、路徑、全部遍歷，還是層級 / 最短步數。', visual: 'DFS → Stack / Recursion<br>BFS → Queue / deque' }
                ]},
                { type: 'heading', text: '1. Binary Tree Node' },
                { type: 'code', text: 'class TreeNode:\n    def __init__(self, value, left=None, right=None):\n        self.value = value\n        self.left = left\n        self.right = right' },
                { type: 'heading', text: '2. DFS 三種 Traversal 只差「處理時機」' },
                { type: 'stepper', steps: [
                    { title: 'Preorder', text: 'Root → Left → Right。先處理自己，再進子樹。常用於複製樹、序列化思考。', code: 'visit(node)\ndfs(node.left)\ndfs(node.right)' },
                    { title: 'Inorder', text: 'Left → Root → Right。對 Binary Search Tree 會得到遞增順序。', code: 'dfs(node.left)\nvisit(node)\ndfs(node.right)' },
                    { title: 'Postorder', text: 'Left → Right → Root。先取得子問題結果，再處理父節點，常見於計算高度、刪除、bottom-up DP。', code: 'dfs(node.left)\ndfs(node.right)\nvisit(node)' }
                ]},
                { type: 'code', text: 'def max_depth(root):\n    if root is None:\n        return 0\n\n    left_depth = max_depth(root.left)\n    right_depth = max_depth(root.right)\n    return 1 + max(left_depth, right_depth)' },
                { type: 'checkpoint', question: '`max_depth` 為什麼很適合 Postorder 思維？', options: ['父節點要先知道左右子樹深度，才能算自己的深度', '因為 Tree 一定排序', '因為 BFS 不能用 Queue', '因為 Python 只支援 Postorder'], answer: 0, explanation: '父節點依賴左右子樹回傳值，所以先算 children 再算 root。' },
                { type: 'heading', text: '3. BFS：Python 用 deque，不要一直 list.pop(0)' },
                { type: 'code', text: 'from collections import deque\n\ndef level_order(root):\n    if root is None:\n        return []\n\n    queue = deque([root])\n    result = []\n\n    while queue:\n        level = []\n        for _ in range(len(queue)):\n            node = queue.popleft()\n            level.append(node.value)\n            if node.left:\n                queue.append(node.left)\n            if node.right:\n                queue.append(node.right)\n        result.append(level)\n\n    return result' },
                { type: 'paragraph', text: 'Python 官方建議 Queue 使用 collections.deque，因為頭尾 append/pop 都適合 Queue 操作；list.pop(0) 需要搬移後方元素。' },
                { type: 'heading', text: '4. DFS / BFS 的 Space 怎麼看？' },
                { type: 'compare', items: [
                    { icon: '⬇️', title: 'DFS', text: 'Recursion stack / explicit stack 最大通常與樹高度 h 有關。平衡樹 h≈log n；極度歪斜可到 n。', bestFor: '路徑、子樹、bottom-up、深度問題' },
                    { icon: '➡️', title: 'BFS', text: 'Queue 最大與某一層寬度有關；完整二元樹最後一層可能接近 n/2。', bestFor: 'Level、最近距離、逐層處理' }
                ]},
                { type: 'heading', text: '5. Tree 題的固定拆法' },
                { type: 'bullet', text: '先定義「對一個 node，我要得到什麼答案？」' },
                { type: 'bullet', text: '如果父節點需要 child 的回傳值，通常是 bottom-up recursion。' },
                { type: 'bullet', text: '如果要攜帶 path / accumulated state 往下走，通常是 top-down DFS。' },
                { type: 'bullet', text: '如果題目出現 level、minimum steps、nearest，優先思考 BFS。' },
                { type: 'callout', text: 'Tree 題真正的突破點，是把「整棵樹很複雜」改成「假設左右子樹已經會算，我這個 node 要怎麼合併答案？」' }
            ],
            quiz: [
                { id: 'a08-q1', type: 'choice', question: 'Inorder Traversal 的順序？', options: ['Root → Left → Right', 'Left → Root → Right', 'Left → Right → Root', 'Right → Root → Left 一定'], answer: 1, explanation: 'Inorder = Left, Root, Right。' },
                { id: 'a08-q2', type: 'choice', question: 'BFS 最常使用哪種資料結構？', options: ['Queue', 'Set only', 'Heap only', 'Linked List only'], answer: 0, explanation: 'BFS 需要 FIFO Queue。' },
                { id: 'a08-q3', type: 'choice', question: 'Python 實作高效率 Queue，常用？', options: ['collections.deque', 'list.pop(0) 永遠最佳', 'tuple.remove', 'set.sort'], answer: 0, explanation: 'deque 適合頭尾 O(1) 級別操作。' },
                { id: 'a08-q4', type: 'choice', question: '計算 Tree Height 時，父節點要先取得左右 child 的高度，較像？', options: ['Postorder / bottom-up', '只看 Root 不看 Child', 'Binary Search', 'Sliding Window'], answer: 0, explanation: '先算 children，再合併成 parent。' },
                { id: 'a08-q5', type: 'fill', question: '填空：BFS 是 Breadth-First Search；DFS 是 ______-First Search。', answerText: 'Depth', explanation: 'DFS = Depth-First Search。' }
            ]
        },
        {
            id: 'algo-09',
            title: 'Heap / Priority Queue：不用每次全部排序，也能一直拿最重要的元素',
            level: '中階',
            duration: '30–40 分鐘',
            summary: '理解 Min-Heap invariant、heapq、heappush/heappop，以及 Top K、K-way Merge 與「維持 k 個候選」的核心技巧。',
            content: [
                { type: 'slides', title: 'Heap 解的是「我只在乎目前最小/最大幾個」', slides: [
                    { kicker: 'SORT', title: '全部排序有時做太多工作', text: '如果 1,000,000 筆資料只要最大的 10 筆，把全部排序成完整順序可能不是最經濟的做法。', visual: '1,000,000 items → full sort → take 10' },
                    { kicker: 'HEAP', title: 'Heap 只維護部分順序', text: 'Min-Heap 保證 root 是最小值，但不保證整個陣列完全排序。這讓 push/pop root 可以保持 O(log n)。', visual: '　　　1<br>　　/　\\<br>　 3　　5<br>　/ \\<br> 8　7' },
                    { kicker: 'TOP K', title: '維持大小 k 的 Min-Heap', text: '要找最大 k 個時，heap 裡只留目前最有希望的 k 個；新元素比 heap[0] 大才取代。', visual: 'stream → heap size k<br>root = 目前 Top K 中最小者' },
                    { kicker: 'PYTHON', title: 'Python heapq 預設是 Min-Heap', text: 'heap[0] 永遠是目前最小元素。處理 Max-Heap 題時，常用負數轉換，或依 Python 版本使用對應 max-heap API。', visual: 'heapq.heappush(heap, value)<br>heapq.heappop(heap)' }
                ]},
                { type: 'heading', text: '1. Heap Invariant' },
                { type: 'paragraph', text: 'Min-Heap 的父節點值 <= 子節點值，因此最小元素一定在 heap[0]。注意：這不代表從左到右整個 list 都已排序。' },
                { type: 'code', text: 'import heapq\n\nheap = []\nheapq.heappush(heap, 5)\nheapq.heappush(heap, 2)\nheapq.heappush(heap, 8)\n\nsmallest = heapq.heappop(heap)  # 2' },
                { type: 'compare', items: [
                    { icon: '↕️', title: '完整排序', text: '一次排序後所有排名都知道，通常 O(n log n)。', bestFor: '之後需要完整有序結果、多次任意排名查詢' },
                    { icon: '⛰️', title: 'Heap', text: '只保證 root 最小/最大，push/pop O(log n)，可避免維護不需要的完整順序。', bestFor: 'Priority Queue、Top K、持續流入資料' }
                ]},
                { type: 'heading', text: '2. Top K Largest：只維持 k 個元素' },
                { type: 'code', text: 'import heapq\n\ndef top_k_largest(nums, k):\n    heap = []\n\n    for num in nums:\n        if len(heap) < k:\n            heapq.heappush(heap, num)\n        elif num > heap[0]:\n            heapq.heapreplace(heap, num)\n\n    return heap' },
                { type: 'stepper', steps: [
                    { title: 'Heap 還沒滿', text: '前 k 個先放進去。' },
                    { title: 'Heap 已滿', text: 'heap[0] 是目前 Top K 中最小那個，也就是最容易被淘汰的人。' },
                    { title: '新值 <= heap[0]', text: '它連目前第 k 大都打不贏，可以直接忽略。' },
                    { title: '新值 > heap[0]', text: '淘汰 root，把新值放進去並恢復 heap invariant。' },
                    { title: 'Complexity', text: '每個元素最多做一次 O(log k) heap 操作，所以約 O(n log k)，額外空間 O(k)。' }
                ]},
                { type: 'checkpoint', question: '找 1000 萬筆資料中的最大 10 筆，為什麼「大小 10 的 Min-Heap」很合理？', options: ['只需維護 10 個候選，時間可約 O(n log 10)', '因為 Heap 一定 O(1) 排完整資料', '因為 Min-Heap root 是最大值', '因為不需要看所有資料'], answer: 0, explanation: '仍需掃過 n 筆，但每次維護成本只和 k 有關。' },
                { type: 'heading', text: '3. Priority Queue 的實務直覺' },
                { type: 'bullet', text: 'Job Scheduler：永遠先拿最高優先工作。' },
                { type: 'bullet', text: 'Dijkstra / A*：永遠先展開目前距離/估價最小的節點。' },
                { type: 'bullet', text: 'Merge K Sorted Lists：Heap 保存每條 list 當前最小頭節點。' },
                { type: 'bullet', text: 'Streaming Top K：資料持續進來也不必保存完整排序。' },
                { type: 'heading', text: '4. 看到什麼題目想到 Heap？' },
                { type: 'bullet', text: '一直問「目前最小 / 最大 / 最優先」的元素。' },
                { type: 'bullet', text: 'Top K、Kth largest/smallest。' },
                { type: 'bullet', text: '多路合併，每一路都有下一個候選。' },
                { type: 'callout', text: 'Heap 的思考方式是「我不需要全部排序，我只需要隨時快速拿到目前最重要的那一個」。' }
            ],
            quiz: [
                { id: 'a09-q1', type: 'choice', question: 'Python `heapq` 預設維護？', options: ['Min-Heap', 'Max-Heap only', '完整排序陣列', 'Hash Table'], answer: 0, explanation: 'heapq 傳統 API 以 min-heap 為核心。' },
                { id: 'a09-q2', type: 'choice', question: 'Min-Heap 的 `heap[0]` 是？', options: ['最小元素', '最大元素', '最後加入元素', '隨機元素'], answer: 0, explanation: 'Min-Heap root 保存最小值。' },
                { id: 'a09-q3', type: 'choice', question: '維持大小 k 的 Heap 找 Top K，整體常見時間複雜度？', options: ['O(n log k)', 'O(k^n)', 'O(1)', '永遠 O(n²)'], answer: 0, explanation: '掃 n 個元素，每次 heap 操作最多 O(log k)。' },
                { id: 'a09-q4', type: 'choice', question: 'Heap 與完整排序最大的概念差異？', options: ['Heap 只維持必要的部分順序，不保證全部元素完全有序', 'Heap 完全不能比較', '排序沒有任何順序', '兩者完全相同'], answer: 0, explanation: 'Heap invariant 只保證父子關係與 root 優先性。' },
                { id: 'a09-q5', type: 'fill', question: '填空：Python 從 Min-Heap 取出最小元素常用 heapq.heap____(heap)。', answerText: 'pop', explanation: '函式名稱是 heapq.heappop。' }
            ]
        },
        {
            id: 'algo-10',
            title: 'Graph：DFS / BFS、Visited 與最短步數',
            level: '中階',
            duration: '40–50 分鐘',
            summary: '把 Tree 的 DFS/BFS 延伸到一般 Graph，理解 Adjacency List、Visited、Connected Components 與無權圖最短路徑。',
            content: [
                { type: 'slides', title: 'Graph 比 Tree 多出來的最大麻煩：你可能繞回原點', slides: [
                    { kicker: 'TREE', title: 'Tree 沒有 Cycle，而且每個 child 通常只有一個 parent', text: '從 root 往下走時，不太需要擔心 A→B→C→A 無限繞圈。', visual: 'A<br>├─ B<br>└─ C' },
                    { kicker: 'GRAPH', title: 'Graph 可以任意連線，也可能有 Cycle', text: '朋友關係、道路、服務依賴、網路拓撲都不是單純樹狀。', visual: 'A ─ B<br>| ╲ |<br>C ─ D' },
                    { kicker: 'VISITED', title: 'Visited 是避免重複與無限循環的核心', text: '第一次看到 Node 就標記，之後再遇到直接跳過。若忘記 visited，有 cycle 的 graph 可能永遠跑不完。', visual: 'visited = {A, B, C}' },
                    { kicker: 'BFS SHORTEST', title: '無權圖的最少邊數路徑用 BFS', text: 'BFS 一層一層展開，因此第一次到達 target 時，走過的 edge 數最少。', visual: 'distance 0: A<br>distance 1: B,C<br>distance 2: D,E,F' }
                ]},
                { type: 'heading', text: '1. Adjacency List：最常見 Graph 表示法' },
                { type: 'code', text: 'graph = {\n    "A": ["B", "C"],\n    "B": ["A", "D"],\n    "C": ["A", "D"],\n    "D": ["B", "C"]\n}' },
                { type: 'paragraph', text: 'Adjacency List 對稀疏圖很自然：每個 node 只保存自己有哪些 neighbors。若 V 是節點數、E 是邊數，完整 DFS/BFS 通常是 O(V + E)。' },
                { type: 'heading', text: '2. DFS：一路深入，再回頭' },
                { type: 'code', text: 'def dfs(graph, start):\n    visited = set()\n\n    def walk(node):\n        if node in visited:\n            return\n        visited.add(node)\n\n        for neighbor in graph[node]:\n            walk(neighbor)\n\n    walk(start)\n    return visited' },
                { type: 'heading', text: '3. BFS：Queue 一層一層展開' },
                { type: 'code', text: 'from collections import deque\n\ndef shortest_steps(graph, start, target):\n    queue = deque([(start, 0)])\n    visited = {start}\n\n    while queue:\n        node, distance = queue.popleft()\n        if node == target:\n            return distance\n\n        for neighbor in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append((neighbor, distance + 1))\n\n    return -1' },
                { type: 'checkpoint', question: '為什麼 BFS 在「每條邊成本相同」的 Graph 中，第一次到 target 就是最少 edge 數？', options: ['BFS 按距離 0、1、2、3 層級依序展開', '因為 set 會排序', '因為 DFS 不能用 recursion', '因為 Graph 沒有 cycle'], answer: 0, explanation: 'BFS 先處理所有距離 d 的節點，才會進入 d+1。' },
                { type: 'heading', text: '4. Visited 什麼時候標記？' },
                { type: 'paragraph', text: 'BFS 常在「enqueue 時」就放進 visited，而不是等 dequeue 才標記。否則同一個 node 可能被多個 parent 重複加入 queue，雖然最後仍可能得到答案，但會增加大量重複工作。' },
                { type: 'stepper', steps: [
                    { title: 'Start', text: '把 start 放進 queue，並立即 visited.add(start)。' },
                    { title: 'Pop', text: '從 queue 左側取一個 node。' },
                    { title: 'Inspect Neighbors', text: '查看所有相鄰節點。' },
                    { title: 'Mark Before Enqueue', text: '第一次看到 neighbor 時先標 visited，再 enqueue。' },
                    { title: 'Repeat', text: '直到找到 target 或 queue 清空。' }
                ]},
                { type: 'heading', text: '5. Connected Components：不是所有 Node 都互相到得了' },
                { type: 'code', text: 'def count_components(graph):\n    visited = set()\n    components = 0\n\n    for node in graph:\n        if node in visited:\n            continue\n        components += 1\n        dfs_from(node, graph, visited)\n\n    return components' },
                { type: 'compare', items: [
                    { icon: '⬇️', title: 'DFS', text: 'Recursion / Stack，適合走完整 component、path search、cycle detection、topological 類題型。', bestFor: '深度探索、遞迴結構、完整 component' },
                    { icon: '➡️', title: 'BFS', text: 'Queue，天然按層級/距離展開。', bestFor: '無權圖最短步數、nearest、level expansion' }
                ]},
                { type: 'heading', text: '6. Graph 題型辨識' },
                { type: 'bullet', text: 'Grid 迷宮也可以視為 Graph：每個 cell 是 node，上下左右是 edges。' },
                { type: 'bullet', text: '社群關係、航班、網路連線、課程 prerequisite、服務依賴都是 Graph。' },
                { type: 'bullet', text: '有權重最短路徑不能直接把 BFS 當萬用答案；後續可再學 Dijkstra、Bellman-Ford 等。' },
                { type: 'callout', text: '做到 Graph，你前面的 Stack/Queue、Recursion、Tree、Heap 都開始串起來了。真正的演算法學習不是每章獨立，而是看到新題時知道該組合哪些工具。' }
            ],
            quiz: [
                { id: 'a10-q1', type: 'choice', question: 'Graph traversal 中 `visited` 最主要目的？', options: ['避免重複走訪與 cycle 無限循環', '讓資料排序', '增加節點數', '取代 Queue'], answer: 0, explanation: 'Graph 可能有 cycle，同一節點也可能有多條路到達。' },
                { id: 'a10-q2', type: 'choice', question: '無權 Graph 找最少 edge 數路徑，通常優先用？', options: ['BFS', 'Selection Sort', 'Two Sum', 'Heap Sort 一定'], answer: 0, explanation: 'BFS 按距離層級展開。' },
                { id: 'a10-q3', type: 'choice', question: '完整 DFS/BFS 遍歷 Adjacency List Graph 的常見時間複雜度？', options: ['O(V + E)', 'O(1)', 'O(V^E) 一定', 'O(log V) 一定'], answer: 0, explanation: '每個 vertex 與 edge 在正常遍歷中處理有限次。' },
                { id: 'a10-q4', type: 'choice', question: 'BFS 常在何時把 neighbor 加入 visited？', options: ['Enqueue 時', '整個程式結束後', '永遠不需要', '只在 target 時'], answer: 0, explanation: 'Enqueue 時標記可避免同一節點被重複排入 queue。' },
                { id: 'a10-q5', type: 'fill', question: '填空：Graph 常見的鄰接表英文是 Adjacency ____。', answerText: 'List', explanation: 'Adjacency List 是常見圖表示方式。' }
            ]
        }
    );
})();
