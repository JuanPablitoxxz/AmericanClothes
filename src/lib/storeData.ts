import { Order, OrderItem, OrderStatus, Product } from '../types';
import { supabase } from './supabase';

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
  name: product.name,
  sku: product.sku,
  price: Number(product.price),
  stock: Number(product.stock),
  category: product.category,
  status: product.status,
  image: product.image,
  description: product.description,
  sizes: Array.isArray(product.sizes) ? product.sizes : ['Única'],
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

export const seedProductsIfEmpty = async (products: Product[]): Promise<Product[]> => {
  try {
    const existingProducts = await fetchProducts();
    if (existingProducts.length > 0) return existingProducts;

    const client = requireSupabase();
    const { data, error } = await client
      .from('products')
      .upsert(products.map(fromProduct), { onConflict: 'sku' })
      .select('*');

    if (error) throw error;
    return (data ?? []).map((row) => toProduct(row as ProductRow));
  } catch (e) {
    console.error('Error en seedProductsIfEmpty:', e);
    throw e;
  }
};

export const fetchOrders = async (): Promise<Order[]> => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('orders')
    .select('*, order_items(*)')
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

  const formattedAddress = order.phone
    ? `${order.shippingAddress || ''} | Tel: ${order.phone}`.trim()
    : order.shippingAddress ?? null;

  const { error: orderError } = await client.from('orders').insert({
    id: order.id,
    customer_name: order.customerName,
    email: order.email,
    total: order.total,
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
        order_id: order.id,
        product_id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size ?? null,
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
  const { data, error } = await client
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select('*, order_items(*)')
    .single();

  if (error) {
    console.error('Error al actualizar estado del pedido en Supabase:', error);
    throw error;
  }
  return toOrder(data as OrderRow);
};
