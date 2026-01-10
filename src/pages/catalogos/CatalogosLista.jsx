import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Database } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'

const CATALOGOS = [
  { key: 'ciudades', label: 'Ciudades' },
  { key: 'colonias', label: 'Colonias', parent: 'ciudades' },
  { key: 'tarifas', label: 'Tarifas / Planes', extra: ['precio', 'velocidad_mbps'] },
  { key: 'tipos_pago', label: 'Tipos de Pago' },
  { key: 'tipos_cargo', label: 'Tipos de Cargo' },
  { key: 'roles', label: 'Roles' },
  { key: 'estados_cliente', label: 'Estados de Cliente' },
  { key: 'estados_servicio', label: 'Estados de Servicio' },
  { key: 'estados_instalacion', label: 'Estados de Instalación' },
  { key: 'estados_cargo', label: 'Estados de Cargo' },
  { key: 'estados_pago', label: 'Estados de Pago' },
  { key: 'estados_usuario', label: 'Estados de Usuario' },
]

export default function CatalogosLista() {
  const [selected, setSelected] = useState('ciudades')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({ nombre: '' })
  const queryClient = useQueryClient()

  const catalogoConfig = CATALOGOS.find(c => c.key === selected)

  const { data: items, isLoading } = useQuery({
    queryKey: [`cat-${selected}`],
    queryFn: async () => {
      const res = await api.get(`/catalogos/${selected}`)
      return res.data.data
    }
  })

  const { data: ciudades } = useQuery({
    queryKey: ['cat-ciudades'],
    queryFn: async () => {
      const res = await api.get('/catalogos/ciudades')
      return res.data.data
    },
    enabled: selected === 'colonias'
  })

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (editingItem) {
        return api.put(`/catalogos/${selected}/${editingItem.id}`, data)
      }
      return api.post(`/catalogos/${selected}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`cat-${selected}`])
      toast.success(editingItem ? 'Actualizado' : 'Creado')
      closeModal()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/catalogos/${selected}/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`cat-${selected}`])
      toast.success('Eliminado')
    },
    onError: () => {
      toast.error('Error al eliminar')
    }
  })

  const openModal = (item = null) => {
    setEditingItem(item)
    setFormData(item ? { ...item } : { nombre: '' })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({ nombre: '' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleDelete = (item) => {
    if (confirm('¿Eliminar este elemento?')) {
      deleteMutation.mutate(item.id)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Catálogos</h1>
        <p className="text-gray-500 text-sm">Administra los catálogos del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="card p-2">
          <nav className="space-y-1">
            {CATALOGOS.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelected(cat.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selected === cat.key
                    ? 'bg-secondary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Database size={18} className="text-secondary" />
              {catalogoConfig?.label}
            </h2>
            <button onClick={() => openModal()} className="btn-primary btn-sm flex items-center gap-1">
              <Plus size={16} />
              Agregar
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    {selected === 'colonias' && <th>Ciudad</th>}
                    {selected === 'tarifas' && (
                      <>
                        <th>Precio</th>
                        <th>Velocidad</th>
                      </>
                    )}
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items?.length > 0 ? (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td className="font-medium">{item.nombre}</td>
                        {selected === 'colonias' && <td>{item.ciudad_nombre || '-'}</td>}
                        {selected === 'tarifas' && (
                          <>
                            <td>${item.precio}</td>
                            <td>{item.velocidad_mbps} Mbps</td>
                          </>
                        )}
                        <td>
                          <span className={`badge ${item.activo ? 'badge-success' : 'badge-error'}`}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openModal(item)}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-2 hover:bg-gray-100 rounded-lg text-error"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center py-8 text-gray-400">
                        No hay elementos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? 'Editar' : 'Agregar'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="input"
              required
            />
          </div>

          {selected === 'colonias' && (
            <div>
              <label className="label">Ciudad *</label>
              <select
                value={formData.ciudad_id || ''}
                onChange={(e) => setFormData({...formData, ciudad_id: e.target.value})}
                className="input"
                required
              >
                <option value="">Seleccionar...</option>
                {ciudades?.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {selected === 'tarifas' && (
            <>
              <div>
                <label className="label">Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio || ''}
                  onChange={(e) => setFormData({...formData, precio: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Velocidad (Mbps) *</label>
                <input
                  type="number"
                  value={formData.velocidad_mbps || ''}
                  onChange={(e) => setFormData({...formData, velocidad_mbps: e.target.value})}
                  className="input"
                  required
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={closeModal} className="btn bg-gray-100 hover:bg-gray-200 text-gray-600">
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
