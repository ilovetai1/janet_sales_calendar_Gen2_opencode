import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto min-h-screen w-full max-w-3xl pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
