window.SOFTWARE_QUESTION_SPECS = window.SOFTWARE_QUESTION_SPECS || {};
Object.assign(window.SOFTWARE_QUESTION_SPECS, {
'sd-01':[
['Functional Requirement','系統必須提供的使用者功能與行為','確認短網址是否需要建立、重新導向、刪除與統計','只談功能會漏掉流量、延遲與可用性限制',['功能需求','Functional']],
['Non-functional Requirement','描述 latency、availability、consistency、scale 等品質限制','要求 P95 latency < 200ms、99.99% availability','若沒有量化，架構無法被驗證',['非功能需求','Non-functional','latency']],
['QPS Estimation','用每日 Request 數與尖峰倍率估算吞吐量級','DAU 與每人操作次數已知，需要估平均與尖峰 QPS','估算不能取代壓力測試，且低估尖峰會導致容量不足',['QPS','容量估算']],
['High-level Design','先畫出能工作的 Client、Service、Storage 主幹','需求確認後先建立最小可工作架構','一開始就加入所有分散式元件會造成過度設計',['High-level','最小架構']],
['Trade-off','說清楚一個設計得到什麼、付出什麼','加入 Cache、Queue 或 Sharding 前解釋其必要性','只背技術名詞卻說不出代價，代表沒有真正設計',['Trade-off','取捨']]
],
'sd-02':[
['Scale Up','提升單一主機 CPU、RAM、Disk 等規格','早期服務資源不足且希望快速改善','有硬體上限且沒有消除單點故障',['Scale Up','Vertical']],
['Scale Out','增加更多服務節點共同承接負載','Web API 可平行處理且需要更高容量','需要 Load Balancer、狀態共享與節點一致性設計',['Scale Out','Horizontal']],
['Stateless','任一 App Instance 都能處理任一 Request','多台 Web Server 需要可互相替換','本機 Session 會讓水平擴展與 Failover 困難',['Stateless','無狀態']],
['Shared Session Store','把多節點共享的 Session 放到外部系統','使用者 Request 會被分配到不同 App Instance','外部 Store 自己也必須考慮可用性與容量',['Session','Redis']],
['Autoscaling','依可觀測指標自動調整服務實例數','流量有明顯尖峰與低谷','擴容有啟動延遲，而且不能修復慢 DB 等下游瓶頸',['Autoscaling','自動擴展']]
],
'sd-03':[
['DNS','把網域名稱解析成可連線的服務入口','Client 只有 api.example.com，需要找到實際端點','DNS TTL 讓變更不會瞬間全球生效',['DNS','名稱解析']],
['Reverse Proxy','代表後端接收 Request 並轉送 Upstream','需要集中 TLS、Header、Routing 等入口責任','設定錯誤會成為流量單點或安全問題',['Reverse Proxy','Nginx']],
['Load Balancer','把 Request 分配到多個健康後端','多台 App Server 需要平衡流量與移除故障節點','LB 不能修復後端本身的慢 Query 或錯誤',['Load Balancer','健康檢查']],
['L4 Load Balancing','依 TCP/UDP 等傳輸層資訊分流','不需要理解 HTTP Path，只求高效連線轉發','不能像 L7 一樣依 URL/Header 做細緻路由',['L4','TCP']],
['L7 Load Balancing','理解 HTTP 等應用層資訊後路由','/api 與 /static 或不同 Host 要送不同服務','規則更靈活但處理與設定複雜度也更高',['L7','HTTP','Path']]
],
'sd-04':[
['Cache Hit','Cache 中已有所需資料，可直接回應','熱門資料重複讀取且內容仍有效','Hit 不等於資料一定最新',['Cache Hit','命中']],
['Cache Miss','Cache 沒有所需資料，需要回源','第一次讀取或 TTL 到期後查不到 Key','大量同步 Miss 可能形成回源洪峰',['Cache Miss','Miss']],
['Cache-Aside','App 先查 Cache，Miss 再查 DB 並回填','讀多寫少且希望由 App 控制快取流程','更新 DB 後若忘記 Invalidate 會讀到舊資料',['Cache-Aside','回填']],
['TTL','控制 Cache Key 的存活時間','需要在 Freshness 與 Hit Rate 間取捨','太短會增加 Miss，太長會增加 Stale Data',['TTL','Time To Live']],
['Cache Stampede','熱門 Key 過期後大量 Request 同時回源','同一熱門資料在尖峰時突然過期','需要 Lock、Single-flight 或 Stale-while-revalidate 等手段',['Stampede','擊穿','Avalanche']]
],
'sd-05':[
['Read Replica','Primary 的資料副本，用來分攤讀取','讀流量遠高於寫入且 Primary 被 SELECT 壓滿','Replica 主要不是拿來分攤 Primary 寫入',['Read Replica','讀副本']],
['Replication Lag','Replica 暫時落後 Primary 的時間差','剛更新資料後立刻從 Replica 讀到舊值','重要 Read-after-write 流程不能假設 Replica 已同步',['Replication Lag','延遲']],
['Sharding','把不同資料子集分散到不同資料庫節點','單庫容量或寫入吞吐逼近上限','跨 Shard Join、Transaction、Rebalancing 會更複雜',['Sharding','分片']],
['Shard Key','決定資料落在哪個 Shard 的欄位或規則','需要讓資料與流量分布均勻','選錯 Key 會造成 Hot Shard 與難以 Rebalance',['Shard Key','Hot Shard']],
['SQL vs NoSQL','依資料模型、查詢、交易與擴展需求選資料庫','比較訂單交易與大規模事件資料的儲存方式','不能簡化成 NoSQL 一定更快或 SQL 一定更一致',['SQL','NoSQL']]
],
'sd-06':[
['CDN Edge','靠近使用者的邊緣節點，用來快取與傳遞內容','全球使用者重複下載相同圖片、JS、影片片段','私有或高度動態資料需要正確 Cache Key 與權限策略',['CDN','Edge']],
['Origin','CDN Miss 時真正取得原始內容的來源','Edge 沒有資料或 TTL 到期需要回源','Origin 仍可能在 Miss 洪峰時成為瓶頸',['Origin','回源']],
['Object Storage','持久保存圖片、影片、附件等 Blob','大型檔案需要與 App Server 分離保存','它不適合複雜關聯查詢或商業邏輯',['Object Storage','Blob']],
['Versioned Asset URL','以版本或內容 Hash 改變靜態資產 URL','前端檔案更新但希望長 TTL Cache 仍安全','部署時 HTML 與新資產必須一致，否則會引用不存在版本',['Versioned URL','immutable']],
['Cache Invalidation','讓舊 Edge Cache 主動或依規則失效','刪除內容、權限改變或需立即撤下舊檔','Purge 有成本且不應假設全球瞬間一致',['Invalidation','Purge']]
],
'sd-07':[
['Message Queue','在 Producer 與 Consumer 間緩衝非同步工作','寄信、縮圖、報表不需阻塞 API Response','Queue 不能自動保證任務只執行一次',['Message Queue','Broker']],
['Acknowledgement','Consumer 完成工作後通知 Broker 可確認訊息','Worker 完成副作用後才可視為處理成功','過早 Ack 可能在 Crash 時遺失工作',['Ack','Acknowledgement']],
['Dead Letter Queue','隔離多次處理仍失敗的訊息','毒性訊息持續 Retry 並阻礙主流程','DLQ 仍需監控與人工/自動處理，不能當垃圾桶',['DLQ','Dead Letter']],
['At-least-once Delivery','訊息至少送達一次，但可能重複','Consumer 已寫 DB 卻在 Ack 前 Crash','Consumer 必須 Idempotent，否則 Duplicate 會造成副作用',['At-least-once','Duplicate']],
['Partition Ordering','同一 Partition 內維持訊息順序','同一訂單或同一 Entity 的事件需要有序處理','跨 Partition 通常不能假設全域順序',['Partition','Ordering']]
],
'sd-08':[
['Fixed Window','在固定時間窗內限制 Request 次數','每分鐘最多 100 次的簡單 API 限流','窗邊界可能出現瞬間雙倍 Burst',['Fixed Window','限流']],
['Token Bucket','Token 持續補充，Request 消耗 Token','允許一定 Burst 但希望控制長期平均速率','Bucket 大小與補充速率設錯會過度放行或過度限制',['Token Bucket','Bucket']],
['Distributed Rate Limiter','多個 App Instance 共享限流狀態','水平擴展後所有節點都要看到同一使用量','共享 Store 延遲與原子操作會影響正確性',['Distributed Rate Limiter','Redis']],
['Backpressure','下游跟不上時降低或延後上游產生速度','Queue Depth 持續增加且 Consumer 已飽和','只加更多 Producer 會讓積壓與延遲更糟',['Backpressure','Queue Depth']],
['Load Shedding','系統過載時主動拒絕低優先 Request','保護核心功能避免整體雪崩','拒絕策略必須分優先級，不能無差別丟流量',['Load Shedding','429']]
],
'sd-09':[
['Strong Consistency','讀取保證看到符合一致性模型的最新結果','餘額或關鍵狀態不能接受讀到舊值','延遲與可用性成本可能比 Eventual 高',['Strong Consistency','強一致']],
['Eventual Consistency','若無新更新，各副本最終會收斂','Feed、搜尋索引等可接受短暫延遲','短時間內 Client 可能看到不同版本資料',['Eventual Consistency','最終一致']],
['CAP','網路 Partition 發生時要在 Consistency 與 Availability 間取捨','跨節點系統需要討論 Partition 時的行為','CAP 不是平常任意三選二，也不是永遠只能選兩個',['CAP','Partition']],
['Saga','把跨服務長交易拆成多個本地交易與補償動作','訂單、付款、庫存跨多服務協作','Compensation 不一定能真正逆轉所有副作用',['Saga','補償']],
['Transactional Outbox','業務資料與待發布事件在同一 DB Transaction 寫入','避免 DB 成功但 Event 發送失敗的雙寫問題','仍需 Publisher 與 Consumer 去重和監控',['Outbox','雙寫']]
],
'sd-10':[
['Timeout and Retry','為外部呼叫設定等待上限並針對暫時故障重試','下游偶發 Timeout 或網路錯誤','盲目 Retry 會放大故障，需 Backoff、Jitter 與上限',['Timeout','Retry']],
['Circuit Breaker','下游持續失敗時暫時快速拒絕呼叫','依賴服務故障，繼續呼叫只會耗盡 Thread/Connection','需要正確 Half-open 恢復策略，不能永久斷路',['Circuit Breaker','Breaker']],
['Metrics Logs Traces','從數值、事件與跨服務路徑觀測系統','需要定位高延遲、錯誤與特定 Request 問題','只有 Logs 不代表能理解跨服務延遲',['Metrics','Logs','Traces']],
['SLO SLA Error Budget','用可靠性目標與允許失敗預算管理服務','團隊要在穩定性與發布速度間做決策','SLA 是外部承諾，SLO 是內部目標，不能混為一談',['SLO','SLA','Error Budget']],
['RPO RTO','描述可接受資料損失窗口與恢復服務時間','災難復原與 Backup/Failover 規劃','有 Backup 不等於能達到目標，Restore 必須演練',['RPO','RTO']]
],
'sd-11':[
['Database Sequence','由集中式 Sequence 產生遞增 ID','中小規模且需要簡單有序 ID','中央協調可能成為瓶頸或可用性依賴',['Sequence','Auto Increment']],
['UUID','節點可自行產生的高機率唯一識別碼','跨系統、離線或去中心化產生 ID','較長且隨機性可能降低 B-Tree Index locality',['UUID']],
['Snowflake ID','由 Timestamp、Worker、Sequence 組成的大致有序 ID','大型分散式服務要高吞吐產生全域 ID','需管理 Worker ID 並處理 Clock Rollback',['Snowflake','Worker ID']],
['Clock Rollback','系統時間倒退造成 Timestamp-based ID 風險','Snowflake 類產生器遇到 NTP 或時鐘異常','若不處理可能重複或破壞排序',['Clock Rollback','時鐘']],
['Cursor Pagination','用穩定排序鍵作為下一頁位置','大量資料與持續新增的列表分頁','排序鍵不穩定或不唯一會造成重複/漏資料',['Cursor','Pagination']]
],
'sd-12':[
['Inverted Index','由 Term 反查包含該 Term 的 Documents','文字搜尋要快速找出包含關鍵字的文件','索引需要額外儲存且更新不是免費',['Inverted Index','倒排索引']],
['Tokenization','把原始文字切成可索引的 Token','不同語言與標點需要轉成搜尋單位','錯誤切詞會直接降低 Recall/Precision',['Tokenization','Analyzer']],
['Indexing Pipeline','把 Source Data 轉成搜尋索引','DB 更新後要非同步同步到 Search Engine','Pipeline 延遲會造成搜尋結果不夠新',['Indexing','Pipeline']],
['Ranking','依相關性與其他訊號排序候選文件','相同 Query 可能匹配上千文件，需要先後順序','Ranking 服務故障應有簡化排序 Fallback',['Ranking','Score']],
['Search Freshness','Source of Truth 更新到 Search 可見之間的延遲','商品剛修改名稱但搜尋仍顯示舊值','需要依業務容忍度設計同步延遲與 Reindex',['Freshness','Reindex']]
],
'sd-13':[
['Modular Monolith','單一部署單元內保持清楚模組邊界','團隊與規模尚未需要分散式成本','模組邊界若不清楚仍會變成 Big Ball of Mud',['Modular Monolith','Monolith']],
['API Gateway and Discovery','提供外部入口並找到實際服務實例','多個 Microservices 需要統一路由與動態節點定位','Gateway 不應塞入過多商業邏輯而變成新單體',['API Gateway','Service Discovery']],
['Sync vs Async Communication','依是否需要立即結果選 HTTP/gRPC 或 Event','使用者查資料需即時回覆，但寄信可非同步','全部改成 Event-driven 會增加追蹤與一致性複雜度',['Sync','Async']],
['Database per Service','服務擁有自己的資料邊界','希望服務可獨立演化 Schema 與部署','跨服務 Join 與 Transaction 會更困難',['Database per Service','資料邊界']],
['Distributed Transaction Pattern','用 Saga/Outbox/Idempotency 處理跨服務流程','訂單、付款、庫存需協作但無單一 ACID Transaction','Compensation、重試與觀測是必要成本',['Saga','Outbox','Idempotency']]
],
'sd-14':[
['Active-Passive','主 Region 提供服務，備援 Region 待命','希望簡化跨 Region 寫入與一致性','Failover 有切換時間且備援資源利用率較低',['Active-Passive','Failover']],
['Active-Active','多個 Region 同時承接流量','全球低延遲且需 Region 故障仍持續服務','跨 Region 寫入衝突與一致性會更複雜',['Active-Active']],
['Global Routing','依健康狀態、地理位置或延遲導向 Region','全球使用者需要就近入口與故障切換','DNS/Anycast 等切流也有傳播與 Cache 延遲',['Global Routing','DNS']],
['Cross-region Replication','把資料複製到其他 Region','需要災難復原、在地讀取或 Active-Active','延遲與網路 Partition 可能產生 Stale Data 或 Conflict',['Cross-region','Replication']],
['Conflict and Data Residency','處理多地寫入衝突與資料所在地限制','同一筆資料可能在不同 Region 被同時修改','不能只追求低延遲而忽略法規與衝突策略',['Conflict','Data Residency']]
],
'sd-15':[
['Base62 Short Code','把數字 ID 編碼成較短 URL-safe 字串','需要可預測長度且快速產生短碼','若直接暴露遞增 ID 可能洩漏量級與被枚舉',['Base62','Short Code']],
['Redirect Cache','快取 shortCode → longURL 映射','讀取遠高於建立短網址且熱門連結重複訪問','刪除或修改短網址時要處理 Cache Invalidation',['Redirect Cache','Redis']],
['URL Sharding','依 shortCode 或 hash 分散映射資料','映射數量與 QPS 超過單庫能力','Shard Key 與 Rebalance 仍是主要複雜度',['Sharding','shortCode']],
['Abuse Rate Limit','限制建立或解析短網址的惡意流量','公開 API 可能被 Bot 大量建立垃圾 URL','限流不能取代內容安全與封鎖策略',['Rate Limit','Abuse']],
['Async Analytics','點擊統計透過 Event/Queue 非同步處理','Redirect 必須低延遲但 Analytics 不必同步完成','事件重複與延遲需要 Idempotency 與 Eventual Consistency',['Analytics','Queue']]
],
'sd-16':[
['WebSocket','維持雙向長連線讓 Server 主動推送','聊天室需要即時訊息而不是 Client 輪詢','連線數、Gateway 狀態與斷線重連都要額外管理',['WebSocket']],
['Presence','表示使用者目前在線與連線位置的暫態狀態','要把訊息路由到正確 Gateway 或判斷離線','Presence 會快速變化，不能當永久真相',['Presence','Heartbeat']],
['Message Ordering','讓同一 Conversation 的訊息有穩定順序','多個 Sender/Server 同時產生訊息','不要假設不同 Partition 或不同 Region 有全域自然順序',['Ordering','Sequence']],
['Persist Before Ack','成功回應前確保訊息進入 Durable Storage','Client 收到 sent 成功後不能因 Server Crash 而消失','過早 Ack 會造成顯示成功但實際遺失',['Persist Before Ack','Durable']],
['Offline and Fan-out','在線走 Socket、離線保存未讀並 Push','Recipient 不在線或大型群組需要不同 delivery 策略','超大群組 Fan-out on Write 可能造成巨大寫放大',['Offline','Fan-out']]
],
'sd-17':[
['Fan-out on Write','作者發文時預先把 Post ID 推進 Followers Timeline','一般帳號讀多寫少，希望首頁快速','明星帳號會造成巨大 Write Amplification',['Fan-out on Write','Write Amplification']],
['Fan-out on Read','讀 Feed 時才抓各來源貼文並合併','超大帳號不適合寫入時推給所有 Followers','讀取成本、Merge 與排序會變重',['Fan-out on Read']],
['Celebrity Hybrid','一般帳號 Push、超大帳號 Read-time Merge','Feed 同時有一般與千萬粉絲帳號','判定門檻與混合排序需要額外邏輯',['Celebrity','Hybrid']],
['Cursor Feed Pagination','依穩定 Ranking Key/ID 繼續下一頁','無限滾動且前方持續新增貼文','Cursor 必須包含足夠排序資訊避免重複漏資料',['Cursor','Feed']],
['Ranking Fallback','Ranking 失效時退回時間排序等簡化策略','Recommendation Service 故障但首頁仍需可用','不要讓非核心排序服務拖垮整個 Feed',['Ranking','Fallback']]
],
'sd-18':[
['Object Storage for Files','大型檔案內容放 Object Storage，Metadata 另存 DB','影片、附件、備份等 Blob 需要高耐久容量','不要讓 App Server 本機磁碟成為永久檔案來源',['Object Storage','Metadata']],
['Chunked Resumable Upload','把大型檔案拆片並可續傳','2GB 檔案上傳中斷不能全部重來','需要管理 Part ID、順序、完整性與完成狀態',['Chunk','Resumable']],
['Pre-signed URL','Server 授權後讓 Client 直接與 Storage 傳輸','避免大型檔案流量全部經過 App Server','URL 權限、時效與操作範圍必須限制',['Pre-signed','Signed URL']],
['Checksum and Dedup','用內容 Hash 驗證完整性並辨識重複資料','上傳完成後要確認檔案未損壞或避免重複存放','Hash 不能單獨取代權限與惡意內容檢查',['Checksum','Dedup']],
['Async Processing and CDN','上傳後縮圖/轉碼走 Queue，下載走 CDN','影片處理昂貴且全球下載量大','處理狀態與 Cache Invalidation 需要明確生命週期',['Transcoding','CDN','Queue']]
],
'sd-19':[
['Multi-channel Notification','同一事件可透過 Email、SMS、Push、Inbox 等渠道','系統需依事件與使用者偏好選擇 Channel','不同 Provider 的成本、限制與可靠性不同',['Email','SMS','Push']],
['Queue-based Delivery','Notification Job 先進 Queue 再由 Worker 發送','外部 Provider 慢或尖峰時不阻塞主要交易','積壓會延遲通知，需 Queue Depth 與 Priority 監控',['Queue','Delivery']],
['Template and Preference','把內容模板與使用者訂閱偏好分離','同一事件依語言、Channel、退訂設定產生內容','忽略 Preference 會造成法規、體驗與垃圾通知問題',['Template','Preference']],
['Dedup and Priority','避免同一事件重複通知並區分緊急程度','付款成功不能因 Retry 寄十封，OTP 要優先於行銷','Dedup Key 與 TTL 設錯可能誤殺合法通知',['Dedup','Priority']],
['Provider Failover and Tracking','Provider 失敗可切換並保存 delivery status','SMS 供應商區域故障或 Email 被拒收','切換 Provider 仍可能重複發送，需要 Idempotency',['Provider','Failover','Delivery Status']]
],
'sd-20':[
['Payment Idempotency','同一付款 Request 重送時不重複扣款','Client Timeout 後重新送 Create Payment','Idempotency Key 的 Scope 與保存期限必須正確',['Idempotency','Payment']],
['Payment State Machine','用明確狀態描述付款生命週期','Pending、Authorized、Captured、Refunded 不能任意跳轉','亂改狀態會造成重複 Capture 或錯誤退款',['State Machine','Authorization','Capture']],
['Double-entry Ledger','每筆資金變動用 Debit/Credit 成對記錄','需要可稽核帳務與可重建餘額','不能只靠一個 balance 欄位當唯一帳本',['Ledger','Double-entry']],
['Webhook and Outbox','可靠處理外部 PSP 回呼與內部事件發布','付款 Provider 非同步通知最終結果','Webhook 可能重送、亂序或延遲，必須驗證與去重',['Webhook','Outbox']],
['Reconciliation','定期比對內部帳與 PSP/銀行外部紀錄','任何分散式流程都可能有漏單、延遲或未知狀態','沒有 Reconciliation 就無法發現長尾資料不一致',['Reconciliation','對帳']]
]
});