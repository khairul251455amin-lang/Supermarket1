/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { formatPrice } from '../../../config/marketplaceConfig';
import { EmptyState } from '../../common/EmptyState';

export const OverviewTab: React.FC = () => {
  const {
    currentSeller,
    sellerProducts,
    sellerOrders,
    setSellerDashboardTab,
    setEditingProductId,
  } = useMarketplace();

  if (!currentSeller) return null;

  // Real seller inventory counts across published, draft, paused, and out-of-stock
  const activeProducts = sellerProducts.filter(
    (p) => p.status === 'published' && (p.stockQuantity ?? p.stock) > 0
  );
  const outOfStockProducts = sellerProducts.filter(
    (p) => p.status === 'out_of_stock' || (p.stockQuantity ?? p.stock) <= 0
  );
  const lowStockProducts = sellerProducts.filter((p) => {
    const qty = p.stockQuantity ?? p.stock;
    return qty > 0 && qty <= 5;
  });

  // Filter real fulfilment orders belonging to this seller
  const orders = sellerOrders.filter((o) => o.sellerId === currentSeller.id);
  const pendingOrders = orders.filter((o) => o.status === 'Pending');
  const completedOrders = orders.filter((o) => o.status === 'Delivered');
  const cancelledOrders = orders.filter((o) => o.status === 'Cancelled');

  // Sales from completed orders only
  const totalSalesFromCompleted = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);

  const recentOrders = [...orders].slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome & Shop Status Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md font-mono">
              ID: {currentSeller.id}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                currentSeller.isOpen
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              Shop is {currentSeller.isOpen ? 'Open & Active' : 'Temporarily Closed'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Welcome, {currentSeller.shopName}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Real-time multi-vendor performance analytics and inventory tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setEditingProductId(null);
              setSellerDashboardTab('add-product');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Real Statistics Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Total Products</span>
            <Package className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums">
            {sellerProducts.length}
          </div>
          <div className="text-[11px] text-[#64748B] tabular-nums">
            {activeProducts.length} active · {outOfStockProducts.length} out of stock
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Pending Orders</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tabular-nums">
            {pendingOrders.length}
          </div>
          <div className="text-[11px] text-[#64748B]">
            Awaiting your confirmation
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Completed Orders</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums">
            {completedOrders.length}
          </div>
          <div className="text-[11px] text-[#64748B] tabular-nums">
            {cancelledOrders.length} cancelled
          </div>
        </div>

        {/* Completed Sales */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Completed Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2563EB] tabular-nums">
            {formatPrice(totalSalesFromCompleted)}
          </div>
          <div className="text-[11px] text-[#64748B]">
            From verified delivered packages
          </div>
        </div>
      </div>

      {/* Low-Stock Alerts Section */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900">
                Low-Stock Replenishment Alerts ({lowStockProducts.length})
              </h3>
            </div>
            <button
              onClick={() => setSellerDashboardTab('products')}
              className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
            >
              Update stock
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-[#0F172A] truncate">{p.name}</div>
                  <div className="text-[11px] text-[#64748B]">{p.category}</div>
                </div>
                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded shrink-0 tabular-nums">
                  {p.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Recent Customer Orders</h3>
            <p className="text-xs text-[#64748B]">Fulfilment parcels assigned to your shop</p>
          </div>
          {orders.length > 0 && (
            <button
              onClick={() => setSellerDashboardTab('orders')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({orders.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentOrders.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((ord) => {
              const timeStr = new Date(ord.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={ord.id}
                  className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">#{ord.id}</span>
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {ord.deliveryMethod}
                      </span>
                      <span className="text-slate-400">· {timeStr}</span>
                    </div>
                    <div className="text-slate-500 mt-1">
                      Customer: <strong className="text-slate-800">{ord.customerName}</strong> ·{' '}
                      {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                      {formatPrice(ord.total)}
                    </span>
                    <span
                      className={`font-semibold px-2.5 py-1 rounded-md text-[11px] ${
                        ord.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700'
                          : ord.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : ord.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="No Orders Received Yet"
            description="When customers purchase items from your shop, incoming fulfilment parcels will be listed here for confirmation."
            actionLabel="Add Your First Product"
            onAction={() => {
              setEditingProductId(null);
              setSellerDashboardTab('add-product');
            }}
            compact
          />
        )}
      </div>
    </div>
  );
};
