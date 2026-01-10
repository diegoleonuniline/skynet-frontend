import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Edit, Key, User } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import clsx from 'clsx'

export default function UsuariosLista() {
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    email: '',
    telefono: '',
    rol_id: '',
    estado_id: ''
  })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const res = await api.get('/usuarios')
      return res.data
    }
  })

  const { data: roles } = useQuery({
    queryKey: ['cat-roles'],
    queryFn: async () => {
      const res = await api.get('/catalogos/roles')
      return res.data.data
    }
  })

  const { data: estados } = useQuery({
    queryKey: ['cat-estados-usuario'],
    queryFn: async () => {
      const res = await api.get('/catalogos/estados_usuario')
      return res.data.data
    }
  })

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (editingUser) {
        return api.put(`/usuarios/${editingUser.id}`, data)
      }
      return api.post('/usuarios', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['usuarios'])
      toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado')
      closeModal()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error')
    }
  })

  const resetPassword = useMutation({
    mutationFn: async ({ id, password }) => {
      return api.post(`/usuarios/${id}/reset-password`, { password_nuevo: password })
    },
    onSuccess: () => {
      toast.success('Contraseña actualizada')
    },
    onError: () => {
      toast.error('Error al actualizar contraseña')
    }
  })

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        password: '',
        nombre_completo: user.nombre_completo,
        email: user.email || '',
        telefono: user.telefono || '',
        rol_id: user.rol_id,
        estado_id: user.estado_id
      })
    } else {
      setEditingUser(null)
      setFormData({
        username: '',
        password: '',
        nombre_completo: '',
        email: '',
        telefono: '',
        rol_id: roles?.[0]?.id || '',
        estado_id: estados?.find(e => e.nombre === 'Activo')?.id || ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUser(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...formData }
    if (editingUser && !data.password) {
      delete data.password
    }
    mutation.mutate(data)
  }

  const handleResetPassword = (user) => {
    const password = prompt('Nueva contraseña (mínimo 6 caracteres):')
    if (password && password.length >= 6) {
      resetPassword.mutate({ id: user.id, password })
    } else if (password) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="text-gray-500 text-sm">Administra los usuarios del sistema</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} />
          Nuevo Usuario
        </button>
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
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data?.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                          <User size={14} className="text-secondary" />
                        </div>
                        <span className="font-medium">{usuario.username}</span>
                      </div>
                    </td>
                    <td>{usuario.nombre_completo}</td>
                    <td>{usuario.email || '-'}</td>
                    <td>
                      <span className={clsx(
                        'badge',
                        usuario.rol_nombre === 'Administrador' ? 'badge-info' : 'badge-neutral'
                      )}>
                        {usuario.rol_nombre}
                      </span>
                    </td>
                    <td>
                      <span className={clsx(
                        'badge',
                        usuario.estado_nombre === 'Activo' ? 'badge-success' : 'badge-error'
                      )}>
                        {usuario.estado_nombre}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openModal(usuario)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(usuario)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                          title="Cambiar contraseña"
                        >
                          <Key size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Usuario *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="input"
                required
                disabled={!!editingUser}
              />
            </div>
            <div>
              <label className="label">{editingUser ? 'Nueva Contraseña' : 'Contraseña *'}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="input"
                required={!editingUser}
                minLength={6}
                placeholder={editingUser ? 'Dejar vacío para mantener' : ''}
              />
            </div>
          </div>

          <div>
            <label className="label">Nombre Completo *</label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input"
              />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Rol *</label>
              <select
                value={formData.rol_id}
                onChange={(e) => setFormData({...formData, rol_id: e.target.value})}
                className="input"
                required
              >
                {roles?.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Estado *</label>
              <select
                value={formData.estado_id}
                onChange={(e) => setFormData({...formData, estado_id: e.target.value})}
                className="input"
                required
              >
                {estados?.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
          </div>

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
