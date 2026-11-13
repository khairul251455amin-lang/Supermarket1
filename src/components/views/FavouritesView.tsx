/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, Lock } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ProductCard } from '../common/ProductCard';
import { EmptyState } from '../common/EmptyState';

export const FavouritesView: React.FC = () => {
  const {
    user,
    favourites,
    products,
    navigateTo,
  } = useMarketplace();

  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-[#E2E8F0] shadow-xs max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">Sign In to View Saved Favourites</h2>
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          Please sign in or create an account to save favourite products and access your wishlist across devices.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigateTo('auth', { authMode: 'login' })}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl cursor-pointer min-h-[42px]"
          >
            Sign In
          </button>
          <button
            onClick={() => navigateTo('auth', { authMode: 'register' })}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-[#0F172A] bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] rounded-xl cursor-pointer min-h-[42px]"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  // Match favourite IDs against published products in marketplace
  const savedProducts = products.filter((p) => favourites.includes(p.id));

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Saved Favourites
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Your personal wishlist of saved multi-vendor products
          </p>
        </div>
        <span className="text-xs font-semibold text-[#64748B] tabular-nums">
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
          description="You haven't saved any products yet. Tap the heart button on any product to save items here for later."
          actionLabel="Explore Marketplace"
          onAction={() => navigateTo('home')}
        />
      )}
    </div>
  );
};
