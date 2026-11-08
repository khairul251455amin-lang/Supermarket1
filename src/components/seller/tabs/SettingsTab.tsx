/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Lock,
  User,
  Bell,
  LogOut,
  Check,
  ShieldCheck,
  Store,
  ExternalLink,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';

export const SettingsTab: React.FC = () => {
  const {
    currentSeller,
    updateSellerShop,
    logoutSeller,
    navigateTo,
  } = useMarketplace();

  if (!currentSeller) return null;

  const [fullName, setFullName] = useState(currentSeller.fullName);
  const [phone, setPhone] = useState(currentSeller.phone);
  const [email, setEmail] = useState(currentSeller.email);

  const [orderNotifs, setOrderNotifs] = useState(
    currentSeller.notificationPreferences?.orderUpdates ?? true
  );
  const [msgNotifs, setMsgNotifs] = useState(
    currentSeller.notificationPreferences?.messages ?? true
  );
  const [stockNotifs, setStockNotifs] = useState(
    currentSeller.notificationPreferences?.lowStock ?? true
  );

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSellerShop({
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
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setFeedback('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback('Passwords do not match.');
      return;
    }

    setFeedback('Password updated in prototype session. (Ready for Firebase Auth updatePassword).');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Seller Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your merchant credentials, alerts and security preferences
          </p>
        </div>

        <button
          onClick={logoutSeller}
          className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of Seller Account</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Seller Credentials Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <span>Merchant Contact Details</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
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
                Email Address
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

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700">Notification Alerts</h4>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderNotifs}
                  onChange={(e) => setOrderNotifs(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Receive instant notifications for new incoming customer orders</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={msgNotifs}
                  onChange={(e) => setMsgNotifs(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Notify me when customers send inquiries about products</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stockNotifs}
                  onChange={(e) => setStockNotifs(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Alert me when product inventory falls below 5 units</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Save Details
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-600" />
          <span>Security & Authentication</span>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password (6+ characters)
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Firebase Authentication ready architecture
            </span>
            <button
              type="submit"
              disabled={!newPassword}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-xl shadow-xs"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
