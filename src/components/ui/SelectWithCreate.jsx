import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { useAuth } from '../../context/AuthContext'

export default function SelectWithCreate({ 
  label,
  value, 
  onChange, 
  options = [], 
  catalogo,
  placeholder = 'Seleccionar...',
  error,
  required,
  extraFields = [],
  disabled = false
}) {
  const [showModal, setShowModal] = useState(false)
  const [newItem, setNewItem] = useState({ nombre: '' })
  const queryClient = useQueryClient()
  const { isAdmin } = useAuth()

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/catalogos/${catalogo}`, data)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries([`cat-${catalogo}`])
      toast.success('Creado correctamente')
      if (data.data?.id) {
        onChange(data.data.id)
      }
      setShowModal(false)
      setNewItem({ nombre: '' })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al crear')
    }
  })

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newItem.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    createMutation.mutate(newItem)
  }

  return (
    <div>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`input flex-1 ${error ? 'input-error' : ''}`}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.nombre}
            </option>
          ))}
        </select>
        {isAdmin() && catalogo && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn bg-gray-100 hover:bg-gray-200 text-gray-600 px-3"
            title="Agregar nuevo"
          >
            <Plus size={18} />
          </button>
        )}
      </div>
      {error && <p className="text-error text-xs mt-1">{error}</p>}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Agregar ${label || 'Item'}`}
        size="sm"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              type="text"
              value={newItem.nombre}
              onChange={(e) => setNewItem({ ...newItem, nombre: e.target.value })}
              className="input"
              placeholder="Nombre"
              autoFocus
            />
          </div>

          {extraFields.map((field) => (
            <div key={field.name}>
              <label className="label">{field.label}</label>
              {field.type === 'select' ? (
                <select
                  value={newItem[field.name] || ''}
                  onChange={(e) => setNewItem({ ...newItem, [field.name]: e.target.value })}
                  className="input"
                >
                  <option value="">Seleccionar...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  value={newItem[field.name] || ''}
                  onChange={(e) => setNewItem({ ...newItem, [field.name]: e.target.value })}
                  className="input"
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn bg-gray-100 hover:bg-gray-200 text-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary"
            >
              {createMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
