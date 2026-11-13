/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { DeliveryMethod } from '../../../types';
import { formatPrice, marketplaceConfig } from '../../../config/marketplaceConfig';
import { EmptyState } from '../../common/EmptyState';

export const DeliveryTab: React.FC = () => {
  const {
    currentSeller,
    sellerOrders,
    updateSellerOrderStatus,
    recordSellerCodCollection,
    markSupermarketPickupReady,
  } = useMarketplace();

  if (!currentSeller) return null;

  const [activeMethod, setActiveMethod] = useState<'All' | DeliveryMethod>('All');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const myOrders = sellerOrders.filter((so) => so.sellerId === currentSeller.id);

  const deliveryOrders = myOrders.filter((o) => {
    if (activeMethod === 'All') return true;
    return o.deliveryMethod === activeMethod;
  });

  const sellerDeliveryCount = myOrders.filter((o) => o.deliveryMethod === 'Seller Delivery').length;
  const supermarketDeliveryCount = myOrders.filter((o) => o.deliveryMethod === 'Supermarket Delivery').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          Delivery Management
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
          Track packages fulfilled through Seller Delivery vs Supermarket Delivery
        </p>
      </div>

      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Delivery Method Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#1D4ED8] font-bold text-xs uppercase tracking-wider">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <Truck className="w-4 h-4 text-[#2563EB]" />
              </div>
              <span>1. Seller Delivery</span>
            </div>
            <span className="text-[11px] font-bold text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-0.5 rounded-lg tabular-nums">
              {sellerDeliveryCount} active
            </span>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            You pack the merchandise, dispatch using your own local rider or vehicle, update delivery status directly, and collect Cash on Delivery from the customer.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
              </div>
              <span>2. Supermarket Delivery</span>
            </div>
            <span className="text-[11px] font-bold text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-0.5 rounded-lg tabular-nums">
              {supermarketDeliveryCount} active
            </span>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            You package the items and mark "Ready for Pickup". Supermarket logistics partners dispatch a courier to collect the parcel from your shop and deliver it to the buyer.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['All', 'Seller Delivery', 'Supermarket Delivery'] as const).map((method) => {
          const count =
            method === 'All'
              ? myOrders.length
              : myOrders.filter((o) => o.deliveryMethod === method).length;
          const isActive = activeMethod === method;

          return (
            <button
              key={method}
              onClick={() => setActiveMethod(method)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-white hover:bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
              }`}
            >
              <span>{method}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md tabular-nums ${
                  isActive ? 'bg-[#1D4ED8] text-white' : 'bg-[#F8FAFC] text-[#64748B]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Deliveries List */}
      {deliveryOrders.length > 0 ? (
        <div className="space-y-4">
          {deliveryOrders.map((ord) => {
            const isSellerMethod = ord.deliveryMethod === 'Seller Delivery';

            return (
              <div
                key={ord.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E2E8F0]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-[#0F172A]">#{ord.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isSellerMethod
                            ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-blue-200'
                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}
                      >
                        {ord.deliveryMethod}
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B] mt-1">
                      Customer: <strong className="text-[#0F172A]">{ord.customerName}</strong> ({ord.customerPhone})
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        ord.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ord.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-[#EFF6FF] text-[#1D4ED8] border border-blue-200'
                      }`}
                    >
                      Status: {ord.status}
                    </span>
                  </div>
                </div>

                {/* Delivery Logistics Box */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#64748B] block mb-1 font-medium">Destination Address</span>
                    <div className="font-semibold text-[#0F172A] flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0 mt-0.5" />
                      <span>
                        {ord.deliveryAddress.street}, {ord.deliveryAddress.city} {ord.deliveryAddress.postalCode}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#64748B] block mb-1 font-medium">Fulfilment Partner & COD</span>
                    <div className="font-semibold text-[#0F172A]">
                      {isSellerMethod
                        ? 'Handled by Seller Local Dispatch'
                        : ord.deliveryPersonAssigned ||
                          `${marketplaceConfig.marketplaceName} Logistics Partner`}
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-1 tabular-nums">
                      Amount Due:{' '}
                      <strong className="text-[#2563EB]">{formatPrice(ord.total)}</strong> (
                      {ord.codCollected ? 'COD Collected' : 'Pending Collection'})
                    </div>
                  </div>
                </div>

                {/* Delivery Action Controls */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  {isSellerMethod ? (
                    <>
                      {ord.status === 'Ready for Delivery' && (
                        <button
                          onClick={async () => {
                            await updateSellerOrderStatus(ord.id, 'Shipped');
                            setFeedbackNotice(`Order #${ord.id} marked as dispatched.`);
                            setTimeout(() => setFeedbackNotice(null), 2500);
                          }}
                          className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl cursor-pointer transition-colors"
                        >
                          Dispatch / Start Delivery
                        </button>
                      )}

                      {ord.status === 'Shipped' && (
                        <>
                          <button
                            onClick={async () => {
                              await updateSellerOrderStatus(ord.id, 'Delivered');
                              setFeedbackNotice(`Order #${ord.id} marked as Delivered.`);
                              setTimeout(() => setFeedbackNotice(null), 2500);
                            }}
                            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer transition-colors"
                          >
                            Mark Delivered
                          </button>
                          {!ord.codCollected && (
                            <button
                              onClick={async () => {
                                await recordSellerCodCollection(ord.id);
                                setFeedbackNotice(`COD collection recorded for #${ord.id}.`);
                                setTimeout(() => setFeedbackNotice(null), 2500);
                              }}
                              className="px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl cursor-pointer tabular-nums transition-colors"
                            >
                              Record Cash Collected ({formatPrice(ord.total)})
                            </button>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {ord.status === 'Processing' && (
                        <button
                          onClick={async () => {
                            await markSupermarketPickupReady(ord.id);
                            setFeedbackNotice(
                              `Order #${ord.id} marked ready for ${marketplaceConfig.marketplaceName} pickup.`
                            );
                            setTimeout(() => setFeedbackNotice(null), 2500);
                          }}
                          className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl cursor-pointer transition-colors"
                        >
                          Mark Ready for {marketplaceConfig.marketplaceName} Pickup
                        </button>
                      )}
                      {ord.readyForPickup && ord.status !== 'Delivered' && (
                        <span className="text-xs text-teal-800 font-semibold bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
                          {marketplaceConfig.marketplaceName} Courier Assigned for Dispatch
                        </span>
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
          icon={Truck}
          title="No Delivery Records Found"
          description="Packages awaiting courier dispatch or seller delivery will be organized here once orders are confirmed."
          compact
        />
      )}
    </div>
  );
};
