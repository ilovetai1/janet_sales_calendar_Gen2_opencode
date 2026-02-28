# 醫藥業務拜訪醫師門診資訊整合與週計畫系統 PRD

## 1. 產品背景與目標 (Product Background & Goals)
**背景**：
醫藥業務（Sales Reps）日常的核心工作是拜訪各醫院的醫師。然而，各大醫院的門診時間表散落各處，且經常異動。業務員往往依賴紙本、手機相簿截圖或反覆查詢醫院網頁，且需手動將這些時段比對、謄寫至自己的行事曆 App 中，過程繁瑣且極易出錯。

**目標**：
打造一款專為醫藥業務設計的「單一工作站 (Single Source of Truth)」排程系統。將「搜尋醫師門診表」、「紀錄拜訪筆記」與「排入個人行事曆」三個動作無縫整合。透過提供極致便利的 SaaS 工具，為使用者省下每週數小時的行政排程時間，進而提高拜訪效率與成功率。

## 2. 目標受眾與使用情境 (Target Audience & Use Cases)
**目標受眾 (TA)**：
- 第一線醫藥業務員（主要使用者），高度依賴行動裝置。
- 需要管理多間醫院、多位重點醫師的拜訪行程。

**核心使用情境**：
1. **名單建立**：剛接手新區域，透過系統快速搜尋特定行政區的目標科別醫師，建立專屬的「我的關注 (My Follows)」名單。
2. **高效排程**：每週日晚上規劃下週行程時，不用再開一堆網頁。直接點開「關注名單」，系統自動列出這些醫師下週有診的時段，一鍵點擊即可塞入 Google Calendar。
3. **隨時查閱筆記**：在醫院地下室等訊號死角準備推開診間門前，打開 App 離線查看該醫師的私人筆記（例如「愛喝無糖綠」）以及系統算出的「上次拜訪是 14 天前」。
4. **隨手回報**：跑醫院時若看到牆上貼了新的紙本門診表異動，隨手拍照上傳系統，賺取次月 SaaS 訂閱費折扣。

## 3. 系統架構與介面 (System Architecture & Interfaces)
**技術堆疊與架構**：
- **前端 (Front-end)**：採用 React 19 (TypeScript) 搭配 Vite，建構為 PWA (Progressive Web App)，以確保流暢的 Mobile-first 體驗與離線快取能力。
- **後端與 API (Back-end)**：採用 Serverless 架構（如 Vercel Functions）處理門診表解析邏輯與 Google Calendar API 的雙向同步。
- **資料庫與身分驗證 (Database & Auth)**：全面採用 Supabase。使用 PostgreSQL 儲存使用者、筆記與門診時段，並嚴格套用 RLS (Row Level Security) 確保資料隔離；使用 Supabase Auth 串接 Google OAuth 2.0 作為唯一登入管道。

**主要介面劃分**：
1. **使用者端 (Frontend PWA)**：包含首頁搜尋、我的關注、排程行事曆視窗、醫師個人資訊頁（含私密筆記）、設定與訂閱頁面。
2. **管理員端 (Admin Web App)**：一個獨立的後台介面，供官方團隊審核 UGC 上傳的門診表、使用半自動 OCR 介面（雙欄對照與重新框選）進行資料清洗，並管理 SaaS 訂閱用戶狀態。

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
   - 前端應用程式啟動或重整時，向後端發送一次輕量 API (如 `/me/status`) 檢查最新訂閱狀態與當期到期日，同步至客戶端 Global State。
4. **帳號異常與設備限制**：
   - 為了防範多人共用同一付費方案，系統需實作單一帳號的最大同時登入限制（設定為最多 3 台裝置）。
   - 前端每次啟動或固定間隔時透過心跳機制 (`POST /functions/v1/heartbeat`) 向 `user_sessions` 報備，若超出容許數量，則依據 `last_active_at` 強制踢除最舊的連線並導出登出畫面。

