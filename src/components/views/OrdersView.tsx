/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  XCircle,
  AlertCircle,
  Store,
  Lock,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { OrderStatus } from '../../types';
import { formatPrice } from '../../config/marketplaceConfig';
import { EmptyState } from '../common/EmptyState';

export const OrdersView: React.FC = () => {
  const { user, orders, cancelOrder, navigateTo } = useMarketplace();
  const [activeTab, setActiveTab] = useState<'All' | OrderStatus>('All');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-[#E2E8F0] shadow-xs max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">Sign In to View Orders</h2>
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          Please sign in or create an account to view your order history and track active deliveries.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigateTo('auth', { authMode: 'login' })}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl cursor-pointer min-h-[42px]"
          >
            Sign In
          </button>
          <button
            onClick={() => navigateTo('auth', { authMode: 'register' })}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-[#0F172A] bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] rounded-xl cursor-pointer min-h-[42px]"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  const tabs: ('All' | OrderStatus)[] = [
    'All',
    'Pending',
    'Confirmed',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
  ];

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'All') return true;
    return o.status === activeTab;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Confirmation</span>
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmed</span>
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Processing</span>
          </span>
        );
      case 'Shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Truck className="w-3.5 h-3.5" />
            <span>In Transit</span>
          </span>
        );
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case 'Cancelled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
    }
  };

  const handleConfirmCancel = async (orderId: string) => {
    setCancellingId(orderId);
    const ok = await cancelOrder(orderId);
    setCancellingId(null);
    setConfirmCancelId(null);
    if (ok) {
      setCancelFeedback(`Order #${orderId} was cancelled.`);
      setTimeout(() => setCancelFeedback(null), 3500);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <div className="pb-4 border-b border-[#E2E8F0]">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
          Order History & Tracking
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B]">
          Monitor your active deliveries, Cash on Delivery receipts and historical orders.
        </p>
      </div>

      {cancelFeedback && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{cancelFeedback}</span>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const count =
            tab === 'All'
              ? orders.length
              : orders.filter((o) => o.status === tab).length;
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-white hover:bg-[#EFF6FF] text-[#64748B] border border-[#E2E8F0]'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                  isActive ? 'bg-[#1D4ED8] text-white' : 'bg-[#F8FAFC] text-[#64748B]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-5"
              >
                {/* Header row: ID, date, status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-slate-900">
                        #{order.id}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Placed on {dateStr}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(order.status)}
                    {order.status === 'Pending' && confirmCancelId !== order.id && (
                      <button
                        onClick={() => setConfirmCancelId(order.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                    {confirmCancelId === order.id && (
                      <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                        <span className="text-[11px] font-semibold text-rose-800">Cancel?</span>
                        <button
                          disabled={cancellingId === order.id}
                          onClick={() => handleConfirmCancel(order.id)}
                          className="text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded-md cursor-pointer"
                        >
                          {cancellingId === order.id ? '...' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setConfirmCancelId(null)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-1.5 py-0.5 cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Steps */}
                {order.status !== 'Cancelled' && (
                  <div className="py-2">
                    <div className="grid grid-cols-5 text-center gap-1 relative text-[11px] font-medium text-slate-500">
                      {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map(
                        (stepName, idx) => {
                          const stepOrder = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
                          const currentStepIdx = stepOrder.indexOf(order.status);
                          const isDone = currentStepIdx >= idx;
                          const isCurrent = currentStepIdx === idx;

                          return (
                            <div key={stepName} className="flex flex-col items-center">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-colors ${
                                  isCurrent
                                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                    : isDone
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {idx + 1}
                              </div>
                              <span
                                className={`line-clamp-1 ${
                                  isCurrent
                                    ? 'text-blue-600 font-bold'
                                    : isDone
                                    ? 'text-slate-800'
                                    : 'text-slate-400'
                                }`}
                              >
                                {stepName}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="divide-y divide-slate-100 bg-slate-50/60 rounded-2xl p-4 space-y-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-900 truncate">
                            {item.productName}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <Store className="w-3 h-3 text-slate-400" />
                            <span>{item.sellerName}</span>
                            <span>·</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-semibold text-slate-900 tabular-nums shrink-0">
                        {formatPrice(item.total)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer summary: Destination & Total */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="max-w-md">
                    <span className="font-semibold text-slate-900">Delivery To: </span>
                    <span>
                      {order.deliveryAddress.fullName} · {order.deliveryAddress.street},{' '}
                      {order.deliveryAddress.city} {order.deliveryAddress.postalCode} (
                      {order.deliveryAddress.phone})
                    </span>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Total (COD): </span>
                      <span className="text-base font-extrabold text-blue-600 tabular-nums">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={
            activeTab === 'All'
              ? 'No Orders Placed Yet'
              : `No Orders with Status "${activeTab}"`
          }
          description={
            activeTab === 'All'
              ? 'You have not placed any orders yet. Add items to your cart and complete checkout to track deliveries here.'
              : `There are currently no orders under the ${activeTab} filter.`
          }
          actionLabel="Browse Marketplace"
          onAction={() => navigateTo('home')}
        />
      )}
    </div>
  );
};
