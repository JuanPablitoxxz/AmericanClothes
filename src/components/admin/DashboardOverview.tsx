import React, { useMemo, useState } from 'react';
import { Product, Order } from '../../types';
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
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const activeProductsCount = products.filter((p) => p.status === 'ACTIVO').length;
  const validOrders = useMemo(
    () => orders.filter((o) => o.status !== 'CANCELADO'),
    [orders]
  );
  const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const processingOrdersCount = orders.filter((o) => o.status === 'PROCESANDO').length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = !onlyLowStock || p.stock <= 5;
    return matchesSearch && matchesLowStock;
  });

  // Calcular datos del gráfico 100% desde los pedidos reales en Supabase
  const chartData = useMemo(() => {
    const now = new Date();

    if (chartPeriod === '30D') {
      // Últimos 7 días con ventas reales desde la base de datos
      const days: { day: string; key: string; sales: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        days.push({
          day: `${dd}/${mm}`,
          key: `${yyyy}-${mm}-${dd}`,
          sales: 0,
        });
      }

      for (const order of validOrders) {
        const datePrefix = (order.date || '').substring(0, 10);
        const target = days.find((d) => d.key === datePrefix);
        if (target) {
          target.sales += Number(order.total) || 0;
        }
      }

      return days;
    } else {
      // Últimos 3 meses reales desde la base de datos
      const monthNames = [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Sep',
        'Oct',
        'Nov',
        'Dic',
      ];
      const months: { day: string; key: string; sales: number }[] = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        months.push({
          day: `${monthNames[d.getMonth()]} ${yyyy}`,
          key: `${yyyy}-${mm}`,
          sales: 0,
        });
      }

      for (const order of validOrders) {
        const monthPrefix = (order.date || '').substring(0, 7);
        const target = months.find((m) => m.key === monthPrefix);
        if (target) {
          target.sales += Number(order.total) || 0;
        }
      }

      return months;
    }
  }, [validOrders, chartPeriod]);

  const maxSales = Math.max(...chartData.map((d) => d.sales), 1);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 md:space-y-10 animate-fade-up text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-black/10 pb-6">
        <div>
          <span className="sub-headline block mb-1">PANEL ADMINISTRATIVO</span>
          <h1 className="font-serif-display text-2xl sm:text-3xl md:text-4xl font-normal text-[#1A1A1A] mb-1">
            Visión General
          </h1>
          <p className="font-sans-body text-xs text-[#555555]">
            Métricas en tiempo real conectadas directamente a tu base de datos en Supabase.
          </p>
        </div>
        <button
          onClick={onOpenNewProduct}
          className="w-full sm:w-auto justify-center bg-[#1A1A1A] text-[#F9F8F6] font-label-caps text-xs px-6 py-3 font-bold uppercase tracking-[2px] hover:bg-[#333333] transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          NUEVO PRODUCTO
        </button>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Ventas Totales */}
        <div className="bg-[#EFECE7] p-5 sm:p-6 border border-black/10 hover:border-black/30 transition-colors relative group shadow-sm">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <h3 className="font-label-caps text-[10px] text-[#888888] tracking-[2px]">
              Ventas Totales (Supabase)
            </h3>
            <span className="material-symbols-outlined text-[#1A1A1A]">trending_up</span>
          </div>
          <div className="font-serif-display text-2xl sm:text-3xl xl:text-4xl text-[#1A1A1A] mb-2 font-normal tracking-tight break-words">
            {formatCOP(totalRevenue)}
          </div>
          <div className="text-xs text-[#1A1A1A] flex items-center gap-1.5 font-sans-body font-semibold">
            <span className="material-symbols-outlined text-sm text-emerald-700">cloud_done</span>
            <span>{activeProductsCount} piezas activas en base de datos</span>
          </div>
        </div>

        {/* Pedidos Registrados */}
        <div className="bg-[#EFECE7] p-5 sm:p-6 border border-black/10 hover:border-black/30 transition-colors relative group shadow-sm">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <h3 className="font-label-caps text-[10px] text-[#888888] tracking-[2px]">
              Pedidos Registrados
            </h3>
            <span className="material-symbols-outlined text-[#1A1A1A]">shopping_bag</span>
          </div>
          <div className="font-serif-display text-2xl sm:text-3xl xl:text-4xl text-[#1A1A1A] mb-2 font-normal tracking-tight">
            {orders.length}
          </div>
          <div className="text-xs text-[#1A1A1A] flex items-center gap-1 font-sans-body font-semibold">
            <span className="material-symbols-outlined text-sm">pending_actions</span>
            <span>{processingOrdersCount}</span>
            <span className="text-[#888888] font-normal ml-1">en estado PROCESANDO</span>
          </div>
        </div>

        {/* Stock Bajo */}
        <div className="bg-[#EFECE7] p-5 sm:p-6 border border-black/10 hover:border-black/30 transition-colors relative group shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <h3 className="font-label-caps text-[10px] text-[#888888] tracking-[2px]">Stock Bajo</h3>
            <span className="material-symbols-outlined text-amber-700">warning</span>
          </div>
          <div className="font-serif-display text-2xl sm:text-3xl xl:text-4xl text-[#1A1A1A] mb-2 font-normal tracking-tight">
            {lowStockCount}
          </div>
          <div className="text-xs text-amber-800 flex items-center gap-1 font-sans-body">
            <span>Productos con ≤ 5 unidades disponibles</span>
          </div>
        </div>
      </div>

      {/* Chart & Recent Orders Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="xl:col-span-2 bg-[#EFECE7] border border-black/10 p-4 sm:p-6 flex flex-col justify-between shadow-sm min-w-0">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div>
              <h3 className="font-serif-display text-lg sm:text-xl text-[#1A1A1A] font-normal">
                Ventas Reales ({chartPeriod === '30D' ? 'Últimos 7 Días' : 'Últimos 3 Meses'})
              </h3>
              <p className="text-[11px] text-[#777777]">
                Calculado directamente desde las órdenes registradas en Supabase
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChartPeriod('30D')}
                className={`text-[10px] font-label-caps px-3 py-1 transition-colors ${
                  chartPeriod === '30D'
                    ? 'bg-[#1A1A1A] text-[#F9F8F6] font-bold border border-[#1A1A1A]'
                    : 'bg-[#F9F8F6] text-[#555555] border border-black/10 hover:text-[#1A1A1A]'
                }`}
              >
                DIARIO
              </button>
              <button
                onClick={() => setChartPeriod('90D')}
                className={`text-[10px] font-label-caps px-3 py-1 transition-colors ${
                  chartPeriod === '90D'
                    ? 'bg-[#1A1A1A] text-[#F9F8F6] font-bold border border-[#1A1A1A]'
                    : 'bg-[#F9F8F6] text-[#555555] border border-black/10 hover:text-[#1A1A1A]'
                }`}
              >
                MENSUAL
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-52 sm:h-64 bg-[#F9F8F6] border border-black/10 p-3 sm:p-4 relative flex items-end justify-between gap-2 sm:gap-3 overflow-x-auto">
            {chartData.map((d, index) => {
              const heightPercent =
                d.sales > 0 ? Math.max(8, Math.round((d.sales / maxSales) * 100)) : 2;
              const isHighlight = d.sales > 0;
              return (
                <div
                  key={index}
                  className="flex-1 min-w-[40px] flex flex-col items-center h-full justify-end group"
                >
                  <div className="text-[9px] sm:text-[10px] text-[#1A1A1A] mb-1 opacity-85 group-hover:opacity-100 transition-opacity font-mono font-bold whitespace-nowrap">
                    {d.sales > 0 ? formatCOP(d.sales) : '$ 0'}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full transition-all duration-500 ${
                      isHighlight
                        ? 'bg-[#1A1A1A] group-hover:bg-[#333333]'
                        : 'bg-[#D6D2CC]/60'
                    }`}
                  />
                  <span className="text-[9px] sm:text-[10px] text-[#888888] mt-2 font-label-caps truncate max-w-full">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pedidos Recientes */}
        <div className="bg-[#EFECE7] border border-black/10 p-5 sm:p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif-display text-lg sm:text-xl text-[#1A1A1A] font-normal">
                Pedidos Recientes
              </h3>
              <button
                onClick={onViewAllOrders}
                className="text-[#888888] hover:text-[#1A1A1A]"
                title="Ver todos los pedidos"
              >
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="py-10 text-center text-[#777777] space-y-2">
                <span className="material-symbols-outlined text-3xl text-[#888888]">
                  receipt_long
                </span>
                <p className="text-xs">No hay pedidos registrados en la base de datos.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center gap-2 pb-4 border-b border-black/10"
                  >
                    <div className="min-w-0">
                      <p className="font-sans-body text-sm font-semibold text-[#1A1A1A] truncate">
                        {order.id}
                      </p>
                      <p className="text-xs text-[#666666] truncate">{order.customerName}</p>
                      <p className="text-[11px] text-[#888888]">{order.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
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
            )}
          </div>

          <button
            onClick={onViewAllOrders}
            className="w-full mt-6 py-3 border border-black/15 bg-[#F9F8F6] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors font-label-caps text-xs font-bold tracking-[2px]"
          >
            VER TODOS LOS PEDIDOS
          </button>
        </div>
      </div>

      {/* Gestión Rápida de Productos Section */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <h3 className="font-serif-display text-xl sm:text-2xl text-[#1A1A1A] font-normal">
            Resumen de Catálogo ({filteredProducts.length})
          </h3>

          <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64 border border-black/10 bg-[#EFECE7]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none pl-10 pr-4 py-2 text-xs sm:text-sm text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none placeholder:text-[#888888]"
              />
            </div>
            <button
              type="button"
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`px-4 py-2 border transition-colors font-label-caps text-[10px] tracking-[2px] flex items-center justify-center gap-2 ${
                onlyLowStock
                  ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A] font-bold'
                  : 'border-black/10 bg-[#EFECE7] text-[#1A1A1A] hover:bg-[#D6D2CC]'
              }`}
            >
              <span className="material-symbols-outlined text-base">filter_list</span>
              {onlyLowStock ? 'STOCK BAJO ACTIVO' : 'FILTRAR STOCK BAJO'}
            </button>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-[#EFECE7] border border-black/10 p-10 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-[#888888]">inventory_2</span>
            <p className="font-serif-display text-lg text-[#1A1A1A]">
              No hay productos registrados en este filtro
            </p>
            <p className="text-xs text-[#666666]">
              Agrega tu primer producto para mostrarlo inmediatamente en la tienda.
            </p>
          </div>
        ) : (
          <>
            {/* Vista de Tarjetas para Smartphone (< md) */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-[#EFECE7] border border-black/10 p-4 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-14 h-18 object-cover bg-[#D6D2CC] border border-black/10 flex-shrink-0"
                    />
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                        {product.name}
                      </p>
                      <p className="text-[11px] font-mono text-[#777777]">SKU: {product.sku}</p>
                      <p className="text-xs font-bold text-[#1A1A1A]">
                        {formatCOP(product.price)}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-label-caps">
                        <span
                          className={
                            product.stock <= 5 ? 'text-red-700 font-bold' : 'text-[#555555]'
                          }
                        >
                          Stock: {product.stock}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#1A1A1A]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              product.status === 'ACTIVO'
                                ? 'bg-[#1A1A1A]'
                                : product.status === 'STOCK BAJO'
                                ? 'bg-amber-600'
                                : 'bg-[#888888]'
                            }`}
                          />
                          {product.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onEditProduct(product)}
                    className="p-2.5 bg-[#F9F8F6] border border-black/15 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors flex-shrink-0"
                    title="Editar Producto"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Vista de Tabla para Tablet y PC (md+) */}
            <div className="hidden md:block bg-[#EFECE7] border border-black/10 overflow-x-auto shadow-sm">
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
                          <div className="w-12 h-16 bg-[#D6D2CC] flex-shrink-0 overflow-hidden border border-black/10">
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
                          className="text-[#555555] hover:text-[#1A1A1A] transition-colors p-1.5"
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
          </>
        )}
      </div>
    </div>
  );
};


