/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Store,
  Search,
  ShoppingCart,
  Heart,
  MessageSquare,
  Bell,
  User as UserIcon,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { marketplaceConfig } from '../../config/marketplaceConfig';

export const Navbar: React.FC = () => {
  const {
    currentView,
    navigateTo,
    cartCount,
    favourites,
    unreadMessagesCount,
    unreadNotificationsCount,
    unreadSellerNotificationsCount,
    user,
    currentSeller,
    sellerOrders,
    searchQuery,
    setSearchQuery,
  } = useMarketplace();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const pendingSellerOrdersCount = currentSeller
    ? sellerOrders.filter((so) => so.sellerId === currentSeller.id && so.status === 'Pending').length
    : 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    navigateTo('search', { searchQuery: localSearch });
  };

  return (
    <>
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3 lg:gap-6">
          {/* Left: Logo + SUPERMARKET Wordmark */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2.5 text-left shrink-0 cursor-pointer group min-h-[40px]"
          >
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] group-hover:bg-[#1D4ED8] text-white flex items-center justify-center transition-colors shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#0F172A] uppercase">
              {marketplaceConfig.marketplaceName}
            </span>
          </button>

          {/* Center: Compact Search Bar (Desktop & Tablet) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-lg relative items-center"
          >
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products, shops and categories..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-20 text-sm rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all text-[#0F172A] placeholder:text-[#64748B]"
            />
            {localSearch && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setLocalSearch('');
                  setSearchQuery('');
                }}
                className="absolute right-16 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 h-7 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Desktop Quick Nav Links */}
          <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-[#64748B]">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className={`whitespace-nowrap transition-colors hover:text-[#2563EB] cursor-pointer ${
                currentView === 'home' ? 'text-[#2563EB] font-semibold' : ''
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => navigateTo('search')}
              className={`whitespace-nowrap transition-colors hover:text-[#2563EB] cursor-pointer ${
                currentView === 'search' || currentView === 'category' ? 'text-[#2563EB] font-semibold' : ''
              }`}
            >
              Explore
            </button>
            {(user || currentSeller) && (
              <button
                type="button"
                onClick={() => navigateTo('orders')}
                className={`whitespace-nowrap transition-colors hover:text-[#2563EB] cursor-pointer ${
                  currentView === 'orders' ? 'text-[#2563EB] font-semibold' : ''
                }`}
              >
                Orders
              </button>
            )}
          </nav>

          {/* Right: Action Icons & Account CTA */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Authenticated Seller Console Switcher */}
            {currentSeller && (
              <button
                type="button"
                onClick={() =>
                  navigateTo(currentView === 'seller-dashboard' ? 'home' : 'seller-dashboard')
                }
                className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 h-9 sm:h-10 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  currentView === 'seller-dashboard'
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-[#EFF6FF] hover:bg-blue-100 text-[#1D4ED8] border border-blue-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  {currentView === 'seller-dashboard' ? 'Marketplace' : 'Seller Hub'}
                </span>
                {(pendingSellerOrdersCount > 0 || unreadSellerNotificationsCount > 0) && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {pendingSellerOrdersCount + unreadSellerNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Mobile Search Icon Trigger */}
            <button
              type="button"
              onClick={() => navigateTo('search')}
              aria-label="Search marketplace"
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications (Desktop & Mobile Icon) */}
            <button
              type="button"
              onClick={() => navigateTo('notifications')}
              aria-label="Notifications"
              className={`hidden sm:flex relative w-10 h-10 rounded-xl items-center justify-center transition-colors cursor-pointer ${
                currentView === 'notifications'
                  ? 'bg-[#EFF6FF] text-[#2563EB]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
              }`}
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Messages (Desktop) */}
            <button
              type="button"
              onClick={() => navigateTo('messages')}
              aria-label="Messages"
              className={`hidden sm:flex relative w-10 h-10 rounded-xl items-center justify-center transition-colors cursor-pointer ${
                currentView === 'messages'
                  ? 'bg-[#EFF6FF] text-[#2563EB]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-4.5 h-4.5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-[#2563EB] text-white rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Favorites (Desktop) */}
            <button
              type="button"
              onClick={() => navigateTo('favourites')}
              aria-label="Favorites"
              className={`hidden sm:flex relative w-10 h-10 rounded-xl items-center justify-center transition-colors cursor-pointer ${
                currentView === 'favourites'
                  ? 'bg-rose-50 text-rose-600'
                  : 'text-[#64748B] hover:text-rose-600 hover:bg-slate-100'
              }`}
            >
              <Heart
                className={`w-4.5 h-4.5 ${favourites.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`}
              />
              {favourites.length > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {favourites.length}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              type="button"
              onClick={() => navigateTo('cart')}
              aria-label={`Shopping cart with ${cartCount} items`}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-xl transition-colors cursor-pointer ${
                currentView === 'cart'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#EFF6FF] text-[#1D4ED8] hover:bg-blue-100'
              }`}
            >
              <ShoppingCart className="w-4.5 h-4.5 shrink-0" />
              <span className="hidden md:inline text-xs font-semibold">Cart</span>
              {cartCount > 0 && (
                <span
                  className={`min-w-4.5 h-4.5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center tabular-nums ${
                    currentView === 'cart' ? 'bg-white text-[#2563EB]' : 'bg-[#2563EB] text-white'
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Account / Sign In CTA */}
            {user || currentSeller ? (
              <button
                type="button"
                onClick={() => navigateTo(currentSeller && !user ? 'seller-dashboard' : 'profile')}
                aria-label="Account Profile"
                className="flex items-center gap-2 pl-1.5 pr-2.5 h-10 rounded-xl border border-[#E2E8F0] hover:border-blue-300 bg-white text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : currentSeller?.shopLogo ? (
                  <img
                    src={currentSeller.shopLogo}
                    alt={currentSeller.shopName}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs">
                    {(user?.name || currentSeller?.shopName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline text-xs font-semibold max-w-[96px] truncate">
                  {user ? user.name : currentSeller?.shopName}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigateTo('welcome', { welcomeStep: 'purpose' })}
                className="flex items-center gap-1.5 px-3 sm:px-4 h-10 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors text-xs font-semibold shadow-xs cursor-pointer whitespace-nowrap"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Second-Row Search Strip (scrolls cleanly without bloating sticky height) */}
      {currentView !== 'seller-dashboard' && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-2.5">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products, shops and categories..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-16 text-sm rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#2563EB] text-[#0F172A] placeholder:text-[#64748B]"
            />
            {localSearch && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setLocalSearch('');
                  setSearchQuery('');
                }}
                className="absolute right-14 p-1 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 h-7 px-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
            >
              Go
            </button>
          </form>
        </div>
      )}
    </>
  );
};
