import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { 
  Edit, 
  DollarSign, 
  Mail, 
  MapPin, 
  Phone,
  Calendar,
  Wifi,
  Package,
  FileText,
  CreditCard,
  Upload,
  Check,
  AlertCircle,
  ChevronRight,
  Plus,
  Clock,
  Eye
} from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import clsx from 'clsx'

const tabs = [
  { id: 'equipos', label: 'Equipos', icon: Package },
  { id: 'cargos', label: 'Estado de Cuenta', icon: FileText },
  { id: 'pagos', label: 'Historial Pagos', icon: CreditCard },
  { id: 'documentos', label: 'Documentos', icon: FileText },
]

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('equipos')

  const { data: cliente, isLoading } = useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      const res = await api.get(`/clientes/${id}`)
      return res.data.data
    }
  })

  const { data: cargos } = useQuery({
    queryKey: ['cargos-cliente', id],
    queryFn: async () => {
      const res = await api.get(`/cargos?cliente_id=${id}&limit=50`)
      return res.data.data
    }
  })

  const { data: pagos } = useQuery({
    queryKey: ['pagos-cliente', id],
    queryFn: async () => {
      if (!isAdmin()) return []
      const res = await api.get(`/pagos?cliente_id=${id}&limit=50`)
      return res.data.data
    },
    enabled: isAdmin()
  })

  const { data: equipos } = useQuery({
    queryKey: ['equipos-cliente', id],
    queryFn: async () => {
      const servicio = cliente?.servicios?.[0]
      if (!servicio) return []
      const res = await api.get(`/equipos?servicio_id=${servicio.id}`)
      return res.data.data
    },
    enabled: !!cliente?.servicios?.length
  })

  const uploadINE = useMutation({
    mutationFn: async ({ tipo, file }) => {
      const formData = new FormData()
      formData.append('ine', file)
      formData.append('tipo', tipo)
      return api.post(`/clientes/${id}/ine`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cliente', id])
      toast.success('INE subida correctamente')
    },
    onError: () => toast.error('Error al subir INE')
  })

  const handleINEUpload = (tipo) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        uploadINE.mutate({ tipo, file })
      }
    }
    input.click()
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cliente no encontrado</p>
        <Link to="/clientes" className="btn-primary mt-4">Volver a Clientes</Link>
      </div>
    )
  }

  const servicio = cliente.servicios?.[0]
  const resumen = cliente.resumen_financiero || {}
  const proximoVencimiento = cargos?.find(c => c.estado === 'Pendiente')?.fecha_vencimiento

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/clientes" className="hover:text-secondary">Clientes</Link>
        <ChevronRight size={14} />
        <span className="text-primary">Detalle Cliente</span>
      </div>

      {/* Header Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Client Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-secondary to-primary rounded-xl flex items-center justify-center text-white text-2xl font-bold">
              {cliente.nombre?.charAt(0)}{cliente.apellido_paterno?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-primary">
                  {cliente.nombre} {cliente.apellido_paterno} {cliente.apellido_materno || ''}
                </h1>
                <span className="text-sm text-gray-500">ID: #{cliente.numero_cliente}</span>
                <span className={clsx(
                  'badge',
                  cliente.estado === 'Activo' ? 'badge-success' : 
                  cliente.estado === 'Suspendido' ? 'badge-warning' : 'badge-error'
                )}>
                  {cliente.estado}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                {cliente.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={14} />
                    {cliente.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Phone size={14} />
                  {cliente.telefono_principal}
                </span>
              </div>
              {cliente.calle && (
                <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <MapPin size={14} />
                  {cliente.calle} {cliente.numero_exterior}, {cliente.colonia}, {cliente.ciudad}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button 
              onClick={() => navigate(`/pagos/nuevo?cliente_id=${id}`)}
              className="btn-primary flex items-center gap-2"
            >
              <DollarSign size={18} />
              Registrar Pago
            </button>
            {isAdmin() && (
              <Link 
                to={`/clientes/${id}/editar`}
                className="btn-outline flex items-center gap-2"
              >
                <Edit size={18} />
                Editar
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monthly Rate */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Mensualidad</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {formatMoney(servicio?.precio_mensual || 0)}
                <span className="text-sm font-normal text-gray-400">/mes</span>
              </p>
              <p className="text-xs text-gray-400 mt-1 uppercase">
                {servicio?.tarifa_nombre || 'Sin plan'}: {servicio?.velocidad_mbps || 0} MBPS
              </p>
            </div>
            <div className="p-3 bg-secondary/10 rounded-lg">
              <DollarSign className="text-secondary" size={24} />
            </div>
          </div>
        </div>

        {/* Current Balance */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Saldo Actual</p>
              <p className={clsx(
                'text-2xl font-bold mt-1',
                resumen.balance > 0 ? 'text-error' : 'text-success'
              )}>
                {formatMoney(Math.abs(resumen.balance || 0))}
              </p>
              <p className={clsx(
                'text-xs mt-1 uppercase font-medium',
                resumen.balance > 0 ? 'text-error' : 'text-success'
              )}>
                {resumen.balance > 0 ? 'Adeudo pendiente' : 'Cuenta al día'}
              </p>
            </div>
            <div className={clsx(
              'p-3 rounded-lg',
              resumen.balance > 0 ? 'bg-error/10' : 'bg-success/10'
            )}>
              {resumen.balance > 0 ? (
                <AlertCircle className="text-error" size={24} />
              ) : (
                <Check className="text-success" size={24} />
              )}
            </div>
          </div>
        </div>

        {/* Next Due Date */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Próximo Vencimiento</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {proximoVencimiento ? formatDate(proximoVencimiento) : 'Sin cargos'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Día de corte: {servicio?.dia_corte || 10}
              </p>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg">
              <Calendar className="text-warning" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-secondary text-secondary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'equipos' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package size={18} className="text-secondary" />
                  Equipos Instalados
                </h3>
                {isAdmin() && (
                  <button className="text-sm text-secondary hover:underline">
                    Administrar
                  </button>
                )}
              </div>
              
              {equipos?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="pb-2 font-medium">Dispositivo</th>
                        <th className="pb-2 font-medium">MAC Address</th>
                        <th className="pb-2 font-medium">No. Serie</th>
                        <th className="pb-2 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {equipos.map((equipo) => (
                        <tr key={equipo.id}>
                          <td className="py-3">
                            <p className="font-medium">{equipo.marca} {equipo.modelo}</p>
                            <p className="text-xs text-gray-400">{equipo.tipo}</p>
                          </td>
                          <td className="py-3 font-mono text-xs">{equipo.mac_address || '-'}</td>
                          <td className="py-3">{equipo.numero_serie || '-'}</td>
                          <td className="py-3">
                            <span className="flex items-center gap-1 text-success">
                              <span className="w-2 h-2 bg-success rounded-full"></span>
                              Activo
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-6">No hay equipos registrados</p>
              )}
            </div>
          )}

          {activeTab === 'cargos' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText size={18} className="text-secondary" />
                  Estado de Cuenta
                </h3>
                <Link to={`/cargos?cliente_id=${id}`} className="text-sm text-secondary hover:underline">
                  Ver completo
                </Link>
              </div>
              
              {cargos?.length > 0 ? (
                <div className="space-y-3">
                  {cargos.slice(0, 10).map((cargo) => (
                    <div key={cargo.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          cargo.estado === 'Pagado' ? 'bg-success/10' : 'bg-warning/10'
                        )}>
                          <FileText size={14} className={cargo.estado === 'Pagado' ? 'text-success' : 'text-warning'} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{cargo.concepto}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(cargo.fecha_emision)} • {cargo.periodo_mes}/{cargo.periodo_anio}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={clsx(
                          'font-semibold',
                          cargo.saldo > 0 ? 'text-error' : 'text-success'
                        )}>
                          {formatMoney(cargo.monto)}
                        </p>
                        <span className={clsx(
                          'text-xs',
                          cargo.estado === 'Pagado' ? 'text-success' : 
                          cargo.estado === 'Parcial' ? 'text-warning' : 'text-gray-400'
                        )}>
                          {cargo.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-6">No hay cargos registrados</p>
              )}
            </div>
          )}

          {activeTab === 'pagos' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard size={18} className="text-secondary" />
                  Historial de Pagos
                </h3>
              </div>
              
              {isAdmin() ? (
                pagos?.length > 0 ? (
                  <div className="space-y-3">
                    {pagos.map((pago) => (
                      <div key={pago.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                            <Plus size={14} className="text-success" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{pago.tipo_pago}</p>
                            <p className="text-xs text-gray-400">
                              {formatDate(pago.fecha_pago)} • {pago.numero_recibo}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-success">
                          -{formatMoney(pago.monto_total)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-6">No hay pagos registrados</p>
                )
              ) : (
                <p className="text-gray-400 text-center py-6">No tienes permiso para ver el historial de pagos</p>
              )}
            </div>
          )}

          {activeTab === 'documentos' && (
            <div className="card">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <FileText size={18} className="text-secondary" />
                Documentos
              </h3>
              <p className="text-gray-400 text-center py-6">
                Los documentos se muestran en la sección de identificación
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - INE */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-secondary" />
              Identificación (INE)
            </h3>

            {/* Front Side */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase font-medium mb-2">Lado Frontal</p>
              {cliente.ine_frente_url ? (
                <div className="relative group">
                  <img 
                    src={cliente.ine_frente_url} 
                    alt="INE Frente"
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="absolute top-2 right-2 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                  <button 
                    onClick={() => handleINEUpload('frente')}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-sm"
                  >
                    Click para re-subir
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleINEUpload('frente')}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-secondary hover:text-secondary transition-colors"
                >
                  <Upload size={24} className="mb-2" />
                  <span className="text-sm">Subir INE Frontal</span>
                  <span className="text-xs">PNG, JPG hasta 10MB</span>
                </button>
              )}
            </div>

            {/* Back Side */}
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-2">Lado Reverso</p>
              {cliente.ine_reverso_url ? (
                <div className="relative group">
                  <img 
                    src={cliente.ine_reverso_url} 
                    alt="INE Reverso"
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="absolute top-2 right-2 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                  <button 
                    onClick={() => handleINEUpload('reverso')}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-sm"
                  >
                    Click para re-subir
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleINEUpload('reverso')}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-secondary hover:text-secondary transition-colors"
                >
                  <Upload size={24} className="mb-2" />
                  <span className="text-sm">Subir INE Reverso</span>
                  <span className="text-xs">PNG, JPG hasta 10MB</span>
                </button>
              )}
            </div>
          </div>

          {/* Service Info */}
          {servicio && (
            <div className="card">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Wifi size={18} className="text-secondary" />
                Servicio
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium">{servicio.tarifa_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Velocidad</span>
                  <span className="font-medium">{servicio.velocidad_mbps} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IP</span>
                  <span className="font-medium font-mono">{servicio.ip_asignada || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estado</span>
                  <span className={clsx(
                    'badge',
                    servicio.estado === 'Activo' ? 'badge-success' : 'badge-warning'
                  )}>
                    {servicio.estado}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Desde</span>
                  <span className="font-medium">{formatDate(servicio.fecha_inicio)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
