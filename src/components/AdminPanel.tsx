import React, { useState } from 'react';
import Swal from 'sweetalert2';

import {
  LayoutDashboard,
  LayoutGrid,
  List,
  Package,
  ShoppingBag,
  Receipt,
  LogOut,
  Plus,
  Trash2,
  TrendingUp,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Printer,
  RotateCcw,
  Check,
  Pencil,
  Search,
  ExternalLink,
  ShieldCheck,
  Eye,
  X,
  Bell,
  Send
} from 'lucide-react';
import { Product, CustomerCart, Order, OrderStatus, ProductStatus, ProductVariant, ReceiptItem, AdminUser, AdminTab, StaffAccount, CustomerNotification } from '../types';
import { formatNaira } from '../data/initialData';

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42', 'Free Size'];
const COLOUR_OPTIONS = ['Black', 'White', 'Navy', 'Grey', 'Beige', 'Cream', 'Brown', 'Red', 'Green', 'Blue', 'Khaki', 'Gold'];

type StockMatrix = Record<string, Record<string, number>>;

const buildVariantsFromMatrix = (
  sizes: string[],
  colours: string[],
  matrix: StockMatrix,
  price: number
): ProductVariant[] =>
  (colours.length ? colours : ['Standard']).flatMap((colour) =>
    sizes.map((size) => ({
      id: `${colour}-${size}`.toLowerCase().replace(/\s+/g, '-'),
      size,
      colour: colour === 'Standard' ? undefined : colour,
      price,
      stock: Math.max(0, matrix[colour]?.[size] ?? 0)
    }))
  );

const countProductStock = (product: Product): number | null => {
  if (product.variants) return product.variants.reduce((sum, v) => sum + v.stock, 0);
  if (product.stock) return Object.values(product.stock).reduce((sum, n) => sum + (n || 0), 0);
  return null;
};

