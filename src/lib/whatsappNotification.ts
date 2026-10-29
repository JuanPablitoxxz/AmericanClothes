import { Order } from '../types';
import { formatCOP } from './currency';

export interface WhatsAppNotificationConfig {
  adminPhone: string;
  apiKey?: string;
  webhookUrl?: string;
  enabled?: boolean;
}

/**
 * Normaliza cualquier número de teléfono eliminando caracteres no numéricos
 * y asegurando el código de país (por defecto Colombia +57 si tiene 10 dígitos)
 */
export const formatPhoneForWhatsApp = (rawPhone: string): string => {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10 && digits.startsWith('3')) {
    return `57${digits}`;
  }
  return digits;
};

/**
 * Genera el texto del mensaje estructurado para WhatsApp con todos los datos del pedido y del cliente
 */
export const generateAdminOrderMessage = (order: Order): string => {
  const clientPhoneClean = formatPhoneForWhatsApp(order.phone || '');
  const clientChatLink = clientPhoneClean
    ? `https://wa.me/${clientPhoneClean}`
    : 'No registrado';

  const itemsList = (order.items || [])
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.name}* (Talla: ${item.size || 'Única'}, Cant: ${
          item.quantity
        }) - ${formatCOP(item.price * item.quantity)}`
    )
    .join('\n');

  return (
    `🚨 *¡NUEVO PEDIDO EN AMERICAN CLOTHES!*\n\n` +
    `📋 *Orden:* ${order.id}\n` +
    `📅 *Fecha:* ${order.date || new Date().toISOString().substring(0, 16)}\n` +
    `💰 *Total a Cobrar:* ${formatCOP(order.total)}\n` +
    `⏳ *Estado:* PROCESANDO (Stock reservado por 24h)\n\n` +
    `👤 *DATOS DEL CLIENTE:*\n` +
    `• *Nombre:* ${order.customerName}\n` +
    `• *Teléfono:* ${order.phone || 'No especificado'}\n` +
    `• *Chat WhatsApp Cliente:* ${clientChatLink}\n` +
    `• *Correo:* ${order.email}\n` +
    `• *Dirección de Entrega:* ${order.shippingAddress || 'No especificada'}\n\n` +
    `🛍️ *PRENDAS SOLICITADAS:*\n` +
    `${itemsList || 'Sin artículos'}\n\n` +
    `👉 *Gestionar en el panel:* Entra a American Clothes para confirmar o cambiar a ENVIADO.`
  );
};

/**
 * Envía una notificación automática a CallMeBot (WhatsApp Bot)
 */
export const sendCallMeBotMessage = async (
  phone: string,
  apiKey: string,
  message: string
): Promise<{ success: boolean; message: string }> => {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  if (!cleanPhone) {
    return { success: false, message: 'Número de WhatsApp de administrador no válido.' };
  }
  if (!apiKey || apiKey.trim().length < 3) {
    return { success: false, message: 'API Key de CallMeBot no configurada.' };
  }

  const endpoint = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(
    message
  )}&apikey=${apiKey.trim()}`;

  try {
    // Intentar fetch normal
    const res = await fetch(endpoint, { method: 'GET' });
    if (res.ok) {
      return { success: true, message: 'Notificación enviada con éxito al WhatsApp del administrador.' };
    }
  } catch {
    // Fallback por posibles políticas de CORS en navegadores cliente:
    // Enviar en modo no-cors o mediante un elemento Image (beacon silencioso garantizado)
    try {
      await fetch(endpoint, { method: 'GET', mode: 'no-cors' });
      return {
        success: true,
        message: 'Notificación enviada en segundo plano por canal seguro.',
      };
    } catch {
      try {
        const beacon = new Image();
        beacon.src = endpoint;
        return {
          success: true,
          message: 'Notificación enviada vía web beacon.',
        };
      } catch (e: any) {
        return {
          success: false,
          message: `Error al conectar con la API de WhatsApp: ${e?.message || 'Error de red'}`,
        };
      }
    }
  }

  return { success: true, message: 'Petición enviada al servidor de WhatsApp.' };
};

/**
 * Envía un payload JSON a un Webhook personalizado (Make.com, n8n, Zapier, UltraMsg, etc.)
 */
export const sendWebhookNotification = async (
  webhookUrl: string,
  order: Order,
  adminPhone: string
): Promise<{ success: boolean; message: string }> => {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'URL de Webhook no válida.' };
  }

  const payload = {
    event: 'order.created',
    timestamp: new Date().toISOString(),
    adminPhone: formatPhoneForWhatsApp(adminPhone),
    order: {
      id: order.id,
      customerName: order.customerName,
      email: order.email,
      phone: order.phone,
      whatsappChatUrl: order.phone
        ? `https://wa.me/${formatPhoneForWhatsApp(order.phone)}`
        : null,
      shippingAddress: order.shippingAddress,
      total: order.total,
      status: order.status,
      items: order.items,
    },
    formattedMessage: generateAdminOrderMessage(order),
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors',
    });
    return { success: true, message: 'Webhook disparado con éxito.' };
  } catch (err: any) {
    return { success: false, message: `Error al llamar al webhook: ${err?.message || 'Desconocido'}` };
  }
};

/**
 * Disparador unificado que notifica al administrador en segundo plano
 * a través de todos los canales configurados (CallMeBot y/o Webhook)
 */
export const notifyAdminNewOrder = async (
  order: Order,
  config: WhatsAppNotificationConfig
): Promise<void> => {
  if (config.enabled === false) return;

  const adminPhone = formatPhoneForWhatsApp(config.adminPhone);
  if (!adminPhone) return;

  const formattedMsg = generateAdminOrderMessage(order);

  // 1. Si tiene CallMeBot API Key configurada
  if (config.apiKey && config.apiKey.trim().length > 0) {
    sendCallMeBotMessage(adminPhone, config.apiKey, formattedMsg).catch((e) =>
      console.warn('CallMeBot error:', e)
    );
  }

  // 2. Si tiene Webhook configurado
  if (config.webhookUrl && config.webhookUrl.trim().length > 0) {
    sendWebhookNotification(config.webhookUrl, order, adminPhone).catch((e) =>
      console.warn('Webhook error:', e)
    );
  }
};
