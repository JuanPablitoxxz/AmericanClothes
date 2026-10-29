import React, { useState } from 'react';
import { saveCloudSettings } from '../../lib/storeData';
import { formatPhoneForWhatsApp, sendCallMeBotMessage, sendWebhookNotification } from '../../lib/whatsappNotification';
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
  isSupabaseConfigured,
  productsCount,
  ordersCount,
  onSyncDatabase,
}) => {
  const [savedMessage, setSavedMessage] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    message: string | null;
    isError: boolean;
  }>({
    loading: false,
    message: null,
    isError: false,
  });

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
        });
      } catch (err) {
        console.error('Error al guardar ajustes en Supabase:', err);
      }
    }
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
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

          {/* Guía rápida para obtener la API Key en 30 segundos */}
          <div className="bg-[#F9F8F6] border border-[#25D366]/40 p-3.5 space-y-2 text-xs">
            <p className="font-bold text-[#1A1A1A] flex items-center gap-1.5 font-label-caps text-[10px] tracking-[1px]">
              <span className="material-symbols-outlined text-sm text-[#25D366]">help</span>
              ¿Cómo activar el Bot de WhatsApp en 30 segundos? (100% Gratis)
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#555555] leading-relaxed">
              <li>
                Desde tu WhatsApp (el celular registrado arriba), envía este mensaje: <code className="bg-[#EFECE7] px-1.5 py-0.5 font-mono text-[#1A1A1A] font-bold">I allow callmebot to send me messages</code> al número <a href="https://wa.me/34644519523?text=I%20allow%20callmebot%20to%20send%20me%20messages" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold underline">+34 644 51 95 23</a> (o haz clic en el enlace para abrirlo directo).
              </li>
              <li>
                El bot te responderá en pocos segundos con tu <strong>apikey</strong> (un número de 6 o 7 dígitos).
              </li>
              <li>
                Pega ese número en la casilla <strong>API Key de CallMeBot</strong> y haz clic en <strong>Guardar Cambios</strong>. ¡Listo! A partir de ese momento cada compra te llegará sola a tu WhatsApp.
              </li>
            </ol>
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
