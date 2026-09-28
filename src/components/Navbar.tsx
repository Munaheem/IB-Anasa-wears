import React, { useState, useEffect } from 'react';
import { ShoppingBag, MessageCircle, Menu, X, Shield, ChevronRight, User, Bell, LogOut } from 'lucide-react';
import { NavPage } from '../types';

interface NavbarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage, category?: string) => void;
  cartCount: number;
  notificationCount: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenNotifications: () => void;
  onSignOut?: () => void;
  customerName?: string;
  isAdminLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  cartCount,
  notificationCount,
  onOpenCart,
  onOpenAccount,
  onOpenNotifications,
  onSignOut,
  customerName,
  isAdminLoggedIn
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDarkHeroView = currentPage === 'home' && !isScrolled;

  const handleNavClick = (page: NavPage, cat?: string) => {
    onNavigate(page, cat);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      id="mainNavbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isDarkHeroView
          ? 'bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white border-b border-white/10'
          : 'bg-white/95 backdrop-blur-md text-[#111111] border-b border-[#e5e5e5] shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Brand & Links */}
        <div className="flex items-center gap-6 lg:gap-10">
          <button
            id="mobileMenuToggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 -ml-1 text-inherit hover:opacity-75 transition-opacity"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Brand Wordmark */}
          <button
            id="brandLogoBtn"
            onClick={() => handleNavClick('home')}
            className="text-left group flex flex-col justify-center"
          >
            <span className="font-display font-black text-xl sm:text-2xl md:text-3xl tracking-tighter leading-none uppercase group-hover:opacity-90 transition-opacity">
              IB ANASA WEARS
            </span>
            <span
              className={`text-[8px] font-bold tracking-[0.28em] uppercase mt-0.5 ${
                isDarkHeroView ? 'text-gray-300' : 'text-gray-500'
              }`}
            >
              Luxury Only &middot; Auchi
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[11px] font-semibold tracking-[0.14em] uppercase">
            <button
              id="navHome"
              onClick={() => handleNavClick('home')}
              className={`transition-all pb-1 hover:opacity-100 ${
                currentPage === 'home'
                  ? 'opacity-100 border-b-2 border-current'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              Lookbook
            </button>
            <button
              id="navShopAll"
              onClick={() => handleNavClick('shop')}
              className={`transition-all pb-1 hover:opacity-100 ${
                currentPage === 'shop'
                  ? 'opacity-100 border-b-2 border-current'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              Catalogue
            </button>
            {/* <button
              id="navShopShirts"
              onClick={() => handleNavClick('shop', 'shirts')}
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              Shirts
            </button>
            <button
              id="navShopHoodies"
              onClick={() => handleNavClick('shop', 'hoodies')}
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              Hoodies
            </button>
            <button
              id="navShopShoes"
              onClick={() => handleNavClick('shop', 'shoes')}
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              Footwear
            </button> */}
            <button
              id="navAbout"
              onClick={() => handleNavClick('about')}
              className={`transition-all pb-1 hover:opacity-100 ${
                currentPage === 'about'
                  ? 'opacity-100 border-b-2 border-current'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              About &amp; Store
            </button>
          </nav>
        </div>

        {/* Right CTA Area */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Admin shortcut */}
          {/* <button
            id="navAdminPortalBtn"
            onClick={() => handleNavClick('admin')}
            className={`hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] uppercase px-2.5 py-1.5 border transition-all ${
              currentPage === 'admin'
                ? 'bg-black text-white border-black'
                : isDarkHeroView
                ? 'border-white/30 text-white hover:bg-white hover:text-black'
                : 'border-gray-300 text-gray-800 hover:bg-gray-100'
            }`}
            title="Admin Management Panel"
          >
            <Shield size={12} className={isAdminLoggedIn ? 'text-emerald-500' : ''} />
            <span>Admin</span>
            {isAdminLoggedIn && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button> */}

          {/* WhatsApp Direct */}
          {/* <a
            id="navWhatsappDirect"
            href="https://wa.me/2348138947979?text=Hello%20IB%20Anasa%20Wears!%20I%20am%20inquiring%20about%20your%20luxury%20collection."
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden md:inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.14em] uppercase transition-colors px-3 py-1.5 rounded-xs ${
              isDarkHeroView
                ? 'text-emerald-400 hover:text-emerald-300 bg-black/40 border border-emerald-500/30'
                : 'text-emerald-800 hover:text-emerald-900 bg-emerald-50/80 border border-emerald-200'
            }`}
          >
            <MessageCircle size={13} />
            <span>WhatsApp</span>
          </a> */}

          {/* Shopping Bag Button */}
          <button
            id="navCustomerAccountBtn"
            onClick={onOpenAccount}
            className={`hidden sm:flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold tracking-[0.14em] uppercase transition-all border ${
              isDarkHeroView ? 'border-white/30 hover:bg-white hover:text-black' : 'border-gray-300 hover:bg-gray-100'
            }`}
            aria-label="Open customer account"
            title="Customer account"
          >
            <User size={14} />
            <span>{customerName ? customerName.split(' ')[0] : 'Account'}</span>
          </button>

          {customerName && onSignOut && (
            <button
              id="navCustomerSignOutBtn"
              onClick={onSignOut}
              className={`hidden sm:flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold tracking-[0.14em] uppercase transition-all border ${
                isDarkHeroView ? 'border-white/30 text-gray-300 hover:bg-white hover:text-black' : 'border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-black'
              }`}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={13} />
              <span>Sign out</span>
            </button>
          )}

          <button
            id="navNotificationsBtn"
            onClick={onOpenNotifications}
            className={`relative flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full border transition-all ${
              isDarkHeroView
                ? 'border-white/30 text-white hover:bg-white/10'
                : 'border-gray-300 text-gray-800 hover:bg-gray-100'
            }`}
            aria-label="Open notifications"
            title="Notifications"
          >
            <Bell size={16} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <button
            id="navCartDrawerBtn"
            onClick={onOpenCart}
            className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold tracking-[0.14em] uppercase transition-all border ${
              isDarkHeroView
                ? 'bg-white text-black border-white hover:bg-gray-200'
                : 'bg-black text-white border-black hover:bg-gray-800'
            }`}
            aria-label="Open shopping bag"
          >
            <ShoppingBag size={14} />
            <span className="hidden sm:inline">Bag</span>
            <span className="font-mono text-[10px] font-bold">[{cartCount}]</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white text-[#111111] border-b border-gray-200 px-6 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3 text-xs font-bold tracking-[0.15em] uppercase">
            <button
              onClick={() => handleNavClick('home')}
              className={`text-left py-2 border-b border-gray-100 flex items-center justify-between ${
                currentPage === 'home' ? 'text-black font-extrabold' : 'text-gray-600'
              }`}
            >
              <span>Lookbook / Home</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => handleNavClick('shop')}
              className={`text-left py-2 border-b border-gray-100 flex items-center justify-between ${
                currentPage === 'shop' ? 'text-black font-extrabold' : 'text-gray-600'
              }`}
            >
              <span>All Garments &amp; Catalog</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => handleNavClick('shop', 'shirts')}
              className="text-left py-2 border-b border-gray-100 text-gray-600 flex items-center justify-between pl-3 text-[11px]"
            >
              <span>&bull; Tailored Shirts</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => handleNavClick('shop', 'hoodies')}
              className="text-left py-2 border-b border-gray-100 text-gray-600 flex items-center justify-between pl-3 text-[11px]"
            >
              <span>&bull; Statement Hoodies</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => handleNavClick('shop', 'shoes')}
              className="text-left py-2 border-b border-gray-100 text-gray-600 flex items-center justify-between pl-3 text-[11px]"
            >
              <span>&bull; Luxury Footwear</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className={`text-left py-2 border-b border-gray-100 flex items-center justify-between ${
                currentPage === 'about' ? 'text-black font-extrabold' : 'text-gray-600'
              }`}
            >
              <span>About &amp; Store Directory</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => handleNavClick('admin')}
              className={`text-left py-2 border-b border-gray-100 flex items-center justify-between ${
                currentPage === 'admin' ? 'text-black font-extrabold' : 'text-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <Shield size={14} className="text-gray-500" />
                <span>Admin Portal</span>
              </span>
              <span className="text-[9px] px-2 py-0.5 bg-gray-100 font-mono">
                {isAdminLoggedIn ? 'AUTHENTICATED' : 'SIGN IN'}
              </span>
            </button>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {customerName && onSignOut && (
              <button
                onClick={() => {
                  onSignOut();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-300 text-gray-700 text-[11px] font-bold tracking-widest uppercase hover:border-black hover:text-black transition-colors"
              >
                <LogOut size={15} />
                <span>Sign out ({customerName.split(' ')[0]})</span>
              </button>
            )}
            <a
              href="https://wa.me/2348138947979"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white text-[11px] font-bold tracking-widest uppercase hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle size={15} />
              <span>WhatsApp Concierge (0813 894 7979)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
