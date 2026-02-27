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

#### 4.1.3 智慧尋醫與目標關注 (Targeting & Search)
**目標**：淘汰傳統紙本名片與筆記本，提供快速檢索專屬醫師的介面，並管理個人 Target 名單。

**規格細節**：
1. **搜尋引擎**：首頁提供搜尋列，支援輸入「醫院名稱」、「行政區」、「科別」或「醫師姓名」。
2. **醫師個人資訊頁 (Doctor Profile)**：點擊特定醫師後進入專屬頁面，呈現門診時段與過往看診資訊，並提供按鈕可將其加入/移除「我的關注」。
3. **Zero-Entry 筆記系統 (Smart Notes)**：
   - **自由文字方塊**：在醫師個人頁面中，提供單一的大範圍私密備忘錄（例如記錄「習慣喝 50 嵐無糖綠」），此筆記受資料庫 RLS 保護僅建立者本人可見。
   - **自動抓取拜訪軌跡**：系統透過後端比對 Google Calendar 行程，在醫師個人資訊頁上自動計算並顯示「上次拜訪日期」與「預計下次拜訪日期」，免除業務手動維護 CRM 欄位的負擔。
4. **離線快取 (Offline Access)**：進入「我的關注」清單與查看醫師個人頁面（含備忘錄）時，系統需支援離線存取，確保業務在醫院地下室診間等網路死角，仍可無縫查閱歷史筆記與目標名單。

#### 4.1.4 門診表建檔管理 (Admin Data Entry - MVP 階段)
**目標**：確保 MVP 階段門診表資料的品質與結構一致性，暫緩前台使用者的參與，集中由官方（管理者團隊）處理原始門診表。

**規格細節**：
1. **後台上傳與解析工作流 (Admin Workflow)**：MVP 階段不開放一般業務於前台上傳門診表。所有門診表（PDF 或連結）皆由管理者從後台系統匯入。
2. **結構化解析挑戰 (Data Extraction Pipeline)**：後端系統需實作一套半自動化的門診表解析介面：
   - 上傳 PDF 後，後台嘗試提取文字並呈現預覽，讓管理者框選或核對「時間、科別、醫師」。
   - 解析成功核對無誤後，管理者點擊確認寫入正式資料庫 (`timetables` table)，供前台業務查詢。
   - 此技術模組為本 MVP 成敗最核心的技術挑戰點。
3. **版本資訊呈現**：前台門診表頁面僅需低調顯示「資料最後更新時間：YYYY-MM-DD」，不須掛名上傳者。

#### 4.1.5 Google Calendar 的彈性綁定與解綁流程 (Calendar Integration)
**目標**：考量業務的「手機登入 Google 帳號」與「公務用行事曆 Google 帳號」可能是兩個不同的 Email，系統必須提供彈性的授權切換與獨立管理機制。

**規格細節**：
1. **帳號解耦設計 (Decoupled Authentication)**：
   - 登入帳號：提供系統身分識別（如 `abc@gmail.com`）。
   - 行事曆授權帳號：使用者可在「系統設定頁」手動連動另一個公務用的 Google 帳號（如 `abc.work@workdomain.com`），僅授權給日曆讀寫 API 使用。
2. **授權狀態與解綁 (Revoke Access)**：
   - 設定頁中明確顯示「目前綁定之行事曆帳號」。
   - 提供「解除綁定」按鈕，使用者點擊後系統會立即清除伺服器端存留的該帳號 Refresh Token 與 Access Token，終止所有行程同步。
   - 解綁後，與行事曆相關之下週排程、衝突警告等核心功能將被鎖定或降級，直到重新綁定有效帳號。
3. **獨立的專屬行事曆 (Dedicated Sub-Calendar)**：
   - 獲得授權後，系統會透過 API 在授權的 Google 帳號下自動建立一個特定的子行事曆（例如命名為 `Janet Sales Calendar`）。
   - 往後所有透過本系統新增的行程，都會預設寫入此獨立子日曆中，與使用者的私人會議區隔，保持日曆畫面整潔。

#### 4.1.6 下週排程與雙向同步 (Smart Scheduling & Two-way Sync)
**目標**：作為業務的「單一工作站」，消弭門診表與行事曆之間的切換成本，並幫助業務成功拜訪到必需成功拜訪的對象。

**規格細節**：
1. **多方向觸發建立流程 (Multi-entry Scheduling)**：
   - **從醫師切入**：使用者可搜尋/選擇特定醫師，系統直接展開該醫師「下週可拜訪的門診時段」。使用者勾選時段後點擊「一鍵排程」，即自動生成對應時間與地點的行事曆事件。
   - **從日曆切入**：使用者在系統的「排程檢視」畫面點擊空白時段新增行程，系統提供下拉選單讓使用者「關聯特定醫師/醫院」，選擇後自動帶入門診表資訊。
2. **衝突偵測機制 (Soft Conflict Warning)**：
   - 系統在建立行程前，會呼叫 Google API 抓取使用者「所有開啟的行事曆」行程。
   - 只要「同一天」內的「同一個大時段（上午/下午/夜間）」出現了兩家「不同醫院」的行程，介面上會跳出「⚠️ 醫院跨區時段重疊警告」。
   - 警告僅作視覺提示，使用者仍可點擊「確認儲存」強行排入行程。
3. **即時雙向同步 (Real-time Two-way Sync)**：
   - 在本系統新增/刪除行程，同步更新至指定的 Google Calendar 子日曆；若在 Google Calendar 進行變更，本系統亦反映更新。

#### 4.1.7 每日門診異動總覽 (Daily Digest Notification)
**目標**：確保業務能掌握「關注醫師」的門診異動，同時避免被海量推播轟炸。
* **排程彙整與發送**：建立背景任務（Cron Job），每天早上彙整過去 24 小時內「關注名單」中醫師的門診表變動，發送一則推播總覽。
* **展示內容**：點擊通知後進入專屬頁面，列出「新增門診」、「取消/代診」或「超過 30 天未拜訪提醒」。

### 4.2 管理者端與進階功能 (Back-end Web & Future Roadmap)
- [Admin] 提供管理者介面審核 UGC 門診表與 User 管理。
- [Backlog] 醫師群組分類與標籤系統：允許業務自行用標籤（例如：重點攻堅、A級客戶、北投區）來分類與篩選醫師。此功能列為未來加分項目，非短期必備。

## 5. 資料與整合邊界 (Data & Integration Boundaries)
- **Google Calendar API**：PWA 需完整授權以達到讀寫雙向同步。
- **Supabase Authentication**：強制透過 Google OAuth 解決方案進行。

## 6. 非功能需求 (Non-Functional Requirements)
- **Mobile First**：UI/UX 設計以 iPhone 13 尺寸與 Safari 瀏覽器為首要適配目標。
- **Offline Cache**：PWA 需支援關注清單與最近一週行程的離線存取，以便網路不佳時查閱。
