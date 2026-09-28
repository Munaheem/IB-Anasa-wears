import React, { useEffect, useState } from 'react';
import { X, Check, ShieldCheck, Truck, RotateCcw, ChevronDown, ChevronUp, Share2, MessageCircle } from 'lucide-react';
import { Product } from '../types';
import { formatNaira } from '../data/initialData';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  onOrderViaWhatsApp: (product: Product, size: string, color: string) => void;
}

const getRegionalSizes = (sizes: string[]) => {
  const convertNumericSize = (size: string, offset: number) => {
    const numericSize = Number.parseInt(size, 10);
    return Number.isNaN(numericSize) ? size : String(numericSize - offset);
  };

  return {
    EU: sizes,
    UK: sizes.map((size) => convertNumericSize(size, 33)),
    US: sizes.map((size) => convertNumericSize(size, 32))
  };
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onOrderViaWhatsApp
}) => {
  useEffect(() => {
    if (!product) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [product]);

  const availableColors = product?.colors || ['Black', 'White', 'Navy', 'Grey', 'Olive', 'Beige', 'Burgundy'];
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes[0] || 'Standard');
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0]);
  const regionalSizes = product?.regionalSizes || {
    EU: product?.sizes || [],
    UK: product ? getRegionalSizes(product.sizes).UK : [],
    US: product ? getRegionalSizes(product.sizes).US : []
  };
  const [selectedRegion, setSelectedRegion] = useState<'EU' | 'UK' | 'US'>('EU');
  const [activeAccordion, setActiveAccordion] = useState<'comp' | 'delivery' | 'guarantee' | null>('comp');
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  const toggleAccordion = (section: 'comp' | 'delivery' | 'guarantee') => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOutOfStock = product.status === 'out_of_stock' || product.inStock === false;

  const getSizeStock = (sz: string): number | null => {
    if (!product.variants || product.variants.length === 0) return null;
    const forColour = product.variants.filter(
      (variant) => variant.size === sz && (!variant.colour || variant.colour === selectedColor)
    );
    if (forColour.length === 0) return null;
    return forColour.reduce((sum, variant) => sum + variant.stock, 0);
  };

  const renderStockHint = (sz: string) => {
    const stock = getSizeStock(sz);
    const isSelectedStyle = selectedSize === sz;
    if (stock === null) {
      return (
        <span className={`text-[9px] font-mono ${isSelectedStyle ? 'text-gray-300' : 'text-emerald-600'}`}>
          IN STOCK &bull; IMMEDIATE DISPATCH
        </span>
      );
    }
    if (stock === 0) return <span className="text-[9px] font-mono font-bold text-red-500">OUT OF STOCK</span>;
    if (stock <= 3) return <span className="text-[9px] font-mono font-bold text-amber-600">Only {stock} left</span>;
    return (
      <span className={`text-[9px] font-mono ${isSelectedStyle ? 'text-gray-300' : 'text-emerald-600'}`}>
        IN STOCK &bull; IMMEDIATE DISPATCH
      </span>
    );
  };

  return (
    <div
      id="pdpModalOverlay"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-0 sm:p-4 md:p-6 lg:p-10 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="pdpModalContent"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-5xl min-h-screen sm:min-h-0 sm:my-auto shadow-2xl relative flex flex-col"
      >
        {/* Sticky PDP Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-gray-500">
              COLLECTION &middot; {product.cat.toUpperCase()}
            </span>
            <span className="text-gray-300">/</span>
            <span className="font-mono text-[9px] text-gray-400">REF. #{1000 + product.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-black transition-colors"
              title="Copy share link"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
            </button>
            <button
              id="closePdpModalBtn"
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-black transition-colors"
              aria-label="Close product view"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PDP Two-Column Grid */}
        <div className="flex flex-col lg:flex-row">
          {/* Left Column: Stacked Editorial Photography */}
          <div className="w-full lg:w-3/5 bg-gray-100 p-4 sm:p-8 flex flex-col gap-6">
            <div className="w-full aspect-3/4 bg-gray-200 overflow-hidden shadow-sm">
              <img
                src={product.img}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {(product.gallery?.length ? product.gallery.slice(1) : product.altImg ? [product.altImg] : []).map(
              (src, index) => (
                <div key={index} className="w-full aspect-3/4 bg-gray-200 overflow-hidden shadow-sm">
                  <img
                    src={src}
                    alt={`${product.name} editorial detail ${index + 1}`}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              )
            )}
          </div>

          {/* Right Column: Sticky Product Purchase Specification */}
          <div className="w-full lg:w-2/5 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Tag & Title */}
              <div>
                {product.tag && (
                  <span className="inline-block px-2.5 py-0.5 mb-2 bg-black text-white text-[8px] font-bold tracking-[0.2em] uppercase">
                    {product.tag}
                  </span>
                )}
                <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-black uppercase tracking-tight leading-tight">
                  {product.name}
                </h2>
                <div className="mt-2 font-mono text-2xl font-bold text-black">
                  {formatNaira(product.price)}
                </div>
                <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                  {product.description || 'Authentic luxury garment hand-selected for the IB ANASA WEARS showroom in Auchi, Edo State.'}
                </p>
              </div>

              {/* Size Selector */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-[10px] font-bold tracking-[0.14em] uppercase text-gray-600">
                  <span>SELECT SIZE / VARIANT</span>
                  <span className="text-emerald-700 font-mono text-[9px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    GUARANTEED AUTHENTIC
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['EU', 'UK', 'US'] as const).map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => {
                        setSelectedRegion(region);
                        setSelectedSize(regionalSizes[region][0] || 'Standard');
                      }}
                      className={`py-2 border text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                        selectedRegion === region
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {region} SIZES
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {regionalSizes[selectedRegion].map((sz) => {
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        id={`pdpSizeSelectBtn-${sz}`}
                        onClick={() => setSelectedSize(sz)}
                        className={`flex items-center justify-between p-3 border text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                          isSelected
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'
                        }`}
                      >
                        <span>{selectedRegion}: {sz}</span>
                        {renderStockHint(sz)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Selector, intentionally available only in the product detail view */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-600">
                  SELECT COLOR
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`p-2.5 border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        selectedColor === color
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Regional Sizing, intentionally available only in the product detail view */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-600">
                  REGIONAL SIZE GUIDE
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['EU', 'UK', 'US'] as const).map((region) => (
                    <div key={region} className="border border-gray-200 bg-gray-50 p-2.5">
                      <div className="text-[9px] font-bold tracking-wider text-gray-500 mb-1">{region}</div>
                      <div className="text-xs font-mono font-bold text-gray-900">
                        {regionalSizes[region].join(' / ') || 'Standard'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  id="pdpAddToCartBtn"
                  disabled={isOutOfStock}
                  onClick={() => {
                    onAddToCart(product, selectedSize, selectedColor);
                    onClose();
                  }}
                  className={`w-full py-4 bg-black text-white font-bold text-xs tracking-[0.2em] uppercase transition-all cursor-pointer shadow-md ${
                    isOutOfStock ? 'opacity-40 cursor-not-allowed hover:bg-black' : 'hover:bg-gray-800 active:scale-[0.99]'
                  }`}
                >
                  {isOutOfStock ? 'OUT OF STOCK — NOT PURCHASABLE' : 'ADD TO SHOPPING BAG'}
                </button>

                <button
                  id="pdpWhatsappOrderBtn"
                  onClick={() => onOrderViaWhatsApp(product, selectedSize, selectedColor)}
                  className="w-full py-3.5 bg-emerald-600 text-white font-bold text-xs tracking-[0.2em] uppercase hover:bg-emerald-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle size={15} />
                  <span>DIRECT WHATSAPP INQUIRY</span>
                </button>
              </div>

              {/* Collapsible Accordions (Zara Minimalist) */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                {/* Composition & Care */}
                <div className="border-b border-gray-100 pb-3">
                  <button
                    onClick={() => toggleAccordion('comp')}
                    className="w-full flex items-center justify-between text-left text-[11px] font-bold tracking-[0.14em] uppercase text-gray-800 py-1"
                  >
                    <span>Composition &amp; Fabric Care</span>
                    {activeAccordion === 'comp' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {activeAccordion === 'comp' && (
                    <div className="pt-2 text-xs text-gray-600 leading-relaxed space-y-1">
                      <p>{product.composition || '100% High-grade curated fabric. Dry clean or cold delicate machine wash.'}</p>
                      <p className="text-[10px] text-gray-400">Manufactured with reinforced stitching and luxury hardware.</p>
                    </div>
                  )}
                </div>

                {/* Delivery & Store Pickup */}
                <div className="border-b border-gray-100 pb-3">
                  <button
                    onClick={() => toggleAccordion('delivery')}
                    className="w-full flex items-center justify-between text-left text-[11px] font-bold tracking-[0.14em] uppercase text-gray-800 py-1"
                  >
                    <span>Showroom Pickup &amp; Logistics</span>
                    {activeAccordion === 'delivery' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {activeAccordion === 'delivery' && (
                    <div className="pt-2 text-xs text-gray-600 leading-relaxed space-y-2">
                      <div className="flex items-start gap-2">
                        <Truck size={14} className="shrink-0 mt-0.5 text-black" />
                        <div>
                          <strong>Nationwide Tracked Delivery:</strong> 2–4 business days to Lagos, Abuja, Port Harcourt, Benin, and all states.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <ShieldCheck size={14} className="shrink-0 mt-0.5 text-black" />
                        <div>
                          <strong>Same-Day Walk-In Pickup:</strong> Shop 7, Opp MTN Office, Auchi, Edo State.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Authenticity Guarantee */}
                <div className="pb-1">
                  <button
                    onClick={() => toggleAccordion('guarantee')}
                    className="w-full flex items-center justify-between text-left text-[11px] font-bold tracking-[0.14em] uppercase text-gray-800 py-1"
                  >
                    <span>Authenticity &amp; Exchange Policy</span>
                    {activeAccordion === 'guarantee' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {activeAccordion === 'guarantee' && (
                    <div className="pt-2 text-xs text-gray-600 leading-relaxed flex items-start gap-2">
                      <RotateCcw size={14} className="shrink-0 mt-0.5 text-black" />
                      <p>
                        All items are guaranteed 100% authentic. Size exchanges are honored within 7 days of delivery on unworn garments with original store tags intact.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Store Note */}
            <div className="pt-6 text-[10px] text-gray-400 font-mono border-t border-gray-100 text-center">
              IB ANASA WEARS &middot; AUCHI SHOWROOM &middot; 0813 894 7979
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
