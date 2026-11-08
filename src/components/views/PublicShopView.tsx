/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  Star,
  Clock,
  Truck,
  Building,
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

  const [copied, setCopied] = useState(false);

  // Look up seller profile
  const seller = sellerAccounts.find((s) => s.id === selectedSellerId);
  // Also check products to see if seller exists in product listings
  const sellerProducts = products.filter(
    (p) => p.sellerId === selectedSellerId && p.isAvailable !== false
  );
  const sellerName = seller?.shopName || sellerProducts[0]?.sellerName || 'Verified Marketplace Shop';
  const sellerLocation = seller?.shopLocation || sellerProducts[0]?.sellerLocation || 'Verified Hub';
  const ownerFullName = seller?.fullName || 'Verified Merchant';

  // Public shop URL path representation
  const publicShopUrl = `${window.location.origin}/shop/${selectedSellerId || 'shop'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicShopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContactShop = () => {
    if (!selectedSellerId) return;
    startConversation(
      selectedSellerId,
      sellerName,
      undefined,
      `Hello ${sellerName}, I am visiting your public shop on Supermarket and have an inquiry.`
    );
    navigateTo('messages');
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <span className="text-xs font-mono text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
          Public Shop URL: <code className="text-blue-600">/shop/{selectedSellerId}</code>
        </span>
      </div>

      {/* Public Shop Showcase Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/95 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-5">
            {seller?.shopLogo ? (
              <img
                src={seller.shopLogo}
                alt={sellerName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-3xl flex items-center justify-center border border-blue-200 shadow-sm shrink-0">
                {sellerName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {sellerName}
                </h1>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    seller?.isOpen === false
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {seller?.isOpen === false ? 'Temporarily Closed' : 'Open & Active'}
                </span>
              </div>

              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {sellerLocation}
                </span>
                <span>·</span>
                <span className="font-mono text-slate-600">
                  Seller ID: <strong className="text-slate-900">{selectedSellerId}</strong>
                </span>
                <span>·</span>
                <span className="text-slate-500">
                  Merchant: <strong className="text-slate-800">{ownerFullName}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-bold">No ratings yet.</span>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  <span>{sellerProducts.length} published products</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'Shop Link Copied!' : 'Share Shop Link'}</span>
            </button>

            <button
              onClick={handleContactShop}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 min-h-[40px]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message Shop</span>
            </button>
          </div>
        </div>

        {/* Shop Business Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* About Description */}
          <div className="md:col-span-2 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-600" />
              <span>About {sellerName}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {seller?.shopDescription || `${sellerName} is a verified independent vendor on Supermarket, providing quality merchandise and dependable dispatch standards to local customers.`}
            </p>
          </div>

          {/* Fulfillment & Delivery Standards */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Fulfillment & Delivery</span>
            </h3>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Standard Home Delivery Available</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Express Local Dispatch Supported</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Secure Cash on Delivery & Online Pay</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Seller's Published Products Collection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Published Products by {sellerName}
            </h2>
            <p className="text-xs text-slate-500">
              All active merchandise currently offered by this vendor
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            {sellerProducts.length} {sellerProducts.length === 1 ? 'Item' : 'Items'} Available
          </span>
        </div>

        {sellerProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sellerProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xs text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              This shop hasn't published any products yet.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {sellerName} has not added any active merchandise to the Supermarket catalog at this moment. Check back soon for new arrivals!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
