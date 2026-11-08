/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  Trash2,
  CheckCircle,
  Package,
  MessageSquare,
  AlertTriangle,
  ShieldAlert,
  Truck,
  Megaphone,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { NotificationType } from '../../../types';
import { EmptyState } from '../../common/EmptyState';

export const NotificationsTab: React.FC = () => {
  const {
    currentSeller,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    setSellerDashboardTab,
  } = useMarketplace();

  if (!currentSeller) return null;

  const [activeFilter, setActiveFilter] = useState<'All' | NotificationType>('All');

  // Filter notifications belonging to this seller or global announcements
  const sellerNotifs = notifications.filter(
    (n) => n.sellerId === currentSeller.id || n.type === 'marketplace'
  );

  const filtered = sellerNotifs.filter((n) => {
    if (activeFilter === 'All') return true;
    return n.type === activeFilter;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-emerald-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'moderation':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      default:
        return <Megaphone className="w-4 h-4 text-indigo-600" />;
    }
  };

  const handleNotificationClick = (n: typeof notifications[0]) => {
    markNotificationAsRead(n.id);
    if (n.type === 'order') {
      setSellerDashboardTab('orders');
    } else if (n.type === 'message') {
      setSellerDashboardTab('messages');
    } else if (n.type === 'low_stock') {
      setSellerDashboardTab('products');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Seller Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Order updates, customer inquiries, stock warnings, and marketplace moderation
          </p>
        </div>

        {sellerNotifs.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {(['All', 'order', 'message', 'low_stock', 'moderation'] as const).map((filterKey) => {
          const label =
            filterKey === 'All'
              ? 'All'
              : filterKey === 'order'
              ? 'Orders'
              : filterKey === 'message'
              ? 'Messages'
              : filterKey === 'low_stock'
              ? 'Stock Warnings'
              : 'Moderation';

          const count =
            filterKey === 'All'
              ? sellerNotifs.length
              : sellerNotifs.filter((n) => n.type === filterKey).length;

          const isActive = activeFilter === filterKey;

          return (
            <button
              key={filterKey}
              onClick={() => setActiveFilter(filterKey)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((notif) => {
            const timeStr = new Date(notif.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                  notif.isRead
                    ? 'bg-white border-slate-200/80 hover:border-slate-300'
                    : 'bg-blue-50/50 border-blue-200 hover:bg-blue-50/80 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    {getIcon(notif.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded">
                          Unread
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    <div className="text-[10px] text-slate-400 mt-1.5">{timeStr}</div>
                  </div>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationAsRead(notif.id);
                    }}
                    title="Mark as read"
                    className="p-1 rounded-lg text-slate-400 hover:text-blue-600 self-center"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No Notifications for Your Shop"
          description="Your vendor notification feed starts completely empty. Important events like incoming orders and stock warnings will appear here."
          compact
        />
      )}
    </div>
  );
};
