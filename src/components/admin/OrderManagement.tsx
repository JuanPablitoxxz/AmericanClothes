import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { formatCOP } from '../../lib/currency';

interface OrderManagementProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  orders,
  onUpdateOrderStatus,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'TODOS' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-up text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/10 pb-6">
        <div>
          <span className="sub-headline block mb-1">TRANSACCIONES Y LOGÍSTICA</span>
          <h1 className="font-serif-display text-3xl font-normal text-[#1A1A1A]">
            Gestión de Pedidos & Envíos
          </h1>
          <p className="font-sans-body text-xs text-[#555555] mt-1">
            Supervisión en tiempo real de transacciones, estados de envío y clientes VIP.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#EFECE7] p-4 border border-black/10 shadow-sm">
        <div className="relative border border-black/10 bg-[#F9F8F6]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por ID, cliente o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none pl-9 pr-3 py-2 text-xs text-[#1A1A1A] focus:outline-none placeholder:text-[#888888]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#F9F8F6] border border-black/10 p-2 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="PROCESANDO">PROCESANDO</option>
            <option value="ENVIADO">ENVIADO</option>
            <option value="ENTREGADO">ENTREGADO</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-[#888888] font-mono">
          Total: {filteredOrders.length} pedidos encontrados
        </div>
      </div>

      {/* Table & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Table */}
        <div className="lg:col-span-2 bg-[#EFECE7] border border-black/10 overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 bg-[#D6D2CC] font-label-caps text-[10px] tracking-[2px] text-[#1A1A1A]">
                <th className="p-4 font-normal">PEDIDO</th>
                <th className="p-4 font-normal">CLIENTE</th>
                <th className="p-4 font-normal">TOTAL</th>
                <th className="p-4 font-normal">ESTADO</th>
                <th className="p-4 font-normal text-right">DETALLES</th>
              </tr>
            </thead>
            <tbody className="font-sans-body text-sm">
              {filteredOrders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className={`border-b border-black/10 hover:bg-[#F9F8F6] transition-colors cursor-pointer ${
                    selectedOrder?.id === o.id ? 'bg-[#F9F8F6]' : ''
                  }`}
                >
                  <td className="p-4">
                    <p className="font-bold text-[#1A1A1A]">{o.id}</p>
                    <p className="text-[10px] text-[#888888]">{o.timeAgo}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-[#1A1A1A] text-xs font-semibold">{o.customerName}</p>
                    <p className="text-[10px] text-[#888888]">{o.email}</p>
                  </td>
                  <td className="p-4 font-bold text-[#1A1A1A]">{formatCOP(o.total)}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-0.5 text-[9px] font-label-caps tracking-[1px] ${
                        o.status === 'PROCESANDO'
                          ? 'bg-[#1A1A1A] text-[#F9F8F6]'
                          : o.status === 'ENVIADO'
                          ? 'bg-[#D6D2CC] text-[#1A1A1A] border border-black/10'
                          : o.status === 'ENTREGADO'
                          ? 'bg-emerald-800 text-white'
                          : 'bg-red-800 text-white'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-[#555555] hover:text-[#1A1A1A]">
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Order Detail Sidebar */}
        <div className="bg-[#EFECE7] border border-black/10 p-6 flex flex-col justify-between shadow-sm">
          {selectedOrder ? (
            <div className="space-y-6">
              <div className="border-b border-black/10 pb-4">
                <span className="font-label-caps text-[10px] text-[#888888] tracking-[2px]">DETALLES DE TRANSACCIÓN</span>
                <h3 className="font-serif-display text-2xl font-normal text-[#1A1A1A] mt-1">
                  {selectedOrder.id}
                </h3>
                <p className="text-xs text-[#888888] mt-0.5">Fecha: {selectedOrder.date}</p>
              </div>

              <div>
                <h4 className="font-label-caps text-[10px] text-[#888888] tracking-[2px] mb-1">Cliente & Dirección</h4>
                <p className="text-sm font-semibold text-[#1A1A1A]">{selectedOrder.customerName}</p>
                <p className="text-xs text-[#555555]">{selectedOrder.email}</p>
                <p className="text-xs text-[#555555] mt-1 font-mono bg-[#F9F8F6] p-2 border border-black/10">
                  {selectedOrder.shippingAddress || 'Dirección no especificada'}
                </p>
              </div>

              <div>
                <h4 className="font-label-caps text-[10px] text-[#888888] tracking-[2px] mb-2">Artículos Incluidos</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-[#F9F8F6] p-2 border border-black/10 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <img src={item.image} alt={item.name} className="w-8 h-10 object-cover bg-[#D6D2CC]" />
                        <div>
                          <p className="text-[#1A1A1A] font-semibold">{item.name}</p>
                          <p className="text-[10px] text-[#888888]">Talla: {item.size || 'N/A'}</p>
                        </div>
                      </div>
                      <p className="text-[#1A1A1A] font-bold">{formatCOP(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-label-caps text-[10px] text-[#888888] tracking-[2px] mb-2">Cambiar Estado</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(['PROCESANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'] as OrderStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => onUpdateOrderStatus(selectedOrder.id, st)}
                        className={`p-2 font-label-caps text-[10px] tracking-[1px] transition-all border ${
                          selectedOrder.status === st
                            ? 'bg-[#1A1A1A] text-[#F9F8F6] font-bold border-[#1A1A1A]'
                            : 'bg-[#F9F8F6] text-[#555555] border-black/10 hover:border-black/30'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#888888] space-y-2">
              <span className="material-symbols-outlined text-4xl">touch_app</span>
              <p className="font-serif-display text-lg text-[#1A1A1A]">Selecciona un pedido</p>
              <p className="text-xs">Haz clic en cualquier fila de la tabla para ver desglose y cambiar estado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
