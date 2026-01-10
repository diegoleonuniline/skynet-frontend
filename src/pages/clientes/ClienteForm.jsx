import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ChevronRight, Save, ArrowLeft } from 'lucide-react'
import SelectWithCreate from '../../components/ui/SelectWithCreate'
import Spinner from '../../components/ui/Spinner'

export default function ClienteForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm()
  const ciudadId = watch('ciudad_id')

  // Cargar cliente si es edición
  const { data: cliente, isLoading } = useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      const res = await api.get(`/clientes/${id}`)
      return res.data.data
    },
    enabled: isEdit
  })

  // Cargar ciudades
  const { data: ciudades } = useQuery({
    queryKey: ['cat-ciudades'],
    queryFn: async () => {
      const res = await api.get('/catalogos/ciudades')
      return res.data.data
    }
  })

  // Cargar colonias según ciudad
  const { data: colonias } = useQuery({
    queryKey: ['cat-colonias', ciudadId],
    queryFn: async () => {
      const res = await api.get(`/catalogos/colonias?ciudad_id=${ciudadId}`)
      return res.data.data
    },
    enabled: !!ciudadId
  })

  // Llenar formulario en edición
  useEffect(() => {
    if (cliente) {
      setValue('nombre', cliente.nombre)
      setValue('apellido_paterno', cliente.apellido_paterno)
      setValue('apellido_materno', cliente.apellido_materno)
      setValue('telefono_principal', cliente.telefono_principal)
      setValue('telefono_secundario', cliente.telefono_secundario)
      setValue('email', cliente.email)
      setValue('calle', cliente.calle)
      setValue('numero_exterior', cliente.numero_exterior)
      setValue('numero_interior', cliente.numero_interior)
      setValue('codigo_postal', cliente.codigo_postal)
      setValue('ciudad_id', cliente.ciudad_id)
      setValue('referencias', cliente.referencias)
      setValue('notas', cliente.notas)
      // Esperar a que carguen las colonias
      setTimeout(() => {
        setValue('colonia_id', cliente.colonia_id)
      }, 500)
    }
  }, [cliente, setValue])

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return api.put(`/clientes/${id}`, data)
      }
      return api.post('/clientes', data)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['clientes'])
      if (isEdit) {
        queryClient.invalidateQueries(['cliente', id])
      }
      toast.success(isEdit ? 'Cliente actualizado' : 'Cliente creado')
      const clienteId = isEdit ? id : res.data.data.id
      navigate(`/clientes/${clienteId}`)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al guardar')
    }
  })

  const onSubmit = (data) => {
    // Limpiar ciudad_id antes de enviar
    const { ciudad_id, ...submitData } = data
    mutation.mutate(submitData)
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/clientes" className="hover:text-secondary">Clientes</Link>
        <ChevronRight size={14} />
        <span className="text-primary">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h1>
          <p className="text-gray-500 text-sm">
            {isEdit ? 'Modifica los datos del cliente' : 'Registra un nuevo cliente en el sistema'}
          </p>
        </div>
        <Link to="/clientes" className="btn bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center gap-2">
          <ArrowLeft size={18} />
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos Personales */}
        <div className="card">
          <h2 className="section-title">Datos Personales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Nombre(s) *</label>
              <input
                {...register('nombre', { required: 'Requerido' })}
                className={`input ${errors.nombre ? 'input-error' : ''}`}
                placeholder="Nombre(s)"
              />
              {errors.nombre && <p className="text-error text-xs mt-1">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="label">Apellido Paterno *</label>
              <input
                {...register('apellido_paterno', { required: 'Requerido' })}
                className={`input ${errors.apellido_paterno ? 'input-error' : ''}`}
                placeholder="Apellido Paterno"
              />
              {errors.apellido_paterno && <p className="text-error text-xs mt-1">{errors.apellido_paterno.message}</p>}
            </div>
            <div>
              <label className="label">Apellido Materno</label>
              <input
                {...register('apellido_materno')}
                className="input"
                placeholder="Apellido Materno"
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="card">
          <h2 className="section-title">Información de Contacto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Teléfono Principal *</label>
              <input
                {...register('telefono_principal', { required: 'Requerido' })}
                className={`input ${errors.telefono_principal ? 'input-error' : ''}`}
                placeholder="10 dígitos"
                type="tel"
              />
              {errors.telefono_principal && <p className="text-error text-xs mt-1">{errors.telefono_principal.message}</p>}
            </div>
            <div>
              <label className="label">Teléfono Secundario</label>
              <input
                {...register('telefono_secundario')}
                className="input"
                placeholder="10 dígitos"
                type="tel"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                {...register('email')}
                className="input"
                placeholder="correo@ejemplo.com"
                type="email"
              />
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className="card">
          <h2 className="section-title">Dirección</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="label">Calle</label>
              <input
                {...register('calle')}
                className="input"
                placeholder="Nombre de la calle"
              />
            </div>
            <div>
              <label className="label">No. Exterior</label>
              <input
                {...register('numero_exterior')}
                className="input"
                placeholder="123"
              />
            </div>
            <div>
              <label className="label">No. Interior</label>
              <input
                {...register('numero_interior')}
                className="input"
                placeholder="A, B, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <SelectWithCreate
              label="Ciudad"
              value={ciudadId}
              onChange={(val) => {
                setValue('ciudad_id', val)
                setValue('colonia_id', '')
              }}
              options={ciudades || []}
              catalogo="ciudades"
              placeholder="Seleccionar ciudad"
            />
            
            <SelectWithCreate
              label="Colonia"
              value={watch('colonia_id')}
              onChange={(val) => setValue('colonia_id', val)}
              options={colonias || []}
              catalogo="colonias"
              placeholder="Seleccionar colonia"
              disabled={!ciudadId}
              extraFields={[
                {
                  name: 'ciudad_id',
                  label: 'Ciudad',
                  type: 'select',
                  options: ciudades || []
                }
              ]}
            />

            <div>
              <label className="label">Código Postal</label>
              <input
                {...register('codigo_postal')}
                className="input"
                placeholder="00000"
                maxLength={5}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="label">Referencias</label>
            <textarea
              {...register('referencias')}
              className="input min-h-[80px]"
              placeholder="Referencias para ubicar el domicilio"
              rows={2}
            />
          </div>
        </div>

        {/* Notas */}
        <div className="card">
          <h2 className="section-title">Notas Adicionales</h2>
          <textarea
            {...register('notas')}
            className="input min-h-[100px]"
            placeholder="Observaciones o notas importantes sobre el cliente"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link 
            to="/clientes"
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
            {mutation.isPending ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Guardar Cliente')}
          </button>
        </div>
      </form>
    </div>
  )
}
