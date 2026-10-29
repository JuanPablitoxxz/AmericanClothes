import React, { useState } from 'react';
import { AuthUser } from '../../types';
import { StoredUserAccount, adminChangePassword, adminDeleteAccount, adminUpdateUserRole } from '../../lib/auth';

interface UserManagementProps {
  users: StoredUserAccount[];
  currentUser: AuthUser | null;
  onRefreshUsers: () => Promise<void>;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  onRefreshUsers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<StoredUserAccount | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(term))
    );
  });

  const adminUsersCount = users.filter((u) => u.role === 'admin').length;
  const clientUsersCount = users.filter((u) => u.role === 'client').length;

  const handleOpenPasswordModal = (user: StoredUserAccount) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setFeedback(null);
    setIsPasswordModalOpen(true);
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (newPassword.length < 6) {
      setFeedback({
        type: 'error',
        message: 'La contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({
        type: 'error',
        message: 'Las contraseñas no coinciden.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await adminChangePassword(selectedUser.email, newPassword);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'Contraseña actualizada con éxito.',
        });
        await onRefreshUsers();
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setSelectedUser(null);
          setFeedback(null);
        }, 1800);
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'No fue posible actualizar la contraseña.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Error al conectar con la base de datos.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (user: StoredUserAccount) => {
    const targetRole = user.role === 'admin' ? 'client' : 'admin';
    const confirmMsg = `¿Estás seguro de cambiar el rol de "${user.name}" a ${targetRole.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminUpdateUserRole(user.email, targetRole);
      if (res.success) {
        await onRefreshUsers();
      } else {
        alert(res.error || 'No fue posible cambiar el rol.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error al actualizar rol.');
    }
  };

  const handleDeleteUser = async (user: StoredUserAccount) => {
    if (user.email === 'admin@americanclothes.com') {
      alert('La cuenta principal de administración no puede eliminarse.');
      return;
    }

    const confirmMsg = `¿Deseas eliminar permanentemente a "${user.name}" (${user.email})? Esta acción borrará su acceso.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminDeleteAccount(user.email);
      if (res.success) {
        await onRefreshUsers();
      } else {
        alert(res.error || 'No fue posible eliminar el usuario.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar usuario.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8 animate-fade-up text-[#1A1A1A]">
      {/* Header & Quick Admin Password Change */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <span className="sub-headline block mb-1">CONTROL DE ACCESOS Y CLIENTES</span>
          <h1 className="font-serif-display text-2xl sm:text-3xl md:text-4xl font-normal text-[#1A1A1A]">
            Usuarios Registrados
          </h1>
          <p className="font-sans-body text-xs text-[#555555] mt-1">
            Gestiona todas las cuentas de clientes y administradores, y cambia contraseñas al instante.
          </p>
        </div>

        {currentUser && (
          <button
            type="button"
            onClick={() => {
              const currentAdminAccount = users.find(
                (u) => u.email.toLowerCase() === currentUser.email.toLowerCase()
              ) || {
                id: currentUser.id,
                email: currentUser.email,
                name: currentUser.name,
                role: 'admin',
                salt: '',
                passwordHash: '',
                createdAt: new Date().toISOString(),
              };
              handleOpenPasswordModal(currentAdminAccount);
            }}
            className="self-start md:self-center px-4 py-3 bg-[#1A1A1A] hover:bg-[#333333] text-[#F9F8F6] font-label-caps text-xs font-bold uppercase tracking-[2px] transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base text-[#D4AF37]">lock_reset</span>
            Cambiar Mi Contraseña de Admin
          </button>
        )}
      </div>

      {/* KPI Stats & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#EFECE7] border border-black/10">
          <span className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
            TOTAL USUARIOS
          </span>
          <span className="font-serif-display text-3xl font-normal text-[#1A1A1A]">
            {users.length}
          </span>
        </div>
        <div className="p-4 bg-[#EFECE7] border border-black/10">
          <span className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
            CLIENTES REGISTRADOS
          </span>
          <span className="font-serif-display text-3xl font-normal text-[#1A1A1A]">
            {clientUsersCount}
          </span>
        </div>
        <div className="p-4 bg-[#EFECE7] border border-black/10">
          <span className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
            ADMINISTRADORES
          </span>
          <span className="font-serif-display text-3xl font-normal text-[#D4AF37]">
            {adminUsersCount}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888] text-lg">
          search
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, correo electrónico o teléfono..."
          className="w-full bg-[#EFECE7] border border-black/10 pl-10 pr-4 py-3 text-xs text-[#1A1A1A] placeholder-[#888888] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
        />
      </div>

      {/* Users Responsive Table / Cards */}
      <div className="bg-[#EFECE7] border border-black/10 overflow-hidden shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-[#666666] space-y-2">
            <span className="material-symbols-outlined text-4xl text-[#999999]">group_off</span>
            <p className="text-xs font-mono">No se encontraron usuarios que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-black/10 bg-[#E5E2DC] text-[10px] font-label-caps tracking-[1.5px] text-[#555555]">
                  <th className="p-3.5 sm:p-4">USUARIO / CLIENTE</th>
                  <th className="p-3.5 sm:p-4">CONTACTO</th>
                  <th className="p-3.5 sm:p-4">ROL</th>
                  <th className="p-3.5 sm:p-4">FECHA REGISTRO</th>
                  <th className="p-3.5 sm:p-4 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredUsers.map((u) => {
                  const isCurrentAdmin =
                    currentUser?.email.toLowerCase() === u.email.toLowerCase();
                  const isPrimaryAdmin = u.email === 'admin@americanclothes.com';

                  return (
                    <tr
                      key={u.id || u.email}
                      className="hover:bg-black/[0.02] transition-colors"
                    >
                      <td className="p-3.5 sm:p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1A1A1A] text-[#F9F8F6] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                            {u.name ? u.name.substring(0, 2) : 'US'}
                          </div>
                          <div>
                            <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                              {u.name}
                              {isCurrentAdmin && (
                                <span className="text-[9px] bg-[#D4AF37]/20 text-[#8a7220] px-1.5 py-0.2 rounded font-mono font-bold">
                                  TÚ
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#666666] font-mono block">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 sm:p-4 font-mono text-[11px] text-[#555555]">
                        {u.phone ? (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-emerald-700">call</span>
                            <span>{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[#999999]">Sin teléfono</span>
                        )}
                      </td>

                      <td className="p-3.5 sm:p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-label-caps tracking-[1px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-[#1A1A1A] text-[#F9F8F6] border border-black/20'
                              : 'bg-white/60 text-[#444444] border border-black/10'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {u.role === 'admin' ? 'shield' : 'person'}
                          </span>
                          {u.role === 'admin' ? 'Administrador' : 'Cliente'}
                        </span>
                      </td>

                      <td className="p-3.5 sm:p-4 font-mono text-[11px] text-[#666666]">
                        {u.createdAt ? u.createdAt.substring(0, 10) : 'Preexistente'}
                      </td>

                      <td className="p-3.5 sm:p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(u)}
                            className="px-2.5 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-[#F9F8F6] font-label-caps text-[10px] font-bold uppercase tracking-[1px] flex items-center gap-1 transition-colors"
                            title={`Cambiar contraseña de ${u.name}`}
                          >
                            <span className="material-symbols-outlined text-xs">key</span>
                            <span>Cambiar Clave</span>
                          </button>

                          {!isPrimaryAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleRole(u)}
                              className="px-2 py-1.5 border border-black/20 bg-white/70 hover:bg-[#1A1A1A] hover:text-[#F9F8F6] text-[#333] font-label-caps text-[10px] transition-colors"
                              title={
                                u.role === 'admin'
                                  ? 'Cambiar a Cliente'
                                  : 'Promover a Administrador'
                              }
                            >
                              <span className="material-symbols-outlined text-xs">
                                {u.role === 'admin' ? 'person_remove' : 'admin_panel_settings'}
                              </span>
                            </button>
                          )}

                          {!isPrimaryAdmin && !isCurrentAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-red-600 hover:bg-red-100/60 transition-colors"
                              title={`Eliminar cuenta de ${u.name}`}
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Cambiar Contraseña de Usuario */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#EFECE7] border border-black/20 p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setSelectedUser(null);
                setFeedback(null);
              }}
              className="absolute top-4 right-4 text-[#666666] hover:text-[#1A1A1A]"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="mb-5">
              <span className="sub-headline block mb-1">SEGURIDAD DE CUENTA</span>
              <h2 className="font-serif-display text-xl sm:text-2xl font-normal text-[#1A1A1A]">
                Cambiar Contraseña
              </h2>
              <p className="text-xs text-[#555555] mt-1">
                Establece una nueva contraseña para <strong>{selectedUser.name}</strong> (
                <span className="font-mono text-[11px]">{selectedUser.email}</span>).
              </p>
            </div>

            {feedback && (
              <div
                className={`p-3 mb-4 text-xs font-sans-body border ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-red-50 text-red-900 border-red-300'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div>
                <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-[#F9F8F6] border border-black/15 p-2.5 pr-10 text-xs text-[#1A1A1A] outline-none focus:ring-1 focus:ring-[#1A1A1A] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#1A1A1A]"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña exactamente"
                  className="w-full bg-[#F9F8F6] border border-black/15 p-2.5 text-xs text-[#1A1A1A] outline-none focus:ring-1 focus:ring-[#1A1A1A] font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setSelectedUser(null);
                    setFeedback(null);
                  }}
                  className="px-4 py-2.5 border border-black/20 bg-[#F9F8F6] text-xs font-label-caps uppercase tracking-[1px] hover:bg-[#E5E2DC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#333333] text-[#F9F8F6] text-xs font-label-caps uppercase font-bold tracking-[2px] disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {loading ? 'Guardando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
