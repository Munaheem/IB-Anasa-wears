import  { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  Product,
  CartItem,
  CustomerCart,
  Order,
  AdminUser,
  CustomerAccount,
  CustomerCredential,
  SavedCard,
  StaffAccount,
  NavPage,
  GridDensity,
  ToastMessage,
  CustomerNotification
} from './types';
import { INITIAL_PRODUCTS, INITIAL_CARTS, INITIAL_ORDERS, formatNaira } from './data/initialData';
import { fetchProductsFromBackend } from './lib/productApi';
import { getDeliveryFee, isBackendConfigured, listOrdersAtBackend, updateOrderAtBackend } from './lib/paymentApi';
import { CUSTOMER_CREDENTIALS_KEY, clearCustomerToken, loadSavedCredentials } from './lib/customerAuth';
import { archiveProduct, clearAdminToken, createProduct, updateProduct } from './lib/adminApi';
import { normalizeApiProduct, toApiProduct } from './lib/normalizers';
import { useInactivityTimeout } from './hooks/useInactivityTimeout';
import { Navbar } from './components/Navbar';
import { HeroSlideshow } from './components/HeroSlideshow';
import { CatalogFilterBar } from './components/CatalogFilterBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { AboutView } from './components/AboutView';
import { GoogleSSOModal } from './components/GoogleSSOModal';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import { CustomerLoginModal } from './components/CustomerLoginModal';
import { CustomerNotificationsPanel } from './components/CustomerNotificationsPanel';
import { createOrderAtBackend } from './lib/paymentApi';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('home');
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ib_anasa_products');
    if (!saved) return INITIAL_PRODUCTS;

    const savedProducts = JSON.parse(saved) as Product[];
    const savedById = new Map(savedProducts.map((product) => [product.id, product]));
    const syncedInitialProducts = INITIAL_PRODUCTS.map((initialProduct) => {
      const savedProduct = savedById.get(initialProduct.id);
      if (!savedProduct) return initialProduct;

      return {
        ...savedProduct,
        img: initialProduct.img,
        altImg: initialProduct.altImg
      };
    });
    const initialProductIds = new Set(INITIAL_PRODUCTS.map((product) => product.id));
    const customProducts = savedProducts.filter((product) => !initialProductIds.has(product.id));

    return [...syncedInitialProducts, ...customProducts];
  });

  useEffect(() => {
    let cancelled = false;
    fetchProductsFromBackend().then((result) => {
      if (cancelled || result.source !== 'backend') return;
      setProducts(result.products);
      setSelectedCategory('all');
      setSearchQuery('');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const productsRef = useRef<Product[]>(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  /**
   * Reconciles local admin edits with the backend: POST new products,
   * PUT changed products, PATCH archive removed products. Fire-and-forget so
   * the admin UI stays responsive; failures produce soft warnings only.
   */
  const syncProductsToBackend = async (prev: Product[], next: Product[]) => {
    if (!isBackendConfigured()) return;
    for (const nextProduct of next) {
      const prevProduct = prev.find((p) => p.id === nextProduct.id);
      if (!prevProduct) {
        try {
          const created = await createProduct(toApiProduct(nextProduct));
          const mapped = normalizeApiProduct(created);
          setProducts((current) => current.map((p) => (p.id === nextProduct.id ? mapped : p)));
        } catch {
          showToast(`Could not create "${nextProduct.name}" on the server yet.`, 'warning');
        }
        continue;
      }
      if (JSON.stringify(prevProduct) !== JSON.stringify(nextProduct)) {
        try {
          await updateProduct(nextProduct.id, toApiProduct(nextProduct));
        } catch {
          showToast(`Could not save "${nextProduct.name}" to the server yet.`, 'warning');
        }
      }
    }
    for (const prevProduct of prev) {
      if (!next.some((p) => p.id === prevProduct.id)) {
        try {
          await archiveProduct(prevProduct.id);
        } catch {
          showToast(`Could not archive "${prevProduct.name}" on the server yet.`, 'warning');
        }
      }
    }
  };

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('ib_anasa_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductForPDP, setSelectedProductForPDP] = useState<Product | null>(null);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [gridDensity, setGridDensity] = useState<GridDensity>('cols-4');

  // Admin & SSO states
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = sessionStorage.getItem('ib_anasa_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isGoogleSSOModalOpen, setIsGoogleSSOModalOpen] = useState(false);

  // Customer Carts & Orders in admin
  const [customerCarts, setCustomerCarts] = useState<CustomerCart[]>(() => {
    const saved = localStorage.getItem('ib_anasa_customer_carts');
    return saved ? JSON.parse(saved) : INITIAL_CARTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('ib_anasa_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  useEffect(() => {
    if (!isBackendConfigured()) return;
    listOrdersAtBackend().then((backendOrders) => {
      if (backendOrders.length) setOrders(backendOrders);
    });
  }, []);

  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(() => {
    const saved = localStorage.getItem('ib_anasa_staff_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  const [customerCredentials, setCustomerCredentials] = useState<CustomerCredential[]>(() =>
    loadSavedCredentials()
  );

  const [customerAccount, setCustomerAccount] = useState<CustomerAccount | null>(() => {
    const local = localStorage.getItem('ib_anasa_customer_account');
    if (local) return JSON.parse(local);
    const session = sessionStorage.getItem('ib_anasa_customer_account');
    return session ? JSON.parse(session) : null;
  });
  const [customerStorageTarget, setCustomerStorageTarget] = useState<'local' | 'session'>(() =>
    localStorage.getItem('ib_anasa_customer_account') ? 'local' : 'session'
  );
  const [accountModalMode, setAccountModalMode] = useState<'checkout' | 'account'>('account');
  const [isCustomerAccountOpen, setIsCustomerAccountOpen] = useState(false);
  const [checkoutAsGuest, setCheckoutAsGuest] = useState(false);
  const [isCustomerLoginOpen, setIsCustomerLoginOpen] = useState(false);
  const [customerLoginPending, setCustomerLoginPending] = useState<'checkout' | 'account' | null>(null);
  const [customerNotifications, setCustomerNotifications] = useState<CustomerNotification[]>(() => {
    const saved = localStorage.getItem('ib_anasa_customer_notifications');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'welcome-message',
        title: 'Welcome to IB ANASA WEARS',
        message: 'Enjoy early access to new drops, collection notes, and exclusive community updates.',
        type: 'news',
        createdAt: new Date().toISOString(),
        read: false
      }
    ];
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const hasTransientOverlay =
    isGoogleSSOModalOpen || isCartOpen || isCustomerAccountOpen || isCustomerLoginOpen || !!selectedProductForPDP;
  const overlayHistoryEntry = useRef(false);
  const currentPageRef = useRef(currentPage);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    window.history.replaceState(
      { ...(window.history.state || {}), ibAnasaApp: true, appPage: 'home' },
      '',
      window.location.href
    );

    const handlePopState = (event: PopStateEvent) => {
      if (overlayHistoryEntry.current) {
        overlayHistoryEntry.current = false;
        setIsGoogleSSOModalOpen(false);
        setIsCartOpen(false);
        setIsCustomerAccountOpen(false);
        setIsCustomerLoginOpen(false);
        setSelectedProductForPDP(null);
        return;
      }

      const page = event.state?.appPage as NavPage | undefined;
      if (currentPageRef.current === 'admin' && page !== 'admin') {
        setAdminUser(null);
      }
      setCurrentPage(page || 'home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (hasTransientOverlay && !overlayHistoryEntry.current) {
      window.history.pushState(
        { ...(window.history.state || {}), ibAnasaApp: true, overlay: true },
        '',
        window.location.href
      );
      overlayHistoryEntry.current = true;
    } else if (!hasTransientOverlay && overlayHistoryEntry.current) {
      overlayHistoryEntry.current = false;
      window.history.back();
    }
  }, [hasTransientOverlay]);

  // Sync state to storage
  useEffect(() => {
    localStorage.setItem('ib_anasa_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ib_anasa_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (adminUser) {
      sessionStorage.setItem('ib_anasa_admin_user', JSON.stringify(adminUser));
    } else {
      sessionStorage.removeItem('ib_anasa_admin_user');
    }
  }, [adminUser]);

  useEffect(() => {
    if (customerAccount) {
      const storage = customerStorageTarget === 'session' ? sessionStorage : localStorage;
      storage.setItem('ib_anasa_customer_account', JSON.stringify(customerAccount));
      if (customerStorageTarget === 'session') {
        localStorage.removeItem('ib_anasa_customer_account');
      } else {
        sessionStorage.removeItem('ib_anasa_customer_account');
      }
    } else {
      localStorage.removeItem('ib_anasa_customer_account');
      sessionStorage.removeItem('ib_anasa_customer_account');
    }
  }, [customerAccount, customerStorageTarget]);

  useEffect(() => {
    localStorage.setItem(CUSTOMER_CREDENTIALS_KEY, JSON.stringify(customerCredentials));
  }, [customerCredentials]);

  useEffect(() => {
    localStorage.setItem('ib_anasa_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('ib_anasa_staff_accounts', JSON.stringify(staffAccounts));
  }, [staffAccounts]);

  useEffect(() => {
    localStorage.setItem('ib_anasa_customer_notifications', JSON.stringify(customerNotifications));
  }, [customerNotifications]);

  // Helper: show toast
  const showToast = (text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Navigation router
  const handleNavigate = (page: NavPage, category?: string) => {
    if (page === 'admin') {
      if (!adminUser) {
        setIsGoogleSSOModalOpen(true);
        return;
      }
    }

    if (category) {
      setSelectedCategory(category);
    }
    if (currentPage === 'admin' && page !== 'admin') {
      setAdminUser(null);
    }
    const nextState = { ...(window.history.state || {}), ibAnasaApp: true, appPage: page };
    if (overlayHistoryEntry.current) {
      overlayHistoryEntry.current = false;
      window.history.replaceState(nextState, '', window.location.href);
    } else {
      window.history.pushState(nextState, '', window.location.href);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart operations
  const handleAddToCart = (product: Product, size: string, color?: string) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.size === size && item.color === color
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.size === size && item.color === color
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { id: Date.now(), product, size, color, qty: 1 }];
    });
    setIsCartOpen(true);
    showToast(`Added ${product.name} (${size}${color ? `, ${color}` : ''}) to Bag`, 'success');
  };

  const handleUpdateQty = (productId: number, size: string, color: string | undefined, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.size === size && item.color === color) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: number, size: string, color: string | undefined) => {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.size === size && item.color === color)));
    showToast('Item removed from bag', 'info');
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('Shopping bag cleared', 'info');
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      showToast('Your bag is empty. Add a garment first.', 'warning');
      return;
    }
    setAccountModalMode('checkout');
    setIsCartOpen(false);
    if (customerAccount) {
      setCheckoutAsGuest(false);
      setIsCustomerAccountOpen(true);
    } else {
      setCustomerLoginPending('checkout');
      setIsCustomerLoginOpen(true);
    }
  };

  const handleOpenCustomerAccount = () => {
    if (customerAccount) {
      setAccountModalMode('account');
      setCheckoutAsGuest(false);
      setIsCustomerAccountOpen(true);
    } else {
      setCustomerLoginPending('account');
      setIsCustomerLoginOpen(true);
    }
  };

  const handleCloseCustomerAccount = () => {
    setIsCustomerAccountOpen(false);
    setCheckoutAsGuest(false);
  };

  const handleSaveCustomerAccount = (account: CustomerAccount) => {
    setCustomerAccount(account);
  };

  const handleLoginSuccess = (account: CustomerAccount, saveCredentials: boolean) => {
    setCustomerStorageTarget(saveCredentials ? 'local' : 'session');
    setCustomerAccount(account);
    setCheckoutAsGuest(false);
    setIsCustomerLoginOpen(false);
    const pending = customerLoginPending;
    setCustomerLoginPending(null);
    if (pending === 'checkout') {
      setAccountModalMode('checkout');
      setIsCustomerAccountOpen(true);
    } else if (pending === 'account') {
      setAccountModalMode('account');
      setIsCustomerAccountOpen(true);
    }
    showToast(
      saveCredentials
        ? `Welcome back, ${account.name.split(' ')[0]}!`
        : `Signed in as ${account.name.split(' ')[0]} (session only)`,
      'success'
    );
  };

  const handleContinueAsGuest = () => {
    const pending = customerLoginPending;
    setCustomerLoginPending(null);
    setIsCustomerLoginOpen(false);
    if (pending === 'checkout') {
      setCheckoutAsGuest(true);
      setAccountModalMode('checkout');
      setIsCustomerAccountOpen(true);
      showToast('Continuing as guest. Sign in anytime to save your details.', 'info');
    } else {
      showToast('Browsing as guest. Sign in anytime to access your account.', 'info');
    }
  };

  const handleCustomerLogout = () => {
    clearCustomerToken();
    setCustomerAccount(null);
    setIsCustomerAccountOpen(false);
    setCheckoutAsGuest(false);
    showToast('You have been signed out of your customer account.', 'info');
  };

  const handleCredentialsChanged = () => {
    setCustomerCredentials(loadSavedCredentials());
  };

  const handlePaymentComplete = (
    confirmedOrder: Order,
    card: SavedCard,
    account: CustomerAccount,
    isGuest = false
  ) => {
    setOrders((prev) => [confirmedOrder, ...prev.filter((order) => order.id !== confirmedOrder.id)]);
    if (!isGuest) {
      setCustomerAccount({
        ...account,
        points: account.points + Math.floor(confirmedOrder.amount / 1000),
        savedCards: [card, ...account.savedCards.filter((saved) => saved.reference !== card.reference)]
      });
    }
    setCart([]);
    setCheckoutAsGuest(false);
    showToast(`Payment confirmed. Order ${confirmedOrder.id} is processing.`, 'success');
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    patch: { paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'; orderStatus?: Order['orderStatus'] }
  ) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              ...patch,
              status: patch.paymentStatus === 'paid' ? 'completed' : order.status
            }
          : order
      )
    );
    void updateOrderAtBackend(orderId, patch);
  };

  const handleDirectWhatsAppOrder = (product: Product, size: string, color: string) => {
    const msg = `*IB ANASA WEARS — IMMEDIATE ORDER INQUIRY*\n----------------------------------------\n*Garment:* ${product.name}\n*Category:* ${product.cat.toUpperCase()}\n*Size Selected:* ${size}\n*Color Selected:* ${color}\n*Price:* ${formatNaira(
      product.price
    )}\n----------------------------------------\nPlease confirm availability for dispatch from Auchi Showroom.`;
    window.open(`https://wa.me/2348138947979?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Admin Actions
  const handleAdminLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    setIsGoogleSSOModalOpen(false);
    overlayHistoryEntry.current = false;
    window.history.replaceState(
      { ...(window.history.state || {}), ibAnasaApp: true, appPage: 'admin' },
      '',
      window.location.href
    );
    setCurrentPage('admin');
    if (isBackendConfigured()) {
      listOrdersAtBackend().then((backendOrders) => {
        if (backendOrders.length) setOrders(backendOrders);
      });
    }
    showToast(`Welcome back, ${user.name}! (Signed in via Google SSO)`, 'success');
  };

  const handleAdminLogout = () => {
    clearAdminToken();
    setAdminUser(null);
    setCurrentPage('home');
    showToast('Logged out of Admin Portal.', 'info');
  };

  const handleStaffAccountCreated = (account: StaffAccount) => {
    setStaffAccounts((prev) => [
      ...prev.filter((staff) => staff.email.toLowerCase() !== account.email.toLowerCase()),
      account
    ]);
  };

  const handleDeleteStaff = (id: string) => {
    const staff = staffAccounts.find((account) => account.id === id);
    if (!staff) return;
    setStaffAccounts((prev) => prev.filter((account) => account.id !== id));
    showToast(`${staff.name}'s staff access has been removed.`, 'success');
  };

  const handleAddProduct = (newProductData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProductData,
      id: Date.now()
    };
    setProducts((prev) => [newProduct, ...prev]);
    if (isBackendConfigured()) {
      createProduct(toApiProduct(newProduct))
        .then((created) => {
          const mapped = normalizeApiProduct(created);
          setProducts((current) => current.map((p) => (p.id === newProduct.id ? mapped : p)));
        })
        .catch(() => showToast('Added locally — could not create it on the server yet.', 'warning'));
    }
  };

  const handleDeleteProduct = (id: number) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (isBackendConfigured() && target) {
      archiveProduct(id).catch(() => showToast(`Could not archive "${target.name}" on the server yet.`, 'warning'));
    }
  };

  const handleUpdateProducts: Dispatch<SetStateAction<Product[]>> = (updater) => {
    const prev = productsRef.current;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    setProducts(next);
    productsRef.current = next;
    void syncProductsToBackend(prev, next);
  };

  // Filter and sort products for catalogue
  const filteredProducts = products.filter((p) => {
    if (p.status === 'draft' || p.status === 'archived') return false;

    const matchesCat =
      selectedCategory.toLowerCase() === 'all' ||
      p.cat.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0; // featured default
  });

  const totalCartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const unreadNotificationCount = customerNotifications.filter((item) => !item.read).length;

  const handleCreateCustomerNotification = (notification: Omit<CustomerNotification, 'id' | 'createdAt' | 'read'>) => {
    const newItem: CustomerNotification = {
      ...notification,
      id: `notice-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false
    };
    setCustomerNotifications((prev) => [newItem, ...prev]);
  };

  const handleMarkNotificationRead = (id: string) => {
    setCustomerNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const hasActiveSession = Boolean(customerAccount || adminUser);

  useInactivityTimeout({
    enabled: hasActiveSession,
    timeoutMs: 10 * 60 * 1000,
    onSignOut: () => {
      if (customerAccount) handleCustomerLogout();
      if (adminUser) handleAdminLogout();
    }
  });

  // Render Admin View
  if (currentPage === 'admin' && adminUser) {
    return (
      <div className="page-enter min-h-screen">
        <AdminPanel
          user={adminUser}
          onLogout={handleAdminLogout}
          products={products}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          onUpdateProduct={handleUpdateProducts}
          carts={customerCarts}
          orders={orders}
          staffAccounts={staffAccounts}
          onDeleteStaff={handleDeleteStaff}
          onNavigateToStore={() => handleNavigate('home')}
          onShowToast={showToast}
          onCreateNotification={handleCreateCustomerNotification}
          notifications={customerNotifications}
          onUpdateOrderStatus={handleUpdateOrderStatus}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // Grid style class calculation
  const getGridClass = () => {
    if (gridDensity === 'cols-1') {
      return 'grid grid-cols-1 max-w-2xl mx-auto gap-12';
    }
    if (gridDensity === 'cols-2') {
      return 'grid grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto gap-8 sm:gap-10';
    }
    return 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6';
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between text-[#111111] font-sans selection:bg-black selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        cartCount={totalCartItemCount}
        notificationCount={unreadNotificationCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={handleOpenCustomerAccount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onSignOut={customerAccount ? handleCustomerLogout : undefined}
        customerName={customerAccount?.name}
        isAdminLoggedIn={!!adminUser}
      />

      {/* Main Content Areas */}
      <main key={currentPage} className="flex-1 page-enter">
        {/* VIEW: HOME / LOOKBOOK */}
        {currentPage === 'home' && (
          <div>
            {/* 100vh Lookbook Hero Stage */}
            <HeroSlideshow onExploreCatalog={() => handleNavigate('shop')} />

            {/* Filter Bar & Grid density switcher */}
            <CatalogFilterBar
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              gridDensity={gridDensity}
              onGridDensityChange={setGridDensity}
              totalProductsCount={sortedProducts.length}
            />

            {/* Catalog Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-200">
                <div>
                  <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-gray-400">
                    FEATURED CAPSULE &middot; AUCHI SHOWROOM
                  </span>
                  <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-black mt-0.5">
                    {selectedCategory === 'all'
                      ? 'The Core Collection'
                      : `${selectedCategory.toUpperCase()} CAPSULE`}
                  </h2>
                </div>

                <button
                  onClick={() => handleNavigate('shop')}
                  className="text-[10px] font-bold tracking-widest uppercase text-black underline underline-offset-4 hover:text-gray-500"
                >
                  View Full Catalogue &rarr;
                </button>
              </div>

              {sortedProducts.length === 0 ? (
                <div className="py-20 text-center text-gray-500 text-xs uppercase tracking-widest">
                  No garments match your filter criteria.
                </div>
              ) : (
                <div className={getGridClass()}>
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onOpenPDP={(p) => setSelectedProductForPDP(p)}
                      onQuickAdd={(p, size) => handleAddToCart(p, size)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW: SHOP / CATALOGUE */}
        {currentPage === 'shop' && (
          <div className="pt-20">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
              <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-gray-400">
                OFFICIAL CATALOGUE &middot; 2026 EDITION
              </span>
              <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-black mt-1">
                All Garments &amp; Goods
              </h1>
            </div>

            {/* Sticky Filter Bar */}
            <CatalogFilterBar
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              gridDensity={gridDensity}
              onGridDensityChange={setGridDensity}
              totalProductsCount={sortedProducts.length}
            />

            {/* Products Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              {sortedProducts.length === 0 ? (
                <div className="py-24 text-center space-y-3">
                  <p className="text-sm font-bold tracking-widest uppercase text-gray-800">
                    No garments found
                  </p>
                  <p className="text-xs text-gray-500">
                    Try adjusting your search terms or category filter.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="px-6 py-2 bg-black text-white text-[11px] font-bold tracking-widest uppercase hover:bg-gray-800"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className={getGridClass()}>
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onOpenPDP={(p) => setSelectedProductForPDP(p)}
                      onQuickAdd={(p, size) => handleAddToCart(p, size)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW: ABOUT & STORE DIRECTORY */}
        {currentPage === 'about' && <AboutView />}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} isAdminLoggedIn={!!adminUser} />

      {/* Product Detail Modal (Vertical Art-Book PDP) */}
      <ProductDetailModal
        product={selectedProductForPDP}
        onClose={() => setSelectedProductForPDP(null)}
        onAddToCart={handleAddToCart}
        onOrderViaWhatsApp={handleDirectWhatsAppOrder}
      />

      {/* Slide-out Shopping Bag Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onExploreCatalog={() => handleNavigate('shop')}
        onCheckout={handleOpenCheckout}
        deliveryFee={getDeliveryFee()}
      />

      <CustomerAccountModal
        isOpen={isCustomerAccountOpen}
        mode={accountModalMode}
        account={customerAccount}
        guest={checkoutAsGuest}
        items={cart}
        orders={customerAccount ? orders.filter((order) => order.email === customerAccount.email) : []}
        onClose={handleCloseCustomerAccount}
        onLogout={handleCustomerLogout}
        onSaveAccount={handleSaveCustomerAccount}
        onPaymentComplete={handlePaymentComplete}
        deliveryFee={getDeliveryFee()}
      />

      {/* Customer Sign-In / Create Account Modal */}
      <CustomerLoginModal
        isOpen={isCustomerLoginOpen}
        onClose={() => setIsCustomerLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onContinueAsGuest={handleContinueAsGuest}
        onCredentialsChanged={handleCredentialsChanged}
        savedCredentials={customerCredentials}
        existingAccount={customerAccount}
      />

      {/* Google Single Sign-On Modal for Admin */}
      <GoogleSSOModal
        isOpen={isGoogleSSOModalOpen}
        onClose={() => setIsGoogleSSOModalOpen(false)}
        onSuccessLogin={handleAdminLoginSuccess}
        staffAccounts={staffAccounts}
        onStaffAccountCreated={handleStaffAccountCreated}
        userEmail="muhammedaimanosinaim@gmail.com"
      />

      <CustomerNotificationsPanel
        isOpen={isNotificationsOpen}
        notifications={customerNotifications}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkRead={handleMarkNotificationRead}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
