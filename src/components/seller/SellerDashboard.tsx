/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Store,
  Package,
  PlusCircle,
  ShoppingBag,
  Truck,
  MessageSquare,
  Bell,
  Settings,
  ArrowLeft,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { SellerDashboardTab } from '../../types';
import { OverviewTab } from './tabs/OverviewTab';
import { MyShopTab } from './tabs/MyShopTab';
import { ProductsTab } from './tabs/ProductsTab';
import { AddEditProductTab } from './tabs/AddEditProductTab';
import { OrdersTab } from './tabs/OrdersTab';
import { DeliveryTab } from './tabs/DeliveryTab';
import { MessagesTab } from './tabs/MessagesTab';
import { NotificationsTab } from './tabs/NotificationsTab';
import { SettingsTab } from './tabs/SettingsTab';

export const SellerDashboard: React.FC = () => {
  const {
    currentSeller,
    sellerDashboardTab,
    setSellerDashboardTab,
    unreadSellerNotificationsCount,
    unreadSellerMessagesCount,
    sellerOrders,
    sellerProducts,
    setEditingProductId,
    navigateTo,
  } = useMarketplace();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!currentSeller) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-[#E2E8F0] shadow-xs max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
          <Store className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">Seller Access Required</h2>
        <p className="text-xs text-[#64748B] leading-relaxed">
          You need an active seller account to view the merchant console.
        </p>
        <button
          onClick={() => navigateTo('seller-register')}
          className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
        >
          Open a Seller Shop
        </button>
      </div>
    );
  }

  // Seller specific badges
  const pendingOrdersCount = sellerOrders.filter(
    (so) => so.sellerId === currentSeller.id && so.status === 'Pending'
  ).length;

  const lowStockCount = sellerProducts.filter(
    (p) => (p.stockQuantity ?? p.stock) > 0 && (p.stockQuantity ?? p.stock) <= 5
  ).length;

  const navItems: {
    tab: SellerDashboardTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { tab: 'overview', label: 'Overview', icon: LayoutDashboard },
    { tab: 'myshop', label: 'My Shop', icon: Store },
    {
      tab: 'products',
      label: 'Products',
      icon: Package,
      badge: lowStockCount,
      badgeColor: 'bg-amber-600',
    },
    { tab: 'add-product', label: 'Add Product', icon: PlusCircle },
    {
      tab: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount,
      badgeColor: 'bg-blue-600',
    },
    { tab: 'delivery', label: 'Delivery', icon: Truck },
    {
      tab: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadSellerMessagesCount,
      badgeColor: 'bg-blue-600',
    },
    {
      tab: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadSellerNotificationsCount,
      badgeColor: 'bg-rose-600',
    },
    { tab: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderActiveTab = () => {
    switch (sellerDashboardTab) {
      case 'overview':
        return <OverviewTab />;
      case 'myshop':
        return <MyShopTab />;
      case 'products':
        return <ProductsTab />;
      case 'add-product':
        return <AddEditProductTab />;
      case 'orders':
        return <OrdersTab />;
      case 'delivery':
        return <DeliveryTab />;
      case 'messages':
        return <MessagesTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col lg:flex-row gap-6 items-start">
      {/* Mobile Header Bar */}
      <div className="w-full lg:hidden flex items-center justify-between p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold">
            {currentSeller.shopName.charAt(0)}
          </div>
          <div>
            <div className="text-xs font-bold text-[#0F172A] truncate max-w-[150px]">
              {currentSeller.shopName}
            </div>
            <div className="text-[10px] text-[#64748B] font-mono">ID: {currentSeller.id}</div>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-[#64748B] hover:bg-slate-100 rounded-xl cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          isMobileMenuOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto block' : 'hidden lg:block'
        } w-full lg:w-64 bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs shrink-0 space-y-6 lg:sticky lg:top-20`}
      >
        {isMobileMenuOpen && (
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] lg:hidden">
            <span className="font-bold text-sm text-[#0F172A]">Seller Navigation</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-full text-[#64748B] hover:text-[#0F172A]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Shop Avatar & Badge */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#E2E8F0]">
          {currentSeller.shopLogo ? (
            <img
              src={currentSeller.shopLogo}
              alt={currentSeller.shopName}
              className="w-11 h-11 rounded-xl object-cover border border-[#E2E8F0]"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] text-[#2563EB] font-bold text-lg flex items-center justify-center">
              {currentSeller.shopName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-[#0F172A] truncate">
              {currentSeller.shopName}
            </h3>
            <span className="text-[10px] font-mono font-medium text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 rounded">
              ID: {currentSeller.id}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = sellerDashboardTab === item.tab;

            return (
              <button
                key={item.tab}
                onClick={() => {
                  if (item.tab === 'add-product') {
                    setEditingProductId(null);
                  }
                  setSellerDashboardTab(item.tab);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-[#EFF6FF]/60 hover:text-[#0F172A]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>

                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white tabular-nums ${
                      isActive ? 'bg-[#1D4ED8]' : item.badgeColor || 'bg-[#2563EB]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Marketplace Switcher */}
        <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
          <button
            onClick={() => navigateTo('home')}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#64748B] hover:text-[#2563EB] hover:bg-[#F8FAFC] rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Customer Website</span>
          </button>

          <button
            onClick={() => navigateTo('shop', { sellerId: currentSeller.id })}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Preview Public Shop</span>
          </button>

          <button
            onClick={() => navigateTo('welcome')}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl transition-colors cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>Welcome Experience</span>
          </button>
        </div>
      </aside>

      {/* Main Tab Area */}
      <main className="flex-1 w-full min-w-0">
        {renderActiveTab()}
      </main>
    </div>
  );
};
