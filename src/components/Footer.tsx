import React from 'react';
import { NavPage } from '../types';
import { Shield, MessageCircle, MapPin, Instagram } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: NavPage, cat?: string) => void;
  isAdminLoggedIn?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, isAdminLoggedIn }) => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20 pt-16 pb-12 text-[#111111] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <span className="font-display font-black text-2xl uppercase tracking-tight block">
              IB ANASA WEARS
            </span>
            <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
              Curated Nigerian luxury streetwear and bespoke tailored apparel. Available for direct walk-in pickup at our Auchi showroom or nationwide tracked logistics.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-gray-600 font-mono pt-1">
              <MapPin size={13} className="text-black shrink-0" />
              <span>Shop 7, Opp MTN Office, Auchi, Edo State &bull; 08138947979</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs font-semibold tracking-wider uppercase text-gray-700">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-black hover:underline underline-offset-4"
                >
                  Lookbook / Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="hover:text-black hover:underline underline-offset-4"
                >
                  All Garments
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop', 'shirts')}
                  className="hover:text-black hover:underline underline-offset-4"
                >
                  Shirts Capsule
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop', 'shoes')}
                  className="hover:text-black hover:underline underline-offset-4"
                >
                  Footwear Suite
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-black hover:underline underline-offset-4"
                >
                  About &amp; Store Directory
                </button>
              </li>
            </ul>
          </div>

          {/* Admin & Social */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">
              Store Desk &amp; Admin
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold tracking-wider uppercase">
              <li>
                <button
                  id="footerAdminLink"
                  onClick={() => onNavigate('admin')}
                  className="flex items-center gap-1.5 text-black font-bold hover:underline underline-offset-4"
                >
                  <Shield size={13} className={isAdminLoggedIn ? 'text-emerald-600' : 'text-gray-500'} />
                  <span>Admin Panel ({isAdminLoggedIn ? 'Online' : 'Sign In'})</span>
                </button>
              </li>
              <li>
                <a
                  href="https://wa.me/2348138947979"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950"
                >
                  <MessageCircle size={13} />
                  <span>WhatsApp Concierge</span>
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/ib_anasa.wears"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-gray-700 hover:text-black"
                >
                  <Instagram size={13} />
                  <span>Instagram Official</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal bar */}
        <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-gray-400 font-mono tracking-wider uppercase">
          <span>&copy; 2026 IB ANASA WEARS &middot; ALL RIGHTS RESERVED &middot; AUCHI, NIGERIA</span>
          <span>CURATED LUXURY &bull; SECURED WITH GOOGLE SSO</span>
        </div>
      </div>
    </footer>
  );
};