interface AdminPanelProps {
  user: AdminUser;
  onLogout: () => void;
  products: Product[];
  onAddProduct: (newProduct: Omit<Product, 'id'>) => void;
  onDeleteProduct: (id: number) => void;
  onUpdateProduct: React.Dispatch<React.SetStateAction<Product[]>>;
  carts: CustomerCart[];
  orders: Order[];
  staffAccounts: StaffAccount[];
  onDeleteStaff: (id: string) => void;
  onNavigateToStore: () => void;
  onShowToast: (text: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onCreateNotification: (notification: Omit<CustomerNotification, 'id' | 'createdAt' | 'read'>) => void;
  notifications: CustomerNotification[];
  onUpdateOrderStatus: (
    orderId: string,
    patch: { paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'; orderStatus?: OrderStatus }
  ) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user,
  onLogout,
  products,
  onAddProduct,
  onDeleteProduct,
  onUpdateProduct,
  carts,
  orders,
  staffAccounts,
  onDeleteStaff,
  onNavigateToStore,
  onShowToast,
  onCreateNotification,
  notifications,
  onUpdateOrderStatus
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [staffPendingDeletion, setStaffPendingDeletion] = useState<StaffAccount | null>(null);

  // Products state
  const [productSearch, setProductSearch] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState('shirts');
  const [newProdSelectedSizes, setNewProdSelectedSizes] = useState<string[]>(['M', 'L', 'XL']);
  const [newProdSelectedColours, setNewProdSelectedColours] = useState<string[]>(['Black', 'White']);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customColourInput, setCustomColourInput] = useState('');
  const [newProdStockMatrix, setNewProdStockMatrix] = useState<StockMatrix>({});
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdImg, setNewProdImg] = useState('');
  const [newProdImageName, setNewProdImageName] = useState('');
  const [newProdGallery, setNewProdGallery] = useState<string[]>([]);
  const [newProdGalleryNames, setNewProdGalleryNames] = useState<string[]>([]);
  const [newProdTag, setNewProdTag] = useState<'NEW' | 'CAPSULE' | 'LIMITED' | 'BESTSELLER'>('NEW');
  const [inventoryView, setInventoryView] = useState<'list' | 'grid'>('list');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductValues, setEditProductValues] = useState({
    name: '',
    cat: 'shirts',
    sizes: '',
    price: ''
  });
  const [editingInventoryId, setEditingInventoryId] = useState<number | null>(null);
  const [invStockSizes, setInvStockSizes] = useState<string[]>([]);
  const [invStockColours, setInvStockColours] = useState<string[]>([]);
  const [invStockMatrix, setInvStockMatrix] = useState<StockMatrix>({});
  const [invStatus, setInvStatus] = useState<ProductStatus>('active');

  // Customer Carts state
  const [inspectedCart, setInspectedCart] = useState<CustomerCart | null>(null);

  // Notification composer state
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<CustomerNotification['type']>('news');

  // Receipt Generator state
  const [receiptCustomer, setReceiptCustomer] = useState('');
  const [receiptPhone, setReceiptPhone] = useState('');
  const [receiptItemName, setReceiptItemName] = useState('');
  const [receiptQty, setReceiptQty] = useState('1');
  const [receiptPrice, setReceiptPrice] = useState('');
  const [receiptLines, setReceiptLines] = useState<ReceiptItem[]>([]);

  // 7-Day sales chart data
  const chartDays = [
    { day: 'Sun', amount: 245000, height: 35 },
    { day: 'Mon', amount: 480000, height: 60 },
    { day: 'Tue', amount: 390000, height: 48 },
    { day: 'Wed', amount: 580000, height: 75 },
    { day: 'Thu', amount: 440000, height: 55 },
    { day: 'Fri', amount: 820000, height: 100, active: true },
    { day: 'Sat', amount: 650000, height: 80 }
  ];
  const chartMax = Math.max(...chartDays.map((point) => point.amount));
  const chartPoints = chartDays.map((point, index) => ({
    ...point,
    x: 32 + (index * 636) / (chartDays.length - 1),
    y: 198 - (point.amount / chartMax) * 158
  }));
  const chartLine = chartPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const chartArea = `32,198 ${chartLine} ${chartPoints[chartPoints.length - 1].x},198`;

  // Add Product Handler
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct('active');
  };

  const createProduct = (status: ProductStatus) => {
    if (!newProdName.trim() || !newProdPrice) {
      onShowToast('Please enter both a product name and price.', 'error');
      return;
    }

    const priceNum = Number(newProdPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      onShowToast('Please enter a valid numeric price.', 'error');
      return;
    }

    const sizesArr = newProdSelectedSizes.length > 0 ? newProdSelectedSizes : ['One Size'];
    const coloursArr = newProdSelectedColours.length > 0 ? newProdSelectedColours : ['Standard'];
    const colours = coloursArr.map((colour) => (colour === 'Standard' ? undefined : colour) as string);
    const variants = buildVariantsFromMatrix(sizesArr, coloursArr, newProdStockMatrix, priceNum);
    const totalUnits = variants.reduce((sum, v) => sum + v.stock, 0);

    const fallbackImages: Record<string, string> = {
      shirts: '/images/essentials polo.jpg',
      hoodies: '/images/shark hoodie.jpg',
      trousers: '/images/slim trousers.jpg',
      shoes: '/images/nike shoe.jpg',
      caps: '/images/gucci cap.jpg',
      belts: '/images/ferragamo belt.jpg',
      bags: '/images/gucci cross bag.jpg',
      slides: '/images/nike pool slides.jpg',
      shorts: '/images/nike shorts.jpg'
    };

    const primaryImg =
      newProdGallery[0]?.trim() || newProdImg.trim() || fallbackImages[newProdCat] || fallbackImages.shirts;
    const gallery = newProdGallery.length > 0 ? newProdGallery.map((g) => g.trim()).filter(Boolean) : undefined;

    const resolvedStatus: ProductStatus =
      status === 'active' && totalUnits === 0 ? 'out_of_stock' : status;

    onAddProduct({
      name: newProdName.trim(),
      cat: newProdCat,
      sizes: sizesArr,
      colors: colours.filter(Boolean).length > 0 ? colours : undefined,
      price: priceNum,
      img: primaryImg,
      gallery,
      tag: newProdTag,
      inStock: resolvedStatus !== 'draft' && totalUnits > 0,
      status: resolvedStatus,
      dateAdded: new Date().toISOString(),
      variants
    });

    setNewProdName('');
    setNewProdPrice('');
    setNewProdImg('');
    setNewProdImageName('');
    setNewProdGallery([]);
    setNewProdGalleryNames([]);
    setNewProdStockMatrix({});
    onShowToast(
      resolvedStatus === 'draft'
        ? `Saved "${newProdName.trim()}" as a draft.`
        : `Added "${newProdName.trim()}" to live store!`,
      'success'
    );
  };

  const setCreateStock = (colour: string, size: string, value: number) => {
    setNewProdStockMatrix((prev) => ({
      ...prev,
      [colour]: { ...(prev[colour] || {}), [size]: Math.max(0, Math.floor(value || 0)) }
    }));
  };

  const toggleCreateSize = (size: string) => {
    setNewProdSelectedSizes((prev) => {
      const exists = prev.includes(size);
      const next = exists ? prev.filter((s) => s !== size) : [...prev, size];
      setNewProdStockMatrix((matrix) => {
        const updated: StockMatrix = {};
        Object.entries(matrix).forEach(([colour, sizes]) => {
          const cells = { ...sizes };
          if (exists) {
            delete cells[size];
          } else if (!(size in cells)) {
            cells[size] = 0;
          }
          updated[colour] = cells;
        });
        return updated;
      });
      return next;
    });
  };

  const toggleCreateColour = (colour: string) => {
    setNewProdSelectedColours((prev) => {
      const exists = prev.includes(colour);
      if (exists) {
        setNewProdStockMatrix((matrix) => {
          const updated = { ...matrix };
          delete updated[colour];
          return updated;
        });
        return prev.filter((c) => c !== colour);
      }
      setNewProdStockMatrix((matrix) => {
        const next = { ...matrix };
        if (!(colour in next)) {
          const cells: Record<string, number> = {};
          newProdSelectedSizes.forEach((size) => {
            cells[size] = 0;
          });
          next[colour] = cells;
        }
        return next;
      });
      return [...prev, colour];
    });
  };

  const addCustomSize = () => {
    const value = customSizeInput.trim();
    if (!value) return;
    setNewProdSelectedSizes((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setNewProdStockMatrix((prev) => {
      const updated: StockMatrix = {};
      Object.entries(prev).forEach(([colour, sizes]) => {
        updated[colour] = { ...sizes, [value]: sizes[value] ?? 0 };
      });
      return updated;
    });
    setCustomSizeInput('');
  };

  const addCustomColour = () => {
    const value = customColourInput.trim();
    if (!value) return;
    setNewProdSelectedColours((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setNewProdStockMatrix((prev) => ({
      ...prev,
      [value]: (() => {
        const cells: Record<string, number> = {};
        newProdSelectedSizes.forEach((size) => {
          cells[size] = 0;
        });
        return cells;
      })()
    }));
    setCustomColourInput('');
  };

  const openInventoryEditor = (product: Product) => {
    const colours = product.colors && product.colors.length ? product.colors : ['Standard'];
    const sizes = product.sizes.length ? product.sizes : ['M', 'L', 'XL'];
    const matrix: StockMatrix = {};
    colours.forEach((colour) => {
      matrix[colour] = {};
      sizes.forEach((size) => {
        const variant = product.variants?.find((v) => (v.colour || 'Standard') === colour && v.size === size);
        matrix[colour][size] = variant ? variant.stock : (product.stock?.[size] ?? 0);
      });
    });
    setInvStockSizes(sizes);
    setInvStockColours(colours);
    setInvStockMatrix(matrix);
    setInvStatus(product.status && product.status !== 'active' && product.status !== 'out_of_stock' ? product.status : product.status === 'out_of_stock' ? 'out_of_stock' : 'active');
    setEditingInventoryId(product.id);
  };

  const setInvStock = (colour: string, size: string, value: number) => {
    setInvStockMatrix((prev) => ({
      ...prev,
      [colour]: { ...(prev[colour] || {}), [size]: Math.max(0, Math.floor(value || 0)) }
    }));
  };

  const saveEditedInventory = (productId: number) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const colours = invStockColours.length ? invStockColours : ['Standard'];
    const variants = buildVariantsFromMatrix(invStockSizes, colours, invStockMatrix, target.price);
    const totalUnits = variants.reduce((sum, v) => sum + v.stock, 0);
    const hadColours = colours.some((c) => c !== 'Standard');

    onUpdateProduct((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              sizes: invStockSizes,
              colors: hadColours ? colours.filter((c) => c !== 'Standard') : product.colors,
              variants,
              status: invStatus,
              inStock: invStatus !== 'draft' && totalUnits > 0
            }
          : product
      )
    );

    setEditingInventoryId(null);
    onShowToast(`Inventory updated for "${target.name}".`, 'success');
  };

  // Receipt lines handlers
  const handleAddReceiptLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptItemName.trim() || !receiptPrice) {
      onShowToast('Please enter an item name and price.', 'error');
      return;
    }

    const priceNum = Number(receiptPrice);
    const qtyNum = Number(receiptQty) || 1;

    setReceiptLines((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        name: receiptItemName.trim(),
        qty: qtyNum,
        price: priceNum
      }
    ]);

    setReceiptItemName('');
    setReceiptPrice('');
    setReceiptQty('1');
    onShowToast('Item line added to receipt.', 'success');
  };

  const handleRemoveReceiptLine = (id: string) => {
    setReceiptLines((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearReceipt = () => {
    setReceiptLines([]);
    setReceiptCustomer('');
    setReceiptPhone('');
    onShowToast('Receipt cleared.', 'info');
  };

  const receiptTotal = receiptLines.reduce(
    (sum, line) => sum + line.qty * line.price,
    0
  );

  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
    `IB ANASA WEARS | Customer: ${receiptCustomer || 'Walk-in'} | Total: ${formatNaira(
      receiptTotal
    )} | Ref: IB-${Date.now().toString().slice(-6)}`
  )}`;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.cat.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleProductImageUpload = (event: React.ChangeEvent<HTMLInputElement>, productId?: number) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const results: { data: string; name: string }[] = [];

    let loadedCount = 0;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (result) {
          results.push({ data: result, name: file.name });
        }
        loadedCount += 1;

        if (loadedCount === files.length) {
          if (results.length === 0) {
            onShowToast('Image upload failed. Please try a different file.', 'error');
            return;
          }

          if (productId) {
            onUpdateProduct((prev) =>
              prev.map((product) =>
                product.id === productId
                  ? { ...product, img: results[0].data, gallery: [...(product.gallery ?? []), results[0].data] }
                  : product
              )
            );
            onShowToast('Product image updated.', 'success');
          } else {
            setNewProdGallery((prev) => [...prev, ...results.map((r) => r.data)]);
            setNewProdGalleryNames((prev) => [...prev, ...results.map((r) => r.name)]);
            setNewProdImg((prev) => prev || results[0].data);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const startEditingProduct = (product: Product) => {
    setEditingProductId(product.id);
    setEditProductValues({
      name: product.name,
      cat: product.cat,
      sizes: product.sizes.join(', '),
      price: String(product.price)
    });
  };

  const saveEditedProduct = (productId: number) => {
    const trimmedName = editProductValues.name.trim();
    const priceNumber = Number(editProductValues.price);
    const sizesArray = editProductValues.sizes
      .split(',')
      .map((size) => size.trim())
      .filter(Boolean);

    if (!trimmedName) {
      onShowToast('Product name cannot be empty.', 'error');
      return;
    }

    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      onShowToast('Please enter a valid product price.', 'error');
      return;
    }

    onUpdateProduct((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              name: trimmedName,
              cat: editProductValues.cat,
              sizes: sizesArray.length > 0 ? sizesArray : ['One Size'],
              price: priceNumber
            }
          : product
      )
    );

    setEditingProductId(null);
    setEditProductValues({ name: '', cat: 'shirts', sizes: '', price: '' });
    onShowToast('Product updated successfully.', 'success');
  };

  const handleSendNotification = (event: React.FormEvent) => {
    event.preventDefault();
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      onShowToast('Please add both a title and message before sending.', 'error');
      return;
    }

    onCreateNotification({
      title: notificationTitle.trim(),
      message: notificationMessage.trim(),
      type: notificationType
    });

    setNotificationTitle('');
    setNotificationMessage('');
    setNotificationType('news');
    onShowToast('Customer update sent to the notification center.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111111] flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-black text-white shrink-0 flex flex-col justify-between p-5 md:h-screen md:sticky md:top-0 overflow-y-auto">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="border-b border-gray-800 pb-5">
            <div className="flex items-center gap-1.5 text-[8px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-1">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>ADMIN PORTAL</span>
            </div>
            <h2 className="font-display font-black text-xl tracking-tight uppercase">
              IB ANASA WEARS
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">AUCHI SHOWROOM</span>
          </div>

          {/* User Profile Badge (Google SSO Verified) */}
          <div className="bg-gray-900 border border-gray-800 p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs overflow-hidden">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name[0]
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white truncate block">
                  {user.name}
                </span>
                <span className="text-[7px] bg-blue-900/80 text-blue-300 px-1 py-0.2 rounded-xs font-mono font-bold">
                  {user.authMethod === 'google' ? 'CEO' : 'STAFF'}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono truncate block">
                {user.email}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-bold tracking-[0.14em] uppercase">
            <button
              id="adminTabDashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-black font-extrabold shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button
              id="adminTabProducts"
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-white text-black font-extrabold shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Package size={16} />
              <span>Products ({products.length})</span>
            </button>

            <button
              id="adminTabCarts"
              onClick={() => setActiveTab('carts')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left cursor-pointer ${
                activeTab === 'carts'
                  ? 'bg-white text-black font-extrabold shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <ShoppingBag size={16} />
              <span>Customer Carts ({carts.length})</span>
            </button>

            <button
              id="adminTabReceipts"
              onClick={() => setActiveTab('receipts')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left cursor-pointer ${
                activeTab === 'receipts'
                  ? 'bg-white text-black font-extrabold shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Receipt size={16} />
              <span>Generate Receipt</span>
            </button>

            <button
              id="adminTabNotifications"
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-white text-black font-extrabold shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Bell size={16} />
              <span>Messages &amp; News ({notifications.filter((item) => !item.read).length})</span>
            </button>

            {user.role === 'Super Administrator' && (
              <button
                id="adminTabStaff"
                onClick={() => setActiveTab('staff')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left cursor-pointer ${
                  activeTab === 'staff'
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                <Users size={16} />
                <span>Staff Accounts ({staffAccounts.length})</span>
              </button>
            )}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-gray-800 space-y-2">
          <button
            id="adminBackToStoreBtn"
            onClick={onNavigateToStore}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-bold tracking-wider uppercase transition-colors"
          >
            <ExternalLink size={14} />
            <span>Return to Store</span>
          </button>

          <button
            id="adminLogoutBtn"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold tracking-wider uppercase transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main key={activeTab} className="page-enter flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
        {/* VIEW 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Topbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-gray-200 shadow-xs">
              <div>
                <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-black">
                  Store Overview
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Live operational metrics for IB ANASA WEARS showroom &amp; digital dispatch.
                </p>
              </div>

              <button
                id="dashAddProductShortcutBtn"
                onClick={() => setActiveTab('products')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold tracking-widest uppercase transition-all shadow-xs cursor-pointer"
              >
                <Plus size={15} />
                <span>+ Add Product</span>
              </button>
            </div>

            {/* Stat Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                  Total Monthly Revenue
                </span>
                <div className="font-mono text-2xl font-black text-black mt-2">
                  {String.fromCharCode(0x20a6)}2,140,000
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-2">
                  <TrendingUp size={12} />
                  <span>{String.fromCharCode(0x25b2)} +18.4% this month</span>
                </div>
              </div>

              <div className="bg-white p-5 border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                  Total Completed Orders
                </span>
                <div className="font-mono text-2xl font-black text-black mt-2">
                  89 Orders
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-2">
                  <TrendingUp size={12} />
                  <span>{String.fromCharCode(0x25b2)} 11% last 30 days</span>
                </div>
              </div>

              <div className="bg-white p-5 border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                  New Customers
                </span>
                <div className="font-mono text-2xl font-black text-black mt-2">
                  24 Clients
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-2">
                  <Users size={12} />
                  <span>{String.fromCharCode(0x25b2)} +6.2% WhatsApp traffic</span>
                </div>
              </div>

              <div className="bg-white p-5 border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                  Low Stock Warnings
                </span>
                <div className="font-mono text-2xl font-black text-amber-700 mt-2">
                  2 Items
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 mt-2">
                  <AlertTriangle size={12} />
                  <span>Restock recommended</span>
                </div>
              </div>
            </div>

            {/* Middle Grid: Sales Chart & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales Chart */}
              <div className="lg:col-span-2 bg-white p-6 border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-black">
                      Weekly Sales Velocity
                    </h3>
                    <span className="text-[10px] text-gray-400 font-mono">Last 7 Calendar Days</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-black">
                    {String.fromCharCode(0x20a6)}3.6M Gross
                  </span>
                </div>

                {/* Trading-style sales chart */}
                <div className="relative h-56 border border-gray-200 bg-[#0b1110] overflow-hidden">
                  <div className="absolute inset-x-0 top-3 flex justify-between px-3 text-[8px] font-mono text-gray-500">
                    <span>{formatNaira(chartMax)}</span>
                    <span>WEEKLY / NGN</span>
                  </div>
                  <svg viewBox="0 0 700 240" className="absolute inset-0 h-full w-full" role="img" aria-label="Weekly sales velocity line chart">
                    <defs>
                      <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[40, 80, 120, 160, 200].map((y) => (
                      <line key={y} x1="32" x2="668" y1={y} y2={y} stroke="#293532" strokeDasharray="3 5" />
                    ))}
                    {chartPoints.map((point) => (
                      <line key={`${point.day}-vertical`} x1={point.x} x2={point.x} y1="32" y2="202" stroke="#1d2825" />
                    ))}
                    <polygon points={chartArea} fill="url(#salesArea)" />
                    <polyline points={chartLine} fill="none" stroke="#34d399" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                    {chartPoints.map((point) => (
                      <g key={`${point.day}-point`}>
                        <circle cx={point.x} cy={point.y} r={point.active ? 6 : 4} fill="#0b1110" stroke="#34d399" strokeWidth="2" />
                        <text x={point.x} y="222" textAnchor="middle" fill="#94a3a0" fontSize="10" fontFamily="monospace">{point.day}</text>
                      </g>
                    ))}
                    <g transform={`translate(${chartPoints[chartPoints.length - 1].x - 46} ${chartPoints[chartPoints.length - 1].y - 35})`}>
                      <rect width="92" height="22" fill="#34d399" rx="2" />
                      <text x="46" y="15" textAnchor="middle" fill="#06100c" fontSize="10" fontWeight="bold" fontFamily="monospace">{formatNaira(chartDays[chartDays.length - 1].amount)}</text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white p-6 border border-gray-200 shadow-xs">
                <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-black mb-4">
                  Top Ranking Garments
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Nike Air Force 1 Luxe', sold: '31 sold', revenue: `${String.fromCharCode(0x20a6)}2.32M` },
                    { name: 'Essentials Oversized Shirt', sold: '26 sold', revenue: `${String.fromCharCode(0x20a6)}910K` },
                    { name: 'BAPE Shark Full-Zip Hoodie', sold: '18 sold', revenue: `${String.fromCharCode(0x20a6)}1.71M` },
                    { name: 'Balenciaga Camo Slim Jean', sold: '14 sold', revenue: `${String.fromCharCode(0x20a6)}1.68M` }
                  ].map((p, idx) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between pb-2.5 border-b border-gray-100 last:border-b-0"
                    >
                      <div>
                        <div className="text-xs font-bold text-gray-900">{p.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{p.sold}</div>
                      </div>
                      <span className="font-mono text-xs font-bold text-black">{p.revenue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white p-3 sm:p-4 md:p-6 border border-gray-200 shadow-xs">
              <div className="flex flex-col items-center gap-2 mb-3 md:mb-4">
                <h3 className="w-full text-center text-[11px] sm:text-xs font-bold tracking-[0.12em] sm:tracking-[0.14em] uppercase text-black">
                  Recent WhatsApp &amp; Showroom Orders
                </h3>
                <button
                  onClick={() => setActiveTab('carts')}
                  className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-black underline underline-offset-4 hover:text-gray-600"
                >
                  View Active Carts &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-[9px] font-bold tracking-widest text-gray-500 uppercase">
                      <th className="whitespace-nowrap px-3 pb-3 first:pl-1">Order ID</th>
                      <th className="whitespace-nowrap px-3 pb-3">Customer</th>
                      <th className="whitespace-nowrap px-3 pb-3">Date</th>
                      <th className="whitespace-nowrap px-3 pb-3">Items Summary</th>
                      <th className="whitespace-nowrap px-3 pb-3 text-right">Amount</th>
                      <th className="whitespace-nowrap px-3 pb-3 text-right last:pr-1">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-3 py-2 md:py-3 first:pl-1 font-mono font-bold">{ord.id}</td>
                        <td className="whitespace-nowrap px-3 py-2 md:py-3 font-semibold">{ord.customer}</td>
                        <td className="whitespace-nowrap px-3 py-2 md:py-3 font-mono text-gray-500">{ord.date}</td>
                        <td className="min-w-56 px-3 py-2 md:py-3 text-gray-600 max-w-xs truncate">{ord.items}</td>
                        <td className="whitespace-nowrap px-3 py-2 md:py-3 font-mono font-bold text-right">
                          {formatNaira(ord.amount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 md:py-3 text-right last:pr-1">
                          {ord.paymentStatus && (
                            <span className={`mr-1.5 inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase font-mono ${
                              ord.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.paymentStatus === 'failed' || ord.paymentStatus === 'refunded'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ord.paymentStatus}
                            </span>
                          )}
                          <select
                            value={ord.orderStatus || 'pending'}
                            onChange={(event) => onUpdateOrderStatus(ord.id, { orderStatus: event.target.value as OrderStatus })}
                            className="border border-gray-200 bg-white py-1 pl-1 pr-5 text-[9px] font-bold uppercase tracking-wider font-mono"
                            title="Update order status"
                          >
                            {(['pending', 'confirmed', 'processing', 'ready', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map((status) => (
                              <option key={status} value={status}>
                                {status === 'ready' ? 'ready for delivery' : status}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Topbar */}
            <div className="bg-white p-6 border border-gray-200 shadow-xs">
              <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-black">
                Inventory &amp; Garments
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Add newly arrived luxury stock or remove sold out items in real time.
              </p>
            </div>

            {/* Add Product Panel */}
            <div className="bg-white p-6 border border-gray-200 shadow-xs">
              <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-black mb-4 flex items-center gap-2">
                <Plus size={15} />
                <span>Add New Garment to Catalogue</span>
              </h3>

              <form onSubmit={handleCreateProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Product Title
                  </label>
                  <input
                    id="newProductNameInput"
                    type="text"
                    placeholder="e.g. Chrome Hearts Flannel Shirt"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Category
                  </label>
                  <select
                    id="newProductCatSelect"
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white uppercase font-bold"
                  >
                    <option value="shirts">shirts</option>
                    <option value="hoodies">hoodies</option>
                    <option value="trousers">trousers</option>
                    <option value="shorts">shorts</option>
                    <option value="shoes">shoes</option>
                    <option value="slides">slides</option>
                    <option value="caps">caps</option>
                    <option value="belts">belts</option>
                    <option value="bags">bags</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Price ({String.fromCharCode(0x20a6)})
                  </label>
                  <input
                    id="newProductPriceInput"
                    type="number"
                    placeholder="e.g. 65000"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Available Sizes
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleCreateSize(size)}
                        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                          newProdSelectedSizes.includes(size)
                            ? 'bg-black text-white border-black'
                            : 'border-gray-300 text-gray-500 hover:border-black hover:text-black'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5 pt-2">
                    <input
                      id="customSizeInput"
                      type="text"
                      placeholder="Add custom size"
                      value={customSizeInput}
                      onChange={(e) => setCustomSizeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomSize();
                        }
                      }}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={addCustomSize}
                      className="shrink-0 border border-black px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                  {newProdSelectedSizes.length === 0 && (
                    <p className="pt-1 text-[10px] text-amber-700">No sizes selected — defaults to &quot;One Size&quot;.</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Colours
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COLOUR_OPTIONS.map((colour) => (
                      <button
                        key={colour}
                        type="button"
                        onClick={() => toggleCreateColour(colour)}
                        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                          newProdSelectedColours.includes(colour)
                            ? 'bg-black text-white border-black'
                            : 'border-gray-300 text-gray-500 hover:border-black hover:text-black'
                        }`}
                      >
                        {colour}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5 pt-2">
                    <input
                      id="customColourInput"
                      type="text"
                      placeholder="Add custom colour"
                      value={customColourInput}
                      onChange={(e) => setCustomColourInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomColour();
                        }
                      }}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={addCustomColour}
                      className="shrink-0 border border-black px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                  {newProdSelectedColours.length === 0 && (
                    <p className="pt-1 text-[10px] text-amber-700">No colours chosen — stock tracked under &quot;Standard&quot;.</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Badge / Tag
                  </label>
                  <select
                    id="newProductTagSelect"
                    value={newProdTag}
                    onChange={(e) => setNewProdTag(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CAPSULE">CAPSULE</option>
                    <option value="LIMITED">LIMITED</option>
                    <option value="BESTSELLER">BESTSELLER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Product Images (add multiple)
                  </label>
                  <div className="space-y-2">
                    <input
                      id="newProductImgInput"
                      type="url"
                      placeholder="https://... (optional fallback image)"
                      value={newProdImg}
                      onChange={(e) => setNewProdImg(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white"
                    />
                    <label className="inline-flex cursor-pointer items-center gap-2 border border-black px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors">
                      <Plus size={14} />
                      <span>Upload image(s)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(event) => handleProductImageUpload(event)}
                      />
                    </label>

                    {newProdGallery.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {newProdGallery.map((src, index) => (
                          <div key={index} className="relative">
                            <img
                              src={src}
                              alt={`Product image ${index + 1}`}
                              className="h-16 w-16 object-cover border border-gray-200 bg-white"
                            />
                            <button
                              type="button"
                              className="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white shadow-sm hover:bg-red-600 transition-colors"
                              title="Remove image"
                              onClick={() => {
                                setNewProdGallery((prev) => prev.filter((_, i) => i !== index));
                                setNewProdGalleryNames((prev) => prev.filter((_, i) => i !== index));
                              }}
                            >
                              <X size={12} />
                            </button>
                            {index === 0 && (
                              <span className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[7px] font-bold uppercase tracking-widest text-center py-0.5">
                                Cover
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      (newProdImg || newProdImageName) && (
                        <div className="flex items-center gap-3 rounded-none border border-gray-200 bg-gray-50 p-2">
                          <img
                            src={newProdImg || '/images/essentials polo.jpg'}
                            alt="Product preview"
                            className="h-16 w-16 object-cover border border-gray-200 bg-white"
                          />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-700">Preview</p>
                            <p className="truncate text-[10px] text-gray-500">{newProdImageName || 'Image will be used for the listing'}</p>
                          </div>
                        </div>
                      )
                    )}
                    {newProdGalleryNames.length > 0 && (
                      <p className="text-[10px] text-gray-500">
                        {newProdGallery.length} image{newProdGallery.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] uppercase text-black">
                      <Package size={15} />
                      <span>Inventory — stock per colour × size</span>
                    </div>
                    <span className="text-[10px] text-gray-500 hidden sm:inline">
                      Leave 0 for unavailable combinations
                    </span>
                  </div>
                  <div className="overflow-x-auto border border-gray-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-[9px] font-bold tracking-widest text-gray-500 uppercase">
                          <th className="whitespace-nowrap px-3 py-2">Colour \ Size</th>
                          {newProdSelectedSizes.map((size) => (
                            <th key={size} className="whitespace-nowrap px-3 py-2">{size}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(newProdSelectedColours.length ? newProdSelectedColours : ['Standard']).map((colour) => (
                          <tr key={colour} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-3 py-2 font-bold uppercase text-[10px]">{colour}</td>
                            {newProdSelectedSizes.map((size) => (
                              <td key={size} className="px-2 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={newProdStockMatrix[colour]?.[size] ?? 0}
                                  onChange={(e) => setCreateStock(colour, size, Number(e.target.value))}
                                  className="w-16 border border-gray-300 bg-white px-2 py-1 font-mono text-[11px] focus:outline-none focus:border-black"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-1.5 text-[10px] text-gray-500">
                    Stock is shown to customers as-is and is reduced automatically after a confirmed payment — not when items are added to cart.
                  </p>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 pt-2 flex flex-wrap gap-3">
                  <button
                    id="submitNewProductBtn"
                    type="submit"
                    className="px-8 py-3 bg-black hover:bg-gray-800 text-white font-bold text-xs tracking-[0.2em] uppercase transition-all shadow-md cursor-pointer"
                  >
                    + Publish to Live Store
                  </button>
                  <button
                    id="saveDraftProductBtn"
                    type="button"
                    onClick={() => createProduct('draft')}
                    className="px-8 py-3 border border-black text-black hover:bg-black hover:text-white font-bold text-xs tracking-[0.2em] uppercase transition-all cursor-pointer"
                  >
                    Save as Draft
                  </button>
                </div>
              </form>
            </div>

            {/* Edit Inventory Panel */}
            {editingInventoryId !== null && (() => {
              const target = products.find((p) => p.id === editingInventoryId);
              if (!target) return null;
              return (
                <div className="bg-white p-6 border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-black flex items-center gap-2">
                        <Package size={15} />
                        <span>Inventory — {target.name}</span>
                      </h3>
                      <p className="mt-1 text-[10px] text-gray-500">
                        Adjust stock per colour × size. These numbers are what customers see and what the backend decrements after a paid order.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingInventoryId(null)}
                      className="p-1.5 text-gray-400 hover:text-black transition-colors"
                      aria-label="Close inventory editor"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border border-gray-200 bg-gray-50 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Status</span>
                    <select
                      value={invStatus}
                      onChange={(e) => setInvStatus(e.target.value as ProductStatus)}
                      className="border border-gray-300 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                    >
                      <option value="active">Active — visible &amp; purchasable</option>
                      <option value="out_of_stock">Out of stock — visible, not purchasable</option>
                      <option value="draft">Draft — hidden</option>
                      <option value="archived">Archived — hidden, history kept</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto border border-gray-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-[9px] font-bold tracking-widest text-gray-500 uppercase">
                          <th className="whitespace-nowrap px-3 py-2">Colour \ Size</th>
                          {invStockSizes.map((size) => (
                            <th key={size} className="whitespace-nowrap px-3 py-2">{size}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(invStockColours.length ? invStockColours : ['Standard']).map((colour) => (
                          <tr key={colour} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-3 py-2 font-bold uppercase text-[10px]">{colour}</td>
                            {invStockSizes.map((size) => (
                              <td key={size} className="px-2 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={invStockMatrix[colour]?.[size] ?? 0}
                                  onChange={(e) => setInvStock(colour, size, Number(e.target.value))}
                                  className="w-16 border border-gray-300 bg-white px-2 py-1 font-mono text-[11px] focus:outline-none focus:border-black"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => saveEditedInventory(editingInventoryId)}
                      className="inline-flex items-center gap-2 bg-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <Check size={14} />
                      Save Inventory
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingInventoryId(null)}
                      className="border border-gray-300 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-700 hover:border-black hover:text-black transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Current Inventory Table */}
            <div className="bg-white p-6 border border-gray-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-black">
                    Current Showroom Stock ({filteredProducts.length} Items)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter inventory..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 focus:outline-none focus:border-black"
                  />
                  </div>
                  <div className="flex shrink-0 border border-gray-200">
                    <button type="button" onClick={() => setInventoryView('list')} className={`p-2 ${inventoryView === 'list' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`} aria-label="List view" title="List view"><List size={15} /></button>
                    <button type="button" onClick={() => setInventoryView('grid')} className={`p-2 ${inventoryView === 'grid' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`} aria-label="Grid view" title="Grid view"><LayoutGrid size={15} /></button>
                  </div>
                </div>
              </div>

              {inventoryView === 'list' ? <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-[9px] font-bold tracking-widest text-gray-500 uppercase">
                      <th className="whitespace-nowrap px-3 pb-3 first:pl-1">Product Item</th>
                      <th className="whitespace-nowrap px-3 pb-3">Category</th>
                      <th className="whitespace-nowrap px-3 pb-3">Sizes</th>
                      <th className="whitespace-nowrap px-3 pb-3">Stock</th>
                      <th className="whitespace-nowrap px-3 pb-3">Price</th>
                      <th className="whitespace-nowrap px-3 pb-3 text-right last:pr-1">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((prod) => {
                      const isEditing = editingProductId === prod.id;

                      return (
                        <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                          <td className="min-w-64 px-3 py-3 first:pl-1">
                            {isEditing ? (
                              <input
                                value={editProductValues.name}
                                onChange={(event) => setEditProductValues((prev) => ({ ...prev, name: event.target.value }))}
                                className="w-full border border-gray-300 bg-white px-2 py-1.5 text-sm font-bold text-gray-900"
                              />
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 shrink-0 overflow-hidden">
                                  <img src={prod.img} alt={prod.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900">{prod.name}</div>
                                  <span className="font-mono text-[9px] text-gray-400">REF. #{1000 + prod.id}</span>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 uppercase font-bold text-[10px] text-gray-600">
                            {isEditing ? (
                              <select
                                value={editProductValues.cat}
                                onChange={(event) => setEditProductValues((prev) => ({ ...prev, cat: event.target.value }))}
                                className="border border-gray-300 bg-white px-2 py-1.5 text-[10px] font-bold uppercase"
                              >
                                <option value="shirts">shirts</option>
                                <option value="hoodies">hoodies</option>
                                <option value="trousers">trousers</option>
                                <option value="shorts">shorts</option>
                                <option value="shoes">shoes</option>
                                <option value="slides">slides</option>
                                <option value="caps">caps</option>
                                <option value="belts">belts</option>
                                <option value="bags">bags</option>
                              </select>
                            ) : (
                              prod.cat
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px]">
                            {isEditing ? (
                              <input
                                value={editProductValues.sizes}
                                onChange={(event) => setEditProductValues((prev) => ({ ...prev, sizes: event.target.value }))}
                                className="w-32 border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-mono"
                              />
                            ) : (
                              prod.sizes.join(' / ')
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            {(() => {
                              const stock = countProductStock(prod);
                              const label = stock === null ? '—' : `${stock} units`;
                              return (
                                <span className={`font-mono text-[11px] font-bold ${
                                  stock === 0 ? 'text-red-600' : 'text-gray-800'
                                }`}>
                                  {label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-mono font-bold">
                            {isEditing ? (
                              <input
                                value={editProductValues.price}
                                onChange={(event) => setEditProductValues((prev) => ({ ...prev, price: event.target.value }))}
                                className="w-24 border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-mono"
                              />
                            ) : (
                              formatNaira(prod.price)
                            )}
                          </td>
                          <td className="px-3 py-3 text-right last:pr-1">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveEditedProduct(prod.id)}
                                  className="inline-flex items-center gap-1 border border-green-600 bg-green-50 px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-green-700 hover:bg-green-100"
                                >
                                  <Check size={12} />
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingProductId(null)}
                                  className="border border-gray-300 px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-700 hover:border-black hover:text-black"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditingProduct(prod)}
                                  className="inline-flex items-center gap-1 border border-gray-300 px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-700 hover:border-black hover:text-black transition-colors"
                                >
                                  <Pencil size={12} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openInventoryEditor(prod)}
                                  className="inline-flex items-center gap-1 border border-gray-300 px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-700 hover:border-black hover:text-black transition-colors"
                                  title="Edit per-size/per-colour stock"
                                >
                                  <Package size={12} />
                                  <span>Inventory</span>
                                </button>
                                <label className="inline-flex cursor-pointer items-center gap-1 border border-gray-300 px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-700 hover:border-black hover:text-black transition-colors" title="Update image">
                                  <Plus size={12} />
                                  <span>Image</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => handleProductImageUpload(event, prod.id)}
                                  />
                                </label>
                                <div className="h-8 w-8 overflow-hidden border border-gray-200 bg-gray-50">
                                  <img src={prod.img} alt={prod.name} className="h-full w-full object-cover" />
                                </div>
                                <button
                                  id={`deleteProductBtn-${prod.id}`}
                                  onClick={() => {
                                    Swal.fire({
                                      title: 'Remove Product?',
                                      text: `Remove "${prod.name}" from store inventory?`,
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonText: 'Yes, remove it',
                                      cancelButtonText: 'Cancel',
                                      confirmButtonColor: '#000000',
                                      cancelButtonColor: '#6b7280',
                                      reverseButtons: true,
                                      customClass: {
                                        popup: 'font-sans rounded-none border border-gray-200 shadow-2xl',
                                        title: 'text-lg font-bold',
                                        confirmButton: 'rounded-none text-xs font-bold uppercase tracking-widest',
                                        cancelButton: 'rounded-none text-xs font-bold uppercase tracking-widest'
                                      }
                                    }).then((result) => {
                                      if (result.isConfirmed) {
                                        onDeleteProduct(prod.id);
                                        onShowToast(`Removed ${prod.name}`, 'info');
                                      }
                                    });
                                  }}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((prod) => {
                  const isEditing = editingProductId === prod.id;

                  return (
                    <article key={prod.id} className="border border-gray-200 p-3 flex gap-3 hover:border-black transition-colors">
                      <div className="w-20 h-24 bg-gray-100 shrink-0 overflow-hidden"><img src={prod.img} alt={prod.name} className="w-full h-full object-cover" /></div>
                      <div className="min-w-0 flex-1 flex flex-col justify-between">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              value={editProductValues.name}
                              onChange={(event) => setEditProductValues((prev) => ({ ...prev, name: event.target.value }))}
                              className="w-full border border-gray-300 bg-white px-2 py-1 text-sm font-bold text-gray-900"
                            />
                            <select
                              value={editProductValues.cat}
                              onChange={(event) => setEditProductValues((prev) => ({ ...prev, cat: event.target.value }))}
                              className="w-full border border-gray-300 bg-white px-2 py-1 text-[10px] font-bold uppercase"
                            >
                              <option value="shirts">shirts</option>
                              <option value="hoodies">hoodies</option>
                              <option value="trousers">trousers</option>
                              <option value="shorts">shorts</option>
                              <option value="shoes">shoes</option>
                              <option value="slides">slides</option>
                              <option value="caps">caps</option>
                              <option value="belts">belts</option>
                              <option value="bags">bags</option>
                            </select>
                            <input
                              value={editProductValues.sizes}
                              onChange={(event) => setEditProductValues((prev) => ({ ...prev, sizes: event.target.value }))}
                              className="w-full border border-gray-300 bg-white px-2 py-1 text-[10px] font-mono"
                            />
                            <input
                              value={editProductValues.price}
                              onChange={(event) => setEditProductValues((prev) => ({ ...prev, price: event.target.value }))}
                              className="w-full border border-gray-300 bg-white px-2 py-1 text-[10px] font-mono"
                            />
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-sm leading-tight">{prod.name}</p>
                            <p className="mt-1 text-[10px] uppercase font-bold text-gray-500">{prod.cat}</p>
                            <p className="mt-2 text-[10px] text-gray-500">Sizes: <span className="font-mono text-black">{prod.sizes.join(' / ')}</span></p>
                            <p className="text-[10px] text-gray-500">Colors: <span className="text-black">{prod.colors?.join(', ') || 'Standard'}</span></p>
                            <p className="text-[10px] text-gray-500">Stock: <span className={`font-mono text-black ${countProductStock(prod) === 0 ? '!text-red-600' : ''}`}>{countProductStock(prod) === null ? '—' : `${countProductStock(prod)} units`}</span></p>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                          {isEditing ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <button type="button" onClick={() => saveEditedProduct(prod.id)} className="inline-flex items-center gap-1 border border-green-600 bg-green-50 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-green-700 hover:bg-green-100">
                                <Check size={10} />
                                Save
                              </button>
                              <button type="button" onClick={() => setEditingProductId(null)} className="border border-gray-300 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-700 hover:border-black hover:text-black">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono text-xs font-bold">{formatNaira(prod.price)}</span>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="h-10 w-10 overflow-hidden border border-gray-200 bg-gray-50">
                              <img src={prod.img} alt={prod.name} className="h-full w-full object-cover" />
                            </div>
                            {isEditing ? null : (
                              <>
                                <button type="button" onClick={() => startEditingProduct(prod)} className="inline-flex items-center gap-1 border border-gray-300 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-700 hover:border-black hover:text-black transition-colors">
                                  <Pencil size={10} />
                                  Edit
                                </button>
                                <button type="button" onClick={() => openInventoryEditor(prod)} className="inline-flex items-center gap-1 border border-gray-300 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-700 hover:border-black hover:text-black transition-colors" title="Edit per-size/per-colour stock">
                                  <Package size={10} />
                                  <span>Inventory</span>
                                </button>
                                <label className="inline-flex cursor-pointer items-center gap-1 border border-gray-300 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-700 hover:border-black hover:text-black transition-colors" title="Update image">
                                  <Plus size={10} />
                                  <span>Image</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => handleProductImageUpload(event, prod.id)}
                                  />
                                </label>
                              </>
                            )}
                            {!isEditing && (
                              <button type="button" onClick={() => {
                                  Swal.fire({
                                    title: 'Remove Product?',
                                    text: `Remove "${prod.name}" from store inventory?`,
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonText: 'Yes, remove it',
                                    cancelButtonText: 'Cancel',
                                    confirmButtonColor: '#000000',
                                    cancelButtonColor: '#6b7280',
                                    reverseButtons: true,
                                    customClass: {
                                      popup: 'font-sans rounded-none border border-gray-200 shadow-2xl',
                                      title: 'text-lg font-bold',
                                      confirmButton: 'rounded-none text-xs font-bold uppercase tracking-widest',
                                      cancelButton: 'rounded-none text-xs font-bold uppercase tracking-widest'
                                    }
                                  }).then((result) => {
                                    if (result.isConfirmed) {
                                      onDeleteProduct(prod.id);
                                      onShowToast(`Removed ${prod.name}`, 'info');
                                    }
                                  });
                                }} className="p-1.5 text-red-600 hover:bg-red-50" title="Delete Product"><Trash2 size={15} /></button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>}
            </div>
          </div>
        )}

        {/* VIEW 3: CUSTOMER CARTS */}
        {activeTab === 'carts' && (
          <div className="space-y-6">
            <div className="bg-white p-6 border border-gray-200 shadow-xs">
              <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-black">
                Customer Carts Monitor
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Real-time active shopping bags and items selected by shoppers.
              </p>
            </div>

            <div className="bg-white p-3 sm:p-4 md:p-6 border border-gray-200 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-[9px] font-bold tracking-widest text-gray-500 uppercase">
                      <th className="whitespace-nowrap px-3 pb-3 first:pl-1">Customer</th>
                      <th className="whitespace-nowrap px-3 pb-3">Phone</th>
                      <th className="whitespace-nowrap px-3 pb-3">Items Count</th>
                      <th className="whitespace-nowrap px-3 pb-3">Cart Subtotal</th>
                      <th className="whitespace-nowrap px-3 pb-3">Last Active</th>
                      <th className="whitespace-nowrap px-3 pb-3 text-right last:pr-1">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {carts.map((cart) => {
                      const total = cart.items.reduce((s, i) => s + i.qty * i.price, 0);
                      const totalQty = cart.items.reduce((s, i) => s + i.qty, 0);
                      return (
                        <tr key={cart.id} className="hover:bg-gray-50 transition-colors">
                          <td className="whitespace-nowrap px-3 py-2 md:py-3.5 first:pl-1 font-bold text-gray-900">{cart.name}</td>
                          <td className="whitespace-nowrap px-3 py-2 md:py-3.5 font-mono text-gray-600">{cart.phone}</td>
                          <td className="whitespace-nowrap px-3 py-2 md:py-3.5 font-mono">{totalQty} item{totalQty > 1 ? 's' : ''}</td>
                          <td className="whitespace-nowrap px-3 py-2 md:py-3.5 font-mono font-bold text-black">{formatNaira(total)}</td>
                          <td className="whitespace-nowrap px-3 py-2 md:py-3.5 font-mono text-[10px] text-gray-500">{cart.active}</td>
                          <td className="whitespace-nowrap px-3 py-2 md:py-3.5 text-right last:pr-1">
                            <button
                              id={`inspectCartBtn-${cart.id}`}
                              onClick={() => setInspectedCart(cart)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-black underline underline-offset-2 hover:text-gray-600"
                            >
                              <Eye size={12} />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cart Inspector Modal */}
            {inspectedCart && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md p-6 shadow-2xl border border-gray-200 space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wide">
                        {inspectedCart.name}&apos;s Bag
                      </h4>
                      <span className="font-mono text-xs text-gray-500">{inspectedCart.phone}</span>
                    </div>
                    <button onClick={() => setInspectedCart(null)} className="p-1 text-gray-400 hover:text-black">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {inspectedCart.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 bg-gray-50">
                        <div>
                          <span className="font-semibold">{item.name}</span>
                          <span className="text-gray-500 text-[10px] block">Qty: {item.qty}</span>
                        </div>
                        <span className="font-mono font-bold">{formatNaira(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center font-bold">
                    <span className="text-xs uppercase tracking-wider">Subtotal</span>
                    <span className="font-mono text-base">
                      {formatNaira(inspectedCart.items.reduce((s, i) => s + i.qty * i.price, 0))}
                    </span>
                  </div>

                  <a
                    href={`https://wa.me/234${inspectedCart.phone.replace(/[^0-9]/g, '').slice(-10)}?text=Hello%20${encodeURIComponent(inspectedCart.name)}!%20From%20IB%20ANASA%20WEARS.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase text-center block"
                  >
                    Contact Client on WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: STAFF ACCOUNTS */}
        {activeTab === 'staff' && user.role === 'Super Administrator' && (
          <div className="space-y-6">
            <div className="bg-white p-6 border border-gray-200 shadow-xs">
              <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-black">Staff Accounts</h1>
              <p className="text-xs text-gray-500 mt-1">Remove access when a staff member no longer works with the business.</p>
            </div>
            <div className="bg-white border border-gray-200 shadow-xs">
              {staffAccounts.length === 0 ? (
                <p className="p-6 text-xs text-gray-500">No staff accounts have been created yet. Staff can register from the admin sign-in screen.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {staffAccounts.map((staff) => (
                    <div key={staff.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5">
                      <div>
                        <p className="text-sm font-bold uppercase">{staff.name}</p>
                        <p className="text-xs text-gray-500">{staff.email} · {staff.role}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Created {new Date(staff.createdAt).toLocaleDateString('en-GB')}</p>
                      </div>
                      <button
                        onClick={() => setStaffPendingDeletion(staff)}
                        className="flex items-center justify-center gap-2 border border-red-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Delete account
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {staffPendingDeletion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="deleteStaffTitle">
            <div className="w-full max-w-md bg-white p-6 shadow-2xl">
              <h2 id="deleteStaffTitle" className="font-display text-xl font-black uppercase tracking-tight">Delete staff account?</h2>
              <p className="mt-3 text-sm text-gray-600">
                Are you sure you want to delete {staffPendingDeletion.name} account?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setStaffPendingDeletion(null)}
                  className="border border-gray-300 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-700 hover:border-black hover:text-black"
                >
                  No
                </button>
                <button
                  onClick={() => {
                    onDeleteStaff(staffPendingDeletion.id);
                    setStaffPendingDeletion(null);
                  }}
                  className="bg-red-700 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-red-800"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: MESSAGES & NEWS */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white p-6 border border-gray-200 shadow-xs">
              <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-black">
                Send News &amp; Messages
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Push updates, launch notes, and customer alerts directly to each client&apos;s notifications panel.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
              <form onSubmit={handleSendNotification} className="bg-white p-6 border border-gray-200 shadow-xs space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    placeholder="New capsule drop is live"
                    className="w-full px-3 py-2.5 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Message Type
                  </label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value as CustomerNotification['type'])}
                    className="w-full px-3 py-2.5 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white uppercase font-bold"
                  >
                    <option value="news">News</option>
                    <option value="message">Message</option>
                    <option value="alert">Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Body Message
                  </label>
                  <textarea
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    rows={6}
                    placeholder="Tell your customers about the new arrival, restock, promotion, or essential store update..."
                    className="w-full px-3 py-2.5 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white font-bold text-[10px] tracking-[0.2em] uppercase transition-all"
                >
                  <Send size={14} />
                  Send to Customers
                </button>
              </form>

              <div className="bg-white p-6 border border-gray-200 shadow-xs">
                <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-black mb-4 flex items-center gap-2">
                  <Bell size={15} />
                  Recent Broadcasts
                </h3>

                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-500">No messages have been sent yet.</p>
                  ) : (
                    notifications.slice(0, 5).map((item) => (
                      <div key={item.id} className="border border-gray-200 p-3 bg-gray-50">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="inline-flex border border-gray-200 bg-white px-2 py-1 text-[8px] font-bold uppercase tracking-[0.15em] text-gray-700">
                            {item.type}
                          </span>
                          {!item.read && <span className="h-2 w-2 rounded-full bg-red-500" />}
                        </div>
                        <p className="text-sm font-bold uppercase tracking-tight text-black">{item.title}</p>
                        <p className="mt-2 text-xs text-gray-600 leading-relaxed">{item.message}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-gray-500">
                          {new Date(item.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: GENERATE RECEIPT */}
        {activeTab === 'receipts' && (
          <div className="space-y-6">
            <div className="bg-white p-6 border border-gray-200 shadow-xs">
              <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-black">
                Itemized Receipt Generator
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Build and print formal thermal store receipts with dynamic QR code verification.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Form: Order Details */}
              <div className="bg-white p-6 border border-gray-200 shadow-xs space-y-4">
                <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-black border-b border-gray-200 pb-3">
                  Receipt Customer &amp; Item Breakdown
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Customer Name
                    </label>
                    <input
                      id="receiptCustomerInput"
                      type="text"
                      placeholder="e.g. Chuka Okafor"
                      value={receiptCustomer}
                      onChange={(e) => setReceiptCustomer(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Customer Phone Number
                    </label>
                    <input
                      id="receiptPhoneInput"
                      type="text"
                      placeholder="0813 000 0000"
                      value={receiptPhone}
                      onChange={(e) => setReceiptPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>

                <form onSubmit={handleAddReceiptLine} className="border-t border-gray-100 pt-4 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Item / Garment Name
                    </label>
                    <input
                      id="receiptItemInput"
                      type="text"
                      placeholder="e.g. BAPE Shark Hoodie (XL)"
                      value={receiptItemName}
                      onChange={(e) => setReceiptItemName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Quantity
                      </label>
                      <input
                        id="receiptQtyInput"
                        type="number"
                        min="1"
                        value={receiptQty}
                        onChange={(e) => setReceiptQty(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Unit Price ({String.fromCharCode(0x20a6)})
                      </label>
                      <input
                        id="receiptPriceInput"
                        type="number"
                        placeholder="95000"
                        value={receiptPrice}
                        onChange={(e) => setReceiptPrice(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-black bg-gray-50 focus:bg-white font-mono"
                      />
                    </div>
                  </div>

                  <button
                    id="addReceiptLineBtn"
                    type="submit"
                    className="w-full py-2.5 bg-black hover:bg-gray-800 text-white font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    + Add Item Line to Receipt
                  </button>
                </form>
              </div>

              {/* Right: Printable Thermal Receipt Paper */}
              <div className="space-y-4">
                <div
                  id="printableReceipt"
                  className="bg-white p-8 border border-gray-300 shadow-md font-mono text-xs max-w-sm mx-auto space-y-4 text-black relative"
                >
                  {/* Store Header */}
                  <div className="text-center space-y-1">
                    <h2 className="font-display font-black text-xl tracking-tight uppercase">
                      IB ANASA WEARS
                    </h2>
                    <p className="text-[10px] text-gray-600">
                      Shop 7, Opp MTN Office, Auchi, Edo State
                    </p>
                    <p className="text-[10px] text-gray-600">
                      Tel: 0813 894 7979 &bull; Luxury Only
                    </p>
                  </div>

                  <hr className="border-t border-dashed border-gray-400" />

                  {/* Customer Meta */}
                  <div className="flex justify-between text-[11px]">
                    <div>
                      <span className="text-gray-500 block text-[9px]">CUSTOMER</span>
                      <span className="font-bold">{receiptCustomer.trim() || 'Walk-in Customer'}</span>
                      {receiptPhone && <span className="block text-[10px] text-gray-500">{receiptPhone}</span>}
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 block text-[9px]">DATE</span>
                      <span>{new Date().toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>

                  <hr className="border-t border-dashed border-gray-400" />

                  {/* Receipt Lines */}
                  <div className="space-y-2 min-h-[60px]">
                    {receiptLines.length === 0 ? (
                      <p className="text-center text-gray-400 py-4 text-[10px]">
                        No items added yet. Enter items on the left.
                      </p>
                    ) : (
                      receiptLines.map((item) => (
                        <div key={item.id} className="flex justify-between items-start text-xs group">
                          <div className="flex-1 pr-2">
                            <span>{item.name}</span>
                            <span className="text-[10px] text-gray-500 block">
                              {item.qty} x {formatNaira(item.price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{formatNaira(item.qty * item.price)}</span>
                            <button
                              onClick={() => handleRemoveReceiptLine(item.id)}
                              className="text-red-500 hover:text-red-700 opacity-60 group-hover:opacity-100 print:hidden text-xs"
                              title="Delete line"
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <hr className="border-t border-dashed border-gray-400" />

                  {/* Total */}
                  <div className="flex justify-between items-center text-sm font-bold pt-1">
                    <span>TOTAL DUE</span>
                    <span className="text-base">{formatNaira(receiptTotal)}</span>
                  </div>

                  <hr className="border-t border-dashed border-gray-400" />

                  {/* QR Code Verification */}
                  {receiptLines.length > 0 && (
                    <div className="text-center pt-2 space-y-1">
                      <img
                        src={qrDataUrl}
                        alt="Verification QR code"
                        className="w-24 h-24 mx-auto border border-gray-200 p-1"
                      />
                      <span className="text-[8px] text-gray-400 tracking-widest uppercase block">
                        SCAN TO VERIFY OFFICIAL ORDER
                      </span>
                    </div>
                  )}

                  <div className="text-center text-[9px] text-gray-400 pt-2">
                    THANK YOU FOR CHOOSING IB ANASA WEARS
                  </div>
                </div>

                {/* Print and Clear Actions */}
                {receiptLines.length > 0 && (
                  <div className="flex gap-3 max-w-sm mx-auto">
                    <button
                      id="printReceiptBtn"
                      onClick={() => window.print()}
                      className="flex-1 py-3 bg-black hover:bg-gray-800 text-white font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Printer size={15} />
                      <span>Print Thermal Receipt</span>
                    </button>

                    <button
                      id="clearReceiptBtn"
                      onClick={handleClearReceipt}
                      className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center cursor-pointer"
                      title="Clear"
                    >
                      <RotateCcw size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
