/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  DollarSign,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { DeliveryMethod } from '../../../types';
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Delivery Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Track packages fulfilled through Seller Delivery vs Supermarket Delivery
        </p>
      </div>

      {feedbackNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Delivery Method Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
            <Truck className="w-4 h-4" />
            <span>1. Seller Delivery</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            You pack the merchandise, dispatch using your own local rider or vehicle, update delivery status directly, and collect Cash on Delivery from the customer.
          </p>
          <div className="text-[11px] font-semibold text-slate-400">
            Active Seller Parcels: {sellerDeliveryCount}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>2. Supermarket Delivery</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            You package the items and mark "Ready for Pickup". Supermarket logistics partners dispatch a courier to collect the parcel from your shop and deliver it to the buyer.
          </p>
          <div className="text-[11px] font-semibold text-slate-400">
            Active Supermarket Parcels: {supermarketDeliveryCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              <span>{method}</span>
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

      {/* Deliveries List */}
      {deliveryOrders.length > 0 ? (
        <div className="space-y-4">
          {deliveryOrders.map((ord) => {
            const isSellerMethod = ord.deliveryMethod === 'Seller Delivery';

            return (
              <div
                key={ord.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">#{ord.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isSellerMethod
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}
                      >
                        {ord.deliveryMethod}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Customer: <strong>{ord.customerName}</strong> ({ord.customerPhone})
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        ord.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : ord.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      Status: {ord.status}
                    </span>
                  </div>
                </div>

                {/* Delivery Logistics Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Destination Address</span>
                    <div className="font-semibold text-slate-900 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {ord.deliveryAddress.street}, {ord.deliveryAddress.city} {ord.deliveryAddress.postalCode}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Fulfilment Partner & COD</span>
                    <div className="font-semibold text-slate-900">
                      {isSellerMethod
                        ? 'Handled by Seller Local Dispatch'
                        : ord.deliveryPersonAssigned || 'Supermarket Logistics Partner'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Amount Due: <strong className="text-blue-600">${ord.total.toFixed(2)}</strong> (
                      {ord.codCollected ? 'COD Collected' : 'Pending Collection'})
                    </div>
                  </div>
                </div>

                {/* Delivery Action Controls */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {isSellerMethod ? (
                    <>
                      {ord.status === 'Ready for Delivery' && (
                        <button
                          onClick={() => {
                            updateSellerOrderStatus(ord.id, 'Shipped');
                            setFeedbackNotice(`Order #${ord.id} marked as dispatched.`);
                            setTimeout(() => setFeedbackNotice(null), 2500);
                          }}
                          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                        >
                          Dispatch / Start Delivery
                        </button>
                      )}

                      {ord.status === 'Shipped' && (
                        <>
                          <button
                            onClick={() => {
                              updateSellerOrderStatus(ord.id, 'Delivered');
                              setFeedbackNotice(`Order #${ord.id} marked as Delivered.`);
                              setTimeout(() => setFeedbackNotice(null), 2500);
                            }}
                            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                          >
                            Mark Delivered
                          </button>
                          {!ord.codCollected && (
                            <button
                              onClick={() => {
                                recordSellerCodCollection(ord.id);
                                setFeedbackNotice(`COD collection recorded for #${ord.id}.`);
                                setTimeout(() => setFeedbackNotice(null), 2500);
                              }}
                              className="px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl"
                            >
                              Record Cash Collected (${ord.total.toFixed(2)})
                            </button>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {ord.status === 'Processing' && (
                        <button
                          onClick={() => {
                            markSupermarketPickupReady(ord.id);
                            setFeedbackNotice(`Order #${ord.id} marked ready for Supermarket pickup.`);
                            setTimeout(() => setFeedbackNotice(null), 2500);
                          }}
                          className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl"
                        >
                          Mark Ready for Supermarket Pickup
                        </button>
                      )}
                      {ord.readyForPickup && ord.status !== 'Delivered' && (
                        <span className="text-xs text-teal-800 font-semibold bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
                          Supermarket Courier Assigned for Dispatch
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
