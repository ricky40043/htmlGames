# 🎮 小遊戲大集合

一個包含多種有趣小遊戲的靜態網站集合。

## 🎯 包含的遊戲

- 💣 **定時炸彈** - 緊張刺激的話題遊戲
- 🔢 **猜數字** - 經典的數字猜謎遊戲  
- 🔄 **2種人** - 有趣的分類問答遊戲
- 🎯 **你問我答** - 雙人互動問答遊戲
- 🕵️ **誰是臥底** - 經典的角色扮演遊戲
- 🎮 **2048** - 經典的數字拼圖遊戲

## 🚀 本地開發

```bash
# 啟動本地開發伺服器
npm run dev
```

然後訪問 `http://localhost:3000`

## 📦 部署到 Vercel

### 方法1: 使用 Vercel CLI (推薦)

1. 安裝 Vercel CLI:
```bash
npm i -g vercel
```

2. 登入並部署:
```bash
vercel login
vercel --prod
```

### 方法2: 使用 Git 部署

1. 推送到 GitHub
2. 在 Vercel 官網連接你的 GitHub 倉庫
3. 自動部署完成

## 🛠️ 技術架構

- 純靜態 HTML/CSS/JavaScript
- 響應式設計
- 音效支援
- PWA 就緒

## 📁 項目結構

```
├── index.html              # 主選單頁面
├── bomb-topic/            # 定時炸彈遊戲
├── guess-number/          # 猜數字遊戲
├── two-types-people/      # 2種人遊戲
├── two-player-quiz/       # 你問我答遊戲
├── who-is-spy/           # 誰是臥底遊戲
├── CascadeProjects/2048/  # 2048遊戲
├── vercel.json           # Vercel 配置
└── package.json          # 項目配置
```

## 🔮 未來擴展

這個項目已經為未來的功能做好準備：

- WebSocket 實時多人遊戲
- 用戶系統和積分榜
- 遊戲數據持久化
- API Routes 後端功能

---

Made with ❤️ 使用 Vercel 部署