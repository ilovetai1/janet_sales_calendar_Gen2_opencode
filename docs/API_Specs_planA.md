# 醫療業務行事曆 (Janet Sales Calendar) - API 規格書 (Plan A)

> **版本**：v1.0 (Draft)
> **對應 PRD**：`PRD_planA.md`
> **對應 DB Schema**：`Database_Schema_planA.md`

## 1. 架構原則 (Architecture Principles)
本系統前端為 React PWA，後端主要依賴 **Supabase**。API 設計遵循以下原則：
1. **直接存取 (Direct Data Access)**：大多數單純的 CRUD (如讀取醫院列表、新增關注對象) 利用 Supabase 提供的 REST API (PostgREST) 直接從前端呼叫，配合 Row Level Security (RLS) 確保權限安全。
2. **邊緣運算 (Edge Functions / RPC)**：對於涉及第三方服務 (Google Calendar API)、複雜商業邏輯 (OCR 解析)、或跨表封裝 (取得組合式門診表) 的操作，則透過 Supabase Edge Functions 或 PostgreSQL RPC (Remote Procedure Call) 實作。
3. **認證 (Authentication)**：所有請求皆須在 Header 帶入 `Authorization: Bearer <Supabase_JWT>`。

---

## 1.5 API 總覽表 (Overview)

| 來源/類別 | 方法與路徑 (Endpoint) | 功能說明 (Description) |
| :--- | :--- | :--- |
| **前台(PWA)** | `GET /functions/v1/me/status` | 取得當前使用者狀態 (Onboarding, 訂閱, 設備數) |
| **前台(PWA)** | `POST /functions/v1/heartbeat` | 定期發送裝置存活心跳 (限制裝置數) |
| **前台(PWA)** | `POST /functions/v1/account/delete` | 刪除帳號與清除全部個資 |
| **前台(PWA)** | `GET /rest/v1/hospitals` | 取得醫院列表 (支援模糊搜尋) |
| **前台(PWA)** | `GET /rest/v1/doctors` | 搜尋醫師 (姓名、專科) |
| **前台(PWA)** | `POST /rpc/get_doctor_profile`| 取得單一醫師完整履歷與近期門診 |
| **前台(PWA)** | `POST /rest/v1/target_doctors` | 將醫師加入「我的關注」 |
| **前台(PWA)** | `DELETE /rest/v1/target_doctors`| 將醫師移出「我的關注」(取消關注) |
| **前台(PWA)** | `PATCH /rest/v1/target_doctors` | 更新該醫師專屬的私密筆記 |
| **前台(PWA)** | `GET /rest/v1/active_appointments` | 讀取個人的行事曆行程與過去拜訪紀錄 |
| **前台(PWA)** | `PATCH /rest/v1/target_doctors` | 更新該醫師專屬的私密筆記 |
| **前台(PWA)** | `POST /functions/v1/create_appointment` | 手動/一鍵排程，並同步建立 Google Calendar Event |
| **前台(PWA)** | `DELETE /functions/v1/cancel_appointment` | 取消排程，並同步刪除 Google Calendar Event |
| **前台(PWA)** | `POST /functions/v1/upload_timetable_pdf` | 上傳門診表 PDF/圖檔/連結 進行 OCR 解析 |
| **前台(PWA)** | `POST /functions/v1/submission/report` | 檢舉無效/惡意的門診表上傳紀錄 |
| **前台(PWA)** | `POST /functions/v1/push/register` | 註冊設備端 Web Push Token |
| **前台(PWA)** | `GET /rest/v1/daily_digest` | 取得個人每日異動總覽紀錄 |
| **Webhook** | `POST /functions/v1/subscription/webhook` | 接收金流平台 (如 Stripe) 之訂閱狀態更新 |
| **Webhook** | `POST /functions/v1/google_calendar/webhook` | 接收 Google 行事曆異動即時推播 |
| **後台(Admin)** | `GET /rest/v1/timetable_submissions` | 列出待人工審核或 OCR 失敗之門診表紀錄 |
| **後台(Admin)** | `POST /functions/v1/admin_reprocess_ocr`| 後台管理員重新劃定特定區域進行局部 OCR 辨識 |
| **後台(Admin)** | `POST /rpc/admin_batch_insert_timetables` | 將純手動建檔介面 (週曆網格) 的時段批次寫入門診庫 |

---

## 2. 前台使用者 API (End-User / PWA)

### 2.1 系統狀態與帳號管理 (Account & Status)

#### `GET /functions/v1/me/status` (Edge Function)
* **功能**：取得當前使用者狀態，包含 Onboarding 階段、訂閱狀態與當前登入設備數。
* **Example Request**:
  ```http
  GET /functions/v1/me/status
  Authorization: Bearer <token>
  ```
