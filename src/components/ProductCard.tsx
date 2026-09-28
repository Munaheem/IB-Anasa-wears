import React, { useState } from 'react';
import { Product } from '../types';
import { formatNaira } from '../data/initialData';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenPDP: (product: Product) => void;
  onQuickAdd: (product: Product, size: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenPDP,
  onQuickAdd
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isOutOfStock = product.status === 'out_of_stock' || product.inStock === false;
  const isLoading = !product.status && !product.inStock;

  return (
    <div
      id={`productCard-${product.id}`}
      className="group relative flex flex-col cursor-pointer transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenPDP(product)}
    >
      {/* Media Box */}
      <div className="relative w-full aspect-3/4 bg-[#f0f0f0] overflow-hidden">
        {/* Badge */}
        {product.tag && (
          <span className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 bg-black/90 text-white text-[8px] font-bold tracking-[0.2em] uppercase">
            {product.tag}
          </span>
        )}

        {/* Out of stock badge */}
        {(isOutOfStock || isLoading) && (
          <span className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 bg-red-600 text-white text-[8px] font-bold tracking-[0.2em] uppercase">
            Out of stock
          </span>
        )}

        {/* Primary Image */}
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
            product.altImg && isHovered ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
        />

        {/* Alternate Image on Hover */}
        {product.altImg && (
          <img
            src={product.altImg}
            alt={`${product.name} alternate view`}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out ${
              isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100 pointer-events-none'
            }`}
          />
        )}

        {/* Zara Signature Quick-Size Hover Drawer */}
        <div
          id={`quickSizeDrawer-${product.id}`}
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md p-2.5 border-t border-gray-200 transform transition-transform duration-300 ease-out ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between text-[8px] font-bold tracking-[0.18em] uppercase text-gray-500 mb-1.5 px-0.5">
            <span>QUICK ADD SIZE</span>
            {isOutOfStock || isLoading ? (
              <span className="text-[7px] text-red-600 font-mono">OUT OF STOCK</span>
            ) : (
              <span className="text-[7px] text-emerald-600 font-mono">IN STOCK</span>
            )}
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {product.sizes.map((size) => (
              <button
                key={size}
                id={`quickAddBtn-${product.id}-${size}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOutOfStock || isLoading) return;
                  onQuickAdd(product, size);
                }}
                className={`flex-1 min-w-[32px] py-1 px-1.5 bg-white text-black border border-gray-300 text-[9.5px] font-bold text-center tracking-wider uppercase transition-all active:scale-95 cursor-pointer ${
                  isOutOfStock || isLoading
                    ? 'opacity-40 hover:bg-gray-100 hover:text-gray-500'
                    : 'hover:bg-black hover:text-white hover:border-black'
                }`}
                title={isOutOfStock || isLoading ? 'Out of stock' : `Quick add size ${size}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Meta */}
      <div className="pt-3 pb-1 flex flex-col gap-1 text-[11px] tracking-[0.08em] uppercase">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-black group-hover:underline underline-offset-4 transition-colors">
            {product.name}
          </h3>
          <span className="font-mono font-bold text-gray-900 shrink-0 text-[11.5px]">
            {formatNaira(product.price)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[9px] text-gray-500">
          <span className="tracking-wider">{product.cat}</span>
          <span className="font-mono tracking-widest text-gray-400">REF. #{1000 + product.id}</span>
        </div>
      </div>
    </div>
  );
};
