/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Copy,
  ExternalLink,
  Check,
  Power,
  Edit3,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { PhotoUploader } from '../../common/PhotoUploader';
import { uploadShopLogo } from '../../../services/firebaseStorage';

export const MyShopTab: React.FC = () => {
  const {
    currentSeller,
    updateSellerShop,
    toggleShopOpenStatus,
    navigateTo,
  } = useMarketplace();

  if (!currentSeller) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [shopName, setShopName] = useState(currentSeller.shopName);
  const [shopLocation, setShopLocation] = useState(currentSeller.shopLocation);
  const [phone, setPhone] = useState(currentSeller.phone);
  const [email, setEmail] = useState(currentSeller.email);
  const [shopDescription, setShopDescription] = useState(currentSeller.shopDescription);
  const [shopLogo, setShopLogo] = useState(currentSeller.shopLogo || '');

  const [copiedLink, setCopiedLink] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !phone.trim() || !shopLocation.trim()) return;

    updateSellerShop({
      shopName: shopName.trim(),
      shopLocation: shopLocation.trim(),
      phone: phone.trim(),
      email: email.trim(),
      shopDescription: shopDescription.trim(),
      shopLogo: shopLogo.trim() || undefined,
    });

    setIsEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}#shop/${currentSeller.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {
      // Fallback
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header and Quick Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {currentSeller.shopLogo ? (
              <img
                src={currentSeller.shopLogo}
                alt={currentSeller.shopName}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-2xl flex items-center justify-center border border-blue-200 shadow-xs">
                {currentSeller.shopName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{currentSeller.shopName}</h1>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    currentSeller.isOpen
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {currentSeller.isOpen ? 'Shop Open' : 'Shop Closed'}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {currentSeller.shopLocation}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-mono text-slate-700 font-medium">
                  ID: {currentSeller.id}
                </span>
              </div>
            </div>
          </div>

          {/* Action cluster */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleShopOpenStatus}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px] ${
                currentSeller.isOpen
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{currentSeller.isOpen ? 'Close Temporarily' : 'Open Shop'}</span>
            </button>

            <button
              onClick={() => navigateTo('shop', { sellerId: currentSeller.id })}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Preview</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Shop'}</span>
            </button>
          </div>
        </div>

        {savedNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Shop details updated successfully.</span>
          </div>
        )}

        {/* Permanent Seller ID Notice */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-slate-900">
              Permanent Seller ID: <span className="font-mono text-blue-700">{currentSeller.id}</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              This ID is permanent and cannot be modified. Customers and delivery couriers use this ID to identify your packages.
            </p>
          </div>
        </div>

        {/* Shop Info Display / Editor */}
        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Storefront Profile
              </h3>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Information</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="p-3.5 rounded-xl bg-slate-50">
                <span className="text-slate-400 block mb-0.5 text-[11px]">Primary Contact</span>
                <span className="font-semibold text-slate-900">{currentSeller.fullName}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50">
                <span className="text-slate-400 block mb-0.5 text-[11px]">Dispatch Location</span>
                <span className="font-semibold text-slate-900">{currentSeller.shopLocation}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50">
                <span className="text-slate-400 block mb-0.5 text-[11px]">Vendor Phone</span>
                <span className="font-semibold text-slate-900">{currentSeller.phone}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50">
                <span className="text-slate-400 block mb-0.5 text-[11px]">Vendor Email</span>
                <span className="font-semibold text-slate-900">{currentSeller.email}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">About the Shop</span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed p-4 rounded-xl bg-slate-50 border border-slate-100 whitespace-pre-line">
                {currentSeller.shopDescription}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Edit Shop Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop Location / City *
                </label>
                <input
                  type="text"
                  required
                  value={shopLocation}
                  onChange={(e) => setShopLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Shop Logo (Exactly 1 Photo)
              </label>
              <PhotoUploader
                label="Upload Shop Logo"
                sublabel="Select from Android gallery or computer • Auto-compressed 50–200 KB"
                currentImageUrl={shopLogo}
                onImageUploaded={async (res, onProgress) => {
                  const uploadResult = await uploadShopLogo(
                    currentSeller.id,
                    res.blob,
                    res.format,
                    res.dataUrl,
                    onProgress
                  );
                  setShopLogo(uploadResult.downloadUrl);
                }}
                onImageRemoved={() => {
                  setShopLogo('');
                }}
                aspectRatio="square"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop Description
              </label>
              <textarea
                rows={3}
                value={shopDescription}
                onChange={(e) => setShopDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Save Shop Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
