# 上傳進度與分流紀錄驗證

## 行為

- 觀看、上傳、查詢各保留最近 200 筆紀錄。切換活動分頁同時切換紀錄；失敗摘要、清除、閱讀位置各自處理。共同的架構操作會記入三類，背景請求不拉動目前的紀錄。
- 上傳顯示完整確認的容量／總容量、百分比、已確認傳輸組數，以及正在傳送或失敗的 P 編號。半包不算完成；全部分支成功後才顯示上架。
- 失敗提示與重傳按鈕置於活動面板上方，不受面板內部捲動遮蔽。開啟斷點續傳保留確認封包，否則從 P1 重傳。
- 重新載入頁面後，可重建同一筆請求的重傳操作。缺少逐包紀錄的舊失敗請求明確標示容量無法確認，從 P1 重傳同一影片。

## 實測

桌面 1440 × 1000、窄視窗 760 × 1000：280 MB 影片在 P3 斷線，保留 P1、P2 共 92 MB，顯示 32%、2/6 組完成、P3 失敗，P4–P6 未送出。重整後從 P3 接續，影片 ID 不變，不新增重複影片；完成顯示 100%。舊無逐包紀錄的請求亦可從 P1 完成重傳。兩種視窗都看得到獨立重傳提示，無頁面水平溢出，瀏覽器無 JavaScript 錯誤。

## 測試結果

- Node 套件：43/43 通過（network、runtime-concurrency、youtube-world、interactive-blocks；包含原本 world 的 20 項契約測試）。
- 既有瀏覽器回歸：network 33、workbench 12、activity 21、regions 42 全通過。
- packets：桌面、760px 各 35/35 通過。
- 新增 upload-recovery：桌面、760px 各 31/31 通過（3 階段：13 + 10 + 8）。
- 新增 scoped-trace：桌面、760px 各 9/9 通過，包含每類 200 筆上限、獨立清除，以及背景訊息不干擾閱讀位置／未讀數。

## 重現方式

以 HTTP server 提供 software-learning 目錄，開啟 system-design-simulator.html?chapter=sd-book-14。

```sh
node --test software-learning/tests/simulator-network.test.cjs software-learning/tests/simulator-runtime-concurrency.test.cjs software-learning/tests/youtube-world.test.cjs software-learning/tests/check-interactive-blocks.js
npx --yes agent-browser open 'http://localhost:8782/system-design-simulator.html?chapter=sd-book-14'
npx --yes agent-browser eval --stdin < software-learning/tests/simulator-upload-recovery-browser.js
npx --yes agent-browser reload
npx --yes agent-browser eval --stdin < software-learning/tests/simulator-upload-recovery-browser.js
npx --yes agent-browser reload
npx --yes agent-browser eval --stdin < software-learning/tests/simulator-upload-recovery-browser.js
npx --yes agent-browser eval --stdin < software-learning/tests/simulator-scoped-trace-browser.js
```

每次完整重跑 recovery 使用新的瀏覽器 session；760px 驗證先設定 viewport。workbench 測試接在 network 後執行，其餘既有流程各自用新 session。
