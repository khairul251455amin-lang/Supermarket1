/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search as SearchIcon,
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ProductCard } from '../common/ProductCard';
import { EmptyState } from '../common/EmptyState';

export const SearchView: React.FC = () => {
  const {
    products,
    categories,
    searchQuery,
    setSearchQuery,
    activeCategoryFilter,
    setActiveCategoryFilter,
    activeSellerFilter,
    setActiveSellerFilter,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    resetFilters,
    setIsSandboxModalOpen,
  } = useMarketplace();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState(priceRange[0].toString());
  const [maxPriceInput, setMaxPriceInput] = useState(priceRange[1].toString());

  // Extract unique sellers from actual products
  const availableSellers = useMemo(() => {
    return Array.from(
      new Map(
        products.map((p) => [
          p.sellerId,
          { id: p.sellerId, name: p.sellerName },
        ])
      ).values()
    );
  }, [products]);

  // Handle price commit
  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseFloat(minPriceInput) || 0;
    const max = parseFloat(maxPriceInput) || 10000;
    setPriceRange([min, max]);
  };

  // Filter & Sort logic on real products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // 1. Search Query (Name & Description)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = prod.name.toLowerCase().includes(query);
        const matchesDesc = prod.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // 2. Category Filter
      if (activeCategoryFilter) {
        if (prod.category.toLowerCase() !== activeCategoryFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Seller Filter
      if (activeSellerFilter) {
        if (prod.sellerId !== activeSellerFilter) {
          return false;
        }
      }

      // 4. Price Range
      const effectivePrice = prod.discountedPrice ?? prod.originalPrice;
      if (effectivePrice < priceRange[0] || effectivePrice > priceRange[1]) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.discountedPrice ?? a.originalPrice;
      const priceB = b.discountedPrice ?? b.originalPrice;

      if (sortBy === 'price-low') {
        return priceA - priceB;
      }
      if (sortBy === 'price-high') {
        return priceB - priceA;
      }
      // 'newest' default
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    products,
    searchQuery,
    activeCategoryFilter,
    activeSellerFilter,
    priceRange,
    sortBy,
  ]);

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (activeCategoryFilter ? 1 : 0) +
    (activeSellerFilter ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Search Header Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products by title, keywords or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 min-h-[44px]"
            >
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-2xl px-3 py-2 bg-slate-50 text-xs font-medium text-slate-700">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price-low' | 'price-high' | 'newest')}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">
                Keyword: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeCategoryFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">
                Category: {activeCategoryFilter}
                <button onClick={() => setActiveCategoryFilter(null)} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeSellerFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">
                Seller ID: {activeSellerFilter}
                <button onClick={() => setActiveSellerFilter(null)} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 10000) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">
                Price: ${priceRange[0]} – ${priceRange[1]}
                <button
                  onClick={() => {
                    setPriceRange([0, 10000]);
                    setMinPriceInput('0');
                    setMaxPriceInput('10000');
                  }}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={() => {
                resetFilters();
                setMinPriceInput('0');
                setMaxPriceInput('10000');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset all</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Sidebar Filters + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Sidebar / Mobile Modal */}
        <aside
          className={`${
            isMobileFilterOpen
              ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto block'
              : 'hidden lg:block'
          } bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6`}
        >
          {isMobileFilterOpen && (
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Filters</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Categories Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Category
            </h4>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => setActiveCategoryFilter(null)}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-between ${
                  activeCategoryFilter === null
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] opacity-75">{products.length}</span>
              </button>
              {categories.map((c) => {
                const count = products.filter(
                  (p) => p.category.toLowerCase() === c.name.toLowerCase()
                ).length;
                const isSelected = activeCategoryFilter?.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategoryFilter(isSelected ? null : c.name)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] opacity-75">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seller Filter */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Filter By Seller
            </h4>
            {availableSellers.length > 0 ? (
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                <button
                  onClick={() => setActiveSellerFilter(null)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    activeSellerFilter === null
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Sellers
                </button>
                {availableSellers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSellerFilter(activeSellerFilter === s.id ? null : s.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-between ${
                      activeSellerFilter === s.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-[10px] opacity-70 ml-1">ID: {s.id}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No registered sellers found.</p>
            )}
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Price Range ($)
            </h4>
            <form onSubmit={handleApplyPrice} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Min</label>
                  <input
                    type="number"
                    min="0"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Max</label>
                  <input
                    type="number"
                    min="0"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors"
              >
                Apply Range
              </button>
            </form>
          </div>

          {isMobileFilterOpen && (
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 rounded-2xl bg-blue-600 text-white font-semibold text-sm mt-4"
            >
              Show {filteredProducts.length} Results
            </button>
          )}
        </aside>

        {/* Product Results */}
        <main className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-900 font-semibold">{filteredProducts.length}</strong>{' '}
              {filteredProducts.length === 1 ? 'product' : 'products'}
            </span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={SearchIcon}
              title={
                products.length === 0
                  ? 'No Products in Marketplace'
                  : 'No Matching Products'
              }
              description={
                products.length === 0
                  ? 'The marketplace is currently empty. Use the prototype tools to add a test product to evaluate search and filtering.'
                  : 'No products matched your search or filter settings. Try adjusting keywords or resetting filters.'
              }
              actionLabel={
                products.length === 0
                  ? 'Add Test Product (Sandbox)'
                  : 'Reset Filters'
              }
              onAction={
                products.length === 0
                  ? () => setIsSandboxModalOpen(true)
                  : () => {
                      resetFilters();
                      setMinPriceInput('0');
                      setMaxPriceInput('10000');
                    }
              }
            />
          )}
        </main>
      </div>
    </div>
  );
};
