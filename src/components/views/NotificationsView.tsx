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
  Megaphone,
  Store,
  ExternalLink,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { NotificationType, AppView } from '../../types';
import { EmptyState } from '../common/EmptyState';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    navigateTo,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'All' | NotificationType>('All');

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'All') return true;
    return n.type === activeTab;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-emerald-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'seller':
        return <Store className="w-4 h-4 text-amber-600" />;
      case 'marketplace':
      default:
        return <Megaphone className="w-4 h-4 text-indigo-600" />;
    }
  };

  const handleNotificationClick = (id: string, linkView?: string, linkId?: string) => {
    markNotificationAsRead(id);
    if (linkView) {
      if (linkView === 'orders') {
        navigateTo('orders');
      } else if (linkView === 'messages') {
        navigateTo('messages', { conversationId: linkId });
      } else if (linkView === 'product' && linkId) {
        navigateTo('product', { productId: linkId });
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Notification Centre
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Marketplace announcements, order updates, and seller communication
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(['All', 'order', 'message', 'seller', 'marketplace'] as const).map((tab) => {
          const label =
            tab === 'All'
              ? 'All'
              : tab === 'order'
              ? 'Orders'
              : tab === 'message'
              ? 'Messages'
              : tab === 'seller'
              ? 'Sellers'
              : 'Marketplace';

          const count =
            tab === 'All'
              ? notifications.length
              : notifications.filter((n) => n.type === tab).length;

          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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
      {filteredNotifs.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifs.map((notif) => {
            const timeStr = new Date(notif.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif.id, notif.linkView, notif.linkId)}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                  notif.isRead
                    ? 'bg-white border-slate-200/80 hover:border-slate-300'
                    : 'bg-blue-50/40 border-blue-200 hover:bg-blue-50/70 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    <div className="text-[10px] text-slate-400 mt-1.5">{timeStr}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center">
                  {!notif.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationAsRead(notif.id);
                      }}
                      title="Mark as read"
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {notif.linkView && (
                    <ExternalLink className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No Notifications Yet"
          description="Your notification feed starts completely empty. You will receive updates here for placed orders, seller message replies, and marketplace announcements."
          actionLabel="Explore Marketplace"
          onAction={() => navigateTo('home')}
        />
      )}
    </div>
  );
};
