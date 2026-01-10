import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ChevronRight, Save, ArrowLeft, Search } from 'lucide-react'
import SelectWithCreate from '../../components/ui/SelectWithCreate'
import Spinner from '../../components/ui/Spinner'

export default function ServicioForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id
  const clienteIdParam = searchParams.get('cliente_id')

  const [clienteSearch, setClienteSearch] = useState('')
  const [selectedCliente, setSelectedCliente] = useState(null)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      dia_corte: 10
    }
  })

  const tarifaId = watch('tarifa_id')

  // Buscar clientes
  const { data: clientes } = useQuery({
    queryKey: ['clientes-search', clienteSearch],
    queryFn: async () => {
      if (!clienteSearch && !clienteIdParam) return []
      const params = new URLSearchParams()
      if (clienteSearch) params.append('busqueda', clienteSearch)
      if (clienteIdParam) params.append('id', clienteIdParam)
      params.append('limit', 10)
      const res = await api.get(`/clientes?${params}`)
      return res.data.data
    },
    enabled: !!clienteSearch || !!clienteIdParam
  })

  // Cargar tarifas
  const { data: tarifas } = useQuery({
    queryKey: ['cat-tarifas'],
    queryFn: async () => {
      const res = await api.get('/catalogos/tarifas')
      return res.data.data
    }
  })

  // Si viene cliente_id, cargarlo
  useEffect(() => {
    if (clienteIdParam && clientes?.length) {
      const cliente = clientes.find(c => c.id == clienteIdParam)
      if (cliente) {
        setSelectedCliente(cliente)
        setValue('cliente_id', cliente.id)
      }
    }
  }, [clienteIdParam, clientes, setValue])

  // Cuando selecciona tarifa, llenar precio
  useEffect(() => {
    if (tarifaId && tarifas) {
      const tarifa = tarifas.find(t => t.id == tarifaId)
      if (tarifa) {
        setValue('precio_mensual', tarifa.precio)
      }
    }
  }, [tarifaId, tarifas, setValue])

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return api.put(`/servicios/${id}`, data)
      }
      return api.post('/servicios', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['servicios'])
      toast.success(isEdit ? 'Servicio actualizado' : 'Servicio creado')
      if (selectedCliente) {
        navigate(`/clientes/${selectedCliente.id}`)
      } else {
        navigate('/servicios')
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al guardar')
    }
  })

  const onSubmit = (data) => {
    if (!selectedCliente && !data.cliente_id) {
      toast.error('Selecciona un cliente')
      return
    }
    mutation.mutate({
      ...data,
      cliente_id: selectedCliente?.id || data.cliente_id
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/servicios" className="hover:text-secondary">Servicios</Link>
        <ChevronRight size={14} />
        <span className="text-primary">{isEdit ? 'Editar' : 'Nuevo'} Servicio</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{isEdit ? 'Editar' : 'Nuevo'} Servicio</h1>
          <p className="text-gray-500 text-sm">Configura el servicio de internet</p>
        </div>
        <Link to="/servicios" className="btn bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center gap-2">
          <ArrowLeft size={18} />
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Cliente */}
        <div className="card">
          <h2 className="section-title">Cliente</h2>
          {selectedCliente ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{selectedCliente.nombre} {selectedCliente.apellido_paterno}</p>
                <p className="text-sm text-gray-500">{selectedCliente.numero_cliente} • {selectedCliente.telefono_principal}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCliente(null)}
                className="text-sm text-error hover:underline"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre o número..."
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
                        setValue('cliente_id', cliente.id)
                        setClienteSearch('')
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <p className="font-medium">{cliente.nombre} {cliente.apellido_paterno}</p>
                      <p className="text-sm text-gray-500">{cliente.numero_cliente}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Plan */}
        <div className="card">
          <h2 className="section-title">Plan de Servicio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectWithCreate
              label="Tarifa / Plan"
              value={tarifaId}
              onChange={(val) => setValue('tarifa_id', val)}
              options={tarifas?.map(t => ({ 
                id: t.id, 
                nombre: `${t.nombre} - ${t.velocidad_mbps}Mbps - $${t.precio}` 
              })) || []}
              catalogo="tarifas"
              placeholder="Seleccionar plan"
              required
              extraFields={[
                { name: 'precio', label: 'Precio Mensual', type: 'number', placeholder: '0.00' },
                { name: 'velocidad_mbps', label: 'Velocidad (Mbps)', type: 'number', placeholder: '100' }
              ]}
            />

            <div>
              <label className="label">Precio Mensual *</label>
              <input
                {...register('precio_mensual', { required: 'Requerido' })}
                type="number"
                step="0.01"
                className={`input ${errors.precio_mensual ? 'input-error' : ''}`}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="label">Día de Corte</label>
              <input
                {...register('dia_corte')}
                type="number"
                min="1"
                max="28"
                className="input"
                placeholder="10"
              />
              <p className="text-xs text-gray-400 mt-1">Día del mes para generar cargos</p>
            </div>

            <div>
              <label className="label">IP Asignada</label>
              <input
                {...register('ip_asignada')}
                className="input"
                placeholder="192.168.1.100"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link 
            to="/servicios"
            className="btn bg-gray-100 hover:bg-gray-200 text-gray-600"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {mutation.isPending ? 'Guardando...' : 'Guardar Servicio'}
          </button>
        </div>
      </form>
    </div>
  )
}
