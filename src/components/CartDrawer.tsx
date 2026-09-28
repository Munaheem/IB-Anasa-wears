import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, CreditCard } from 'lucide-react';
import { CartItem } from '../types';
import { formatNaira } from '../data/initialData';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: number, size: string, color: string | undefined, delta: number) => void;
  onRemoveItem: (productId: number, size: string, color: string | undefined) => void;
  onClearCart: () => void;
  onExploreCatalog: () => void;
  onCheckout: () => void;
  deliveryFee: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onExploreCatalog,
  onCheckout,
  deliveryFee
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0
  );

  const grandTotal = subtotal + deliveryFee;

  const totalItemCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div
      id="cartDrawerOverlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="cartDrawerContainer"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={18} className="text-black" />
            <h3 className="font-display font-black text-lg tracking-wider uppercase">
              Shopping Bag
            </h3>
            <span className="font-mono text-xs text-gray-500 font-bold">[{totalItemCount}]</span>
          </div>

          <button
            id="closeCartDrawerBtn"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-black transition-colors"
            aria-label="Close shopping bag"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body / Cart Items */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <ShoppingBag size={28} />
              </div>
              <div>
                <p className="font-bold text-xs uppercase tracking-[0.2em] text-gray-800">
                  Your bag is currently empty
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Discover our exclusive shirts, tailored trousers, statement hoodies, and footwear capsule.
                </p>
              </div>
              <button
                id="cartEmptyExploreBtn"
                onClick={() => {
                  onClose();
                  onExploreCatalog();
                }}
                className="px-6 py-2.5 bg-black text-white text-[11px] font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors"
              >
                Browse Catalogue
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}-${item.color || 'standard'}`}
                  className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0 group"
                >
                  {/* Thumbnail */}
                  <div className="w-20 aspect-3/4 bg-gray-100 overflow-hidden shrink-0">
                    <img
                      src={item.product.img}
                      alt={item.product.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-gray-900 uppercase leading-snug">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.product.id, item.size, item.color)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-0.5"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="text-[10px] font-mono text-gray-500 uppercase mt-0.5">
                        SIZE: <span className="font-bold text-black">{item.size}</span>
                        <span className="mx-1">&middot;</span>
                        COLOR: <span className="font-bold text-black">{item.color || 'Standard'}</span>
                        <span className="mx-1">&middot;</span> {item.product.cat}
                      </div>

                      <div className="font-mono text-xs font-bold text-black mt-1">
                        {formatNaira(item.product.price)}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center border border-gray-200">
                        <button
                          onClick={() => onUpdateQty(item.product.id, item.size, item.color, -1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 text-gray-600 text-xs"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-8 text-center font-mono text-xs font-bold">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => onUpdateQty(item.product.id, item.size, item.color, 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 text-gray-600 text-xs"
                          aria-label="Increase quantity"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <span className="font-mono text-xs font-bold text-black">
                        {formatNaira(item.product.price * item.qty)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer & Checkout */}
        {items.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-gray-200 bg-gray-50 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold tracking-widest uppercase">
                <span>Subtotal</span>
                <span className="font-mono text-sm font-bold text-black">
                  {formatNaira(subtotal)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold tracking-widest uppercase">
                <span>Delivery</span>
                <span className="font-mono text-sm font-bold text-gray-700">
                  {deliveryFee > 0 ? formatNaira(deliveryFee) : 'TBD'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold tracking-widest uppercase pt-1.5 border-t border-gray-200">
                <span>Total</span>
                <span className="font-mono text-base font-black text-black">
                  {formatNaira(grandTotal)}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>Instant dispatch via Auchi Showroom or Logistics</span>
              </p>
            </div>

            <div className="space-y-2">
              <button
                id="cartCheckoutBtn"
                onClick={onCheckout}
                className="w-full py-3.5 bg-black text-white font-bold text-xs tracking-[0.2em] uppercase hover:bg-gray-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <CreditCard size={16} />
                <span>Checkout securely</span>
              </button>

              <button
                onClick={onClearCart}
                className="w-full py-2 text-[10px] text-gray-400 hover:text-black uppercase tracking-wider transition-colors"
              >
                Clear Shopping Bag
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
