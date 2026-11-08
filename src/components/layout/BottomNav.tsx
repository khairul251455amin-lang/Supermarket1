/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Search, Heart, ShoppingCart, MessageSquare, User, Store, LayoutDashboard } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';

export const BottomNav: React.FC = () => {
  const {
    currentView,
    navigateTo,
    cartCount,
    favourites,
    unreadMessagesCount,
    unreadSellerMessagesCount,
    unreadSellerNotificationsCount,
    user,
    currentSeller,
  } = useMarketplace();

  // If in seller dashboard, show seller mobile controls
  if (currentView === 'seller-dashboard') {
    return (
      <nav
        aria-label="Seller Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-400 px-2 py-1 safe-area-pb"
      >
        <div className="grid grid-cols-5 items-center h-14">
          <button
            onClick={() => navigateTo('home')}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] hover:text-white"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-1">Customer Web</span>
          </button>
          <button
            onClick={() => navigateTo('seller-dashboard', { sellerTab: 'overview' })}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] text-blue-400 font-semibold"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-1">Overview</span>
          </button>
          <button
            onClick={() => navigateTo('seller-dashboard', { sellerTab: 'products' })}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] hover:text-white"
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] mt-1">Products</span>
          </button>
          <button
            onClick={() => navigateTo('seller-dashboard', { sellerTab: 'orders' })}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] hover:text-white relative"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[10px] mt-1">Orders</span>
          </button>
          <button
            onClick={() => navigateTo('seller-dashboard', { sellerTab: 'settings' })}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] hover:text-white"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-1">Settings</span>
          </button>
        </div>
      </nav>
    );
  }

  const navItems = [
    {
      view: 'home' as const,
      label: 'Home',
      icon: Home,
      badge: 0,
    },
    {
      view: 'search' as const,
      label: 'Search',
      icon: Search,
      badge: 0,
    },
    {
      view: 'favourites' as const,
      label: 'Saved',
      icon: Heart,
      badge: favourites.length,
    },
    {
      view: 'cart' as const,
      label: 'Cart',
      icon: ShoppingCart,
      badge: cartCount,
    },
    {
      view: currentSeller ? ('seller-dashboard' as const) : user ? ('profile' as const) : ('welcome' as const),
      label: currentSeller ? 'Seller' : user ? 'Profile' : 'Sign In',
      icon: currentSeller ? Store : User,
      badge: currentSeller ? unreadSellerNotificationsCount + unreadSellerMessagesCount : 0,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1 safe-area-pb"
    >
      <div className="grid grid-cols-5 items-center h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentView === item.view ||
            (item.view === 'welcome' && (currentView === 'welcome' || currentView === 'auth')) ||
            (item.view === 'profile' && currentView === 'profile');

          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.view === 'welcome') {
                  navigateTo('welcome', { welcomeStep: 'purpose' });
                } else {
                  navigateTo(item.view);
                }
              }}
              className={`relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] py-1 transition-colors ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 line-clamp-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
