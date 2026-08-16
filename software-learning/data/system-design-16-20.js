(() => {
    const course = (window.SOFTWARE_LEARNING_COURSES || []).find(item => item.id === 'system-design');
    if (!course) return;

    course.lessons.push(
        {
            id: 'sd-16',
            title: '實戰：設計即時聊天室 Chat System',
            level: '進階',
            duration: '55–70 分鐘',
            summary: '把 WebSocket、Presence、Message Storage、Ordering、Unread、Push Notification 與 Multi-device sync 串成完整聊天室。',
            content: [
                { type: 'slides', title: '聊天室真正難的不是「送一個字串」', slides: [
                    { kicker: 'MVP', title: '先定最小功能', text: '一對一聊天、群組聊天、歷史訊息、離線後可補收。已讀、輸入中、檔案、搜尋都可以後加。', visual: 'send → deliver → persist → read' },
                    { kicker: 'CONNECTION', title: '即時連線需要長連線', text: 'HTTP request/response 很適合一般 API；即時聊天室通常會維持 WebSocket 連線，讓 Server 能主動推訊息。', visual: 'Client ⇄ WebSocket Gateway' },
                    { kicker: 'STORAGE', title: '即時傳送與永久保存是兩件事', text: '訊息應有 durable storage；Gateway 掛掉不能代表聊天紀錄消失。', visual: 'Gateway → Message Service → Message Store' },
                    { kicker: 'DELIVERY', title: '在線走 socket，離線走 push', text: 'Recipient 在線可直接推；不在線時通常保存未讀狀態並透過 APNs/FCM 類 Push Notification 喚醒。', visual: 'online → socket\noffline → push + sync later' }
                ]},
                { type: 'heading', text: '1. 先拆 API 與即時通道' },
                { type: 'diagram', nodes: [
                    { title: 'Client', subtitle: 'REST + WebSocket' },
                    { title: 'Gateway', subtitle: 'Connection / Auth' },
                    { title: 'Chat Service', subtitle: 'Validate / Route' },
                    { title: 'Message Store', subtitle: 'Durable history' },
                    { title: 'Push Service', subtitle: 'Offline notify' }
                ], caption: 'REST 適合登入、拉歷史紀錄等；WebSocket 適合即時訊息與狀態事件。' },
                { type: 'heading', text: '2. Message ID、Ordering 與 Duplicate' },
                { type: 'stepper', steps: [
                    { title: 'Client Message ID', text: 'Client 送出前先產生 request/message id，重送時沿用，Server 可做 idempotency 去重。' },
                    { title: 'Server Sequence', text: '同一 conversation 需要穩定順序時，可由 conversation partition 產生遞增 sequence。' },
                    { title: 'Persist Before Ack', text: '如果 Server 尚未 durable persist 就回成功，服務 crash 可能讓訊息「顯示已送出但其實消失」。' },
                    { title: 'Retry Is Normal', text: '網路 timeout 時 Client 不知道 Server 有沒有成功，所以 retry 是正常流程，duplicate 必須被設計處理。' }
                ]},
                { type: 'code', text: '# 訊息模型示意\n{\n  "message_id": "client-generated-id",\n  "conversation_id": "c_123",\n  "sender_id": "u_1",\n  "sequence": 9812,\n  "body": "hello",\n  "created_at": 1720000000\n}' },
                { type: 'heading', text: '3. Presence 與 Connection Registry' },
                { type: 'paragraph', text: '使用者是否在線，不適合只存在某一台 Gateway RAM。Gateway 可把 `user_id → connection/gateway` 的 presence 資訊寫到 Redis 類共享系統，並加 TTL / heartbeat。Presence 是暫態狀態，不應和聊天歷史混為一談。' },
                { type: 'checkpoint', question: 'Client timeout 後重送同一則訊息，最重要的防護是？', options: ['Idempotency / Message ID 去重', '把 DB 刪掉', '每次換 conversation', '關掉 Retry'], answer: 0, explanation: '分散式網路中 retry 很正常，因此要讓重送安全。' },
                { type: 'heading', text: '4. 群組聊天怎麼擴展？' },
                { type: 'compare', items: [
                    { icon: '📤', title: 'Fan-out on Write', text: '訊息寫入時就為每個成員建立 delivery/unread 狀態，讀取快，但超大群組寫入成本高。', bestFor: '一般小中型群組' },
                    { icon: '📥', title: 'Fan-out on Read', text: '先只保存群組訊息，讀取時再依 membership 組合，寫入較輕，但讀取與 unread 計算較複雜。', bestFor: '超大群組、廣播場景' }
                ]},
                { type: 'callout', text: '面試回答聊天室時，不要只說 WebSocket。真正要談的是 connection routing、durable message、ordering、retry/duplicate、offline delivery、multi-device sync 與 failure handling。' }
            ],
            quiz: [
                { id: 'sd16-q1', type: 'choice', question: '聊天室使用 WebSocket 的主要理由？', options: ['讓 Server 可在長連線上主動推訊息', '取代所有 Database', '保證 exactly-once', '讓圖片變小'], answer: 0, explanation: 'WebSocket 適合雙向持續連線與即時推送。' },
                { id: 'sd16-q2', type: 'choice', question: 'Client timeout 後 retry，最重要要避免？', options: ['Duplicate message', 'DNS lookup', 'CSS cache', 'CPU idle'], answer: 0, explanation: '同一操作可能其實已成功，重送需做 idempotency。' },
                { id: 'sd16-q3', type: 'choice', question: 'Presence 最適合視為哪類資料？', options: ['暫態共享狀態', '永遠不可變歷史', '靜態圖片', '排序演算法'], answer: 0, explanation: '在線狀態會快速變化，常搭配 TTL/heartbeat。' },
                { id: 'sd16-q4', type: 'choice', question: 'Persist Before Ack 的核心目的？', options: ['避免已回成功的訊息因 crash 消失', '提高 CSS FPS', '取代 Load Balancer', '避免登入'], answer: 0, explanation: '成功回應前要確保資料已進入可持久化路徑。' },
                { id: 'sd16-q5', type: 'fill', question: '填空：讓重試不造成重複副作用的特性稱為 _________。', answerText: 'Idempotency', explanation: 'Idempotency 讓重複請求可安全處理。' }
            ]
        },
        {
            id: 'sd-17',
            title: '實戰：設計 News Feed / Timeline',
            level: '進階',
            duration: '55–70 分鐘',
            summary: '理解 Fan-out on Write / Read、Celebrity Problem、Ranking、Cursor Pagination、Cache 與 Timeline freshness。',
            content: [
                { type: 'slides', title: '首頁動態牆其實是「大量關係 + 排序 + 快取」', slides: [
                    { kicker: 'WRITE', title: '有人發一篇貼文', text: '系統先 durable 保存 post，再決定要不要把 post id 推進 followers 的 timeline inbox。', visual: 'Author → Post Store → Fanout Workers' },
                    { kicker: 'READ', title: '使用者打開首頁', text: '理想情況是直接從 timeline cache/inbox 取一串 post ids，再批次 hydrate 貼文內容。', visual: 'Timeline IDs → Post Cache/Store → Feed' },
                    { kicker: 'CELEBRITY', title: '千萬粉絲是特殊情況', text: '如果每發一篇就 fan-out 1000 萬份，寫入爆炸；通常會對超大帳號改採 read-time merge。', visual: 'normal users: push\ncelebrity: pull/merge' },
                    { kicker: 'RANKING', title: '不一定只按時間排序', text: 'Recommendation / Ranking 可以加入 affinity、engagement、freshness 等訊號，但 ranking service 不應讓 feed 基礎可用性完全綁死。', visual: 'candidate → rank → hydrate' }
                ]},
                { type: 'heading', text: '1. Fan-out on Write vs Fan-out on Read' },
                { type: 'compare', items: [
                    { icon: '✍️', title: 'Fan-out on Write', text: '作者發文時，把 post id 推到 followers 的 timeline。讀很快，但名人發文會造成巨大寫放大。', bestFor: '大多數一般使用者' },
                    { icon: '👀', title: 'Fan-out on Read', text: '讀首頁時才抓追蹤者近期貼文再 merge/rank。寫入輕，但讀取成本與延遲高。', bestFor: '巨量 followers、特殊帳號' }
                ]},
                { type: 'heading', text: '2. Hybrid 才是常見答案' },
                { type: 'diagram', nodes: [
                    { title: 'Post Create', subtitle: 'durable write' },
                    { title: 'Queue', subtitle: 'fanout jobs' },
                    { title: 'Timeline Cache', subtitle: 'normal authors' },
                    { title: 'Celebrity Merge', subtitle: 'read-time' },
                    { title: 'Ranking', subtitle: 'final order' }
                ], caption: '一般作者 push，超大作者 pull，讀取時合併候選並排序。' },
                { type: 'heading', text: '3. Cursor Pagination 比 Offset 更適合無限滾動' },
                { type: 'code', text: '# 概念示意\nGET /feed?cursor=eyJsYXN0X3Njb3JlIjoxNzIw...\n\n# cursor 可包含 last_rank_score / last_post_id\n# 下一頁只抓「比上一個位置更後面」的資料' },
                { type: 'paragraph', text: 'Offset 在大量新增資料時可能產生重複/漏資料，而且越往後 offset scan 可能越昂貴。Cursor 用穩定排序鍵繼續往後找，通常更適合 feed。' },
                { type: 'checkpoint', question: '某明星有 5000 萬 followers，若每次發文都立刻寫 5000 萬個 timeline entry，主要問題是？', options: ['Write amplification', 'Binary Search', 'DNS recursion', 'CSS cascade'], answer: 0, explanation: '巨大 follower 數會把一筆 post 放大成大量 fan-out writes。' },
                { type: 'heading', text: '4. 一致性要接受「短暫延遲」' },
                { type: 'bullet', text: 'Feed 通常可接受 eventual consistency：剛發文後幾秒才出現在某些 follower 首頁。' },
                { type: 'bullet', text: '刪文/封鎖則要有更高優先級的 invalidation 或 read-time filter，避免敏感資料持續可見。' },
                { type: 'bullet', text: 'Ranking service 掛掉時可 fallback 成 chronological feed，避免整個首頁不可用。' },
                { type: 'callout', text: 'News Feed 的核心不是「用 Redis」。核心是 candidate generation、fan-out 策略、排序、pagination 與 celebrity/write-amplification trade-off。' }
            ],
            quiz: [
                { id: 'sd17-q1', type: 'choice', question: 'Fan-out on Write 的最大優勢？', options: ['讀取 Feed 很快', '完全沒有寫入成本', '不需要 Storage', '不需要 Queue'], answer: 0, explanation: 'Timeline 可預先準備，因此 read path 很快。' },
                { id: 'sd17-q2', type: 'choice', question: 'Celebrity Problem 常造成？', options: ['巨大的寫放大', 'HTML 無法解析', 'UUID 撞色', '只有一個 follower'], answer: 0, explanation: '超多 followers 讓 push fan-out 非常昂貴。' },
                { id: 'sd17-q3', type: 'choice', question: '無限滾動 Feed 常偏好 Cursor Pagination 的理由？', options: ['對持續新增資料較穩定', 'Cursor 一定 O(1)', '不需要排序', '不用 Database'], answer: 0, explanation: 'Cursor 依穩定排序鍵繼續往後，較不易受前方新增資料影響。' },
                { id: 'sd17-q4', type: 'choice', question: 'Ranking service 掛掉時合理的降級策略？', options: ['Fallback chronological feed', '整站 500', '刪除所有 posts', '關閉登入'], answer: 0, explanation: '核心功能可用通常比完整 ranking 更重要。' },
                { id: 'sd17-q5', type: 'fill', question: '填空：作者發文時預先把 post 推進 followers timeline 稱 Fan-out on ____。', answerText: 'Write', explanation: 'Fan-out on Write 在寫入時展開。' }
            ]
        },
        {
            id: 'sd-18',
            title: '實戰：設計大型檔案儲存與同步服務',
            level: '進階',
            duration: '55–70 分鐘',
            summary: '設計類 Dropbox/Drive 的 Upload、Chunking、Object Storage、Metadata、Dedup、Resumable Upload、CDN 與權限模型。',
            content: [
                { type: 'slides', title: '檔案服務要把「Metadata」與「Blob」分開', slides: [
                    { kicker: 'METADATA', title: '檔名、Owner、Folder、版本不是檔案本體', text: '這些適合放 Database，支援查詢、權限與交易。', visual: 'DB: name / owner / size / version / object_key' },
                    { kicker: 'BLOB', title: '幾 GB 的影片不該塞關聯式資料表', text: '大型 binary object 通常放 Object Storage，再由 metadata 記錄 object key。', visual: 'Object Storage: raw bytes' },
                    { kicker: 'CHUNK', title: '大檔案要切塊與可續傳', text: '網路中斷時，不希望 10 GB 從 0 重傳。Chunk upload 可以重試失敗片段並支援 parallel upload。', visual: 'file → chunk1 + chunk2 + chunk3 ...' },
                    { kicker: 'DIRECT', title: '避免 App Server 變成巨型轉接器', text: '常見做法是 App 簽發 pre-signed URL，Client 直接傳到 Object Storage。', visual: 'Client → signed URL → Object Storage' }
                ]},
                { type: 'heading', text: '1. Upload 流程' },
                { type: 'stepper', steps: [
                    { title: 'Create Upload Session', text: 'Client 先送 metadata，Server 建立 upload_id、權限與 object key。' },
                    { title: 'Chunk Upload', text: 'Server 回傳 signed URLs，Client 直接上傳 chunks。' },
                    { title: 'Complete', text: 'Client 通知上傳完成，Server 驗證 chunk/etag/checksum。' },
                    { title: 'Commit Metadata', text: '標記 file version ready，後續才對其它使用者可見。' }
                ]},
                { type: 'diagram', nodes: [
                    { title: 'Client', subtitle: 'chunk upload' },
                    { title: 'API', subtitle: 'auth + metadata' },
                    { title: 'Object Storage', subtitle: 'blob bytes' },
                    { title: 'Metadata DB', subtitle: 'file records' },
                    { title: 'CDN', subtitle: 'download acceleration' }
                ], caption: 'Control plane 走 API；大量資料 bytes 盡量直接走 Object Storage。' },
                { type: 'heading', text: '2. Versioning 與 Sync' },
                { type: 'paragraph', text: '每次修改建立新 version，而不是直接覆蓋同一 blob。Client 可保存 last_sync_cursor，只抓之後的 change log。多人同時編輯時，需要定義 conflict policy；一般檔案服務常不是強即時協作編輯器。' },
                { type: 'code', text: '# metadata 概念\nfile_id = "f_123"\nversion = 42\nobject_key = "files/f_123/v42"\nchecksum = "sha256:..."\nstatus = "ready"' },
                { type: 'checkpoint', question: '10GB 檔案上傳到 80% 網路斷線，最直接改善體驗的設計？', options: ['Resumable chunk upload', '每次重傳全部', '把檔案塞 Cookie', '停用 checksum'], answer: 0, explanation: '分塊與 upload session 可只重傳缺失片段。' },
                { type: 'heading', text: '3. Dedup 與 Security' },
                { type: 'bullet', text: 'Content hash 可用於判斷相同 blob，但 dedup 會牽涉隱私、ownership 與 reference counting。' },
                { type: 'bullet', text: 'Pre-signed URL 必須短 TTL、限制 method/object key；不能把永久 storage credential 給 Client。' },
                { type: 'bullet', text: '下載前仍需 AuthZ：能知道 object key 不代表有權限讀。' },
                { type: 'bullet', text: '檔案掃毒、內容審查、thumbnail/transcode 適合由 Queue 非同步處理。' },
                { type: 'callout', text: '設計檔案平台時，把「Metadata DB」和「Object Storage」分清楚，通常就已走對一半；剩下是 chunk、version、sync、permission 與 async processing。' }
            ],
            quiz: [
                { id: 'sd18-q1', type: 'choice', question: '大型檔案 bytes 通常最適合放？', options: ['Object Storage', 'Cookie', 'Session RAM', 'CSS'], answer: 0, explanation: '大型 Blob 適合物件儲存。' },
                { id: 'sd18-q2', type: 'choice', question: 'Pre-signed URL 的主要價值？', options: ['讓 Client 可限時直接與 Storage 傳輸', '永久公開 bucket', '取代所有 Auth', '自動做 Sharding'], answer: 0, explanation: '它讓大量 bytes 不必經過 App Server。' },
                { id: 'sd18-q3', type: 'choice', question: 'Chunk upload 最大優點之一？', options: ['可續傳與局部重試', '一定沒有 checksum', '讓 DB 變圖片', '不用網路'], answer: 0, explanation: '大檔案失敗時只需重傳部分 chunks。' },
                { id: 'sd18-q4', type: 'choice', question: 'Metadata DB 最可能保存？', options: ['file_id、owner、version、object_key', '10GB raw bytes only', 'CPU registers', 'HTML pixels'], answer: 0, explanation: '檔案描述與權限屬 metadata。' },
                { id: 'sd18-q5', type: 'fill', question: '填空：可中斷後繼續的大檔案上傳常稱 _________ Upload。', answerText: 'Resumable', explanation: 'Resumable Upload 支援斷點續傳。' }
            ]
        },
        {
            id: 'sd-19',
            title: '實戰：設計 Notification Platform',
            level: '進階',
            duration: '50–65 分鐘',
            summary: '統一處理 Email、SMS、Push、站內通知，理解 Queue、Preference、Template、Provider Failover、Dedup 與 Delivery Tracking。',
            content: [
                { type: 'slides', title: '通知不是「呼叫 SendEmail()」', slides: [
                    { kicker: 'MULTI CHANNEL', title: '同一事件可能有多種 Channel', text: '付款成功可能寄 Email；安全登入可能 Push + Email；OTP 可能 SMS。Channel 是策略，不應散落在各服務裡。', visual: 'event → policy → email / sms / push / inbox' },
                    { kicker: 'ASYNC', title: '通知通常不該卡住主交易', text: 'Order API 不需要等待第三方 Email provider 3 秒才回成功。事件進 Queue，Notification Worker 非同步處理。', visual: 'Order → Queue → Notification workers' },
                    { kicker: 'PREFERENCE', title: '使用者偏好與安靜時段是核心資料', text: 'Marketing、Transactional、Security 通知規則不同，不能一律全發。', visual: 'user preference + category policy' },
                    { kicker: 'PROVIDER', title: '第三方 Provider 會失敗', text: '需要 timeout、retry、rate limit、provider failover、DLQ 與 delivery status。', visual: 'Provider A ↓ → Provider B' }
                ]},
                { type: 'heading', text: '1. High-level Pipeline' },
                { type: 'diagram', nodes: [
                    { title: 'Business Event', subtitle: 'order/payment/security' },
                    { title: 'Notification API', subtitle: 'normalize request' },
                    { title: 'Queue', subtitle: 'buffer + retry' },
                    { title: 'Workers', subtitle: 'template + policy' },
                    { title: 'Providers', subtitle: 'Email/SMS/Push' }
                ], caption: 'Producer 不必知道某個 SMS vendor 細節，只描述通知意圖。' },
                { type: 'heading', text: '2. Idempotency 與 Dedup' },
                { type: 'paragraph', text: 'Payment Service retry 同一個 `payment_succeeded` event 時，不應寄 5 封收據。Notification request 應帶 event_id / dedup_key，在一定時間窗內防止重複派送。' },
                { type: 'stepper', steps: [
                    { title: 'Receive Event', text: '收到 notification request，先驗證 category、recipient、dedup key。' },
                    { title: 'Check Preference', text: '套用使用者選擇、法律/產品規則、quiet hours。' },
                    { title: 'Render Template', text: 'Template 與 localization 版本化，避免各服務自己拼字串。' },
                    { title: 'Send Provider', text: '依 channel/routing policy 呼叫 provider。' },
                    { title: 'Track Result', text: '保存 accepted/sent/delivered/bounced/failed，失敗依策略 retry 或進 DLQ。' }
                ]},
                { type: 'checkpoint', question: 'Order Service 建單成功後呼叫 SMS vendor 很慢，造成 API latency 飆高。最合理的第一步？', options: ['把通知改成 Queue 非同步處理', '把 timeout 設無限', '移除 DB', '讓 Client 等更久'], answer: 0, explanation: '通知多半不是主交易同步完成條件，可解耦。' },
                { type: 'heading', text: '3. Rate Limit 與 Priority' },
                { type: 'compare', items: [
                    { icon: '🚨', title: 'Security / OTP', text: '高優先、低延遲，通常不可被 Marketing backlog 阻塞。', bestFor: '獨立 queue / priority lane' },
                    { icon: '📣', title: 'Marketing', text: '吞吐大但容忍延遲，還要處理 unsubscribe、send window、frequency cap。', bestFor: 'batch / throttled workers' }
                ]},
                { type: 'heading', text: '4. Delivery status 不是單一「成功」' },
                { type: 'bullet', text: 'Provider API 200 可能只代表「接受請求」，不代表使用者已收到。' },
                { type: 'bullet', text: 'Email 可能 bounced、Push token 可能失效、SMS 可能 carrier rejected。' },
                { type: 'bullet', text: 'Webhook callback 也要做 signature 驗證與 idempotent update。' },
                { type: 'callout', text: 'Notification Platform 的價值是把「通知策略」集中：非同步、偏好、模板、供應商、重試、去重、優先級與追蹤，而不是再包一層 SendEmail。' }
            ],
            quiz: [
                { id: 'sd19-q1', type: 'choice', question: '通知系統大量使用 Queue 的主要理由？', options: ['解耦主流程並吸收尖峰', '保證 Email 永遠到達', '取代所有 API', '取代使用者偏好'], answer: 0, explanation: 'Queue 讓通知不阻塞業務流程並提供 buffer。' },
                { id: 'sd19-q2', type: 'choice', question: '同一 Payment Event 被重送 3 次，不想寄 3 封收據，需要？', options: ['Dedup / Idempotency', '再多寄一封', '關閉 Queue', '改 DNS'], answer: 0, explanation: '事件重送是正常情況，通知必須可去重。' },
                { id: 'sd19-q3', type: 'choice', question: 'OTP 與 Marketing 通知合理的佇列策略？', options: ['分 priority / queue，避免互相阻塞', '全部永遠同優先', 'OTP 放最慢', 'Marketing blocking checkout'], answer: 0, explanation: '不同類型有不同 latency/SLO。' },
                { id: 'sd19-q4', type: 'choice', question: 'Provider 回 200 是否一定代表最終 Delivered？', options: ['不一定', '一定', '只要是 SMS 一定', '只要是 Email 一定'], answer: 0, explanation: '通常只是 accepted，最終狀態可能後續 callback。' },
                { id: 'sd19-q5', type: 'fill', question: '填空：處理多次相同通知事件時避免重複副作用，仍稱為 _________。', answerText: 'Idempotency', explanation: '同樣是重試安全的核心。' }
            ]
        },
        {
            id: 'sd-20',
            title: '實戰：設計 Payment System 與 Ledger',
            level: '進階',
            duration: '65–80 分鐘',
            summary: '用付款系統整合 Idempotency、State Machine、Ledger、Webhook、Reconciliation、Saga 與不可逆副作用。',
            content: [
                { type: 'slides', title: '付款系統最重要的不是「快」，而是「不能亂」', slides: [
                    { kicker: 'IDEMPOTENCY', title: '使用者連點兩次不能扣兩次', text: 'Network retry、Client retry、Gateway retry 都很正常。Payment create/confirm API 必須以 idempotency key 去重。', visual: 'same key → same logical payment' },
                    { kicker: 'STATE', title: '付款不是 success / fail 兩種', text: '可能是 created、pending、authorized、captured、failed、refunded。狀態轉移要明確，不允許非法跳轉。', visual: 'created → authorized → captured → refunded' },
                    { kicker: 'LEDGER', title: '金流需要可稽核帳本', text: 'Payment record 描述交易狀態；Ledger 記錄資金變動。Double-entry ledger 讓每筆借貸保持平衡，利於 audit/reconciliation。', visual: 'Debit A 100\nCredit B 100' },
                    { kicker: 'RECON', title: '外部世界終究可能跟你不同步', text: 'Webhook 可能漏、timeout 可能不知道結果，因此要定期向 PSP/Bank 對帳與 reconciliation。', visual: 'internal records ⇄ provider settlement' }
                ]},
                { type: 'heading', text: '1. Payment State Machine' },
                { type: 'diagram', nodes: [
                    { title: 'Created', subtitle: '建立付款' },
                    { title: 'Authorized', subtitle: '資金授權' },
                    { title: 'Captured', subtitle: '正式扣款' },
                    { title: 'Settled', subtitle: '清算完成' },
                    { title: 'Refunded', subtitle: '退款' }
                ], caption: '實際 PSP 狀態更複雜，但重點是明確定義 allowed transitions 與 terminal states。' },
                { type: 'heading', text: '2. Idempotency Key 怎麼用？' },
                { type: 'code', text: '# Client\nPOST /payments\nIdempotency-Key: order_123_checkout_v1\n\n# Server\nif key already completed:\n    return previous_response\nif key processing:\n    return consistent_processing_result\nelse:\n    reserve key and start payment' },
                { type: 'paragraph', text: 'Idempotency key 的 scope、TTL、request fingerprint 都要定義。相同 key 卻帶不同金額，應拒絕而不是默默覆蓋。' },
                { type: 'heading', text: '3. Ledger 與 Payment Table 不同' },
                { type: 'compare', items: [
                    { icon: '💳', title: 'Payment Record', text: '描述一筆付款工作流程與 PSP reference、status、order_id。', bestFor: '流程狀態與外部整合' },
                    { icon: '📒', title: 'Ledger Entries', text: '記錄資金帳務變化，應 append-oriented、可稽核，不任意 UPDATE 歷史金額。', bestFor: 'accounting / audit / reconciliation' }
                ]},
                { type: 'stepper', steps: [
                    { title: 'Create Intent', text: '建立 payment intent，綁定 order/amount/currency 與 idempotency key。' },
                    { title: 'Call PSP', text: '使用 timeout/retry，但 retry 必須沿用 provider idempotency 能力或 reference。' },
                    { title: 'Record Result', text: '更新 payment state，必要時在同一 transaction 寫 outbox event。' },
                    { title: 'Webhook', text: 'PSP 非同步通知 captured/refunded；驗證 signature、去重並套用 state transition。' },
                    { title: 'Reconcile', text: '定期比對 internal payment/ledger 與 PSP settlement，找出漏單或金額不一致。' }
                ]},
                { type: 'checkpoint', question: 'Server 呼叫 PSP 後 timeout，不知道對方是否已扣款，最危險的做法是？', options: ['直接用全新 request 再扣一次且無 idempotency reference', '查狀態或沿用 idempotency key 重試', '等待 webhook', '進 reconciliation'], answer: 0, explanation: '未知結果時盲目發起全新扣款可能造成 double charge。' },
                { type: 'heading', text: '4. Saga：付款與訂單跨服務如何協調？' },
                { type: 'paragraph', text: '跨服務很難靠單一 DB transaction 包住 Order、Inventory、Payment。Saga 把流程拆成可補償步驟，例如 reserve inventory → charge payment → confirm order；若 charge 失敗則 release inventory。補償不是 rollback magic，而是另一個業務動作。' },
                { type: 'heading', text: '5. 必備 Failure Cases' },
                { type: 'bullet', text: 'PSP timeout 但其實成功：不能 double charge。' },
                { type: 'bullet', text: 'Webhook 重複或亂序：必須 idempotent 並驗證合法 state transition。' },
                { type: 'bullet', text: 'DB 成功、Event 發送失敗：Transactional Outbox。' },
                { type: 'bullet', text: '退款成功但內部狀態沒更新：Reconciliation 必須能抓出來。' },
                { type: 'bullet', text: '金額永遠用整數最小貨幣單位或 Decimal，不用 binary float。' },
                { type: 'callout', text: '做到第 20 章，系統設計回答應從「畫元件」進化成「定義 invariant 與 failure behavior」。付款系統的 invariant 是：不能重複扣款、帳務可追溯、未知狀態可恢復、外部差異可對帳。' }
            ],
            quiz: [
                { id: 'sd20-q1', type: 'choice', question: 'Payment API 最重要的設計之一？', options: ['Idempotency Key', '永不使用 Database', '只回 200', '關閉 Retry'], answer: 0, explanation: '付款重試不能造成重複扣款。' },
                { id: 'sd20-q2', type: 'choice', question: 'Payment Record 與 Ledger 的差異？', options: ['前者偏流程狀態；後者偏資金帳務與稽核', '完全相同', 'Ledger 是 CSS', 'Payment Record 只能圖片'], answer: 0, explanation: '兩者責任不同。' },
                { id: 'sd20-q3', type: 'choice', question: 'Webhook 重複送達時應？', options: ['Idempotent processing', '每次都重複扣款', '直接忽略 signature', '刪除 payment'], answer: 0, explanation: 'Webhook delivery 通常是 at-least-once。' },
                { id: 'sd20-q4', type: 'choice', question: 'Reconciliation 主要解決？', options: ['內部紀錄與外部 PSP/Bank 最終狀態不一致', '前端字體', 'DNS latency only', 'Binary Search'], answer: 0, explanation: '對帳用來發現與修正跨系統差異。' },
                { id: 'sd20-q5', type: 'fill', question: '填空：把跨服務流程拆成多步並定義補償動作的模式稱為 ____。', answerText: 'Saga', explanation: 'Saga 用多個 local transactions 與 compensation 管理長流程。' }
            ]
        }
    );
})();