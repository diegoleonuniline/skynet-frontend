import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Search, FileText, Filter } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import clsx from 'clsx'

export default function CargosLista() {
  const [searchParams] = useSearchParams()
  const clienteIdParam = searchParams.get('cliente_id')
  const [soloPendientes, setSoloPendientes] = useState(true)
  const { isAdmin } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['cargos', clienteIdParam, soloPendientes],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (clienteIdParam) params.append('cliente_id', clienteIdParam)
      if (soloPendientes) params.append('solo_pendientes', 'true')
      params.append('limit', 100)
      const res = await api.get(`/cargos?${params}`)
      return res.data
    }
  })

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Cargos</h1>
        <p className="text-gray-500 text-sm">Estado de cuenta y cargos generados</p>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={soloPendientes}
              onChange={(e) => setSoloPendientes(e.target.checked)}
              className="w-4 h-4 text-secondary rounded"
            />
            <span className="text-sm">Solo pendientes</span>
          </label>
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
                  <th>Concepto</th>
                  <th>Periodo</th>
                  <th>Vencimiento</th>
                  <th className="text-right">Monto</th>
                  <th className="text-right">Pagado</th>
                  <th className="text-right">Saldo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data?.length > 0 ? (
                  data.data.map((cargo) => (
                    <tr key={cargo.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-secondary" />
                          <div>
                            <p className="font-medium">{cargo.concepto}</p>
                            <p className="text-xs text-gray-400">{cargo.tipo_cargo}</p>
                          </div>
                        </div>
                      </td>
                      <td>{cargo.periodo_mes}/{cargo.periodo_anio}</td>
                      <td>{formatDate(cargo.fecha_vencimiento)}</td>
                      <td className="text-right font-medium">{formatMoney(cargo.monto)}</td>
                      <td className="text-right text-success">{formatMoney(cargo.monto_pagado)}</td>
                      <td className="text-right">
                        <span className={clsx(
                          'font-semibold',
                          cargo.saldo > 0 ? 'text-error' : 'text-success'
                        )}>
                          {formatMoney(cargo.saldo)}
                        </span>
                      </td>
                      <td>
                        <span className={clsx(
                          'badge',
                          cargo.estado === 'Pagado' ? 'badge-success' :
                          cargo.estado === 'Parcial' ? 'badge-warning' : 'badge-error'
                        )}>
                          {cargo.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-400">
                      No hay cargos registrados
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