* **Example Response**:
  ```json
  {
    "is_onboarded": true,
    "subscription_status": "active",
    "current_period_end": "2024-12-31T23:59:59Z",
    "active_devices": 1
  }
  ```

#### `POST /functions/v1/heartbeat` (Edge Function)
* **功能**：定期發送裝置存活心跳，更新 `user_sessions.last_active_at`。若當前裝置超過 3 台，後端將主動觸發踢除舊 Session 機制。
* **Example Request**:
  ```http
  POST /functions/v1/heartbeat
  Authorization: Bearer <token>
  ```
* **Example Response**: (204 No Content)

#### `POST /functions/v1/account/delete` (Edge Function)
* **功能**：刪除帳號，清除所有 PII 隱私資料 (包含行程、筆記、Google Calendar Token 等)。
* **Example Request**:
  ```http
  POST /functions/v1/account/delete
  Authorization: Bearer <token>
  ```
* **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Account and all associated public/private data deleted successfully."
  }
  ```

### 2.2 基礎資料檢索 (Public Data)

#### `GET /rest/v1/hospitals`
* **功能**：取得醫院列表。
* **參數**：支援 keyword fuzzy search (`?name=ilike.*長庚*`)。
* **Example Request**:
  ```http
  GET /rest/v1/hospitals?name=ilike.*長庚*&select=id,name,region
  Authorization: Bearer <token>
  ```
* **Example Response**:
  ```json
  [
    {
      "id": "hosp-1234-5678",
      "name": "林口長庚紀念醫院",
      "region": "北區"
    }
  ]
  ```

#### `GET /rest/v1/doctors`
* **功能**：搜尋醫師。
* **參數**：`?search_vector=fts(name, specialty)`
* **Example Request**:
  ```http
  GET /rest/v1/doctors?name=ilike.*林*&select=id,name,specialty
  Authorization: Bearer <token>
  ```
* **Example Response**:
  ```json
  [
    {
      "id": "doc-9876-5432",
      "name": "林OO",
      "specialty": "心臟內科"
    }
  ]
  ```

#### `GET /rpc/get_doctor_profile` (自定義 RPC)
* **功能**：取得單一醫師的完整履歷，包含其在各醫院的看診身分 (`affiliation_id`) 與近期門診表。
* **Example Request**:
  ```http
  POST /rpc/get_doctor_profile
  Content-Type: application/json
  Authorization: Bearer <token>

  {
    "p_doctor_id": "doc-9876-5432"
  }
  ```
* **Example Response**:
  ```json
  {
    "doctor": { 
      "id": "doc-9876-5432", 
      "name": "林OO", 
      "specialty": "心臟內科" 
    },
    "affiliations": [
      { 
        "affiliation_id": "aff-1111", 
        "hospital_id": "hosp-1234",
        "hospital_name": "林口長庚紀念醫院", 
        "department": "心臟血管內科" 
      }
    ],
    "timetables": [
      {
        "affiliation_id": "aff-1111",
        "day_of_week": 2,
        "session_type": "morning",
        "start_time": "08:30:00",
        "end_time": "12:00:00",
        "valid_from": "2024-05-01"
      }
    ]
  }
  ```

### 2.2 目標關注與筆記 (CRM)

#### `POST /rest/v1/target_doctors`
* **功能**：將醫師加入「我的關注」。
* **備註**：`user_id` 由 JWT Token 在 DB 層自動解析寫入。
* **Example Request**:
  ```http
  POST /rest/v1/target_doctors
  Content-Type: application/json
  Authorization: Bearer <token>

  {
    "doctor_id": "doc-9876-5432"
  }
  ```
* **Example Response**:
  ```json
  {
    "id": "tgt-1234-abcd",
    "doctor_id": "doc-9876-5432",
    "private_notes": null,
    "created_at": "2024-05-15T10:00:00Z"
  }
  ```

#### `DELETE /rest/v1/target_doctors?doctor_id=eq.{uuid}`
* **功能**：將醫師從「我的關注」中移除 (取消關注)。
* **Example Request**:
  ```http
  DELETE /rest/v1/target_doctors?doctor_id=eq.doc-9876-5432
  Authorization: Bearer <token>
  ```
* **Example Response**: (204 No Content)

#### `PATCH /rest/v1/target_doctors?doctor_id=eq.{uuid}`
* **功能**：更新私密筆記 (Zero-Entry Notes)。
* **Example Request**:
  ```http
  PATCH /rest/v1/target_doctors?doctor_id=eq.doc-9876-5432
  Content-Type: application/json
  Authorization: Bearer <token>

  {
    "private_notes": "習慣喝 50 嵐無糖綠"
  }
  ```
* **Example Response**: (204 No Content)

### 2.3 排程與行事曆操作 (Scheduling & Sync)

#### `GET /rest/v1/active_appointments`
* **功能**：由前端直接讀取，取得使用者的未來排程與過去歷史拜訪紀錄 (`is_historical`)。
* **參數**：支援日期範圍過濾 (例如 `?start_time=gte.2024-05-01&start_time=lte.2024-05-31`)
* **Example Request**:
  ```http
  GET /rest/v1/active_appointments?select=id,doctor_id,hospital_id,start_time,end_time,is_historical
  Authorization: Bearer <token>
  ```
* **Example Response**:
  ```json
  [
    {
      "id": "apt-5555",
      "doctor_id": "doc-9876-5432",
      "hospital_id": "hosp-1234-5678",
      "start_time": "2024-05-20T08:30:00Z",
      "end_time": "2024-05-20T12:00:00Z",
      "is_historical": false
    }
  ]
  ```

#### `POST /functions/v1/create_appointment` (Edge Function)
* **功能**：「一鍵排程」寫入本機資料庫並同步建立 Google Calendar Event。
* **邏輯回饋**：
  - 若偵測到「軟性時間衝突」，回傳警告但仍可允許排入。
* **Example Request**:
  ```http
  POST /functions/v1/create_appointment
  Content-Type: application/json
  Authorization: Bearer <token>

  {
    "doctor_id": "doc-9876-5432",
    "hospital_id": "hosp-1234-5678",
    "start_time": "2024-05-20T08:30:00Z",
    "end_time": "2024-05-20T12:00:00Z"
  }
  ```
* **Example Response (Success)**:
  ```json
  {
    "status": "success",
    "appointment_id": "apt-5555",
    "gcal_event_id": "google_event_abcdef123"
  }
  ```
* **Example Response (Conflict Warning)**:
  ```json
  {
    "status": "warning",
    "message": "Double booking detected for 2024-05-20 morning.",
    "appointment_id": "apt-5555",
    "gcal_event_id": "google_event_abcdef123"
  }
  ```

#### `DELETE /functions/v1/cancel_appointment` (Edge Function)
* **功能**：取消排程，同步刪除 Google Calendar Event (僅限未來時間)。
* **Example Request**:
  ```http
  DELETE /functions/v1/cancel_appointment
  Content-Type: application/json
  Authorization: Bearer <token>

  {
    "appointment_id": "apt-5555"
  }
  ```
* **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Appointment and GCal event cancelled."
  }
  ```

