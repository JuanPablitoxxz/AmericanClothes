import { Order, OrderItem, OrderStatus, Product } from '../types';
import { supabase } from './supabase';
import { detectSqlInjection, detectXss, sanitizeText } from './security';

const assertSafeString = (val: string | undefined | null, label: string): string => {
  if (!val) return '';
  if (detectSqlInjection(val)) {
    throw new Error(`Operación bloqueada por seguridad Anti-SQL Injection en: ${label}`);
  }
  if (detectXss(val)) {
    throw new Error(`Operación bloqueada por seguridad Anti-XSS en: ${label}`);
  }
  return sanitizeText(val, 2000);
};


type ProductRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: Product['category'];
  status: Product['status'];
  image: string;
  description: string;
  sizes: string[] | null;
  featured: boolean | null;
};

type OrderItemRow = {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
  image: string;
};

type OrderRow = {
  id: string;
  customer_name: string;
  email: string;
  total: number;
  status: OrderStatus;
  shipping_address: string | null;
  created_at: string;
  order_items?: OrderItemRow[];
};

const isValidUuid = (val?: string): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

export const LOW_STOCK_THRESHOLD = 3;
export const RESERVATION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

export const computeProductStatusFromStock = (
  stock: number,
  currentStatus?: Product['status']
): Product['status'] => {
  if (currentStatus === 'PAUSADO') return 'PAUSADO';
  return stock <= LOW_STOCK_THRESHOLD ? 'STOCK BAJO' : 'ACTIVO';
};

const toProduct = (row: ProductRow): Product => {
  const safeStock = Math.max(0, Number(row.stock) || 0);
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    price: row.price,
    stock: safeStock,
    category: row.category,
    status: computeProductStatusFromStock(safeStock, row.status),
    image: row.image,
    description: row.description,
    sizes: Array.isArray(row.sizes) ? row.sizes : ['Única'],
    featured: Boolean(row.featured),
  };
};

const fromProduct = (product: Omit<Product, 'id'> & { id?: string }) => {
  const safeStock = Math.max(0, Number(product.stock) || 0);
  return {
    name: assertSafeString(product.name, 'Nombre del producto'),
    sku: assertSafeString(product.sku, 'SKU'),
    price: Math.max(0, Number(product.price) || 0),
    stock: safeStock,
    category: product.category,
    status: computeProductStatusFromStock(safeStock, product.status),
    image: product.image,
    description: assertSafeString(product.description, 'Descripción del producto'),
    sizes: Array.isArray(product.sizes)
      ? product.sizes.map((s) => assertSafeString(s, 'Talla'))
      : ['Única'],
    featured: Boolean(product.featured),
  };
};

const toOrderItem = (row: OrderItemRow): OrderItem => ({
  productId: row.product_id,
  name: row.name,
  price: row.price,
  quantity: row.quantity,
  size: row.size ?? undefined,
  image: row.image,
});

export const getOrderReservationStatus = (order: Order): {
  isReserved: boolean;
  isExpired: boolean;
  remainingMs: number;
  hoursLeft: number;
  minutesLeft: number;
  label: string;
} => {
  if (order.status !== 'PROCESANDO') {
    return {
      isReserved: false,
      isExpired: false,
      remainingMs: 0,
      hoursLeft: 0,
      minutesLeft: 0,
      label:
        order.status === 'ENVIADO' || order.status === 'ENTREGADO'
          ? 'Stock descontado permanentemente'
          : 'Reserva liberada (Stock devuelto)',
    };
  }

  const createdTime = new Date(order.createdAtIso || order.date).getTime();
  if (Number.isNaN(createdTime)) {
    return {
      isReserved: true,
      isExpired: false,
      remainingMs: RESERVATION_DURATION_MS,
      hoursLeft: 24,
      minutesLeft: 0,
      label: 'Reserva activa (24h máx.)',
    };
  }

  const elapsed = Date.now() - createdTime;
  const remainingMs = Math.max(0, RESERVATION_DURATION_MS - elapsed);
  const isExpired = elapsed >= RESERVATION_DURATION_MS;
  const hoursLeft = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    isReserved: !isExpired,
    isExpired,
    remainingMs,
    hoursLeft,
    minutesLeft,
    label: isExpired
      ? 'Plazo de 24h vencido (Liberando stock...)'
      : `Reserva 24h activa: quedan ${hoursLeft}h ${minutesLeft}m`,
  };
};

const formatOrderDate = (createdAt: string) =>
  new Date(createdAt).toISOString().replace('T', ' ').substring(0, 16);

const toOrder = (row: OrderRow): Order => ({
  id: row.id,
  customerName: row.customer_name,
  email: row.email,
  timeAgo: 'Registrado en Supabase',
  date: formatOrderDate(row.created_at),
  createdAtIso: row.created_at,
  total: row.total,
  status: row.status,
  shippingAddress: row.shipping_address ?? undefined,
  items: (row.order_items ?? []).map(toOrderItem),
});

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase no está configurado.');
  }
  return supabase;
};

