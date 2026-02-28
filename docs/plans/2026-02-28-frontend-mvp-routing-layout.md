# Frontend MVP Routing and Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Setup Vitest for React TDD, configure basic React Router structures, and implement the reusable Bottom Navigation for the web PWA.

**Architecture:** Use Vitest + React Testing Library for fast TDD. Implement standard React Router layout with an `Outlet` for pages. The Bottom Navigation component will wrap main views, rendering specific shadcn/lucide-react icons based on the active tab route.

**Tech Stack:** React, React Router, Tailwind CSS v4, Vitest, Testing Library, Lucide React

---

### Task 1: Setup Testing Environment (Vitest)

**Files:**
- Create: `vitest.config.ts`
- Create: `src/setupTests.ts`
- Modify: `package.json`

**Step 1: Write the failing test**
Create a dummy test to ensure the suite fails if not run correctly.
```bash
mkdir -p tests
```
Create `tests/setup.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'

describe('Vitest Setup', () => {
  it('should pass if environment is configured correctly', () => {
    // We will expect this to fail initially since vitest is not installed yet
    expect(true).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npm test`
Expected: FAIL because npm test is not wired up to vitest, or vitest is missing.

**Step 3: Write minimal implementation**
Install test deps and configure correctly:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react @testing-library/user-event
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Create `src/setupTests.ts`:
```ts
import '@testing-library/jest-dom'
```

Update `package.json` scripts:
Modify line with `"test"` in scripts or add it:
```json
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
```

Fix the failing test `tests/setup.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'

describe('Vitest Setup', () => {
  it('should pass if environment is configured correctly', () => {
    expect(true).toBe(true)
  })
})
```

**Step 4: Run test to verify it passes**
Run: `npm run test tests/setup.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add package.json package-lock.json vitest.config.ts src/setupTests.ts tests/setup.test.tsx
git commit -m "chore: setup vitest and react testing library"
```

### Task 2: Implement Bottom Navigation UI

**Files:**
- Create: `src/components/layout/BottomNav.tsx`
- Create: `tests/components/layout/BottomNav.test.tsx`

**Step 1: Write the failing test**
Create `tests/components/layout/BottomNav.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { BottomNav } from '@/components/layout/BottomNav'

describe('BottomNav', () => {
  it('renders correctly with 4 main navigation tabs', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    )
    
    expect(screen.getByText('首頁')).toBeInTheDocument()
    expect(screen.getByText('關注名單')).toBeInTheDocument()
    expect(screen.getByText('解析 OCR')).toBeInTheDocument()
    expect(screen.getByText('每日推播')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npm run test tests/components/layout/BottomNav.test.tsx`
Expected: FAIL because `BottomNav` does not exist or fails to compile.

**Step 3: Write minimal implementation**
Create folder: `mkdir -p src/components/layout`
Create `src/components/layout/BottomNav.tsx`:
```tsx
import { NavLink } from 'react-router-dom'
import { Home, Users, Search, FileText, Bell } from 'lucide-react'

export function BottomNav() {
  const navItems = [
    { to: '/', label: '首頁', icon: Home },
    { to: '/follows', label: '關注名單', icon: Users },
    { to: '/upload', label: '解析 OCR', icon: FileText },
    { to: '/digest', label: '每日推播', icon: Bell },
  ]

  return (
    <nav className="fixed bottom-0 w-full border-t border-gray-200 bg-white pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
```

**Step 4: Run test to verify it passes**
Run: `npm run test tests/components/layout/BottomNav.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add tests/components/layout/BottomNav.test.tsx src/components/layout/BottomNav.tsx
git commit -m "feat: implement bottom navigation component"
```

### Task 3: Setup App Layout & Routing

**Files:**
- Create: `src/components/layout/AppLayout.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Create: `tests/AppRouting.test.tsx`

**Step 1: Write the failing test**
Create dummy page components for the test (or rely on placeholders).
Create `tests/AppRouting.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import App from '@/App'

describe('App Routing', () => {
  it('renders the layout and default home page content', () => {
    // Render standard App router tree (assumes App inside MemoryRouter or internally defines Router)
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    
    // Bottom nav should be present
    expect(screen.getByText('每日推播')).toBeInTheDocument()
    // Placeholder for home
    expect(screen.getByText('首頁視圖 (Dashboard)')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npm run test tests/AppRouting.test.tsx`
Expected: FAIL because `App` is the Vite default right now and does not contain our layouts.

**Step 3: Write minimal implementation**
Create `src/components/layout/AppLayout.tsx`:
```tsx
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 pb-16 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
```

Modify `src/App.tsx`:
```tsx
import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'

// Simple placeholder components for MVP
const Home = () => <div className="p-4"><h1>首頁視圖 (Dashboard)</h1></div>
const Follows = () => <div className="p-4"><h1>我的關注清單</h1></div>
const Upload = () => <div className="p-4"><h1>解析 OCR</h1></div>
const Digest = () => <div className="p-4"><h1>每日門診異動總覽</h1></div>
const NotFound = () => <div className="p-4"><h1>404 Not Found</h1></div>

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/follows" element={<Follows />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/digest" element={<Digest />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
```

Modify `src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

**Step 4: Run test to verify it passes**
Run: `npm run test tests/AppRouting.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/layout/AppLayout.tsx src/App.tsx src/main.tsx tests/AppRouting.test.tsx
git commit -m "feat: setup react router and base app layout"
```
