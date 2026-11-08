/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Zap,
  MessageSquare,
  ShieldCheck,
  Truck,
  PackageCheck,
  PackageX,
  Store,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';

export const ProductDetailView: React.FC = () => {
  const {
    selectedProductId,
    products,
    navigateTo,
    addToCart,
    toggleFavourite,
    isFavourite,
    startConversation,
  } = useMarketplace();

  const product = products.find((p) => p.id === selectedProductId);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!product) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto my-12">
        <PackageX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Product Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">
          The requested product ID does not exist or has been removed from the marketplace.
        </p>
        <button
          onClick={() => navigateTo('home')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const isSaved = isFavourite(product.id);
  const isOutOfStock = product.stock <= 0;

  // Real discount check: NEVER invent discounts!
  const hasDiscount =
    typeof product.discountedPrice === 'number' &&
    product.discountedPrice < product.originalPrice;

  const currentPrice = hasDiscount ? product.discountedPrice! : product.originalPrice;
  const displayDiscountPercent =
    product.discountPercentage ??
    (hasDiscount
      ? Math.round(((product.originalPrice - product.discountedPrice!) / product.originalPrice) * 100)
      : null);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const res = addToCart(product, quantity);
    if (res.success) {
      setFeedback({ type: 'success', message: `Added ${quantity} item(s) to cart.` });
      setTimeout(() => setFeedback(null), 2500);
    } else {
      setFeedback({ type: 'error', message: res.message });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    const res = addToCart(product, quantity);
    if (res.success) {
      navigateTo('checkout');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleContactSeller = () => {
    startConversation(
      product.sellerId,
      product.sellerName,
      {
        id: product.id,
        name: product.name,
        price: currentPrice,
        image: product.images[0],
        sellerName: product.sellerName,
      },
      `Hello ${product.sellerName}, I have an inquiry regarding "${product.name}". Is it available?`
    );
  };

  const images = product.images && product.images.length > 0 ? product.images : [];

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>
        <span className="text-xs text-slate-400">
          Category: <strong className="text-slate-700">{product.category}</strong>
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Contiguous Purchase Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Two-Photo Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-4/3 w-full bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs group">
            {images.length > 0 ? (
              <img
                src={images[activeImageIndex] || images[0]}
                alt={`${product.name} (Photo ${activeImageIndex + 1})`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <PackageX className="w-12 h-12 mb-2" />
                <span className="text-xs font-medium">No photo available</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
              {hasDiscount && displayDiscountPercent !== null && (
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-sm">
                  {displayDiscountPercent}% SAVINGS
                </span>
              )}
            </div>

            {/* Floating Photo Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-4 px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-md text-white text-[11px] font-mono font-medium shadow-sm">
                Photo {activeImageIndex + 1} of {images.length}
              </div>
            )}

            {/* Carousel Previous / Next Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Floating Favourite Button */}
            <button
              onClick={() => toggleFavourite(product.id)}
              aria-label={isSaved ? 'Remove from favourites' : 'Save to favourites'}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600 backdrop-blur-md flex items-center justify-center shadow-sm transition-all"
            >
              <Heart
                className={`w-5 h-5 transition-transform ${
                  isSaved ? 'fill-rose-600 text-rose-600 scale-110' : ''
                }`}
              />
            </button>
          </div>

          {/* Attractive Two-Photo Interactive Gallery Bar */}
          {images.length > 1 && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`p-2 rounded-2xl border-2 transition-all flex items-center gap-3 text-left bg-white cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-blue-600 ring-2 ring-blue-100 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                    <img
                      src={img}
                      alt={`Photo ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {idx === 0 ? 'Photo 1 (Front View)' : 'Photo 2 (Detail View)'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {activeImageIndex === idx ? 'Currently Viewing' : 'Tap to switch'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          {/* Seller Metadata */}
          <div
            onClick={() => navigateTo('shop', { sellerId: product.sellerId })}
            className="flex items-center justify-between pb-3 border-b border-slate-100 cursor-pointer group hover:bg-slate-50 p-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Store className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Sold by <strong className="text-slate-900 font-semibold group-hover:text-blue-600 transition-colors">{product.sellerName}</strong>
              </span>
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-400 group-hover:text-blue-600 bg-slate-100 px-2 py-0.5 rounded">
              ID: {product.sellerId} · View Shop →
            </span>
          </div>

          {/* Product Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
              {product.name}
            </h1>
          </div>

          {/* Real Pricing Display */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                ${currentPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-slate-400 line-through tabular-nums">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                    Save ${(product.originalPrice - product.discountedPrice!).toFixed(2)}
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-slate-500">
              Inclusive of standard marketplace taxes · Cash on Delivery eligible
            </div>
          </div>

          {/* Stock Availability */}
          <div className="flex items-center gap-2">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                <PackageX className="w-4 h-4" />
                <span>Currently Out of Stock</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                <PackageCheck className="w-4 h-4" />
                <span>In Stock: {product.stock} units available</span>
              </span>
            )}
          </div>

          {/* Quantity Selector & Action Controls */}
          {!isOutOfStock && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Quantity</label>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= product.stock}
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs min-h-[46px]"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md min-h-[46px]"
                >
                  <Zap className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Message Seller Button (Feature 11) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleContactSeller}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[42px]"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Contact Seller About This Item</span>
            </button>
          </div>

          {/* Description Block */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Product Description
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Guarantee Badges */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Verified Seller</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cash on Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
