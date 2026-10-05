# YouTube 面試 Demo 審查

日期：2026-10-05。範圍：第 14 章 YouTube 課程資料、互動教材與兩種模擬模式；不是整個 software-learning 所有章節的全面認證，也未逐張轉錄 29 張 HEIC 原書照片。

## 結論

已修正以下可重現流程錯誤與錯誤／過度承諾的名稱，並驗證主要展示流程。適合以「瀏覽器內系統設計教學模型」定位展示；仍不能把它描述成正式影音服務或完全統一的單一執行引擎。

面試準備：[20 題問答與展示順序](YOUTUBE-INTERVIEW.md)。修改保留於本機，未部署。

## 本次修正

| 問題 | 修正與驗證 |
| --- | --- |
| 建立上傳與發布走 Metadata 快取，DB 故障仍可能成功 | 建立 session 需經 API＋DB；後端發布需 DB 成功。新增 DB 故障與恢復測試。 |
| 原檔已上傳完成，發布仍依賴創作者網路 | 轉碼及發布不受創作者離線／頻寬限制；發布以後端美國區域執行，不計為創作者跨區流量。新增離線發布測試。 |
| CDN 故障期間，回源成功仍把片段加入邊緣快取 | 只在該區有健康 CDN 時填入快取。新增故障測試。 |
| 改熱門影片政策後，舊快取仍讓長尾命中 | 命中時也檢查當前 cacheable 政策。新增舊快取政策測試。 |
| 三節點 Quorum 被說成能容忍兩台故障 | 改為三節點可用性示意；解釋三節點多數決需兩台。保留舊 option ID 以相容存檔。 |
| 固定三台都參與分流，名稱卻叫熱備援 | 改為多副本分流；不再暗示其他機器閒置待命。 |
| 只有增加機器，名稱卻叫自動擴縮容 | 改為自動擴容，標明 180 秒持續滿載；課程初始副本數由 2 修正為與世界一致的 1。 |
| 恢復計時被描述為已實作 DB 選舉；人工切換被說成無腦裂 | 明確標示 30／300 秒恢復示意，人工切換仍需舊主隔離。自動修復勾選不再一律標示 25 秒。 |
| GOP 被一概稱為可獨立播放，且把可播放當成可重試原因 | 修正教材、測驗答案與互動說明，區分 closed／open GOP、上傳分塊與播放片段。 |
| 預簽名 URL 被說成只限已登入者使用 | 改為 API 先授權後簽發；持有 URL 者可在權限與期限內使用。 |
| 動畫宣稱真的讀檔並計算 checksum | 節點與說明標為設計示意。 |
| 月份需求估計與實際人數混用、策略評分像實測 SLA | 區分尖峰估計與實際觀眾，標明月度策略評分不是 SLA；無故障注入的月份不再宣稱已作用於機器。 |
| 失敗任務手動重試卻被說成整支影片重做 | 說明改為失敗任務重試，保留已完成輸出。 |
| 全部機器故障時負載顯示 Infinity% | 改為「無可用容量」。 |
| 完整課程動畫與共用世界容易被當成逐筆相同 | 課程畫面明確提示兩層執行紀錄不能逐筆對照；舊文件加上歷史版本提示。 |

## 驗證結果

- `node --test tests/*.test.cjs`：60 項通過，包含新增 5 項回歸測試。
- `node --test tests/check-interactive-blocks.js`：2 項通過；教材 ID、圖的連線與互動參照有效。
- 瀏覽器 `youtube-world-workspace-browser.js`：16 項通過，包含實際 API 排隊、逾時、同批重試完成與版面。
- 瀏覽器 `simulator-month-continuity-browser.js`：13 項通過，包含月份故障、原上傳請求保留、DB 恢復後完成、不重複評分。
- 瀏覽器 `simulator-network-browser.js`：33 項通過，包含原傳輸中斷、跨區接手、共用儲存故障、CDN 回源、弱網與恢復。
- 另檢查即時模式切回課程：觀眾 ID、請求 ID 保留，時鐘持續；760px 即時與課程畫面均無水平溢出。
- 使用 agent-browser 查看 JavaScript 錯誤紀錄，上述瀏覽器驗證無回報錯誤；已查看桌面課程、即時模式與窄視窗截圖。

以上是指定案例的驗證，不是任意組合或無限長時間運作都不會出錯的保證。

## 展示時應說明的模型邊界

1. **兩套呈現仍有不同執行資料。** `system-design-simulator.js` 的完整教學流程有自己的 Runtime、動畫、資料表；`youtube-world.js` 的共享世界另有 Request。觀眾、機器與月份交接不代表兩者逐筆 ID、影片資料與完成時刻完全一致。尚未把兩層合併；講逐筆追蹤時選定一個模式。課程的跨區回源不應直接宣稱即時模型也支援相同策略。
2. **後端是抽象資源。** 即時世界用同一類物件儲存代表影音儲存，轉碼消耗 worker 工作量，沒有真實輸出檔耐久化、轉碼讀寫 I/O、完成事件 durable queue／ack／dead letter 等細節。完整架構圖的獨立節點不能當成這些機制已實作。
3. **資料一致性沒有模擬。** Metadata 快取目前主要是節點可用性模型，沒有 per-key miss／TTL／失效／複寫延遲。DB 的自動恢復是計時，沒有真正 leader election、fencing、RPO／RTO 或資料副本。
4. **上傳是教學協定。** 即時世界以六塊、兩塊並行示意 multipart；未做真實 S3 CompleteMultipartUpload、checksum 或雲端權限。不是 YouTube Data API 的逐段 resumable upload 協定。
5. **數值不是產品承諾。** 網速、容量、180 秒擴容、30／300 秒修復為模型設定。課程尖峰人數不是世界實際持續模擬的人數，月份評分也不是量測的百分比。
6. **熱門度與 CDN 簡化。** 目前成功下載片段數用作熱門排序代理，不是 YouTube 觀看次數；快取沒有容量限制、TTL、淘汰、回源合併或多層 CDN。
7. **持久化與時間。** 依 sessionStorage 交接，非後端持久化；分頁背景不新增模擬時間，關閉整個教學網頁沒有背景工作服務。模擬使用者離線與關閉教學網站不同。
8. **既有工作保留。** 任務開始前 `youtube-world-course.js`、`youtube-world-diagram.js`、`youtube-world.css`、部分測試已有本機變更。本次沒有覆蓋或回復它們；新報告的修改清單不將這些既有改動算入成果。

## 核對來源

- [etcd：故障與多數決](https://etcd.io/docs/v3.5/op-guide/failures/)
- [AWS：Presigned URL 的授權與 bearer token 性質](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [AWS：Multipart upload 概覽](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
- [Google：YouTube resumable upload 協定](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol)
- [Apple：HLS authoring specification](https://developer.apple.com/documentation/http-live-streaming/hls-authoring-specification-for-apple-devices/)

## 本機驗證截圖

- [課程桌面](docs/demo-audit/course-desktop.png)
- [課程工作區](docs/demo-audit/course-workspace.png)
- [即時模式桌面](docs/demo-audit/world-desktop.png)
- [即時模式 760px](docs/demo-audit/world-760px.png)
