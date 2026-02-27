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

## 2. 前台使用者 API (End-User / PWA)

### 2.1 基礎資料檢索 (Public Data)

#### `GET /rest/v1/hospitals`
* **功能**：取得醫院列表。
* **參數**：支援 keyword fuzzy search (`?name=ilike.*長庚*`)。
* **回傳**：`Hospital` 陣列。

#### `GET /rest/v1/doctors`
* **功能**：搜尋醫師。
* **參數**：`?search_vector=fts(name, specialty)`
* **回傳**：`Doctor` 陣列 (包含基本資訊)。

#### `GET /rpc/get_doctor_profile` (自定義 RPC)
* **功能**：取得單一醫師的完整履歷，包含其在各醫院的看診身分 (`affiliation_id`) 與近期門診表。
* **參數**：`{ "p_doctor_id": "uuid" }`
* **回傳**：
  ```json
  {
    "doctor": { "id", "name", "specialty" },
    "affiliations": [
       { "affiliation_id", "hospital_name", "department" }
    ],
    "timetables": [ /* 依據 affiliation 展開的未來一個月門診時段 */ ]
  }
  ```

### 2.2 目標關注與筆記 (CRM)

#### `POST /rest/v1/target_doctors`
* **功能**：將醫師加入「我的關注」。
* **Body**：`{ "doctor_id": "uuid" }`
* **備註**：`user_id` 由 JWT Token 在 DB 層自動解析寫入。

#### `PATCH /rest/v1/target_doctors?doctor_id=eq.{uuid}`
* **功能**：更新私密筆記 (Zero-Entry Notes)。
* **Body**：`{ "private_notes": "喜歡喝無糖綠" }`

### 2.3 排程與行事曆操作 (Scheduling & Sync)

#### `POST /functions/v1/create_appointment` (Edge Function)
* **功能**：「一鍵排程」寫入本機資料庫並同步建立 Google Calendar Event。
* **Body**：
  ```json
  {
    "doctor_id": "uuid",
    "hospital_id": "uuid",
    "start_time": "2024-05-20T08:30:00Z",
    "end_time": "2024-05-20T12:00:00Z"
  }
  ```
* **邏輯回饋**：
  - 建立 `active_appointments` 紀錄。
  - 呼叫 Google Calendar API，成功後將回傳的 `gcal_event_id` 更新回 DB。
  - 若偵測到「軟性時間衝突」，回傳 `{"warning": "Conflict detected", "appointment_id": "..."}` 供前端提示。

#### `DELETE /functions/v1/cancel_appointment` (Edge Function)
* **功能**：取消排程，同步刪除 Google Calendar Event (僅限未來時間)。
* **Body**：`{ "appointment_id": "uuid" }`

### 2.4 門診表貢獻 (UGC Upload)

#### `POST /functions/v1/upload_timetable_pdf` (Edge Function)
* **功能**：上傳 PDF 進行 OCR 解析。
* **Body**：`multipart/form-data` (包含 file, `hospital_id`, `target_month`)
* **邏輯回饋**：
  - 建立 `timetable_submissions` 紀錄 (狀態 `pending`)。
  - 觸發 OCR 引擎。
  - 若 10 秒內結束，回傳解析結果預覽；若超時，回傳 `{"status": "processing", "submission_id": "..."}`，前端轉為輪詢 (Polling) 或等待 Webhook 通知。

---

## 3. 後台管理員 API (Admin Operations)

### 3.1 審核與手動建檔

#### `GET /rest/v1/timetable_submissions?status=eq.pending`
* **功能**：列出等待人工審核或 OCR 失敗的門診表上傳紀錄。

#### `POST /functions/v1/admin_reprocess_ocr` (Edge Function)
* **功能**：管理員劃定特定區域 (Bounding Box) 要求重新進行局部 OCR 辨識。
* **Body**：
  ```json
  {
    "submission_id": "uuid",
    "coordinates": { "x", "y", "width", "height" },
    "context": { "doctor_name": "林xx" }
  }
  ```

#### `POST /rpc/admin_batch_insert_timetables` (自定義 RPC)
* **功能**：純手動建檔介面 (Manual Grid UI) 的巨集寫入。將前端週曆網格上的時段批次轉換為 `timetables` 紀錄。
* **Body**：
  ```json
  {
    "affiliation_id": "uuid",
    "valid_from": "YYYY-MM-DD",
    "sessions": [
      { "day_of_week": 2, "session_type": "morning", "start_time": "08:30:00", "end_time": "12:00:00" },
      { "day_of_week": 4, "session_type": "afternoon", "start_time": "13:30:00", "end_time": "17:00:00" }
    ]
  }
  ```

---
*備註：以上為 MVP 第一階段核心所需之介面規格，供前端 UI 串接及後端函式實作參考。細部 Error Codes 與 HTTP Status 後續於實質開發階段於 Swagger/Postman 補齊。*
