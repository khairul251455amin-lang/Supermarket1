/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, ShoppingCart, Check, PackageX } from 'lucide-react';
import { Product } from '../../types';
import { useMarketplace } from '../../context/MarketplaceContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigateTo, addToCart, toggleFavourite, isFavourite } = useMarketplace();
  const [imageError, setImageError] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  const isSaved = isFavourite(product.id);
  const isOutOfStock = product.stock <= 0;
  const hasDiscount =
    typeof product.discountedPrice === 'number' &&
    product.discountedPrice < product.originalPrice;

  const currentPrice = hasDiscount ? product.discountedPrice! : product.originalPrice;
  const displayDiscountPercent =
    product.discountPercentage ??
    (hasDiscount
      ? Math.round(((product.originalPrice - product.discountedPrice!) / product.originalPrice) * 100)
      : null);

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

  return (
    <div
      onClick={() => navigateTo('product', { productId: product.id })}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Product Image Area with Dual Photo Gallery */}
      <div 
        className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden"
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
            className="w-full h-full object-cover group-hover:scale-103 transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
            <PackageX className="w-8 h-8 mb-1" />
            <span className="text-xs font-medium text-slate-500">Image unavailable</span>
          </div>
        )}

        {/* Dual Photo Dot Switcher Indicator */}
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
                className={`transition-all rounded-full ${
                  activePhotoIdx === pIdx
                    ? 'w-4 h-1.5 bg-blue-600 shadow-sm'
                    : 'w-1.5 h-1.5 bg-white/80 hover:bg-white shadow-xs'
                }`}
              />
            ))}
          </div>
        )}

        {/* Top Badges: Discount or Stock */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {hasDiscount && displayDiscountPercent !== null && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-600 text-white shadow-xs">
              {displayDiscountPercent}% OFF
            </span>
          )}
          {isOutOfStock ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-900/80 text-white backdrop-blur-xs">
              Out of stock
            </span>
          ) : product.stock <= 5 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-600 text-white shadow-xs">
              Only {product.stock} left
            </span>
          ) : null}
        </div>

        {/* Favourite Button */}
        <button
          type="button"
          aria-label={isSaved ? 'Remove from favourites' : 'Add to favourites'}
          onClick={handleToggleFav}
          className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
            isSaved
              ? 'bg-rose-50 text-rose-600 shadow-sm'
              : 'bg-white/80 text-slate-600 hover:text-rose-600 hover:bg-white shadow-xs'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${isSaved ? 'fill-rose-600 scale-110' : ''}`}
          />
        </button>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Unboxed Metadata: Category & Seller */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 truncate">
          <span className="font-medium text-blue-700">{product.category}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate" title={product.sellerName}>
            {product.sellerName}
          </span>
        </div>

        {/* Product Title */}
        <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors mb-2">
          {product.name}
        </h4>

        {/* Price & Action Row */}
        <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900 tabular-nums">
                ${currentPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through tabular-nums">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              ID: {product.sellerId}
            </div>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : addedNotice
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95'
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
    </div>
  );
};
