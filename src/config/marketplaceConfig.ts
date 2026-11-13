/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MARKETPLACE_CATEGORIES } from '../data/categories';
import { Category } from '../types';

export type MarketplaceNicheType =
  | 'general'
  | 'grocery'
  | 'electronics'
  | 'clothing'
  | 'local';

export interface MarketplaceConfig {
  marketplaceName: string;
  marketplaceTagline: string;
  marketplaceDescription: string;
  nicheType: MarketplaceNicheType;
  logoText: string;
  logoUrl?: string;
  theme: {
    primaryHex: string;
    accentHex: string;
    brandClass: string;
  };
  currency: {
    code: string;
    symbol: string;
    locale: string;
  };
  contact: {
    supportEmail: string;
    supportPhone: string;
    cityHub: string;
  };
  delivery: {
    sellerDeliveryLabel: string;
    platformDeliveryLabel: string;
    standardFee: number;
    freeShippingThreshold: number;
  };
  business: {
    legalEntityName: string;
    copyrightYear: number;
    termsLabel: string;
    privacyLabel: string;
  };
  announcementBar: {
    enabled: boolean;
    text: string;
  };
  categories: Category[];
}

const nameFromEnv = import.meta.env.VITE_MARKETPLACE_NAME?.trim() || 'Supermarket';
const currencyCodeFromEnv = import.meta.env.VITE_CURRENCY_CODE?.trim() || 'USD';
const currencySymbolFromEnv = import.meta.env.VITE_CURRENCY_SYMBOL?.trim() || '$';
const announcementFromEnv =
  import.meta.env.VITE_ANNOUNCEMENT_TEXT?.trim() ||
  'Discover local sellers • Easy shopping • Cash on Delivery';

export const marketplaceConfig: MarketplaceConfig = {
  marketplaceName: nameFromEnv,
  marketplaceTagline: 'Everything you need. All in one marketplace.',
  marketplaceDescription:
    'A commercial multi-vendor marketplace connecting independent sellers and local shops directly with customers.',
  nicheType: 'general',
  logoText: nameFromEnv,
  theme: {
    primaryHex: '#2563EB',
    accentHex: '#1D4ED8',
    brandClass: 'blue-600',
  },
  currency: {
    code: currencyCodeFromEnv,
    symbol: currencySymbolFromEnv,
    locale: 'en-US',
  },
  contact: {
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL?.trim() || 'support@supermarket.app',
    supportPhone: import.meta.env.VITE_SUPPORT_PHONE?.trim() || '+1 (555) 010-2026',
    cityHub: import.meta.env.VITE_MARKETPLACE_HUB?.trim() || 'Central Marketplace Hub',
  },
  delivery: {
    sellerDeliveryLabel: 'Seller Delivery',
    platformDeliveryLabel: `${nameFromEnv} Delivery`,
    standardFee: Number(import.meta.env.VITE_STANDARD_DELIVERY_FEE) || 5,
    freeShippingThreshold: Number(import.meta.env.VITE_FREE_DELIVERY_THRESHOLD) || 50,
  },
  business: {
    legalEntityName: `${nameFromEnv}`,
    copyrightYear: 2026,
    termsLabel: 'Terms',
    privacyLabel: 'Privacy',
  },
  announcementBar: {
    enabled: import.meta.env.VITE_SHOW_ANNOUNCEMENT_BAR !== 'false',
    text: announcementFromEnv,
  },
  categories: MARKETPLACE_CATEGORIES,
};

export function formatPrice(amount: number, currencySymbol?: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const symbol = currencySymbol || marketplaceConfig.currency.symbol;
  return `${symbol}${safeAmount.toFixed(2)}`;
}
