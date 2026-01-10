import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Search, Package, Wifi, Router } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'

export default function EquiposLista() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['equipos', search],
    queryFn: async () => {
      const res = await api.get('/equipos?limit=100')
      return res.data
    }
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Equipos</h1>
        <p className="text-gray-500 text-sm">Inventario de equipos instalados</p>
      </div>

      <div className="card">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por MAC, serie..."
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
                  <th>Equipo</th>
                  <th>MAC Address</th>
                  <th>No. Serie</th>
                  <th>IP</th>
                  <th>Servicio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data?.length > 0 ? (
                  data.data.map((equipo) => (
                    <tr key={equipo.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-secondary/10 rounded-lg">
                            {equipo.tipo === 'Router' ? <Router size={18} className="text-secondary" /> :
                             equipo.tipo === 'ONT' ? <Wifi size={18} className="text-secondary" /> :
                             <Package size={18} className="text-secondary" />}
                          </div>
                          <div>
                            <p className="font-medium">{equipo.marca} {equipo.modelo}</p>
                            <p className="text-xs text-gray-400">{equipo.tipo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{equipo.mac_address || '-'}</td>
                      <td>{equipo.numero_serie || '-'}</td>
                      <td className="font-mono text-sm">{equipo.ip || '-'}</td>
                      <td>#{equipo.servicio_id}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">
                      No hay equipos registrados
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
