import { Order } from '../types';
import { formatCOP } from './currency';
import { formatPhoneForWhatsApp } from './whatsappNotification';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled?: boolean;
}

/**
 * Genera el mensaje formateado en HTML para la API oficial de Telegram
 */
export const generateTelegramOrderMessage = (order: Order): string => {
  const clientPhoneClean = formatPhoneForWhatsApp(order.phone || '');
  const clientWhatsAppUrl = clientPhoneClean
    ? `https://wa.me/${clientPhoneClean}`
    : '';

  const itemsList = (order.items || [])
    .map(
      (item, idx) =>
        `  ${idx + 1}. <b>${escapeHtml(item.name)}</b>\n     Talla: ${escapeHtml(
          item.size || 'Única'
        )} | Cant: ${item.quantity} | Total: ${formatCOP(item.price * item.quantity)}`
    )
    .join('\n');

  return (
    `🚨 <b>¡NUEVO PEDIDO EN AMERICAN CLOTHES!</b>\n\n` +
    `📋 <b>Orden:</b> <code>${escapeHtml(order.id)}</code>\n` +
    `📅 <b>Fecha:</b> ${escapeHtml(order.date || new Date().toISOString().substring(0, 16))}\n` +
    `💰 <b>Total a Cobrar:</b> <b>${formatCOP(order.total)}</b>\n` +
    `⏳ <b>Estado:</b> PROCESANDO (Stock reservado por 24h)\n\n` +
    `👤 <b>DATOS DEL CLIENTE:</b>\n` +
    `• <b>Nombre:</b> ${escapeHtml(order.customerName)}\n` +
    `• <b>Teléfono:</b> ${escapeHtml(order.phone || 'No especificado')}\n` +
    (clientWhatsAppUrl
      ? `• <b>WhatsApp del Cliente:</b> <a href="${clientWhatsAppUrl}">👉 Tocar aquí para chatear por WhatsApp</a>\n`
      : '') +
    `• <b>Correo:</b> ${escapeHtml(order.email)}\n` +
    `• <b>Dirección:</b> ${escapeHtml(order.shippingAddress || 'No especificada')}\n\n` +
    `🛍️ <b>PRENDAS SOLICITADAS:</b>\n` +
    `${itemsList || 'Sin artículos'}\n\n` +
    `👉 <i>Entra al panel administrativo de American Clothes para confirmar o gestionar el envío.</i>`
  );
};

const escapeHtml = (text: string): string => {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Envía un mensaje directo a través de la API oficial de Telegram
 */
export const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  htmlText: string
): Promise<{ success: boolean; message: string }> => {
  const cleanToken = (botToken || '').trim();
  const cleanChatId = (chatId || '').trim();

  if (!cleanToken) {
    return { success: false, message: 'Bot Token de Telegram no configurado.' };
  }
  if (!cleanChatId) {
    return { success: false, message: 'Chat ID de Telegram no configurado.' };
  }

  const endpoint = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      return { success: true, message: '¡Mensaje enviado con éxito a Telegram!' };
    }

    return {
      success: false,
      message: `Telegram rechazó la petición: ${data.description || 'Error desconocido'}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error de red al conectar con Telegram: ${err?.message || 'Fallo de conexión'}`,
    };
  }
};

/**
 * Disparador unificado que envía la alerta de nuevo pedido a Telegram
 */
export const notifyTelegramNewOrder = async (
  order: Order,
  config: TelegramConfig
): Promise<void> => {
  if (config.enabled === false) return;
  if (!config.botToken || !config.chatId) return;

  const htmlMsg = generateTelegramOrderMessage(order);
  sendTelegramMessage(config.botToken, config.chatId, htmlMsg).catch((err) =>
    console.warn('Error en notificación de Telegram:', err)
  );
};
