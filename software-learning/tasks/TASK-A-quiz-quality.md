# 任務 A：修正既有題庫的出題品質

**狀態**：待處理
**基準 commit**：`cc2f849`（請從這之後開分支）
**預估影響範圍**：9 個資料檔 + 1 個新測試檔
**與任務 B 的關係**：完全不重疊，可同時進行

---

## 1. 問題

第 14、15、17 章（YouTube、Google Drive、Google 地圖）的 236 題選擇題有一個系統性的
出題瑕疵：**正解幾乎總是最長的那個選項**。學生不看內容、每題挑最長的，就能答對八成以上。

典型的壞例子（取自 ch14）：

```
Q: 為什麼影片串流刻意不經過 API 伺服器？
 ✔ (37字) 影片位元組的量太大，讓它經過 API 伺服器等於把整條頻寬壓在自己的機器上
 ✘ (18字) 因為 API 伺服器不支援二進位資料
 ✘ (11字) 因為 CDN 比較安全
```

成因是把「為什麼」寫進了正解本身，而誘答只寫一句短的。

## 2. 現況量測

| 章 | 小節練習 | 正解最長 | 章末考 | 正解最長 |
| --- | --- | --- | --- | --- |
| ch14 | 50 題 | 96% | 30 題 | 77% |
| ch15 | 48 題 | 94% | 30 題 | 83% |
| ch17 | 48 題 | 67% | 30 題 | 70% |

合計 **236 題**：

- 正解剛好是最長選項：**194 題（82%）**——隨機出題應該接近 33%
- 「明顯偏長」：**83 題（35%）**（定義：正解字數 > 誘答平均字數 × 1.8，且多出 10 字以上）

## 3. 範圍

只修改以下檔案裡的**選項文字**：

```
software-learning/data/system-design-book-ch14-part1.js
software-learning/data/system-design-book-ch14-part2.js
software-learning/data/system-design-book-ch14-final.js
software-learning/data/system-design-book-ch15-part1.js
software-learning/data/system-design-book-ch15-part2.js
software-learning/data/system-design-book-ch15-final.js
software-learning/data/system-design-book-ch17-part1.js
software-learning/data/system-design-book-ch17-part2.js
software-learning/data/system-design-book-ch17-final.js
```

題目結構（`MC` 是各檔案上方定義的 helper）：

```js
MC(id, 題幹, reviewPageId, 解析, 正解文字, [[誘答文字, 誤區說明], ...])
```

`finalExam` 陣列裡的題目結構相同，另有 `difficulty` 欄位（easy／medium／hard）。

### 不可以動的東西

- 題幹
- 解析（explanation）
- `reviewPageId`
- `difficulty`
- 題目的新增或刪除
- 任何 page 的 `blocks` 內容
- `data/system-design-book-interactive-ch*.js`（那是另一批已經修好的題目）

## 4. 做法

把塞在正解裡的「理由」移到原本就會顯示的說明欄位——誘答的第二個元素是誤區說明，
正解的理由應該在該題的 `explanation` 裡呈現。正解只留核心主張，誘答太短的補到相當長度，
讓三個選項的字數落在同一個區間。

上面那題修好之後會變成：

```
 ✔ (19字) 影片位元組量太大，會壓垮自家機器的頻寬
 ✘ (20字) 因為 API 伺服器不支援傳輸二進位資料
 ✘ (14字) 因為走 CDN 的安全性比較好
```

### 現成的參考實作

`software-learning/data/system-design-book-interactive-ch14.js`（以及 `-ch15`、`-ch17`）
裡的 111 題 probe 已經用同一套手法修過，可直接對照。那批從「正解最長 95%」降到 38%、
「明顯偏長」降到 0%，共改寫 251 個選項。

## 5. 順帶處理：4 題題幹逐字重複

ch15 有 4 組小節練習與章末考的題幹**完全相同**。章末考複習小節內容是合理的，但逐字重複
會讓章末考變成記憶測驗而非理解測驗。請把**章末考那一題**改寫成不同的切入點
（例如從「這是什麼」改成「拿掉它會失去什麼」「在什麼情況下這個答案會變」）：

| 小節練習 | 章末考 | 重複的題幹 |
| --- | --- | --- |
| `sd15-s01-q3` | `sd15-ex-e02` | 排在第一位的非功能需求是？ |
| `sd15-s02-q2` | `sd15-ex-e04` | 上傳 API 的峰值 QPS 約為？ |
| `sd15-s06-q2` | `sd15-ex-e07` | API 伺服器負責什麼？ |
| `sd15-s11-q4` | `sd15-ex-m09` | 為什麼版本歷史會讓儲存成本暴增？ |

改寫後答案仍必須在教材裡查得到，且 `reviewPageId` 要指向正確的頁。

## 6. 交付物

1. 上述 9 個資料檔的修改。
2. **新增 `software-learning/tests/check-quiz-quality.js`**——把量測寫成自動化測試，
   比照同目錄 `check-interactive-blocks.js` 的寫法（用 `node:vm` 載入資料檔、接上
   `node:test`、失敗時印出是哪一題哪個選項）。這支測試要能擋住未來新增的題目再犯同樣問題，
   長期價值比修完這 236 題更高。

## 7. 驗收標準

全部必須達成：

- 「明顯偏長」= **0 題**
- 「正解剛好最長」≤ **40%**
- 任一題的「正解字數 − 最長誘答字數」≤ **5**
- 每題仍剛好 1 個正解；每個誘答都有非空的誤區說明
- 4 組重複題幹已無逐字重複
- 下列指令全過：

```bash
cd software-learning
node --test tests/youtube-world.test.cjs tests/check-interactive-blocks.js tests/check-quiz-quality.js
```

## 8. 注意事項

- 全部是繁體中文內容，請維持與既有教材一致的用語與語氣。
- 資料檔是手寫的 JS 物件字面量，改完務必對每個檔案跑 `node --check`。
- 不要為了湊字數寫出不自然的中文。寧可把正解再縮短，也不要把誘答灌水。
- 選項字數相近不是目的，「不能只靠長度猜答案」才是。判斷不確定時，以後者為準。
