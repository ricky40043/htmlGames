# 可調整工作區驗證

- 桌面拖曳架構圖與右側面板間的直向分隔線，可調整欄寬；操作面板與 LOG 間的橫向分隔線可分配高度。
- 760px 改成上下排列，第一條分隔線調整架構圖高度，第二條調整操作面板與 LOG。兩條皆支援觸控 Pointer Events 與方向鍵；Home／End 到尺寸界限。
- 比例保存在 localStorage `youtube-workbench-layout-v1`；重整保留，雙擊分隔線還原該方向，工具列「重設版面」還原全部。版面設定與模擬進度分開。
- 架構圖預設符合欄寬，仍可切換 100%／125%／150% 放大。

實測 1440×1000：滑鼠左拉 100px，右欄從 42% 增至 49.32%（674px）；向上拉 100px，操作面板 560→460px，LOG 240→340px。重整後三者保持。

驗證結果：Node 43/43；network-browser 33/33；workbench-browser 12/12。新增 simulator-resize-browser.js 在 1440px 和 760px 各 13/13，檢查填滿欄寬、方向、尺寸界限、上下空間分配、保存、切換頁籤、符合寬度、重設及無水平溢出。兩種視窗均檢視截图，瀏覽器無 JavaScript 錯誤。

```sh
npx --yes agent-browser open 'http://localhost:8782/system-design-simulator.html?chapter=sd-book-14'
npx --yes agent-browser set viewport 1440 1000
npx --yes agent-browser eval --stdin < software-learning/tests/simulator-resize-browser.js
npx --yes agent-browser set viewport 760 1000
npx --yes agent-browser eval --stdin < software-learning/tests/simulator-resize-browser.js
```
