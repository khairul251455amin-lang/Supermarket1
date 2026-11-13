/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, ShoppingCart, Check, PackageX, MapPin } from 'lucide-react';
import { Product } from '../../types';
import { useMarketplace } from '../../context/MarketplaceContext';
import { formatPrice } from '../../config/marketplaceConfig';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigateTo, addToCart, toggleFavourite, isFavourite } = useMarketplace();
  const [imageError, setImageError] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  const isSaved = isFavourite(product.id);
  const stockCount = product.stockQuantity ?? product.stock;
  const isOutOfStock = stockCount <= 0 || product.status === 'out_of_stock';
  const basePrice = product.originalPrice ?? product.price;
  const hasDiscount =
    typeof product.discountedPrice === 'number' && product.discountedPrice < basePrice;

  const currentPrice = hasDiscount ? product.discountedPrice! : product.price ?? basePrice;
  const displayDiscountPercent =
    product.discountPercentage ??
    (hasDiscount ? Math.round(((basePrice - product.discountedPrice!) / basePrice) * 100) : null);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    const res = addToCart(product, 1);
    if (res.success) {
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 1800);
    }
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavourite(product.id);
  };

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const totalPhotos = product.images?.length || 0;
  const currentPhoto = product.images?.[activePhotoIdx] || product.images?.[0];
  const displayShopName = product.shopName || product.sellerName;
  const displayLocation = product.location || product.sellerLocation;

  // Single concise top-left tag (no stacked pill spam)
  const topLeftBadge = isOutOfStock
    ? { label: 'Out of stock', cls: 'bg-[#0F172A]/85 text-white' }
    : hasDiscount && displayDiscountPercent !== null
    ? { label: `-${displayDiscountPercent}%`, cls: 'bg-rose-600 text-white' }
    : stockCount <= 5
    ? { label: `Only ${stockCount} left`, cls: 'bg-amber-600 text-white' }
    : null;

  return (
    <article
      onClick={() => navigateTo('product', { productId: product.id })}
      className="group relative flex flex-col bg-white rounded-2xl border border-[#E2E8F0] hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Product Image Stage */}
      <div
        className="relative aspect-4/3 w-full bg-[#F8FAFC] overflow-hidden"
        onMouseEnter={() => {
          if (totalPhotos > 1) setActivePhotoIdx(1);
        }}
        onMouseLeave={() => {
          setActivePhotoIdx(0);
        }}
      >
        {currentPhoto && !imageError ? (
          <img
            src={currentPhoto}
            alt={`${product.name} (Photo ${activePhotoIdx + 1})`}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-200 text-[#64748B]">
            <PackageX className="w-7 h-7 mb-1 text-slate-400" />
            <span className="text-[11px] font-medium">Image unavailable</span>
          </div>
        )}

        {/* Single Top-Left Status / Discount Tag */}
        {topLeftBadge && (
          <span
            className={`absolute top-2.5 left-2.5 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold tracking-tight shadow-xs ${topLeftBadge.cls}`}
          >
            {topLeftBadge.label}
          </span>
        )}

        {/* Top-Right Favorite Button */}
        <button
          type="button"
          aria-label={isSaved ? 'Remove from favorites' : 'Add to favorites'}
          onClick={handleToggleFav}
          className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer ${
            isSaved
              ? 'bg-rose-50 text-rose-600 shadow-sm'
              : 'bg-white/90 text-[#64748B] hover:text-rose-600 hover:bg-white shadow-xs'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${isSaved ? 'fill-rose-600 scale-110' : ''}`}
          />
        </button>

        {/* Dual-Photo Indicator Dots */}
        {totalPhotos > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 z-10">
            {product.images.map((_, pIdx) => (
              <button
                key={pIdx}
                type="button"
                aria-label={`Show photo ${pIdx + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx(pIdx);
                }}
                className={`transition-all rounded-full cursor-pointer ${
                  activePhotoIdx === pIdx
                    ? 'w-4 h-1.5 bg-[#2563EB] shadow-xs'
                    : 'w-1.5 h-1.5 bg-white/85 hover:bg-white shadow-xs'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4">
        {/* Clean Unboxed Metadata */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mb-1 truncate">
          <span className="font-semibold text-[#2563EB] uppercase tracking-wider shrink-0">
            {product.category}
          </span>
          <span aria-hidden="true">·</span>
          <span className="truncate font-medium text-slate-600" title={displayShopName}>
            {displayShopName}
          </span>
        </div>

        {/* Product Title */}
        <h3 className="text-sm font-semibold text-[#0F172A] line-clamp-2 leading-snug group-hover:text-[#2563EB] transition-colors mb-1.5">
          {product.name}
        </h3>

        {displayLocation && (
          <div className="flex items-center gap-1 text-[11px] text-[#64748B] mb-3 truncate">
            <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
            <span className="truncate">{displayLocation}</span>
          </div>
        )}

        {/* Bottom Baseline Price + Quick Add */}
        <div className="mt-auto pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-[15px] sm:text-base font-bold text-[#0F172A] tabular-nums">
                {formatPrice(currentPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-[#64748B] line-through tabular-nums">
                  {formatPrice(basePrice)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : addedNotice
                ? 'bg-emerald-600 text-white'
                : 'bg-[#EFF6FF] hover:bg-[#2563EB] text-[#1D4ED8] hover:text-white active:scale-95'
            }`}
          >
            {addedNotice ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
