# 醫藥業務拜訪醫師門診資訊整合與週計畫系統 PRD

[To be written]

## 1. 產品背景與目標 (Product Background & Goals)
[To be written]

## 2. 目標受眾與使用情境 (Target Audience & Use Cases)
[To be written]

## 3. 系統架構與介面 (System Architecture & Interfaces)
[To be written]

## 4. 核心功能規格 (Core Features)
### 4.1 使用者端 (Front-end PWA)

#### 4.1.1 身份登入驗證 (Identity Login & Validation)
**目標**：確保業務員能快速登入系統，同時授權對其 Google 行事曆的完整讀寫權限，並支援首次登入的服務引導與後續的無縫 Token 刷新。

**規格細節**：
1. **登入方式與註冊**：
   - 僅支援 Google 帳號授權登入 (OAuth 2.0)，不開放一般 Email / Password 註冊。
   - **理由**：系統核心功能高度依賴自動新增與同步 Google Calendar 行程，強制使用 Google 帳號能確保服務體驗完整，減少不必要的設定斷點。
2. **退出與隱私功能**：
   - 提供「登出 (Sign Out)」功能，清除本地 Token。
   - 提供「刪除帳號 (Delete Account)」功能，呼叫後端 API 徹底清除資料庫使用者個人資料、相關行事曆綁定及關聯的紀錄，以符合 PWA 上架與隱私權規範。
3. **Google 授權範圍 (Scope)**：
   - 需要向 Google 請求 `https://www.googleapis.com/auth/calendar.events` (讀取與寫入特定日曆活動) 以及必要的 `email`、`profile` 權限。
   - 獲取寫入權限的目的是為了透過本系統，手動或自動為業務員在 Google Calendar 上建立未來一週的門診拜訪行程。
4. **授權狀態維護 (Refresh Token)**：
   - 前端需保存 Refresh Token 並於 Access Token 過期時進行背景自動刷新 (Silent Refresh)。
   - **異常處理**：若 Refresh Token 也失效 (例如 Google 端撤銷授權)，則強制將使用者登出並導向回登入頁，出現 Toast 提示「Google 授權已過期，請重新登入」。
5. **首次登入引導 (Onboarding)**：
   - 系統需判斷使用者是否為首次登入 (透過 DB flag 如 `is_onboarded` 判斷)。
   - 首次登入成功後，不直接進入主畫面，而是進入 3 頁式的 Onboarding 輪播引導頁 (介紹搜尋醫師、關注、排程功能簡介)，使用者點擊「開始使用」後才正式進入主畫面。

#### 4.1.2 訂閱狀態與權限管理 (Subscription & Permission)
**目標**：在統一採用 Google 登入的前提下，建立穩定且防弊的 SaaS 月租訂閱身分識別與升級機制。

**規格細節**：
1. **身分綁定 (Identity Binding)**：
   - 使用者在金流端（例如 Stripe, 藍新, 或綠界）的訂閱紀錄，將強制綁定其**登入時的 Google Email 地址**與系統生成的唯一 `user_id`。
   - 系統依據登入當下的 `user_id` 查詢 DB 中的 `subscription_status` (值：`free_trial`, `active`, `past_due`, `canceled`)。
2. **免費試用與權限管控設計**：
   - **試用期**：新帳號自動啟用 14 天 `free_trial`，期間開放全功能使用（含 Google Calendar 寫入）。
   - **過期或未訂閱狀態**：當 `subscription_status` 轉為非 `active` 時，系統自動實施 **功能降級 (Graceful Degradation)**：
     - 保留「讀取」權限：可查看已關注的醫師、過往的排程紀錄、私密筆記。
     - 鎖定「寫入/核心功能」：禁用「新增/修改排程」、「寫入 Google 行事曆」、「解鎖最新門診表」等功能。
     - 點擊被鎖定功能時，彈出「訂閱解鎖視窗」導向付款頁面。
3. **金流狀態同步 (Webhook)**：
   - 後端設置 Webhook 接收金流平台發送的狀態變更通知 (如扣款成功、取消訂閱)，並自動更新使用者 DB 中的 `subscription_status` 與 `current_period_end`。
   - 前端應用程式啟動或重整時，向後端發送一次輕量 API 檢查最新訂閱狀態，同步至客戶端 Global State。
4. **帳號異常與設備限制**：
   - 為了防範多人共用同一 Google 帳號與付費方案，系統需實作單一帳號的 Session 限制（例如最多允許 2 台裝置同時登入），超出限制時強制登出舊裝置。

### 4.2 管理者端 (Back-end Web)
[To be written]

## 5. 資料與整合邊界 (Data & Integration Boundaries)
[To be written]

## 6. 非功能需求 (Non-Functional Requirements)
[To be written]