#### 4.1.3 智慧尋醫與目標關注 (Targeting & Search)
**目標**：淘汰傳統紙本名片與筆記本，提供快速檢索專屬醫師的介面，並管理個人 Target 名單。

**規格細節**：
1. **搜尋引擎**：首頁提供搜尋列，支援輸入「醫院名稱」、「行政區」、「科別」或「醫師姓名」。（技術備註：MVP 階段採基本關鍵字模糊比對，暫不建立如「北榮 / 台北榮總」之官方同義詞庫）
2. **醫師個人資訊頁 (Doctor Profile)**：點擊特定醫師後進入專屬頁面，呈現門診時段與過往看診資訊，並提供按鈕可將其加入/移除「我的關注」。
3. **Zero-Entry 筆記系統 (Smart Notes)**：
   - **自由文字方塊**：在醫師個人頁面中，提供單一的大範圍私密備忘錄（例如記錄「習慣喝 50 嵐無糖綠」），此筆記受資料庫 RLS 保護僅建立者本人可見。
   - **自動抓取拜訪軌跡**：系統透過前端發送 API (`GET /rest/v1/active_appointments`) 讀取使用者過去與未來的行事曆行程，在醫師個人資訊頁上自動計算並顯示「上次拜訪日期」與「預計下次拜訪日期」，免除業務手動維護 CRM 欄位的負擔。
4. **離線快取 (Offline Access)**：進入「我的關注」清單與查看醫師個人頁面（含備忘錄）時，系統需支援離線存取，確保業務在醫院地下室診間等網路死角，仍可無縫查閱歷史筆記與目標名單。

#### 4.1.4 眾包式的門診表管理 (UGC PDF Upload & Incentive)
**目標**：透過業務隨手查核與上傳門診表來補足自動爬蟲的不足，並給予 SaaS 訂閱費折扣作為誘因，確保門診資料的即時性。

**規格細節**：
8. **混合上傳體驗 (Hybrid Workflow)**：使用者可透過照片、PDF 檔案或外部醫院網址連結 (`source_type`) 提交門診表。上傳後系統嘗試解析，若 10 秒內成功立刻展示預覽；若超時則轉移為背景任務，提示等待通知。
2. **上傳驗證與防呆 (Validation & Anti-duplication)**：
   - 使用者提交時，必須選擇 `target_month` 與目標醫院。
   - 系統防呆檢查：透過檔案的 Payload Hash 檢查是否已有相同醫院、相同檔名或相同內容的記錄被提交，若重疊則阻擋上傳 (以防止同業重複衝積分)。
3. **管理員後台退路 (Admin Fallback)**：當格式過於特殊系統徹底無法解析時，該任務將自動轉入系統後台 Pending 區，統一由「管理員/工程團隊」手動建檔處理。不強制開放前台讓使用者 Key-in，以確保資料結構一致性。
*(註：關於後台如何處理 PDF 解析、重新框選辨識區域等詳細流程，請參見 `PRD_OCR_Extraction.md`)*
4. **貢獻獎勵與反惡意機制 (Reward Mechanism)**：
   - **任務獎勵**：系統結算每月貢獻，紀錄至 `contribution_ledger`。當月有效成功歸檔達 N 份門診表，次月折抵月費。
   - **防弊檢查 (Report System)**：若該份資料上線後，被其他業務點擊「報錯/檢舉」，建立至 `submission_reports` 並經管理員確認為惡意提供假檔案（如：餐廳菜單），系統將拔除該月之貢獻計算資格甚至停權。
5. **版本資訊呈現**：門診表頁面僅需低調顯示「資料最後更新時間：YYYY-MM-DD」，不須掛名上傳者，保持去中心化。

#### 4.1.5 下週排程與 Google Calendar 雙向同步 (Smart Scheduling & Two-way Sync)
**目標**：作為業務的「單一工作站」，消弭門診表與行事曆之間的切換成本，並透過獨立日曆管理業務拜訪行程。

