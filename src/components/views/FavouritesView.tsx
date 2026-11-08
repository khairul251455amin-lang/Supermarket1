/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ProductCard } from '../common/ProductCard';
import { EmptyState } from '../common/EmptyState';

export const FavouritesView: React.FC = () => {
  const {
    favourites,
    products,
    navigateTo,
  } = useMarketplace();

  // Match favourite IDs against actual products in marketplace
  const savedProducts = products.filter((p) => favourites.includes(p.id));

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Saved Favourites
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Your personal wishlist of saved multi-vendor products
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 tabular-nums">
          {savedProducts.length} {savedProducts.length === 1 ? 'item saved' : 'items saved'}
        </span>
      </div>

      {savedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="Your Favourites List is Empty"
          description="You haven't saved any products yet. Click the heart icon (♥) on any product card to save items here for later."
          actionLabel="Explore Marketplace"
          onAction={() => navigateTo('home')}
        />
      )}
    </div>
  );
};
