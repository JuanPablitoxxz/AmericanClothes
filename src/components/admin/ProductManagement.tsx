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
    <div className="space-y-8 animate-fade-up text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/10 pb-6">
        <div>
          <span className="sub-headline block mb-1">INVENTARIO & CATÁLOGO</span>
          <h1 className="font-serif-display text-3xl font-normal text-[#1A1A1A]">
            Catálogo & Inventario
          </h1>
          <p className="font-sans-body text-xs text-[#555555] mt-1">
            Gestión completa de piezas, precios en COP, existencias y estados.
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

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#EFECE7] p-4 border border-black/10 shadow-sm">
        <div className="relative border border-black/10 bg-[#F9F8F6]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none pl-9 pr-3 py-2 text-xs text-[#1A1A1A] focus:outline-none placeholder:text-[#888888]"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#F9F8F6] border border-black/10 p-2 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
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
            className="w-full bg-[#F9F8F6] border border-black/10 p-2 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ACTIVO">ACTIVO</option>
            <option value="STOCK BAJO">STOCK BAJO</option>
            <option value="PAUSADO">PAUSADO</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-[#888888] font-mono">
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
      </div>

      {/* Product List Grid/Table */}
      <div className="bg-[#EFECE7] border border-black/10 overflow-x-auto shadow-sm">
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
                      className="w-12 h-16 object-cover bg-[#D6D2CC] border border-black/10"
                    />
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">{p.name}</p>
                      <p className="text-[10px] text-[#888888] line-clamp-1 max-w-xs font-sans-body">
                        {p.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-xs text-[#888888]">{p.sku}</td>
                <td className="p-4 text-xs font-label-caps text-[#555555] tracking-[1px]">{p.category}</td>
                <td className="p-4 text-[#1A1A1A] font-semibold">{formatCOP(p.price)}</td>
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
                    className="inline-flex items-center gap-1.5 text-[10px] font-label-caps hover:underline"
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
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => onEditProduct(p)}
                    className="text-[#555555] hover:text-[#1A1A1A] p-1 transition-colors"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => onDeleteProduct(p.id)}
                    className="text-[#888888] hover:text-red-600 p-1 transition-colors"
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
    </div>
  );
};
