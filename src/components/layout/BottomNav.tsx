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
                                `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
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