### 2.5 門診表貢獻 (UGC Upload)

#### `POST /functions/v1/upload_timetable_pdf` (Edge Function)
* **功能**：上傳 PDF/圖檔/連結 進行 OCR 解析。
* **邏輯回饋**：
  - 建立 `timetable_submissions` 紀錄 (狀態 `pending`)，並寫入 `target_month` 與 `file_hash`。
  - 觸發 OCR 引擎。
  - 若 10 秒內結束，回傳解析結果預覽；若超時，回傳 `{"status": "processing", "submission_id": "..."}`，前端轉為輪詢 (Polling) 或等待 Webhook 通知。
* **Example Request**:
  ```http
  POST /functions/v1/upload_timetable_pdf
  Content-Type: multipart/form-data; boundary=---Boundary
  Authorization: Bearer <token>

  -----Boundary
  Content-Disposition: form-data; name="hospital_id"
  hosp-1234-5678
  -----Boundary
  Content-Disposition: form-data; name="target_month"
  2024-06
  -----Boundary
  Content-Disposition: form-data; name="source_type"
  file
  -----Boundary
  Content-Disposition: form-data; name="file"; filename="schedule.pdf"
  Content-Type: application/pdf
  <Binary Data>
  ```
* **Example Response (Processing)**:
  ```json
  {
    "status": "processing",
    "submission_id": "sub-mmyy123"
  }
  ```

#### `POST /functions/v1/submission/report` (Edge Function)
* **功能**：檢舉無效/惡意的門診表上傳紀錄 (反惡意機制)。
* **Example Request**:
  ```http
  POST /functions/v1/submission/report
  Content-Type: application/json
  Authorization: Bearer <token>

  {
    "submission_id": "sub-mmyy123",
    "reason": "This is a restaurant menu, not a timetable."
  }
  ```
