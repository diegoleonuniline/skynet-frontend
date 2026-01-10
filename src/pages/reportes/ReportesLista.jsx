import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { BarChart3, Users, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import clsx from 'clsx'

export default function ReportesLista() {
  const [periodo, setPeriodo] = useState('mes')

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['reportes-dashboard'],
    queryFn: async () => {
      const res = await api.get('/reportes/dashboard')
      return res.data.data
    }
  })

  const { data: clientesAdeudo } = useQuery({
    queryKey: ['reportes-adeudo'],
    queryFn: async () => {
      const res = await api.get('/reportes/clientes-adeudo?limite=10')
      return res.data.data
    }
  })

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(amount || 0)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Reportes</h1>
        <p className="text-gray-500 text-sm">Análisis y métricas del negocio</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Clientes Activos</p>
              <p className="text-2xl font-bold text-primary">{dashboard?.clientes?.activos || 0}</p>
            </div>
            <Users className="text-secondary" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ingreso Mensual</p>
              <p className="text-2xl font-bold text-success">{formatMoney(dashboard?.servicios?.ingreso_mensual)}</p>
            </div>
            <TrendingUp className="text-success" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cobrado Hoy</p>
              <p className="text-2xl font-bold text-secondary">{formatMoney(dashboard?.pagos_hoy?.monto)}</p>
            </div>
            <DollarSign className="text-secondary" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Adeudo Total</p>
              <p className="text-2xl font-bold text-error">{formatMoney(dashboard?.adeudo_total)}</p>
            </div>
            <BarChart3 className="text-error" size={24} />
          </div>
        </div>
      </div>

      {/* Clientes con Adeudo */}
      <div className="card">
        <h2 className="section-title">Clientes con Mayor Adeudo</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th className="text-right">Adeudo</th>
                <th>Meses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientesAdeudo?.length > 0 ? (
                clientesAdeudo.map((cliente) => (
                  <tr key={cliente.cliente_id}>
                    <td>
                      <p className="font-medium">{cliente.nombre_completo}</p>
                      <p className="text-xs text-gray-400">{cliente.numero_cliente}</p>
                    </td>
                    <td>{cliente.telefono}</td>
                    <td className="text-right font-semibold text-error">
                      {formatMoney(cliente.adeudo_total)}
                    </td>
                    <td>
                      <span className={clsx(
                        'badge',
                        cliente.meses_adeudo >= 3 ? 'badge-error' :
                        cliente.meses_adeudo >= 2 ? 'badge-warning' : 'badge-info'
                      )}>
                        {cliente.meses_adeudo} mes(es)
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-400">
                    No hay clientes con adeudo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen del Mes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="section-title">Resumen del Mes</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-500">Pagos Recibidos</span>
              <span className="font-semibold">{dashboard?.pagos_mes?.cantidad || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-500">Monto Recaudado</span>
              <span className="font-semibold text-success">{formatMoney(dashboard?.pagos_mes?.monto)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-500">Instalaciones Pendientes</span>
              <span className="font-semibold">{dashboard?.instalaciones_pendientes || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-500">Ingreso Proyectado</span>
              <span className="font-semibold text-secondary">{formatMoney(dashboard?.servicios?.ingreso_mensual)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Últimos Pagos</h2>
          <div className="space-y-3">
            {dashboard?.ultimos_pagos?.length > 0 ? (
              dashboard.ultimos_pagos.map((pago, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{pago.cliente}</p>
                    <p className="text-xs text-gray-400">{pago.numero_recibo}</p>
                  </div>
                  <span className="font-semibold text-success">{formatMoney(pago.monto_total)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">Sin pagos recientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
