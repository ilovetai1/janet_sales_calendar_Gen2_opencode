# Database Schema (Plan B - MVP)

## 1. 核心概念與權限隔離 (RLS)
基於 `PRD_planB.md` 的產品定位，本系統採用 Supabase 作為 Backend as a Service (BaaS)。
核心資料庫設計原則如下：
- **Row Level Security (RLS)**：嚴格確保醫藥業務只能讀寫自己的「關注名單」、「私密筆記」與「排程事件」，絕不允許跨業務存取。
- **公共資料區 (Public Read-only)**：醫院、醫師、門診表等基礎建設資料，皆由官方管理員 (Admin) 於後台單向維護，一般使用者（業務）僅擁有唯讀 (Read-only) 權限。

## 2. 實體關聯圖 (ERD Concept)
- `users` (1) ─ (N) `user_follows`
- `users` (1) ─ (N) `private_notes`
- `users` (1) ─ (N) `user_events`
- `doctors` (1) ─ (N) `timetables`
- `hospitals` (1) ─ (N) `timetables`
- `doctors` (M) ─ (N) `hospitals` (透過 `doctor_affiliations` 中介表)

---

## 3. 資料表定義 (Table Definitions)

### 3.1 系統與使用者 (System & Users)

#### `users` (擴充自 Auth.users)
儲存業務員的基本資訊與 Google Calendar 彈性綁定的授權狀態。
| 欄位名稱 | 型別 | 屬性 | 說明 |
| --- | --- | --- | --- |
| `id` | uuid | PK, FK | 關聯至 Supabase `auth.users.id` |
| `email` | text | Unique | 使用者系統登入信箱 |
| `display_name` | text | | 顯示名稱 |
| `avatar_url` | text | | 頭像連結 |
| `custom_calendar_email`| text | | 綁定的公務用 Google 帳號 Email (用於獨立日曆) |
| `calendar_refresh_token`| text | | Google Calendar API 授權的 Refresh Token |
| `dedicated_calendar_id`| text | | 系統自動建立的子日曆 ID (例如 `Janet Sales Calendar`) |
| `created_at` | timestamptz | default now() | 帳號建立時間 |

### 3.2 醫療機構與醫師 (Medical Data - 公共唯讀區)

#### `hospitals` (醫院)
| 欄位名稱 | 型別 | 屬性 | 說明 |
| --- | --- | --- | --- |
| `id` | uuid | PK, default uuid_generate_v4() | |
| `name` | text | | 醫院名稱 (e.g., 台北榮總) |
| `region` | text | | 行政區 (e.g., 台北市北投區) |
| `address` | text | | 詳細地址 |

#### `departments` (科別)
| 欄位名稱 | 型別 | 屬性 | 說明 |
| --- | --- | --- | --- |
| `id` | uuid | PK | |
| `hospital_id` | uuid | FK(`hospitals.id`) | |
| `name` | text | | 科別名稱 (e.g., 心臟內科) |

#### `doctors` (醫師)
| 欄位名稱 | 型別 | 屬性 | 說明 |
| --- | --- | --- | --- |
| `id` | uuid | PK | |
| `name` | text | | 醫師姓名 |
| `specialty` | text | | 專長或次專科 |
| `profile_image` | text | | 醫師照片連結 (Optional) |

#### `doctor_affiliations` (醫師與醫院/科別關聯)
處理一位醫師可能在多家醫院/科別看診的多對多 (M:N) 關係。
| 欄位名稱 | 型別 | 屬性 | 說明 |
| --- | --- | --- | --- |
| `id` | uuid | PK | |
| `doctor_id` | uuid | FK(`doctors.id`) | |
| `hospital_id` | uuid | FK(`hospitals.id`) | |
| `department_id` | uuid | FK(`departments.id`) | |

