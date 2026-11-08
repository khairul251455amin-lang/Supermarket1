/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { ProductCard } from '../common/ProductCard';
import { EmptyState } from '../common/EmptyState';

export const CategoryView: React.FC = () => {
  const {
    selectedCategorySlug,
    categories,
    products,
    navigateTo,
    setIsSandboxModalOpen,
  } = useMarketplace();

  const currentCategory =
    categories.find((c) => c.slug === selectedCategorySlug) || categories[0];

  const categoryProducts = products.filter(
    (p) => p.category.toLowerCase() === currentCategory.name.toLowerCase()
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Back and Breadcrumb */}
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
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
            <CategoryIcon name={currentCategory.name} className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-0.5">
              Department
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {currentCategory.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              {currentCategory.description}
            </p>
          </div>
        </div>

        <div className="text-right self-stretch sm:self-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex items-center sm:flex-col justify-between">
          <span className="text-xs text-slate-400">Inventory Status</span>
          <span className="text-sm font-bold text-slate-900 tabular-nums">
            {categoryProducts.length}{' '}
            {categoryProducts.length === 1 ? 'listed item' : 'listed items'}
          </span>
        </div>
      </div>

      {/* Category Horizontal Quick Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isCurrent = cat.slug === currentCategory.slug;
          return (
            <button
              key={cat.id}
              onClick={() => navigateTo('category', { categorySlug: cat.slug })}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <CategoryIcon name={cat.name} className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Category Product Grid */}
      {categoryProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={() => <CategoryIcon name={currentCategory.name} className="w-7 h-7" />}
          title={`No Products in ${currentCategory.name} Yet`}
          description={`Verified sellers haven't listed items under the ${currentCategory.name} category yet. All marketplace departments start empty until real inventory is added.`}
          actionLabel={`Add Product to ${currentCategory.name}`}
          onAction={() => setIsSandboxModalOpen(true)}
          secondaryLabel="Browse All Categories"
          onSecondaryAction={() => navigateTo('home')}
        />
      )}
    </div>
  );
};
