# Janet Sales Calendar - Database Schema (Plan A)

本文件定義針對 [PRD_planA.md](./PRD_planA.md) 規格所設計的 Supabase (PostgreSQL) 資料庫架構。

## 核心設計理念
1. **多租戶隔離 (Multi-tenant Data Isolation)**：系統為 B2B/SaaS 性質，利用 Supabase Row Level Security (RLS) 確保每位業務員 (`user_id`) 只能存取自己的客戶名單、筆記與行程。
2. **共用資源開放 (Shared Resources)**：醫院清單、科別清單、醫師基本資料與「門診表時間`timetables`」屬於全域共用資料，所有已登入且處於訂閱狀態的會員皆可 `SELECT`。
3. **時間精確度 (Time Granularity)**：為了與 Google Calendar 完美雙向同步，資料庫中的所有排程時間皆以精確的 `TIMESTAMP WITH TIME ZONE` (timestamptz) 儲存，不使用模糊的「上午/下午」字串。

---

## 實體關聯圖 (ERD)

```mermaid
erDiagram
    USERS ||--o{ SUBSCRIPTIONS : has
    USERS ||--o{ TARGET_DOCTORS : follows
    USERS ||--o{ ACTIVE_APPOINTMENTS : schedules
    HOSPITALS ||--|{ DOCTORS : employs
    DOCTORS ||--o{ TIMETABLES : has_schedule
    DOCTORS ||--o{ TARGET_DOCTORS : is_targeted
    DOCTORS ||--o{ ACTIVE_APPOINTMENTS : involves
    TIMETABLES ||--o{ TIMETABLE_SUBMISSIONS : created_from
```

---

## 資料表結構 (Table Schemas)

### 1. `users` (使用者與權限)
延伸 Supabase Auth 的 `auth.users`，儲存應用程式等級的使用者設定與金流綁定狀態。

| 欄位名稱 (Column) | 型別 (Type) | 屬性 (Attributes) | 說明 (Description) |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK, FK(`auth.users.id`) | 使用者唯一識別碼 |
| `email` | varchar | UNIQUE, NOT NULL | 登入與金流綁定的 Email |
| `full_name` | varchar | | 使用者顯示名稱 |
| `gcal_access_token` | varchar | | 業務授權的 Google Calendar Token (可加密) |
| `gcal_refresh_token`| varchar | | Google Calendar Refresh Token |
| `gcal_calendar_id` | varchar | | `Janet Sales Calendar` 專屬子日曆的 ID |
| `subscription_status`| enum | DEFAULT 'free_trial' | 訂閱狀態 (`free_trial`, `active`, `past_due`, `canceled`) |
| `trial_ends_at` | timestamptz | | 試用期結束時間 |
| `created_at` | timestamptz | DEFAULT now() | 帳號建立時間 |

**RLS Policy**:
- 讀取/更新：僅限 `auth.uid() = id`。

### 2. `hospitals` (醫院字典表 - 共用)
全站共用的醫院主檔。此表預期由官方建立或透過 UGC 審核後上線。

| 欄位名稱 (Column) | 型別 (Type) | 屬性 (Attributes) | 說明 (Description) |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | 醫院唯一識別碼 |
| `name` | varchar | NOT NULL | 醫院名稱 (例如：台北榮民總醫院) |
| `region` | varchar | | 行政區或縣市 (例如：台北市北投區) |
| `address` | varchar | | 詳細地址 |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policy**:
- 讀取：所有已授權使用者 (`authenticated` role)。
- 寫入：僅限 `admin` 權限。

### 3. `doctors` (醫師字典表 - 共用)
全站共用的醫師主檔，包含所屬醫院與科別。

| 欄位名稱 (Column) | 型別 (Type) | 屬性 (Attributes) | 說明 (Description) |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | 醫師唯一識別碼 |
| `hospital_id` | uuid | FK(`hospitals.id`), NOT NULL | 所屬醫院 |
| `name` | varchar | NOT NULL | 醫師姓名 |
| `department` | varchar | NOT NULL | 科別 (例如：心臟內科) |
| `search_vector` | tsvector | | 全文檢索引擎欄位 (支援模糊比對) |

**RLS Policy**:
- 讀取：所有已授權使用者。
- 寫入：僅限 `admin` 權限。

### 4. `timetables` (門診時間表 - 共用核心)
儲存經過 OCR 解析並經後台確認的「精確」醫師看診時段。前端以此表繪出排程畫面。

