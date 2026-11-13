/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Home,
  Compass,
  ShoppingCart,
  MessageSquare,
  User,
  Store,
  LayoutDashboard,
  Package,
  ClipboardList,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';

export const BottomNav: React.FC = () => {
  const {
    currentView,
    sellerDashboardTab,
    navigateTo,
    cartCount,
    unreadMessagesCount,
    unreadSellerMessagesCount,
    unreadSellerNotificationsCount,
    user,
    currentSeller,
  } = useMarketplace();

  // Seller Dashboard mobile navigation
  if (currentView === 'seller-dashboard') {
    return (
      <nav
        aria-label="Seller Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-800 text-slate-400 px-2 safe-area-pb"
      >
        <div className="grid grid-cols-5 items-center h-14">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] hover:text-white cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Shop Web</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('seller-dashboard', { sellerTab: 'overview' })}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer ${
              sellerDashboardTab === 'overview' ? 'text-blue-400 font-semibold' : 'hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-1">Overview</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('seller-dashboard', { sellerTab: 'products' })}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer ${
              sellerDashboardTab === 'products' || sellerDashboardTab === 'add-product'
                ? 'text-blue-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] mt-1">Products</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('seller-dashboard', { sellerTab: 'orders' })}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer ${
              sellerDashboardTab === 'orders' ? 'text-blue-400 font-semibold' : 'hover:text-white'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] mt-1">Orders</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('seller-dashboard', { sellerTab: 'settings' })}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer ${
              sellerDashboardTab === 'settings' ? 'text-blue-400 font-semibold' : 'hover:text-white'
            }`}
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
      label: 'Explore',
      icon: Compass,
      badge: 0,
    },
    {
      view: 'cart' as const,
      label: 'Cart',
      icon: ShoppingCart,
      badge: cartCount,
    },
    {
      view: 'messages' as const,
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount,
    },
    {
      view: currentSeller ? ('seller-dashboard' as const) : user ? ('profile' as const) : ('welcome' as const),
      label: 'Account',
      icon: currentSeller ? Store : User,
      badge: currentSeller ? unreadSellerNotificationsCount + unreadSellerMessagesCount : 0,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-2 safe-area-pb"
    >
      <div className="grid grid-cols-5 items-center h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentView === item.view ||
            (item.view === 'search' && currentView === 'category') ||
            (item.view === 'welcome' && (currentView === 'welcome' || currentView === 'auth')) ||
            (item.view === 'profile' && (currentView === 'profile' || currentView === 'orders'));

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.view === 'welcome') {
                  navigateTo('welcome', { welcomeStep: 'purpose' });
                } else {
                  navigateTo(item.view);
                }
              }}
              className={`relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] py-1 transition-colors cursor-pointer ${
                isActive ? 'text-[#2563EB] font-semibold' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-105 stroke-[2.25]' : 'stroke-[1.75]'
                  }`}
                />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
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
