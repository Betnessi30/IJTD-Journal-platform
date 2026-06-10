// src/pages/admin/AdminLayout.jsx
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  BookOpen, LayoutDashboard, FileText, Users, BookMarked,
  Settings, LogOut, Menu, X, Mail, ClipboardList
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/admin/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/admin/manuscripts',  label: 'Manuscripts',   icon: FileText },
  { to: '/admin/issues',       label: 'Issues',        icon: BookMarked },
  { to: '/admin/applications', label: 'Applications',  icon: ClipboardList },
  { to: '/admin/messages',     label: 'Messages',      icon: Mail },
  { to: '/admin/users',        label: 'Users',         icon: Users,    adminOnly: true },
  { to: '/admin/settings',     label: 'Settings',      icon: Settings },
]

const AdminLayout = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/admin/login') }

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-gray-900 ${mobile ? 'w-64' : 'w-56'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">IJTD Admin</p>
          <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS
          .filter(item => !item.adminOnly || isAdmin)
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => mobile && setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-4 border-t border-gray-800">
        <Link to="/" target="_blank" className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors mb-1">
          <BookOpen className="w-4 h-4" />View Public Site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{user?.full_name}</span>
            <span className="text-gray-400 ml-2 capitalize">({user?.role})</span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout