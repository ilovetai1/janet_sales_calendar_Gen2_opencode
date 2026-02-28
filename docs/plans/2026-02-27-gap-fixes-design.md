# Design Refinement: PWA 實作斷層修復 (2026-02-27)

針對初期 PRD、API Specs 與 DB Schema 中三處實作斷層的收斂設計。

## 1. 每日推播總覽 (Daily Digest) 實作方式
**決策**：採用實體化儲存與排程任務。
- **DB 變更**：新增 `daily_digests` 表，紀錄每一個推薦結果與對應的 PWA 用戶。
- **API 變更**：`GET /rest/v1/daily_digests` 直接由前端拉取。
- **機制**：後端透過 Cron Job 定期比對門診表異動與用戶關注名單，並將結果實體寫入 `daily_digests` 表。

## 2. 讀取行事曆 (Calendar Sync) 實作方式
**決策**：前端直接讀取，活用 Supabase。
- **API 變更**：不封裝新的過度特化 Endpoint。前端直接發送 `GET /rest/v1/active_appointments`。
- **機制**：透過 Supabase RLS 確保只能撈到該登入帳號的行程，包含未來的排程與過去 (`is_historical`) 的拜訪紀錄。

## 3. 裝置登入限制與心跳 (Heartbeat) 實作方式
**決策**：建立專屬心跳 API。
- **API 變更**：新增 `POST /functions/v1/heartbeat` 或對 `user_sessions` 的專屬更新操作。
- **機制**：前端每 N 分鐘發送一次訊號更新 `user_sessions.last_active_at`。後端檢測若同使用者 Session 超過 3 筆，自動砍掉舊連線。
