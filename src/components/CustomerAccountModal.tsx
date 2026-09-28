import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, CreditCard, Gift, Lock, LogOut, MapPin, Package, Pencil, Plus, ShieldCheck, Star, Trash2, User, X } from 'lucide-react';
import { CartItem, CustomerAccount, Order, SavedAddress, SavedCard } from '../types';
import { formatNaira } from '../data/initialData';
import { isPaystackConfigured, payWithPaystack } from '../lib/paystack';
import { buildCheckoutPayload, createOrderAtBackend, isBackendConfigured, OrderStatusResult, waitForPaymentConfirmation } from '../lib/paymentApi';

interface CustomerAccountModalProps {
  isOpen: boolean;
  mode: 'checkout' | 'account';
  account: CustomerAccount | null;
  guest?: boolean;
  items: CartItem[];
  orders: Order[];
  onClose: () => void;
  onLogout: () => void;
  onSaveAccount: (account: CustomerAccount) => void;
  onPaymentComplete: (order: Order, card: SavedCard, account: CustomerAccount, guest?: boolean) => void;
  deliveryFee: number;
}

const emptyAddress: SavedAddress = { id: '', label: 'Home', line1: '', city: '', state: '', country: 'Nigeria' };

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  mode,
  account,
  guest = false,
  items,
  orders,
  onClose,
  onLogout,
  onSaveAccount,
  onPaymentComplete,
  deliveryFee
}) => {
  const [view, setView] = useState<'account' | 'checkout' | 'confirmation'>(mode);
  const [name, setName] = useState(account?.name || '');
  const [email, setEmail] = useState(account?.email || '');
  const [phone, setPhone] = useState(account?.phone || '');
  const [address, setAddress] = useState<SavedAddress>(account?.addresses[0] || emptyAddress);
  const [isCheckoutFlow, setIsCheckoutFlow] = useState(mode === 'checkout');
  const [saveAddress, setSaveAddress] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setView(mode);
    setName(account?.name || '');
    setEmail(account?.email || '');
    setPhone(account?.phone || '');
    setAddress(account?.addresses[0] || emptyAddress);
    setIsCheckoutFlow(mode === 'checkout');
    setDeliveryNotes('');
    setLastOrder(null);
    setError('');
    setMessage('');
  }, [isOpen, mode, account]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const totalAmount = subtotal + deliveryFee;
  const accountForPayment = (): CustomerAccount => ({
    id: account?.id || `customer-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    points: account?.points || 0,
    addresses: saveAddress
      ? [{ ...address, id: address.id || `address-${Date.now()}` }, ...(account?.addresses || []).filter((saved) => saved.id !== address.id)]
      : account?.addresses || [],
    savedCards: account?.savedCards || [],
    createdAt: account?.createdAt || new Date().toISOString()
  });

  const validateDetails = () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !address.line1.trim() || !address.city.trim() || !address.state.trim()) {
      setError('Please complete your name, contact details, and delivery address.');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address for your payment receipt.');
      return false;
    }
    return true;
  };

  const handleDeleteAddress = (id: string) => {
    if (!account) return;
    const remaining = account.addresses.filter((saved) => saved.id !== id);
    onSaveAccount({ ...account, addresses: remaining });
    setAddress(remaining[0] || emptyAddress);
    setMessage('Delivery address removed.');
  };

  const handlePayment = async () => {
    if (!validateDetails()) return;
    const customer = accountForPayment();
    if (!guest) {
      onSaveAccount(customer);
    }
    setError('');
    setIsPaying(true);

    try {
      const payload = buildCheckoutPayload({ account: customer, address, notes: deliveryNotes, items });
      const created = await createOrderAtBackend(payload);

      let reference = created.payment.reference;
      let confirmed: OrderStatusResult;

      if (isBackendConfigured()) {
        if (isPaystackConfigured()) {
          const payment = await payWithPaystack({
            email: customer.email,
            amount: created.payment.amount,
            currency: created.payment.currency,
            reference,
            metadata: { customer_name: customer.name, phone: customer.phone, order_id: created.orderId }
          });
          reference = payment.reference;
        }
        confirmed = await waitForPaymentConfirmation(created.orderId);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        confirmed = {
          orderId: created.orderId,
          orderNumber: created.orderNumber,
          amount: created.payment.amount,
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          updatedAt: new Date().toISOString()
        };
      }

      if (confirmed.paymentStatus !== 'paid') {
        setIsPaying(false);
        setError(
          confirmed.paymentStatus === 'failed'
            ? 'Payment failed. Your card was not charged. Please try again.'
            : 'Your payment is still processing. We will confirm your order shortly.'
        );
        return;
      }

      const amount = confirmed.amount || created.payment.amount;
      const order: Order = {
        id: confirmed.orderId || created.orderId,
        orderNumber: confirmed.orderNumber || created.orderNumber,
        customer: customer.name,
        phone: customer.phone,
        email: customer.email,
        date: new Date().toLocaleDateString('en-NG'),
        amount,
        status: 'completed',
        shippingStatus: 'Processing',
        paymentReference: reference,
        shippingAddress: address,
        items: items.map((item) => `${item.qty}x ${item.product.name} (${item.size})`).join(', '),
        subtotal,
        deliveryFee,
        deliveryNotes,
        paymentStatus: 'paid',
        orderStatus: confirmed.orderStatus || 'confirmed',
        updatedAt: confirmed.updatedAt
      };

      const card: SavedCard = {
        id: `card-${Date.now()}`,
        brand: isBackendConfigured() ? 'Paystack secured card' : 'Paystack test card',
        last4: isBackendConfigured() ? 'stored' : '0000',
        reference
      };

      setLastOrder(order);
      onPaymentComplete(order, card, customer, guest);
      setIsPaying(false);
      setView('confirmation');
    } catch (error) {
      setIsPaying(false);
      const reason = error instanceof Error ? error.message : '';
      if (reason.includes('window closed')) return;
      setError('Payment could not be completed. Please try again.');
    }
  };

  const renderConfirmation = () => (
    <div className="space-y-5 py-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 size={30} />
      </div>
      <div>
        <h3 className="font-display text-xl font-black uppercase tracking-wide">Order confirmed</h3>
        <p className="mt-1 text-xs text-gray-500">
          Thank you for shopping with IB Anasa Wears, {lastOrder?.customer.split(' ')[0] || 'friend'}.
        </p>
      </div>
      <div className="mx-auto max-w-xs space-y-2 border border-gray-200 p-4 text-left text-xs">
        <div className="flex justify-between gap-4">
          <span className="uppercase tracking-wider text-gray-500">Order</span>
          <strong className="font-mono">{lastOrder?.id}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="uppercase tracking-wider text-gray-500">Amount</span>
          <strong className="font-mono">{formatNaira(lastOrder?.amount || 0)}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="uppercase tracking-wider text-gray-500">Payment</span>
          <strong className="uppercase text-emerald-600">Successful</strong>
        </div>
      </div>
      <p className="text-[11px] text-gray-500">
        We will reach out via {lastOrder?.phone} to arrange delivery from our Auchi showroom.
      </p>
      <button
        onClick={onClose}
        className="w-full bg-black py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-gray-800"
      >
        Continue shopping
      </button>
    </div>
  );

  const renderAccount = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-3">
        <div className="border-b-2 border-black pb-2 text-[10px] font-bold uppercase tracking-widest">Account</div>
        <button onClick={() => { setIsCheckoutFlow(true); setView('checkout'); }} className="pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black">Checkout</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-gray-200 p-3"><Star size={15} className="mb-2 text-amber-500" /><p className="text-[9px] uppercase tracking-widest text-gray-500">Loyalty points</p><p className="mt-1 font-mono text-xl font-bold">{account?.points || 0}</p></div>
        <div className="border border-gray-200 p-3"><Gift size={15} className="mb-2 text-emerald-600" /><p className="text-[9px] uppercase tracking-widest text-gray-500">Member access</p><p className="mt-1 text-xs font-bold uppercase">Early sales + 5% off</p></div>
      </div>
      <section><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><MapPin size={14} /> Saved addresses</div>{account?.addresses.length ? account.addresses.map((saved) => <div key={saved.id} className="mb-2 flex items-start justify-between gap-3 border border-gray-200 p-3 text-xs"><div><strong>{saved.label}</strong><p className="mt-1 text-gray-500">{saved.line1}, {saved.city}, {saved.state}, {saved.country}</p></div><div className="flex shrink-0 items-center gap-1"><button onClick={() => { setAddress(saved); setIsCheckoutFlow(false); setView('checkout'); setError(''); setMessage(''); }} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-black" title={`Edit ${saved.label} address`}><Pencil size={12} /> Edit</button><button onClick={() => handleDeleteAddress(saved.id)} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-800" title={`Delete ${saved.label} address`}><Trash2 size={12} /> Delete</button></div></div>) : <p className="text-xs text-gray-500">Your saved delivery addresses will appear here.</p>}</section>
      <section><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><CreditCard size={14} /> Saved payment methods</div>{account?.savedCards.length ? account.savedCards.map((card) => <div key={card.id} className="border border-gray-200 p-3 text-xs"><strong>{card.brand}</strong><span className="ml-2 font-mono text-gray-500">•••• {card.last4}</span><p className="mt-1 text-[10px] text-gray-500">Secured by Paystack. Card details are never stored here.</p></div>) : <p className="text-xs text-gray-500">A secure payment method can be saved after your first Paystack payment.</p>}</section>
      <section><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><Package size={14} /> Order history</div>{orders.length ? orders.map((order) => <div key={order.id} className="flex items-center justify-between border-b border-gray-100 py-3 text-xs"><div><strong>{order.id}</strong><p className="mt-1 text-gray-500">{order.date} · {order.shippingStatus || 'Processing'}</p></div><span className="font-mono font-bold">{formatNaira(order.amount)}</span></div>) : <p className="text-xs text-gray-500">Completed orders and shipping updates will appear here.</p>}</section>
      <button onClick={() => { setAddress(emptyAddress); setIsCheckoutFlow(false); setView('checkout'); setError(''); setMessage(''); }} className="flex w-full items-center justify-center gap-2 bg-black py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-gray-800"><Plus size={15} /> Add delivery details</button>
      {account && <button onClick={onLogout} className="flex w-full items-center justify-center gap-2 border border-gray-300 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 hover:border-black hover:text-black"><LogOut size={15} /> Log out of account</button>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="relative bg-black p-6 text-white"><button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white" aria-label="Close account"><X size={18} /></button><div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-gray-400"><User size={13} /> Customer account</div><h2 className="font-display text-2xl font-black uppercase">{view === 'checkout' ? 'Secure checkout' : account ? account.name : 'Your IB Anasa account'}</h2><p className="mt-1 text-xs text-gray-300">Save your essentials, follow every delivery, and unlock member access.</p></header>
        <div className="p-6">
          {error && <div className="mb-4 flex gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700"><AlertCircle size={15} className="shrink-0" />{error}</div>}
          {message && <div className="mb-4 flex gap-2 border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 size={15} className="shrink-0" />{message}</div>}
          {view === 'confirmation' ? renderConfirmation() : view === 'account' ? renderAccount() : (
            <div className="space-y-4">
              <button onClick={() => setView('account')} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black"><ArrowLeft size={13} /> Account overview</button>
              {guest && (
                <div className="flex items-start gap-2 border border-gray-200 bg-gray-50 p-3 text-[11px] text-gray-600"><User size={14} className="mt-0.5 shrink-0 text-gray-400" /><span>You are checking out as a guest. Sign in next time to reuse your address and earn loyalty points.</span></div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[10px] font-bold uppercase tracking-widest">Full name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full border border-gray-300 p-3 text-sm font-normal normal-case tracking-normal" /></label>
                <label className="text-[10px] font-bold uppercase tracking-widest">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full border border-gray-300 p-3 text-sm font-normal normal-case tracking-normal" /></label>
              </div>
              <label className="block text-[10px] font-bold uppercase tracking-widest">Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full border border-gray-300 p-3 text-sm font-normal normal-case tracking-normal" placeholder="0813 894 7979" /></label>
              <div className="border-t border-gray-200 pt-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><MapPin size={14} /> Delivery address</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest">Label<input value={address.label} onChange={(event) => setAddress({ ...address, label: event.target.value })} className="mt-1 w-full border border-gray-300 p-3 text-sm font-normal normal-case tracking-normal" /></label>
                  <label className="text-[10px] font-bold uppercase tracking-widest">Country<select value={address.country} onChange={(event) => setAddress({ ...address, country: event.target.value })} className="mt-1 w-full border border-gray-300 bg-white p-3 text-sm font-normal normal-case tracking-normal"><option>Nigeria</option><option>Ghana</option><option>Kenya</option><option>South Africa</option><option>United Kingdom</option><option>United States</option><option>Canada</option><option>Other</option></select></label>
                  <label className="text-[10px] font-bold uppercase tracking-widest sm:col-span-2">Street address<input value={address.line1} onChange={(event) => setAddress({ ...address, line1: event.target.value })} className="mt-1 w-full border border-gray-300 p-3 text-sm font-normal normal-case tracking-normal" /></label>
                  <label className="text-[10px] font-bold uppercase tracking-widest">City<input value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} className="mt-1 w-full border border-gray-300 p-3 text-sm font-normal normal-case tracking-normal" /></label>
                  <label className="text-[10px] font-bold uppercase tracking-widest">State / Province<input value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value })} className="mt-1 w-full border border-gray-300 p-3 text-sm font-normal normal-case tracking-normal" /></label>
                </div>
              </div>
              {isCheckoutFlow && (
                <label className="block text-[10px] font-bold uppercase tracking-widest">Delivery notes (optional)<textarea value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} rows={2} placeholder="Landmark, preferred delivery time, etc." className="mt-1 w-full border border-gray-300 p-3 text-sm font-normal normal-case tracking-normal" /></label>
              )}
              <label className="flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} /> Save this address to my account</label>
              {isCheckoutFlow && isBackendConfigured() && isPaystackConfigured() && (
                <div className="border border-emerald-100 bg-emerald-50 p-3 text-[11px] text-emerald-800"><div className="flex items-center gap-2 font-bold uppercase tracking-wider"><ShieldCheck size={14} /> Paystack secured payment</div><p className="mt-1">Your card details are entered in Paystack&apos;s secure checkout, verified by our server, and never stored by this store.</p></div>
              )}
              {isCheckoutFlow && !isBackendConfigured() && (
                <div className="border border-amber-100 bg-amber-50 p-3 text-[11px] text-amber-800"><div className="flex items-center gap-2 font-bold uppercase tracking-wider"><AlertCircle size={14} /> Local test mode</div><p className="mt-1">No backend is connected yet, so this checkout simulates a successful card payment. No real charge is made.</p></div>
              )}
              {isCheckoutFlow && isBackendConfigured() && !isPaystackConfigured() && (
                <div className="border border-amber-100 bg-amber-50 p-3 text-[11px] text-amber-800"><div className="flex items-center gap-2 font-bold uppercase tracking-wider"><AlertCircle size={14} /> Payment awaiting confirmation</div><p className="mt-1">Paystack keys aren&apos;t configured, so the order stays pending until the backend confirms payment.</p></div>
              )}
              {isCheckoutFlow && (
                <div className="space-y-1.5 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xs"><span className="uppercase tracking-widest text-gray-500">Subtotal</span><span className="font-mono font-bold">{formatNaira(subtotal)}</span></div>
                  <div className="flex justify-between text-xs"><span className="uppercase tracking-widest text-gray-500">Delivery</span><span className="font-mono font-bold">{formatNaira(deliveryFee)}</span></div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-1.5"><span className="text-xs font-bold uppercase tracking-widest">Total</span><span className="font-mono text-lg font-bold">{formatNaira(totalAmount)}</span></div>
                </div>
              )}
              <button onClick={isCheckoutFlow ? handlePayment : () => { if (validateDetails()) { onSaveAccount(accountForPayment()); setMessage('Account details saved.'); setView('account'); } }} disabled={isPaying} className="flex w-full items-center justify-center gap-2 bg-black py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-gray-800 disabled:cursor-wait disabled:opacity-60">{isPaying ? (isCheckoutFlow ? 'Processing order...' : 'Saving...') : isCheckoutFlow ? (isBackendConfigured() && isPaystackConfigured() ? <><Lock size={14} /> Pay with Paystack</> : isBackendConfigured() ? <><Lock size={14} /> Place order</> : <><ShieldCheck size={14} /> Complete order (test)</>) : 'Save account details'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
