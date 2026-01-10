import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  CreditCard, 
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Wifi,
  Wrench,
  DollarSign,
  BarChart3,
  Database
} from 'lucide-react'
import clsx from 'clsx'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', permission: null },
  { path: '/clientes', icon: Users, label: 'Clientes', permission: 'clientes:leer' },
  { path: '/servicios', icon: Wifi, label: 'Servicios', permission: 'servicios:leer' },
  { path: '/instalaciones', icon: Wrench, label: 'Instalaciones', permission: 'instalaciones:leer' },
  { path: '/equipos', icon: Package, label: 'Equipos', permission: 'equipos:leer' },
  { path: '/cargos', icon: FileText, label: 'Cargos', permission: 'cargos:leer' },
  { path: '/pagos', icon: DollarSign, label: 'Pagos', permission: 'pagos:leer' },
  { path: '/reportes', icon: BarChart3, label: 'Reportes', permission: 'reportes:leer', adminOnly: true },
  { path: '/usuarios', icon: Users, label: 'Usuarios', permission: 'usuarios:leer', adminOnly: true },
  { path: '/catalogos', icon: Database, label: 'Catálogos', permission: 'catalogos:leer', adminOnly: true },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout, hasPermission, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredMenu = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin()) return false
    if (item.permission) {
      const [modulo, accion] = item.permission.split(':')
      return hasPermission(modulo, accion)
    }
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed top-0 left-0 z-50 h-full w-64 bg-primary text-white transform transition-transform duration-200 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">SKYNET</h1>
              <p className="text-xs text-white/60">ISP MANAGEMENT</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-white/10 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                isActive 
                  ? 'bg-secondary text-white' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* New Client Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <button 
            onClick={() => { navigate('/clientes/nuevo'); setSidebarOpen(false); }}
            className="w-full btn bg-secondary hover:bg-secondary-600 text-white flex items-center justify-center gap-2"
          >
            <Users size={18} />
            Nuevo Cliente
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar clientes..."
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            </button>

            {/* Settings */}
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings size={20} className="text-gray-600" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
              >
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-medium">
                  {user?.nombre_completo?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700">{user?.nombre_completo || 'Usuario'}</p>
                  <p className="text-xs text-gray-500">{user?.rol || 'Rol'}</p>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut size={16} />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
