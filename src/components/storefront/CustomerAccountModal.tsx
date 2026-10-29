import React from 'react';
import { AuthUser, Order } from '../../types';
import { formatCOP } from '../../lib/currency';

interface CustomerAccountModalProps {
  isOpen: boolean;
  user: AuthUser | null;
  orders: Order[];
  onClose: () => void;
  onLogout: () => void;
  onChangePassword: () => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  user,
  orders,
  onClose,
  onLogout,
  onChangePassword,
}) => {
  if (!isOpen || !user) return null;

  const customerOrders = orders.filter(
    (o) => o.email.toLowerCase().trim() === user.email.toLowerCase().trim()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-up"
      onClick={onClose}
    >
      <div
        className="bg-[#F9F8F6] border border-black/15 max-w-2xl w-full text-[#1A1A1A] shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1A1A1A] text-[#F9F8F6] px-6 py-4 flex items-center justify-between">
          <div>
            <span className="font-label-caps text-[9px] tracking-[2px] text-[#999999] block uppercase">
              PORTAL DE CLIENTE • AMERICAN CLOTHES
            </span>
            <h2 className="font-serif-display text-xl font-normal text-[#F9F8F6]">
              Mi Cuenta & Historial de Pedidos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#F9F8F6]/70 hover:text-[#F9F8F6] p-1"
            title="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Profile Summary */}
          <div className="bg-[#EFECE7] border border-black/10 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-serif-display text-xl text-[#1A1A1A] font-bold">
                  {user.name}
                </h3>
                <span className="bg-[#1A1A1A] text-[#F9F8F6] px-2 py-0.5 font-label-caps text-[9px] tracking-[1px] uppercase">
                  Cliente
                </span>
              </div>
              <p className="text-xs text-[#555555] font-mono">{user.email}</p>
              {user.phone && (
                <p className="text-xs text-[#666666]">Tel: {user.phone}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onChangePassword}
                className="px-3.5 py-2 border border-black/20 bg-[#F9F8F6] text-[#1A1A1A] font-label-caps text-[10px] tracking-[1.5px] uppercase hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">key</span>
                Cambiar Contraseña
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-3.5 py-2 bg-red-900 text-white font-label-caps text-[10px] tracking-[1.5px] uppercase hover:bg-red-800 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Orders History */}
          <div className="space-y-3">
            <h4 className="font-label-caps text-xs tracking-[2px] text-[#1A1A1A] uppercase border-b border-black/10 pb-2">
              Mis Pedidos ({customerOrders.length})
            </h4>

            {customerOrders.length === 0 ? (
              <div className="p-8 bg-[#EFECE7]/60 border border-black/10 text-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-[#888888]">
                  shopping_bag
                </span>
                <p className="font-serif-display text-base text-[#1A1A1A]">
                  Aún no tienes pedidos registrados con este correo
                </p>
                <p className="text-xs text-[#666666]">
                  Tus próximas compras en American Clothes aparecerán aquí automáticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-[#EFECE7] border border-black/10 p-4 space-y-2"
                  >
                    <div className="flex justify-between items-center border-b border-black/10 pb-2">
                      <div>
                        <span className="font-bold text-sm text-[#1A1A1A]">{order.id}</span>
                        <span className="text-[11px] text-[#777777] ml-2">{order.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-[#1A1A1A]">
                          {formatCOP(order.total)}
                        </span>
                        <span className="bg-[#1A1A1A] text-[#F9F8F6] px-2.5 py-0.5 font-label-caps text-[9px] tracking-[1px]">
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-[#555555]">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {item.quantity}x {item.name} ({item.size || 'Única'})
                          </span>
                          <span className="font-mono">{formatCOP(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