export const fetchProducts = async (): Promise<Product[]> => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('products')
    .select('*')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al consultar productos de Supabase:', error);
    throw error;
  }
  return (data ?? []).map((row) => toProduct(row as ProductRow));
};

export const seedProductsIfEmpty = async (_products?: Product[]): Promise<Product[]> => {
  // Ya no inyecta productos de prueba; devuelve únicamente los productos reales de Supabase
  return fetchProducts();
};

export const fetchOrders = async (): Promise<Order[]> => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('orders')
    .select('*, order_items(*)')
    .not('id', 'like', '__SYS_%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al consultar órdenes de Supabase:', error);
    throw error;
  }
  return (data ?? []).map((row) => toOrder(row as OrderRow));
};

export const saveProduct = async (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
  const client = requireSupabase();

  if (product.id) {
    const isUuid = isValidUuid(product.id);
    let query = client.from('products').update(fromProduct(product));

    if (isUuid) {
      query = query.eq('id', product.id);
    } else if (product.sku) {
      query = query.eq('sku', product.sku);
    } else {
      query = query.eq('id', product.id);
    }

    const { data, error } = await query.select('*').single();
    if (error) {
      console.error('Error al actualizar producto en Supabase:', error);
      throw error;
    }
    return toProduct(data as ProductRow);
  }

  const { data, error } = await client
    .from('products')
    .insert(fromProduct(product))
    .select('*')
    .single();

  if (error) {
    console.error('Error al crear producto en Supabase:', error);
    throw error;
  }
  return toProduct(data as ProductRow);
};

export const deleteProduct = async (productId: string, sku?: string): Promise<void> => {
  const client = requireSupabase();
  const isUuid = isValidUuid(productId);
  let query = client.from('products').delete();

  if (isUuid) {
    query = query.eq('id', productId);
  } else if (sku) {
    query = query.eq('sku', sku);
  } else {
    query = query.eq('id', productId);
  }

  const { error } = await query;
  if (error) {
    console.error('Error al eliminar producto en Supabase:', error);
    throw error;
  }
};

export const updateProductStatus = async (
  productId: string,
  status: Product['status'],
  sku?: string
): Promise<Product> => {
  const client = requireSupabase();
  const isUuid = isValidUuid(productId);
  let query = client.from('products').update({ status });

  if (isUuid) {
    query = query.eq('id', productId);
  } else if (sku) {
    query = query.eq('sku', sku);
  } else {
    query = query.eq('id', productId);
  }

  const { data, error } = await query.select('*').single();
  if (error) {
    console.error('Error al actualizar estado en Supabase:', error);
    throw error;
  }
  return toProduct(data as ProductRow);
};

export const updateProductStock = async (
  productId: string,
  stock: number,
  status: Product['status'],
  sku?: string
): Promise<Product> => {
  const client = requireSupabase();
  const isUuid = isValidUuid(productId);
  let query = client.from('products').update({ stock, status });

  if (isUuid) {
    query = query.eq('id', productId);
  } else if (sku) {
    query = query.eq('sku', sku);
  } else {
    query = query.eq('id', productId);
  }

  const { data, error } = await query.select('*').single();
  if (error) {
    console.error('Error al actualizar stock en Supabase:', error);
    throw error;
  }
  return toProduct(data as ProductRow);
};

