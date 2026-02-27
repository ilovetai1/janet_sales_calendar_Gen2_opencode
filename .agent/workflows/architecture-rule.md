---
description: 前後端分離與模組化設計原則
alwaysApply: true
---

# 架構原則：前後端分離、模組化設計

## 目錄結構職責

| 目錄 | 職責 | 禁止 |
|------|------|------|
| `api/` | 後端 API 路由、資料存取、業務邏輯 | 引用 `src/` 任何前端程式碼 |
| `src/` | 前端 UI 元件、頁面、狀態管理 | 直接 import `api/` 的後端邏輯 |
| `src/lib/` | 前端 API 呼叫封裝（fetch wrapper） | 直接操作資料庫或後端 SDK |
| `src/components/` | 純 UI 元件，無業務邏輯 | 直接呼叫 API，邏輯應在 hooks 或 lib |

## 前後端分離

```typescript
// ❌ 錯誤：前端直接引用後端模組
import { db } from '../../api/admin/_supabase'

// ✅ 正確：前端透過 HTTP 呼叫後端
import { adminApi } from '@/lib/admin-api'
const data = await adminApi.getHospitals()
```

## 模組化設計

- 每個模組單一職責，不跨模組直接引用內部實作
- 模組對外只暴露公開介面，內部細節以 `_` 前綴命名（如 `_supabase.ts`）
- 共用型別定義放在 `src/types/`，前後端不重複定義

```typescript
// ❌ 跨模組直接引用內部實作
import { supabase } from '../hospitals/_supabase'

// ✅ 只使用模組公開介面
import { getHospital } from '../hospitals'
```

## Import 規範

- 前端使用 `@/` alias 對應 `src/`
- 禁止從前端跨層引用：`src/` → `api/`（直接 import 後端檔案）
- API 路由處理器只做「接收請求 → 呼叫 service → 回傳結果」，業務邏輯抽出至 service 層
