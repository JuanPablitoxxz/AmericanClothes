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

const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  sku: row.sku,
  price: row.price,
  stock: row.stock,
  category: row.category,
  status: row.status,
  image: row.image,
  description: row.description,
  sizes: Array.isArray(row.sizes) ? row.sizes : ['Única'],
  featured: Boolean(row.featured),
});

const fromProduct = (product: Omit<Product, 'id'> & { id?: string }) => ({
  name: assertSafeString(product.name, 'Nombre del producto'),
  sku: assertSafeString(product.sku, 'SKU'),
  price: Math.max(0, Number(product.price) || 0),
  stock: Math.max(0, Number(product.stock) || 0),
  category: product.category,
  status: product.status,
  image: product.image,
  description: assertSafeString(product.description, 'Descripción del producto'),
  sizes: Array.isArray(product.sizes) ? product.sizes.map((s) => assertSafeString(s, 'Talla')) : ['Única'],
  featured: Boolean(product.featured),
});

const toOrderItem = (row: OrderItemRow): OrderItem => ({
  productId: row.product_id,
  name: row.name,
  price: row.price,
  quantity: row.quantity,
  size: row.size ?? undefined,
  image: row.image,
});

const formatOrderDate = (createdAt: string) =>
  new Date(createdAt).toISOString().replace('T', ' ').substring(0, 16);

const toOrder = (row: OrderRow): Order => ({
  id: row.id,
  customerName: row.customer_name,
  email: row.email,
  timeAgo: 'Registrado en Supabase',
  date: formatOrderDate(row.created_at),
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
}

const SETTINGS_RECORD_ID = '__SYS_SETTINGS__';

export const fetchCloudSettings = async (): Promise<StoreSettings | null> => {
  const client = requireSupabase();

  // Intentar primero tabla dedicada store_settings si existe
  const { data: tableData, error: tableErr } = await client
    .from('store_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();

  if (!tableErr && tableData) {
    return {
      shaderOpacity: Number(tableData.shader_opacity ?? 0.3),
      currency: String(tableData.currency ?? 'COP'),
      announcementText: String(
        tableData.announcement_text ??
          'Envíos gratis a Colombia por compras superiores a $350.000 COP'
      ),
      whatsappNumber: String(tableData.whatsapp_number ?? '573001234567'),
    };
  }

  // Respaldo 100% en Supabase PostgreSQL
  const { data, error } = await client
    .from('orders')
    .select('shipping_address')
    .eq('id', SETTINGS_RECORD_ID)
    .maybeSingle();

  if (error || !data?.shipping_address) {
    return null;
  }

  try {
    const parsed = JSON.parse(data.shipping_address);
    return {
      shaderOpacity: Number(parsed.shaderOpacity ?? 0.3),
      currency: String(parsed.currency ?? 'COP'),
      announcementText: String(
        parsed.announcementText ??
          'Envíos gratis a Colombia por compras superiores a $350.000 COP'
      ),
      whatsappNumber: String(parsed.whatsappNumber ?? '573001234567'),
    };
  } catch {
    return null;
  }
};

export const saveCloudSettings = async (settings: StoreSettings): Promise<void> => {
  const client = requireSupabase();
  const safeSettings: StoreSettings = {
    shaderOpacity: Math.min(1, Math.max(0, Number(settings.shaderOpacity) || 0.3)),
    currency: assertSafeString(settings.currency, 'Moneda') || 'COP',
    announcementText: assertSafeString(settings.announcementText, 'Texto de anuncio'),
    whatsappNumber: assertSafeString(settings.whatsappNumber, 'WhatsApp'),
  };

  // Intentar guardar en store_settings si existe
  const { error: tableErr } = await client.from('store_settings').upsert({
    id: 'default',
    shader_opacity: safeSettings.shaderOpacity,
    currency: safeSettings.currency,
    announcement_text: safeSettings.announcementText,
    whatsapp_number: safeSettings.whatsappNumber,
    updated_at: new Date().toISOString(),
  });

  if (!tableErr) return;

  // Persistir en Supabase PostgreSQL
  await client.from('orders').upsert({
    id: SETTINGS_RECORD_ID,
    customer_name: 'SYSTEM_CONFIG',
    email: 'system@americanclothes.com',
    total: 0,
    status: 'ENTREGADO',
    shipping_address: JSON.stringify(safeSettings),
  });
};