export const createOrder = async (order: Order): Promise<void> => {
  const client = requireSupabase();

  const safeName = assertSafeString(order.customerName, 'Nombre del cliente');
  const safeEmail = assertSafeString(order.email, 'Correo del cliente');
  const safeAddress = order.shippingAddress
    ? assertSafeString(order.shippingAddress, 'Dirección de envío')
    : '';
  const safePhone = order.phone ? assertSafeString(order.phone, 'Teléfono') : '';

  const formattedAddress = safePhone
    ? `${safeAddress} | Tel: ${safePhone}`.trim()
    : safeAddress || null;

  const { error: orderError } = await client.from('orders').insert({
    id: assertSafeString(order.id, 'ID de orden'),
    customer_name: safeName,
    email: safeEmail,
    total: Math.max(0, Number(order.total) || 0),
    status: order.status,
    shipping_address: formattedAddress,
  });

  if (orderError) {
    console.error('Error al registrar pedido en Supabase:', orderError);
    throw orderError;
  }

  if (order.items && order.items.length > 0) {
    const { error: itemsError } = await client.from('order_items').insert(
      order.items.map((item) => ({
        order_id: assertSafeString(order.id, 'ID de orden'),
        product_id: assertSafeString(item.productId, 'ID de producto'),
        name: assertSafeString(item.name, 'Nombre del artículo'),
        price: Math.max(0, Number(item.price) || 0),
        quantity: Math.max(1, Number(item.quantity) || 1),
        size: item.size ? assertSafeString(item.size, 'Talla') : null,
        image: item.image,
      }))
    );

    if (itemsError) {
      console.error('Error al registrar artículos del pedido en Supabase:', itemsError);
      throw itemsError;
    }
  }
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order> => {
  const client = requireSupabase();
  const safeOrderId = assertSafeString(orderId, 'ID de orden');
  const { data, error } = await client
    .from('orders')
    .update({ status })
    .eq('id', safeOrderId)
    .select('*, order_items(*)')
    .single();

  if (error) {
    console.error('Error al actualizar estado del pedido en Supabase:', error);
    throw error;
  }
  return toOrder(data as OrderRow);
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  const client = requireSupabase();
  const safeOrderId = assertSafeString(orderId, 'ID de orden');

  await client.from('order_items').delete().eq('order_id', safeOrderId);
  const { error } = await client.from('orders').delete().eq('id', safeOrderId);

  if (error) {
    console.error('Error al eliminar pedido en Supabase:', error);
    throw error;
  }
};

export interface StoreSettings {
  shaderOpacity: number;
  currency: string;
  announcementText: string;
  whatsappNumber: string;
  whatsappApiKey?: string;
  whatsappWebhookUrl?: string;
  autoNotifyAdmin?: boolean;
}

const SETTINGS_RECORD_ID = '__SYS_SETTINGS__';

export const fetchCloudSettings = async (): Promise<StoreSettings | null> => {
  const client = requireSupabase();

  // Revisar si hay configuración extendida en el registro seguro en Supabase
  let fallbackJson: Partial<StoreSettings> | null = null;
  try {
    const { data: orderData } = await client
      .from('orders')
      .select('shipping_address')
      .eq('id', SETTINGS_RECORD_ID)
      .maybeSingle();

    if (orderData?.shipping_address) {
      fallbackJson = JSON.parse(orderData.shipping_address);
    }
  } catch {}

  // Intentar tabla dedicada store_settings si existe
  const { data: tableData, error: tableErr } = await client
    .from('store_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();

  if (!tableErr && tableData) {
    return {
      shaderOpacity: Number(tableData.shader_opacity ?? fallbackJson?.shaderOpacity ?? 0.3),
      currency: String(tableData.currency ?? fallbackJson?.currency ?? 'COP'),
      announcementText: String(
        tableData.announcement_text ??
          fallbackJson?.announcementText ??
          'Envíos gratis a Colombia por compras superiores a $350.000 COP'
      ),
      whatsappNumber: String(tableData.whatsapp_number ?? fallbackJson?.whatsappNumber ?? '573001234567'),
      whatsappApiKey: (tableData as any).whatsapp_api_key || fallbackJson?.whatsappApiKey || '',
      whatsappWebhookUrl: (tableData as any).whatsapp_webhook_url || fallbackJson?.whatsappWebhookUrl || '',
      autoNotifyAdmin:
        (tableData as any).auto_notify_admin !== undefined
          ? Boolean((tableData as any).auto_notify_admin)
          : fallbackJson?.autoNotifyAdmin ?? true,
    };
  }

  if (fallbackJson) {
    return {
      shaderOpacity: Number(fallbackJson.shaderOpacity ?? 0.3),
      currency: String(fallbackJson.currency ?? 'COP'),
      announcementText: String(
        fallbackJson.announcementText ??
          'Envíos gratis a Colombia por compras superiores a $350.000 COP'
      ),
      whatsappNumber: String(fallbackJson.whatsappNumber ?? '573001234567'),
      whatsappApiKey: String(fallbackJson.whatsappApiKey ?? ''),
      whatsappWebhookUrl: String(fallbackJson.whatsappWebhookUrl ?? ''),
      autoNotifyAdmin: fallbackJson.autoNotifyAdmin ?? true,
    };
  }

  return null;
};

export const saveCloudSettings = async (settings: StoreSettings): Promise<void> => {
  const client = requireSupabase();
  const safeSettings: StoreSettings = {
    shaderOpacity: Math.min(1, Math.max(0, Number(settings.shaderOpacity) || 0.3)),
    currency: assertSafeString(settings.currency, 'Moneda') || 'COP',
    announcementText: assertSafeString(settings.announcementText, 'Texto de anuncio'),
    whatsappNumber: assertSafeString(settings.whatsappNumber, 'WhatsApp'),
    whatsappApiKey: assertSafeString(settings.whatsappApiKey || '', 'WhatsApp API Key'),
    whatsappWebhookUrl: assertSafeString(settings.whatsappWebhookUrl || '', 'WhatsApp Webhook'),
    autoNotifyAdmin: settings.autoNotifyAdmin ?? true,
  };

  // 1. Guardar en store_settings
  try {
    await client.from('store_settings').upsert({
      id: 'default',
      shader_opacity: safeSettings.shaderOpacity,
      currency: safeSettings.currency,
      announcement_text: safeSettings.announcementText,
      whatsapp_number: safeSettings.whatsappNumber,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Error al guardar en store_settings:', err);
  }

  // 2. Persistir siempre en el registro seguro en Supabase con todas las propiedades extendidas
  try {
    await client.from('orders').upsert({
      id: SETTINGS_RECORD_ID,
      customer_name: 'SYSTEM_CONFIG',
      email: 'system@americanclothes.com',
      total: 0,
      status: 'ENTREGADO',
      shipping_address: JSON.stringify(safeSettings),
    });
  } catch (err) {
    console.warn('Error al guardar fallback de configuración:', err);
  }
};

