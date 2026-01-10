import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { 
  Users, 
  Wifi, 
  DollarSign, 
  AlertCircle,
  TrendingUp,
  Calendar,
  ArrowUpRight
} from 'lucide-react'
import Spinner from '../components/ui/Spinner'

function StatCard({ icon: Icon, label, value, subvalue, color, link }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  const content = (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-primary">{value}</p>
          {subvalue && <p className="text-xs text-gray-400 mt-1">{subvalue}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )

  if (link) {
    return <Link to={link}>{content}</Link>
  }
  return content
}

export default function Dashboard() {
  const { isAdmin } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      if (!isAdmin()) return null
      const res = await api.get('/reportes/dashboard')
      return res.data.data
    },
    enabled: isAdmin()
  })

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <h1 className="page-title mb-4">Bienvenido a Skynet</h1>
        <p className="text-gray-500 mb-6">Selecciona una opción del menú para comenzar</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <Link to="/clientes" className="card hover:shadow-md transition-shadow text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-secondary" />
            <p className="font-medium">Ver Clientes</p>
          </Link>
          <Link to="/pagos/nuevo" className="card hover:shadow-md transition-shadow text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-success" />
            <p className="font-medium">Registrar Pago</p>
          </Link>
          <Link to="/instalaciones" className="card hover:shadow-md transition-shadow text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-warning" />
            <p className="font-medium">Instalaciones</p>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(amount || 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('es-MX', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Clientes Activos"
          value={data?.clientes?.activos || 0}
          subvalue={`${data?.clientes?.total || 0} total`}
          color="blue"
          link="/clientes"
        />
        <StatCard
          icon={Wifi}
          label="Servicios Activos"
          value={data?.servicios?.activos || 0}
          subvalue={formatMoney(data?.servicios?.ingreso_mensual) + '/mes'}
          color="green"
          link="/servicios"
        />
        <StatCard
          icon={DollarSign}
          label="Cobrado Hoy"
          value={formatMoney(data?.pagos_hoy?.monto)}
          subvalue={`${data?.pagos_hoy?.cantidad || 0} pagos`}
          color="purple"
          link="/pagos"
        />
        <StatCard
          icon={AlertCircle}
          label="Adeudo Total"
          value={formatMoney(data?.adeudo_total)}
          subvalue="Pendiente de cobro"
          color="red"
          link="/cargos"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Summary */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Resumen del Mes</h2>
            <TrendingUp className="text-success" size={20} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{data?.pagos_mes?.cantidad || 0}</p>
              <p className="text-sm text-gray-500">Pagos</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-success">{formatMoney(data?.pagos_mes?.monto)}</p>
              <p className="text-sm text-gray-500">Recaudado</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-secondary">{data?.instalaciones_pendientes || 0}</p>
              <p className="text-sm text-gray-500">Instalaciones</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{formatMoney(data?.servicios?.ingreso_mensual)}</p>
              <p className="text-sm text-gray-500">Proyectado</p>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Últimos Pagos</h2>
            <Link to="/pagos" className="text-secondary text-sm hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {data?.ultimos_pagos?.length > 0 ? (
              data.ultimos_pagos.map((pago, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{pago.cliente}</p>
                    <p className="text-xs text-gray-500">{pago.numero_recibo}</p>
                  </div>
                  <span className="font-semibold text-success">{formatMoney(pago.monto_total)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">Sin pagos recientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
