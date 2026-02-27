# Med Sales Calendar 技術架構與選型分析

本文件總結了 `janet_sales_calender` 專案的技術堆疊與系統架構，作為未來重建專案的參考依據。

## 1. 系統架構概念

此專案採用標準的 **JAMstack** 架構，前端、後端（Serverless）、資料庫與爬蟲模組皆已模組化拆分，最大幅度地降低了伺服器維護成本與架設難度。

主要分為以下三個獨立運作的區塊：
1. **Frontend (前台 PWA App)**：供業務員使用的操作介面。
2. **Backend Services (驗證與資料儲存)**：依賴 Supabase 與 Vercel API 處理資料與帳號狀態。
3. **Crawler (自動化爬蟲)**：部署於 GitHub Actions，定期抓取資料並更新至資料庫。

---

## 2. 前端架構 (Frontend)

前台設計為一個以手機操作體驗為主的網頁應用程式，具備快取離線能力。

*   **核心框架**：`React 19` (搭配 TypeScript，確保型別安全機制)
*   **建置工具**：`Vite` (取代傳統的 Create React App，提供極速的冷啟動與 HMR)
*   **漸進式網頁應用 (PWA)**：使用 `vite-plugin-pwa` 套件。
    *   **優勢**：使用者能將網頁安裝至 iOS / Android 主畫面，隱藏瀏覽器網址列，體驗如同原生應用程式。
    *   **規格**：配置了 manifest (包含 `icons`, `theme_color` 等) 確保在各種裝置上的顯示效果。
*   **套件相依設計**：輕量化設計，推測未使用龐大的 UI 框架（如 MUI），而是使用原生 CSS 或模組化 CSS。

---

## 3. 資料儲存與驗證 (Database & BaaS)

核心業務邏輯與會員驗證皆委託給 Supabase，省去自建 Node.js / Express 後端的繁瑣工時。

*   **BaaS 平台**：`Supabase` (底層為 PostgreSQL) 
*   **資料操作**：前端透過 `@supabase/supabase-js` 官方 SDK 直接與資料庫溝通 (配合 Row Level Security 保障隱私)。
*   **身分驗證 (Authentication)**：深度整合 Supabase Auth。
    *   **Google OAuth**：支援使用者利用 Google 帳號直接登入，這是因為後續需要操作 Google Calendar。
*   **第三方行事曆整合**：取得使用者的 Google Calendar 授權 Token 後，直接透過前端與 Google API 互動，完成「寫入門診行程」與「讀取衝突行程」的雙向同步功能。

---

## 4. 後端 API (Serverless Functions)

雖然前端負責了大部分邏輯，但仍有部分需要保密或不適合在客戶端執行的程式碼。

*   **部署平台**：`Vercel`
*   **Serverless API**：位於根目錄的 `api/` 內（例如 `api/auth/google/`）。
    *   **用途**：處理 Google OAuth 較敏感的憑證交換 (如避免在前端暴露 Client Secret)。
    *   **輔助套件**：引入了 `jsonwebtoken` 協助簽發或解析自訂的 Token 驗證機制。

---

## 5. 爬蟲模組 (Crawler)

獨立的資料更新系統，負責定期自動化去各大醫院網站抓取門診表。

*   **執行環境**：`Node.js` + `TypeScript`
*   **爬蟲核心**：`Puppeteer`
    *   **優勢**：做為無頭瀏覽器 (Headless Browser)，能精確執行網頁中的 JavaScript 動態腳本，抓取依賴 AJAX 載入的門診表資料。
*   **執行腳本**：使用 `tsx` 套件直接在 Node 環境執行 TypeScript 程式碼（例如執行單一醫院的測試：`npm run crawl:ntuh`）。
*   **自動化 CI/CD**：整合 `GitHub Actions`。
    *   **排程執行**：透過 `.github/workflows/` 設定 Cron Job，定期觸發爬蟲。
    *   **資料寫入**：爬蟲執行完畢後，直接利用 `@supabase/supabase-js` (搭配 `SUPABASE_SERVICE_KEY` 最高權限) 將最新資料更新回主線資料庫。

---

## 總結

`janet_sales_calender` 的技術選型展現了現代化全端開發的優勢：**高效率、低維護、免自建伺服器**。
未來的重建工作可以完全依循此技術堆疊，並在此基礎上進一步優化 UI/UX 與程式碼結構。