| 欄位名稱 (Column) | 型別 (Type) | 屬性 (Attributes) | 說明 (Description) |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | 門診紀錄唯一識別碼 |
| `doctor_id` | uuid | FK(`doctors.id`), NOT NULL | 對應醫師 |
| `hospital_id` | uuid | FK(`hospitals.id`), NOT NULL | 對應醫院 (因醫師可能跨院，需冗餘或關聯標示) |
| `day_of_week` | smallint | NOT NULL | 星期幾 (1=週一, 7=週日) |
| `session_type` | enum | NOT NULL | 時段分期 (`morning`, `afternoon`, `night`) |
| `start_time` | time | NOT NULL | 該院該診精確開始時間 (例 08:30:00) |
| `end_time` | time | NOT NULL | 該院該診精確結束時間 (例 12:00:00) |
| `valid_from` | date | NOT NULL | 此門診表生效日期 |
| `valid_until` | date | | 失效日期 (若有新表覆寫) |
| `status` | enum | DEFAULT 'active' | 狀態 (`active`, `suspended_temp`, `archived`) |
| `last_verified_at`| timestamptz | | 前台顯示的「最後更新時間」 |

**RLS Policy**:
- 讀取：所有已授權使用者。
- 寫入：僅限 `admin` 權限。

### 5. `target_doctors` (我的關注與 Zero-Entry 筆記 - 絕對隔離)
每個業務員自己的「口袋名單」與私密筆記。此表為 Zero-Entry 系統的基石。

| 欄位名稱 (Column) | 型別 (Type) | 屬性 (Attributes) | 說明 (Description) |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | 關聯唯一識別碼 |
| `user_id` | uuid | FK(`users.id`), NOT NULL | 建立該關注名單的業務員 |
| `doctor_id` | uuid | FK(`doctors.id`), NOT NULL | 關注的醫師 |
| `private_notes` | text | | 自由文字方塊 (例如：喜歡喝50嵐) |
| `created_at` | timestamptz | DEFAULT now() | 加入關注的時間 |
| `updated_at` | timestamptz | DEFAULT now() | 筆記最後修改時間 |

*(註：`last_visited_date` 與 `next_visit_date` 依 PRD 精神不實體存入此表，而是從 `active_appointments` 動態算出，以實現真正的 Zero-Entry)*

**RLS Policy**:
- 讀取/寫入/刪除：僅限 `auth.uid() = user_id`。

### 6. `active_appointments` (雙向同步行程表 - 絕對隔離)
使用者排定的拜訪行程，作為與 Google Calendar 雙向同步的 Bridge 表。若在 Google 刪除「過去」的行程，在此表會被標記為 `is_historical=true` 而不被刪除。

| 欄位名稱 (Column) | 型別 (Type) | 屬性 (Attributes) | 說明 (Description) |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | 行程唯一識別碼 |
| `user_id` | uuid | FK(`users.id`), NOT NULL | 建立該行程的業務員 |
| `doctor_id` | uuid | FK(`doctors.id`), NOT NULL | 準備拜訪的醫師 |
| `gcal_event_id` | varchar | | 對應到 Google Calendar 的 Event ID |
| `start_time` | timestamptz | NOT NULL | 拜訪開始時間 |
| `end_time` | timestamptz | NOT NULL | 拜訪結束時間 |
| `notes` | text | | 單次拜訪的備註 |
| `sync_status` | enum | DEFAULT 'pending' | 同步狀態 (`pending`, `synced`, `failed`) |
| `is_historical` | boolean | DEFAULT false | 若為 true，代表是保護不被雙向刪除的過去紀錄 |

**RLS Policy**:
- 讀取/寫入/刪除：僅限 `auth.uid() = user_id`。

### 7. `timetable_submissions` (UGC 門診表上傳 - MVP 階段供後台使用)
供業務端上傳，或後台直接上傳之 PDF / 圖檔對列。作為 OCR 解析引擎 (Hybrid Engine) 的任務 Queue。

| 欄位名稱 (Column) | 型別 (Type) | 屬性 (Attributes) | 說明 (Description) |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | 上傳任務唯一識別碼 |
| `uploader_id` | uuid | FK(`users.id`), NOT NULL | 貢獻者/上傳者 |
| `hospital_id` | uuid | FK(`hospitals.id`), NOT NULL | 對應的醫院 (使用者上傳時指定) |
| `file_url` | varchar | NOT NULL | 存在 Supabase Storage 的 PDF/圖檔位址 |
| `processing_status`| enum | DEFAULT 'pending' | 處理狀態 (`pending`, `ocr_success`, `needs_admin`, `rejected`, `approved`) |
| `admin_feedback`| text | | 退件或處理理由 |
| `created_at` | timestamptz | DEFAULT now() | 上傳時間 (用於計算折抵月費貢獻度) |

**RLS Policy**:
- 讀取：僅能讀取 `uploader_id = auth.uid()` 之任務狀態。
- 寫入：使用者可 Insert，但僅 `admin` 能 Update 狀態。
