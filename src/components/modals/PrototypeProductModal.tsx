/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, RotateCcw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { PhotoUploader } from '../common/PhotoUploader';

export const PrototypeProductModal: React.FC = () => {
  const {
    isSandboxModalOpen,
    setIsSandboxModalOpen,
    addPrototypeProduct,
    resetAllMarketplaceData,
    categories,
    navigateTo,
  } = useMarketplace();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Clothing');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('49.99');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState('39.99');
  const [stock, setStock] = useState('15');
  const [sellerName, setSellerName] = useState('Apex Goods Co.');
  const [sellerId, setSellerId] = useState('VEND-401');
  const [sellerLocation, setSellerLocation] = useState('Central District');
  const [image1Url, setImage1Url] = useState('');
  const [image2Url, setImage2Url] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isRecommended, setIsRecommended] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isSandboxModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage('Please enter a product name.');
      return;
    }

    const origPriceNum = parseFloat(originalPrice);
    if (isNaN(origPriceNum) || origPriceNum <= 0) {
      setStatusMessage('Please enter a valid original price.');
      return;
    }

    let discPriceNum: number | undefined = undefined;
    let discPercentNum: number | undefined = undefined;

    if (hasDiscount) {
      discPriceNum = parseFloat(discountedPrice);
      if (isNaN(discPriceNum) || discPriceNum <= 0 || discPriceNum >= origPriceNum) {
        setStatusMessage('Discounted price must be greater than zero and lower than the original price.');
        return;
      }
      discPercentNum = Math.round(((origPriceNum - discPriceNum) / origPriceNum) * 100);
    }

    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setStatusMessage('Please enter a valid stock quantity.');
      return;
    }

    if (!image1Url || !image2Url) {
      setStatusMessage('Requirement: Please upload both Product Image 1 and Product Image 2 (50–200 KB auto-compressed).');
      return;
    }

    const createdProduct = addPrototypeProduct({
      name: name.trim(),
      category,
      description: description.trim() || `${name.trim()} offered by ${sellerName.trim()}. Tested in Phase 1 customer marketplace.`,
      originalPrice: origPriceNum,
      discountedPrice: discPriceNum,
      discountPercentage: discPercentNum,
      stock: stockNum,
      sellerName: sellerName.trim() || 'Verified Vendor',
      sellerId: sellerId.trim() || 'VEND-001',
      sellerLocation: sellerLocation.trim() || 'Marketplace Hub',
      images: [image1Url, image2Url],
      isFeatured,
      isRecommended,
    });

    setStatusMessage(`Success: Added "${createdProduct.name}" to the marketplace.`);
    setTimeout(() => {
      setIsSandboxModalOpen(false);
      setStatusMessage(null);
      setName('');
      navigateTo('product', { productId: createdProduct.id });
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('Reset all marketplace data back to completely empty?')) {
      resetAllMarketplaceData();
      setStatusMessage('All data reset to 100% empty.');
      setTimeout(() => {
        setIsSandboxModalOpen(false);
        setStatusMessage(null);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Prototype Testing Tools</h3>
              <p className="text-xs text-slate-500">Marketplace starts empty. Add a real test product to test full customer flows.</p>
            </div>
          </div>
          <button
            onClick={() => setIsSandboxModalOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {statusMessage && (
          <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-100 text-xs text-blue-800 flex items-center gap-2">
            {statusMessage.startsWith('Success') ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Organic Valencia Oranges (1kg) or Classic Chronograph Watch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
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
                Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Original Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Enable Discount?
                </label>
                <input
                  type="checkbox"
                  checked={hasDiscount}
                  onChange={(e) => setHasDiscount(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
              <input
                type="number"
                step="0.01"
                min="0.1"
                disabled={!hasDiscount}
                placeholder="Discounted $"
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border ${
                  hasDiscount
                    ? 'border-slate-200 focus:outline-none focus:border-blue-500'
                    : 'border-slate-100 bg-slate-50 text-slate-400'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seller Name
              </label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seller ID
              </label>
              <input
                type="text"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Description
            </label>
            <textarea
              rows={2}
              placeholder="Detailed description, specifications, and provenance."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Two Required Photos */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Product Photos * (Exactly 2 Photos)
              </label>
              <span className="text-[10px] text-slate-500 font-medium">50–200 KB auto-compressed</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PhotoUploader
                label="Upload Product Image 1"
                sublabel="Primary Photo • 50–200 KB"
                required
                currentImageUrl={image1Url}
                onImageUploaded={(res) => setImage1Url(res.downloadUrl)}
                onImageRemoved={() => setImage1Url('')}
                aspectRatio="standard"
              />
              <PhotoUploader
                label="Upload Product Image 2"
                sublabel="Detail Photo • 50–200 KB"
                required
                currentImageUrl={image2Url}
                onImageUploaded={(res) => setImage2Url(res.downloadUrl)}
                onImageRemoved={() => setImage2Url('')}
                aspectRatio="standard"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-700 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Featured Section</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecommended}
                onChange={(e) => setIsRecommended(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Recommended Section</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5 min-h-[40px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Marketplace to Empty</span>
            </button>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Marketplace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
