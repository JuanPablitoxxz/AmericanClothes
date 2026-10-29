import React, { useState } from 'react';
import { Product, ProductCategory } from '../../types';
import { formatCOP } from '../../lib/currency';
import { detectSqlInjection, detectXss } from '../../lib/security';

interface ProductCatalogProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  onAddToCart,
  searchQuery,
  setSearchQuery,
}) => {
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const categories: string[] = ['Todos', 'Hombre', 'Mujer', 'Accesorios'];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  return (
    <section
      className="py-12 sm:py-16 px-4 sm:px-8 md:px-16 max-w-[1440px] mx-auto z-10 relative bg-[#F9F8F6]"
      id="catalog"
    >
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 sm:mb-12 border-b border-black/10 pb-6">
        <div>
          <span className="sub-headline block mb-1">Catálogo Colombiano</span>
          <h2 className="font-serif-display text-3xl sm:text-4xl text-[#1A1A1A]">
            Piezas de Colección
          </h2>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="grid grid-cols-4 sm:flex bg-[#EFECE7] p-1 border border-black/10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-2 sm:px-4 py-2 font-label-caps text-[9px] sm:text-[10px] tracking-[1px] sm:tracking-[2px] text-center transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#1A1A1A] text-[#F9F8F6] font-bold shadow-sm'
                    : 'text-[#555555] hover:text-[#1A1A1A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col xs:flex-row gap-3 flex-1 sm:flex-initial">
            <div className="relative flex-1 sm:w-52 bg-[#EFECE7] border border-black/10">
              <input
                type="text"
                maxLength={100}
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  if (detectSqlInjection(val) || detectXss(val)) return;
                  setSearchQuery(val);
                }}
                placeholder="Buscar pieza..."
                className="w-full bg-transparent border-none py-2.5 pl-3 pr-8 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
              />
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-[#888888]">
                search
              </span>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#EFECE7] border border-black/10 text-xs text-[#1A1A1A] px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] font-sans-body"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Products */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-[#EFECE7]/60 border border-black/10">
          <span className="material-symbols-outlined text-4xl text-[#888888] mb-3">
            inventory_2
          </span>
          <p className="font-serif-display text-xl text-[#1A1A1A]">No se encontraron piezas</p>
          <p className="text-xs text-[#888888] mt-1">
            Prueba a modificar los filtros de búsqueda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className="group bg-[#EFECE7] border border-black/10 hover:border-black/40 transition-all duration-300 flex flex-col cursor-pointer overflow-hidden shadow-sm"
            >
              {/* Product Image Container (4:5 aspect ratio) */}
              <div className="relative aspect-[4/5] bg-[#D6D2CC] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                  <span className="bg-[#F9F8F6]/90 backdrop-blur-md px-2.5 py-1 font-label-caps text-[9px] text-[#1A1A1A] border border-black/10 tracking-[2px]">
                    {product.sku}
                  </span>
                  {product.status === 'STOCK BAJO' && (
                    <span className="bg-[#1A1A1A] text-[#F9F8F6] px-2.5 py-1 font-label-caps text-[9px] font-bold tracking-[2px]">
                      Últimas unidades
                    </span>
                  )}
                </div>

                {/* Quick Add Overlay (Always accessible on touch/mobile, hover on desktop) */}
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-between gap-2">
                  <span className="font-label-caps text-[10px] text-white tracking-[2px]">
                    Ver Detalles
                  </span>
                  <button
                    onClick={(e) => onAddToCart(product, e)}
                    className="bg-[#1A1A1A] text-[#F9F8F6] px-3 py-2 font-bold hover:bg-[#333333] transition-colors flex items-center gap-1.5 text-xs font-label-caps tracking-[2px]"
                  >
                    <span className="material-symbols-outlined text-sm">add_shopping_bag</span>
                    Añadir
                  </button>
                </div>
              </div>

              {/* Product Meta */}
              <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-[#EFECE7]">
                <div>
                  <span className="text-[10px] font-label-caps text-[#888888] uppercase tracking-[2px] block mb-1">
                    {product.category}
                  </span>
                  <h3 className="font-serif-display text-lg text-[#1A1A1A] group-hover:text-[#555555] transition-colors">
                    {product.name}
                  </h3>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-3">
                  <span className="font-sans-body font-semibold text-base text-[#1A1A1A]">
                    {formatCOP(product.price)}
                  </span>
                  <span className="text-[10px] font-label-caps text-[#1A1A1A] tracking-[2px] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Explorar{' '}
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
