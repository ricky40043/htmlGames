# YouTube 持續模擬世界

保留的新版入口為 `system-design-simulator.html?chapter=sd-book-14&mode=world`。一般 YouTube 入口已恢復原架構圖，`&mode=lesson` 也可進入原課程。其他章節與自由沙盒沿用原引擎。

## 套用架構設計

架構設計模式的八項決策會直接決定這個世界怎麼跑，contract 定義在 `youtube-world.js` 的 `DESIGN_EFFECTS`（兩套引擎共用同一組 optionId，有測試在守）：

| 決策 | 在世界裡的效果 |
| --- | --- |
| `cdnTier` | `off` 關閉邊緣快取，每次觀看都回源；`all` 全部快取；`popularOnly` 只快取觀看數前三名的影片，長尾一律回源 |
| `streamRedundancy` / `apiRedundancy` | `off` 每區 1 台且故障不自動恢復；`autoScale` 每區 1 台、同區持續滿載 180 秒補 1 台；`warmStandby` 每區開場就 3 台 |
| `dbMasterSlave` | `off` DB 故障不自動恢復；`manual` 300 秒；`auto` 30 秒 |
| `cacheReplica` | Metadata 快取節點數 1／2／3；快取節點全掛時 metadata 讀取才會壓回 Metadata DB |
| `transcodeResilience` | `off` 轉碼任務失敗就卡住；`reassign` 換機器但從頭重轉；`checkpointResume` 換機器並保留已完成進度 |
| `preSignedUpload` / `resumableUpload` | 對應 `options.directUpload` 與 `options.resumable` |

沒有任何架構設定時（例如從沒進過課程模式），世界用 `DESIGN_DEFAULTS` 跑，行為與加入這個功能前相同。世界頂端的「套用中的架構」會列出八項各自的效果並標示哪幾項與預設不同；改完決策要按「同種子重新開始」才會套用，或按「改用預設架構」清除。

兩邊的執行進度（月份／人數／buffer／Request）仍各自保存，沒有共用。

## 操作

- 全場預設只有「我的角色」1 人，新增人數可選 1～10 人，初始選擇為 1 人。既有觀眾持續觀看、搜尋、上傳與離開，持續人流只替換離開的觀眾，不會自行擴增總人數。可逐次加到 500 人；超過 100 時畫布抽樣顯示，指標計算全部 session。
- 點觀眾或用選單追蹤同一 session。拖曳觀眾跨區／進入右下弱網區，或用側欄調整位置、路由、五級網路。離線會先耗盡緩衝再等待；CDN 不能繞過最後一哩瓶頸。
- 點機器只選取。側欄提供關閉、恢復與同區加機。已在傳輸的請求會逾時，退避後選擇健康機器；CDN 不可用時回源。
- 單一 0.1 秒模擬時鐘控制所有工作。1x 等同真實時間，另有 5x／20x、暫停與單步。瀏覽器分頁隱藏時暫停，不補跑離開期間。
- 上傳使用教材 multipart 模型：建立 Metadata/session，客戶端 6 塊、最多 2 塊並行，原檔確認完整後檢查格式，再平行轉 360p／480p／720p 與縮圖，最後發布。每個階段使用同一 video ID。重試保留已確認塊／已完成任務，可關閉續傳作比較。
- 點 Request ID 可看機器路徑與每次重試。列表最新在前，可分頁與依使用者／機器／失敗篩選。聚焦列表按鈕時保留列表位置，離開焦點後繼續刷新；詳細 trace 仍更新。
- 自動故障首發在第 45 模擬秒，此後間隔 45–90 秒；預設 25 秒後修復。兩者均可關閉，手動故障仍可操作。事故紀錄包括受影響使用者、失敗嘗試、恢復與耗時。

## 檔案與驗證

- `youtube-world.js`：無 DOM、固定步長、可播種的共同狀態模型；`DESIGN_EFFECTS` 是與課程模式的唯一契約。
- `youtube-modes.js`：兩個模式的入口、各自的進度保存，以及共用的架構決策（`youtube-architecture-v1`）。
- `youtube-world-ui.js`：選取、拖曳、播放器、請求路徑、資料檢視。
- `youtube-world.css`：桌面／窄視窗版面；重要控制至少 44px，地圖角色另有選單等效操作。
- `tests/youtube-world.test.cjs`：使用 Node 內建測試工具，執行 `node --test software-learning/tests/youtube-world.test.cjs`。

20 個自動驗證涵蓋：100 個 session、斷網續播、弱網與 CDN、機器故障切換、續傳與不續傳、轉碼重派、新增據點不搬人口、播放時走動、持續人流、種子確定性、最新 Request 保留、CDN 故障回源；以及架構決策聯動的 7 項：兩套引擎詞彙一致、壞設定退回預設、熱備援機器數、DB 恢復時間、快取複本與 DB 回壓、轉碼容錯三種行為、熱門影片快取政策。

瀏覽器實測涵蓋桌面與窄視窗、弱網等待、背景持續運行、自動故障／恢復、按鈕關機／恢復、加機、加人、建立據點。正式部署尚未執行。

## 教學假設與邊界

這是瀏覽器內的教學模型，不傳送真實影音；Mbps、容量、任務工作量及故障時間是可比較的示例假設。上傳示範採 multipart，並非 YouTube Data API 的實際 sequential resumable upload 協定。初始化影片的前 5 秒視為已預載。

CDN 依地區、影片、畫質及片段記錄快取，沒有容量淘汰／TTL；流量有 bytes 與跨區計數，尚未套用真實價格。轉碼以工作量與相依任務模擬，失敗從該任務重做，沒有執行實際編碼或 GOP 切割。Metadata DB 是可用性與容量模型，沒有宣稱已模擬 Master 選主、複寫延遲、Quorum 或 DRM。原課程的進階策略仍保留在課程模式，沒有用無作用的開關加入新世界。

世界的設定與狀態目前在記憶體內，重新載入會重建。種子重設重播的是相同初始世界與隨機序列；若手動干預不同，結果也會不同。
