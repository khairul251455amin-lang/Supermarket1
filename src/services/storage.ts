/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Product,
  CartItem,
  Order,
  User,
  SellerAccount,
  SellerFulfilmentOrder,
  Conversation,
  Message,
  Notification,
} from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'supermarket_products',
  CART: 'supermarket_cart',
  FAVOURITES: 'supermarket_favourites',
  ORDERS: 'supermarket_orders',
  USER: 'supermarket_user',
  SELLER_ACCOUNTS: 'supermarket_seller_accounts',
  CURRENT_SELLER: 'supermarket_current_seller',
  SELLER_ORDERS: 'supermarket_seller_orders',
  CONVERSATIONS: 'supermarket_conversations',
  MESSAGES: 'supermarket_messages',
  NOTIFICATIONS: 'supermarket_notifications',
};

// Safe localStorage JSON parser
function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`Error reading key ${key} from storage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key} to storage:`, err);
  }
}

export const StorageService = {
  // Products - starts strictly empty: []
  getProducts: (): Product[] => {
    return safeGet<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  },
  saveProducts: (products: Product[]): void => {
    safeSet(STORAGE_KEYS.PRODUCTS, products);
  },
  addProduct: (product: Product): Product[] => {
    const existing = StorageService.getProducts();
    const updated = [product, ...existing];
    StorageService.saveProducts(updated);
    return updated;
  },

  // Cart - starts strictly empty: []
  getCart: (): CartItem[] => {
    return safeGet<CartItem[]>(STORAGE_KEYS.CART, []);
  },
  saveCart: (cart: CartItem[]): void => {
    safeSet(STORAGE_KEYS.CART, cart);
  },

  // Favourites - starts strictly empty: []
  getFavourites: (): string[] => {
    return safeGet<string[]>(STORAGE_KEYS.FAVOURITES, []);
  },
  saveFavourites: (favourites: string[]): void => {
    safeSet(STORAGE_KEYS.FAVOURITES, favourites);
  },

  // Customer Parent Orders - starts strictly empty: []
  getOrders: (): Order[] => {
    return safeGet<Order[]>(STORAGE_KEYS.ORDERS, []);
  },
  saveOrders: (orders: Order[]): void => {
    safeSet(STORAGE_KEYS.ORDERS, orders);
  },
  addOrder: (order: Order): Order[] => {
    const existing = StorageService.getOrders();
    const updated = [order, ...existing];
    StorageService.saveOrders(updated);
    return updated;
  },

  // Seller Accounts - starts strictly empty: []
  getSellerAccounts: (): SellerAccount[] => {
    return safeGet<SellerAccount[]>(STORAGE_KEYS.SELLER_ACCOUNTS, []);
  },
  saveSellerAccounts: (accounts: SellerAccount[]): void => {
    safeSet(STORAGE_KEYS.SELLER_ACCOUNTS, accounts);
  },

  // Currently Active Seller Profile
  getCurrentSeller: (): SellerAccount | null => {
    return safeGet<SellerAccount | null>(STORAGE_KEYS.CURRENT_SELLER, null);
  },
  saveCurrentSeller: (seller: SellerAccount | null): void => {
    safeSet(STORAGE_KEYS.CURRENT_SELLER, seller);
  },

  // Seller Fulfilment Orders - starts strictly empty: []
  getSellerOrders: (): SellerFulfilmentOrder[] => {
    return safeGet<SellerFulfilmentOrder[]>(STORAGE_KEYS.SELLER_ORDERS, []);
  },
  saveSellerOrders: (orders: SellerFulfilmentOrder[]): void => {
    safeSet(STORAGE_KEYS.SELLER_ORDERS, orders);
  },

  // Customer User Auth & Profile - starts null
  getUser: (): User | null => {
    return safeGet<User | null>(STORAGE_KEYS.USER, null);
  },
  saveUser: (user: User | null): void => {
    safeSet(STORAGE_KEYS.USER, user);
  },

  // Conversations & Messages - starts empty
  getConversations: (): Conversation[] => {
    return safeGet<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
  },
  saveConversations: (conversations: Conversation[]): void => {
    safeSet(STORAGE_KEYS.CONVERSATIONS, conversations);
  },
  getMessages: (): Record<string, Message[]> => {
    return safeGet<Record<string, Message[]>>(STORAGE_KEYS.MESSAGES, {});
  },
  saveMessages: (messages: Record<string, Message[]>): void => {
    safeSet(STORAGE_KEYS.MESSAGES, messages);
  },

  // Notifications - starts strictly empty: []
  getNotifications: (): Notification[] => {
    return safeGet<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },
  saveNotifications: (notifications: Notification[]): void => {
    safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  // Reset entire marketplace state back to 100% empty
  clearAllState: (): void => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
};
