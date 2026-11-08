/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowRight,
  Store,
  Tag,
  Clock,
  Sparkles,
  Search,
  ThumbsUp,
  ShoppingBag,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { ProductCard } from '../common/ProductCard';
import { EmptyState } from '../common/EmptyState';

export const HomeView: React.FC = () => {
  const {
    products,
    categories,
    navigateTo,
    setIsSandboxModalOpen,
    sellerAccounts,
  } = useMarketplace();

  // Filter dynamic product collections based on genuine data
  const latestProducts = [...products].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const featuredProducts = products.filter((p) => p.isFeatured);

  const discountedProducts = products.filter(
    (p) => typeof p.discountedPrice === 'number' && p.discountedPrice < p.originalPrice
  );

  const recommendedProducts = products.filter((p) => p.isRecommended);

  // Group unique sellers from registered accounts and active products
  const sellerMap = new Map<string, { id: string; name: string; location: string; productCount: number; logo?: string }>();

  // Add registered sellers first
  sellerAccounts.forEach((s) => {
    sellerMap.set(s.id, {
      id: s.id,
      name: s.shopName,
      location: s.shopLocation,
      productCount: products.filter((p) => p.sellerId === s.id).length,
      logo: s.shopLogo,
    });
  });

  // Also include sellers found on products
  products.forEach((p) => {
    if (!sellerMap.has(p.sellerId)) {
      sellerMap.set(p.sellerId, {
        id: p.sellerId,
        name: p.sellerName,
        location: p.sellerLocation || 'Verified Hub',
        productCount: products.filter((item) => item.sellerId === p.sellerId).length,
        logo: undefined,
      });
    }
  });

  const uniqueSellers = Array.from(sellerMap.values());

  return (
    <div className="space-y-12 pb-8">
      {/* Hero Showcase */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-900 text-white shadow-xl min-h-[380px] sm:min-h-[440px] flex items-center">
        {/* Background Image with Scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_supermarket_marketplace_1793597315902.jpg"
            alt="Supermarket interior showcase"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-45 sm:opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-slate-900/40" />
        </div>

        <div className="relative z-10 max-w-2xl px-6 sm:px-12 py-12 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300 bg-blue-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-blue-400/20">
            <span>Customer Marketplace</span>
            <span>·</span>
            <span>Multi-Vendor Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Your destination for fresh goods, gadgets & daily lifestyle.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Browse multiple independent sellers under one roof. Order with confidence using convenient Cash on Delivery.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigateTo('search')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md transition-all active:scale-98 cursor-pointer min-h-[46px]"
            >
              <Search className="w-4 h-4" />
              <span>Browse Catalog</span>
            </button>
            <button
              onClick={() => navigateTo('seller-register')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-medium text-sm transition-all cursor-pointer min-h-[46px]"
            >
              <Store className="w-4 h-4 text-blue-300" />
              <span>Open Your Shop</span>
            </button>
          </div>
        </div>
      </section>

      {/* Product Categories Section (Feature 4 & 1) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Browse Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Explore specialized departments across verified sellers
            </p>
          </div>
          <button
            onClick={() => navigateTo('search')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {categories.map((cat) => {
            const count = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;
            return (
              <button
                key={cat.id}
                onClick={() => navigateTo('category', { categorySlug: cat.slug })}
                className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-600 flex items-center justify-center mb-2 transition-colors">
                  <CategoryIcon name={cat.name} className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {cat.name}
                </span>
                <span className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                  {count} {count === 1 ? 'item' : 'items'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Offers & Discounts Section (Feature 1) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Offers & Discounts
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Genuine promotional discounts directly from sellers
              </p>
            </div>
          </div>
          {discountedProducts.length > 0 && (
            <button
              onClick={() => navigateTo('search')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>See Deals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {discountedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {discountedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Tag}
            title="No Active Discounts Yet"
            description="When marketplace sellers provide genuine discount prices on their products, they will automatically appear here."
            actionLabel="Add Test Discounted Item"
            onAction={() => setIsSandboxModalOpen(true)}
            compact
          />
        )}
      </section>

      {/* Latest Products Section (Feature 1) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Latest Products
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Freshly listed merchandise from marketplace vendors
              </p>
            </div>
          </div>
          {latestProducts.length > 0 && (
            <button
              onClick={() => navigateTo('search')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {latestProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {latestProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="No Products Listed Yet"
            description="The Supermarket marketplace starts 100% empty as specified. Real products will appear as soon as sellers list them."
            actionLabel="Add Test Product (Sandbox)"
            onAction={() => setIsSandboxModalOpen(true)}
            compact
          />
        )}
      </section>

      {/* Featured Products Section (Feature 1) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Featured Products
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Hand-picked highlights spotlighted by marketplace curators
              </p>
            </div>
          </div>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No Featured Items Currently"
            description="Curated products selected for special marketplace features will be showcased in this section."
            actionLabel="Add Featured Test Product"
            onAction={() => setIsSandboxModalOpen(true)}
            compact
          />
        )}
      </section>

      {/* Seller Shops Section (Feature 1) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Seller Shops
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Discover registered independent sellers and brands
              </p>
            </div>
          </div>
        </div>

        {uniqueSellers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueSellers.map((seller) => (
              <div
                key={seller.id}
                onClick={() => navigateTo('shop', { sellerId: seller.id })}
                className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  {seller.logo ? (
                    <img
                      src={seller.logo}
                      alt={seller.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                      {seller.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {seller.name}
                    </h3>
                    <div className="text-xs text-slate-500">
                      ID: {seller.id} · {seller.location}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {seller.productCount} {seller.productCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Store}
            title="No Active Sellers Yet"
            description="Verified merchant storefronts and seller information will be indexed here once shops start listing items."
            actionLabel="Add Product with Custom Seller"
            onAction={() => setIsSandboxModalOpen(true)}
            compact
          />
        )}
      </section>

      {/* Recommended Products Section (Feature 1) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Recommended For You
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Tailored selections based on popularity and ratings
              </p>
            </div>
          </div>
        </div>

        {recommendedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommendedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ThumbsUp}
            title="No Recommendations Yet"
            description="Recommended selections will appear here based on marketplace activity."
            compact
          />
        )}
      </section>
    </div>
  );
};
