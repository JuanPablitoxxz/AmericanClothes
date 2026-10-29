import React, { useState, useEffect } from 'react';
import { AuthUser, CartItem, Product } from '../../types';
import { formatCOP } from '../../lib/currency';
import { detectSqlInjection, detectXss, validateEmail, validateSafeField } from '../../lib/security';
import { generateAdminOrderMessage } from '../../lib/whatsappNotification';

interface ShoppingBagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  products?: Product[];
  currentUser?: AuthUser | null;
  onUpdateQuantity: (productId: string, size: string, newQty: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onCheckout: (customerInfo: { name: string; email: string; address: string; phone?: string }) => Promise<string> | string | void;
  onStockLimitNotice?: (message: string) => void;
  whatsappNumber?: string;
  nequiNumber?: string;
  daviplataNumber?: string;
  breBKey?: string;
  paymentQrImage?: string;
}

export const ShoppingBagDrawer: React.FC<ShoppingBagDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  products = [],
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onStockLimitNotice,
  whatsappNumber = '573001234567',
  nequiNumber = '3224127814',
  daviplataNumber = '3224127814',
  breBKey = '3224127814',
  paymentQrImage = '',
}) => {
  if (!isOpen) return null;

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'success'>('cart');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [bagStockNotice, setBagStockNotice] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };
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

    try {
      const itemsSnapshot = [...cartItems];
      const orderTotal = total;
      const generatedId = await onCheckout({
        name: nameVal.sanitized,
        email: emailVal.sanitized,
        address: addrVal.sanitized,
        phone: phoneVal.sanitized,
      });

      const safeId =
        typeof generatedId === 'string' && generatedId
          ? generatedId
          : `#ORD-${Math.floor(9022 + Math.random() * 900)}`;

      setConfirmedOrder({
        id: safeId,
        name: nameVal.sanitized,
        phone: phoneVal.sanitized,
        address: addrVal.sanitized,
        items: itemsSnapshot,
        total: orderTotal,
      });
      setCheckoutStep('success');
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : 'No hay stock suficiente para completar el pedido.'
      );
    }
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
              <div className="p-3 bg-amber-50 border border-amber-300/80 text-amber-950 text-[11px] leading-relaxed text-left">
                <p className="font-bold uppercase font-label-caps text-[10px] tracking-[1px] mb-0.5">
                  ⏳ Reserva de Stock por 24 Horas
                </p>
                <p>
                  Sus productos han sido reservados y apartados del stock por un plazo máximo de{' '}
                  <strong>24 horas</strong>. Cuando el administrador marque el pedido como{' '}
                  <strong>ENVIADO</strong>, se descontarán permanentemente del inventario.
                </p>
              </div>
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
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-950 text-[11px] flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-base">
                  notifications_active
                </span>
                <span>
                  Alerta enviada automáticamente al WhatsApp del administrador.
                </span>
              </div>

              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                  generateAdminOrderMessage({
                    id: confirmedOrder.id,
                    customerName: confirmedOrder.name,
                    email: customerEmail,
                    phone: confirmedOrder.phone,
                    shippingAddress: confirmedOrder.address,
                    total: confirmedOrder.total,
                    status: 'PROCESANDO',
                    items: confirmedOrder.items.map((i) => ({
                      productId: i.product.id,
                      name: i.product.name,
                      price: i.product.price,
                      quantity: i.quantity,
                      size: i.selectedSize,
                      image: i.product.image,
                    })),
                    date: new Date().toISOString().substring(0, 16),
                    timeAgo: 'Ahora',
                  })
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-[#25D366] text-white font-label-caps text-xs font-bold uppercase tracking-[2px] flex items-center justify-center gap-2 hover:bg-[#20ba5a] transition-colors shadow-sm"
              >
                <span>📲 Abrir Chat de WhatsApp con el Atelier</span>
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
                placeholder="ej: Cra 15 # 85-30, Apto 402, Bogotá D.C."
                className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              />
            </div>

            {/* SECCIÓN OFICIAL DE PAGO: QR DE LLAVE BREVE, NEQUI, DAVIPLATA Y BRE-B */}
            <div className="p-4 bg-[#EFECE7] border-2 border-black/15 space-y-3.5">
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-[#1A1A1A]">payments</span>
                  <span className="font-label-caps text-[11px] font-bold tracking-[1.5px] uppercase text-[#1A1A1A]">
                    Transferencia Inmediata
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-300">
                  Sin Comisiones
                </span>
              </div>

              {/* QR de Llave Breve si está subido desde el panel */}
              {paymentQrImage ? (
                <div className="bg-white p-3 border border-black/10 flex flex-col items-center justify-center text-center space-y-2">
                  <span className="font-label-caps text-[9px] tracking-[1px] text-[#444] uppercase font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-[#D4AF37]">qr_code_2</span>
                    Escanea con Llave Breve / Bre-B o tu App Bancaria
                  </span>
                  <div className="bg-white p-1 border-2 border-black/10 shadow-sm inline-block">
                    <img
                      src={paymentQrImage}
                      alt="Código QR Llave Breve"
                      className="w-40 h-40 object-contain mx-auto"
                    />
                  </div>
                  <span className="text-[10px] text-[#666] font-sans-body leading-tight">
                    Acepta Nequi, Daviplata, Bancolombia, Dale y cualquier app bancaria colombiana.
                  </span>
                </div>
              ) : (
                <div className="bg-white/60 p-3 border border-dashed border-black/20 flex flex-col items-center justify-center text-center space-y-1">
                  <span className="material-symbols-outlined text-2xl text-[#888]">qr_code_scanner</span>
                  <span className="font-label-caps text-[10px] tracking-[1px] text-[#666] font-bold uppercase">
                    Transferencia por Llave Breve o Cuenta
                  </span>
                  <span className="text-[10px] text-[#777]">
                    Copia cualquiera de los números oficiales abajo para transferir.
                  </span>
                </div>
              )}

              {/* Números de cuenta y llave Bre-B con botón de copiar */}
              <div className="space-y-2">
                {/* Nequi */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-black/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3B1254] flex-shrink-0"></span>
                    <div>
                      <span className="font-bold text-[#1A1A1A] block text-[11px] font-label-caps">Nequi</span>
                      <span className="font-mono text-xs text-[#222] font-bold tracking-wider">
                        {nequiNumber || '322 412 7814'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(nequiNumber || '3224127814', 'nequi')}
                    className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#333] text-[#F9F8F6] font-label-caps text-[9px] font-bold uppercase tracking-[1px] transition-colors"
                  >
                    {copiedField === 'nequi' ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>

                {/* Daviplata */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-black/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C24] flex-shrink-0"></span>
                    <div>
                      <span className="font-bold text-[#1A1A1A] block text-[11px] font-label-caps">Daviplata</span>
                      <span className="font-mono text-xs text-[#222] font-bold tracking-wider">
                        {daviplataNumber || '322 412 7814'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(daviplataNumber || '3224127814', 'daviplata')}
                    className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#333] text-[#F9F8F6] font-label-caps text-[9px] font-bold uppercase tracking-[1px] transition-colors"
                  >
                    {copiedField === 'daviplata' ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>

                {/* Llave Bre-B */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-black/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] flex-shrink-0"></span>
                    <div>
                      <span className="font-bold text-[#1A1A1A] block text-[11px] font-label-caps">Llave Bre-B</span>
                      <span className="font-mono text-xs text-[#222] font-bold tracking-wider">
                        {breBKey || '3224127814'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(breBKey || '3224127814', 'breb')}
                    className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#333] text-[#F9F8F6] font-label-caps text-[9px] font-bold uppercase tracking-[1px] transition-colors"
                  >
                    {copiedField === 'breb' ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
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
            {bagStockNotice && (
              <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-amber-700">info</span>
                  {bagStockNotice}
                </span>
                <button
                  type="button"
                  onClick={() => setBagStockNotice(null)}
                  className="text-amber-700 hover:text-amber-950"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            {cartItems.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-[#888888]">shopping_bag</span>
                <p className="font-serif-display text-lg text-[#1A1A1A]">Su bolsa de compras está vacía</p>
                <p className="text-xs text-[#888888]">Explore nuestras piezas exclusivas para comenzar</p>
              </div>
            ) : (
              cartItems.map((item) => {
                const liveProd =
                  products.find((p) => p.id === item.product.id) || item.product;
                const totalForProdInCart = cartItems
                  .filter((c) => c.product.id === item.product.id)
                  .reduce((sum, c) => sum + c.quantity, 0);
                const isLowStock = liveProd.stock > 0 && liveProd.stock <= 3;

                return (
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
                            type="button"
                            onClick={() => onRemoveItem(item.product.id, item.selectedSize)}
                            className="text-[#888888] hover:text-red-600"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                        <p className="text-[10px] font-label-caps text-[#888888] tracking-[1px]">
                          Talla: {item.selectedSize} | Stock disp: {liveProd.stock}
                        </p>
                        {isLowStock && (
                          <p className="text-[10px] font-bold text-amber-800 mt-0.5">
                            ¡Últimas unidades! ({liveProd.stock} disp.)
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center border border-black/10 bg-[#F9F8F6]">
                          <button
                            type="button"
                            onClick={() => {
                              setBagStockNotice(null);
                              onUpdateQuantity(
                                item.product.id,
                                item.selectedSize,
                                item.quantity - 1
                              );
                            }}
                            className="px-2 py-0.5 text-xs text-[#555555]"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-semibold text-[#1A1A1A]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (totalForProdInCart >= liveProd.stock) {
                                const msg = `Solo hay ${liveProd.stock} ${
                                  liveProd.stock === 1
                                    ? 'unidad disponible'
                                    : 'unidades disponibles'
                                } en stock de "${liveProd.name}".`;
                                setBagStockNotice(msg);
                                onStockLimitNotice?.(msg);
                                return;
                              }
                              setBagStockNotice(null);
                              onUpdateQuantity(
                                item.product.id,
                                item.selectedSize,
                                item.quantity + 1
                              );
                            }}
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
                );
              })
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
