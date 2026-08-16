window.SOFTWARE_QUESTION_SPECS = window.SOFTWARE_QUESTION_SPECS || {};
Object.assign(window.SOFTWARE_QUESTION_SPECS, {
'algo-01':[
['O(1)','輸入規模增加時，工作量大致維持固定','依已知 index 讀取 list 元素或平均情況下 dict key lookup','O(1) 不代表真的只執行一個 CPU instruction',['O(1)','constant']],
['O(log n)','每一步排除固定比例搜尋空間','已排序資料用 Binary Search 每次砍掉一半','沒有排序或單調性時不能直接套用',['O(log n)','Binary Search']],
['O(n)','工作量隨輸入量線性成長','在 list 中搜尋某個值或完整掃描一次','多個連續 O(n) loop 相加仍是 O(n)，不是 O(n²)',['O(n)','linear']],
['O(n²)','兩個維度都可能走完整 n 次','暴力比較所有 pair 或典型雙層巢狀掃描','看到 nested loop 不一定就是 O(n²)，要看總操作次數',['O(n²)','nested loop']],
['Python Container Lookup','list membership 常為 O(n)，set/dict 平均 lookup 常為 O(1)','需要大量 membership test 時選 set 而非 list','Hash 結構有碰撞與額外記憶體成本，不保證 worst-case 永遠 O(1)',['list','set','dict']]
],
'algo-02':[
['Hash Table','用 Hash 把 Key 對應到 Bucket 以快速查找','需要快速記錄已看過的值或 Key→Value 關係','Hash 結構沒有排序語意，且需額外空間',['Hash Table','dict','set']],
['Two Sum Complement','對目前數字 x 計算 target-x 並查是否已出現','希望把暴力 O(n²) Two Sum 改成單次掃描','必須先查 complement 再記錄 current，否則可能誤用同一元素',['needed','complement']],
['Seen Dictionary','保存已出現數字與其 index','Two Sum 需要在找到 complement 時回傳位置','Key 重複時要理解覆蓋 index 是否影響題目需求',['seen','dict']],
['Check Before Insert','先判斷 needed 是否存在，再把 current 放入 seen','避免 target=6、current=3 時把同一個 3 當成兩個元素','若題目允許不同位置的相同值，第二個 3 仍可匹配第一個',['check','insert']],
['Time-Space Trade-off','用 O(n) 額外 Hash 空間換取 O(n) 時間','面試題允許額外記憶體並重視時間','若記憶體受限或資料已排序，可能有其它策略',['O(n)','space trade-off']]
],
'algo-03':[
['Stack LIFO','最後放入的元素最先取出','括號配對、Undo、DFS、Call Stack 等需要回到最近狀態','Stack 不適合需要最早進入元素先處理的情境',['Stack','LIFO']],
['Queue FIFO','最早放入的元素最先取出','BFS、工作排程等需要按到達順序處理','Python 用 list.pop(0) 會搬移元素，常用 deque.popleft()',['Queue','FIFO','deque']],
['Valid Parentheses','遇左括號 Push，遇右括號檢查 Stack Top 是否配對','判斷 ()[]{} 等巢狀結構是否合法','最後 Stack 非空也代表有未關閉括號',['Valid Parentheses','括號']],
['Call Stack','函式呼叫會保存返回位置與區域狀態','理解遞迴為何會一層一層回傳','深度太大可能造成 Stack Overflow / RecursionError',['Call Stack','recursion']],
['deque','雙端 Queue，可高效從左右兩端 append/pop','Python BFS 需要頻繁 popleft','deque 不提供像 list 一樣的快速任意 index 存取語意',['deque','popleft']]
],
'algo-04':[
['Two Pointers','用兩個指標共同描述搜尋位置或範圍','排序陣列找 pair、反轉、去重等問題','只有在移動指標能安全排除答案時才成立',['Two Pointers','left','right']],
['Sliding Window','維護一段連續區間，右邊擴張、左邊收縮','substring/subarray 的最長最短與條件維護','若條件不能透過增減端點有效維護，Window 不一定適用',['Sliding Window','window']],
['Sorted Pair Sum','和太小移動 left，和太大移動 right','已排序陣列找兩數和 target','未排序資料不能直接用大小關係排除一側',['sorted','pair sum']],
['Window Invariant','在每一步維持目前 Window 的合法條件','Longest Substring 中保持 Window 內沒有重複字元','若忘記收縮到合法，best 會計入無效區間',['invariant','合法']],
['Amortized Pointer Movement','left/right 都只單向移動，總次數可為 O(n)','for 裡有 while 但每個元素最多進出 Window 有限次','不能只看到兩層語法就直接判定 O(n²)',['amortized','O(n)']]
],
'algo-05':[
['Binary Search Precondition','比較結果必須能安全排除一部分搜尋空間','排序陣列或單調答案空間可做二分','完全無序資料不能靠 mid 推論哪一半不可能',['Binary Search','sorted','monotonic']],
['Closed Interval','搜尋區間定義為 [low, high]，兩端都包含','high 初始化 len(nums)-1，while low<=high','若把不同區間定義混用，最容易產生 off-by-one',['closed interval','low<=high']],
['Mid Exclusion','比較過 mid 且不是答案後，要用 mid+1 或 mid-1 排除它','避免 low=mid 導致相鄰元素時無限迴圈','更新邊界時必須證明被丟掉區域沒有答案',['mid+1','mid-1']],
['Lower Bound','找第一個 >= target 的位置','需要找插入點或重複元素左邊界','不是單純找到任一 target 就結束',['Lower Bound','first']],
['Binary Search on Answer','對具有單調可行性的答案範圍做二分','找最小可行速度、容量、時間等','必須先定義 predicate 並確認單調性',['Binary Search on Answer','predicate']]
],
'algo-06':[
['Linked List Node','每個節點保存 value 與 next 連結','資料透過指標串接而非連續 index','隨機存取第 k 個元素仍需從頭走 O(k)',['Linked List','Node','next']],
['Reverse Linked List','逐步把 current.next 指回 previous','需要原地反轉單向鏈結串列','若先改 next 卻沒保存原 next，剩餘鏈結會遺失',['Reverse','prev','current']],
['Fast Slow Pointer','兩個指標以不同速度前進','找中點或 Cycle Detection','必須確認 fast.next 等邊界避免 None 存取',['Fast Slow','slow','fast']],
['Cycle Detection','Fast 若與 Slow 相遇，代表存在環','判斷 Linked List 是否有 Cycle','Set 法也可做但需要 O(n) 額外空間',['Cycle','Floyd']],
['Dummy Node','在 Head 前放虛擬節點統一邊界操作','刪除頭節點或合併 List 時避免特殊 case','Dummy 本身不是答案資料，回傳時通常取 dummy.next',['Dummy','sentinel']]
],
'algo-07':[
['Recursion','函式呼叫自己處理較小子問題','Tree traversal、Backtracking 等天然遞迴結構','沒有 Base Case 或問題不縮小會無限遞迴',['Recursion','遞迴']],
['Base Case','不再繼續拆解的最小問題答案','遞迴到空節點、index 結尾或完成組合時停止','Base Case 錯誤會造成漏解或無限遞迴',['Base Case','停止']],
['Backtracking','Choose → Explore → Unchoose 搜尋狀態空間','Subsets、Permutations、Combination 等列舉問題','忘記 Unchoose 會污染其它分支狀態',['Backtracking','choose','unchoose']],
['Pruning','提前排除不可能產生有效答案的分支','限制條件可判斷目前路徑已不可能成功','錯誤 Pruning 可能把合法答案一起刪掉',['Pruning','剪枝']],
['Call Stack State','每層遞迴保存自己的區域變數與返回位置','追蹤 DFS/Backtracking 每層決策','大量深度會增加 Stack 記憶體並可能超出 Recursion Limit',['Call Stack','state']]
],
'algo-08':[
['Binary Tree','每個節點最多有 left/right 兩個 Child','建立 Tree traversal 與遞迴基礎','Binary Tree 不等於 Binary Search Tree',['Binary Tree','left','right']],
['DFS Traversal','沿一條分支深入再回頭','Preorder/Inorder/Postorder、Path 問題','Traversal 順序不同代表處理 root 的時機不同',['DFS','Preorder','Inorder','Postorder']],
['BFS Level Order','用 Queue 一層一層處理節點','需要 Level Order、最短層數、每層統計','若用 Stack 會失去按層順序',['BFS','Level Order','Queue']],
['Tree Height','由子樹高度推導目前節點高度','求 Max Depth 等 Bottom-up Tree 問題','Base Case 對空節點高度定義要一致',['Height','Depth']],
['Top-down vs Bottom-up','可把狀態從父節點往下帶，或把子樹答案往上回傳','Path Sum 與 Height 分別適合不同方向','選錯狀態方向會讓參數或回傳值變複雜',['Top-down','Bottom-up']]
],
'algo-09':[
['Min-Heap','Root 永遠是目前最小元素','需要反覆取得最小候選或維護 Top K','Heap 不保證整個陣列完全排序',['Min-Heap','heap[0]']],
['heapq','Python 標準 Min-Heap 操作工具','heappush/heappop 維護 Priority Queue','直接對內部 list 任意修改可能破壞 Heap invariant',['heapq','heappush','heappop']],
['Top K with Heap','維持大小 k 的 Min-Heap 保存目前最大 k 個','n 很大但只需要最大 10 筆','仍需掃過所有 n 筆資料，只是不需完整排序',['Top K','O(n log k)']],
['Priority Queue','依 Priority 而非到達順序取出下一個元素','Scheduler、Dijkstra、K-way Merge','相同 Priority 的穩定順序需額外 tie-breaker',['Priority Queue','priority']],
['Heap vs Full Sort','Heap 只維持必要的局部順序','Streaming Top K 或只反覆取最小值','若最後需要完整有序輸出，完整排序可能更直接',['Heap','Sort']]
],
'algo-10':[
['Adjacency List','每個 Node 保存自己的 Neighbors','稀疏 Graph 常用來表示邊','非常稠密 Graph 有時 Matrix 更直接',['Adjacency List','neighbors']],
['Visited Set','記錄已走訪 Node，避免重複與 Cycle 無限循環','一般 Graph DFS/BFS','BFS 常在 Enqueue 時標記，避免重複排入 Queue',['visited','cycle']],
['Graph DFS','用 Recursion/Stack 深度探索 Graph','Connected Component、Path Search、Cycle 等','有 Cycle 時不能省略 visited/state',['Graph DFS','DFS']],
['Graph BFS','用 Queue 按距離層級展開','無權 Graph 找最少 Edge 數路徑','有不同 Edge Weight 時不能直接當成加權最短路',['Graph BFS','Queue','shortest']],
['O(V+E)','完整遍歷每個 Vertex 與 Edge 有限次','分析 Adjacency List DFS/BFS','不能只看 V 而忽略邊數 E',['V+E','complexity']]
],
'algo-11':[
['Find','沿 parent 指標找到集合代表 Root','判斷兩個元素是否屬於同一 Component','若 Tree 太高而無壓縮，查詢會變慢',['Find','root']],
['Union','把兩個不同 Root 的集合合併','新增一條 Edge 並合併兩個 Component','若已同 Root，Union 不應再次減少 Component 數',['Union','merge']],
['Path Compression','Find 過程把沿途節點直接指向 Root','大量重複 connectivity query','它通常搭配 Union by Rank/Size 才有最佳攤銷效能',['Path Compression','compression']],
['Union by Rank','把較矮/小集合掛到較高/大集合','避免 DSU Tree 退化成長鏈','Rank 不是節點 ID，也不一定等於精確高度',['Rank','Size']],
['Connected Components with DSU','每次成功 Union 兩個不同集合時 Component 數減一','Edge 持續加入並需要統計群組數','若是動態刪 Edge，基本 DSU 不好處理',['Connected Components','DSU']]
],
'algo-12':[
['Trie Node','每個節點代表 Prefix 狀態並連向下一字元','大量字串需要共享前綴結構','字元集合很大時 children 結構會耗記憶體',['Trie','Node']],
['Insert','逐字元走或建立 Child，最後標記終止','把新單字加入 Prefix Tree','只走到最後但沒 end flag 會無法區分完整字與 Prefix',['Insert','end']],
['Search','逐字元走完且最後節點標記為完整單字','判斷某字串是否真的存在','走得到 Prefix 不代表完整 Word 存在',['Search','word']],
['startsWith','只需確認 Prefix 路徑存在','Autocomplete 或 Prefix Query','不需要最後節點是完整單字',['startsWith','prefix']],
['Trie Trade-off','以額外記憶體換取 Prefix 查詢效率','字典、Autocomplete、Prefix Count','如果只有精確 membership，Hash Set 可能更簡單',['Trie','Hash Set','memory']]
],
'algo-13':[
['Non-negative Weight','Dijkstra 要求 Edge Weight 不為負','地圖距離、Latency、Cost 皆非負','負權重會破壞已確定最短距離不再變小的假設',['non-negative','weight']],
['Relaxation','發現經目前 Node 到 Neighbor 更短時更新 dist','dist[u]+w < dist[v] 時改善最佳距離','沒有改善就不應盲目 Push 新候選',['Relaxation','dist']],
['Min-Heap Candidate','每次取目前距離最小的未處理候選','Dijkstra 用 Priority Queue 擴展最近節點','Heap 中可能有舊距離項目，需要 Lazy Skip',['Min-Heap','Dijkstra']],
['Lazy Deletion','Pop 出來若 distance 已不是最新就跳過','Python heapq 不方便 decrease-key，可 Push 新版本','不跳過 stale item 可能造成大量重複工作',['Lazy','stale']],
['BFS vs Dijkstra','無權/等權用 BFS；非負不同權重用 Dijkstra','比較每條 Edge 成本是否相同','不是看到 Graph shortest path 就一律用 Dijkstra',['BFS','Dijkstra']]
],
'algo-14':[
['DP State','明確定義 dp[i] 或 dp[i][j] 代表什麼','開始任何 DP 推導前先描述狀態','State 定義模糊會讓 Transition 失去意義',['State','dp[i]']],
['Transition','描述目前 State 如何由較小 State 推導','Climbing Stairs 用前一階與前兩階答案','不能在依賴尚未計算時直接使用',['Transition','轉移']],
['Base Case','最小 State 的已知答案','dp[0]、dp[1] 等起始值','Base Case 錯一格會讓整張表跟著錯',['Base Case','dp[0]']],
['Memoization vs Tabulation','Top-down Cache 或 Bottom-up Table 消除重複子問題','依遞迴自然度與 State 覆蓋率選擇','兩者時間複雜度常近似，但 Stack/Order 特性不同',['Memoization','Tabulation']],
['House Robber Choice','dp[i]=max(不搶 i, 搶 i + dp[i-2])','每個位置有選或不選且相鄰限制','Greedy 選當下最大房子不保證全域最佳',['House Robber','max']]
],
'algo-15':[
['Greedy Choice','每一步做局部最佳且可證明不破壞全域最佳','Activity Selection 等具有交換論證的問題','看起來合理不代表 Greedy 正確，必須有證明',['Greedy','local optimum']],
['Earliest Finish','Interval Scheduling 每次選最早結束活動','最大化不重疊活動數','選最早開始或最短長度不一定正確',['earliest finish','interval']],
['Merge Intervals','依 start 排序後維護目前合併區間','把重疊區間合併成最少集合','它是排序+掃描，不等於所有 Interval 問題都用同一 Greedy',['Merge Intervals','start']],
['Greedy vs DP','若局部決策不能保證全域最佳，就需保存更多 State','0/1 Knapsack 不適合單靠 value/weight ratio','Fractional Knapsack 與 0/1 Knapsack 不能混為一談',['Greedy','DP','Knapsack']],
['Exchange Argument','證明任何最佳解可把某一步換成 Greedy 選擇而不變差','證明 earliest finish Activity Selection','沒有這類正確性理由就不要只靠直覺',['Exchange Argument','proof']]
],
'algo-16':[
['DAG','Directed Acyclic Graph，沒有有向 Cycle','Prerequisite/Dependency 能形成合法先後順序','只要存在 Cycle 就不可能有完整 Topological Order',['DAG','Cycle']],
['Indegree','某 Node 有多少條進入 Edge','Kahn Algorithm 找目前沒有前置依賴的 Node','Indegree 是方向性概念，Undirected Graph 不同',['Indegree','入度']],
['Kahn Algorithm','把 Indegree=0 Node 放 Queue，逐步移除依賴','Course Schedule 或 Build Order','最後處理 Node 數不足代表存在 Cycle',['Kahn','Queue']],
['DFS Topological Sort','DFS 完成 Node 後加入 Postorder，再 Reverse','已有 DFS 框架且要偵測 Dependency Cycle','必須區分 visiting 與 visited 狀態才能抓 Back Edge',['DFS','Topological']],
['Cycle Detection','若依賴關係形成環，所有相關 Node 都無法降到可執行狀態','判斷是否能完成全部課程','不能只看 Queue 一開始是否非空，需比較最終處理數',['Cycle','Course Schedule']]
],
'algo-17':[
['Monotonic Stack','Stack 內元素維持單調遞增或遞減','Next Greater/Smaller、溫度、柱狀圖等','單調方向取決於你要找 Greater 還是 Smaller',['Monotonic Stack','單調棧']],
['Next Greater Element','當新值打破單調性時，為被 Pop 元素找到下一個更大值','Daily Temperatures 類問題','不是把所有比目前小元素都永久丟掉而不記答案',['Next Greater','Greater']],
['Daily Temperatures','Stack 保存尚未找到更高溫答案的 Index','需要計算距離而非只知道值','保存值而不保存 index 會難以計算天數差',['Daily Temperatures','index']],
['Amortized O(n)','每個元素最多 Push 一次、Pop 一次','雖然 while 在 for 裡，總 Pop 次數仍受 n 限制','不能只看巢狀語法直接判 O(n²)',['amortized','push','pop']],
['Stack Invariant','每次操作後 Stack 仍維持指定單調性','設計 Monotonic Stack 時決定何時 Pop','Invariant 不清楚會導致 Greater/Smaller 方向寫反',['invariant','monotonic']]
],
'algo-18':[
['Prefix Sum','prefix[i] 保存前 i 個元素總和','大量 Range Sum Query','建立成本 O(n)，之後區間和可 O(1) 取得',['Prefix Sum','prefix']],
['Range Sum Formula','sum(l..r)=prefix[r+1]-prefix[l]','查詢任意連續區間總和','Index 定義不同時 r+1 公式也會不同，最怕 off-by-one',['Range Sum','r+1']],
['Prefix Sum + Hash','記錄過去 Prefix 值出現次數','Subarray Sum = K 可用 currentPrefix-K 查詢','只用 Set 會漏掉同一 Prefix 多次出現的計數題',['Hash','Subarray Sum']],
['Difference Array','在 Range 起點加 delta、終點下一格減 delta','大量 Range Update，最後一次 Prefix 還原','適合批次離線更新，不一定適合每次立刻查最新值',['Difference Array','range update']],
['2D Prefix Sum','預計算矩形區域累積值','大量 Matrix Rectangle Sum Query','公式需加回重複扣掉的交集區域',['2D Prefix','matrix']]
],
'algo-19':[
['Bit AND','兩個 bit 都為 1 才得到 1','Mask 檢查某些 Flag 是否同時存在','AND 常用來保留指定 bit，不是切換 bit',['AND','&']],
['Bit OR','任一 bit 為 1 就得到 1','設定 Flag 或合併權限 Mask','OR 會把 bit 設為 1，不適合用來清除 bit',['OR','|']],
['XOR','相同為 0、不同為 1，且 x^x=0','Single Number 中成對元素互相抵消','XOR 不等於一般加法，且不保留進位',['XOR','^']],
['Bit Mask','用整數各 bit 表示多個 Boolean State','Subset 狀態、權限旗標、小型狀態壓縮','State 太多時 2^n 枚舉仍可能爆炸',['Bit Mask','mask']],
['Power of Two Test','正整數 n 若 n&(n-1)==0 則為 2 的冪','快速判斷單一 bit 是否被設置','必須先確認 n>0，因 0 也會讓位元式看似成立',['Power of Two','n-1']]
],
'algo-20':[
['0/1 Knapsack','每個 Item 最多選一次','容量有限、每個物品只能拿或不拿','一維 DP 通常容量要倒序，避免同一 Item 被重複使用',['0/1 Knapsack','倒序']],
['Complete Knapsack','每個 Item 可以重複選多次','Coin Change Combination 等可重複使用物品','Loop Order 不同會影響是否允許同輪重複使用',['Complete Knapsack','正序']],
['Coin Change','以 Amount 作 State 求最少硬幣數或方法數','金額由多種 Coin 組成','最少枚數與方法數是不同 DP 定義，不能混用',['Coin Change','amount']],
['LCS','dp[i][j] 表示兩字串 Prefix 的最長共同子序列','比較序列相對順序但不要求連續','Subsequence 不等於 Substring，不能要求字元連續',['LCS','subsequence']],
['DP Loop Order','一維壓縮時迭代方向決定是否會重用本輪 State','0/1 與 Complete Knapsack 的關鍵差異之一','方向寫反會把 0/1 問題錯做成可重複選',['Loop Order','DP']]
]
});