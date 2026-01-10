import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Calendar, Clock, MapPin, User, Check, RefreshCw } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import clsx from 'clsx'

export default function InstalacionesLista() {
  const [estado, setEstado] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['instalaciones', estado],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (estado) params.append('estado_id', estado)
      params.append('limit', 50)
      const res = await api.get(`/instalaciones?${params}`)
      return res.data
    }
  })

  const { data: estados } = useQuery({
    queryKey: ['cat-estados-instalacion'],
    queryFn: async () => {
      const res = await api.get('/catalogos/estados_instalacion')
      return res.data.data
    }
  })

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-MX', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'Completada': return <Check className="text-success" size={16} />
      case 'Programada': return <Clock className="text-warning" size={16} />
      case 'Reprogramada': return <RefreshCw className="text-secondary" size={16} />
      default: return <Calendar className="text-gray-400" size={16} />
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Instalaciones</h1>
        <p className="text-gray-500 text-sm">Gestiona las instalaciones programadas</p>
      </div>

      <div className="card">
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="input w-auto min-w-[200px]"
        >
          <option value="">Todos los estados</option>
          {estados?.map(e => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Spinner />
          </div>
        ) : data?.data?.length > 0 ? (
          data.data.map((instalacion) => (
            <div key={instalacion.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className={clsx(
                  'badge',
                  instalacion.estado === 'Completada' ? 'badge-success' :
                  instalacion.estado === 'Programada' ? 'badge-warning' :
                  instalacion.estado === 'Cancelada' ? 'badge-error' : 'badge-info'
                )}>
                  {getStatusIcon(instalacion.estado)}
                  <span className="ml-1">{instalacion.estado}</span>
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  <span className="font-medium">{instalacion.cliente_nombre || 'Cliente'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span>{formatDate(instalacion.fecha_programada)}</span>
                </div>
                {instalacion.direccion && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-gray-400 mt-0.5" />
                    <span className="text-gray-600">{instalacion.direccion}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-400">
            No hay instalaciones registradas
          </div>
        )}
      </div>
    </div>
  )
}
