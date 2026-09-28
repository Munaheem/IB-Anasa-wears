export type ProductCategory =
  | 'all'
  | 'shirts'
  | 'hoodies'
  | 'trousers'
  | 'shorts'
  | 'shoes'
  | 'slides'
  | 'caps'
  | 'belts'
  | 'bags';

export type ProductStatus = 'active' | 'out_of_stock' | 'draft' | 'archived';

export interface ProductVariant {
  id: string;
  size: string;
  colour?: string;
  price?: number;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  cat: ProductCategory | string;
  price: number;
  img: string;
  altImg?: string;
  gallery?: string[];
  sizes: string[];
  colors?: string[];
  regionalSizes?: {
    EU: string[];
    UK: string[];
    US: string[];
  };
  description?: string;
  composition?: string;
  tag?: 'NEW' | 'CAPSULE' | 'LIMITED' | 'BESTSELLER';
  inStock?: boolean;
  status?: ProductStatus;
  featured?: boolean;
  newArrival?: boolean;
  dateAdded?: string;
  stock?: Record<string, number>;
  variants?: ProductVariant[];
}

export interface CartItem {
  id: number;
  product: Product;
  size: string;
  color?: string;
  qty: number;
}

export interface SavedAddress {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  country: string;
}

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  reference: string;
}

export interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  addresses: SavedAddress[];
  savedCards: SavedCard[];
  createdAt: string;
  password?: string;
  signedInAt?: string;
}

export interface CustomerCredential {
  name: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
}

export interface CustomerCart {
  id: string;
  name: string;
  phone: string;
  items: { name: string; qty: number; price: number }[];
  active: string;
  date: string;
}

export interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  type: 'news' | 'message' | 'alert';
  createdAt: string;
  read: boolean;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber?: string;
  customer: string;
  phone?: string;
  email?: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'cancelled';
  shippingStatus?: 'Processing' | 'Ready for dispatch' | 'Shipped' | 'Delivered';
  paymentReference?: string;
  shippingAddress?: SavedAddress;
  items?: string;
  subtotal?: number;
  deliveryFee?: number;
  deliveryNotes?: string;
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatus;
  updatedAt?: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface AdminUser {
  email: string;
  name: string;
  picture?: string;
  role: string;
  authMethod: 'google' | 'password';
  signedInAt: string;
}

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
}

export type NavPage = 'home' | 'shop' | 'about' | 'admin';
export type AdminTab = 'dashboard' | 'products' | 'carts' | 'receipts' | 'staff' | 'notifications';
export type GridDensity = 'cols-1' | 'cols-2' | 'cols-4';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}
