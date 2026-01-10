import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Layout
import Layout from './components/layout/Layout'

// Auth
import Login from './pages/auth/Login'

// Pages
import Dashboard from './pages/Dashboard'
import ClientesLista from './pages/clientes/ClientesLista'
import ClienteDetalle from './pages/clientes/ClienteDetalle'
import ClienteForm from './pages/clientes/ClienteForm'
import ServiciosLista from './pages/servicios/ServiciosLista'
import ServicioForm from './pages/servicios/ServicioForm'
import InstalacionesLista from './pages/instalaciones/InstalacionesLista'
import EquiposLista from './pages/equipos/EquiposLista'
import CargosLista from './pages/cargos/CargosLista'
import PagosLista from './pages/pagos/PagosLista'
import PagoForm from './pages/pagos/PagoForm'
import UsuariosLista from './pages/usuarios/UsuariosLista'
import CatalogosLista from './pages/catalogos/CatalogosLista'
import ReportesLista from './pages/reportes/ReportesLista'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  if (!isAdmin()) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        
        {/* Clientes */}
        <Route path="clientes" element={<ClientesLista />} />
        <Route path="clientes/nuevo" element={<ClienteForm />} />
        <Route path="clientes/:id" element={<ClienteDetalle />} />
        <Route path="clientes/:id/editar" element={<ClienteForm />} />

        {/* Servicios */}
        <Route path="servicios" element={<ServiciosLista />} />
        <Route path="servicios/nuevo" element={<ServicioForm />} />

        {/* Instalaciones */}
        <Route path="instalaciones" element={<InstalacionesLista />} />

        {/* Equipos */}
        <Route path="equipos" element={<EquiposLista />} />

        {/* Cargos */}
        <Route path="cargos" element={<CargosLista />} />

        {/* Pagos */}
        <Route path="pagos" element={<PagosLista />} />
        <Route path="pagos/nuevo" element={<PagoForm />} />

        {/* Admin Only */}
        <Route path="usuarios" element={
          <AdminRoute>
            <UsuariosLista />
          </AdminRoute>
        } />
        <Route path="catalogos" element={
          <AdminRoute>
            <CatalogosLista />
          </AdminRoute>
        } />
        <Route path="reportes" element={
          <AdminRoute>
            <ReportesLista />
          </AdminRoute>
        } />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
