export type ProductCategory = 'Hombre' | 'Mujer' | 'Accesorios' | 'Archivo';

export type ProductStatus = 'ACTIVO' | 'STOCK BAJO' | 'PAUSADO';

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: ProductCategory;
  status: ProductStatus;
  image: string;
  description: string;
  sizes?: string[];
  featured?: boolean;
}

export type OrderStatus = 'PROCESANDO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  timeAgo: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
}

export type AdminTab = 'dashboard' | 'products' | 'orders' | 'settings';

export type AppMode = 'store' | 'admin';
