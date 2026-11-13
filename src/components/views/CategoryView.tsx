/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { ProductCard } from '../common/ProductCard';
import { EmptyState } from '../common/EmptyState';

export const CategoryView: React.FC = () => {
  const {
    selectedCategorySlug,
    categories,
    products,
    productsLoading,
    productsError,
    retryProductsSubscription,
    navigateTo,
  } = useMarketplace();

  const currentCategory =
    categories.find((c) => c.slug === selectedCategorySlug) || categories[0];

  const categoryProducts = products.filter(
    (p) => p.category.toLowerCase() === currentCategory.name.toLowerCase()
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Categories</span>
        </button>
      </div>

      {/* Category Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-100">
            <CategoryIcon name={currentCategory.name} className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] mb-0.5">
              Department
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              {currentCategory.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-xl">
              {currentCategory.description}
            </p>
          </div>
        </div>

        <div className="text-right self-stretch sm:self-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E2E8F0] flex items-center sm:flex-col justify-between">
          <span className="text-xs text-[#64748B]">Available Items</span>
          <span className="text-sm font-bold text-[#0F172A] tabular-nums">
            {categoryProducts.length}{' '}
            {categoryProducts.length === 1 ? 'listed item' : 'listed items'}
          </span>
        </div>
      </div>

      {/* Category Quick Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isCurrent = cat.slug === currentCategory.slug;
          return (
            <button
              key={cat.id}
              onClick={() => navigateTo('category', { categorySlug: cat.slug })}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                isCurrent
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-white hover:bg-[#EFF6FF] text-[#0F172A] border border-[#E2E8F0]'
              }`}
            >
              <CategoryIcon name={cat.name} className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {productsError && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{productsError}</span>
          </div>
          <button
            onClick={retryProductsSubscription}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {productsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden animate-pulse">
              <div className="aspect-4/3 bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-1/2 bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : categoryProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={() => <CategoryIcon name={currentCategory.name} className="w-7 h-7" />}
          title={`No Products in ${currentCategory.name} Yet`}
          description={`Sellers haven't published items under ${currentCategory.name} yet.`}
          actionLabel="Browse All Categories"
          onAction={() => navigateTo('home')}
          secondaryLabel="Search Marketplace"
          onSecondaryAction={() => navigateTo('search')}
        />
      )}
    </div>
  );
};
