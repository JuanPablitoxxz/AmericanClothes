import React, { useState, useEffect } from 'react';
import { AuthUser, CartItem } from '../../types';
import { formatCOP } from '../../lib/currency';
import { detectSqlInjection, detectXss, validateEmail, validateSafeField } from '../../lib/security';

interface ShoppingBagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currentUser?: AuthUser | null;
  onUpdateQuantity: (productId: string, size: string, newQty: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onCheckout: (customerInfo: { name: string; email: string; address: string; phone?: string }) => Promise<string> | string | void;
  whatsappNumber?: string;
}

export const ShoppingBagDrawer: React.FC<ShoppingBagDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  whatsappNumber = '573001234567',
}) => {
  if (!isOpen) return null;

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'success'>('cart');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string;
    name: string;
    phone: string;
    address: string;
    items: CartItem[];
    total: number;
  } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setCustomerName((prev) => prev || currentUser.name);
      setCustomerEmail((prev) => prev || currentUser.email);
      setCustomerPhone((prev) => prev || currentUser.phone || '');
    }
  }, [currentUser]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const applyPromo = () => {
    if (detectSqlInjection(promoCode) || detectXss(promoCode)) {
      alert('Alerta de Seguridad: Código bloqueado por protección Anti-SQLi.');
      return;
    }
    if (promoCode.trim().toUpperCase() === 'AMERICAN10' || promoCode.trim().toUpperCase() === 'AESTHETE10') {
      setDiscount(subtotal * 0.1);
    } else {
      alert('Código no válido. Prueba con AMERICAN10');
    }
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    const nameVal = validateSafeField(customerName, 'Nombre Completo', { minLength: 3, maxLength: 100 });
    if (!nameVal.valid) {
      setCheckoutError(nameVal.error || 'Nombre inválido.');
      return;
    }

    const emailVal = validateEmail(customerEmail);
    if (!emailVal.valid) {
      setCheckoutError(emailVal.error || 'Correo inválido.');
      return;
    }

    const phoneVal = validateSafeField(customerPhone, 'Teléfono', { minLength: 7, maxLength: 25 });
    if (!phoneVal.valid) {
      setCheckoutError(phoneVal.error || 'Teléfono inválido.');
      return;
    }

    const addrVal = validateSafeField(shippingAddress, 'Dirección de Envío', { minLength: 5, maxLength: 300 });
    if (!addrVal.valid) {
      setCheckoutError(addrVal.error || 'Dirección inválida.');
      return;
    }

    const itemsSnapshot = [...cartItems];
    const orderTotal = total;
    const generatedId = await onCheckout({
      name: nameVal.sanitized,
      email: emailVal.sanitized,
      address: addrVal.sanitized,
      phone: phoneVal.sanitized,
    });

    const safeId = typeof generatedId === 'string' && generatedId ? generatedId : `#ORD-${Math.floor(9022 + Math.random() * 900)}`;

    setConfirmedOrder({
      id: safeId,
      name: nameVal.sanitized,
      phone: phoneVal.sanitized,
      address: addrVal.sanitized,
      items: itemsSnapshot,
      total: orderTotal,
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
        {checkoutStep === 'success' && confirmedOrder ? (
          <div className="p-6 flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-[#1A1A1A] text-[#F9F8F6] rounded-full mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <span className="sub-headline block">PEDIDO CONFIRMADO</span>
              <h3 className="font-serif-display text-2xl font-normal text-[#1A1A1A]">
                {confirmedOrder.id}
              </h3>
              <p className="text-xs text-[#555555] leading-relaxed">
                ¡Gracias <strong>{confirmedOrder.name}</strong>! Su compra ha sido registrada en el sistema y guardada en el panel administrativo.
              </p>
            </div>

            <div className="p-4 bg-[#EFECE7] border border-black/10 text-xs space-y-2">
              <div className="flex justify-between font-bold text-[#1A1A1A] border-b border-black/10 pb-1.5">
                <span>Resumen del Pedido</span>
                <span>{formatCOP(confirmedOrder.total)}</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                {confirmedOrder.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-[#555555]">
                    <span className="truncate max-w-[200px]">
                      {i.quantity}x {i.product.name} ({i.selectedSize})
                    </span>
                    <span>{formatCOP(i.product.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-black/10 text-[10px] text-[#777] space-y-0.5">
                <p>📍 Entrega: {confirmedOrder.address}</p>
                <p>📞 Contacto: {confirmedOrder.phone}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `*NUEVO PEDIDO AMERICAN CLOTHES*\n\n` +
                  `*Orden:* ${confirmedOrder.id}\n` +
                  `*Cliente:* ${confirmedOrder.name}\n` +
                  `*Teléfono:* ${confirmedOrder.phone}\n` +
                  `*Dirección:* ${confirmedOrder.address}\n\n` +
                  `*Productos:*\n` +
                  confirmedOrder.items.map((i) => `• ${i.product.name} (Talla: ${i.selectedSize}, Cant: ${i.quantity}) - ${formatCOP(i.product.price * i.quantity)}`).join('\n') +
                  `\n\n*Total a Pagar:* ${formatCOP(confirmedOrder.total)}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-[#25D366] text-white font-label-caps text-xs font-bold uppercase tracking-[2px] flex items-center justify-center gap-2 hover:bg-[#20ba5a] transition-colors shadow-sm"
              >
                <span>📲 Notificar pedido por WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  const summaryText = `PEDIDO ${confirmedOrder.id}\nCliente: ${confirmedOrder.name}\nTotal: ${formatCOP(confirmedOrder.total)}\nDirección: ${confirmedOrder.address}`;
                  navigator.clipboard.writeText(summaryText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-full py-2.5 bg-[#EFECE7] border border-black/10 text-xs font-label-caps text-[#1A1A1A] tracking-[1px] hover:bg-[#e4e0d9]"
              >
                {copied ? '✓ Copiado al portapapeles' : 'Copiar datos del pedido'}
              </button>

              <button
                onClick={() => {
                  setCheckoutStep('cart');
                  setConfirmedOrder(null);
                  onClose();
                }}
                className="w-full py-3 bg-[#1A1A1A] text-[#F9F8F6] font-label-caps text-xs font-bold uppercase tracking-[2px] hover:bg-[#333333]"
              >
                Volver a la Tienda
              </button>
            </div>
          </div>
        ) : checkoutStep === 'shipping' ? (
          <form onSubmit={handleCompleteOrder} className="p-6 flex-1 overflow-y-auto space-y-4">
            <h3 className="sub-headline mb-2">
              Dirección de Entrega
            </h3>

            {checkoutError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs">
                {checkoutError}
              </div>
            )}

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
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                Teléfono / WhatsApp (para entrega)
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="ej: 310 123 4567"
                className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              />
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">Dirección de Envío y Ciudad</label>
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
                placeholder="Código promocional (ej. AMERICAN10)"
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
