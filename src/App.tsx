import React, { useEffect, useState } from 'react';
import {
  AppMode,
  AdminTab,
  Product,
  Order,
  CartItem,
  OrderStatus,
  ProductCategory,
  AuthUser,
} from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from './data/mockData';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import {
  createOrder,
  deleteProduct,
  fetchOrders,
  fetchProducts,
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

const getInitialProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error al leer productos de localStorage:', e);
  }
  return INITIAL_PRODUCTS;
};

const getInitialOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error al leer pedidos de localStorage:', e);
  }
  return INITIAL_ORDERS;
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

  // Shared Application State
  const [products, setProducts] = useState<Product[]>(getInitialProducts);
  const [orders, setOrders] = useState<Order[]>(getInitialOrders);
  const [cart, setCart] = useState<CartItem[]>(getInitialCart);
  const [dataError, setDataError] = useState<string | null>(null);

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

      // Detectar si el usuario viene de un enlace de recuperación de contraseña en su correo
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const isRecoveryLink =
        params.get('recovery') === 'true' || hashParams.get('type') === 'recovery';

      if (isRecoveryLink && isMounted) {
        const emailParam = params.get('email') || '';
        setRecoveryEmail(emailParam);
        setAuthModalView('reset-password');
        setIsAuthModalOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    initAuth();

    // Escuchar evento PASSWORD_RECOVERY de Supabase Auth
    const authListener = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (session?.user?.email) {
          setRecoveryEmail(session.user.email);
        }
        setAuthModalView('reset-password');
        setIsAuthModalOpen(true);
      }
    });

    return () => {
      isMounted = false;
      authListener?.data.subscription.unsubscribe();
    };
  }, []);

  // 2. Protección estricta de ruta: Nunca permitir modo 'admin' si el usuario no es 'admin' verificado
  useEffect(() => {
    if (mode === 'admin' && currentUser?.role !== 'admin') {
      setMode('store');
    }
  }, [mode, currentUser]);

  // Persist state to localStorage
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({ shaderOpacity, currency, announcementText, whatsappNumber })
    );
  }, [shaderOpacity, currency, announcementText, whatsappNumber]);

  const handleResetToDemoData = () => {
    if ( currentUser?.role !== 'admin') return;
    if (
      window.confirm(
        '¿Desea restaurar todos los productos y pedidos a los valores de prueba originales?'
      )
    ) {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.CART);
      setProducts(INITIAL_PRODUCTS);
      setOrders(INITIAL_ORDERS);
      setCart([]);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadStoreData = async () => {
      try {
        if (!isSupabaseConfigured) return;

        const [remoteProducts, remoteOrders] = await Promise.all([
          fetchProducts(),
          fetchOrders(),
        ]);

        if (!isMounted) return;
        if (remoteProducts && remoteProducts.length > 0) {
          setProducts(remoteProducts);
        }
        setOrders(remoteOrders);
        setDataError(null);
      } catch (error) {
        console.error('Error al cargar datos desde Supabase:', error);
        if (isMounted) {
          setDataError('No fue posible sincronizar con Supabase. Usando datos locales.');
        }
      }
    };

    loadStoreData();

    return () => {
      isMounted = false;
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

  // Cart operations
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product: Product, quantity = 1, selectedSize = 'M') => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product.id === product.id && i.selectedSize === selectedSize
      );
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      }
      return [...prev, { product, quantity, selectedSize }];
    });
  };

  const handleUpdateCartQty = (productId: string, size: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId, size);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.selectedSize === size
          ? { ...i, quantity: newQty }
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

    const newOrderId = `#ORD-${Math.floor(9022 + Math.random() * 900)}`;
    const newTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    const newOrder: Order = {
      id: newOrderId,
      customerName: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      timeAgo: 'Hace un momento',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
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

      const nextProducts = products.map((p) => {
        const cartMatch = cart.find(
          (c) => c.product.id === p.id || (c.product.sku && c.product.sku === p.sku)
        );
        if (!cartMatch) return p;

        const newStock = Math.max(0, p.stock - cartMatch.quantity);
        return {
          ...p,
          stock: newStock,
          status: newStock <= 5 ? ('STOCK BAJO' as const) : p.status,
        };
      });

      if (isSupabaseConfigured) {
        await Promise.allSettled(
          nextProducts
            .filter((product) =>
              cart.some(
                (item) => item.product.id === product.id || item.product.sku === product.sku
              )
            )
            .map((product) =>
              updateProductStock(product.id, product.stock, product.status, product.sku)
            )
        );
      }

      setProducts(nextProducts);
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
    try {
      if (isSupabaseConfigured) {
        const savedProduct = await saveProduct(productData);
        setProducts((prev) =>
          productData.id
            ? prev.map((p) =>
                p.id === savedProduct.id || (p.sku && p.sku === savedProduct.sku)
                  ? savedProduct
                  : p
              )
            : [savedProduct, ...prev]
        );
      } else if (productData.id) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productData.id ? ({ ...p, ...productData } as Product) : p))
        );
      } else {
        const newProduct: Product = {
          ...productData,
          id: String(Date.now()),
          sku: productData.sku || `AMC-${Math.floor(100 + Math.random() * 900)}`,
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
      currentProduct.status === 'ACTIVO'
        ? 'PAUSADO'
        : currentProduct.status === 'PAUSADO'
        ? 'ACTIVO'
        : 'ACTIVO';

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
    try {
      if (isSupabaseConfigured) {
        const updatedOrder = await updateOrderStatus(orderId, newStatus);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }

      setDataError(null);
    } catch (error) {
      console.error('No fue posible actualizar el pedido en Supabase:', error);
      setDataError('No fue posible actualizar el pedido en Supabase.');
    }
  };

  const lowStockCount = products.filter((p) => p.stock <= 5).length;
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
              handleAddToCart(product, 1, product.sizes?.[0] || 'M');
              setIsCartOpen(true);
            }}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Lookbook Journal Section */}
          <LookbookJournal />

          {/* Footer */}
          <Footer />

          {/* Product Detail Modal */}
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={(product, qty, size) => {
              handleAddToCart(product, qty, size);
              setIsCartOpen(true);
            }}
          />

          {/* Shopping Bag Drawer */}
          <ShoppingBagDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cart}
            currentUser={currentUser}
            onUpdateQuantity={handleUpdateCartQty}
            onRemoveItem={handleRemoveFromCart}
            onCheckout={handleCheckout}
            whatsappNumber={whatsappNumber}
          />
        </div>
      ) : (
        /* PROTECTED ADMIN DASHBOARD MODE (ONLY ACCESSIBLE BY VERIFIED ADMIN) */
        <div className="min-h-screen flex">
          {/* Fixed Left Sidebar */}
          <AdminSidebar
            activeTab={adminTab}
            currentUser={currentUser}
            onSelectTab={(tab) => setAdminTab(tab)}
            onSwitchToStore={() => setMode('store')}
            onLogout={handleLogout}
            lowStockCount={lowStockCount}
            ordersCount={orders.length}
          />

          {/* Admin Top Notification Bar */}
          <AdminTopBar
            lowStockCount={lowStockCount}
            ordersTodayCount={orders.length}
          />

          {/* Admin Main Workspace */}
          <main className="ml-0 md:ml-[280px] flex-1 p-6 md:p-10 mt-[36px] overflow-y-auto">
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
                onResetDemoData={handleResetToDemoData}
              />
            )}
          </main>

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
