# Frontend PWA UI Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 將 Pencil MCP 所繪製的四個 PWA 行動版畫面（首頁、關注名單、解析 OCR、每日推播）轉換為實際的 React UI 元件。

**Architecture:** 為四個主要路由 (`/`, `/follows`, `/upload`, `/digest`) 各自建立對應的 Page 元件，替換掉目前在 `App.tsx` 中的 Mock functions。各個畫面均會帶有 header 與 content 區塊，並採用 Medical Teal (`#0891B2`) 等主要色系進行 Tailwind 樣式刻畫。

**Tech Stack:** React, React Router, Tailwind CSS, shadcn/ui, Vitest, Testing Library

---

### Task 1: Home Page (Sales PWA Home)

**Files:**
- Create: `src/pages/Home.tsx`
- Modify: `src/App.tsx:1-25` (將原本 Mock 的 `const Home` 替換為實際匯入)
- Test: `tests/pages/Home.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Home } from '@/pages/Home'

describe('Home Page', () => {
  it('renders the header and main content area', () => {
    render(<Home />)
    expect(screen.getByText('首頁視圖')).toBeInTheDocument()
    // 我們預期會有歡迎詞或是區塊
    expect(screen.getByText('今日門診概況')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/pages/Home.test.tsx`
Expected: FAIL with Error / "Unable to find an element"

**Step 3: Write minimal implementation**

```tsx
// src/pages/Home.tsx
export function Home() {
  return (
    <div className="w-full min-h-full bg-teal-50 flex flex-col">
      <header className="h-16 bg-white border-b border-teal-100 flex items-center px-4">
        <h1 className="text-xl font-bold text-teal-900">首頁視圖</h1>
      </header>
      <main className="flex-1 p-6 flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-teal-800">今日門診概況</h2>
        {/* Placeholder for future hospital cards */}
      </main>
    </div>
  )
}
```

修改 `src/App.tsx` 替換上方 Mock:
```tsx
import { Home } from '@/pages/Home'
// 刪除舊的 const Home = ...
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/pages/Home.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/pages/Home.test.tsx src/pages/Home.tsx src/App.tsx
git commit -m "feat: implement Home page UI based on mockup"
```

---

### Task 2: My Follows Page

**Files:**
- Create: `src/pages/Follows.tsx`
- Modify: `src/App.tsx:1-25`
- Test: `tests/pages/Follows.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Follows } from '@/pages/Follows'

describe('Follows Page', () => {
  it('renders the search box and list wrapper', () => {
    render(<Follows />)
    expect(screen.getByPlaceholderText('搜尋醫師或醫院...')).toBeInTheDocument()
    expect(screen.getByText('我的關注')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/pages/Follows.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

```tsx
// src/pages/Follows.tsx
export function Follows() {
  return (
    <div className="w-full min-h-full bg-teal-50 flex flex-col">
      <header className="h-16 bg-white border-b border-teal-100 flex items-center px-4">
        <h1 className="text-xl font-bold text-teal-900">我的關注</h1>
      </header>
      <div className="p-4 bg-white border-b border-teal-100">
        <input 
          type="text" 
          placeholder="搜尋醫師或醫院..." 
          className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <main className="flex-1 p-4 flex flex-col gap-2">
        {/* Placeholder for physicians list */}
      </main>
    </div>
  )
}
```

修改 `src/App.tsx` 匯入 `Follows`：
```tsx
import { Follows } from '@/pages/Follows'
// 刪除舊的 const Follows = ...
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/pages/Follows.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/pages/Follows.test.tsx src/pages/Follows.tsx src/App.tsx
git commit -m "feat: implement Follows page UI with search input"
```

---

### Task 3: Upload OCR Page

**Files:**
- Create: `src/pages/Upload.tsx`
- Modify: `src/App.tsx:1-25`
- Test: `tests/pages/Upload.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Upload } from '@/pages/Upload'

describe('Upload Page', () => {
  it('renders upload instructions', () => {
    render(<Upload />)
    expect(screen.getByText('解析 OCR')).toBeInTheDocument()
    expect(screen.getByText('上傳門診表圖片')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/pages/Upload.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

```tsx
// src/pages/Upload.tsx
export function Upload() {
  return (
    <div className="w-full min-h-full bg-teal-50 flex flex-col">
      <header className="h-16 bg-white border-b border-teal-100 flex items-center px-4">
        <h1 className="text-xl font-bold text-teal-900">解析 OCR</h1>
      </header>
      <main className="flex-1 p-4 flex flex-col gap-4">
        <div className="flex-1 border-2 border-dashed border-teal-300 rounded-xl bg-white flex items-center justify-center p-6 text-center">
            <p className="text-teal-700 font-medium">上傳門診表圖片</p>
        </div>
      </main>
    </div>
  )
}
```

修改 `src/App.tsx` 匯入 `Upload`：
```tsx
import { Upload } from '@/pages/Upload'
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/pages/Upload.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/pages/Upload.test.tsx src/pages/Upload.tsx src/App.tsx
git commit -m "feat: implement Upload OCR placeholder page UI"
```

---

### Task 4: Daily Digest Page

**Files:**
- Create: `src/pages/Digest.tsx`
- Modify: `src/App.tsx:1-25`
- Test: `tests/pages/Digest.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Digest } from '@/pages/Digest'

describe('Digest Page', () => {
  it('renders title and content structure', () => {
    render(<Digest />)
    expect(screen.getByText('每日推播')).toBeInTheDocument()
    expect(screen.getByText('尚未有新的異動通知')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/pages/Digest.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

```tsx
// src/pages/Digest.tsx
export function Digest() {
  return (
    <div className="w-full min-h-full bg-teal-50 flex flex-col">
      <header className="h-16 bg-white border-b border-teal-100 flex items-center px-4">
        <h1 className="text-xl font-bold text-teal-900">每日推播</h1>
      </header>
      <main className="flex-1 p-4 flex flex-col">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <p className="text-slate-500">尚未有新的異動通知</p>
        </div>
      </main>
    </div>
  )
}
```

修改 `src/App.tsx` 匯入 `Digest`：
```tsx
import { Digest } from '@/pages/Digest'
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/pages/Digest.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/pages/Digest.test.tsx src/pages/Digest.tsx src/App.tsx
git commit -m "feat: implement Daily Digest page UI"
```
