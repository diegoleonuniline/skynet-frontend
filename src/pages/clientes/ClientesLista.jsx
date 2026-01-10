import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { 
  Search, 
  Plus, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Phone,
  Mail
} from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import clsx from 'clsx'

export default function ClientesLista() {
  const [search, setSearch] = useState('')
  const [estadoId, setEstadoId] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', search, estadoId, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('busqueda', search)
      if (estadoId) params.append('estado_id', estadoId)
      params.append('page', page)
      params.append('limit', 15)
      
      const res = await api.get(`/clientes?${params}`)
      return res.data
    }
  })

  const { data: estados } = useQuery({
    queryKey: ['cat-estados-cliente'],
    queryFn: async () => {
      const res = await api.get('/catalogos/estados_cliente')
      return res.data.data
    }
  })

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(amount || 0)
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      'Activo': 'badge-success',
      'Suspendido': 'badge-warning',
      'Cancelado': 'badge-error',
      'Pendiente': 'badge-info'
    }
    return badges[estado] || 'badge-neutral'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="text-gray-500 text-sm">Gestiona los clientes del sistema</p>
        </div>
        <Link to="/clientes/nuevo" className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} />
          Nuevo Cliente
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, número o teléfono..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={estadoId}
              onChange={(e) => { setEstadoId(e.target.value); setPage(1); }}
              className="input w-auto min-w-[150px]"
            >
              <option value="">Todos los estados</option>
              {estados?.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th className="hidden md:table-cell">Contacto</th>
                    <th className="hidden lg:table-cell">Ubicación</th>
                    <th>Adeudo</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.data?.length > 0 ? (
                    data.data.map((cliente) => (
                      <tr 
                        key={cliente.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/clientes/${cliente.id}`)}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-medium">
                              {cliente.nombre?.charAt(0)}{cliente.apellido_paterno?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-primary">
                                {cliente.nombre} {cliente.apellido_paterno} {cliente.apellido_materno || ''}
                              </p>
                              <p className="text-xs text-gray-500">{cliente.numero_cliente}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell">
                          <div className="space-y-1">
                            <p className="flex items-center gap-1 text-sm">
                              <Phone size={12} className="text-gray-400" />
                              {cliente.telefono_principal}
                            </p>
                            {cliente.email && (
                              <p className="flex items-center gap-1 text-sm text-gray-500">
                                <Mail size={12} className="text-gray-400" />
                                {cliente.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="hidden lg:table-cell">
                          <p className="text-sm">{cliente.colonia || '-'}</p>
                          <p className="text-xs text-gray-500">{cliente.ciudad || ''}</p>
                        </td>
                        <td>
                          <span className={clsx(
                            'font-medium',
                            cliente.adeudo > 0 ? 'text-error' : 'text-success'
                          )}>
                            {formatMoney(cliente.adeudo)}
                          </span>
                        </td>
                        <td>
                          <span className={getEstadoBadge(cliente.estado)}>
                            {cliente.estado}
                          </span>
                        </td>
                        <td className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Link 
                              to={`/clientes/${cliente.id}`}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                            >
                              <Eye size={16} />
                            </Link>
                            {isAdmin() && (
                              <Link 
                                to={`/clientes/${cliente.id}/editar`}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                              >
                                <Edit size={16} />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-400">
                        No se encontraron clientes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Mostrando {((page - 1) * 15) + 1} - {Math.min(page * 15, data.pagination.total)} de {data.pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-medium">
                    {page} / {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                    disabled={page === data.pagination.pages}
                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
