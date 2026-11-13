/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Image as ImageIcon,
  Save,
  Truck,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { DeliveryMethod, ProductStatus } from '../../../types';
import { marketplaceConfig } from '../../../config/marketplaceConfig';
import { PhotoUploader } from '../../common/PhotoUploader';
import { uploadProductImage } from '../../../services/firebaseStorage';
import { formatFileSize } from '../../../services/imageCompression';

export const AddEditProductTab: React.FC = () => {
  const {
    currentSeller,
    sellerProducts,
    editingProductId,
    setEditingProductId,
    categories,
    addSellerProduct,
    updateSellerProduct,
    setSellerDashboardTab,
  } = useMarketplace();

  const existingProduct = editingProductId
    ? sellerProducts.find((p) => p.id === editingProductId) || null
    : null;

  const [name, setName] = useState(existingProduct?.name || '');
  const [category, setCategory] = useState(
    existingProduct?.category || categories[0]?.name || 'Clothing'
  );
  const [subcategory, setSubcategory] = useState(existingProduct?.subcategory || '');
  const [description, setDescription] = useState(existingProduct?.description || '');
  const [originalPrice, setOriginalPrice] = useState(
    existingProduct ? String(existingProduct.originalPrice) : ''
  );
  const [hasDiscount, setHasDiscount] = useState(
    Boolean(
      existingProduct &&
        typeof existingProduct.discountedPrice === 'number' &&
        existingProduct.discountedPrice < existingProduct.originalPrice
    )
  );
  const [discountedPrice, setDiscountedPrice] = useState(
    existingProduct?.discountedPrice ? String(existingProduct.discountedPrice) : ''
  );
  const [stock, setStock] = useState(
    existingProduct ? String(existingProduct.stockQuantity ?? existingProduct.stock) : '10'
  );
  const [searchKeywordsInput, setSearchKeywordsInput] = useState(
    existingProduct?.searchKeywords?.join(', ') || ''
  );
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryMethod[]>(
    existingProduct?.deliveryOptions || ['Seller Delivery', 'Supermarket Delivery']
  );

  // Exactly two product images required
  const [image1Url, setImage1Url] = useState<string>(existingProduct?.images?.[0] || '');
  const [image1Size, setImage1Size] = useState<string>('');
  const [image2Url, setImage2Url] = useState<string>(existingProduct?.images?.[1] || '');
  const [image2Size, setImage2Size] = useState<string>('');

  const [tempProductId] = useState(
    () =>
      existingProduct?.id ||
      `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-sync form if editingProductId changes while mounted
  useEffect(() => {
    const prod = editingProductId
      ? sellerProducts.find((p) => p.id === editingProductId) || null
      : null;

    if (prod) {
      setName(prod.name);
      setCategory(prod.category);
      setSubcategory(prod.subcategory || '');
      setDescription(prod.description || '');
      setOriginalPrice(String(prod.originalPrice));
      const disc =
        typeof prod.discountedPrice === 'number' && prod.discountedPrice < prod.originalPrice;
      setHasDiscount(disc);
      setDiscountedPrice(disc && prod.discountedPrice ? String(prod.discountedPrice) : '');
      setStock(String(prod.stockQuantity ?? prod.stock));
      setSearchKeywordsInput(prod.searchKeywords?.join(', ') || '');
      setDeliveryOptions(
        prod.deliveryOptions || ['Seller Delivery', 'Supermarket Delivery']
      );
      setImage1Url(prod.images?.[0] || '');
      setImage2Url(prod.images?.[1] || '');
    } else if (!editingProductId) {
      setName('');
      setCategory(categories[0]?.name || 'Clothing');
      setSubcategory('');
      setDescription('');
      setOriginalPrice('');
      setHasDiscount(false);
      setDiscountedPrice('');
      setStock('10');
      setSearchKeywordsInput('');
      setDeliveryOptions(['Seller Delivery', 'Supermarket Delivery']);
      setImage1Url('');
      setImage2Url('');
    }
    setImage1Size('');
    setImage2Size('');
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [editingProductId, sellerProducts, categories]);

  if (!currentSeller) return null;

  const isBothPhotosReady = Boolean(image1Url && image2Url);
  const isFormValid =
    name.trim().length > 0 &&
    parseFloat(originalPrice) > 0 &&
    parseInt(stock, 10) >= 0 &&
    isBothPhotosReady;

  const toggleDeliveryOption = (method: DeliveryMethod) => {
    setDeliveryOptions((prev) => {
      if (prev.includes(method)) {
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== method);
      }
      return [...prev, method];
    });
  };

  const handleSaveOrPublish = async (targetMode: 'publish' | 'draft' | 'pause') => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a product title.');
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
        setErrorMsg('Discount price must be lower than the original price.');
        return;
      }
      discPercentNum = Math.round(((origPriceNum - discPriceNum) / origPriceNum) * 100);
    }

    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setErrorMsg('Please enter a valid stock quantity.');
      return;
    }

    if (!image1Url || !image2Url) {
      setErrorMsg(
        'Requirement: Each product must have exactly two uploaded photos. Please upload both Product Image 1 and Product Image 2.'
      );
      return;
    }

    let resolvedStatus: ProductStatus;
    if (targetMode === 'draft') {
      resolvedStatus = 'draft';
    } else if (targetMode === 'pause') {
      resolvedStatus = 'paused';
    } else {
      resolvedStatus = stockNum > 0 ? 'published' : 'out_of_stock';
    }

    const keywords = searchKeywordsInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      if (existingProduct) {
        const res = await updateSellerProduct(existingProduct.id, {
          name: name.trim(),
          category,
          subcategory: subcategory.trim() || undefined,
          description: description.trim() || `${name.trim()} from ${currentSeller.shopName}.`,
          originalPrice: origPriceNum,
          discountedPrice: discPriceNum,
          discountPercentage: discPercentNum,
          price: discPriceNum ?? origPriceNum,
          stock: stockNum,
          stockQuantity: stockNum,
          images: [image1Url, image2Url],
          status: resolvedStatus,
          deliveryOptions,
          searchKeywords: keywords,
          isAvailable: resolvedStatus === 'published',
        });

        if (!res.success) {
          throw new Error(res.error || 'Failed to update product.');
        }

        setSuccessMsg(
          resolvedStatus === 'published'
            ? `"${name.trim()}" updated and published live on ${marketplaceConfig.marketplaceName}!`
            : `"${name.trim()}" saved with status: ${resolvedStatus}.`
        );
      } else {
        const created = await addSellerProduct({
          name: name.trim(),
          category,
          subcategory: subcategory.trim() || undefined,
          description: description.trim() || `${name.trim()} from ${currentSeller.shopName}.`,
          originalPrice: origPriceNum,
          discountedPrice: discPriceNum,
          discountPercentage: discPercentNum,
          stock: stockNum,
          images: [image1Url, image2Url],
          status: resolvedStatus,
          deliveryOptions,
          searchKeywords: keywords,
          isAvailable: resolvedStatus === 'published',
        });

        setSuccessMsg(
          resolvedStatus === 'published'
            ? `"${created.name}" published with 2 optimized photos! Immediately visible to customers and visitors.`
            : `"${created.name}" saved as Draft in your inventory.`
        );
      }

      setTimeout(() => {
        setEditingProductId(null);
        setSellerDashboardTab('products');
      }, 1000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSaveOrPublish('publish');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            {existingProduct ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            {existingProduct
              ? `Update details, stock, pricing, or publish status for "${existingProduct.name}"`
              : `Publish merchandise directly to ${marketplaceConfig.marketplaceName} with 2 optimized photos`}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-xs space-y-6"
      >
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Search Keywords (Optional, comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. citrus, organic, fresh juice, breakfast"
              value={searchKeywordsInput}
              onChange={(e) => setSearchKeywordsInput(e.target.value)}
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
                Original Price ({marketplaceConfig.currency.symbol}) *
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
                Stock Quantity *
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
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Has Promotional Discount
                </span>
              </label>
            </div>
          </div>

          {hasDiscount && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Promotional Discount Price</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Discounted Offer Price ({marketplaceConfig.currency.symbol}) *
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

        {/* Delivery Options */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Delivery Options</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {(['Seller Delivery', 'Supermarket Delivery'] as DeliveryMethod[]).map((method) => (
              <label
                key={method}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer ${
                  deliveryOptions.includes(method)
                    ? 'bg-blue-50/70 border-blue-300 text-slate-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={deliveryOptions.includes(method)}
                  onChange={() => toggleDeliveryOption(method)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>
                  {method === 'Supermarket Delivery'
                    ? marketplaceConfig.delivery.platformDeliveryLabel
                    : method}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Product Images: Exactly Two Required */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Required Product Photos</span>
              <span className="text-rose-500 font-bold">* (Exactly 2 Photos)</span>
            </h3>

            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                  isBothPhotosReady
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : image1Url || image2Url
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>
                  {image1Url && image2Url
                    ? '2 / 2 Photos Ready'
                    : image1Url || image2Url
                    ? '1 / 2 Photos Uploaded'
                    : '0 / 2 Photos Uploaded'}
                </span>
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Select photos from your Android gallery, file manager, or computer. Both photos are compressed automatically on your device to 50–200 KB (&le; 200 KB ceiling) so customers across all devices see crisp images instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Product Image 1 (Front / Primary)</span>
                {image1Url ? (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready {image1Size && `(${image1Size})`}
                  </span>
                ) : (
                  <span className="text-[11px] text-rose-500 font-semibold">Photo 1 Required</span>
                )}
              </div>
              <PhotoUploader
                label="Upload Product Image 1"
                sublabel="Primary catalog view • 50–200 KB"
                required
                currentImageUrl={image1Url}
                onImageUploaded={async (res, onProgress) => {
                  const storageResult = await uploadProductImage(
                    currentSeller.id,
                    tempProductId,
                    1,
                    res.blob,
                    res.format,
                    res.dataUrl,
                    onProgress
                  );
                  setImage1Url(storageResult.downloadUrl);
                  setImage1Size(formatFileSize(res.sizeBytes));
                }}
                onImageRemoved={() => {
                  setImage1Url('');
                  setImage1Size('');
                }}
                aspectRatio="standard"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Product Image 2 (Detail / Side Angle)</span>
                {image2Url ? (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready {image2Size && `(${image2Size})`}
                  </span>
                ) : (
                  <span className="text-[11px] text-rose-500 font-semibold">Photo 2 Required</span>
                )}
              </div>
              <PhotoUploader
                label="Upload Product Image 2"
                sublabel="Secondary detail view • 50–200 KB"
                required
                currentImageUrl={image2Url}
                onImageUploaded={async (res, onProgress) => {
                  const storageResult = await uploadProductImage(
                    currentSeller.id,
                    tempProductId,
                    2,
                    res.blob,
                    res.format,
                    res.dataUrl,
                    onProgress
                  );
                  setImage2Url(storageResult.downloadUrl);
                  setImage2Size(formatFileSize(res.sizeBytes));
                }}
                onImageRemoved={() => {
                  setImage2Url('');
                  setImage2Size('');
                }}
                aspectRatio="standard"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {!isBothPhotosReady ? (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Upload both Product Image 1 and 2 to enable saving or publishing
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Both photos optimized and ready!
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setEditingProductId(null);
                setSellerDashboardTab('products');
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!isFormValid || isSubmitting}
              onClick={() => void handleSaveOrPublish('draft')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer min-h-[42px]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save as Draft</span>
            </button>

            {existingProduct && existingProduct.status === 'published' && (
              <button
                type="button"
                disabled={!isFormValid || isSubmitting}
                onClick={() => void handleSaveOrPublish('pause')}
                className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 disabled:opacity-50 text-amber-900 font-semibold text-xs transition-all cursor-pointer min-h-[42px]"
              >
                Save & Pause
              </button>
            )}

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer min-h-[42px]"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : existingProduct
                  ? 'Save & Publish Live'
                  : `Publish to ${marketplaceConfig.marketplaceName}`}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
