/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  ArrowLeft,
  MessageSquare,
  Package,
  Copy,
  Check,
  Truck,
  BadgeCheck,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { marketplaceConfig } from '../../config/marketplaceConfig';
import { PublicShop } from '../../types';
import { ProductCard } from '../common/ProductCard';
import { EmptyState } from '../common/EmptyState';

export const PublicShopView: React.FC = () => {
  const {
    selectedSellerId,
    publicShops,
    publicShopsLoading,
    loadPublicShopById,
    products,
    navigateTo,
    startConversation,
  } = useMarketplace();

  const [copied, setCopied] = useState(false);
  const [fetchedShop, setFetchedShop] = useState<PublicShop | null>(null);
  const [loadingDirect, setLoadingDirect] = useState(false);

  const liveShop = publicShops.find(
    (s) => s.id === selectedSellerId || s.shopId === selectedSellerId || s.sellerId === selectedSellerId
  );

  useEffect(() => {
    if (!selectedSellerId || liveShop) {
      setFetchedShop(null);
      return;
    }
    let cancelled = false;
    setLoadingDirect(true);
    loadPublicShopById(selectedSellerId)
      .then((res) => {
        if (!cancelled) setFetchedShop(res);
      })
      .finally(() => {
        if (!cancelled) setLoadingDirect(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSellerId, Boolean(liveShop)]);

  const shop = liveShop || fetchedShop;

  // Strictly only published products for this shop
  const sellerProducts = products.filter(
    (p) =>
      (p.sellerId === selectedSellerId || p.shopId === selectedSellerId) &&
      p.status === 'published' &&
      p.isAvailable !== false &&
      !p.isRemovedByModeration
  );

  if ((publicShopsLoading || loadingDirect) && !shop && sellerProducts.length === 0) {
    return (
      <div className="max-w-6xl mx-auto py-6 space-y-6 animate-pulse">
        <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0]">
          <div className="h-32 bg-slate-200" />
          <div className="p-6 flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-1/3 bg-slate-200 rounded" />
              <div className="h-4 w-1/2 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!shop && sellerProducts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-[#E2E8F0] max-w-lg mx-auto my-12 space-y-4">
        <Store className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-[#0F172A]">Shop Not Found</h2>
        <p className="text-xs text-[#64748B]">
          This storefront does not exist or is currently unavailable.
        </p>
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl cursor-pointer"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const sellerName =
    shop?.shopName || sellerProducts[0]?.shopName || sellerProducts[0]?.sellerName || 'Verified Shop';
  const sellerLocation =
    shop?.shopLocation ||
    sellerProducts[0]?.location ||
    sellerProducts[0]?.sellerLocation ||
    marketplaceConfig.contact.cityHub;
  const shopCategory = shop?.shopCategory || 'Multi-Category Store';
  const deliveryMethods = shop?.deliveryOptions || ['Seller Delivery', 'Supermarket Delivery'];

  const publicShopUrl = `${window.location.origin}/shop/${encodeURIComponent(selectedSellerId || '')}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicShopUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContactShop = () => {
    if (!selectedSellerId) return;
    startConversation(
      selectedSellerId,
      sellerName,
      undefined,
      `Hello ${sellerName}, I am visiting your public shop on ${marketplaceConfig.marketplaceName} and have an inquiry.`
    );
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#2563EB] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>
      </div>

      {/* Storefront Architectural Cover + Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="h-28 sm:h-36 bg-gradient-to-r from-[#0F172A] via-[#111827] to-[#1D4ED8] relative px-6 sm:px-8 flex items-end pb-4">
          <div className="text-[11px] font-mono text-blue-200/80 ml-auto hidden sm:block">
            /shop/{selectedSellerId}
          </div>
        </div>

        <div className="p-6 sm:p-8 -mt-12 relative space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-[#E2E8F0]">
            <div className="flex items-end gap-4 sm:gap-5">
              {shop?.shopLogo ? (
                <img
                  src={shop.shopLogo}
                  alt={sellerName}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white shrink-0"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#EFF6FF] text-[#2563EB] font-extrabold text-3xl flex items-center justify-center border-4 border-white shadow-md shrink-0">
                  {sellerName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight truncate">
                    {sellerName}
                  </h1>
                  <BadgeCheck className="w-5 h-5 text-[#2563EB] shrink-0" aria-label="Verified Shop" />
                </div>

                <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="font-semibold text-[#2563EB]">{shopCategory}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {sellerLocation}
                  </span>
                  <span>·</span>
                  <span
                    className={
                      shop?.isOpen === false
                        ? 'text-rose-600 font-semibold'
                        : 'text-emerald-600 font-semibold'
                    }
                  >
                    {shop?.isOpen === false ? 'Closed' : 'Open & Active'}
                  </span>
                  {shop?.showSellerId !== false && (
                    <>
                      <span>·</span>
                      <span className="font-mono text-slate-500">ID: {selectedSellerId}</span>
                    </>
                  )}
                  {shop?.showSellerName !== false && shop?.publicSellerName && (
                    <>
                      <span>·</span>
                      <span>Owner: {shop.publicSellerName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="h-10 px-4 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[#0F172A] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#64748B]" />}
                <span>{copied ? 'Link Copied' : 'Share Shop'}</span>
              </button>

              <button
                type="button"
                onClick={handleContactShop}
                className="h-10 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message Shop</span>
              </button>
            </div>
          </div>

          {/* About & Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-2">
              <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                About this Shop
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed whitespace-pre-line">
                {shop?.shopDescription ||
                  `${sellerName} is an independent shop on ${marketplaceConfig.marketplaceName}.`}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                <Truck className="w-4 h-4 text-[#2563EB]" />
                <span>Delivery Options</span>
              </div>
              <ul className="text-xs text-[#64748B] space-y-1.5">
                {deliveryMethods.map((method) => (
                  <li key={method} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{method}</span>
                  </li>
                ))}
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span>Cash on Delivery Supported</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Published Products Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">Shop Products</h2>
            <p className="text-xs text-[#64748B]">
              {sellerProducts.length} {sellerProducts.length === 1 ? 'item' : 'items'} published by{' '}
              {sellerName}
            </p>
          </div>
        </div>

        {sellerProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {sellerProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No published products yet"
            description={`${sellerName} has not published any active products yet.`}
            actionLabel="Explore Marketplace"
            onAction={() => navigateTo('home')}
            compact
          />
        )}
      </section>
    </div>
  );
};
