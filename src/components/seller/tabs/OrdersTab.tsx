/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  X,
  Package,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { OrderStatus } from '../../../types';
import { formatPrice, marketplaceConfig } from '../../../config/marketplaceConfig';
import { EmptyState } from '../../common/EmptyState';

export const OrdersTab: React.FC = () => {
  const {
    currentSeller,
    sellerOrders,
    updateSellerOrderStatus,
    recordSellerCodCollection,
    markSupermarketPickupReady,
  } = useMarketplace();

  if (!currentSeller) return null;

  const [activeStatus, setActiveStatus] = useState<'All' | OrderStatus>('All');
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter orders strictly for this seller (Privacy enforcement)
  const myOrders = useMemo(() => {
    return sellerOrders.filter((so) => so.sellerId === currentSeller.id);
  }, [sellerOrders, currentSeller.id]);

  const filteredOrders = useMemo(() => {
    if (activeStatus === 'All') return myOrders;
    return myOrders.filter((o) => o.status === activeStatus);
  }, [myOrders, activeStatus]);

  const handleConfirm = async (orderId: string) => {
    await updateSellerOrderStatus(orderId, 'Confirmed');
    setActionNotice(`Order #${orderId} confirmed.`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleStartProcessing = async (orderId: string) => {
    await updateSellerOrderStatus(orderId, 'Processing');
    setActionNotice(`Order #${orderId} moved to Processing/Packing.`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleMarkReadyForDelivery = async (orderId: string) => {
    await updateSellerOrderStatus(orderId, 'Ready for Delivery');
    setActionNotice(`Order #${orderId} is Ready for Delivery.`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleShip = async (orderId: string) => {
    await updateSellerOrderStatus(orderId, 'Shipped');
    setActionNotice(`Order #${orderId} marked as Shipped/Dispatched.`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleDeliver = async (orderId: string) => {
    await updateSellerOrderStatus(orderId, 'Delivered');
    setActionNotice(`Order #${orderId} marked as Delivered.`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleRecordCod = async (orderId: string) => {
    await recordSellerCodCollection(orderId);
    setActionNotice(`Cash on Delivery recorded for #${orderId}.`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingOrderId || !rejectionReason.trim()) return;

    await updateSellerOrderStatus(rejectingOrderId, 'Cancelled', rejectionReason.trim());
    setActionNotice(`Order #${rejectingOrderId} was rejected.`);
    setRejectingOrderId(null);
    setRejectionReason('');
    setTimeout(() => setActionNotice(null), 2500);
  };

  const tabs: ('All' | OrderStatus)[] = [
    'All',
    'Pending',
    'Confirmed',
    'Processing',
    'Ready for Delivery',
    'Shipped',
    'Delivered',
    'Cancelled',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Fulfilment Orders
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Manage incoming customer purchases and update packaging/delivery statuses
          </p>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-blue-200 text-xs text-[#1D4ED8] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const count =
            tab === 'All'
              ? myOrders.length
              : myOrders.filter((o) => o.status === tab).length;
          const isActive = activeStatus === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveStatus(tab)}
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
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const isSellerDelivery = order.deliveryMethod === 'Seller Delivery';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-5"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-slate-900">
                        #{order.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {order.deliveryMethod}
                      </span>
                      {order.codCollected && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          COD Collected
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Placed on {dateStr} · Parent Order #{order.parentOrderId}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        order.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : order.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Rejection / Cancellation alert if present */}
                {order.rejectionReason && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    <strong>Cancellation Reason:</strong> {order.rejectionReason}
                  </div>
                )}

                {/* Customer Delivery Information */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Customer Name</span>
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customerName}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Phone Number</span>
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customerPhone}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Delivery Address</span>
                    <div className="font-semibold text-slate-900 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {order.deliveryAddress.street}, {order.deliveryAddress.city}{' '}
                        {order.deliveryAddress.postalCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items in this seller parcel */}
                <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-100 p-2 sm:p-4">
                  {order.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {it.image ? (
                          <img
                            src={it.image}
                            alt={it.productName}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-slate-900">{it.productName}</h4>
                          <div className="text-[11px] text-slate-400">
                            Quantity: {it.quantity} · {formatPrice(it.unitPrice)} each
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-bold text-slate-900 tabular-nums">
                        {formatPrice(it.total)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Delivery Total */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="text-slate-500">
                    Payment Method: <strong>Cash on Delivery (COD)</strong> ·{' '}
                    <span>Delivery Fee: {formatPrice(order.deliveryFee)}</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-slate-400">Parcel Total:</span>
                    <span className="text-base font-extrabold text-blue-600 tabular-nums">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {/* Order Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                  {order.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => setRejectingOrderId(order.id)}
                        className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors min-h-[38px] cursor-pointer"
                      >
                        Reject Order
                      </button>
                      <button
                        onClick={() => void handleConfirm(order.id)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors min-h-[38px] cursor-pointer"
                      >
                        Confirm Order
                      </button>
                    </>
                  )}

                  {order.status === 'Confirmed' && (
                    <button
                      onClick={() => void handleStartProcessing(order.id)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#0F172A] rounded-xl shadow-xs transition-colors min-h-[38px] cursor-pointer"
                    >
                      Start Processing (Packing)
                    </button>
                  )}

                  {order.status === 'Processing' && (
                    <button
                      onClick={() => void handleMarkReadyForDelivery(order.id)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors min-h-[38px] cursor-pointer"
                    >
                      Mark Ready for Delivery
                    </button>
                  )}

                  {order.status === 'Ready for Delivery' && isSellerDelivery && (
                    <button
                      onClick={() => void handleShip(order.id)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors min-h-[38px] cursor-pointer"
                    >
                      Dispatch / Mark Shipped
                    </button>
                  )}

                  {order.status === 'Ready for Delivery' && !isSellerDelivery && (
                    <button
                      onClick={() => void markSupermarketPickupReady(order.id)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors min-h-[38px] cursor-pointer"
                    >
                      Confirm {marketplaceConfig.marketplaceName} Pickup Ready
                    </button>
                  )}

                  {order.status === 'Shipped' && isSellerDelivery && (
                    <>
                      <button
                        onClick={() => void handleDeliver(order.id)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors min-h-[38px] cursor-pointer"
                      >
                        Mark as Delivered
                      </button>
                      {!order.codCollected && (
                        <button
                          onClick={() => void handleRecordCod(order.id)}
                          className="px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors min-h-[38px] cursor-pointer"
                        >
                          Record COD Collected ({formatPrice(order.total)})
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title={
            activeStatus === 'All'
              ? 'No Orders Received'
              : `No Orders with status "${activeStatus}"`
          }
          description="Incoming orders for your products will appear here. You can confirm orders, pack items, arrange delivery, and record cash collections."
          compact
        />
      )}

      {/* Reject Order Modal */}
      {rejectingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Reject Order #{rejectingOrderId}
              </h3>
              <button
                onClick={() => setRejectingOrderId(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Out of stock, delivery address beyond local dispatch coverage, etc."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingOrderId(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