* **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Report submitted for admin review."
  }
  ```

### 2.6 推播與每日總覽 (Push & Digest)

#### `POST /functions/v1/push/register` (Edge Function)
* **功能**：註冊設備端 Web Push Token。
* **Example Request**:
  ```http
  POST /functions/v1/push/register
  Content-Type: application/json
  Authorization: Bearer <token>

  {
    "device_platform": "ios_safari",
    "push_token": "fcm_token_xyz_890"
  }
  ```
* **Example Response**: (204 No Content)

#### `GET /rest/v1/daily_digest`
* **功能**：取得個人每日異動總覽紀錄。
* **Example Request**:
  ```http
  GET /rest/v1/daily_digest?created_at=gte.2024-05-20T00:00:00Z
  Authorization: Bearer <token>
  ```
* **Example Response**:
  ```json
  [
    {
      "id": "dgst-111",
      "summary": "台大醫院 林OO 醫師 新增了 2 個門診時段",
      "related_doctor_id": "doc-9876-5432"
    }
  ]
  ```

### 2.7 Webhooks (第三方程式端點)

#### `POST /functions/v1/subscription/webhook`
* **功能**：接收金流平台 (如 Stripe) 之訂閱狀態更新。
* **驗證**：驗證 Stripe Signature Header。

#### `POST /functions/v1/google_calendar/webhook`
* **功能**：接收 Google 行事曆異動即時推播，以同步回本機 `active_appointments`。
* **驗證**：驗證 Google Channel Token。

---

## 3. 後台管理員 API (Admin Operations)

### 3.1 審核與手動建檔

#### `GET /rest/v1/timetable_submissions?status=eq.pending`
* **功能**：列出等待人工審核或 OCR 失敗的門診表上傳紀錄。
* **Example Request**:
  ```http
  GET /rest/v1/timetable_submissions?status=eq.pending&select=id,hospital_id,target_month,created_at
  Authorization: Bearer <admin_token>
  ```
* **Example Response**:
  ```json
  [
    {
      "id": "sub-mmyy123",
      "hospital_id": "hosp-1234-5678",
      "target_month": "2024-06",
      "created_at": "2024-05-25T14:30:00Z"
    }
  ]
  ```

#### `POST /functions/v1/admin_reprocess_ocr` (Edge Function)
* **功能**：管理員劃定特定區域 (Bounding Box) 要求重新進行局部 OCR 辨識。
* **Example Request**:
  ```http
  POST /functions/v1/admin_reprocess_ocr
  Content-Type: application/json
  Authorization: Bearer <admin_token>

  {
    "submission_id": "sub-mmyy123",
    "coordinates": { "x": 100, "y": 250, "width": 400, "height": 80 },
    "context": { "doctor_name": "林OO" }
  }
  ```
* **Example Response**:
  ```json
  {
    "status": "success",
    "extracted_data": [
      { "day_of_week": 2, "session_type": "morning" }
    ]
  }
  ```

#### `POST /rpc/admin_batch_insert_timetables` (自定義 RPC)
* **功能**：純手動建檔介面 (Manual Grid UI) 的巨集寫入。將前端週曆網格上的時段批次轉換為 `timetables` 紀錄。
* **Example Request**:
  ```http
  POST /rpc/admin_batch_insert_timetables
  Content-Type: application/json
  Authorization: Bearer <admin_token>

  {
    "affiliation_id": "aff-1111",
    "valid_from": "2024-06-01",
    "sessions": [
      { "day_of_week": 2, "session_type": "morning", "start_time": "08:30:00", "end_time": "12:00:00" },
      { "day_of_week": 4, "session_type": "afternoon", "start_time": "13:30:00", "end_time": "17:00:00" }
    ]
  }
  ```
* **Example Response**:
  ```json
  {
    "status": "success",
    "inserted_rows": 2
  }
  ```

---

## 4. 共通錯誤碼與狀態契約 (Common Error Codes & HTTP Status)
所有 API 皆遵循標準 RESTful HTTP Status Codes：
* `200 OK`：請求成功。
* `204 No Content`：刪除或更新成功，無回傳內容。
* `400 Bad Request`：參數格式錯誤、必填欄位缺失。
* `401 Unauthorized`：JWT Token 無效或過期。
* `403 Forbidden`：權限不足 (例如：嘗試修改他人的私密筆記，遭 RLS 擋下)。
* `404 Not Found`：找不到指定資源 (如 `hospital_id` 不存在)。
* `409 Conflict`：資源衝突 (如行事曆時段完全重疊導致寫入失敗)。
* `500 Internal Server Error`：伺服器內部錯誤或外部 API (Google/Stripe) 呼叫失敗。

*(備註：以上為 MVP 第一階段核心所需之介面規格，供前端 UI 串接及後端函式實作參考。細部業務邏輯 Error Codes 後續於實質開發階段於 Swagger/Postman 補齊。)*
