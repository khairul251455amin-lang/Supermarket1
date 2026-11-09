/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
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
  Share2,
  Star,
  Info,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Product } from '../../types';

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
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isRelatedModalOpen, setIsRelatedModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Touch swipe handling for photo viewer
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

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
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl cursor-pointer"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const totalPhotos = images.length;
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (totalPhotos <= 1) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next photo
      setActiveImageIndex((prev) => (prev < totalPhotos - 1 ? prev + 1 : 0));
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Previous photo
      setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : totalPhotos - 1));
    }
  };

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

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on Supermarket!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  // Related products logic
  const relatedProducts = products.filter(
    (p) => p.id !== product.id && p.category === product.category && p.isAvailable !== false
  );
  // Fallback if not enough in same category
  const fallbackProducts = products.filter(
    (p) => p.id !== product.id && p.isAvailable !== false
  );
  const displayRelated = relatedProducts.length > 0 ? relatedProducts : fallbackProducts;

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* Navigation Breadcrumb & Share */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{shareCopied ? 'Link Copied!' : 'Share Product'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-2 text-xs font-medium ${
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
        {/* Left Column: Swipeable Photo Viewer */}
        <div className="lg:col-span-7 space-y-4">
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative aspect-4/3 w-full bg-slate-950 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs group select-none"
          >
            {images.length > 0 ? (
              <img
                src={images[activeImageIndex] || images[0]}
                alt={`${product.name} (Photo ${activeImageIndex + 1} of ${totalPhotos})`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-101"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                <PackageX className="w-12 h-12 mb-2" />
                <span className="text-xs font-medium">No photo available</span>
              </div>
            )}

            {/* Discount Badge in Upper-Left */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start z-10">
              {hasDiscount && displayDiscountPercent !== null && (
                <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-extrabold bg-rose-600 text-white shadow-md">
                  {displayDiscountPercent}% OFF
                </span>
              )}
            </div>

            {/* Favourite Button in Upper-Right */}
            <button
              onClick={() => toggleFavourite(product.id)}
              aria-label={isSaved ? 'Remove from favourites' : 'Save to favourites'}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600 backdrop-blur-md flex items-center justify-center shadow-md transition-all z-10 cursor-pointer active:scale-95"
            >
              <Heart
                className={`w-5 h-5 transition-transform ${
                  isSaved ? 'fill-rose-600 text-rose-600 scale-110' : ''
                }`}
              />
            </button>

            {/* Floating Photo Counter Badge (e.g. 1/2 or 2/2) */}
            {totalPhotos > 0 && (
              <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-mono font-bold shadow-sm z-10 flex items-center gap-1.5">
                <span>📷</span>
                <span>{activeImageIndex + 1} / {totalPhotos}</span>
              </div>
            )}

            {/* Pagination Dots */}
            {totalPhotos > 1 && (
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2 z-10">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`Go to photo ${idx + 1}`}
                    className={`transition-all rounded-full ${
                      activeImageIndex === idx
                        ? 'w-6 h-2 bg-blue-600 shadow-md'
                        : 'w-2 h-2 bg-white/70 hover:bg-white shadow-xs'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Desktop Previous / Next Carousel Arrows */}
            {totalPhotos > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : totalPhotos - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() => setActiveImageIndex((prev) => (prev < totalPhotos - 1 ? prev + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-400 font-medium">
            Swipe left/right on mobile or use arrows to view both seller photos
          </div>
        </div>

        {/* Right Column: Basic Product Information & Actions */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/85 shadow-xs space-y-6">
          {/* Seller Metadata Header */}
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
              View Shop →
            </span>
          </div>

          {/* Product Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug">
              {product.name}
            </h1>
            <div className="text-xs text-slate-500 mt-1">
              Category: <span className="font-semibold text-slate-700">{product.category}</span>
              {product.subcategory && <span> • {product.subcategory}</span>}
            </div>
          </div>

          {/* Real Pricing Display */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums">
                ${currentPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-slate-400 line-through tabular-nums">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                    {displayDiscountPercent}% OFF — Save ${(product.originalPrice - product.discountedPrice!).toFixed(2)}
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-slate-500">
              Inclusive of all taxes · Cash on Delivery & Online payment eligible
            </div>
          </div>

          {/* Stock Availability & Available Quantity */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                  <PackageX className="w-4 h-4 text-rose-600" />
                  <span>Currently Out of Stock</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  <span>✓ In Stock</span>
                </span>
              )}
            </div>
            {!isOutOfStock && (
              <div className="text-xs text-slate-500 font-medium pl-1">
                Available: <strong className="text-slate-800 font-mono">{product.stock} units</strong>
              </div>
            )}
          </div>

          {/* Quantity Selector & Main Shopping Actions */}
          {!isOutOfStock && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quantity</label>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-xs">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-40 cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-sm font-extrabold text-slate-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= product.stock}
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-40 cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons: Add to Cart & Buy Now */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs min-h-[46px] active:scale-95"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md min-h-[46px] active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Guarantee Badges */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Verified Seller</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Fast Dispatch</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: PRODUCT INFORMATION — MORE → */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/85 shadow-xs space-y-4">
        <div
          onClick={() => setIsInfoExpanded(!isInfoExpanded)}
          className="flex items-center justify-between cursor-pointer group select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Product Information
              </h2>
              <p className="text-xs text-slate-500">
                Specifications, ratings, description, and dispatch details
              </p>
            </div>
          </div>

          <button
            type="button"
            className="text-xs font-bold text-blue-600 group-hover:text-blue-700 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors"
          >
            <span>{isInfoExpanded ? 'Collapse' : 'More'}</span>
            <span>{isInfoExpanded ? '←' : '→'}</span>
          </button>
        </div>

        {isInfoExpanded && (
          <div className="pt-4 border-t border-slate-100 space-y-6 animate-fadeIn">
            {/* Ratings & Reviews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-xs font-bold text-slate-700 uppercase">Product Rating</div>
                <div className="flex items-center gap-1.5 text-slate-800">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold">No ratings yet</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-xs font-bold text-slate-700 uppercase">Customer Reviews</div>
                <div className="text-sm font-semibold text-slate-600">No reviews yet</div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Detailed Description</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {product.description}
              </p>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Category</span>
                <strong className="text-slate-800 text-sm">{product.category}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Subcategory</span>
                <strong className="text-slate-800 text-sm">{product.subcategory || 'General'}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Product ID</span>
                <strong className="text-slate-800 font-mono text-xs">{product.id}</strong>
              </div>
            </div>

            {/* Delivery & Return info */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2 text-xs text-blue-900">
              <div className="font-bold flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Delivery & Return Information</span>
              </div>
              <p className="text-slate-600">
                Fulfilled directly by {product.sellerName} from {product.sellerLocation}. Standard home delivery and express local dispatch supported. Verified return policy applies within 3 days of delivery for eligible items.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: SELLER / SHOP INFORMATION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/85 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-xl flex items-center justify-center border border-blue-200">
              {product.sellerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{product.sellerName}</h3>
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Verified Vendor
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>📍 {product.sellerLocation}</span>
                <span>•</span>
                <span className="font-mono">ID: {product.sellerId}</span>
                <span>•</span>
                <span className="text-amber-600 font-semibold">No ratings yet</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
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
                  `Hello ${product.sellerName}, I have a question about "${product.name}".`
                );
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Message Shop</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('shop', { sellerId: product.sellerId })}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>View Shop →</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 7 & 8 & 9 & 10: RELATED PRODUCTS (PHOTO-FOCUSED DISCOVERY GRID) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Related Products</h2>
            <p className="text-xs text-slate-500">Discover similar items in {product.category}</p>
          </div>

          <button
            type="button"
            onClick={() => setIsRelatedModalOpen(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <span>More →</span>
          </button>
        </div>

        {displayRelated.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayRelated.slice(0, 4).map((relProduct) => {
              const relHasDiscount =
                typeof relProduct.discountedPrice === 'number' &&
                relProduct.discountedPrice < relProduct.originalPrice;
              const relCurrentPrice = relHasDiscount ? relProduct.discountedPrice! : relProduct.originalPrice;
              const relIsSaved = isFavourite(relProduct.id);

              return (
                <div
                  key={relProduct.id}
                  onClick={() => navigateTo('product', { productId: relProduct.id })}
                  className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                >
                  <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                    <img
                      src={relProduct.images[0] || ''}
                      alt={relProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />

                    {/* Discount badge */}
                    {relHasDiscount && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                        SALE
                      </span>
                    )}

                    {/* Favourite button */}
                    <button
                      type="button"
                      aria-label="Save to favourites"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavourite(relProduct.id);
                      }}
                      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-xs transition-all ${
                        relIsSaved ? 'bg-rose-50 text-rose-600' : 'bg-white/80 text-slate-600 hover:text-rose-600'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${relIsSaved ? 'fill-rose-600' : ''}`} />
                    </button>
                  </div>

                  <div className="p-3 space-y-1">
                    <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {relProduct.name}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                        ${relCurrentPrice.toFixed(2)}
                      </span>
                      {relHasDiscount && (
                        <span className="text-[10px] text-slate-400 line-through tabular-nums">
                          ${relProduct.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-xs text-slate-500">
            No related products available yet.
          </div>
        )}
      </div>

      {/* RELATED PRODUCTS — MORE MODAL / DISCOVERY VIEW */}
      {isRelatedModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Related Products Discovery ({displayRelated.length})
                </h3>
                <p className="text-xs text-slate-500">Explore all relevant merchandise in {product.category}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRelatedModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayRelated.map((relProduct) => (
                <div
                  key={relProduct.id}
                  onClick={() => {
                    setIsRelatedModalOpen(false);
                    navigateTo('product', { productId: relProduct.id });
                  }}
                  className="group cursor-pointer bg-white rounded-2xl border border-slate-200 p-3 hover:border-blue-500 transition-all shadow-xs"
                >
                  <div className="aspect-square w-full rounded-xl bg-slate-100 overflow-hidden mb-2">
                    <img
                      src={relProduct.images[0]}
                      alt={relProduct.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">{relProduct.name}</div>
                  <div className="text-xs font-extrabold text-blue-600 mt-0.5">
                    ${(relProduct.discountedPrice ?? relProduct.originalPrice).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
