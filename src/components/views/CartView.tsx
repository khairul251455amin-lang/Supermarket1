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
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { EmptyState } from '../common/EmptyState';

export const CartView: React.FC = () => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    navigateTo,
  } = useMarketplace();

  // Group cart items by seller ID (Feature 7: Handle products from multiple sellers)
  const itemsBySeller = cart.reduce((acc, item) => {
    const sellerKey = item.product.sellerId || 'unknown-seller';
    if (!acc[sellerKey]) {
      acc[sellerKey] = {
        sellerId: item.product.sellerId,
        sellerName: item.product.sellerName,
        items: [],
      };
    }
    acc[sellerKey].items.push(item);
    return acc;
  }, {} as Record<string, { sellerId: string; sellerName: string; items: typeof cart }>);

  const deliveryFee = cartSubtotal > 50 ? 0 : 5;
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

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
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
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden"
              >
                {/* Seller Group Header */}
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Seller: {sellerGroup.sellerName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {sellerGroup.sellerId}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 tabular-nums">
                    Package Subtotal: ${sellerSubtotal.toFixed(2)}
                  </span>
                </div>

                {/* Items in this Seller Package */}
                <div className="divide-y divide-slate-100 p-2 sm:p-4">
                  {sellerGroup.items.map((item) => {
                    const price = item.product.discountedPrice ?? item.product.originalPrice;
                    const isMaxStock = item.quantity >= item.product.stock;

                    return (
                      <div
                        key={item.productId}
                        className="py-4 first:pt-2 last:pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        {/* Thumbnail & Title */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <img
                            src={
                              item.product.images[0] ||
                              'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'
                            }
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4
                              onClick={() => navigateTo('product', { productId: item.productId })}
                              className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate cursor-pointer"
                            >
                              {item.product.name}
                            </h4>
                            <div className="text-xs text-slate-500 mt-0.5">
                              ${price.toFixed(2)} each ·{' '}
                              <span
                                className={`font-medium ${
                                  isMaxStock ? 'text-amber-600 font-semibold' : 'text-slate-400'
                                }`}
                              >
                                {item.product.stock} in stock
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
                              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors text-sm font-bold"
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
                              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>

                          {/* Line Total */}
                          <div className="text-right min-w-[70px]">
                            <div className="text-sm font-bold text-slate-900 tabular-nums">
                              ${(price * item.quantity).toFixed(2)}
                            </div>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6 sticky top-24">
          <h3 className="text-base font-bold text-slate-900">Order Summary</h3>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Subtotal ({cart.length} items)</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                ${cartSubtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Estimated Delivery</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {deliveryFee === 0 ? (
                  <span className="text-emerald-600 font-bold uppercase text-[11px]">Free</span>
                ) : (
                  `$${deliveryFee.toFixed(2)}`
                )}
              </span>
            </div>

            {deliveryFee > 0 && (
              <p className="text-[11px] text-slate-400">
                Add ${(50 - cartSubtotal).toFixed(2)} more to qualify for Free Delivery!
              </p>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-2xl font-extrabold text-blue-600 tabular-nums">
                ${grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-center gap-2.5">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Eligible for Cash on Delivery payment at door</span>
          </div>

          <button
            onClick={() => navigateTo('checkout')}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[46px]"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Safe and verified checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
};
