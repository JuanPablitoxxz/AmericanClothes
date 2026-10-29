import React, { useEffect, useRef, useState } from 'react';
import {
  AppMode,
  AdminTab,
  Product,
  Order,
  OrderItem,
  CartItem,
  OrderStatus,
  ProductCategory,
  AuthUser,
} from './types';
import {
  clearPasswordRecoveryFlag,
  isSupabaseConfigured,
  onPasswordRecoveryDetected,
  supabase,
} from './lib/supabase';
import {
  computeProductStatusFromStock,
  createOrder,
  deleteOrder,
  deleteProduct,
  fetchCloudSettings,
  fetchOrders,
  fetchProducts,
  getOrderReservationStatus,
  LOW_STOCK_THRESHOLD,
  saveProduct,
  updateOrderStatus,
  updateProductStatus,
  updateProductStock,
} from './lib/storeData';
import { getVerifiedCurrentUser, logoutUser } from './lib/auth';
import { LiquidGoldShader } from './components/LiquidGoldShader';
import { AuthModal, AuthView } from './components/auth/AuthModal';

// Storefront components
import { Navbar } from './components/storefront/Navbar';
import { Hero } from './components/storefront/Hero';
import { BentoGrid } from './components/storefront/BentoGrid';
import { ProductCatalog } from './components/storefront/ProductCatalog';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { ShoppingBagDrawer } from './components/storefront/ShoppingBagDrawer';
import { CustomerAccountModal } from './components/storefront/CustomerAccountModal';
import { LookbookJournal } from './components/storefront/LookbookJournal';
import { Footer } from './components/storefront/Footer';
import { WhatsAppFloatingButton } from './components/storefront/WhatsAppFloatingButton';

// Admin components
import { AdminSidebar } from './components/admin/AdminSidebar';
import { AdminTopBar } from './components/admin/AdminTopBar';
import { DashboardOverview } from './components/admin/DashboardOverview';
import { ProductManagement } from './components/admin/ProductManagement';
import { OrderManagement } from './components/admin/OrderManagement';
import { SettingsPanel } from './components/admin/SettingsPanel';
import { ProductFormModal } from './components/admin/ProductFormModal';

const STORAGE_KEYS = {
  PRODUCTS: 'american_clothes_products_v1',
  ORDERS: 'american_clothes_orders_v1',
  CART: 'american_clothes_cart_v1',
  SETTINGS: 'american_clothes_settings_v1',
};

const getInitialCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error al leer carrito de localStorage:', e);
  }
  return [];
};

