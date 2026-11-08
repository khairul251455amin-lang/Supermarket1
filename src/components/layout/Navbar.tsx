/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  ShieldCheck,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';

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

  const pendingSellerOrdersCount = currentSeller
    ? sellerOrders.filter((so) => so.sellerId === currentSeller.id && so.status === 'Pending').length
    : 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    navigateTo('search', { searchQuery: localSearch });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2.5 text-left shrink-0 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
            <Store className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
            Supermarket
          </span>
        </button>

        {/* Center Zone: Search Bar (Desktop) */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md relative items-center"
        >
          <input
            type="text"
            placeholder="Search products by title or keyword..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                setSearchQuery('');
              }}
              className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
          <button
            onClick={() => navigateTo('home')}
            className={`whitespace-nowrap transition-colors hover:text-blue-600 cursor-pointer ${
              currentView === 'home' ? 'text-blue-600 font-semibold' : ''
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigateTo('search')}
            className={`whitespace-nowrap transition-colors hover:text-blue-600 cursor-pointer ${
              currentView === 'search' ? 'text-blue-600 font-semibold' : ''
            }`}
          >
            Search
          </button>
          <button
            onClick={() => navigateTo('welcome')}
            className={`whitespace-nowrap transition-colors hover:text-blue-600 cursor-pointer ${
              currentView === 'welcome' ? 'text-blue-600 font-semibold' : ''
            }`}
          >
            Welcome
          </button>
          {(user || currentSeller) && (
            <button
              onClick={() => navigateTo('orders')}
              className={`whitespace-nowrap transition-colors hover:text-blue-600 cursor-pointer ${
                currentView === 'orders' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              My Orders
            </button>
          )}
        </nav>

        {/* Zone 3: Interactive Action Hub & Seller Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Seller Console Switcher Button (for authenticated sellers) */}
          {currentSeller && (
            <button
              onClick={() =>
                navigateTo(currentView === 'seller-dashboard' ? 'home' : 'seller-dashboard')
              }
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
                currentView === 'seller-dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{currentView === 'seller-dashboard' ? 'Customer View' : 'Seller Dashboard'}</span>
              {(pendingSellerOrdersCount > 0 || unreadSellerNotificationsCount > 0) && (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingSellerOrdersCount + unreadSellerNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Mobile Search Button */}
          <button
            onClick={() => navigateTo('search')}
            aria-label="Search products"
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Favourites Button (Desktop) */}
          <button
            onClick={() => navigateTo('favourites')}
            aria-label="Favourites"
            className="hidden sm:flex relative w-9 h-9 rounded-xl items-center justify-center text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition-colors"
          >
            <Heart className={`w-4.5 h-4.5 ${favourites.length > 0 ? 'fill-rose-50 text-rose-500' : ''}`} />
            {favourites.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {favourites.length}
              </span>
            )}
          </button>

          {/* Messages Button (Desktop) */}
          <button
            onClick={() => navigateTo('messages')}
            aria-label="Messages"
            className="hidden sm:flex relative w-9 h-9 rounded-xl items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
          >
            <MessageSquare className="w-4.5 h-4.5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => navigateTo('notifications')}
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={() => navigateTo('cart')}
            aria-label={`Shopping cart with ${cartCount} items`}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors min-h-[38px]"
          >
            <ShoppingCart className="w-4.5 h-4.5" />
            <span className="hidden sm:inline text-xs font-semibold">Cart</span>
            {cartCount > 0 && (
              <span className="w-4.5 h-4.5 bg-blue-600 text-white rounded-full text-[11px] font-bold flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          {/* Profile / Auth Button - Mutually Exclusive */}
          {user || currentSeller ? (
            <button
              onClick={() => navigateTo(currentSeller && !user ? 'seller-dashboard' : 'profile')}
              aria-label="Account Profile"
              className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors min-h-[38px] cursor-pointer"
            >
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : currentSeller?.shopLogo ? (
                <img
                  src={currentSeller.shopLogo}
                  alt={currentSeller.shopName}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {(user?.name || currentSeller?.shopName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden md:inline text-xs font-semibold max-w-[90px] truncate text-slate-800">
                {user ? user.name : currentSeller?.shopName}
              </span>
            </button>
          ) : (
            <button
              onClick={() => navigateTo('welcome', { welcomeStep: 'purpose' })}
              aria-label="Sign In"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors text-xs font-semibold min-h-[38px] shadow-2xs cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
