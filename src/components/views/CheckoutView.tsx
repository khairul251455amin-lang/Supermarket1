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
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Address, DeliveryMethod } from '../../types';

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    user,
    placeOrder,
    navigateTo,
  } = useMarketplace();

  // Pre-fill only if user has previously saved an address, otherwise starts empty
  const [fullName, setFullName] = useState(user?.deliveryAddress?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.deliveryAddress?.phone || user?.phoneNumber || '');
  const [street, setStreet] = useState(user?.deliveryAddress?.street || '');
  const [city, setCity] = useState(user?.deliveryAddress?.city || '');
  const [postalCode, setPostalCode] = useState(user?.deliveryAddress?.postalCode || '');
  const [deliveryNotes, setDeliveryNotes] = useState(user?.deliveryAddress?.deliveryNotes || '');

  // Group cart items by seller
  const itemsBySeller = useMemo(() => {
    return cart.reduce((acc, item) => {
      const sId = item.product.sellerId || 'unknown-seller';
      if (!acc[sId]) {
        acc[sId] = {
          sellerId: sId,
          sellerName: item.product.sellerName,
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

  // Calculate delivery fee across seller parcels ($5 per parcel, free if parcel > $50)
  const deliveryFee = useMemo(() => {
    let fee = 0;
    Object.values(itemsBySeller).forEach((sellerGroup) => {
      const sub = sellerGroup.items.reduce((sum, it) => {
        const pr = it.product.discountedPrice ?? it.product.originalPrice;
        return sum + pr * it.quantity;
      }, 0);
      if (sub <= 50) {
        fee += 5;
      }
    });
    return fee;
  }, [itemsBySeller]);

  const grandTotal = cartSubtotal + deliveryFee;

  if (cart.length === 0 && !confirmedOrderId) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto my-12">
        <PackageCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 mb-6">
          Add items to your cart before proceeding to checkout.
        </p>
        <button
          onClick={() => navigateTo('home')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl"
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

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();

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

    const result = placeOrder(deliveryAddress, deliveryMethodBySeller, deliveryNotes);

    if (result.success && result.orderId) {
      setConfirmedOrderId(result.orderId);
      setErrorMessage(null);
    } else {
      setErrorMessage(result.error || 'Failed to complete order.');
    }
  };

  // Order Confirmation View
  if (confirmedOrderId) {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Vendor Order Confirmed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Order Placed Successfully!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Parent Order Reference: <strong className="font-mono text-slate-900">{confirmedOrderId}</strong>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 text-left space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Multi-Seller Fulfilment Generated</span>
          </div>
          <p className="text-[11px] leading-relaxed text-blue-800">
            Separate fulfilment orders have been dispatched to each respective seller's dashboard. Sellers will package your items and coordinate delivery using the chosen delivery method.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
            <span className="text-slate-500">Payment Method:</span>
            <span className="font-semibold text-slate-900">Cash on Delivery (COD)</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
            <span className="text-slate-500">Recipient:</span>
            <span className="font-semibold text-slate-900">{fullName} ({phone})</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
            <span className="text-slate-500">Delivery Destination:</span>
            <span className="font-semibold text-slate-900 text-right max-w-xs truncate">
              {street}, {city} {postalCode}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-500">Total Cash Due Upon Delivery:</span>
            <span className="text-base font-extrabold text-blue-600 tabular-nums">
              ${grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigateTo('orders')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer min-h-[44px]"
          >
            Track in Order History
          </button>
          <button
            onClick={() => navigateTo('home')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer min-h-[44px]"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={() => navigateTo('cart')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shopping Cart</span>
        </button>
        <span className="text-xs text-slate-500">
          Step 2 of 2: Checkout & Delivery Selection
        </span>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Delivery Info & Per-Seller Delivery Method */}
        <div className="lg:col-span-7 space-y-6">
          {/* Address Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">
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

          {/* Per-Seller Parcel Delivery Method Selection (Phase 2 Requirement 9 & 10) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Truck className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Select Delivery Method per Seller Parcel
                </h2>
                <p className="text-xs text-slate-500">
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

                const parcelFee = parcelSubtotal > 50 ? 0 : 5;

                return (
                  <div
                    key={sellerGroup.sellerId}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-slate-900">
                          Parcel: {sellerGroup.sellerName}
                        </span>
                        <span className="font-mono text-slate-400">ID: {sellerGroup.sellerId}</span>
                      </div>
                      <span className="font-semibold text-slate-700">
                        {sellerGroup.items.length} {sellerGroup.items.length === 1 ? 'item' : 'items'} · ${parcelSubtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                      {/* Method 1: Seller Delivery */}
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
                            Fee: {parcelFee === 0 ? 'FREE' : `$${parcelFee.toFixed(2)}`}
                          </div>
                        </div>
                      </label>

                      {/* Method 2: Supermarket Delivery */}
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
                            handleDeliveryMethodChange(sellerGroup.sellerId, 'Supermarket Delivery')
                          }
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-bold text-slate-900">Supermarket Delivery</div>
                          <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                            Picked up from shop & fulfilled by Supermarket courier.
                          </div>
                          <div className="text-[11px] font-semibold text-teal-700 mt-1">
                            Fee: {parcelFee === 0 ? 'FREE' : `$${parcelFee.toFixed(2)}`}
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
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6 sticky top-24">
          <h3 className="text-base font-bold text-slate-900">Order Summary</h3>

          {/* Itemized List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2">
            {cart.map((item) => {
              const price = item.product.discountedPrice ?? item.product.originalPrice;
              return (
                <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <img
                      src={
                        item.product.images[0] ||
                        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80'
                      }
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Qty: {item.quantity} · {item.product.sellerName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-semibold text-slate-900 tabular-nums shrink-0">
                    ${(price * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calculation */}
          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Subtotal ({cart.length} items)</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                ${cartSubtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Delivery Fee ({Object.keys(itemsBySeller).length} parcels)</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-900">Total Due (COD)</span>
              <span className="text-2xl font-extrabold text-blue-600 tabular-nums">
                ${grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500">
            Payment Method: <strong>Cash on Delivery (COD)</strong> upon doorstep receipt.
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[48px]"
          >
            <span>Confirm Order (Cash on Delivery)</span>
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Multi-vendor parcel tracking ready</span>
          </div>
        </div>
      </form>
    </div>
  );
};
