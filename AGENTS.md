# Repository Guidelines

## Project Structure & Module Organization
- 根目錄的 `index.html` 提供遊戲入口，主題遊戲分散於資料夾，例如 `two-player-quiz/`, `guess-number/`, `who-is-spy/` 等，每個資料夾包含對應的 `index.html`, `script.js`, `styles.css`。
- 公用文件與流程說明位於 `README.md`, `TODO_DEVELOPMENT_PLAN.md`, `FULL_SYSTEM_TEST.md`，部署腳本在 `deploy.sh`。
- 額外輔助資料（例如大型題庫）固定放在遊戲子資料夾，命名為 `*_complete.js` 以利自動載入。

## Build, Test, and Development Commands
- `npm run dev`：啟動簡易 Python HTTP 伺服器於 `http://localhost:3000`，用於瀏覽器內測試全部靜態遊戲。
- `npm run build`：佔位腳本，確認目前不需要額外建置程序；修改部署流程時先更新此腳本。
- `npm run start`：別名，等同 `npm run dev`，方便平臺型腳本呼叫。

## Coding Style & Naming Conventions
- JavaScript 與 CSS 皆採四空白縮排，保留分號與尾端逗號，避免多行模板字串中的多餘空白。
- 檔案命名使用小寫連字號或 snake_case（例如 `question_bank.js`）；大型資料集以 `*_complete.js` 命名。
- DOM 元素使用語意化 ID/class，例如 `#game-page`, `.option-btn`，並加上註解說明複雜流程。

## Testing Guidelines
- 目前未使用自動化測試；調整後請執行 `npm run dev` 並以多個瀏覽器視窗驗證互動、排版與語言顯示。
- 針對題庫或亂數邏輯，建議於瀏覽器主控台呼叫公開函式（如 `getQuestionsByFilter('medium','all',20)`）檢查結果是否多樣且無重複。
- 若新增測試框架，請在 `README.md` 與此文件更新執行指令與覆蓋率門檻。

## Commit & Pull Request Guidelines
- Commit 訊息採「動詞 + 目的」中文或英文簡述（例：`feat: expand global quiz dataset`），保持單一職責並附上影響範圍。
- PR 描述需列出：變更摘要、測試方式（含指令或手動情境）、相關連結（issue/設計稿）與截圖或錄影（若 UI 變動）。
- 在提交 PR 前，請自我檢查程式碼風格、資產路徑與部署腳本，確認不含開發中日誌或暫存檔。

## Security & Configuration Tips
- 本專案為靜態站點，禁止在版本庫內儲存 API 金鑰或使用者資料。
- 若需外部服務，請以 `.env.local` 於部署平臺設定環境變數，程式碼內僅引用 `process.env` 別名。