export default function App() {
  const [mode, setMode] = useState<AppMode>('store');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<AuthView>('login');
  const [recoveryEmail, setRecoveryEmail] = useState<string>('');
  const [isCustomerAccountOpen, setIsCustomerAccountOpen] = useState<boolean>(false);

  // Shared Application State (100% desde Supabase, sin mockups)
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>(getInitialCart);
  const [dataError, setDataError] = useState<string | null>(null);
  const [stockNotice, setStockNotice] = useState<string | null>(null);
  const stockNoticeTimerRef = useRef<number | null>(null);
  const releasingOrderIdsRef = useRef<Set<string>>(new Set());

  const showStockNotice = (message: string) => {
    setStockNotice(message);
    if (stockNoticeTimerRef.current) {
      window.clearTimeout(stockNoticeTimerRef.current);
    }
    stockNoticeTimerRef.current = window.setTimeout(() => {
      setStockNotice(null);
    }, 4500);
  };

  // UI States
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Settings with LocalStorage
  const [shaderOpacity, setShaderOpacity] = useState<number>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (s) return JSON.parse(s).shaderOpacity ?? 0.3;
    } catch {}
    return 0.3;
  });

  const [currency, setCurrency] = useState<string>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (s) return JSON.parse(s).currency ?? 'COP';
    } catch {}
    return 'COP';
  });

  const [announcementText, setAnnouncementText] = useState<string>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (s)
        return (
          JSON.parse(s).announcementText ??
          'Envíos gratis a Colombia por compras superiores a $350.000 COP'
        );
    } catch {}
    return 'Envíos gratis a Colombia por compras superiores a $350.000 COP';
  });

  const [whatsappNumber, setWhatsappNumber] = useState<string>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (s) return JSON.parse(s).whatsappNumber ?? '573001234567';
    } catch {}
    return '573001234567';
  });

  // 1. Verificar sesión autenticada y enlaces de recuperación de contraseña por correo
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const verified = await getVerifiedCurrentUser();
      if (isMounted && verified) {
        setCurrentUser(verified);
      }
    };

    initAuth();

    // Detectar enlace de recuperación desde el correo electrónico (hash #type=recovery o evento PASSWORD_RECOVERY)
    const unsubscribeRecovery = onPasswordRecoveryDetected((emailFromRecovery) => {
      if (!isMounted) return;
      if (emailFromRecovery) {
        setRecoveryEmail(emailFromRecovery);
      }
      setAuthModalView('reset-password');
      setIsAuthModalOpen(true);
      clearPasswordRecoveryFlag();
      window.history.replaceState({}, document.title, window.location.pathname);
    });

    return () => {
      isMounted = false;
      unsubscribeRecovery();
    };
  }, []);

  // 2. Protección estricta de ruta: Nunca permitir modo 'admin' si el usuario no es 'admin' verificado
  useEffect(() => {
    if (mode === 'admin' && currentUser?.role !== 'admin') {
      setMode('store');
    }
  }, [mode, currentUser]);

  // Persist cart & settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({ shaderOpacity, currency, announcementText, whatsappNumber })
    );
  }, [shaderOpacity, currency, announcementText, whatsappNumber]);

  const handleSyncDatabase = async () => {
    try {
      if (!isSupabaseConfigured) return;
      const [remoteProducts, remoteOrders, remoteSettings] = await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchCloudSettings(),
      ]);
      setProducts(remoteProducts);
      setOrders(remoteOrders);
      if (remoteSettings) {
        setShaderOpacity(remoteSettings.shaderOpacity);
        setCurrency(remoteSettings.currency);
        setAnnouncementText(remoteSettings.announcementText);
        setWhatsappNumber(remoteSettings.whatsappNumber);
      }
      setDataError(null);
    } catch (error) {
      console.error('Error al sincronizar desde Supabase:', error);
      setDataError('No fue posible sincronizar con Supabase.');
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Limpiar cualquier caché viejo de datos mockup en el navegador
    try {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
    } catch {}

    const loadStoreData = async () => {
      try {
        if (!isSupabaseConfigured) return;

        const [remoteProducts, remoteOrders, remoteSettings] = await Promise.all([
          fetchProducts(),
          fetchOrders(),
          fetchCloudSettings(),
        ]);

        if (!isMounted) return;
        setProducts(remoteProducts);
        setOrders(remoteOrders);

        if (remoteSettings) {
          setShaderOpacity(remoteSettings.shaderOpacity);
          setCurrency(remoteSettings.currency);
          setAnnouncementText(remoteSettings.announcementText);
          setWhatsappNumber(remoteSettings.whatsappNumber);
        }

        setDataError(null);
      } catch (error) {
        console.error('Error al cargar datos desde Supabase:', error);
        if (isMounted) {
          setDataError('No fue posible sincronizar con Supabase.');
        }
      }
    };

    loadStoreData();

    // Suscripción en tiempo real a cambios en Supabase (productos y órdenes)
    const realtimeChannel = supabase
      ?.channel('american-clothes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        async () => {
          try {
            const latestProducts = await fetchProducts();
            if (isMounted) {
              setProducts(latestProducts);
            }
          } catch {}
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async () => {
          try {
            const latestOrders = await fetchOrders();
            if (isMounted) {
              setOrders(latestOrders);
            }
          } catch {}
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (realtimeChannel) {
        supabase?.removeChannel(realtimeChannel);
      }
    };
  }, []);

  // Auth Handlers
  const handleOpenAuth = (view: AuthView = 'login') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setMode('admin');
    } else {
      setMode('store');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setMode('store');
    setIsCustomerAccountOpen(false);
  };

  // Helper: Ajustar stock en Supabase y estado local (reservar/descontar o devolver al stock)
  const adjustStockForItems = async (
    items: OrderItem[],
    direction: 'deduct' | 'restore',
    sourceProducts: Product[] = products
  ): Promise<Product[]> => {
    if (!items || items.length === 0) return sourceProducts;

    // Agrupar cantidades por producto (ID o nombre de respaldo)
    const qtyByProductId = new Map<string, number>();
    const qtyByName = new Map<string, number>();

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      if (item.productId) {
        qtyByProductId.set(item.productId, (qtyByProductId.get(item.productId) || 0) + qty);
      }
      if (item.name) {
        qtyByName.set(item.name.toLowerCase(), (qtyByName.get(item.name.toLowerCase()) || 0) + qty);
      }
    }

    const changedProducts: Product[] = [];
    const nextProducts = sourceProducts.map((p) => {
      const matchedQty =
        qtyByProductId.get(p.id) ??
        qtyByProductId.get(p.sku) ??
        qtyByName.get(p.name.toLowerCase()) ??
        0;

      if (matchedQty <= 0) return p;

      const newStock =
        direction === 'deduct' ? Math.max(0, p.stock - matchedQty) : p.stock + matchedQty;
      const newStatus = computeProductStatusFromStock(newStock, p.status);
      const updated: Product = {
        ...p,
        stock: newStock,
        status: newStatus,
      };
      changedProducts.push(updated);
      return updated;
    });

    if (isSupabaseConfigured && changedProducts.length > 0) {
      await Promise.allSettled(
        changedProducts.map((prod) =>
          updateProductStock(prod.id, prod.stock, prod.status, prod.sku)
        )
      );
    }

    setProducts(nextProducts);
    return nextProducts;
  };

  // Liberación automática de reservas vencidas (> 24 horas en estado PROCESANDO sin actualización del admin)
  useEffect(() => {
    if (orders.length === 0 || products.length === 0) return;

    const releaseExpiredOrders = async () => {
      const expiredOrders = orders.filter(
        (o) =>
          o.status === 'PROCESANDO' &&
          getOrderReservationStatus(o).isExpired &&
          !releasingOrderIdsRef.current.has(o.id)
      );

      if (expiredOrders.length === 0) return;

      let workingProducts = [...products];
      for (const expired of expiredOrders) {
        releasingOrderIdsRef.current.add(expired.id);
        try {
          workingProducts = await adjustStockForItems(
            expired.items,
            'restore',
            workingProducts
          );
          if (isSupabaseConfigured) {
            const cancelledOrder = await updateOrderStatus(expired.id, 'CANCELADO');
            setOrders((prev) =>
              prev.map((o) => (o.id === expired.id ? cancelledOrder : o))
            );
          } else {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === expired.id ? { ...o, status: 'CANCELADO' } : o
              )
            );
          }
        } catch (err) {
          console.error('Error al liberar reserva vencida de 24h:', err);
          releasingOrderIdsRef.current.delete(expired.id);
        }
      }
    };

    releaseExpiredOrders();
    const intervalId = window.setInterval(releaseExpiredOrders, 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [orders, products]);

  // Mantener selectedProduct sincronizado con el stock en vivo
  useEffect(() => {
    if (!selectedProduct) return;
    const live = products.find((p) => p.id === selectedProduct.id);
    if (live && (live.stock !== selectedProduct.stock || live.status !== selectedProduct.status)) {
      setSelectedProduct(live);
    }
  }, [products, selectedProduct]);

  // Cart operations con restricción estricta de stock disponible
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (
    product: Product,
    quantity = 1,
    selectedSize = 'M'
  ): boolean => {
    const liveProduct = products.find((p) => p.id === product.id) || product;
    const totalAlreadyInCart = cart
      .filter((i) => i.product.id === liveProduct.id)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (liveProduct.stock <= 0) {
      showStockNotice(`"${liveProduct.name}" está AGOTADO (0 unidades disponibles).`);
      return false;
    }

    if (totalAlreadyInCart + quantity > liveProduct.stock) {
      showStockNotice(
        `Solo hay ${liveProduct.stock} ${
          liveProduct.stock === 1 ? 'unidad disponible' : 'unidades disponibles'
        } de "${liveProduct.name}"${
          totalAlreadyInCart > 0 ? ` (ya tienes ${totalAlreadyInCart} en tu bolsa)` : ''
        }.`
      );
      return false;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product.id === liveProduct.id && i.selectedSize === selectedSize
      );
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          product: liveProduct,
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }
      return [...prev, { product: liveProduct, quantity, selectedSize }];
    });
    return true;
  };

  const handleUpdateCartQty = (productId: string, size: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId, size);
      return;
    }

    const liveProduct =
      products.find((p) => p.id === productId) ||
      cart.find((i) => i.product.id === productId)?.product;

    if (liveProduct) {
      if (liveProduct.stock <= 0) {
        showStockNotice(`"${liveProduct.name}" se encuentra agotado (0 disponibles).`);
        handleRemoveFromCart(productId, size);
        return;
      }

      const otherSizesQty = cart
        .filter((i) => i.product.id === productId && i.selectedSize !== size)
        .reduce((sum, i) => sum + i.quantity, 0);

      const maxForThisSize = Math.max(0, liveProduct.stock - otherSizesQty);

      if (newQty > maxForThisSize) {
        showStockNotice(
          `Solo hay ${liveProduct.stock} ${
            liveProduct.stock === 1 ? 'unidad disponible' : 'unidades disponibles'
          } en stock de "${liveProduct.name}".`
        );
        if (maxForThisSize <= 0) return;
        newQty = maxForThisSize;
      }
    }

    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.selectedSize === size
          ? { ...i, product: liveProduct || i.product, quantity: newQty }
          : i
      )
    );
  };

  const handleRemoveFromCart = (productId: string, size: string) => {
    setCart((prev) =>
      prev.filter((i) => !(i.product.id === productId && i.selectedSize === size))
    );
  };

  const handleCheckout = async (customerInfo: {
    name: string;
    email: string;
    address: string;
    phone?: string;
  }): Promise<string> => {
    if (cart.length === 0) return '';

    // Verificar existencias reales antes de confirmar y reservar stock
    for (const item of cart) {
      const liveProd = products.find((p) => p.id === item.product.id) || item.product;
      const totalRequestedForProd = cart
        .filter((c) => c.product.id === liveProd.id)
        .reduce((sum, c) => sum + c.quantity, 0);

      if (liveProd.stock <= 0) {
        const msg = `"${liveProd.name}" está agotado y no puede procesarse.`;
        showStockNotice(msg);
        throw new Error(msg);
      }
      if (totalRequestedForProd > liveProd.stock) {
        const msg = `Solo hay ${liveProd.stock} ${
          liveProd.stock === 1 ? 'unidad disponible' : 'unidades disponibles'
        } de "${liveProd.name}". Ajusta la cantidad en tu bolsa.`;
        showStockNotice(msg);
        throw new Error(msg);
      }
    }

    const nowIso = new Date().toISOString();
    const newOrderId = `#ORD-${Math.floor(9022 + Math.random() * 900)}`;
    const newTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    const newOrder: Order = {
      id: newOrderId,
      customerName: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      timeAgo: 'Hace un momento',
      date: nowIso.replace('T', ' ').substring(0, 16),
      createdAtIso: nowIso,
      total: newTotal,
      status: 'PROCESANDO',
      shippingAddress: customerInfo.address,
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        size: item.selectedSize,
        image: item.product.image,
      })),
    };

    try {
      if (isSupabaseConfigured) {
        await createOrder(newOrder);
      }

      // Reservar y descontar inmediatamente del stock por un plazo máximo de 24 horas
      await adjustStockForItems(newOrder.items, 'deduct');

      setOrders((prev) => [newOrder, ...prev]);
      setCart([]);
      setDataError(null);
      return newOrderId;
    } catch (error) {
      console.error('No fue posible registrar el pedido:', error);
      setDataError('No fue posible registrar el pedido en Supabase.');
      return newOrderId;
    }
  };

  // Product Management Handlers (Strict Admin-Only Guard)
  const handleSaveProduct = async (productData: Omit<Product, 'id'> & { id?: string }) => {
    if (currentUser?.role !== 'admin') return;
    const normalizedData = {
      ...productData,
      stock: Math.max(0, Number(productData.stock) || 0),
      status: computeProductStatusFromStock(
        Math.max(0, Number(productData.stock) || 0),
        productData.status
      ),
    };
    try {
      if (isSupabaseConfigured) {
        const savedProduct = await saveProduct(normalizedData);
        setProducts((prev) =>
          normalizedData.id
            ? prev.map((p) =>
                p.id === savedProduct.id || (p.sku && p.sku === savedProduct.sku)
                  ? savedProduct
                  : p
              )
            : [savedProduct, ...prev]
        );
      } else if (normalizedData.id) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === normalizedData.id ? ({ ...p, ...normalizedData } as Product) : p
          )
        );
      } else {
        const newProduct: Product = {
          ...normalizedData,
          id: String(Date.now()),
          sku: normalizedData.sku || `AMC-${Math.floor(100 + Math.random() * 900)}`,
        };
        setProducts((prev) => [newProduct, ...prev]);
      }

      setDataError(null);
    } catch (error) {
      console.error('No fue posible guardar el producto en Supabase:', error);
      setDataError('No fue posible guardar el producto en Supabase.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (currentUser?.role !== 'admin') return;
    if (!window.confirm('¿Está seguro de eliminar esta pieza del catálogo?')) return;
    const target = products.find((p) => p.id === productId);

    try {
      if (isSupabaseConfigured) {
        await deleteProduct(productId, target?.sku);
      }

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setDataError(null);
    } catch (error) {
      console.error('No fue posible eliminar el producto en Supabase:', error);
      setDataError('No fue posible eliminar el producto en Supabase.');
    }
  };

  const handleToggleProductStatus = async (productId: string) => {
    if (currentUser?.role !== 'admin') return;
    const currentProduct = products.find((p) => p.id === productId);
    if (!currentProduct) return;

    const nextStatus: Product['status'] =
      currentProduct.status === 'PAUSADO'
        ? computeProductStatusFromStock(currentProduct.stock, 'ACTIVO')
        : 'PAUSADO';

    try {
      if (isSupabaseConfigured) {
        const updatedProduct = await updateProductStatus(
          productId,
          nextStatus,
          currentProduct.sku
        );
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId || (p.sku && p.sku === currentProduct.sku) ? updatedProduct : p
          )
        );
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status: nextStatus } : p))
        );
      }

      setDataError(null);
    } catch (error) {
      console.error('No fue posible actualizar el producto en Supabase:', error);
      setDataError('No fue posible actualizar el producto en Supabase.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (currentUser?.role !== 'admin') return;
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status === newStatus) return;

    const wasStockDeducted = targetOrder.status !== 'CANCELADO';
    const willStockBeDeducted = newStatus !== 'CANCELADO';

    try {
      if (isSupabaseConfigured) {
        const updatedOrder = await updateOrderStatus(orderId, newStatus);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }

      // Si pasa de PROCESANDO/ENVIADO/ENTREGADO a CANCELADO -> devolver unidades reservadas al stock
      if (wasStockDeducted && !willStockBeDeducted) {
        await adjustStockForItems(targetOrder.items, 'restore');
      }
      // Si pasa de CANCELADO a PROCESANDO/ENVIADO/ENTREGADO -> volver a descontar del stock
      else if (!wasStockDeducted && willStockBeDeducted) {
        await adjustStockForItems(targetOrder.items, 'deduct');
      }
      // Si pasa de PROCESANDO a ENVIADO (o ENTREGADO) -> la reserva queda confirmada y descontada permanentemente del stock

      setDataError(null);
    } catch (error) {
      console.error('No fue posible actualizar el pedido en Supabase:', error);
      setDataError('No fue posible actualizar el pedido en Supabase.');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (currentUser?.role !== 'admin') return;
    if (!window.confirm(`¿Está seguro de eliminar el pedido ${orderId} de la base de datos?`)) {
      return;
    }
    const targetOrder = orders.find((o) => o.id === orderId);
    try {
      // Si el pedido estaba en PROCESANDO (reserva activa de 24h), devolver las unidades al stock antes de borrarlo
      if (targetOrder && targetOrder.status === 'PROCESANDO') {
        await adjustStockForItems(targetOrder.items, 'restore');
      }
      if (isSupabaseConfigured) {
        await deleteOrder(orderId);
      }
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setDataError(null);
    } catch (error) {
      console.error('No fue posible eliminar el pedido en Supabase:', error);
      setDataError('No fue posible eliminar el pedido en Supabase.');
    }
  };

  // Reglas de notificación al Admin:
  // - Stock Crítico: 0 unidades (Agotado)
  // - Stock Bajo: entre 1 y 3 unidades (Últimas unidades)
  // - > 3 unidades: normal (no notificar nada al admin)
  const criticalStockCount = products.filter(
    (p) => p.status !== 'PAUSADO' && p.stock === 0
  ).length;
  const lowStockCount = products.filter(
    (p) => p.status !== 'PAUSADO' && p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD
  ).length;
  const isAdminView = mode === 'admin' && currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#131313] text-[#e4e2e1] font-sans-body relative overflow-x-hidden selection:bg-[#e9c349] selection:text-[#131313]">
      {/* Animated Liquid Gold Shader Canvas Background */}
      <LiquidGoldShader opacity={shaderOpacity} />

      {dataError && (
        <div className="fixed left-4 bottom-4 z-[60] max-w-sm bg-red-950/95 text-white border border-red-400/30 px-4 py-3 text-xs shadow-2xl">
          {dataError}
        </div>
      )}

      {/* Notificación flotante de restricción de Stock para clientes */}
      {stockNotice && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto z-[70] max-w-md bg-[#1A1A1A] text-[#F9F8F6] border-l-4 border-[#e9c349] px-4 py-3.5 shadow-2xl flex items-start justify-between gap-3 animate-fade-up">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[#e9c349] text-lg flex-shrink-0">
              inventory_2
            </span>
            <div>
              <p className="font-label-caps text-[10px] tracking-[2px] text-[#e9c349] font-bold uppercase">
                Aviso de Disponibilidad de Stock
              </p>
              <p className="text-xs text-[#F9F8F6] mt-0.5 leading-relaxed">{stockNotice}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStockNotice(null)}
            className="text-[#999999] hover:text-white p-0.5"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Authentication Modal (Login, Register, Forgot Password, Reset Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialView={authModalView}
        initialEmail={recoveryEmail}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Customer Account & Order History Modal */}
      <CustomerAccountModal
        isOpen={isCustomerAccountOpen}
        user={currentUser}
        orders={orders}
        onClose={() => setIsCustomerAccountOpen(false)}
        onLogout={handleLogout}
        onChangePassword={() => {
          setIsCustomerAccountOpen(false);
          setRecoveryEmail(currentUser?.email || '');
          setAuthModalView('reset-password');
          setIsAuthModalOpen(true);
        }}
      />

      {/* STOREFRONT MODE vs PROTECTED ADMIN DASHBOARD MODE */}
      {!isAdminView ? (
        <div>
          {/* Storefront Navigation Bar */}
          <Navbar
            cartCount={cartCount}
            currentUser={currentUser}
            onOpenCart={() => setIsCartOpen(true)}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              const catalogElement = document.getElementById('catalog');
              if (catalogElement) {
                catalogElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            onOpenSearch={() => {
              const catalogElement = document.getElementById('catalog');
              if (catalogElement) {
                catalogElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            onOpenAuth={(view) => handleOpenAuth(view)}
            onOpenCustomerAccount={() => setIsCustomerAccountOpen(true)}
            onOpenAdmin={() => {
              if (currentUser?.role === 'admin') {
                setMode('admin');
              } else {
                handleOpenAuth('login');
              }
            }}
            onLogout={handleLogout}
            onOpenJournal={() => {
              const journalElement = document.getElementById('journal');
              if (journalElement) {
                journalElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />

          {/* Hero Section */}
          <Hero
            onExplore={() => {
              const catalogElement = document.getElementById('catalog');
              if (catalogElement) {
                catalogElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />

          {/* Bento Grid Categories */}
          <BentoGrid
            onSelectCategory={(cat: ProductCategory) => {
              setSelectedCategory(cat);
              const catalogElement = document.getElementById('catalog');
              if (catalogElement) {
                catalogElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />

          {/* Product Catalog Grid */}
          <ProductCatalog
            products={products}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectProduct={(product) => setSelectedProduct(product)}
            onAddToCart={(product, e) => {
              e.stopPropagation();
              const added = handleAddToCart(product, 1, product.sizes?.[0] || 'M');
              if (added) {
                setIsCartOpen(true);
              }
            }}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Lookbook Journal Section */}
          <LookbookJournal />

          {/* Footer */}
          <Footer whatsappNumber={whatsappNumber} />

          {/* Botón Flotante de Atención por WhatsApp */}
          <WhatsAppFloatingButton
            whatsappNumber={whatsappNumber}
            customerName={currentUser?.name}
          />

          {/* Product Detail Modal */}
          <ProductDetailModal
            product={selectedProduct}
            cartItems={cart}
            onClose={() => setSelectedProduct(null)}
            onStockLimitNotice={showStockNotice}
            onAddToCart={(product, qty, size) => {
              const added = handleAddToCart(product, qty, size);
              if (added) {
                setIsCartOpen(true);
              }
              return added;
            }}
          />

          {/* Shopping Bag Drawer */}
          <ShoppingBagDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cart}
            products={products}
            currentUser={currentUser}
            onUpdateQuantity={handleUpdateCartQty}
            onRemoveItem={handleRemoveFromCart}
            onCheckout={handleCheckout}
            onStockLimitNotice={showStockNotice}
            whatsappNumber={whatsappNumber}
          />
        </div>
      ) : (
        /* PROTECTED ADMIN DASHBOARD MODE (ONLY ACCESSIBLE BY VERIFIED ADMIN) */
        <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] flex flex-col lg:flex-row relative z-10">
          {/* Responsive Sidebar (Mobile/Tablet Bar + Drawer & Desktop Fixed Left Sidebar) */}
          <AdminSidebar
            activeTab={adminTab}
            currentUser={currentUser}
            onSelectTab={(tab) => setAdminTab(tab)}
            onSwitchToStore={() => setMode('store')}
            onLogout={handleLogout}
            lowStockCount={lowStockCount}
            criticalStockCount={criticalStockCount}
            ordersCount={orders.length}
          />

          {/* Right Admin Workspace Column */}
          <div className="flex-1 flex flex-col min-h-screen lg:pl-[280px] w-full min-w-0">
            {/* Admin Top Notification Bar */}
            <AdminTopBar
              lowStockCount={lowStockCount}
              criticalStockCount={criticalStockCount}
              ordersTodayCount={orders.length}
            />

            {/* Centered Admin Main Workspace */}
            <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-10">
              {adminTab === 'dashboard' && (
                <DashboardOverview
                  products={products}
                  orders={orders}
                  onOpenNewProduct={() => {
                    setEditingProduct(null);
                    setIsProductFormOpen(true);
                  }}
                  onEditProduct={(p) => {
                    setEditingProduct(p);
                    setIsProductFormOpen(true);
                  }}
                  onViewAllOrders={() => setAdminTab('orders')}
                />
              )}

              {adminTab === 'products' && (
                <ProductManagement
                  products={products}
                  onOpenNewProduct={() => {
                    setEditingProduct(null);
                    setIsProductFormOpen(true);
                  }}
                  onEditProduct={(p) => {
                    setEditingProduct(p);
                    setIsProductFormOpen(true);
                  }}
                  onDeleteProduct={handleDeleteProduct}
                  onToggleStatus={handleToggleProductStatus}
                />
              )}

              {adminTab === 'orders' && (
                <OrderManagement
                  orders={orders}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onDeleteOrder={handleDeleteOrder}
                />
              )}

              {adminTab === 'settings' && (
                <SettingsPanel
                  shaderOpacity={shaderOpacity}
                  setShaderOpacity={setShaderOpacity}
                  currency={currency}
                  setCurrency={setCurrency}
                  announcementText={announcementText}
                  setAnnouncementText={setAnnouncementText}
                  whatsappNumber={whatsappNumber}
                  setWhatsappNumber={setWhatsappNumber}
                  isSupabaseConfigured={isSupabaseConfigured}
                  productsCount={products.length}
                  ordersCount={orders.length}
                  onSyncDatabase={handleSyncDatabase}
                />
              )}
            </main>
          </div>

          {/* Create/Edit Product Form Modal */}
          <ProductFormModal
            isOpen={isProductFormOpen}
            onClose={() => {
              setIsProductFormOpen(false);
              setEditingProduct(null);
            }}
            productToEdit={editingProduct}
            onSaveProduct={handleSaveProduct}
          />
        </div>
      )}
    </div>
  );
}
