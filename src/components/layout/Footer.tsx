/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Store, Mail, MapPin, ArrowUpRight } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { marketplaceConfig } from '../../config/marketplaceConfig';

export const Footer: React.FC = () => {
  const { navigateTo } = useMarketplace();

  return (
    <footer className="bg-[#0F172A] text-slate-300 border-t border-blue-900/60 mt-16 pb-20 md:pb-8">
      <div className="h-1 w-full bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#0F172A]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
        {/* Column 1: SUPERMARKET */}
        <div className="col-span-2 md:col-span-1 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-white uppercase">
              {marketplaceConfig.marketplaceName}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
            {marketplaceConfig.marketplaceDescription}
          </p>
          <ul className="space-y-2 text-xs text-slate-300 pt-1">
            <li>
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                Marketplace
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo('welcome', { welcomeStep: 'welcome' })}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                About
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo('seller-register')}
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer"
              >
                <span>Become a Seller</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo('messages')}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                Contact
              </button>
            </li>
          </ul>
        </div>

        {/* Column 2: SHOP */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Shop
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>
              <button
                type="button"
                onClick={() => navigateTo('category', { categorySlug: 'clothing' })}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Categories
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo('search')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Latest Products
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Seller Shops
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: CUSTOMER */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Customer
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>
              <button
                type="button"
                onClick={() => navigateTo('profile')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                My Account
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo('orders')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Orders
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo('favourites')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Favorites
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo('cart')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Cart
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo('messages')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Messages
              </button>
            </li>
          </ul>
        </div>

        {/* Column 4: SUPPORT */}
        <div className="col-span-2 md:col-span-1 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Support
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>
              <button
                type="button"
                onClick={() => navigateTo('welcome')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Help Center
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo('messages')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Contact Support
              </button>
            </li>
            <li className="text-slate-400">{marketplaceConfig.business.termsLabel}</li>
            <li className="text-slate-400">{marketplaceConfig.business.privacyLabel}</li>
            <li className="text-slate-400">Delivery Policy</li>
          </ul>

          <div className="pt-2 space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">{marketplaceConfig.contact.supportEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{marketplaceConfig.contact.cityHub}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          © {marketplaceConfig.business.copyrightYear} {marketplaceConfig.marketplaceName}. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>Cash on Delivery Supported</span>
          <span>·</span>
          <span>Multi-Vendor Platform</span>
        </div>
      </div>
    </footer>
  );
};
