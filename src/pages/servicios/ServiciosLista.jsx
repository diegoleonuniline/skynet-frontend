import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Plus, Search, Wifi, User } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import clsx from 'clsx'

export default function ServiciosLista() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['servicios', search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('busqueda', search)
      params.append('limit', 50)
      const res = await api.get(`/servicios?${params}`)
      return res.data
    }
  })

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(amount || 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Servicios</h1>
          <p className="text-gray-500 text-sm">Gestiona los servicios contratados</p>
        </div>
        <Link to="/servicios/nuevo" className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} />
          Nuevo Servicio
        </Link>
      </div>

      <div className="card">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Plan / Tarifa</th>
                  <th>Precio</th>
                  <th>IP</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data?.length > 0 ? (
                  data.data.map((servicio) => (
                    <tr 
                      key={servicio.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/clientes/${servicio.cliente_id}`)}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span>{servicio.cliente_nombre || `Cliente #${servicio.cliente_id}`}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Wifi size={16} className="text-secondary" />
                          <div>
                            <p className="font-medium">{servicio.tarifa_nombre}</p>
                            <p className="text-xs text-gray-400">{servicio.velocidad_mbps} Mbps</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-medium">{formatMoney(servicio.precio_mensual)}</td>
                      <td className="font-mono text-sm">{servicio.ip_asignada || '-'}</td>
                      <td>
                        <span className={clsx(
                          'badge',
                          servicio.estado === 'Activo' ? 'badge-success' :
                          servicio.estado === 'Pendiente' ? 'badge-warning' : 'badge-error'
                        )}>
                          {servicio.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">
                      No hay servicios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
