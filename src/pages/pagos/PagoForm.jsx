import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ChevronRight, Save, Search, DollarSign, FileText, Check, AlertCircle } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import clsx from 'clsx'

export default function PagoForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clienteIdParam = searchParams.get('cliente_id')

  const [clienteSearch, setClienteSearch] = useState('')
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [preview, setPreview] = useState(null)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm()
  const montoTotal = watch('monto_total')

  // Buscar clientes
  const { data: clientes } = useQuery({
    queryKey: ['clientes-search', clienteSearch],
    queryFn: async () => {
      if (!clienteSearch && !clienteIdParam) return []
      const params = new URLSearchParams()
      if (clienteSearch) params.append('busqueda', clienteSearch)
      params.append('limit', 10)
      const res = await api.get(`/clientes?${params}`)
      return res.data.data
    },
    enabled: !!clienteSearch || !!clienteIdParam
  })

  // Cargar cliente si viene en params
  useEffect(() => {
    if (clienteIdParam) {
      api.get(`/clientes/${clienteIdParam}`).then(res => {
        setSelectedCliente(res.data.data)
      })
    }
  }, [clienteIdParam])

  // Tipos de pago
  const { data: tiposPago } = useQuery({
    queryKey: ['cat-tipos-pago'],
    queryFn: async () => {
      const res = await api.get('/catalogos/tipos_pago')
      return res.data.data
    }
  })

  // Cargos pendientes del cliente
  const { data: cargosPendientes } = useQuery({
    queryKey: ['cargos-pendientes', selectedCliente?.id],
    queryFn: async () => {
      const res = await api.get(`/cargos?cliente_id=${selectedCliente.id}&solo_pendientes=true`)
      return res.data.data
    },
    enabled: !!selectedCliente
  })

  // Preview del pago
  const previewMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/pagos/preview', data)
      return res.data.data
    },
    onSuccess: (data) => {
      setPreview(data)
    }
  })

  // Aplicar pago
  const mutation = useMutation({
    mutationFn: async (data) => {
      return api.post('/pagos', data)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['pagos'])
      queryClient.invalidateQueries(['cliente', selectedCliente.id])
      toast.success('Pago registrado correctamente')
      navigate(`/clientes/${selectedCliente.id}`)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al registrar pago')
    }
  })

  // Calcular preview cuando cambia el monto
  useEffect(() => {
    if (selectedCliente && montoTotal && parseFloat(montoTotal) > 0) {
      const timer = setTimeout(() => {
        previewMutation.mutate({
          cliente_id: selectedCliente.id,
          monto_total: parseFloat(montoTotal)
        })
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setPreview(null)
    }
  }, [selectedCliente, montoTotal])

  const onSubmit = (data) => {
    if (!selectedCliente) {
      toast.error('Selecciona un cliente')
      return
    }
    mutation.mutate({
      ...data,
      cliente_id: selectedCliente.id,
      monto_total: parseFloat(data.monto_total)
    })
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(amount || 0)
  }

  const totalAdeudo = cargosPendientes?.reduce((sum, c) => sum + parseFloat(c.saldo || 0), 0) || 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/pagos" className="hover:text-secondary">Pagos</Link>
        <ChevronRight size={14} />
        <span className="text-primary">Registrar Pago</span>
      </div>

      <div>
        <h1 className="page-title">Registrar Pago</h1>
        <p className="text-gray-500 text-sm">Registra un pago de cliente</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <div className="card">
            <h2 className="section-title">Cliente</h2>
            {selectedCliente ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{selectedCliente.nombre} {selectedCliente.apellido_paterno}</p>
                  <p className="text-sm text-gray-500">{selectedCliente.numero_cliente}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Adeudo actual</p>
                  <p className={clsx(
                    'font-bold text-lg',
                    totalAdeudo > 0 ? 'text-error' : 'text-success'
                  )}>
                    {formatMoney(totalAdeudo)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={clienteSearch}
                    onChange={(e) => setClienteSearch(e.target.value)}
                    className="input pl-10"
                  />
                </div>
                {clientes?.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {clientes.map((cliente) => (
                      <button
                        key={cliente.id}
                        type="button"
                        onClick={() => {
                          setSelectedCliente(cliente)
                          setClienteSearch('')
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{cliente.nombre} {cliente.apellido_paterno}</p>
                          <p className="text-sm text-gray-500">{cliente.numero_cliente}</p>
                        </div>
                        <span className={clsx(
                          'font-semibold',
                          cliente.adeudo > 0 ? 'text-error' : 'text-success'
                        )}>
                          {formatMoney(cliente.adeudo)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Datos del pago */}
          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
            <h2 className="section-title">Datos del Pago</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Monto a Pagar *</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('monto_total', { 
                      required: 'Requerido',
                      min: { value: 0.01, message: 'Monto inválido' }
                    })}
                    type="number"
                    step="0.01"
                    className={`input pl-10 ${errors.monto_total ? 'input-error' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.monto_total && (
                  <p className="text-error text-xs mt-1">{errors.monto_total.message}</p>
                )}
                {totalAdeudo > 0 && (
                  <button
                    type="button"
                    onClick={() => setValue('monto_total', totalAdeudo.toFixed(2))}
                    className="text-xs text-secondary hover:underline mt-1"
                  >
                    Pagar todo el adeudo ({formatMoney(totalAdeudo)})
                  </button>
                )}
              </div>

              <div>
                <label className="label">Forma de Pago *</label>
                <select
                  {...register('tipo_pago_id', { required: 'Requerido' })}
                  className={`input ${errors.tipo_pago_id ? 'input-error' : ''}`}
                >
                  <option value="">Seleccionar...</option>
                  {tiposPago?.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Referencia (opcional)</label>
              <input
                {...register('referencia')}
                className="input"
                placeholder="No. de transferencia, folio, etc."
              />
            </div>

            <div>
              <label className="label">Notas (opcional)</label>
              <textarea
                {...register('notas')}
                className="input"
                rows={2}
                placeholder="Observaciones del pago"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link 
                to="/pagos"
                className="btn bg-gray-100 hover:bg-gray-200 text-gray-600"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={mutation.isPending || !selectedCliente}
                className="btn-success flex items-center gap-2"
              >
                <Save size={18} />
                {mutation.isPending ? 'Procesando...' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          {/* Cargos pendientes */}
          {selectedCliente && cargosPendientes?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText size={16} className="text-secondary" />
                Cargos Pendientes
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cargosPendientes.map(cargo => (
                  <div key={cargo.id} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium">{cargo.concepto}</p>
                      <p className="text-xs text-gray-400">{cargo.periodo_mes}/{cargo.periodo_anio}</p>
                    </div>
                    <span className="font-semibold text-error">{formatMoney(cargo.saldo)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview de aplicación */}
          {preview && (
            <div className="card bg-green-50 border-green-200">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-success">
                <Check size={16} />
                Vista Previa
              </h3>
              
              {preview.cargos_a_cubrir?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">Se cubrirán:</p>
                  {preview.cargos_a_cubrir.map((c, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1">
                      <span>{c.concepto}</span>
                      <span className="text-success">{formatMoney(c.monto_a_aplicar)}</span>
                    </div>
                  ))}
                </div>
              )}

              {preview.saldo_favor_resultante > 0 && (
                <div className="pt-3 border-t border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Saldo a favor</span>
                    <span className="text-lg font-bold text-success">
                      {formatMoney(preview.saldo_favor_resultante)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedCliente && totalAdeudo === 0 && (
            <div className="card bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Cliente al día</p>
                  <p className="text-sm text-blue-700">
                    Este cliente no tiene adeudos. El pago se guardará como saldo a favor.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
