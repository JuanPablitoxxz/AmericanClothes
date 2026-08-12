import React, { useState } from 'react';
import { CartItem } from '../../types';
import { formatCOP } from '../../lib/currency';

interface ShoppingBagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, size: string, newQty: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onCheckout: (customerInfo: { name: string; email: string; address: string }) => void;
}

export const ShoppingBagDrawer: React.FC<ShoppingBagDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('Camila Rodríguez');
  const [customerEmail, setCustomerEmail] = useState('camila.rodriguez@email.com');
  const [shippingAddress, setShippingAddress] = useState('Calle 85 #11-53, Bogotá, Colombia');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'AESTHETE10') {
      setDiscount(subtotal * 0.1);
    } else {
      alert('Código no válido. Prueba con AESTHETE10');
    }
  };

  const handleCompleteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckout({
      name: customerName,
      email: customerEmail,
      address: shippingAddress,
    });
    setCheckoutStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-up">
      <div className="bg-[#F9F8F6] border-l border-black/10 w-full max-w-md h-full flex flex-col justify-between text-[#1A1A1A] shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-black/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1A1A1A]">shopping_bag</span>
            <h2 className="font-serif-display text-xl font-normal text-[#1A1A1A]">
              {checkoutStep === 'cart' ? 'Bolsa de Compras' : checkoutStep === 'shipping' ? 'Datos de Envío' : 'Pedido Confirmado'}
            </h2>
          </div>
          <button
            onClick={() => {
              setCheckoutStep('cart');
              onClose();
            }}
            className="text-[#1A1A1A] hover:text-[#555555] p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Area */}
        {checkoutStep === 'success' ? (
          <div className="p-8 flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-[#1A1A1A] text-[#F9F8F6] rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h3 className="font-serif-display text-2xl font-normal text-[#1A1A1A]">¡Gracias por su pedido!</h3>
            <p className="text-xs text-[#555555] leading-relaxed">
              Su compra ha sido registrada con éxito. Hemos enviado la confirmación y el seguimiento nacional a <strong>{customerEmail}</strong>.
            </p>
            <div className="p-4 bg-[#EFECE7] border border-black/10 w-full text-left text-xs font-mono space-y-1">
              <p className="text-[#1A1A1A] font-bold">Estado: Registrado en Admin Dashboard</p>
              <p className="text-[#888888]">Envío: Prioritario asegurado en Colombia</p>
            </div>
            <button
              onClick={() => {
                setCheckoutStep('cart');
                onClose();
              }}
              className="mt-4 w-full py-3 bg-[#1A1A1A] text-[#F9F8F6] font-label-caps text-xs font-bold uppercase tracking-[2px]"
            >
              Volver a la Tienda
            </button>
          </div>
        ) : checkoutStep === 'shipping' ? (
          <form onSubmit={handleCompleteOrder} className="p-6 flex-1 overflow-y-auto space-y-4">
            <h3 className="sub-headline mb-2">
              Dirección de Entrega
            </h3>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              />
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              />
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">Dirección de Envío</label>
              <textarea
                required
                rows={3}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              />
            </div>

            <div className="p-3 bg-[#EFECE7] border border-black/10 text-xs space-y-1">
              <div className="flex justify-between text-[#888888]">
                <span>Subtotal:</span>
                <span>{formatCOP(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#1A1A1A] font-bold">
                  <span>Descuento:</span>
                  <span>-{formatCOP(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#1A1A1A] pt-1 border-t border-black/10">
                <span>Total a Pagar:</span>
                <span>{formatCOP(total)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => setCheckoutStep('cart')}
                className="w-1/3 py-3 border border-black/10 bg-[#EFECE7] font-label-caps text-xs text-[#1A1A1A] tracking-[2px]"
              >
                Volver
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 bg-[#1A1A1A] text-[#F9F8F6] font-label-caps text-xs font-bold uppercase tracking-[2px] hover:bg-[#333333]"
              >
                Confirmar y Pagar
              </button>
            </div>
          </form>
        ) : (
          /* Cart View */
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-[#888888]">shopping_bag</span>
                <p className="font-serif-display text-lg text-[#1A1A1A]">Su bolsa de compras está vacía</p>
                <p className="text-xs text-[#888888]">Explore nuestras piezas exclusivas para comenzar</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedSize}`}
                  className="flex gap-4 p-3 bg-[#EFECE7] border border-black/10 shadow-sm"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-20 object-cover bg-[#D6D2CC]"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif-display font-normal text-sm text-[#1A1A1A]">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.product.id, item.selectedSize)}
                          className="text-[#888888] hover:text-red-600"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                      <p className="text-[10px] font-label-caps text-[#888888] tracking-[1px]">
                        Talla: {item.selectedSize} | SKU: {item.product.sku}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center border border-black/10 bg-[#F9F8F6]">
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.selectedSize, item.quantity - 1)
                          }
                          className="px-2 py-0.5 text-xs text-[#555555]"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold text-[#1A1A1A]">{item.quantity}</span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.selectedSize, item.quantity + 1)
                          }
                          className="px-2 py-0.5 text-xs text-[#555555]"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-semibold text-sm text-[#1A1A1A]">
                        {formatCOP(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer Summary & Checkout */}
        {checkoutStep === 'cart' && cartItems.length > 0 && (
          <div className="p-6 border-t border-black/10 bg-[#EFECE7] space-y-4">
            {/* Promo code */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código promocional (ej. AESTHETE10)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 bg-[#F9F8F6] border border-black/10 p-2 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              />
              <button
                onClick={applyPromo}
                className="px-3 py-2 border border-black/10 bg-[#1A1A1A] text-xs font-label-caps text-[#F9F8F6] hover:bg-[#333333] tracking-[2px]"
              >
                Aplicar
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#888888]">
                <span>Subtotal:</span>
                <span>{formatCOP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#888888]">
                <span>Envío Nacional Asegurado:</span>
                <span className="text-[#1A1A1A] font-bold">GRATUITO</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#1A1A1A] font-bold">
                  <span>Descuento (10%):</span>
                  <span>-{formatCOP(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-[#1A1A1A] pt-2 border-t border-black/10">
                <span>Total Estimado:</span>
                <span>{formatCOP(total)}</span>
              </div>
            </div>

            <button
              onClick={() => setCheckoutStep('shipping')}
              className="w-full py-4 bg-[#1A1A1A] text-[#F9F8F6] font-label-caps text-xs font-bold uppercase tracking-[3px] hover:bg-[#333333] flex items-center justify-center gap-2"
            >
              Procesar Pedido
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