#### `timetables` (門診表時間)
**這張表由官方管理員（後台）維護，前台業務只有讀取權限。**
為了與 Google Calendar 精確同步，必須儲存具體的開始與結束時間。
| 欄位名稱 | 型別 | 屬性 | 說明 |
| --- | --- | --- | --- |
| `id` | uuid | PK | |
| `doctor_id` | uuid | FK(`doctors.id`) | |
| `hospital_id` | uuid | FK(`hospitals.id`) | |
| `day_of_week` | int | | 星期幾 (0=Sunday, 1-6) |
| `period` | text | | 時段標籤 (Morning, Afternoon, Night) |
| `start_time` | time | |精確門診開始時間 (e.g., 08:30:00) |
| `end_time` | time | | 精確門診結束時間 (e.g., 12:00:00) |
| `room_number` | text | | 診間號碼/位置/大樓標示 |
| `updated_at` | timestamptz | | 該筆門診資料最後更新時間 (顯示於前台給業務看) |

---

### 3.3 業務個人資料 (Personalization - RLS 嚴格限制區)

#### `user_follows` (智慧尋醫與目標關注)
紀錄業務關注了哪些醫師，作為「我的關注」清單來源。
| 欄位名稱 | 型別 | 屬性 | 說明 |
| --- | --- | --- | --- |
| `id` | uuid | PK | |
| `user_id` | uuid | FK(`users.id`) | 關聯至特定的業務員 |
| `doctor_id` | uuid | FK(`doctors.id`) | 關注的特定醫師 |
| `created_at` | timestamptz | | 關注發生的時間 |

#### `private_notes` (Zero-Entry 私密筆記)
業務對特定醫師的大範圍私密備忘錄。
| 欄位名稱 | 型別 | 屬性 | 說明 |
| --- | --- | --- | --- |
| `id` | uuid | PK | |
| `user_id` | uuid | FK(`users.id`) | 擁有此筆記的業務員 |
| `doctor_id` | uuid | FK(`doctors.id`) | 筆記對象醫師 |
| `content` | text | | 筆記內容文本 |
| `updated_at` | timestamptz | | 最後修改時間 |

#### `user_events` (使用者拜訪排程紀錄)
用於雙向同步 Google Calendar，並作系統內的衝堂警告 (Soft Warning) 檢測。
| 欄位名稱 | 型別 | 屬性 | 說明 |
| --- | --- | --- | --- |
| `id` | uuid | PK | |
| `user_id` | uuid | FK(`users.id`) | |
| `doctor_id` | uuid | FK(`doctors.id`) | 排程拜訪對象 |
| `hospital_id` | uuid | FK(`hospitals.id`) | 排程拜訪地點 |
| `period` | text | | 時段標籤 (Morning, Afternoon, Night) 用於快速衝突比對 |
| `start_time` | timestamptz | | 轉化後的精確事件開始時間 (依據日期與 timetables) |
| `end_time` | timestamptz | | 轉化後的精確事件結束時間 |
| `google_event_id`| text | | 對應到 Google Calendar 的 Event ID (供雙向同步操作用) |
| `sync_status` | text | | 同步狀態 (pending, synced, failed, deleted) |
| `created_at` | timestamptz | | 建立時間 |

---

## 4. Row Level Security (RLS) 規則摘要

- **全體公共資料表** (`hospitals`, `departments`, `doctors`, `doctor_affiliations`, `timetables`)：
  - Policy `Authenticated` (登入的業務)：允許 `SELECT` (僅供讀取顯示)。
  - Policy `Service_Role` (後台/管理員)：允許 `ALL` (新增/修改/刪除/查詢)。

- **個人隱私資料表** (`users`, `user_follows`, `private_notes`, `user_events`)：
  - Policy `Authenticated`：允許 `SELECT`, `INSERT`, `UPDATE`, `DELETE`。
  - **核心前置條件限制**：只允許 `auth.uid() = user_id`，確保業務絕對無法竄改或查詢同行對手的資料。
