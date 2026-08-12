import React, { useState } from 'react';
import { AppMode, AdminTab, Product, Order, CartItem, OrderStatus, ProductCategory } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from './data/mockData';
import { LiquidGoldShader } from './components/LiquidGoldShader';
import { TopBarSwitch } from './components/TopBarSwitch';

// Storefront components
import { Navbar } from './components/storefront/Navbar';
import { Hero } from './components/storefront/Hero';
import { BentoGrid } from './components/storefront/BentoGrid';
import { ProductCatalog } from './components/storefront/ProductCatalog';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { ShoppingBagDrawer } from './components/storefront/ShoppingBagDrawer';
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

export default function App() {
  const [mode, setMode] = useState<AppMode>('store');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  // Shared Application State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [cart, setCart] = useState<CartItem[]>([]);

  // UI States
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Settings
  const [shaderOpacity, setShaderOpacity] = useState<number>(0.3);
  const [currency, setCurrency] = useState<string>('COP');
  const [announcementText, setAnnouncementText] = useState<string>(
    'Envíos gratis a Colombia por compras superiores a $350.000 COP'
  );

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
    setCart((prev) => prev.filter((i) => !(i.product.id === productId && i.selectedSize === size)));
  };

  const handleCheckout = (customerInfo: { name: string; email: string; address: string }) => {
    if (cart.length === 0) return;

    const newOrderId = `#ORD-${Math.floor(9022 + Math.random() * 900)}`;
    const newTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    const newOrder: Order = {
      id: newOrderId,
      customerName: customerInfo.name,
      email: customerInfo.email,
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

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        const cartMatch = cart.find((c) => c.product.id === p.id);
        if (cartMatch) {
          const newStock = Math.max(0, p.stock - cartMatch.quantity);
          return {
            ...p,
            stock: newStock,
            status: newStock <= 5 ? 'STOCK BAJO' : p.status,
          };
        }
        return p;
      })
    );

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
  };

  // Product Management Handlers
  const handleSaveProduct = (productData: Omit<Product, 'id'> & { id?: string }) => {
    if (productData.id) {
      // Edit
      setProducts((prev) =>
        prev.map((p) => (p.id === productData.id ? ({ ...p, ...productData } as Product) : p))
      );
    } else {
      // Create
      const newProduct: Product = {
        ...productData,
        id: String(Date.now()),
        sku: productData.sku || `AES-${Math.floor(100 + Math.random() * 900)}`,
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('¿Está seguro de eliminar esta pieza del catálogo?')) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  const handleToggleProductStatus = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const nextStatus: Product['status'] =
            p.status === 'ACTIVO' ? 'PAUSADO' : p.status === 'PAUSADO' ? 'ACTIVO' : 'ACTIVO';
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  return (
    <div className="min-h-screen bg-[#131313] text-[#e4e2e1] font-sans-body relative overflow-x-hidden selection:bg-[#e9c349] selection:text-[#131313]">
      {/* Animated Liquid Gold Shader Canvas Background */}
      <LiquidGoldShader opacity={shaderOpacity} />

      {/* Top Bar Switcher between Store & Admin */}
      <TopBarSwitch
        currentMode={mode}
        onModeChange={(newMode) => setMode(newMode)}
        cartCount={cartCount}
      />

      {/* STOREFRONT MODE */}
      {mode === 'store' ? (
        <div className="pt-[31px]">
          {/* Storefront Navigation Bar */}
          <Navbar
            cartCount={cartCount}
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
            onOpenAdmin={() => setMode('admin')}
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
            onUpdateQuantity={handleUpdateCartQty}
            onRemoveItem={handleRemoveFromCart}
            onCheckout={handleCheckout}
          />
        </div>
      ) : (
        /* ADMIN DASHBOARD MODE */
        <div className="pt-[31px] min-h-screen flex">
          {/* Fixed Left Sidebar */}
          <AdminSidebar
            activeTab={adminTab}
            onSelectTab={(tab) => setAdminTab(tab)}
            onSwitchToStore={() => setMode('store')}
            lowStockCount={lowStockCount}
            ordersCount={orders.length}
          />

          {/* Admin Top Notification Bar */}
          <AdminTopBar
            lowStockCount={lowStockCount}
            ordersTodayCount={12}
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
