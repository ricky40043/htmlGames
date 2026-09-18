# 任務 B：修正世界模擬的推進策略與容量牆提示

**狀態**：待處理
**基準 commit**：`cc2f849`（請從這之後開分支）
**預估影響範圍**：`youtube-world.js`、`youtube-world-ui.js`、`youtube-world.css`、測試、文件
**與任務 A 的關係**：完全不重疊，可同時進行

---

## 0. 背景：這是什麼東西

第 14 章「設計 YouTube」有兩個模擬模式：

- **架構設計**（`?chapter=sd-book-14`）：12 個月、8 項架構決策、7 個故障事件的策略遊戲
- **實際運作**（`?chapter=sd-book-14&mode=world`）：本任務的對象。一個連續時間的世界，
  1～500 個觀眾持續觀看、搜尋、上傳，可以拖人、關機器、看每一筆 request 的重試路徑

世界模型是無 DOM、固定 0.1 秒步長、可播種、確定性的（相同 seed + 相同操作 → 相同結果）。

本機預覽：

```bash
cd software-learning && python3 -m http.server 8777
# 開 http://localhost:8777/system-design-simulator.html?chapter=sd-book-14&mode=world
```

主要檔案：

| 檔案 | 內容 |
| --- | --- |
| `software-learning/youtube-world.js` | 無 DOM 的模型（約 460 行） |
| `software-learning/youtube-world-ui.js` | UI 與 `requestAnimationFrame` 迴圈 |
| `software-learning/youtube-world.css` | 樣式 |
| `software-learning/tests/youtube-world.test.cjs` | 現有 20 項測試，一項都不能壞 |
| `software-learning/YOUTUBE-WORLD.md` | 文件，需一併更新 |

---

## 1. 問題一：dt 夾限造成掉幀惡性循環

`youtube-world-ui.js` 的 frame 迴圈目前是：

```js
const dt = Math.min(.25, (now - last) / 1000); last = now;
if (!paused && !document.hidden) {
    accumulator += dt * speed;
    while (accumulator >= .1) { world.step(.1); accumulator -= .1; }
}
if (now - painted > 250) { paint(); painted = now; }
```

速度選項是 **1x / 5x / 20x**。正常 60fps 下 20x 每幀推進 0.33 模擬秒（約 3.3 個 tick），
沒有問題。但只要有一幀變慢，`dt` 會被夾到 0.25 秒，×20 = **5 模擬秒 = 50 個 tick**，
下一幀就更慢，形成惡性循環。

實測的模型層成本（純模型，不含 DOM，在 M 系列 Mac 上）：

| 人數 | 平均 ms/tick | 20x 正常幀（約 3.3 tick） | 20x 補跑幀（50 tick） |
| --- | --- | --- | --- |
| 100 | 0.33 | 1.1 ms | 17 ms |
| 300 | 1.01 | 3.3 ms | 50 ms |
| 500 | 1.84 | 6.1 ms | **92 ms** |

60fps 的預算是 16.7 ms/幀。補跑幀在 300 人就已經吃光，500 人直接爆掉，而爆掉又會讓下一幀
的 `dt` 更大——這就是惡性循環。

### 要做什麼

設計一個不會失控的推進策略。可考慮的方向（不限於此，請自己判斷）：

- 限制每幀最多推進幾個 tick，讓模擬時間誠實地落後而不是硬補
- 依實測的 tick 成本動態調整每幀的推進量
- 無法維持選定速度時自動降速，並明確告訴使用者「目前只能跑到 N 倍」

### 硬性限制

**不可以用「偷偷跳過模擬」的方式。** 這個世界的賣點就是確定性與可重播——相同 seed
必須得到相同結果。現有測試 `seeded clock produces identical outcomes regardless of
frame batching` 會守這一條。落後是可以接受的，跳過不行。

---

## 2. 問題二：容量牆完全沒有提示

介面寫著「可逐次加到 500 人」，但預設的機器數撐不住。實測（關掉自動故障，純看容量）：

| 人數 | 再緩衝比例 | 請求失敗率 | 佇列 |
| --- | --- | --- | --- |
| 50 | 24.2% | 0.0% | 13 |
| 100 | 47.4% | 10.6% | 54 |
| 300 | 68.2% | 39.7% | 257 |
| 500 | 75.9% | 51.9% | 466 |

超過 50 人世界就開始塞，100 人以上基本上是持續崩潰，而畫面上完全沒有任何提示。

### 真正的瓶頸是共用後端，不是前端

真正的瓶頸是**只有 1 台、只在美國的物件儲存（storage）**。實測（300 人）：

| 加機方式 | 再緩衝 | 失敗率 |
| --- | --- | --- |
| 每區前端 +0 台 | 68.2% | 39.7% |
| 每區前端 +3 台 | 27.9% | 5.7% |
| 每區前端 +7 台 | **41.5%** | **17.5%** ← 加更多反而更糟 |
| 每區前端 +7 台，且物件儲存 +3 台 | **1.2%** | **0.0%** |

只加前端會讓更多請求同時擠向物件儲存，反而更慢。

這其實是很好的教學點——**瓶頸會移動，加錯地方等於白加**——但目前完全看不出來，
學生只會覺得「我加了機器結果更爛」。

### 要做什麼

讓瓶頸變得看得見。方向建議（實作方式請自己判斷）：

- 在指標列或機器卡片上標出「目前的瓶頸是誰」（例如佇列最長／使用率最高的那一種機器）
- 加人時若容量明顯不足，給出可操作的提示，而不是只寫「可加到 500 人」
- 讓人知道「同區加一台」之外，共用後端（storage / db / worker）也可以加

---

## 3. 不可以改動的部分

`youtube-world.js` 裡的這幾塊是「架構設計」模式與世界模型之間的契約，另有測試在守，
改了會連動另一個模式：

- `DESIGN_DEFAULTS`
- `DESIGN_EFFECTS`
- `normalizeDesign`
- `repairSeconds`
- `applyDesignOptions`
- `tickAutoscale`

若要新增機器種類，記得 `TYPES`、`addMachine` 的 `capacity`／`slots`、以及 UI 的機器卡片
都要一起處理。

---

## 4. 交付物

1. 上述兩個問題的修正。
2. 新增測試到 `software-learning/tests/youtube-world.test.cjs`，至少涵蓋：
   - 慢幀不會造成模擬時間暴衝
   - 確定性仍然成立
   - 瓶頸判定在已知情境下給出正確答案（例如 300 人、預設機器數 → 物件儲存）
3. 更新 `software-learning/YOUTUBE-WORLD.md`。目前文件寫「可逐次加到 500 人；超過 100 時
   畫布抽樣顯示」，請補上實際的容量行為與新的推進策略。

---

## 5. 驗收標準

- 下列指令全過（現有 20 項測試一項都不能壞）：

  ```bash
  cd software-learning
  node --test tests/youtube-world.test.cjs tests/check-interactive-blocks.js
  ```

- 500 人 + 20x 時不再出現持續惡化的掉幀
- 在 300 人、預設機器數的情況下，介面能明確指出瓶頸是物件儲存
- 瀏覽器 console 無 JS 錯誤（桌面與 760px 窄視窗都要檢查）

---

## 6. 注意事項

- 全部是繁體中文介面，請維持既有的用語風格。
- 這是教學模擬器，不是效能競賽。任何修正都不能讓「為什麼會塞住」變得更難理解——
  如果為了跑得順而藏起了塞車的過程，那就本末倒置了。
