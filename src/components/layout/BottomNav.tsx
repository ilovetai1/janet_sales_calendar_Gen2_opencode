import { NavLink } from 'react-router-dom'
import { Home, Users, FileText, Bell } from 'lucide-react'

export function BottomNav() {
  const navItems = [
    { to: '/', label: '首頁', icon: Home },
    { to: '/follows', label: '關注名單', icon: Users },
    { to: '/upload', label: '解析 OCR', icon: FileText },
    { to: '/digest', label: '每日推播', icon: Bell }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 w-full border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex h-full w-full flex-col items-center justify-center space-y-1 ${
                  isActive ? 'text-cyan-700' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
