/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShoppingCart,
  Trash2,
  Store,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Truck,
  Package,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { formatPrice, marketplaceConfig } from '../../config/marketplaceConfig';
import { EmptyState } from '../common/EmptyState';

export const CartView: React.FC = () => {
  const {
    cart,
    user,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    navigateTo,
    openAuthGate,
  } = useMarketplace();

  // Group cart items by seller ID
  const itemsBySeller = cart.reduce((acc, item) => {
    const sellerKey = item.product.shopId || item.product.sellerId || 'unknown-seller';
    if (!acc[sellerKey]) {
      acc[sellerKey] = {
        sellerId: sellerKey,
        sellerName: item.product.shopName || item.product.sellerName,
        items: [],
      };
    }
    acc[sellerKey].items.push(item);
    return acc;
  }, {} as Record<string, { sellerId: string; sellerName: string; items: typeof cart }>);

  const freeThreshold = marketplaceConfig.delivery.freeShippingThreshold;
  const standardFee = marketplaceConfig.delivery.standardFee;
  const deliveryFee = cartSubtotal > freeThreshold ? 0 : standardFee;
  const grandTotal = cartSubtotal + (cart.length > 0 ? deliveryFee : 0);

  if (cart.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your Shopping Cart is Empty"
        description="You have not added any products to your basket yet. Explore our multi-vendor marketplace to discover items."
        actionLabel="Start Shopping"
        onAction={() => navigateTo('home')}
      />
    );
  }

  const handleCheckout = () => {
    if (!user) {
      openAuthGate('Please sign in or create an account to complete checkout.');
      return;
    }
    navigateTo('checkout');
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Review items grouped across {Object.keys(itemsBySeller).length}{' '}
            {Object.keys(itemsBySeller).length === 1 ? 'seller shop' : 'seller shops'}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Grouped by Sellers */}
        <div className="lg:col-span-8 space-y-6">
          {Object.values(itemsBySeller).map((sellerGroup) => {
            const sellerSubtotal = sellerGroup.items.reduce((sum, it) => {
              const price = it.product.discountedPrice ?? it.product.originalPrice;
              return sum + price * it.quantity;
            }, 0);

            return (
              <div
                key={sellerGroup.sellerId}
                className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden"
              >
                {/* Seller Group Header */}
                <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => navigateTo('shop', { sellerId: sellerGroup.sellerId })}
                    className="flex items-center gap-2 hover:text-[#2563EB] transition-colors cursor-pointer min-w-0"
                  >
                    <Store className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span className="text-xs font-bold text-[#0F172A] truncate">
                      {sellerGroup.sellerName}
                    </span>
                    <span className="text-[11px] font-mono text-[#64748B] hidden sm:inline">
                      ({sellerGroup.sellerId})
                    </span>
                  </button>
                  <span className="text-xs font-semibold text-[#64748B] tabular-nums shrink-0">
                    Package Subtotal: {formatPrice(sellerSubtotal)}
                  </span>
                </div>

                {/* Items in this Seller Package */}
                <div className="divide-y divide-slate-100 p-2 sm:p-4">
                  {sellerGroup.items.map((item) => {
                    const price = item.product.discountedPrice ?? item.product.originalPrice;
                    const availableStock = item.product.stockQuantity ?? item.product.stock;
                    const isMaxStock = item.quantity >= availableStock;

                    return (
                      <div
                        key={item.productId}
                        className="py-4 first:pt-2 last:pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        {/* Thumbnail & Title */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {item.product.images[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4
                              onClick={() => navigateTo('product', { productId: item.productId })}
                              className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate cursor-pointer"
                            >
                              {item.product.name}
                            </h4>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {formatPrice(price)} each ·{' '}
                              <span
                                className={`font-medium ${
                                  isMaxStock ? 'text-amber-600 font-semibold' : 'text-slate-400'
                                }`}
                              >
                                {availableStock} in stock
                              </span>
                            </div>
                            {isMaxStock && (
                              <div className="flex items-center gap-1 text-[11px] text-amber-700 mt-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>Max available quantity reached</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Controls & Line Total */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                          {/* Quantity Stepper */}
                          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors text-sm font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-10 text-center text-xs font-bold text-slate-900 tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isMaxStock}
                              onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {/* Line Total */}
                          <div className="text-right min-w-[70px]">
                            <div className="text-sm font-bold text-slate-900 tabular-nums">
                              {formatPrice(price * item.quantity)}
                            </div>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-xs space-y-6 sticky top-20">
          <h3 className="text-base font-bold text-[#0F172A]">Order Summary</h3>

          <div className="space-y-3 text-xs text-[#64748B]">
            <div className="flex items-center justify-between">
              <span>Subtotal ({cart.length} items)</span>
              <span className="font-semibold text-[#0F172A] tabular-nums">
                {formatPrice(cartSubtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Estimated Delivery</span>
              <span className="font-semibold text-[#0F172A] tabular-nums">
                {deliveryFee === 0 ? (
                  <span className="text-emerald-600 font-bold uppercase text-[11px]">Free</span>
                ) : (
                  formatPrice(deliveryFee)
                )}
              </span>
            </div>

            {deliveryFee > 0 && (
              <p className="text-[11px] text-[#64748B]">
                Add {formatPrice(freeThreshold - cartSubtotal)} more to qualify for Free Delivery!
              </p>
            )}

            <div className="pt-3 border-t border-[#E2E8F0] flex items-baseline justify-between">
              <span className="text-sm font-bold text-[#0F172A]">Total</span>
              <span className="text-2xl font-extrabold text-[#2563EB] tabular-nums">
                {formatPrice(grandTotal)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] flex items-center gap-2.5">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Eligible for Cash on Delivery payment at door</span>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[46px]"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-[#64748B]">
            <ShieldCheck className="w-4 h-4 text-[#64748B]" />
            <span>Safe and verified checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
};