**規格細節**：
1. **獨立的專屬行事曆 (Dedicated Calendar)**：
   - 首次登入並獲得授權後，系統會透過 API 在使用者的 Google 帳號下自動建立一個特定的行事曆（例如命名為 `Janet Sales Calendar`）。
   - 往後所有透過本系統新增的行程，都會預設寫入此獨立日曆中，與使用者的主要/私人行事曆完全切分開來，保持畫面整潔。
2. **多方向觸發建立流程 (Multi-entry Scheduling)**：
   - **從醫師切入**：使用者可搜尋/選擇特定醫師，系統直接展開該醫師「下週可拜訪的門診時段」。使用者勾選時段後點擊「一鍵排程」，即自動生成對應時間與地點的行事曆事件。
   - **從日曆切入**：使用者在系統的「排程檢視」畫面點擊空白時段新增行程，系統提供下拉選單讓使用者「關聯特定醫師/醫院」，選擇後自動帶入門診表資訊。
3. **衝突偵測機制 (Soft Conflict Warning)**：
   - 系統在建立行程前，會呼叫 Google API 抓取使用者「所有開啟的行事曆」行程。
   - 只要「同一天」內的「同一個大時段（上午/下午/夜間）」出現了兩家「不同醫院」的行程，介面上會跳出「⚠️ 醫院跨區時段重疊警告」。
   - 警告僅作視覺提示，使用者仍可點擊「確認儲存」強行排入行程。
4. **即時雙向同步 (Real-time Two-way Sync)**：
   - 在本系統新增/刪除行程，同步更新至 Google Calendar；若在 Google Calendar 進行變更，本系統亦反映更新。
   - **刪除邊界保護**：若使用者在 Google Calendar 刪除事件，系統僅同步移除「未來」的行程。若該行程的時間「已發生（過去式）」，系統將攔截刪除指令，將該筆資料轉為「永久拜訪紀錄」保留於資料庫，確保 Zero-Entry 筆記所依賴的拜訪軌跡不因誤刪而遺失。

#### 4.1.6 每日門診異動總覽與推播 (Daily Digest Notification)
**目標**：確保業務能掌握「關注醫師」的門診異動，同時避免被海量推播轟炸。
* **裝置註冊**：PWA 掛載 Service Worker 後，自動向後端註冊 Web Push Token 至 `push_subscriptions`。
* **排程彙整與發送**：建立背景任務（Cron Job），每天早上彙整過去 24 小時內「關注名單」中醫師的門診表變動，發送一則推播，並將結果實體寫入 `daily_digests` 資料表。
* **展示內容**：點擊通知後進入專屬的 `/digest` 頁面，前端透過 `GET /rest/v1/daily_digests` 拉取清單，列出「新增門診」、「取消/代診」或「超過 30 天未拜訪提醒」。

### 4.2 管理者端與進階功能 (Back-end Web & Future Roadmap)
- [Admin] **半自動門診表審核介面**：MVP 最核心的後台模組。設計用來讓工程/管理團隊上傳 PDF、預覽擷取文字，並手動核對寫入資料庫 (`timetables`)。
- [Admin] **純手動建檔介面 (Manual Data Entry)**：針對解析徹底失效或特殊手寫稿提供的高效手動介面。
  - **欄位設計**：提供「醫院 -> 科別 -> 醫師」三層聯動下拉選單，並設定生效日期。
  - **操作體驗**：提供「週曆網格 (Weekly Grid)」介面，管理員點擊格子（如週二上午）即可打開時間微調彈窗，精確寫入 timestamp 至資料庫。
- [Backlog] **醫師群組分類與標籤系統**：允許業務自行用標籤（例如：重點攻堅、A級客戶、北投區）來分類與篩選醫師。
- [Backlog] **非 Google 系日曆支援**：未來評估接入 Apple Calendar (CalDAV) 或 Outlook 行事曆，MVP 階段僅專注確保 Google Calendar 雙向同步的穩定性。

