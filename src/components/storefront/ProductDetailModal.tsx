import React, { useEffect, useState } from 'react';
import { CartItem, Product } from '../../types';
import { formatCOP } from '../../lib/currency';

interface ProductDetailModalProps {
  product: Product | null;
  cartItems?: CartItem[];
  onClose: () => void;
  onStockLimitNotice?: (message: string) => void;
  onAddToCart: (product: Product, quantity: number, selectedSize: string) => boolean | void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  cartItems = [],
  onClose,
  onStockLimitNotice,
  onAddToCart,
}) => {
  if (!product) return null;

  const alreadyInCart = cartItems
    .filter((i) => i.product.id === product.id)
    .reduce((sum, i) => sum + i.quantity, 0);
  const remainingAvailable = Math.max(0, product.stock - alreadyInCart);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Única'
  );
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [localStockWarning, setLocalStockWarning] = useState<string | null>(null);

  useEffect(() => {
    setQuantity(1);
    setLocalStockWarning(null);
    setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Única');
  }, [product.id]);

  const handleIncreaseQty = () => {
    if (isOutOfStock) {
      const msg = `El producto "${product.name}" está agotado (0 disponibles).`;
      setLocalStockWarning(msg);
      onStockLimitNotice?.(msg);
      return;
    }
    if (quantity >= remainingAvailable) {
      const msg = `Solo hay ${product.stock} ${
        product.stock === 1 ? 'unidad disponible' : 'unidades disponibles'
      } en stock${alreadyInCart > 0 ? ` (ya tienes ${alreadyInCart} en tu bolsa)` : ''}.`;
      setLocalStockWarning(msg);
      onStockLimitNotice?.(msg);
      return;
    }
    setLocalStockWarning(null);
    setQuantity((q) => q + 1);
  };

  const handleDecreaseQty = () => {
    setLocalStockWarning(null);
    setQuantity((q) => Math.max(1, q - 1));
  };

  const handleAdd = () => {
    if (isOutOfStock) {
      const msg = `"${product.name}" está AGOTADO (0 unidades disponibles).`;
      setLocalStockWarning(msg);
      onStockLimitNotice?.(msg);
      return;
    }
    if (remainingAvailable <= 0 || quantity > remainingAvailable) {
      const msg = `Solo hay ${product.stock} ${
        product.stock === 1 ? 'unidad disponible' : 'unidades disponibles'
      } en stock${alreadyInCart > 0 ? ` (ya tienes ${alreadyInCart} en tu bolsa)` : ''}.`;
      setLocalStockWarning(msg);
      onStockLimitNotice?.(msg);
      return;
    }

    const result = onAddToCart(product, quantity, selectedSize);
    if (result === false) return;

    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 650);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-up"
      onClick={onClose}
    >
      <div
        className="bg-[#F9F8F6] border border-black/10 max-w-4xl w-full max-h-[92vh] overflow-y-auto relative grid grid-cols-1 md:grid-cols-2 text-[#1A1A1A] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 text-[#1A1A1A] hover:text-[#555555] p-2 bg-[#EFECE7]/90 backdrop-blur-xs transition-colors border border-black/10"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Product Image */}
        <div className="bg-[#EFECE7] aspect-[4/4] sm:aspect-[4/5] relative overflow-hidden flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-cover ${isOutOfStock ? 'opacity-70 grayscale-[35%]' : ''}`}
          />
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-1.5">
            {isOutOfStock ? (
              <span className="bg-red-800 text-white px-3 py-1 font-label-caps text-[10px] font-bold tracking-[2px]">
                AGOTADO
              </span>
            ) : isLowStock ? (
              <span className="bg-[#1A1A1A] text-[#e9c349] px-3 py-1 font-label-caps text-[10px] font-bold tracking-[2px]">
                ¡ÚLTIMAS UNIDADES! ({product.stock})
              </span>
            ) : null}
          </div>
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-[#F9F8F6]/90 border border-black/10 px-3 py-1 font-label-caps text-[10px] text-[#1A1A1A] tracking-[2px]">
            SKU: {product.sku}
          </div>
        </div>

        {/* Product Info & Actions */}
        <div className="p-5 sm:p-8 md:p-10 flex flex-col justify-between space-y-5 sm:space-y-6">
          <div>
            <span className="sub-headline block mb-1">
              AMERICAN CLOTHES • {product.category.toUpperCase()}
            </span>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-normal text-[#1A1A1A] mb-2 sm:mb-3">
              {product.name}
            </h2>
            <div className="font-sans-body text-xl sm:text-2xl text-[#1A1A1A] font-semibold mb-4 sm:mb-6">
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
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-2 text-xs font-label-caps transition-all ${
                        selectedSize === size
                          ? 'bg-[#1A1A1A] text-[#F9F8F6] font-bold border border-[#1A1A1A]'
                          : 'bg-[#EFECE7] text-[#1A1A1A] border border-black/10 hover:border-black/30'
                      } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Controls */}
            <div className="mb-4">
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-2">
                Cantidad {product.stock > 0 ? `(Máx. ${product.stock} en inventario)` : ''}
              </label>
              <div className="flex items-center gap-3 w-36 border border-black/10 bg-[#EFECE7]">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleDecreaseQty}
                  className="px-3.5 py-2 text-[#555555] hover:text-[#1A1A1A] disabled:opacity-40"
                >
                  -
                </button>
                <span className="flex-1 text-center font-sans-body text-sm font-semibold">
                  {isOutOfStock ? 0 : quantity}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleIncreaseQty}
                  className="px-3.5 py-2 text-[#555555] hover:text-[#1A1A1A] disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            {localStockWarning && (
              <div className="p-2.5 mb-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-amber-700">info</span>
                <span>{localStockWarning}</span>
              </div>
            )}

            {/* Estado de Stock para el Cliente */}
            <div className="text-xs flex items-center gap-2 mb-2">
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  isOutOfStock
                    ? 'bg-red-700'
                    : isLowStock
                    ? 'bg-amber-600'
                    : 'bg-emerald-700'
                }`}
              />
              {isOutOfStock ? (
                <span className="text-red-700 font-bold uppercase font-label-caps text-[10px] tracking-[1.5px]">
                  AGOTADO — 0 unidades disponibles
                </span>
              ) : isLowStock ? (
                <span className="text-amber-800 font-bold">
                  ¡Últimas unidades! Solo quedan {product.stock}{' '}
                  {product.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}
                </span>
              ) : (
                <span className="text-[#555555]">
                  Disponibilidad normal ({product.stock} unidades en stock)
                </span>
              )}
            </div>
          </div>

          {/* Add Button */}
          <div className="space-y-3 pt-4 border-t border-black/10">
            <button
              type="button"
              onClick={handleAdd}
              disabled={addedAnimation || isOutOfStock}
              className={`w-full py-4 font-label-caps text-xs tracking-[3px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                isOutOfStock
                  ? 'bg-red-900/90 text-white cursor-not-allowed'
                  : addedAnimation
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#1A1A1A] text-[#F9F8F6] hover:bg-[#333333]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {isOutOfStock ? 'block' : addedAnimation ? 'check_circle' : 'shopping_bag'}
              </span>
              {isOutOfStock
                ? 'PRODUCTO AGOTADO'
                : addedAnimation
                ? '¡Añadido a la Bolsa!'
                : 'Añadir a la Bolsa'}
            </button>
            <p className="text-[10px] text-center text-[#888888] uppercase tracking-[2px]">
              Al comprar, tus prendas se reservan en inventario durante un plazo máximo de 24 horas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
