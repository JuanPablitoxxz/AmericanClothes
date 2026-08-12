import React, { useState } from 'react';
import { Product, Order } from '../../types';
import { CHART_DATA_30D, CHART_DATA_90D } from '../../data/mockData';
import { formatCOP } from '../../lib/currency';

interface DashboardOverviewProps {
  products: Product[];
  orders: Order[];
  onOpenNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewAllOrders: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  products,
  orders,
  onOpenNewProduct,
  onEditProduct,
  onViewAllOrders,
}) => {
  const [chartPeriod, setChartPeriod] = useState<'30D' | '90D'>('30D');
  const [searchQuery, setSearchQuery] = useState('');

  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const activeProductsCount = products.filter((p) => p.status === 'ACTIVO').length;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = chartPeriod === '30D' ? CHART_DATA_30D : CHART_DATA_90D;
  const maxSales = Math.max(...chartData.map((d) => d.sales));

  return (
    <div className="space-y-12 animate-fade-up text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-black/10 pb-6">
        <div>
          <span className="sub-headline block mb-1">PANEL ADMINISTRATIVO</span>
          <h1 className="font-serif-display text-3xl md:text-4xl font-normal text-[#1A1A1A] mb-1">
            Visión General
          </h1>
          <p className="font-sans-body text-xs text-[#555555]">
            Rendimiento de tienda y métricas clave para Colombia.
          </p>
        </div>
        <button
          onClick={onOpenNewProduct}
          className="bg-[#1A1A1A] text-[#F9F8F6] font-label-caps text-xs px-6 py-3 font-bold uppercase tracking-[2px] hover:bg-[#333333] transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          NUEVO PRODUCTO
        </button>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ventas Totales */}
        <div className="bg-[#EFECE7] p-6 border border-black/10 hover:border-black/30 transition-colors relative group shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-label-caps text-[10px] text-[#888888] tracking-[2px]">Ventas Totales</h3>
            <span className="material-symbols-outlined text-[#1A1A1A]">trending_up</span>
          </div>
          <div className="font-serif-display text-3xl md:text-4xl text-[#1A1A1A] mb-2 font-normal tracking-tight">
            {formatCOP(180920000)}
          </div>
          <div className="text-xs text-[#1A1A1A] flex items-center gap-1 font-sans-body font-semibold">
            <span className="material-symbols-outlined text-sm">arrow_upward</span>
            12.5% <span className="text-[#888888] font-normal ml-1">vs mes anterior</span>
          </div>
        </div>

        {/* Pedidos Hoy */}
        <div className="bg-[#EFECE7] p-6 border border-black/10 hover:border-black/30 transition-colors relative group shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-label-caps text-[10px] text-[#888888] tracking-[2px]">Pedidos Hoy</h3>
            <span className="material-symbols-outlined text-[#1A1A1A]">shopping_bag</span>
          </div>
          <div className="font-serif-display text-3xl md:text-4xl text-[#1A1A1A] mb-2 font-normal tracking-tight">
            124
          </div>
          <div className="text-xs text-[#1A1A1A] flex items-center gap-1 font-sans-body font-semibold">
            <span className="material-symbols-outlined text-sm">arrow_upward</span>
            4.2% <span className="text-[#888888] font-normal ml-1">vs ayer</span>
          </div>
        </div>

        {/* Stock Bajo */}
        <div className="bg-[#EFECE7] p-6 border border-black/10 hover:border-black/30 transition-colors relative group shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-label-caps text-[10px] text-[#888888] tracking-[2px]">Stock Bajo</h3>
            <span className="material-symbols-outlined text-amber-700">warning</span>
          </div>
          <div className="font-serif-display text-3xl md:text-4xl text-[#1A1A1A] mb-2 font-normal tracking-tight">
            {lowStockCount > 0 ? lowStockCount : 8}
          </div>
          <div className="text-xs text-amber-800 flex items-center gap-1 font-sans-body">
            <span>Productos requieren atención</span>
          </div>
        </div>
      </div>

      {/* Chart & Recent Orders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-[#EFECE7] border border-black/10 p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif-display text-xl text-[#1A1A1A] font-normal">
              Rendimiento ({chartPeriod === '30D' ? '30 Días' : '90 Días'})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setChartPeriod('30D')}
                className={`text-[10px] font-label-caps px-3 py-1 transition-colors ${
                  chartPeriod === '30D'
                    ? 'bg-[#1A1A1A] text-[#F9F8F6] font-bold border border-[#1A1A1A]'
                    : 'bg-[#F9F8F6] text-[#555555] border border-black/10 hover:text-[#1A1A1A]'
                }`}
              >
                30D
              </button>
              <button
                onClick={() => setChartPeriod('90D')}
                className={`text-[10px] font-label-caps px-3 py-1 transition-colors ${
                  chartPeriod === '90D'
                    ? 'bg-[#1A1A1A] text-[#F9F8F6] font-bold border border-[#1A1A1A]'
                    : 'bg-[#F9F8F6] text-[#555555] border border-black/10 hover:text-[#1A1A1A]'
                }`}
              >
                90D
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 bg-[#F9F8F6] border border-black/10 p-4 relative flex items-end justify-between gap-3 overflow-hidden">
            {chartData.map((d, index) => {
              const heightPercent = Math.round((d.sales / maxSales) * 100);
              const isHighlight = index % 2 === 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="text-[10px] text-[#1A1A1A] mb-1 opacity-0 group-hover:opacity-100 transition-opacity font-mono font-bold">
                    {formatCOP(d.sales)}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full transition-all duration-500 ${
                      isHighlight
                        ? 'bg-[#1A1A1A] group-hover:bg-[#333333]'
                        : 'bg-[#D6D2CC] group-hover:bg-[#B0ABA4]'
                    }`}
                  />
                  <span className="text-[10px] text-[#888888] mt-2 font-label-caps">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pedidos Recientes */}
        <div className="bg-[#EFECE7] border border-black/10 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif-display text-xl text-[#1A1A1A] font-normal">
                Pedidos Recientes
              </h3>
              <button onClick={onViewAllOrders} className="text-[#888888] hover:text-[#1A1A1A]">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>

            <div className="space-y-4">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex justify-between items-center pb-4 border-b border-black/10"
                >
                  <div>
                    <p className="font-sans-body text-sm font-semibold text-[#1A1A1A]">
                      {order.id}
                    </p>
                    <p className="text-xs text-[#888888]">{order.timeAgo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans-body text-sm font-semibold text-[#1A1A1A]">
                      {formatCOP(order.total)}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 text-[9px] font-label-caps tracking-[1px] mt-1 ${
                        order.status === 'PROCESANDO'
                          ? 'bg-[#1A1A1A] text-[#F9F8F6]'
                          : 'bg-[#F9F8F6] text-[#555555] border border-black/10'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onViewAllOrders}
            className="w-full mt-6 py-2.5 border border-black/10 bg-[#F9F8F6] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors font-label-caps text-xs font-bold tracking-[2px]"
          >
            VER TODOS LOS PEDIDOS
          </button>
        </div>
      </div>

      {/* Gestión de Productos Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-serif-display text-2xl text-[#1A1A1A] font-normal">
            Gestión de Productos
          </h3>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64 border border-black/10 bg-[#EFECE7]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none pl-10 pr-4 py-2 text-sm text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none placeholder:text-[#888888]"
              />
            </div>
            <button className="px-4 py-2 border border-black/10 bg-[#EFECE7] text-[#1A1A1A] flex items-center gap-2 hover:bg-[#D6D2CC] transition-colors font-label-caps text-[10px] tracking-[2px]">
              <span className="material-symbols-outlined text-base">filter_list</span>
              FILTROS
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-[#EFECE7] border border-black/10 overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 bg-[#D6D2CC] font-label-caps text-[10px] tracking-[2px] text-[#1A1A1A]">
                <th className="p-4 font-normal">PRODUCTO</th>
                <th className="p-4 font-normal">SKU</th>
                <th className="p-4 font-normal">PRECIO</th>
                <th className="p-4 font-normal">STOCK</th>
                <th className="p-4 font-normal">ESTADO</th>
                <th className="p-4 font-normal text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="font-sans-body text-sm">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-black/10 hover:bg-[#F9F8F6] transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-[#D6D2CC] flex-shrink-0 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[#1A1A1A] font-semibold group-hover:text-[#555555] transition-colors">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-[#888888] font-mono text-xs">{product.sku}</td>
                  <td className="p-4 text-[#1A1A1A] font-semibold">
                    {formatCOP(product.price)}
                  </td>
                  <td className="p-4">
                    <span
                      className={
                        product.stock <= 5
                          ? 'text-red-700 font-bold'
                          : 'text-[#1A1A1A]'
                      }
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-label-caps text-[#1A1A1A]">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          product.status === 'ACTIVO'
                            ? 'bg-[#1A1A1A]'
                            : product.status === 'STOCK BAJO'
                            ? 'bg-amber-600'
                            : 'bg-[#888888]'
                        }`}
                      />
                      {product.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onEditProduct(product)}
                      className="text-[#555555] hover:text-[#1A1A1A] transition-colors p-1"
                      title="Editar Producto"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