## 5. 資料與整合邊界 (Data & Integration Boundaries)
- **前端資料輕量化 (Data Fetching)**：
  - 前端 PWA 絕不抓取或儲存原始的「門診表 PDF 檔案」或圖片，以節省頻寬與本地儲存空間。
  - 前端僅向後端 API 請求經過解析後的「醫師門診時間結構化 JSON 資料」，並以此繪製可點擊排程的 UI 呈現。
- **資料精確度要求 (Data Granularity)**：
  - 各大醫院的上午/下午診時間不一（例如 08:30 與 09:00 起始）。
  - 資料庫 (`timetables`) 儲存時，必須將門診時段精確轉換為實際的「開始與結束時間戳 (Timestamp)」，而非粗略存取「上午/夜間」等字串。確保寫入 Google Calendar 時能呈現精確的會議區塊時間。
- **第三方 API 整合**：
  - **Google Calendar API**：PWA/後端需要擁有行事曆的讀寫權限以同步行程。
  - **Supabase Authentication**：作為唯一登入渠道。
- **資料庫權限 (RLS)**：
  - `private_notes` 與 `target_doctors` 表格強制綁定 Auth UID，確保資料絕對隔離。
  - `timetables` (門診表) 則開放全體驗證使用者查詢。

## 6. 非功能需求 (Non-Functional Requirements)
- **Mobile First**：UI/UX 介面設計以 iPhone 13 (Viewport 390x844) 尺寸與 Safari 瀏覽器為首要適配目標。
- **Offline Cache**：PWA 需支援本機 IndexedDB 快取，確保「離線時」依然能查閱個人關注清單、過往筆記與近一週的排程紀錄。
- **載入效能**：在 4G 網路下，醫師列表與日程表的首次載入時間不應超過 1.5 秒。

## 7. MVP 驗收標準 (Acceptance Criteria)

為確保醫療排程系統之第一階段釋出具備可用性與穩定性，定義以下硬性指標：

### 7.1 功能與狀態完整性 (Functional Completeness)
* [ ] **認證閉環**：新使用者透過 Google 登入後，能在 `users` 表正確取得 `is_onboarded: false` 標記並導向 3 頁式引導。
* [ ] **同步與刪除邊界**：使用者能夠透過 PWA 一鍵將排程存入專屬 Google Calendar，且測試「刪除已過去之 GCal 行程」時，系統 DB `active_appointments` 仍會保留該歷史紀錄 (is_historical=true)。
* [ ] **訂閱綁定與擋修**：在 `subscription_status` 為非 active 的狀況下，前端正確鎖定 `create_appointment` 調用並觸發升級牆 (Paywall)。
* [ ] **多裝置排除**：同一個測試帳號開啟超過第 3 頁無痕視窗登入時，最舊的 Session 視窗於下次路由切換時必須被強制踢出並清除 Token。

### 7.2 效能與容錯 (Performance & Fault Tolerance)
* [ ] **UGC 網速容忍**：測試前端透過 `/functions/v1/upload_timetable_pdf` 上傳大於 10MB 的 PDF，API Gateway 不能回報 413 Payload Too Large，Edge Function 須於 10 秒內返回 `{"status": "processing"}` 指導前端轉為輪詢，不可阻塞畫面。
* [ ] **資料隔離 (RLS)**：未經驗證的匿名請求 (401)，或是持有 User A 權限的憑證嘗試透過 Postman 去 GET 或 PATCH 屬於 User B 的 `private_notes`，資料庫層必須回絕 (回傳空陣列或 403)。

### 7.3 OCR 模組成功率 (依附於 PRD_OCR_Extraction)
* [ ] 針對系統白名單內之醫院 PDF 版本，首輪自動化清洗需達標 **80% 自動核准率**，其餘自動掉入 Pending 由管理員審核介面處理。
