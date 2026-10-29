import React, { useState } from 'react';
import { saveCloudSettings } from '../../lib/storeData';
import { formatPhoneForWhatsApp, sendCallMeBotMessage, sendWebhookNotification } from '../../lib/whatsappNotification';
import { sendTelegramMessage } from '../../lib/telegramNotification';
import { Order } from '../../types';

interface SettingsPanelProps {
  shaderOpacity: number;
  setShaderOpacity: (val: number) => void;
  currency: string;
  setCurrency: (val: string) => void;
  announcementText: string;
  setAnnouncementText: (val: string) => void;
  whatsappNumber: string;
  setWhatsappNumber: (val: string) => void;
  whatsappApiKey?: string;
  setWhatsappApiKey?: (val: string) => void;
  whatsappWebhookUrl?: string;
  setWhatsappWebhookUrl?: (val: string) => void;
  autoNotifyAdmin?: boolean;
  setAutoNotifyAdmin?: (val: boolean) => void;
  telegramBotToken?: string;
  setTelegramBotToken?: (val: string) => void;
  telegramChatId?: string;
  setTelegramChatId?: (val: string) => void;
  autoNotifyTelegram?: boolean;
  setAutoNotifyTelegram?: (val: boolean) => void;
  nequiNumber?: string;
  setNequiNumber?: (val: string) => void;
  daviplataNumber?: string;
  setDaviplataNumber?: (val: string) => void;
  breBKey?: string;
  setBreBKey?: (val: string) => void;
  paymentQrImage?: string;
  setPaymentQrImage?: (val: string) => void;
  isSupabaseConfigured: boolean;
  productsCount: number;
  ordersCount: number;
  onSyncDatabase: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  shaderOpacity,
  setShaderOpacity,
  currency,
  setCurrency,
  announcementText,
  setAnnouncementText,
  whatsappNumber,
  setWhatsappNumber,
  whatsappApiKey = '',
  setWhatsappApiKey,
  whatsappWebhookUrl = '',
  setWhatsappWebhookUrl,
  autoNotifyAdmin = true,
  setAutoNotifyAdmin,
  telegramBotToken = '',
  setTelegramBotToken,
  telegramChatId = '',
  setTelegramChatId,
  autoNotifyTelegram = true,
  setAutoNotifyTelegram,
  nequiNumber = '3224127814',
  setNequiNumber,
  daviplataNumber = '3224127814',
  setDaviplataNumber,
  breBKey = '3224127814',
  setBreBKey,
  paymentQrImage = '',
  setPaymentQrImage,
  isSupabaseConfigured,
  productsCount,
  ordersCount,
  onSyncDatabase,
}) => {
  const [savedMessage, setSavedMessage] = useState(false);
  const [qrUploadMode, setQrUploadMode] = useState<'upload' | 'url'>('upload');
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    message: string | null;
    isError: boolean;
  }>({
    loading: false,
    message: null,
    isError: false,
  });

  const [telegramTestStatus, setTelegramTestStatus] = useState<{
    loading: boolean;
    message: string | null;
    isError: boolean;
  }>({
    loading: false,
    message: null,
    isError: false,
  });

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert('La imagen del QR de pago no debe exceder 4 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPaymentQrImage?.(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupabaseConfigured) {
      try {
        await saveCloudSettings({
          shaderOpacity,
          currency,
          announcementText,
          whatsappNumber,
          whatsappApiKey,
          whatsappWebhookUrl,
          autoNotifyAdmin,
          telegramBotToken,
          telegramChatId,
          autoNotifyTelegram,
          nequiNumber,
          daviplataNumber,
          breBKey,
          paymentQrImage,
        });
      } catch (err) {
        console.error('Error al guardar ajustes en Supabase:', err);
      }
    }
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleTestTelegramNotification = async () => {
    if (!telegramBotToken.trim()) {
      setTelegramTestStatus({
        loading: false,
        message: 'Por favor ingresa primero el Bot Token de Telegram (ej. 123456789:ABCdef...).',
        isError: true,
      });
      return;
    }

    if (!telegramChatId.trim()) {
      setTelegramTestStatus({
        loading: false,
        message: 'Por favor ingresa tu Chat ID numérico de Telegram (ej. 987654321).',
        isError: true,
      });
      return;
    }

    setTelegramTestStatus({
      loading: true,
      message: 'Enviando alerta de prueba a Telegram...',
      isError: false,
    });

    const mockOrder: Order = {
      id: `#ORD-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: 'Cliente Simulado American Clothes',
      email: 'cliente@americanclothes.com',
      phone: '+57 322 412 7814',
      timeAgo: 'Ahora mismo',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      total: 350000,
      status: 'PROCESANDO',
      shippingAddress: 'Cra 15 # 85-30, Bogotá D.C.',
      items: [
        {
          productId: 'test-item-1',
          name: 'Hoodie Boxy Heavyweight Noir',
          price: 180000,
          quantity: 1,
          size: 'M',
          image: '',
        },
        {
          productId: 'test-item-2',
          name: 'Pantalón Cargo Vintage Black',
          price: 170000,
          quantity: 1,
          size: 'L',
          image: '',
        },
      ],
    };

    const testMsg =
      `🚨 <b>¡PRUEBA EXITOSA DE AMERICAN CLOTHES!</b>\n\n` +
      `¡Tu bot de Telegram está 100% activo y conectado en segundo plano!\n\n` +
      `📋 <b>Orden Simulada:</b> <code>${mockOrder.id}</code>\n` +
      `💰 <b>Total a Cobrar:</b> <b>$ 350.000 COP</b>\n` +
      `⏳ <b>Estado:</b> PROCESANDO (Stock reservado por 24 horas)\n\n` +
      `👤 <b>DATOS DEL CLIENTE:</b>\n` +
      `• <b>Nombre:</b> ${mockOrder.customerName}\n` +
      `• <b>Teléfono:</b> ${mockOrder.phone}\n` +
      `• <b>WhatsApp del Cliente:</b> <a href="https://wa.me/573224127814">👉 Tocar aquí para chatear por WhatsApp</a>\n` +
      `• <b>Dirección:</b> ${mockOrder.shippingAddress}\n\n` +
      `🛍️ <b>PRENDAS SOLICITADAS:</b>\n` +
      `  1. <b>Hoodie Boxy Heavyweight Noir</b> (Talla M x 1) - $ 180.000 COP\n` +
      `  2. <b>Pantalón Cargo Vintage Black</b> (Talla L x 1) - $ 170.000 COP\n\n` +
      `<i>Cada vez que un cliente realice un pedido, recibirás instantáneamente una alerta igual a esta con el enlace a su WhatsApp.</i>`;

    const res = await sendTelegramMessage(telegramBotToken, telegramChatId, testMsg);

    setTelegramTestStatus({
      loading: false,
      message: res.message,
      isError: !res.success,
    });
  };

  const handleTestWhatsAppNotification = async () => {
    const cleanPhone = formatPhoneForWhatsApp(whatsappNumber);
    if (!cleanPhone) {
      setTestStatus({
        loading: false,
        message: 'Por favor ingresa primero el número de WhatsApp del administrador con indicativo de país (ej. 573224127814).',
        isError: true,
      });
      return;
    }

    if (!whatsappApiKey && !whatsappWebhookUrl) {
      setTestStatus({
        loading: false,
        message:
          'Para recibir notificaciones automáticas, por favor ingresa tu API Key de CallMeBot (sigue las instrucciones abajo) o una URL de Webhook.',
        isError: true,
      });
      return;
    }

    setTestStatus({ loading: true, message: 'Enviando mensaje de prueba...', isError: false });

    const mockOrder: Order = {
      id: `#TEST-${Math.floor(100 + Math.random() * 900)}`,
      customerName: 'Cliente de Prueba (American Clothes)',
      email: 'prueba@americanclothes.com',
      phone: '+57 300 123 4567',
      timeAgo: 'Ahora mismo',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      total: 180000,
      status: 'PROCESANDO',
      shippingAddress: 'Cra 15 # 85-30, Bogotá D.C.',
      items: [
        {
          productId: 'test-1',
          name: 'Hoodie Boxy Heavyweight Noir',
          price: 180000,
          quantity: 1,
          size: 'L',
          image: '',
        },
      ],
    };

    let resultMsg = '';
    let hasError = false;

    if (whatsappApiKey) {
      const callmebotRes = await sendCallMeBotMessage(
        cleanPhone,
        whatsappApiKey,
        `🔔 *AMERICAN CLOTHES - PRUEBA DE CONEXIÓN*\n\n¡Tu sistema de notificación automática por WhatsApp está funcionando correctamente!\n\n📋 *Orden Simulación:* ${mockOrder.id}\n👤 *Cliente:* ${mockOrder.customerName}\n📞 *WhatsApp Directo Cliente:* https://wa.me/573001234567\n💰 *Total:* $ 180.000 COP\n\nCada vez que un cliente compre, te llegará un mensaje como este en segundo plano automáticamente.`
      );
      resultMsg = callmebotRes.message;
      hasError = !callmebotRes.success;
    }

    if (whatsappWebhookUrl) {
      const webhookRes = await sendWebhookNotification(whatsappWebhookUrl, mockOrder, cleanPhone);
      resultMsg += ` | Webhook: ${webhookRes.message}`;
    }

    setTestStatus({
      loading: false,
      message: resultMsg || 'Petición enviada. Revisa tu WhatsApp en los próximos segundos.',
      isError: hasError,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-up text-[#1A1A1A]">
      <div className="border-b border-black/10 pb-6">
        <span className="sub-headline block mb-1">PREFERENCIAS GENERALES</span>
        <h1 className="font-serif-display text-2xl sm:text-3xl md:text-4xl font-normal text-[#1A1A1A]">
          Ajustes de Sistema & Experiencia
        </h1>
        <p className="font-sans-body text-xs text-[#555555] mt-1">
          Configuración visual de la tienda, alertas de stock, divisa y parámetros generales.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 md:space-y-8">
        <div className="bg-[#EFECE7] border border-black/10 p-5 sm:p-6 space-y-4 shadow-sm">
          <h3 className="font-serif-display text-lg sm:text-xl text-[#1A1A1A] font-normal border-b border-black/10 pb-2">
            Efectos Visuales & Shader WebGL
          </h3>

          <div>
            <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-2">
              Opacidad del Fondo Fluido Liquid Gold ({Math.round(shaderOpacity * 100)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={shaderOpacity}
              onChange={(e) => setShaderOpacity(parseFloat(e.target.value))}
              className="w-full accent-[#1A1A1A]"
            />
            <p className="text-[11px] text-[#555555] mt-1">
              Ajusta la intensidad del fondo animado en WebGL de oro líquido.
            </p>
          </div>
        </div>

        <div className="bg-[#EFECE7] border border-black/10 p-5 sm:p-6 space-y-4 shadow-sm">
          <h3 className="font-serif-display text-lg sm:text-xl text-[#1A1A1A] font-normal border-b border-black/10 pb-2">
            Divisa & Parámetros Comerciales
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                Moneda Predeterminada
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              >
                <option value="COP">Peso Colombiano ($ COP)</option>
              </select>
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                Umbral de Alerta de Stock Bajo
              </label>
              <input
                type="number"
                defaultValue={5}
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN DEDICADA: MEDIOS DE PAGO Y TRANSFERENCIAS (NEQUI, DAVIPLATA, BRE-B, QR) */}
        <div className="bg-[#EFECE7] border border-black/10 p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="border-b border-black/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#D4AF37] text-2xl">
                account_balance_wallet
              </span>
              <h3 className="font-serif-display text-lg sm:text-xl text-[#1A1A1A] font-normal">
                Medios de Pago en Tienda (Nequi, Daviplata, Llave Bre-B & QR)
              </h3>
            </div>
            <p className="text-[11px] text-[#555555] mt-1">
              Estos datos bancarios y el código QR de Llave Breve se mostrarán a los clientes en la bolsa de compras en el paso <strong>"Confirmar y Pagar"</strong> para que puedan transferir directamente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                Número Nequi
              </label>
              <input
                type="text"
                value={nequiNumber}
                onChange={(e) => setNequiNumber?.(e.target.value)}
                placeholder="ej: 322 412 7814"
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none font-mono"
              />
              <span className="text-[10px] text-[#777777] mt-1 block">
                Visible para transferencias por Nequi.
              </span>
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                Número Daviplata
              </label>
              <input
                type="text"
                value={daviplataNumber}
                onChange={(e) => setDaviplataNumber?.(e.target.value)}
                placeholder="ej: 322 412 7814"
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none font-mono"
              />
              <span className="text-[10px] text-[#777777] mt-1 block">
                Visible para transferencias por Daviplata.
              </span>
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                Llave Bre-B / Llave Breve
              </label>
              <input
                type="text"
                value={breBKey}
                onChange={(e) => setBreBKey?.(e.target.value)}
                placeholder="ej: 3224127814 o identificador"
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none font-mono"
              />
              <span className="text-[10px] text-[#777777] mt-1 block">
                Llave para transferencias interbancarias Bre-B.
              </span>
            </div>
          </div>

          {/* Subida y actualización del Código QR de Llave Breve */}
          <div className="bg-[#F9F8F6] border border-black/10 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-2">
              <label className="font-label-caps text-[10px] text-[#1A1A1A] tracking-[1.5px] font-bold block flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#D4AF37]">qr_code_2</span>
                Código QR de Llave Breve / Bre-B (Para Escanear y Pagar)
              </label>

              <div className="flex items-center gap-1 bg-[#EFECE7] p-0.5 border border-black/10 text-[9px] font-label-caps">
                <button
                  type="button"
                  onClick={() => setQrUploadMode('upload')}
                  className={`px-2.5 py-1 ${
                    qrUploadMode === 'upload' ? 'bg-[#1A1A1A] text-[#F9F8F6]' : 'text-[#555]'
                  }`}
                >
                  Subir Archivo
                </button>
                <button
                  type="button"
                  onClick={() => setQrUploadMode('url')}
                  className={`px-2.5 py-1 ${
                    qrUploadMode === 'url' ? 'bg-[#1A1A1A] text-[#F9F8F6]' : 'text-[#555]'
                  }`}
                >
                  URL Externa
                </button>
              </div>
            </div>

            {qrUploadMode === 'upload' ? (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrFileUpload}
                  className="w-full text-xs text-[#1A1A1A] file:mr-3 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-label-caps file:font-bold file:tracking-[1px] file:bg-[#1A1A1A] file:text-[#F9F8F6] hover:file:bg-[#333] cursor-pointer"
                />
                <span className="text-[10px] text-[#777] mt-1 block">
                  Selecciona una captura o foto de tu código QR de Llave Breve o Nequi/Daviplata.
                </span>
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/tu-qr-llave-breve.jpg"
                  value={paymentQrImage}
                  onChange={(e) => setPaymentQrImage?.(e.target.value)}
                  className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none font-mono"
                />
              </div>
            )}

            {paymentQrImage && (
              <div className="flex items-center justify-between p-3 bg-white border border-black/10 mt-2">
                <div className="flex items-center gap-3">
                  <img
                    src={paymentQrImage}
                    alt="QR de Pago Llave Breve"
                    className="w-16 h-16 object-contain border border-black/10 bg-white p-1"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1A1A1A] block">
                      Código QR Configurado
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono">
                      ✓ Se mostrará en la pasarela a los clientes
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPaymentQrImage?.('')}
                  className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 font-label-caps tracking-[1px] border border-red-200 transition-colors"
                >
                  Quitar QR
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN PRINCIPAL: NOTIFICACIONES AUTOMÁTICAS POR TELEGRAM (100% SILENCIOSO & OFICIAL) */}
        <div className="bg-[#EFECE7] border border-black/10 p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0088cc] text-2xl">
                  send
                </span>
                <h3 className="font-serif-display text-lg sm:text-xl text-[#1A1A1A] font-normal">
                  Notificaciones Automáticas por Telegram
                </h3>
              </div>
              <p className="text-[11px] text-[#555555] mt-1">
                Recibe al instante en tu celular una alerta silenciosa cada vez que un cliente compre. Incluye el detalle de prendas, dirección y un enlace directo para abrir el chat de WhatsApp del cliente con un solo toque.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer self-start sm:self-center bg-[#F9F8F6] px-3 py-1.5 border border-black/10">
              <input
                type="checkbox"
                checked={autoNotifyTelegram}
                onChange={(e) => setAutoNotifyTelegram?.(e.target.checked)}
                className="accent-[#1A1A1A] w-4 h-4 cursor-pointer"
              />
              <span className="font-label-caps text-[10px] tracking-[1.5px] uppercase font-bold text-[#1A1A1A]">
                Activar Alertas Telegram
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                Bot Token de Telegram (de @BotFather)
              </label>
              <input
                type="text"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken?.(e.target.value)}
                placeholder="ej: 7924856123:AAFOk9... (Token HTTP API)"
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none font-mono"
              />
              <span className="text-[10px] text-[#777777] mt-1 block">
                Token que te entrega el bot oficial <strong>@BotFather</strong>.
              </span>
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                Tu Chat ID de Telegram (de @userinfobot)
              </label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId?.(e.target.value)}
                placeholder="ej: 987654321 (solo números)"
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none font-mono"
              />
              <span className="text-[10px] text-[#777777] mt-1 block">
                Tu identificador personal obtenido en <strong>@userinfobot</strong>.
              </span>
            </div>
          </div>

          {/* Botón de Prueba Telegram y Feedback */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-black/10">
            <button
              type="button"
              disabled={telegramTestStatus.loading}
              onClick={handleTestTelegramNotification}
              className="px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#333333] text-white font-label-caps text-xs font-bold uppercase tracking-[1.5px] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">send</span>
              {telegramTestStatus.loading ? 'Enviando...' : 'Probar Notificación en Telegram'}
            </button>

            {telegramTestStatus.message && (
              <span
                className={`text-xs p-2 border font-sans-body max-w-md ${
                  telegramTestStatus.isError
                    ? 'bg-red-50 text-red-800 border-red-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
              >
                {telegramTestStatus.message}
              </span>
            )}
          </div>
        </div>

        {/* SECCIÓN DEDICADA: NOTIFICACIONES AUTOMÁTICAS POR WHATSAPP AL ADMINISTRADOR */}
        <div className="bg-[#EFECE7] border border-black/10 p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#25D366] text-xl">
                  notifications_active
                </span>
                <h3 className="font-serif-display text-lg sm:text-xl text-[#1A1A1A] font-normal">
                  Notificaciones Automáticas por WhatsApp
                </h3>
              </div>
              <p className="text-[11px] text-[#555555] mt-0.5">
                Envía silenciosamente a tu celular una alerta con todos los datos del pedido y del cliente apenas se registre una compra.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer self-start sm:self-center bg-[#F9F8F6] px-3 py-1.5 border border-black/10">
              <input
                type="checkbox"
                checked={autoNotifyAdmin}
                onChange={(e) => setAutoNotifyAdmin?.(e.target.checked)}
                className="accent-[#1A1A1A] w-4 h-4 cursor-pointer"
              />
              <span className="font-label-caps text-[10px] tracking-[1.5px] uppercase font-bold text-[#1A1A1A]">
                Activar Alertas
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                WhatsApp del Administrador (con código de país)
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="ej: 573224127814"
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none font-mono"
              />
              <span className="text-[10px] text-[#777777] mt-1 block">
                Número donde recibirás los pedidos (ej. <strong>+57 322 4127814</strong>).
              </span>
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                API Key de CallMeBot (WhatsApp Bot Gratis)
              </label>
              <input
                type="text"
                value={whatsappApiKey}
                onChange={(e) => setWhatsappApiKey?.(e.target.value)}
                placeholder="ej: 123456"
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none font-mono"
              />
              <span className="text-[10px] text-[#777777] mt-1 block">
                Código para que el bot te envíe WhatsApps automáticamente.
              </span>
            </div>
          </div>

          {/* Opción avanzada de Webhook */}
          <div>
            <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
              URL de Webhook Personalizado (Opcional - Make, n8n, Zapier o UltraMsg)
            </label>
            <input
              type="url"
              value={whatsappWebhookUrl}
              onChange={(e) => setWhatsappWebhookUrl?.(e.target.value)}
              placeholder="https://hook.eu1.make.com/tu-token-aqui"
              className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none font-mono"
            />
            <span className="text-[10px] text-[#777777] mt-1 block">
              Si usas Make.com o n8n para enviar mensajes con tu WhatsApp Web conectado, pega tu Webhook aquí.
            </span>
          </div>

          {/* Botón de Prueba y Feedback */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-black/10">
            <button
              type="button"
              disabled={testStatus.loading}
              onClick={handleTestWhatsAppNotification}
              className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-label-caps text-xs font-bold uppercase tracking-[1.5px] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">send</span>
              {testStatus.loading ? 'Enviando...' : 'Probar Notificación en mi WhatsApp'}
            </button>

            {testStatus.message && (
              <span
                className={`text-xs p-2 border font-sans-body max-w-md ${
                  testStatus.isError
                    ? 'bg-red-50 text-red-800 border-red-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
              >
                {testStatus.message}
              </span>
            )}
          </div>
        </div>

        <div className="bg-[#EFECE7] border border-black/10 p-5 sm:p-6 space-y-4 shadow-sm">
          <h3 className="font-serif-display text-lg sm:text-xl text-[#1A1A1A] font-normal border-b border-black/10 pb-2">
            Anuncio Superior en Tienda
          </h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                Texto de Anuncio Principal
              </label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#EFECE7] border border-black/10 p-5 sm:p-6 space-y-4 shadow-sm">
          <h3 className="font-serif-display text-lg sm:text-xl text-[#1A1A1A] font-normal border-b border-black/10 pb-2">
            Base de Datos & Almacenamiento
          </h3>

          <div className="flex items-start sm:items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 sm:mt-0 ${
                isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
            <div>
              <p className="text-xs font-bold text-[#1A1A1A]">
                {isSupabaseConfigured
                  ? 'Conectado a Supabase PostgreSQL Cloud'
                  : 'Almacenamiento Local (LocalStorage Activo)'}
              </p>
              <p className="text-[11px] text-[#666] leading-relaxed">
                {isSupabaseConfigured
                  ? 'Todos los productos, usuarios, órdenes y configuraciones se sincronizan en tiempo real con tu base de datos remota en Supabase.'
                  : 'Tus productos, inventario, pedidos y carrito se guardan de forma segura y permanente en este navegador.'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-black/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span className="text-xs text-[#666]">
              Estado actual en Supabase: <strong>{productsCount} productos</strong> y{' '}
              <strong>{ordersCount} pedidos</strong> registrados.
            </span>
            <button
              type="button"
              onClick={onSyncDatabase}
              className="w-full sm:w-auto px-4 py-2.5 border border-black/20 bg-[#F9F8F6] text-[#1A1A1A] text-xs font-label-caps hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors text-center flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              Sincronizar Ahora con Supabase
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto bg-[#1A1A1A] text-[#F9F8F6] font-label-caps text-xs px-8 py-3.5 font-bold uppercase tracking-[3px] hover:bg-[#333333] transition-colors text-center"
          >
            Guardar Cambios
          </button>
          {savedMessage && (
            <span className="text-xs text-emerald-800 font-mono font-bold animate-fade-up text-center sm:text-right">
              ✓ Configuración guardada y sincronizada en Supabase
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
