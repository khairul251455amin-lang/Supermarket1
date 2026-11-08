/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  MessageSquare,
  Package,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ProductCard } from '../common/ProductCard';
import { EmptyState } from '../common/EmptyState';

export const PublicShopView: React.FC = () => {
  const {
    selectedSellerId,
    sellerAccounts,
    products,
    navigateTo,
    startConversation,
  } = useMarketplace();

  const [copied, setCopied] = React.useState(false);

  // Look up seller profile
  const seller = sellerAccounts.find((s) => s.id === selectedSellerId);
  // Also check products to see if seller exists in product listings
  const sellerProducts = products.filter((p) => p.sellerId === selectedSellerId);
  const sellerName = seller?.shopName || sellerProducts[0]?.sellerName || 'Marketplace Seller';
  const sellerLocation = seller?.shopLocation || sellerProducts[0]?.sellerLocation || 'Verified Hub';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContactShop = () => {
    if (!selectedSellerId) return;
    startConversation(
      selectedSellerId,
      sellerName,
      undefined,
      `Hello ${sellerName}, I am browsing your shop on Supermarket and have an inquiry.`
    );
    navigateTo('messages');
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>
      </div>

      {/* Shop Showcase Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {seller?.shopLogo ? (
              <img
                src={seller.shopLogo}
                alt={sellerName}
                className="w-18 h-18 rounded-2xl object-cover border border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-18 h-18 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-2xl flex items-center justify-center border border-blue-200 shadow-xs">
                {sellerName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{sellerName}</h1>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    seller?.isOpen === false
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {seller?.isOpen === false ? 'Temporarily Closed' : 'Verified Vendor'}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {sellerLocation}
                </span>
                <span>·</span>
                <span className="font-mono text-slate-700 font-medium">
                  Seller ID: {selectedSellerId}
                </span>
                <span>·</span>
                <span className="text-slate-400">
                  {sellerProducts.length} {sellerProducts.length === 1 ? 'product' : 'products'} listed
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share Shop'}</span>
            </button>

            <button
              onClick={handleContactShop}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact Seller</span>
            </button>
          </div>
        </div>

        {seller?.shopDescription && (
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
              About the Shop
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl whitespace-pre-line">
              {seller.shopDescription}
            </p>
          </div>
        )}
      </div>

      {/* Seller's Products Collection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Products from {sellerName} ({sellerProducts.length})
          </h2>
        </div>

        {sellerProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sellerProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No Products Currently Listed by this Seller"
            description="This merchant has not published any merchandise yet."
            compact
          />
        )}
      </div>
    </div>
  );
};
