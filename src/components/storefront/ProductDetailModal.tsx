import React, { useState } from 'react';
import { Product } from '../../types';
import { formatCOP } from '../../lib/currency';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedSize: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Única'
  );
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedSize);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up">
      <div
        className="bg-[#F9F8F6] border border-black/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative grid grid-cols-1 md:grid-cols-2 text-[#1A1A1A] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-[#1A1A1A] hover:text-[#555555] p-2 bg-[#EFECE7] transition-colors border border-black/10"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Product Image */}
        <div className="bg-[#EFECE7] aspect-[4/5] relative overflow-hidden flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-[#F9F8F6]/90 border border-black/10 px-3 py-1 font-label-caps text-[10px] text-[#1A1A1A] tracking-[2px]">
            SKU: {product.sku}
          </div>
        </div>

        {/* Product Info & Actions */}
        <div className="p-6 md:p-10 flex flex-col justify-between space-y-6">
          <div>
            <span className="sub-headline block mb-1">
              AESTHETE {product.category.toUpperCase()}
            </span>
            <h2 className="font-serif-display text-3xl font-normal text-[#1A1A1A] mb-3">
              {product.name}
            </h2>
            <div className="font-sans-body text-2xl text-[#1A1A1A] font-semibold mb-6">
              {formatCOP(product.price)}
            </div>

            <p className="text-sm text-[#555555] leading-relaxed mb-6 font-sans-body border-t border-black/10 pt-4">
              {product.description}
            </p>

            {/* Sizes Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-2">
                  Talla / Medida
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-2 text-xs font-label-caps transition-all ${
                        selectedSize === size
                          ? 'bg-[#1A1A1A] text-[#F9F8F6] font-bold border border-[#1A1A1A]'
                          : 'bg-[#EFECE7] text-[#1A1A1A] border border-black/10 hover:border-black/30'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Controls */}
            <div className="mb-6">
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-2">
                Cantidad
              </label>
              <div className="flex items-center gap-3 w-32 border border-black/10 bg-[#EFECE7]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-[#555555] hover:text-[#1A1A1A]"
                >
                  -
                </button>
                <span className="flex-1 text-center font-sans-body text-sm font-semibold">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 text-[#555555] hover:text-[#1A1A1A]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-xs text-[#888888] flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${product.stock > 5 ? 'bg-[#1A1A1A]' : 'bg-red-500'}`}></span>
              <span>
                {product.stock > 5 ? `Disponibilidad inmediata (${product.stock} unidades)` : `Stock limitado (${product.stock} disponibles)`}
              </span>
            </div>
          </div>

          {/* Add Button */}
          <div className="space-y-3 pt-4 border-t border-black/10">
            <button
              onClick={handleAdd}
              disabled={addedAnimation}
              className={`w-full py-4 font-label-caps text-xs tracking-[3px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                addedAnimation
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#1A1A1A] text-[#F9F8F6] hover:bg-[#333333]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {addedAnimation ? 'check_circle' : 'shopping_bag'}
              </span>
              {addedAnimation ? '¡Añadido a la Bolsa!' : 'Añadir a la Bolsa'}
            </button>
            <p className="text-[10px] text-center text-[#888888] uppercase tracking-[2px]">
              Envío asegurado a Colombia y devolución gratuita en principales ciudades
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
