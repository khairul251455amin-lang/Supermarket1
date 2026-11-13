/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowRight,
  Store,
  Tag,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Lock,
  Truck,
  Smartphone,
  MapPin,
  BadgeCheck,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { marketplaceConfig } from '../../config/marketplaceConfig';
import { CategoryIcon } from '../common/CategoryIcon';
import { ProductCard } from '../common/ProductCard';
import { EmptyState } from '../common/EmptyState';
import heroMarketplaceShowcaseImg from '../../assets/images/hero_marketplace_showcase_1794580341801.jpg';
import heroMarketplaceFallbackImg from '../../assets/images/hero_supermarket_marketplace_1793597315902.jpg';

export const HomeView: React.FC = () => {
  const {
    products,
    productsLoading,
    productsError,
    retryProductsSubscription,
    publicShops,
    publicShopsLoading,
    categories,
    navigateTo,
  } = useMarketplace();

  const latestProducts = [...products].sort(
    (a, b) =>
      new Date(b.publishedAt || b.createdAt).getTime() -
      new Date(a.publishedAt || a.createdAt).getTime()
  );

  const featuredProducts = products.filter((p) => p.isFeatured);
  const discountedProducts = products.filter(
    (p) =>
      typeof p.discountedPrice === 'number' &&
      p.discountedPrice < (p.originalPrice ?? p.price)
  );

  // Merge public shops with active sellers derived from published products
  const sellerMap = new Map<
    string,
    {
      id: string;
      name: string;
      publicSellerName?: string;
      category: string;
      location: string;
      productCount: number;
      logo?: string;
      isOpen: boolean;
    }
  >();

  publicShops.forEach((s) => {
    sellerMap.set(s.id, {
      id: s.id,
      name: s.shopName,
      publicSellerName: s.showSellerName ? s.publicSellerName : undefined,
      category: s.shopCategory || 'General',
      location: s.shopLocation || marketplaceConfig.contact.cityHub,
      productCount: products.filter((p) => p.sellerId === s.id).length,
      logo: s.shopLogo,
      isOpen: s.isOpen,
    });
  });

  products.forEach((p) => {
    if (!sellerMap.has(p.sellerId)) {
      sellerMap.set(p.sellerId, {
        id: p.sellerId,
        name: p.shopName || p.sellerName,
        category: p.category || 'General',
        location: p.location || p.sellerLocation || marketplaceConfig.contact.cityHub,
        productCount: products.filter((item) => item.sellerId === p.sellerId).length,
        logo: undefined,
        isOpen: true,
      });
    }
  });

  const uniqueSellers = Array.from(sellerMap.values());

  const renderSkeletonGrid = (count = 4) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden animate-pulse"
        >
          <div className="aspect-4/3 bg-slate-200/70" />
          <div className="p-4 space-y-2.5">
            <div className="h-3 w-1/2 bg-slate-200/70 rounded" />
            <div className="h-4 w-4/5 bg-slate-200/70 rounded" />
            <div className="h-5 w-1/3 bg-slate-200/70 rounded mt-3" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderShopSkeletons = (count = 3) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-5 border border-[#E2E8F0] animate-pulse flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-xl bg-slate-200/70 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-slate-200/70 rounded" />
            <div className="h-3 w-1/2 bg-slate-200/70 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  const trustCards = [
    {
      icon: ShieldCheck,
      title: 'Verified Sellers',
      description: 'Shop from trusted marketplace sellers.',
    },
    {
      icon: Lock,
      title: 'Secure Shopping',
      description: 'Your account and order information are protected.',
    },
    {
      icon: Truck,
      title: 'Flexible Delivery',
      description: 'Choose available delivery options.',
    },
    {
      icon: Smartphone,
      title: 'Multi-device Experience',
      description: 'Shop smoothly from phone, tablet or desktop.',
    },
  ];

  return (
    <div className="space-y-10 sm:space-y-14 pb-8">
      {/* 1. COMMERCIAL HERO SECTION */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#1D4ED8] text-white border border-slate-800/70 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Left Copy Column */}
          <div className="lg:col-span-7 px-6 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-14 space-y-5 z-10">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-300">
              {marketplaceConfig.marketplaceName} · Multi-Vendor Marketplace
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12] text-balance">
              Everything you need.
              <br />
              All in one marketplace.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Discover products from independent sellers and local shops. Shop easily, compare products and order from trusted sellers.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo('search')}
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 h-11 sm:h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
              >
                <span>Explore Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigateTo('seller-register')}
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 h-11 sm:h-12 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/25 font-semibold text-sm transition-colors cursor-pointer"
              >
                <Store className="w-4 h-4 text-blue-300" />
                <span>Become a Seller</span>
              </button>
            </div>
          </div>

          {/* Right Curated Photography Visual */}
          <div className="lg:col-span-5 relative h-48 sm:h-64 lg:h-full lg:min-h-[380px] overflow-hidden bg-[#0F172A]">
            <img
              src={heroMarketplaceShowcaseImg}
              alt={`${marketplaceConfig.marketplaceName} featured products across electronics, watches, apparel and fresh produce`}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = heroMarketplaceFallbackImg;
              }}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0F172A] via-[#0F172A]/25 to-transparent" />
          </div>
        </div>
      </section>

      {/* Firestore Error Notice */}
      {productsError && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                Unable to load marketplace products right now
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">{productsError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={retryProductsSubscription}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. CATEGORIES SECTION */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
              Categories
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Browse departments across independent shops
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('search')}
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex overflow-x-auto gap-3 pb-2 snap-x scrollbar-none sm:grid sm:grid-cols-5 lg:grid-cols-9 sm:overflow-visible sm:pb-0">
          {categories.map((cat) => {
            const count = products.filter(
              (p) => p.category.toLowerCase() === cat.name.toLowerCase()
            ).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigateTo('category', { categorySlug: cat.slug })}
                className="group min-w-[106px] sm:min-w-0 snap-start flex flex-col items-center text-center p-3.5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-sm transition-all cursor-pointer shrink-0 sm:shrink"
              >
                <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] group-hover:bg-[#2563EB] text-[#2563EB] group-hover:text-white flex items-center justify-center mb-2.5 transition-colors">
                  <CategoryIcon name={cat.name} className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                  {cat.name}
                </span>
                <span className="text-[11px] text-[#64748B] tabular-nums mt-0.5">
                  {count} {count === 1 ? 'item' : 'items'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. LATEST PRODUCTS SECTION */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
              Latest Products
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Freshly published products from our marketplace sellers
            </p>
          </div>
          {latestProducts.length > 0 && (
            <button
              type="button"
              onClick={() => navigateTo('search')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {productsLoading ? (
          renderSkeletonGrid(4)
        ) : latestProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {latestProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="No products yet"
            description="New products from our sellers will appear here."
            actionLabel="Become a Seller"
            onAction={() => navigateTo('seller-register')}
            compact
          />
        )}
      </section>

      {/* CONDITIONAL: OFFERS & DISCOUNTS */}
      {discountedProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
                  Offers & Discounts
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  Promotional prices offered directly by sellers
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('search')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {discountedProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* CONDITIONAL: FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
                Featured Products
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Highlighted merchandise from active shops
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 4. POPULAR SHOPS / SELLER SHOPS */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
              Popular Shops
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Verified independent sellers and local storefronts
            </p>
          </div>
        </div>

        {publicShopsLoading && uniqueSellers.length === 0 ? (
          renderShopSkeletons(3)
        ) : uniqueSellers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {uniqueSellers.map((seller) => (
              <div
                key={seller.id}
                onClick={() => navigateTo('shop', { sellerId: seller.id })}
                className="group bg-white rounded-2xl p-5 border border-[#E2E8F0] hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  {seller.logo ? (
                    <img
                      src={seller.logo}
                      alt={seller.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover border border-[#E2E8F0] shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xl shrink-0">
                      {seller.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">
                        {seller.name}
                      </h3>
                      <BadgeCheck
                        className="w-4 h-4 text-[#2563EB] shrink-0"
                        aria-label="Verified Seller"
                      />
                    </div>

                    <div className="text-xs text-[#64748B] mt-0.5 truncate">
                      {seller.category}
                      {seller.publicSellerName ? ` · ${seller.publicSellerName}` : ''}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-[#64748B] mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{seller.location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <div className="text-[#64748B] tabular-nums">
                    <strong className="text-[#0F172A] font-semibold">{seller.productCount}</strong>{' '}
                    {seller.productCount === 1 ? 'product' : 'products'} ·{' '}
                    <span className={seller.isOpen ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                      {seller.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 font-semibold text-[#2563EB] group-hover:text-[#1D4ED8]">
                    <span>Visit Shop</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Store}
            title="No seller shops yet"
            description="Open your shop and start selling."
            actionLabel="Become a Seller"
            onAction={() => navigateTo('seller-register')}
            compact
          />
        )}
      </section>

      {/* 5. TRUST / BENEFITS STRIP */}
      <section className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {trustCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-5 border border-[#E2E8F0] flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-0.5">{item.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
