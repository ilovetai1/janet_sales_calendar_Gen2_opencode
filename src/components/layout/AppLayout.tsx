import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* 
        This is where child routes will render.
        Padding bottom added to prevent content from hiding behind the BottomNav
      */}
            <main className="flex-1 pb-16">
                <Outlet />
            </main>

            <BottomNav />
        </div>
    )
}
