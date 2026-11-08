/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Package,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { PhotoUploader } from '../../common/PhotoUploader';
import { uploadProductImage } from '../../../services/firebaseStorage';

export const AddEditProductTab: React.FC = () => {
  const {
    currentSeller,
    categories,
    addSellerProduct,
    setSellerDashboardTab,
  } = useMarketplace();

  if (!currentSeller) return null;

  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Clothing');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [isAvailable, setIsAvailable] = useState(true);

  // Exactly two product images required per prompt specification
  const [image1Url, setImage1Url] = useState<string>('');
  const [image2Url, setImage2Url] = useState<string>('');
  const [tempProductId] = useState(() => `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a product name.');
      return;
    }

    const origPriceNum = parseFloat(originalPrice);
    if (isNaN(origPriceNum) || origPriceNum <= 0) {
      setErrorMsg('Original price must be greater than zero.');
      return;
    }

    let discPriceNum: number | undefined = undefined;
    let discPercentNum: number | undefined = undefined;

    if (hasDiscount) {
      discPriceNum = parseFloat(discountedPrice);
      if (isNaN(discPriceNum) || discPriceNum <= 0) {
        setErrorMsg('Please specify a valid discount price.');
        return;
      }
      if (discPriceNum >= origPriceNum) {
        setErrorMsg('Discount price must be less than the original price.');
        return;
      }
      discPercentNum = Math.round(((origPriceNum - discPriceNum) / origPriceNum) * 100);
    }

    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setErrorMsg('Please enter a valid stock quantity.');
      return;
    }

    // Require exactly two product images before publishing
    if (!image1Url || !image2Url) {
      setErrorMsg('Requirement: Each product must have exactly two uploaded photos. Please upload both Product Image 1 and Product Image 2 before publishing.');
      return;
    }

    const published = addSellerProduct({
      name: name.trim(),
      category,
      subcategory: subcategory.trim() || undefined,
      description: description.trim() || `${name.trim()} from ${currentSeller.shopName}.`,
      originalPrice: origPriceNum,
      discountedPrice: discPriceNum,
      discountPercentage: discPercentNum,
      stock: stockNum,
      images: [image1Url, image2Url],
      isAvailable,
    });

    setSuccessMsg(`"${published.name}" published with 2 optimized photos! Immediately live on customer website.`);
    setTimeout(() => {
      setSellerDashboardTab('products');
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Add New Product
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Publish merchandise directly to the Supermarket customer catalog with 2 optimized photos
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            General Information
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Organic Valencia Orange Juice 1L"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subcategory (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Fresh Drinks, Citrus"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Description
            </label>
            <textarea
              rows={3}
              placeholder="Provide a clear, helpful description of specifications, materials, freshness, or size..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Pricing and Stock */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Pricing & Inventory
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Original Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="24.99"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Stock Units *
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="10"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 min-h-[42px]">
                <input
                  type="checkbox"
                  checked={hasDiscount}
                  onChange={(e) => {
                    setHasDiscount(e.target.checked);
                    if (!e.target.checked) setDiscountedPrice('');
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800">Has Promotional Discount</span>
              </label>
            </div>
          </div>

          {hasDiscount && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Genuine Discount Specification</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Discounted Offer Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required={hasDiscount}
                  placeholder="19.99 (Must be lower than Original Price)"
                  value={discountedPrice}
                  onChange={(e) => setDiscountedPrice(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-amber-300 bg-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Product Images: Exactly Two Required */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Required Product Photos</span>
              <span className="text-rose-500 font-bold">* (Exactly 2 Photos)</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Compressed client-side to 50–200 KB &le; 200 KB maximum
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Select photos from your Android gallery, file manager, or computer. Both photos are compressed automatically before uploading to Firebase Storage (<code className="font-mono text-[11px] bg-blue-100/80 px-1 py-0.5 rounded">products/{currentSeller.id}/{tempProductId}/...</code>).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Image 1 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Product Image 1 (Front / Primary)</span>
                {image1Url ? (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                ) : (
                  <span className="text-[11px] text-rose-500 font-semibold">Required</span>
                )}
              </div>
              <PhotoUploader
                label="Upload Product Image 1"
                sublabel="Primary catalog view • 50–200 KB"
                required
                currentImageUrl={image1Url}
                onImageUploaded={async (res) => {
                  const storageResult = await uploadProductImage(
                    currentSeller.id,
                    tempProductId,
                    1,
                    res.blob,
                    res.format,
                    res.dataUrl
                  );
                  setImage1Url(storageResult.downloadUrl);
                }}
                onImageRemoved={() => setImage1Url('')}
                aspectRatio="standard"
              />
            </div>

            {/* Image 2 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Product Image 2 (Detail / Side Angle)</span>
                {image2Url ? (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                ) : (
                  <span className="text-[11px] text-rose-500 font-semibold">Required</span>
                )}
              </div>
              <PhotoUploader
                label="Upload Product Image 2"
                sublabel="Secondary detail view • 50–200 KB"
                required
                currentImageUrl={image2Url}
                onImageUploaded={async (res) => {
                  const storageResult = await uploadProductImage(
                    currentSeller.id,
                    tempProductId,
                    2,
                    res.blob,
                    res.format,
                    res.dataUrl
                  );
                  setImage2Url(storageResult.downloadUrl);
                }}
                onImageRemoved={() => setImage2Url('')}
                aspectRatio="standard"
              />
            </div>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900">Publish Immediately</div>
            <div className="text-[11px] text-slate-500">Makes the product instantly active in customer search</div>
          </div>
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setSellerDashboardTab('products')}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!image1Url || !image2Url}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Product to Supermarket</span>
          </button>
        </div>
      </form>
    </div>
  );
};
