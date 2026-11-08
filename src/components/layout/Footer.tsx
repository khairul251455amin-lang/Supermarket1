/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Store, ShieldCheck, Truck, RefreshCw, Sparkles } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';

export const Footer: React.FC = () => {
  const { navigateTo, setIsSandboxModalOpen, categories } = useMarketplace();

  return (
    <footer className="bg-white border-t border-slate-200 mt-16 pb-20 md:pb-8 text-slate-600 text-sm">
      {/* Trust Badges Bar */}
      <div className="border-b border-slate-100 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Verified Marketplace Vendors</h4>
              <p className="text-xs text-slate-500">Every shop and vendor is tracked with verified vendor credentials.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Cash on Delivery Available</h4>
              <p className="text-xs text-slate-500">Pay safely upon delivery at your doorstep with full item verification.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Secure Cloud Platform</h4>
              <p className="text-xs text-slate-500">Fast, verified shopping and real-time merchant operations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-slate-900">Supermarket</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            A modern, multi-vendor shopping marketplace offering clothing, electronics, fresh fruits, watches, devices, cakes, and artisanal essentials.
          </p>
          <button
            onClick={() => navigateTo('welcome')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Welcome & Get Started</span>
          </button>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Product Categories
          </h4>
          <ul className="space-y-1.5 text-xs">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => navigateTo('category', { categorySlug: cat.slug })}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Customer Services
          </h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button
                onClick={() => navigateTo('orders')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Track Orders
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('favourites')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Saved Favourites
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('cart')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Shopping Cart
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('messages')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Contact Sellers
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Architecture Notice
          </h4>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800">Phase 1: Customer Platform</div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Running with localized state management. No fake initial inventory is seeded. Connect Firebase anytime via system tooling.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>© 2026 Supermarket Marketplace. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <span>Terms of Service</span>
          <span>·</span>
          <span>Privacy Policy</span>
          <span>·</span>
          <span>Cash on Delivery Guidelines</span>
        </div>
      </div>
    </footer>
  );
};
