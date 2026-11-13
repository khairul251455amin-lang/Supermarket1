/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search as SearchIcon,
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { marketplaceConfig } from '../../config/marketplaceConfig';
import { ProductCard } from '../common/ProductCard';
import { EmptyState } from '../common/EmptyState';

const PAGE_SIZE = 12;

export const SearchView: React.FC = () => {
  const {
    products,
    productsLoading,
    productsError,
    retryProductsSubscription,
    publicShops,
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
    navigateTo,
  } = useMarketplace();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState(priceRange[0].toString());
  const [maxPriceInput, setMaxPriceInput] = useState(priceRange[1].toString());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, activeCategoryFilter, activeSellerFilter, priceRange, sortBy]);

  // Unique sellers merged from publicShops and published products
  const availableSellers = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    publicShops.forEach((s) => map.set(s.id, { id: s.id, name: s.shopName }));
    products.forEach((p) => {
      if (!map.has(p.sellerId)) {
        map.set(p.sellerId, { id: p.sellerId, name: p.shopName || p.sellerName });
      }
    });
    return Array.from(map.values());
  }, [products, publicShops]);

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseFloat(minPriceInput) || 0;
    const max = parseFloat(maxPriceInput) || 10000;
    setPriceRange([min, max]);
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchesName = prod.name.toLowerCase().includes(query);
          const matchesDesc = prod.description.toLowerCase().includes(query);
          const matchesCat = prod.category.toLowerCase().includes(query);
          const matchesShop = (prod.shopName || prod.sellerName).toLowerCase().includes(query);
          const matchesKeywords = (prod.searchKeywords || []).some((kw) =>
            kw.toLowerCase().includes(query)
          );
          if (!matchesName && !matchesDesc && !matchesCat && !matchesShop && !matchesKeywords) {
            return false;
          }
        }

        if (activeCategoryFilter) {
          if (prod.category.toLowerCase() !== activeCategoryFilter.toLowerCase()) {
            return false;
          }
        }

        if (activeSellerFilter) {
          if (prod.sellerId !== activeSellerFilter) {
            return false;
          }
        }

        const effectivePrice = prod.discountedPrice ?? prod.originalPrice ?? prod.price;
        if (effectivePrice < priceRange[0] || effectivePrice > priceRange[1]) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.discountedPrice ?? a.originalPrice ?? a.price;
        const priceB = b.discountedPrice ?? b.originalPrice ?? b.price;

        if (sortBy === 'price-low') return priceA - priceB;
        if (sortBy === 'price-high') return priceB - priceA;
        return (
          new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime()
        );
      });
  }, [products, searchQuery, activeCategoryFilter, activeSellerFilter, priceRange, sortBy]);

  const paginatedProducts = filteredProducts.slice(0, visibleCount);

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (activeCategoryFilter ? 1 : 0) +
    (activeSellerFilter ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Search Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <SearchIcon className="w-5 h-5 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products by title, shop, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 text-sm rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] placeholder:text-[#64748B] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#0F172A] rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] text-xs font-semibold hover:bg-slate-100 min-h-[44px] cursor-pointer"
            >
              <Filter className="w-4 h-4 text-[#2563EB]" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] flex items-center justify-center font-bold tabular-nums">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-xl px-3 py-2.5 bg-[#F8FAFC] text-xs font-medium text-[#0F172A] min-h-[44px]">
              <SlidersHorizontal className="w-4 h-4 text-[#64748B]" />
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
                <button onClick={() => setSearchQuery('')} className="hover:text-blue-900 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeCategoryFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">
                Category: {activeCategoryFilter}
                <button onClick={() => setActiveCategoryFilter(null)} className="hover:text-blue-900 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeSellerFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">
                Shop ID: {activeSellerFilter}
                <button onClick={() => setActiveSellerFilter(null)} className="hover:text-blue-900 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 10000) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">
                Price: {marketplaceConfig.currency.symbol}
                {priceRange[0]} – {marketplaceConfig.currency.symbol}
                {priceRange[1]}
                <button
                  onClick={() => {
                    setPriceRange([0, 10000]);
                    setMinPriceInput('0');
                    setMaxPriceInput('10000');
                  }}
                  className="hover:text-blue-900 cursor-pointer"
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
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 ml-auto cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset all</span>
            </button>
          </div>
        )}
      </div>

      {productsError && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{productsError}</span>
          </div>
          <button
            type="button"
            onClick={retryProductsSubscription}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Grid: Sidebar Filters + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <aside
          className={`${
            isMobileFilterOpen
              ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto block'
              : 'hidden lg:block'
          } bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-6`}
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
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Category</h4>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => setActiveCategoryFilter(null)}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
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
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
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
              Filter By Shop
            </h4>
            {availableSellers.length > 0 ? (
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                <button
                  onClick={() => setActiveSellerFilter(null)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    activeSellerFilter === null
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Shops
                </button>
                {availableSellers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSellerFilter(activeSellerFilter === s.id ? null : s.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
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
              <p className="text-xs text-slate-400 italic">No active shops yet.</p>
            )}
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Price Range ({marketplaceConfig.currency.symbol})
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
                className="w-full py-2 text-xs font-semibold rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white transition-colors cursor-pointer"
              >
                Apply Range
              </button>
            </form>
          </div>

          {isMobileFilterOpen && (
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm mt-4 cursor-pointer"
            >
              Show {filteredProducts.length} Results
            </button>
          )}
        </aside>

        {/* Product Results */}
        <main className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
            <span>
              Showing <strong className="text-[#0F172A] font-semibold tabular-nums">{filteredProducts.length}</strong>{' '}
              {filteredProducts.length === 1 ? 'product' : 'products'}
            </span>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden animate-pulse"
                >
                  <div className="aspect-4/3 bg-slate-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-1/2 bg-slate-200 rounded" />
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {visibleCount < filteredProducts.length && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="px-6 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#2563EB] text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] shadow-xs transition-colors cursor-pointer"
                  >
                    Load More Products ({filteredProducts.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={SearchIcon}
              title={products.length === 0 ? 'No Products Available Yet' : 'No Matching Products'}
              description={
                products.length === 0
                  ? 'No products have been published to the marketplace yet. Sellers can publish items from their Seller Dashboard.'
                  : 'No products matched your search or filter settings. Try adjusting keywords or resetting filters.'
              }
              actionLabel={products.length === 0 ? 'Open a Seller Shop' : 'Reset Filters'}
              onAction={
                products.length === 0
                  ? () => navigateTo('seller-register')
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
