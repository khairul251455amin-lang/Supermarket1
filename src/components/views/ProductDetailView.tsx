/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
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
  MapPin,
  BadgeCheck,
  FileText,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { marketplaceConfig, formatPrice } from '../../config/marketplaceConfig';
import { Product } from '../../types';
import { auth } from '../../services/firebaseConfig';
import { ProductCard } from '../common/ProductCard';

export const ProductDetailView: React.FC = () => {
  const {
    selectedProductId,
    products,
    sellerProducts,
    productsLoading,
    loadProductById,
    navigateTo,
    addToCart,
    toggleFavourite,
    isFavourite,
    startConversation,
    openAuthGate,
  } = useMarketplace();

  const liveMatch =
    products.find((p) => p.id === selectedProductId) ||
    sellerProducts.find((p) => p.id === selectedProductId);

  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [fetchingDirect, setFetchingDirect] = useState(false);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
    setFeedback(null);

    if (!selectedProductId || liveMatch) {
      setFetchedProduct(null);
      return;
    }

    let cancelled = false;
    setFetchingDirect(true);
    loadProductById(selectedProductId)
      .then((res) => {
        if (!cancelled) setFetchedProduct(res);
      })
      .finally(() => {
        if (!cancelled) setFetchingDirect(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProductId, Boolean(liveMatch)]);

  const product = liveMatch || fetchedProduct;

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  if ((productsLoading || fetchingDirect) && !product) {
    return (
      <div className="max-w-6xl mx-auto py-4 animate-pulse space-y-6">
        <div className="h-5 w-36 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 aspect-4/3 bg-slate-200 rounded-2xl" />
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 space-y-4 border border-[#E2E8F0]">
            <div className="h-5 w-1/2 bg-slate-200 rounded" />
            <div className="h-8 w-4/5 bg-slate-200 rounded" />
            <div className="h-20 w-full bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const isOwnerViewing = Boolean(
    product && auth.currentUser && product.ownerUid === auth.currentUser.uid
  );
  const isProductPubliclyVisible = Boolean(
    product &&
      product.status === 'published' &&
      product.isAvailable !== false &&
      !product.isRemovedByModeration
  );

  if (!product || (!isProductPubliclyVisible && !isOwnerViewing)) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-[#E2E8F0] max-w-lg mx-auto my-12">
        <PackageX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#0F172A] mb-1">
          Product Unavailable or Removed
        </h2>
        <p className="text-xs text-[#64748B] mb-6">
          This product may have been paused, deleted by the seller, or does not exist.
        </p>
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl cursor-pointer"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const totalPhotos = images.length;
  const isSaved = isFavourite(product.id);
  const stockCount = product.stockQuantity ?? product.stock;
  const isOutOfStock = stockCount <= 0 || product.status === 'out_of_stock';
  const displayShopName = product.shopName || product.sellerName;
  const displayLocation =
    product.location || product.sellerLocation || marketplaceConfig.contact.cityHub;

  const basePrice = product.originalPrice ?? product.price;
  const hasDiscount =
    typeof product.discountedPrice === 'number' && product.discountedPrice < basePrice;

  const currentPrice = hasDiscount ? product.discountedPrice! : product.price ?? basePrice;
  const displayDiscountPercent =
    product.discountPercentage ??
    (hasDiscount ? Math.round(((basePrice - product.discountedPrice!) / basePrice) * 100) : null);

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
      setActiveImageIndex((prev) => (prev < totalPhotos - 1 ? prev + 1 : 0));
    } else if (distance < -minSwipeDistance) {
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
    if (!auth.currentUser) {
      openAuthGate('Please sign in or create an account to continue to checkout.');
      return;
    }
    const res = addToCart(product, quantity);
    if (res.success) {
      navigateTo('checkout');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/product/${encodeURIComponent(product.id)}`;
    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          text: `Check out ${product.name} on ${marketplaceConfig.marketplaceName}`,
          url: shareUrl,
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const relatedProducts = products.filter(
    (p) => p.id !== product.id && p.category === product.category
  );
  const fallbackProducts = products.filter((p) => p.id !== product.id);
  const displayRelated = relatedProducts.length > 0 ? relatedProducts : fallbackProducts;

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#2563EB] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          {!isProductPubliclyVisible && isOwnerViewing && (
            <span className="px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              Seller Preview ({product.status})
            </span>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{shareCopied ? 'Link Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl flex items-center gap-2 text-xs font-medium ${
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

      {/* Main 2-Column Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Swipeable Image Gallery */}
        <div className="lg:col-span-7 space-y-3">
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative aspect-4/3 w-full bg-[#0F172A] rounded-2xl overflow-hidden border border-[#E2E8F0] group select-none"
          >
            {images.length > 0 ? (
              <img
                src={images[activeImageIndex] || images[0]}
                alt={`${product.name} (Photo ${activeImageIndex + 1} of ${totalPhotos})`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#64748B] bg-slate-100">
                <PackageX className="w-12 h-12 mb-2" />
                <span className="text-xs font-medium">No photo available</span>
              </div>
            )}

            {/* Discount Badge Top-Left */}
            {hasDiscount && displayDiscountPercent !== null && (
              <span className="absolute top-3.5 left-3.5 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-sm z-10">
                {displayDiscountPercent}% OFF
              </span>
            )}

            {/* Favorite Button Top-Right */}
            <button
              type="button"
              onClick={() => toggleFavourite(product.id)}
              aria-label={isSaved ? 'Remove from favorites' : 'Save to favorites'}
              className="absolute top-3.5 right-3.5 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-[#64748B] hover:text-rose-600 flex items-center justify-center shadow-md transition-all z-10 cursor-pointer active:scale-95"
            >
              <Heart
                className={`w-5 h-5 transition-transform ${
                  isSaved ? 'fill-rose-600 text-rose-600 scale-110' : ''
                }`}
              />
            </button>

            {/* Counter Pill */}
            {totalPhotos > 0 && (
              <div className="absolute bottom-3.5 left-3.5 px-2.5 py-1 rounded-lg bg-[#0F172A]/80 backdrop-blur-xs text-white text-xs font-mono font-semibold z-10">
                {activeImageIndex + 1} / {totalPhotos}
              </div>
            )}

            {/* Mobile Pagination Dots */}
            {totalPhotos > 1 && (
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2 z-10">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View photo ${idx + 1}`}
                    className={`transition-all rounded-full cursor-pointer ${
                      activeImageIndex === idx
                        ? 'w-6 h-2 bg-[#2563EB]'
                        : 'w-2 h-2 bg-white/75 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Previous / Next Controls */}
            {totalPhotos > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : totalPhotos - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#0F172A] shadow-md flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() => setActiveImageIndex((prev) => (prev < totalPhotos - 1 ? prev + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#0F172A] shadow-md flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          <p className="text-center text-[11px] text-[#64748B]">
            Swipe left or right or use arrows to view both seller photos
          </p>
        </div>

        {/* Right: Sticky Contiguous Purchase Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] space-y-5 lg:sticky lg:top-20">
          {/* Seller Header */}
          <button
            type="button"
            onClick={() => navigateTo('shop', { sellerId: product.sellerId })}
            className="w-full flex items-center justify-between pb-3.5 border-b border-[#E2E8F0] cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2 text-xs text-[#64748B] min-w-0">
              <Store className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span className="truncate">
                Sold by{' '}
                <strong className="text-[#0F172A] font-semibold group-hover:text-[#2563EB] transition-colors">
                  {displayShopName}
                </strong>
              </span>
              <BadgeCheck className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
            </div>
            <span className="text-xs font-semibold text-[#2563EB] group-hover:text-[#1D4ED8] shrink-0">
              Visit Shop →
            </span>
          </button>

          {/* Product Title & Taxonomy */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
              {product.category}
              {product.subcategory ? ` · ${product.subcategory}` : ''}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Ships from {displayLocation}</span>
            </div>
          </div>

          {/* Price Block */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-extrabold text-[#0F172A] tabular-nums">
                {formatPrice(currentPrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-[#64748B] line-through tabular-nums">
                    {formatPrice(basePrice)}
                  </span>
                  <span className="text-xs font-bold text-rose-600">
                    Save {formatPrice(basePrice - product.discountedPrice!)} ({displayDiscountPercent}%)
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-[#64748B]">
              Cash on Delivery accepted · Tax included where applicable
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between text-xs">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-rose-600">
                <PackageX className="w-4 h-4" />
                <span>Currently Out of Stock</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <span>In Stock ({stockCount} units available)</span>
              </span>
            )}
          </div>

          {/* Quantity & Action Buttons */}
          {!isOutOfStock && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Quantity
                </label>
                <div className="flex items-center border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] overflow-hidden">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-[#0F172A] hover:bg-slate-200 transition-colors disabled:opacity-40 cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-[#0F172A] tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= stockCount}
                    onClick={() => setQuantity((q) => Math.min(stockCount, q + 1))}
                    className="w-10 h-10 flex items-center justify-center text-[#0F172A] hover:bg-slate-200 transition-colors disabled:opacity-40 cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full h-11 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-[#EFF6FF] hover:bg-blue-100 text-[#1D4ED8] border border-blue-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full h-11 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Concise Trust Line */}
          <div className="pt-4 border-t border-[#E2E8F0] grid grid-cols-2 gap-3 text-xs text-[#64748B]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>Verified Seller</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{(product.deliveryOptions || ['Seller Delivery']).join(' / ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Below-the-fold Modular Information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Description & Product Info */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
            <FileText className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-base font-bold text-[#0F172A]">Description & Product Info</h2>
          </div>

          <p className="text-sm text-[#64748B] leading-relaxed whitespace-pre-line">
            {product.description || `${product.name} sold by ${displayShopName}.`}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block">Category</span>
              <strong className="text-[#0F172A]">{product.category}</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block">Subcategory</span>
              <strong className="text-[#0F172A]">{product.subcategory || 'General'}</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] col-span-2 sm:col-span-1">
              <span className="text-[#64748B] block">Product Reference</span>
              <strong className="text-[#0F172A] font-mono truncate block">{product.id}</strong>
            </div>
          </div>
        </div>

        {/* Delivery Info & Seller Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E8F0]">
              <Truck className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-base font-bold text-[#0F172A]">Delivery Info</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Fulfilled by <strong className="text-[#0F172A]">{displayShopName}</strong> from{' '}
              <strong className="text-[#0F172A]">{displayLocation}</strong>.
            </p>
            <div className="text-xs text-[#64748B] space-y-1.5 pt-1">
              {(product.deliveryOptions || ['Seller Delivery', 'Supermarket Delivery']).map(
                (opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{opt}</span>
                  </div>
                )
              )}
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Free delivery threshold: {formatPrice(marketplaceConfig.delivery.freeShippingThreshold)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#2563EB] font-bold text-xl flex items-center justify-center shrink-0">
                {displayShopName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-[#0F172A] truncate">{displayShopName}</h3>
                  <BadgeCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
                </div>
                <div className="text-xs text-[#64748B] truncate">
                  {displayLocation} · ID: <span className="font-mono">{product.sellerId}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  startConversation(
                    product.sellerId,
                    displayShopName,
                    {
                      id: product.id,
                      name: product.name,
                      price: currentPrice,
                      image: product.images[0],
                      sellerName: displayShopName,
                    },
                    `Hello ${displayShopName}, I have a question about "${product.name}".`
                  );
                }}
                className="h-10 px-3 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[#0F172A] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Message Shop</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('shop', { sellerId: product.sellerId })}
                className="h-10 px-3 rounded-xl bg-[#0F172A] hover:bg-[#111827] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Visit Shop</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="space-y-4 pt-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">Related Products</h2>
          <p className="text-xs text-[#64748B]">Similar items in {product.category}</p>
        </div>

        {displayRelated.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {displayRelated.slice(0, 4).map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] text-center text-xs text-[#64748B]">
            No related products available yet.
          </div>
        )}
      </section>
    </div>
  );
};
