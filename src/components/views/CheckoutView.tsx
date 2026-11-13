/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Truck,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  ShieldCheck,
  MapPin,
  Sparkles,
  Store,
  Package,
  Lock,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Address, DeliveryMethod } from '../../types';
import { formatPrice, marketplaceConfig } from '../../config/marketplaceConfig';

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    user,
    placeOrder,
    navigateTo,
  } = useMarketplace();

  const [fullName, setFullName] = useState(user?.deliveryAddress?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.deliveryAddress?.phone || user?.phoneNumber || '');
  const [street, setStreet] = useState(user?.deliveryAddress?.street || '');
  const [city, setCity] = useState(user?.deliveryAddress?.city || '');
  const [postalCode, setPostalCode] = useState(user?.deliveryAddress?.postalCode || '');
  const [deliveryNotes, setDeliveryNotes] = useState(user?.deliveryAddress?.deliveryNotes || '');

  // Group cart items by seller
  const itemsBySeller = useMemo(() => {
    return cart.reduce((acc, item) => {
      const sId = item.product.shopId || item.product.sellerId || 'unknown-seller';
      if (!acc[sId]) {
        acc[sId] = {
          sellerId: sId,
          sellerName: item.product.shopName || item.product.sellerName,
          items: [],
        };
      }
      acc[sId].items.push(item);
      return acc;
    }, {} as Record<string, { sellerId: string; sellerName: string; items: typeof cart }>);
  }, [cart]);

  // Delivery method choice per seller parcel
  const [deliveryMethodBySeller, setDeliveryMethodBySeller] = useState<
    Record<string, DeliveryMethod>
  >(() => {
    const init: Record<string, DeliveryMethod> = {};
    Object.keys(itemsBySeller).forEach((sId) => {
      init[sId] = 'Seller Delivery';
    });
    return init;
  });

  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const freeThreshold = marketplaceConfig.delivery.freeShippingThreshold;
  const standardFee = marketplaceConfig.delivery.standardFee;

  // Calculate delivery fee across seller parcels
  const deliveryFee = useMemo(() => {
    let fee = 0;
    Object.values(itemsBySeller).forEach((sellerGroup) => {
      const sub = sellerGroup.items.reduce((sum, it) => {
        const pr = it.product.discountedPrice ?? it.product.originalPrice;
        return sum + pr * it.quantity;
      }, 0);
      if (sub <= freeThreshold) {
        fee += standardFee;
      }
    });
    return fee;
  }, [itemsBySeller, freeThreshold, standardFee]);

  const grandTotal = cartSubtotal + deliveryFee;

  if (!user && !confirmedOrderId) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-[#E2E8F0] shadow-xs max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">Sign In to Complete Checkout</h2>
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          Please sign in or create an account to place your order and track deliveries.
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

  if (cart.length === 0 && !confirmedOrderId) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-[#E2E8F0] shadow-xs max-w-lg mx-auto my-12">
        <PackageCheck className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#0F172A] mb-1">Your Cart is Empty</h2>
        <p className="text-xs text-[#64748B] mb-6">
          Add items to your cart before proceeding to checkout.
        </p>
        <button
          onClick={() => navigateTo('home')}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl cursor-pointer"
        >
          Explore Products
        </button>
      </div>
    );
  }

  const handleDeliveryMethodChange = (sellerId: string, method: DeliveryMethod) => {
    setDeliveryMethodBySeller((prev) => ({
      ...prev,
      [sellerId]: method,
    }));
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !phone.trim() || !street.trim() || !city.trim() || !postalCode.trim()) {
      setErrorMessage('Please fill in all mandatory delivery address fields.');
      return;
    }

    const deliveryAddress: Address = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      deliveryNotes: deliveryNotes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      const result = await placeOrder(deliveryAddress, deliveryMethodBySeller, deliveryNotes);

      if (result.success && result.orderId) {
        setConfirmedOrderId(result.orderId);
        setErrorMessage(null);
      } else {
        setErrorMessage(result.error || 'Failed to complete order.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to complete order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order Confirmation View
  if (confirmedOrderId) {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-white rounded-2xl p-6 sm:p-10 border border-[#E2E8F0] shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-blue-200 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Vendor Order Confirmed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Order Placed Successfully!
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-2">
            Order Reference: <strong className="font-mono text-[#0F172A]">{confirmedOrderId}</strong>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#EFF6FF] border border-blue-200 text-xs text-[#0F172A] text-left space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <span>Multi-Seller Fulfilment Dispatched</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#1D4ED8]">
            Separate fulfilment orders have been dispatched to each respective seller's dashboard. Sellers will package your items and coordinate delivery using the chosen delivery method.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-left space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <span className="text-[#64748B]">Payment Method:</span>
            <span className="font-semibold text-[#0F172A]">Cash on Delivery (COD)</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <span className="text-[#64748B]">Recipient:</span>
            <span className="font-semibold text-[#0F172A]">{fullName} ({phone})</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <span className="text-[#64748B]">Delivery Destination:</span>
            <span className="font-semibold text-[#0F172A] text-right max-w-xs truncate">
              {street}, {city} {postalCode}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[#64748B]">Total Cash Due Upon Delivery:</span>
            <span className="text-base font-extrabold text-[#2563EB] tabular-nums">
              {formatPrice(grandTotal)}
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigateTo('orders')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer min-h-[44px]"
          >
            Track in Order History
          </button>
          <button
            onClick={() => navigateTo('home')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[#0F172A] font-semibold text-xs transition-all cursor-pointer min-h-[44px]"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
        <button
          onClick={() => navigateTo('cart')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#2563EB] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shopping Cart</span>
        </button>
        <span className="text-xs text-[#64748B]">
          Step 2 of 2: Checkout & Delivery Selection
        </span>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Delivery Info & Per-Seller Delivery Method */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              <MapPin className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-lg font-bold text-[#0F172A]">
                Customer Delivery Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +1 (555) 019-2834"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                required
                placeholder="Apartment, suite, unit, building, street address"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / District *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10001"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delivery Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Gate code, drop-off preferences, or instructions."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              <Truck className="w-5 h-5 text-[#2563EB]" />
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  Select Delivery Method per Seller Parcel
                </h2>
                <p className="text-xs text-[#64748B]">
                  Choose how each shop delivers your merchandise
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {Object.values(itemsBySeller).map((sellerGroup) => {
                const currentMethod =
                  deliveryMethodBySeller[sellerGroup.sellerId] || 'Seller Delivery';

                const parcelSubtotal = sellerGroup.items.reduce((sum, it) => {
                  const pr = it.product.discountedPrice ?? it.product.originalPrice;
                  return sum + pr * it.quantity;
                }, 0);

                const parcelFee = parcelSubtotal > freeThreshold ? 0 : standardFee;

                return (
                  <div
                    key={sellerGroup.sellerId}
                    className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-slate-900">
                          Parcel: {sellerGroup.sellerName}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-700">
                        {sellerGroup.items.length}{' '}
                        {sellerGroup.items.length === 1 ? 'item' : 'items'} ·{' '}
                        {formatPrice(parcelSubtotal)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                      <label
                        className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                          currentMethod === 'Seller Delivery'
                            ? 'bg-white border-blue-500 ring-1 ring-blue-500'
                            : 'bg-white/70 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`deliveryMethod-${sellerGroup.sellerId}`}
                          checked={currentMethod === 'Seller Delivery'}
                          onChange={() =>
                            handleDeliveryMethodChange(sellerGroup.sellerId, 'Seller Delivery')
                          }
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-bold text-slate-900">Seller Delivery</div>
                          <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                            Delivered directly by {sellerGroup.sellerName} rider.
                          </div>
                          <div className="text-[11px] font-semibold text-blue-700 mt-1">
                            Fee: {parcelFee === 0 ? 'FREE' : formatPrice(parcelFee)}
                          </div>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                          currentMethod === 'Supermarket Delivery'
                            ? 'bg-white border-blue-500 ring-1 ring-blue-500'
                            : 'bg-white/70 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`deliveryMethod-${sellerGroup.sellerId}`}
                          checked={currentMethod === 'Supermarket Delivery'}
                          onChange={() =>
                            handleDeliveryMethodChange(
                              sellerGroup.sellerId,
                              'Supermarket Delivery'
                            )
                          }
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-bold text-slate-900">
                            {marketplaceConfig.delivery.platformDeliveryLabel}
                          </div>
                          <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                            Picked up from shop & fulfilled by {marketplaceConfig.marketplaceName} courier.
                          </div>
                          <div className="text-[11px] font-semibold text-teal-700 mt-1">
                            Fee: {parcelFee === 0 ? 'FREE' : formatPrice(parcelFee)}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-xs space-y-6 sticky top-20">
          <h3 className="text-base font-bold text-[#0F172A]">Order Summary</h3>

          <div className="max-h-60 overflow-y-auto divide-y divide-[#E2E8F0] pr-1 space-y-2">
            {cart.map((item) => {
              const price = item.product.discountedPrice ?? item.product.originalPrice;
              return (
                <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {item.product.images[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-[#0F172A] truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Qty: {item.quantity} · {item.product.shopName || item.product.sellerName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-semibold text-[#0F172A] tabular-nums shrink-0">
                    {formatPrice(price * item.quantity)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
            <div className="flex items-center justify-between">
              <span>Subtotal ({cart.length} items)</span>
              <span className="font-semibold text-[#0F172A] tabular-nums">
                {formatPrice(cartSubtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Delivery Fee ({Object.keys(itemsBySeller).length} parcels)</span>
              <span className="font-semibold text-[#0F172A] tabular-nums">
                {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
              </span>
            </div>
            <div className="pt-2 border-t border-[#E2E8F0] flex items-baseline justify-between">
              <span className="text-sm font-bold text-[#0F172A]">Total Due (COD)</span>
              <span className="text-2xl font-extrabold text-[#2563EB] tabular-nums">
                {formatPrice(grandTotal)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#64748B]">
            Payment Method: <strong className="text-[#0F172A]">Cash on Delivery (COD)</strong> upon doorstep receipt.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[48px]"
          >
            <span>
              {isSubmitting ? 'Confirming Order...' : 'Confirm Order (Cash on Delivery)'}
            </span>
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-[#64748B]">
            <ShieldCheck className="w-4 h-4 text-[#64748B]" />
            <span>Multi-vendor parcel tracking ready</span>
          </div>
        </div>
      </form>
    </div>
  );
};
