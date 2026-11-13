/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShoppingBag,
  Store,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  Layers,
  MessageSquare,
  CheckCircle2,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';

export const WelcomeView: React.FC = () => {
  const {
    navigateTo,
    welcomeStep,
    setWelcomeStep,
    accountPurpose,
    setAccountPurpose,
    user,
    currentSeller,
  } = useMarketplace();

  return (
    <div className="py-6 sm:py-10 max-w-5xl mx-auto space-y-12">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* STEP 1: WELCOME HERO (First-Time Visitor Landing)             */}
      {/* ──────────────────────────────────────────────────────────── */}
      {welcomeStep === 'welcome' && (
        <div className="space-y-10">
          {/* Main Hero Card */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#1D4ED8] text-white p-8 sm:p-12 lg:p-14 shadow-xl border border-slate-800">
            <div className="relative z-10 max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 border border-white/15">
                <Store className="w-3.5 h-3.5" />
                <span>Multi-Vendor Commercial Marketplace</span>
              </div>

              {/* Exact user requested main heading */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] text-balance">
                Welcome to Supermarket
              </h1>

              {/* Exact user requested subtitle */}
              <p className="text-base sm:text-xl text-blue-100 font-medium leading-relaxed max-w-2xl">
                One marketplace. Multiple sellers. Everything you need in one place.
              </p>

              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                Explore a rich catalog of products from independent merchants, or launch your own shop with dedicated seller analytics, parcel fulfillment, and direct customer messaging.
              </p>

              {/* Primary Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                {/* Exact user requested button */}
                <button
                  onClick={() => setWelcomeStep('purpose')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-base shadow-lg transition-all active:scale-98 cursor-pointer group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigateTo('home')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-all active:scale-98 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-blue-300" />
                  <span>Browse as Guest</span>
                </button>
              </div>

              {/* Quick sign in for existing users */}
              <div className="pt-2 text-xs text-slate-300">
                Already registered?{' '}
                <button
                  onClick={() => {
                    setAccountPurpose('customer');
                    setWelcomeStep('action');
                  }}
                  className="text-blue-200 hover:text-white font-semibold underline underline-offset-4 cursor-pointer"
                >
                  Sign in to your account
                </button>
              </div>
            </div>
          </section>

          {/* Value Pillars Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[#0F172A]">For Customers</h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Discover curated clothing, electronics, daily fruits, gadgets, watches, and juice across multiple verified merchants under one checkout.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[#0F172A]">For Sellers</h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Register your shop, receive a permanent Seller ID, upload compressed dual-photo products, manage parcel delivery, and collect Cash on Delivery.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[#0F172A]">Verified & Safe</h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Enjoy transparent order tracking, Cash on Delivery verification, zero fake reviews or inflated prices, and direct merchant messaging.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* STEP 2: ACCOUNT PURPOSE SELECTION                           */}
      {/* ──────────────────────────────────────────────────────────── */}
      {welcomeStep === 'purpose' && (
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header & Back Button */}
          <div className="space-y-4 text-center">
            <div className="flex justify-start">
              <button
                onClick={() => setWelcomeStep('welcome')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Welcome</span>
              </button>
            </div>

            {/* Exact question requested */}
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              How would you like to use Supermarket?
            </h1>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              Select your primary experience. You can easily switch roles or maintain both account types at any time.
            </p>
          </div>

          {/* Two attractive selection cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Customer */}
            <div
              onClick={() => {
                setAccountPurpose('customer');
                setWelcomeStep('action');
              }}
              className={`relative rounded-2xl p-7 border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                accountPurpose === 'customer'
                  ? 'border-[#2563EB] bg-[#EFF6FF]/60 shadow-md ring-2 ring-[#2563EB]/10'
                  : 'border-[#E2E8F0] bg-white hover:border-[#2563EB] hover:shadow-md'
              }`}
            >
              <div className="space-y-5">
                <div className="w-13 h-13 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md">
                    Shopper Profile
                  </div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">I'm a Customer</h2>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    Discover products, explore shops, add items to your cart and shop from multiple sellers.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-[#64748B] pt-3 border-t border-[#E2E8F0]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Browse multi-vendor catalogs and categories</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Split checkout parcel tracking & Cash on Delivery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Direct chat conversations with store owners</span>
                  </li>
                </ul>
              </div>

              <div className="pt-7">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAccountPurpose('customer');
                    setWelcomeStep('action');
                  }}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                >
                  <span>Continue as Customer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card 2: Seller */}
            <div
              onClick={() => {
                setAccountPurpose('seller');
                setWelcomeStep('action');
              }}
              className={`relative rounded-2xl p-7 border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                accountPurpose === 'seller'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/10'
                  : 'border-[#E2E8F0] bg-white hover:border-emerald-500 hover:shadow-md'
              }`}
            >
              <div className="space-y-5">
                <div className="w-13 h-13 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <Store className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                    Merchant Portal
                  </div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">I'm a Seller</h2>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    Create your shop, upload products, manage orders and grow your business.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-[#64748B] pt-3 border-t border-[#E2E8F0]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Permanent Seller ID & immediate dashboard access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dual compressed photo upload (50–200 KB)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Fulfillment management & COD collection recording</span>
                  </li>
                </ul>
              </div>

              <div className="pt-7">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAccountPurpose('seller');
                    setWelcomeStep('action');
                  }}
                  className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                >
                  <span>Continue as Seller</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => navigateTo('home')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-4 cursor-pointer"
            >
              Skip for now and browse marketplace catalog as a guest
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* STEP 3: SIGN IN AND REGISTER OPTIONS                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      {welcomeStep === 'action' && (
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header & Back Button */}
          <div className="space-y-4 text-center">
            <div className="flex justify-start">
              <button
                onClick={() => setWelcomeStep('purpose')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Account Purpose</span>
              </button>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {accountPurpose === 'customer' ? (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Customer Experience Selected</span>
                </>
              ) : (
                <>
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Seller Portal Selected</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {accountPurpose === 'customer'
                ? 'Customer Sign In or Registration'
                : 'Seller Sign In or Registration'}
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {accountPurpose === 'customer'
                ? 'Sign in to access your orders and chats, or create a new customer account in seconds.'
                : 'Access your seller management console, or register a new shop with a permanent Seller ID.'}
            </p>
          </div>

          {/* Action Choice Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Action 1: Sign In */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  accountPurpose === 'customer'
                    ? 'bg-[#EFF6FF] text-[#2563EB]'
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <LogIn className="w-6 h-6" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-[#0F172A]">
                    {accountPurpose === 'customer' ? 'Customer Sign In' : 'Seller Sign In'}
                  </h2>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {accountPurpose === 'customer'
                      ? 'Already have a customer account? Sign in to view order tracking, delivery addresses, and saved items.'
                      : 'Already have a registered shop? Sign in using your email, phone, or Seller ID to view your dashboard.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (accountPurpose === 'customer') {
                    navigateTo('auth', { authMode: 'login' });
                  } else {
                    navigateTo('seller-register', { authMode: 'login' });
                  }
                }}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                  accountPurpose === 'customer'
                    ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <span>{accountPurpose === 'customer' ? 'Customer Sign In' : 'Seller Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Action 2: Create Account / Register */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  accountPurpose === 'customer'
                    ? 'bg-[#EFF6FF] text-[#2563EB]'
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <UserPlus className="w-6 h-6" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-[#0F172A]">
                    {accountPurpose === 'customer' ? 'Customer Registration' : 'Seller Registration'}
                  </h2>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {accountPurpose === 'customer'
                      ? 'New to Supermarket? Create an account to place orders with Cash on Delivery and message store owners.'
                      : 'Ready to sell? Create your shop, upload your logo, get an immediate Seller ID and launch your storefront.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (accountPurpose === 'customer') {
                    navigateTo('auth', { authMode: 'register' });
                  } else {
                    navigateTo('seller-register', { authMode: 'register' });
                  }
                }}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer bg-[#0F172A] hover:bg-[#1E293B] text-white"
              >
                <span>{accountPurpose === 'customer' ? 'Customer Registration' : 'Seller Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick account switch info */}
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#64748B] text-center space-y-1">
            <p className="font-semibold text-[#0F172A]">
              Note on Multi-Vendor Accounts:
            </p>
            <p>
              Supermarket allows a single person to have both a Customer Account and a Seller Account. You can switch between them at any time from the navigation bar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
