/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  User,
  LogOut,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';

export const SettingsTab: React.FC = () => {
  const {
    currentSeller,
    updateSellerShop,
    updateSellerAuthPassword,
    logoutSeller,
  } = useMarketplace();

  const [fullName, setFullName] = useState(currentSeller?.fullName || '');
  const [phone, setPhone] = useState(currentSeller?.phone || '');
  const [email, setEmail] = useState(currentSeller?.email || '');

  const [orderNotifs, setOrderNotifs] = useState(
    currentSeller?.notificationPreferences?.orderUpdates ?? true
  );
  const [msgNotifs, setMsgNotifs] = useState(
    currentSeller?.notificationPreferences?.messages ?? true
  );
  const [stockNotifs, setStockNotifs] = useState(
    currentSeller?.notificationPreferences?.lowStock ?? true
  );

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  if (!currentSeller) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSavingProfile(true);
    try {
      await updateSellerShop({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notificationPreferences: {
          orderUpdates: orderNotifs,
          messages: msgNotifs,
          lowStock: stockNotifs,
        },
      });
      setFeedback('Profile and preferences updated.');
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsUpdatingPass(true);
    try {
      const res = await updateSellerAuthPassword(newPassword);
      if (res.success) {
        setFeedback('Account password updated securely.');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setErrorMsg(res.error || 'Failed to update password.');
      }
    } finally {
      setIsUpdatingPass(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Seller Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Manage your merchant credentials, alerts and security preferences
          </p>
        </div>

        <button
          onClick={() => void logoutSeller()}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of Seller Account</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-blue-200 text-xs font-medium text-[#1D4ED8] flex items-center gap-2">
          <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Seller Credentials Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xs space-y-5">
        <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-[#2563EB]" />
          <span>Merchant Contact Details</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
            <h4 className="text-xs font-semibold text-[#0F172A]">Notification Alerts</h4>
            <div className="space-y-2.5 text-xs text-[#64748B]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderNotifs}
                  onChange={(e) => setOrderNotifs(e.target.checked)}
                  className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>Receive instant notifications for new incoming customer orders</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={msgNotifs}
                  onChange={(e) => setMsgNotifs(e.target.checked)}
                  className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>Notify me when customers send inquiries about products</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stockNotifs}
                  onChange={(e) => setStockNotifs(e.target.checked)}
                  className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>Alert me when product inventory falls below 5 units</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              {isSavingProfile ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xs space-y-5">
        <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#2563EB]" />
          <span>Security & Authentication</span>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                New Password (6+ characters)
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-[#64748B]">
              Secured with Firebase Authentication
            </span>
            <button
              type="submit"
              disabled={!newPassword || isUpdatingPass}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#111827] disabled:opacity-40 rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              {isUpdatingPass ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
