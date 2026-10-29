import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { formatCOP } from '../../lib/currency';

interface OrderManagementProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  orders,
  onUpdateOrderStatus,
  onDeleteOrder,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    orders.length > 0 ? orders[0].id : null
  );
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

  const selectedOrder =
    orders.find((o) => o.id === selectedOrderId) || filteredOrders[0] || null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 md:space-y-8 animate-fade-up text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-black/10 pb-6">
        <div>
          <span className="sub-headline block mb-1">TRANSACCIONES Y LOGÍSTICA</span>
          <h1 className="font-serif-display text-2xl sm:text-3xl md:text-4xl font-normal text-[#1A1A1A]">
            Gestión de Pedidos & Envíos
          </h1>
          <p className="font-sans-body text-xs text-[#555555] mt-1">
            Supervisión en tiempo real de transacciones, estados de envío y clientes.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 bg-[#EFECE7] p-4 border border-black/10 shadow-sm">
        <div className="relative border border-black/10 bg-[#F9F8F6]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por ID, cliente o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none pl-9 pr-3 py-2.5 text-xs text-[#1A1A1A] focus:outline-none placeholder:text-[#888888]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="PROCESANDO">PROCESANDO</option>
            <option value="ENVIADO">ENVIADO</option>
            <option value="ENTREGADO">ENTREGADO</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>
        </div>

        <div className="flex items-center justify-start lg:justify-end text-xs text-[#666666] font-mono sm:col-span-2 lg:col-span-1">
          Total: {filteredOrders.length} pedidos encontrados
        </div>
      </div>

      {/* Table & Detail Split */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#EFECE7] border border-black/10 p-12 text-center space-y-3 shadow-xs">
          <span className="material-symbols-outlined text-4xl text-[#888888]">receipt_long</span>
          <p className="font-serif-display text-xl text-[#1A1A1A]">
            No hay pedidos registrados en la base de datos
          </p>
          <p className="text-xs text-[#666666]">
            Cuando un cliente realice una compra en la tienda, el pedido aparecerá aquí en tiempo real.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Vista de Tarjetas para Smartphone (< md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredOrders.map((o) => {
              const isSelected = selectedOrder?.id === o.id;
              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrderId(o.id)}
                  className={`p-4 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F9F8F6] border-[#1A1A1A] shadow-sm'
                      : 'bg-[#EFECE7] border-black/10'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <p className="font-bold text-sm text-[#1A1A1A]">{o.id}</p>
                      <p className="text-[11px] text-[#777777]">{o.date}</p>
                    </div>
                    <span
                      className={`inline-block px-2.5 py-0.5 text-[9px] font-label-caps tracking-[1px] ${
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
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-black/10">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1A1A1A] truncate">
                        {o.customerName}
                      </p>
                      <p className="text-[11px] text-[#777777] truncate">{o.email}</p>
                    </div>
                    <p className="font-bold text-sm text-[#1A1A1A] flex-shrink-0">
                      {formatCOP(o.total)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Orders Table para Tablet y PC (md+) */}
          <div className="hidden md:block xl:col-span-2 bg-[#EFECE7] border border-black/10 overflow-x-auto shadow-sm">
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
                    onClick={() => setSelectedOrderId(o.id)}
                    className={`border-b border-black/10 hover:bg-[#F9F8F6] transition-colors cursor-pointer ${
                      selectedOrder?.id === o.id ? 'bg-[#F9F8F6]' : ''
                    }`}
                  >
                    <td className="p-4 whitespace-nowrap">
                      <p className="font-bold text-[#1A1A1A]">{o.id}</p>
                      <p className="text-[10px] text-[#888888]">{o.date}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-[#1A1A1A] text-xs font-semibold">{o.customerName}</p>
                      <p className="text-[10px] text-[#888888]">{o.email}</p>
                    </td>
                    <td className="p-4 font-bold text-[#1A1A1A] whitespace-nowrap">
                      {formatCOP(o.total)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
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
                      <button className="text-[#555555] hover:text-[#1A1A1A] p-1">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected Order Detail Sidebar */}
          <div className="bg-[#EFECE7] border border-black/10 p-5 sm:p-6 flex flex-col justify-between shadow-sm xl:sticky xl:top-6">
            {selectedOrder ? (
              <div className="space-y-6">
                <div className="border-b border-black/10 pb-4 flex justify-between items-start gap-2">
                  <div>
                    <span className="font-label-caps text-[10px] text-[#888888] tracking-[2px]">
                      DETALLES DE TRANSACCIÓN
                    </span>
                    <h3 className="font-serif-display text-2xl font-normal text-[#1A1A1A] mt-1">
                      {selectedOrder.id}
                    </h3>
                    <p className="text-xs text-[#888888] mt-0.5">Fecha: {selectedOrder.date}</p>
                  </div>
                  <span className="font-serif-display text-lg font-bold text-[#1A1A1A]">
                    {formatCOP(selectedOrder.total)}
                  </span>
                </div>

                <div>
                  <h4 className="font-label-caps text-[10px] text-[#888888] tracking-[2px] mb-1">
                    Cliente & Dirección
                  </h4>
                  <p className="text-sm font-semibold text-[#1A1A1A]">
                    {selectedOrder.customerName}
                  </p>
                  <p className="text-xs text-[#555555] break-all">{selectedOrder.email}</p>
                  {selectedOrder.phone && (
                    <p className="text-xs text-[#555555] mt-0.5">Tel: {selectedOrder.phone}</p>
                  )}
                  <p className="text-xs text-[#555555] mt-2 font-mono bg-[#F9F8F6] p-2.5 border border-black/10 break-words">
                    {selectedOrder.shippingAddress || 'Dirección no especificada'}
                  </p>
                </div>

                <div>
                  <h4 className="font-label-caps text-[10px] text-[#888888] tracking-[2px] mb-2">
                    Artículos Incluidos ({selectedOrder.items.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center gap-2 bg-[#F9F8F6] p-2.5 border border-black/10 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-9 h-12 object-cover bg-[#D6D2CC] flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-[#1A1A1A] font-semibold truncate">{item.name}</p>
                            <p className="text-[10px] text-[#888888]">
                              Cant: {item.quantity} • Talla: {item.size || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <p className="text-[#1A1A1A] font-bold flex-shrink-0">
                          {formatCOP(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-label-caps text-[10px] text-[#888888] tracking-[2px] mb-2">
                    Cambiar Estado del Pedido
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(['PROCESANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'] as OrderStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() => onUpdateOrderStatus(selectedOrder.id, st)}
                          className={`p-2.5 font-label-caps text-[10px] tracking-[1px] transition-all border ${
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

                {onDeleteOrder && (
                  <div className="pt-4 border-t border-black/10">
                    <button
                      type="button"
                      onClick={() => onDeleteOrder(selectedOrder.id)}
                      className="w-full py-2.5 bg-red-50 border border-red-200 text-red-700 font-label-caps text-[10px] tracking-[1.5px] uppercase flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Eliminar Pedido de la Base de Datos
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#888888] space-y-2">
                <span className="material-symbols-outlined text-4xl">touch_app</span>
                <p className="font-serif-display text-lg text-[#1A1A1A]">Selecciona un pedido</p>
                <p className="text-xs">
                  Haz clic en cualquier pedido para ver su desglose y cambiar su estado.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

