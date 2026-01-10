import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Plus, CreditCard, Search } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import clsx from 'clsx'

export default function PagosLista() {
  const [clienteId, setClienteId] = useState('')
  const { isAdmin } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['pagos', clienteId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (clienteId) params.append('cliente_id', clienteId)
      params.append('limit', 50)
      const res = await api.get(`/pagos?${params}`)
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Pagos</h1>
          <p className="text-gray-500 text-sm">Registro de pagos recibidos</p>
        </div>
        <Link to="/pagos/nuevo" className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} />
          Registrar Pago
        </Link>
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
                  <th>Recibo</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th className="text-right">Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data?.length > 0 ? (
                  data.data.map((pago) => (
                    <tr key={pago.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} className="text-success" />
                          <span className="font-mono text-sm">{pago.numero_recibo}</span>
                        </div>
                      </td>
                      <td>{pago.cliente_nombre || `#${pago.cliente_id}`}</td>
                      <td>{formatDate(pago.fecha_pago)}</td>
                      <td>{pago.tipo_pago}</td>
                      <td className="text-right font-semibold text-success">
                        {formatMoney(pago.monto_total)}
                      </td>
                      <td>
                        <span className={clsx(
                          'badge',
                          pago.estado === 'Aplicado' ? 'badge-success' :
                          pago.estado === 'Cancelado' ? 'badge-error' : 'badge-warning'
                        )}>
                          {pago.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">
                      No hay pagos registrados
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
