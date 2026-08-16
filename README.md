# 🎮 小遊戲大集合

一個包含多種有趣小遊戲、學習工具與實用工具的靜態網站集合。

## 🎯 包含的遊戲

### 單機遊戲

- 💡 **冷知識大挑戰** - 1,000 題冷知識問答
- 🔢 **猜數字** - 經典數字猜謎
- 🎮 **2048** - 數字合併益智遊戲
- 🐍 **貪吃蛇** - 經典貪食挑戰

### 學習工具

- 💻 **軟體工程學習** - Python 演算法 + 系統設計互動課程；系統設計依 Alex Xu / ByteByteGo Volume 1 的 16 Chapter 架構逐章製作，目前完成 Chapter 1–12。每章拆成多個小節、小節練習與 30 題章末考，支援錯題診斷、回教材複習與 LocalStorage 學習紀錄。

### 聚會與靜態遊戲

- 💣 **定時炸彈** - 話題傳遞遊戲
- 🔐 **1A2B** - 猜數字推理
- 🎭 **2種人** - 分類問答遊戲
- 💬 **你問我答** - 雙人互動問答
- 🥁 **節奏接龍** - 可設定 BPM、玩家與回答拍數，依節奏輪流作答
- ㄅ **注音挑戰** - 隨機產生 2～5 個注音聲母，按空白鍵切換題目
- 🔗 **詞語接龍** - 指定分類、玩家與倒數秒數的限時輪流作答遊戲

### 實用工具

- 🕒 **全螢幕電子鐘** - 防休眠、可橫向顯示的電子鐘工具

### 多人連線遊戲

- 🐍 多人貪吃蛇
- 🕵️ 誰是臥底
- 👥 2種人連線版

## 🚀 本地開發

```bash
npm run dev
```

然後訪問 `http://localhost:3000`。

## 📦 部署到 Vercel

1. 將程式推送到 GitHub。
2. 在 Vercel 連接此 Repository。
3. 由 Vercel 自動部署。

## 🛠️ 技術架構

- 純靜態 HTML / CSS / JavaScript
- 響應式設計
- Web Audio API 節拍與音效
- SpeechSynthesis 題目播報
- LocalStorage 保存遊戲設定與學習進度
- 鍵盤與手機按鈕操作

## 📁 主要目錄

```text
├── index.html
├── trivia-quiz/
├── software-learning/
│   ├── index.html
│   ├── system-design.html
│   ├── system-design-chapter.html
│   ├── system-design-exam.html
│   ├── lesson.html
│   ├── exam.html
│   ├── progress.html
│   ├── app.js
│   ├── system-design-book.js
│   ├── styles.css
│   └── data/
│       ├── courses.js
│       ├── system-design-book-catalog.js
│       └── system-design-book-ch*.js
├── bomb-topic/
├── guess-number/
├── two-types-people/
├── two-player-quiz/
├── rhythm-chain/
├── bopomofo-challenge/
├── word-chain/
├── fullscreen-clock/
├── CascadeProjects/2048/
├── vercel.json
└── package.json
```

## 軟體工程學習模組

- **System Design 書本模式**：依 Alex Xu / ByteByteGo Volume 1 的 16 Chapter 結構逐章製作，目前完成 Chapter 1–12。
- 每個 System Design Chapter 拆成多個小節，每小節有教材頁與 3–5 題練習，最後再進行 30 題章末考。
- 章末考分為基礎、應用、進階三個層級；題目與選項每次重新洗牌。
- 錯題會顯示錯誤選項背後的 misconception、正確判斷與指定教材頁的複習連結。
- System Design 目前已完成：從零到百萬、粗略估算、面試框架、Rate Limiter、Consistent Hashing、Key-Value Store、Distributed ID、URL Shortener、Web Crawler、Notification、News Feed、Chat System。
- Python 演算法維持獨立課程路線。
- 第一階段不需要帳號、API 或資料庫；學習進度與成績保存在瀏覽器 LocalStorage，資料模型已預留未來後端/資料庫遷移空間。

## 新增遊戲操作

### 節奏接龍

- 設定 BPM、玩家人數、回答拍數與題目。
- 空白鍵代表回答成功並切換下一位玩家。
- 可開啟中文題目語音播報。

### 注音挑戰

- 設定題數與字數。
- 空白鍵下一題、方向鍵左鍵上一題、`R` 重新抽目前題目。

### 詞語接龍

- 設定玩家、倒數秒數、字數限制與題目。
- 玩家回答後按空白鍵，切換下一位並重置倒數。
- 倒數結束時停在輸家畫面，不會自動跳題。
