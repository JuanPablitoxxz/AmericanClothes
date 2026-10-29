import React, { useState } from 'react';
import { Product, ProductCategory, ProductStatus } from '../../types';
import { formatCOP } from '../../lib/currency';

interface ProductManagementProps {
  products: Product[];
  onOpenNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleStatus: (productId: string) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  onOpenNewProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleStatus,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODOS');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'TODOS' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'TODOS' || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 md:space-y-8 animate-fade-up text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-black/10 pb-6">
        <div>
          <span className="sub-headline block mb-1">INVENTARIO & CATÁLOGO</span>
          <h1 className="font-serif-display text-2xl sm:text-3xl md:text-4xl font-normal text-[#1A1A1A]">
            Catálogo & Inventario
          </h1>
          <p className="font-sans-body text-xs text-[#555555] mt-1">
            Gestión completa de piezas, precios en COP, existencias y estados.
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

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-[#EFECE7] p-4 border border-black/10 shadow-sm">
        <div className="relative border border-black/10 bg-[#F9F8F6]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none pl-9 pr-3 py-2.5 text-xs text-[#1A1A1A] focus:outline-none placeholder:text-[#888888]"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
          >
            <option value="TODOS">Todas las Categorías</option>
            <option value="Hombre">Hombre</option>
            <option value="Mujer">Mujer</option>
            <option value="Accesorios">Accesorios</option>
            <option value="Archivo">Archivo</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ACTIVO">ACTIVO</option>
            <option value="STOCK BAJO">STOCK BAJO</option>
            <option value="PAUSADO">PAUSADO</option>
          </select>
        </div>

        <div className="flex items-center justify-start lg:justify-end text-xs text-[#666666] font-mono">
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-[#EFECE7] border border-black/10 p-12 text-center space-y-3 shadow-xs">
          <span className="material-symbols-outlined text-4xl text-[#888888]">inventory_2</span>
          <p className="font-serif-display text-xl text-[#1A1A1A]">
            No hay productos en la base de datos con este filtro
          </p>
          <p className="text-xs text-[#666666]">
            Usa el botón &ldquo;Nuevo Producto&rdquo; para registrar piezas en Supabase.
          </p>
        </div>
      ) : (
        <>
          {/* Vista de Tarjetas para Smartphone (< md) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-[#EFECE7] border border-black/10 p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-16 h-20 object-cover bg-[#D6D2CC] border border-black/10 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-[#1A1A1A] leading-snug">{p.name}</p>
                      <span className="font-mono text-[10px] text-[#777777] flex-shrink-0">
                        {p.sku}
                      </span>
                    </div>
                    <p className="text-[11px] font-label-caps text-[#666666] tracking-[1px] mt-0.5">
                      {p.category}
                    </p>
                    <p className="text-sm font-bold text-[#1A1A1A] mt-1">{formatCOP(p.price)}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <span className={p.stock <= 5 ? 'text-red-700 font-bold' : 'text-[#555555]'}>
                        Stock: {p.stock} uds
                      </span>
                      <button
                        onClick={() => onToggleStatus(p.id)}
                        className="inline-flex items-center gap-1.5 text-[10px] font-label-caps bg-[#F9F8F6] px-2 py-0.5 border border-black/10"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            p.status === 'ACTIVO'
                              ? 'bg-[#1A1A1A]'
                              : p.status === 'STOCK BAJO'
                              ? 'bg-amber-600'
                              : 'bg-[#888888]'
                          }`}
                        />
                        {p.status}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
                  <button
                    onClick={() => onEditProduct(p)}
                    className="flex-1 py-2 bg-[#F9F8F6] border border-black/15 text-[#1A1A1A] font-label-caps text-[10px] tracking-[1.5px] uppercase flex items-center justify-center gap-1.5 hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Editar
                  </button>
                  <button
                    onClick={() => onDeleteProduct(p.id)}
                    className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 font-label-caps text-[10px] tracking-[1.5px] uppercase flex items-center justify-center gap-1 hover:bg-red-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Product List Table para Tablet y PC (md+) */}
          <div className="hidden md:block bg-[#EFECE7] border border-black/10 overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/10 bg-[#D6D2CC] font-label-caps text-[10px] tracking-[2px] text-[#1A1A1A]">
                  <th className="p-4 font-normal">PRODUCTO</th>
                  <th className="p-4 font-normal">SKU</th>
                  <th className="p-4 font-normal">CATEGORÍA</th>
                  <th className="p-4 font-normal">PRECIO</th>
                  <th className="p-4 font-normal">STOCK</th>
                  <th className="p-4 font-normal">ESTADO</th>
                  <th className="p-4 font-normal text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="font-sans-body text-sm">
                {filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-black/10 hover:bg-[#F9F8F6] transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-16 object-cover bg-[#D6D2CC] border border-black/10 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1A1A1A]">{p.name}</p>
                          <p className="text-[11px] text-[#777777] line-clamp-1 max-w-xs font-sans-body">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-[#777777] whitespace-nowrap">
                      {p.sku}
                    </td>
                    <td className="p-4 text-xs font-label-caps text-[#555555] tracking-[1px]">
                      {p.category}
                    </td>
                    <td className="p-4 text-[#1A1A1A] font-semibold whitespace-nowrap">
                      {formatCOP(p.price)}
                    </td>
                    <td className="p-4 font-mono">
                      <span
                        className={
                          p.stock <= 5 ? 'text-red-700 font-bold' : 'text-[#1A1A1A]'
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => onToggleStatus(p.id)}
                        className="inline-flex items-center gap-1.5 text-[10px] font-label-caps hover:underline whitespace-nowrap"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            p.status === 'ACTIVO'
                              ? 'bg-[#1A1A1A]'
                              : p.status === 'STOCK BAJO'
                              ? 'bg-amber-600'
                              : 'bg-[#888888]'
                          }`}
                        />
                        {p.status}
                      </button>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => onEditProduct(p)}
                        className="text-[#555555] hover:text-[#1A1A1A] p-1.5 transition-colors"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="text-[#888888] hover:text-red-600 p-1.5 transition-colors"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
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
  );
};
