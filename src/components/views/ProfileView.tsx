/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Settings,
  LogOut,
  Edit3,
  Check,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Address } from '../../types';
import { PhotoUploader } from '../common/PhotoUploader';
import { marketplaceConfig } from '../../config/marketplaceConfig';

export const ProfileView: React.FC = () => {
  const {
    user,
    logoutUser,
    updateUserProfile,
    orders,
    navigateTo,
  } = useMarketplace();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [photoUrl, setPhotoUrl] = useState(user?.profilePhoto || '');
  const [street, setStreet] = useState(user?.deliveryAddress?.street || '');
  const [city, setCity] = useState(user?.deliveryAddress?.city || '');
  const [postalCode, setPostalCode] = useState(user?.deliveryAddress?.postalCode || '');
  const [notificationPreference, setNotificationPreference] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-[#E2E8F0] shadow-xs max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
          <UserIcon className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">Sign In to Your Profile</h2>
        <p className="text-xs text-[#64748B] leading-relaxed max-w-md mx-auto">
          Create a customer profile or log in to manage your delivery address, track orders, and communicate with sellers.
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigateTo('auth')}
            className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs transition-colors cursor-pointer min-h-[44px]"
          >
            Sign In or Register
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedAddress: Address = {
      fullName: name.trim() || user.name,
      phone: phone.trim() || user.phoneNumber || '',
      street: street.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
    };

    try {
      await updateUserProfile({
        name: name.trim() || user.name,
        phoneNumber: phone.trim() || undefined,
        profilePhoto: photoUrl.trim() || undefined,
        deliveryAddress: street.trim() ? updatedAddress : undefined,
      });

      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Customer Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Manage your account credentials, shipping destination and preferences
          </p>
        </div>

        <button
          onClick={() => void logoutUser()}
          className="px-3.5 py-1.5 rounded-xl border border-[#E2E8F0] text-[#0F172A] hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile changes saved successfully.</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="w-18 h-18 rounded-2xl object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-18 h-18 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-2xl flex items-center justify-center border-2 border-white shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  Customer
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{user.email}</span>
              </div>
              {user.phoneNumber ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{user.phoneNumber}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic mt-0.5">No phone number provided</div>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Close Editor' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 pt-6 border-t border-slate-100 space-y-4"
          >
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Update Personal & Delivery Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Profile Photo (Optional)
              </label>
              <PhotoUploader
                label="Upload Profile Photo"
                sublabel="JPG, PNG, or WEBP • Auto-compressed"
                currentImageUrl={photoUrl}
                onImageUploaded={(res) => setPhotoUrl(res.dataUrl)}
                onImageRemoved={() => setPhotoUrl('')}
                aspectRatio="square"
              />
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-700 mb-2">Default Shipping Address</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Street Address, Apt / Suite"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Grid: Delivery Address Display & Account Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Address Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#0F172A]">Saved Delivery Address</h3>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-[#2563EB] font-semibold hover:underline cursor-pointer"
              >
                Edit
              </button>
            )}
          </div>

          {user.deliveryAddress?.street ? (
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] space-y-1">
              <div className="font-semibold text-[#0F172A]">
                {user.deliveryAddress.fullName || user.name}
              </div>
              <div>{user.deliveryAddress.street}</div>
              <div>
                {user.deliveryAddress.city} {user.deliveryAddress.postalCode}
              </div>
              <div className="text-[#64748B] mt-1">Phone: {user.deliveryAddress.phone || user.phoneNumber}</div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] text-xs text-[#64748B] text-center py-6">
              No delivery address saved yet. Click "Edit Profile" to add your primary shipping address.
            </div>
          )}
        </div>

        {/* Account Settings Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Account Settings</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <div>
                <div className="font-semibold text-slate-900">Order Updates & SMS</div>
                <div className="text-[11px] text-slate-500">Receive delivery notices via notification center</div>
              </div>
              <input
                type="checkbox"
                checked={notificationPreference}
                onChange={(e) => setNotificationPreference(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <div>
                <div className="font-semibold text-slate-900">Orders Placed</div>
                <div className="text-[11px] text-slate-500">Track current & past purchases</div>
              </div>
              <button
                onClick={() => navigateTo('orders')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View ({orders.length})
              </button>
            </div>

            {/* Merchant Access */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-200/80">
              <div>
                <div className="font-semibold text-blue-900">Merchant Seller Console</div>
                <div className="text-[11px] text-blue-700">
                  {user.isSeller
                    ? `Active Seller ID: ${user.sellerId}`
                    : `Sell products on ${marketplaceConfig.marketplaceName}`}
                </div>
              </div>
              <button
                onClick={() => navigateTo(user.isSeller ? 'seller-dashboard' : 'seller-register')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
              >
                {user.isSeller ? 'Dashboard' : 'Register Shop'}
              </button>
            </div>

            {/* Welcome & Account Experience */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <div>
                <div className="font-semibold text-slate-900">Marketplace Welcome & Purpose</div>
                <div className="text-[11px] text-slate-500">Return to the welcome screen or switch account purpose</div>
              </div>
              <button
                onClick={() => navigateTo('welcome')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Open Welcome
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
