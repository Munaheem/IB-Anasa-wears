import React from 'react';
import { Search, SlidersHorizontal, Grid3X3, Grid2X2, Square } from 'lucide-react';
import { ProductCategory, GridDensity } from '../types';

interface CatalogFilterBarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  gridDensity: GridDensity;
  onGridDensityChange: (density: GridDensity) => void;
  totalProductsCount: number;
}

const CATEGORIES: { label: string; value: ProductCategory }[] = [
  { label: 'ALL', value: 'all' },
  { label: 'SHIRTS', value: 'shirts' },
  { label: 'HOODIES', value: 'hoodies' },
  { label: 'TROUSERS', value: 'trousers' },
  { label: 'SHORTS', value: 'shorts' },
  { label: 'FOOTWEAR', value: 'shoes' },
  { label: 'SLIDES', value: 'slides' },
  { label: 'CAPS', value: 'caps' },
  { label: 'BELTS', value: 'belts' },
  { label: 'BAGS', value: 'bags' }
];

export const CatalogFilterBar: React.FC<CatalogFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  gridDensity,
  onGridDensityChange,
  totalProductsCount
}) => {
  return (
    <div
      id="catalogFilterBarSticky"
      className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-[#e5e5e5] px-4 sm:px-6 lg:px-8 py-3 transition-shadow"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills (Horizontal scrolling) */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1 -mx-2 px-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.value.toLowerCase();
            return (
              <button
                key={cat.value}
                id={`filterPill-${cat.value}`}
                onClick={() => onSelectCategory(cat.value)}
                className={`px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] uppercase whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Right Filter Controls: Search, Sort & Grid Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-4 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-gray-100">
          {/* Search Box */}
          <div className="relative flex-1 md:w-56">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              id="catalogSearchInput"
              type="text"
              placeholder="Search garments..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-gray-500">
            <SlidersHorizontal size={12} />
            <select
              id="catalogSortSelect"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-black text-[11px] font-semibold tracking-wider uppercase border-none focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          {/* Grid Layout Switcher (1, 2, 4) */}
          <div className="hidden sm:flex items-center gap-1 pl-3 border-l border-gray-200">
            <button
              id="gridDensityCol1"
              onClick={() => onGridDensityChange('cols-1')}
              className={`p-1.5 transition-colors ${
                gridDensity === 'cols-1' ? 'text-black bg-gray-200' : 'text-gray-400 hover:text-black'
              }`}
              title="1 Column View"
            >
              <Square size={14} />
            </button>
            <button
              id="gridDensityCol2"
              onClick={() => onGridDensityChange('cols-2')}
              className={`p-1.5 transition-colors ${
                gridDensity === 'cols-2' ? 'text-black bg-gray-200' : 'text-gray-400 hover:text-black'
              }`}
              title="2 Columns View"
            >
              <Grid2X2 size={14} />
            </button>
            <button
              id="gridDensityCol4"
              onClick={() => onGridDensityChange('cols-4')}
              className={`p-1.5 transition-colors ${
                gridDensity === 'cols-4' ? 'text-black bg-gray-200' : 'text-gray-400 hover:text-black'
              }`}
              title="4 Columns View"
            >
              <Grid3X3 size={14} />
            </button>
          </div>

          <span className="hidden xl:inline text-[10px] font-mono text-gray-400 tracking-wider">
            {totalProductsCount} ITEMS
          </span>
        </div>
      </div>
    </div>
  );
};
