/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lock, LogIn, UserPlus, X } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { marketplaceConfig } from '../../config/marketplaceConfig';

export const AuthRequiredModal: React.FC = () => {
  const { authGate, closeAuthGate, navigateTo } = useMarketplace();

  if (!authGate.isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 sm:p-8 space-y-5">
        <button
          type="button"
          onClick={closeAuthGate}
          aria-label="Close dialog"
          className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h2 id="auth-gate-title" className="text-xl font-bold text-[#0F172A] tracking-tight">
            Sign in required
          </h2>
          <p className="text-sm text-[#64748B] leading-relaxed">
            {authGate.message || 'Please sign in or create an account to continue.'}
          </p>
          <p className="text-xs text-slate-400">
            Browsing products and viewing shops on {marketplaceConfig.marketplaceName} is open to everyone without an account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              closeAuthGate();
              navigateTo('auth', { authMode: 'login' });
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeAuthGate();
              navigateTo('auth', { authMode: 'register' });
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-[#0F172A] hover:bg-[#111827] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={closeAuthGate}
            className="text-xs font-medium text-[#64748B] hover:text-[#0F172A] cursor-pointer"
          >
            Continue browsing as visitor
          </button>
        </div>
      </div>
    </div>
  );
};
