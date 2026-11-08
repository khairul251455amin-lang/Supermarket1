/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Product,
  Category,
  CartItem,
  Order,
  OrderStatus,
  User,
  Address,
  SellerAccount,
  SellerFulfilmentOrder,
  DeliveryMethod,
  SellerDashboardTab,
  Conversation,
  Message,
  Notification,
  AppView,
  ProductReference,
} from '../types';
import { MARKETPLACE_CATEGORIES } from '../data/categories';
import { StorageService } from '../services/storage';

interface NavigationParams {
  productId?: string;
  categorySlug?: string;
  sellerId?: string;
  searchQuery?: string;
  conversationId?: string;
  sellerTab?: SellerDashboardTab;
  authMode?: 'login' | 'register';
  welcomeStep?: 'welcome' | 'purpose' | 'action';
  accountPurpose?: 'customer' | 'seller';
}

interface MarketplaceContextType {
  // Navigation & View
  currentView: AppView;
  previousView: AppView | null;
  selectedProductId: string | null;
  selectedCategorySlug: string | null;
  selectedSellerId: string | null;
  selectedConversationId: string | null;
  sellerDashboardTab: SellerDashboardTab;
  setSellerDashboardTab: (tab: SellerDashboardTab) => void;
  navigateTo: (view: AppView, params?: NavigationParams) => void;
  goBack: () => void;

  // Welcome & Auth routing state
  authInitialMode: 'login' | 'register';
  setAuthInitialMode: (mode: 'login' | 'register') => void;
  welcomeStep: 'welcome' | 'purpose' | 'action';
  setWelcomeStep: (step: 'welcome' | 'purpose' | 'action') => void;
  accountPurpose: 'customer' | 'seller';
  setAccountPurpose: (purpose: 'customer' | 'seller') => void;

  // Search & Filtering State
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategoryFilter: string | null;
  setActiveCategoryFilter: (category: string | null) => void;
  activeSellerFilter: string | null;
  setActiveSellerFilter: (seller: string | null) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  sortBy: 'price-low' | 'price-high' | 'newest';
  setSortBy: (sort: 'price-low' | 'price-high' | 'newest') => void;
  resetFilters: () => void;

  // Data Collections
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  favourites: string[];
  orders: Order[];
  sellerOrders: SellerFulfilmentOrder[];
  user: User | null;
  sellerAccounts: SellerAccount[];
  currentSeller: SellerAccount | null;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  notifications: Notification[];

  // Computed Values
  cartCount: number;
  cartSubtotal: number;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  unreadSellerNotificationsCount: number;
  unreadSellerMessagesCount: number;

  // Cart Operations
  addToCart: (product: Product, quantity?: number) => { success: boolean; message: string };
  updateCartQuantity: (productId: string, quantity: number) => { success: boolean; message: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Favourite Operations
  toggleFavourite: (productId: string) => void;
  isFavourite: (productId: string) => boolean;
  removeFavourite: (productId: string) => void;

  // Customer Order Operations
  placeOrder: (
    deliveryAddress: Address,
    deliveryMethodBySeller?: Record<string, DeliveryMethod>,
    notes?: string
  ) => { success: boolean; orderId?: string; error?: string };
  cancelOrder: (orderId: string) => boolean;

  // Seller Order Management
  updateSellerOrderStatus: (
    sellerOrderId: string,
    newStatus: OrderStatus,
    reason?: string
  ) => boolean;
  recordSellerCodCollection: (sellerOrderId: string) => boolean;
  markSupermarketPickupReady: (sellerOrderId: string) => boolean;

  // Customer Auth & Profile Operations
  registerUser: (
    name: string,
    email: string,
    password: string,
    phone?: string,
    address?: Address
  ) => Promise<{ success: boolean; error?: string }>;
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  updateUserProfile: (data: Partial<User>) => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;

  // Seller Auth & Account Operations
  registerSeller: (data: {
    fullName: string;
    shopName: string;
    phone: string;
    email: string;
    shopLocation: string;
    shopDescription: string;
    shopLogo?: string;
    password?: string;
  }) => Promise<{ success: boolean; sellerId?: string; error?: string }>;
  loginSeller: (emailOrPhone: string, passwordOrId?: string) => Promise<{ success: boolean; error?: string }>;
  logoutSeller: () => void;
  updateSellerShop: (data: Partial<SellerAccount>) => void;
  toggleShopOpenStatus: () => void;

  // Product Management (Seller & Marketplace)
  addSellerProduct: (
    productData: Omit<Product, 'id' | 'createdAt' | 'sellerId' | 'sellerName' | 'sellerLocation'>
  ) => Product;
  updateSellerProduct: (productId: string, data: Partial<Product>) => { success: boolean; error?: string };
  deleteSellerProduct: (productId: string) => { success: boolean; error?: string };
  toggleProductAvailability: (productId: string) => void;
  moderateProduct: (productId: string, reason: string, hide: boolean) => void;

  // Messaging Operations
  startConversation: (
    sellerId: string,
    sellerName: string,
    productRef?: ProductReference,
    initialMessage?: string,
    orderRef?: { id: string; total: number }
  ) => string;
  sendMessage: (
    conversationId: string,
    text: string,
    asSender?: 'customer' | 'seller'
  ) => void;

  // Notifications Operations
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Prototype Sandbox Utilities
  isSandboxModalOpen: boolean;
  setIsSandboxModalOpen: (open: boolean) => void;
  addPrototypeProduct: (productData: Omit<Product, 'id' | 'createdAt'>) => Product;
  resetAllMarketplaceData: () => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation
  const [currentView, setCurrentView] = useState<AppView>(() => {
    // If a seller is already logged in, open seller dashboard
    const existingSeller = StorageService.getCurrentSeller();
    if (existingSeller) return 'seller-dashboard';
    // If a customer user is already logged in, open customer home
    const existingUser = StorageService.getUser();
    if (existingUser) return 'home';
    // Professional welcome experience for visitors opening Supermarket
    return 'welcome';
  });
  const [previousView, setPreviousView] = useState<AppView | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [sellerDashboardTab, setSellerDashboardTab] = useState<SellerDashboardTab>('overview');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [welcomeStep, setWelcomeStep] = useState<'welcome' | 'purpose' | 'action'>('welcome');
  const [accountPurpose, setAccountPurpose] = useState<'customer' | 'seller'>('customer');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [activeSellerFilter, setActiveSellerFilter] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'newest'>('newest');

  // Core Data Collections (Starts completely empty)
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [categories] = useState<Category[]>(MARKETPLACE_CATEGORIES);
  const [cart, setCart] = useState<CartItem[]>(() => StorageService.getCart());
  const [favourites, setFavourites] = useState<string[]>(() => StorageService.getFavourites());
  const [orders, setOrders] = useState<Order[]>(() => StorageService.getOrders());
  const [sellerOrders, setSellerOrders] = useState<SellerFulfilmentOrder[]>(() =>
    StorageService.getSellerOrders()
  );
  const [user, setUser] = useState<User | null>(() => StorageService.getUser());
  const [sellerAccounts, setSellerAccounts] = useState<SellerAccount[]>(() =>
    StorageService.getSellerAccounts()
  );
  const [currentSeller, setCurrentSeller] = useState<SellerAccount | null>(() =>
    StorageService.getCurrentSeller()
  );
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    StorageService.getConversations()
  );
  const [messages, setMessages] = useState<Record<string, Message[]>>(() =>
    StorageService.getMessages()
  );
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    StorageService.getNotifications()
  );

  // Prototype Modal
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState<boolean>(false);

  // Persistence effects
  useEffect(() => {
    StorageService.saveProducts(products);
  }, [products]);

  useEffect(() => {
    StorageService.saveCart(cart);
  }, [cart]);

  useEffect(() => {
    StorageService.saveFavourites(favourites);
  }, [favourites]);

  useEffect(() => {
    StorageService.saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    StorageService.saveSellerOrders(sellerOrders);
  }, [sellerOrders]);

  useEffect(() => {
    StorageService.saveUser(user);
  }, [user]);

  useEffect(() => {
    StorageService.saveSellerAccounts(sellerAccounts);
  }, [sellerAccounts]);

  useEffect(() => {
    StorageService.saveCurrentSeller(currentSeller);
  }, [currentSeller]);

  useEffect(() => {
    StorageService.saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    StorageService.saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    StorageService.saveNotifications(notifications);
  }, [notifications]);

  // Navigation handlers
  const navigateTo = (view: AppView, params?: NavigationParams) => {
    setPreviousView(currentView);
    setCurrentView(view);

    if (params?.productId !== undefined) setSelectedProductId(params.productId);
    if (params?.categorySlug !== undefined) setSelectedCategorySlug(params.categorySlug);
    if (params?.sellerId !== undefined) setSelectedSellerId(params.sellerId);
    if (params?.conversationId !== undefined) setSelectedConversationId(params.conversationId);
    if (params?.searchQuery !== undefined) setSearchQuery(params.searchQuery);
    if (params?.sellerTab !== undefined) setSellerDashboardTab(params.sellerTab);
    if (params?.authMode !== undefined) setAuthInitialMode(params.authMode);
    if (params?.welcomeStep !== undefined) setWelcomeStep(params.welcomeStep);
    if (params?.accountPurpose !== undefined) setAccountPurpose(params.accountPurpose);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (previousView) {
      setCurrentView(previousView);
      setPreviousView(null);
    } else {
      setCurrentView(user || currentSeller ? 'home' : 'welcome');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategoryFilter(null);
    setActiveSellerFilter(null);
    setPriceRange([0, 10000]);
    setSortBy('newest');
  };

  // Computed metrics
  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = item.product.discountedPrice ?? item.product.originalPrice;
      return acc + price * item.quantity;
    }, 0);
  }, [cart]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead && !n.sellerId).length;
  }, [notifications]);

  const unreadMessagesCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  const unreadSellerNotificationsCount = useMemo(() => {
    if (!currentSeller) return 0;
    return notifications.filter((n) => !n.isRead && n.sellerId === currentSeller.id).length;
  }, [notifications, currentSeller]);

  const unreadSellerMessagesCount = useMemo(() => {
    if (!currentSeller) return 0;
    return conversations
      .filter((c) => c.sellerId === currentSeller.id)
      .reduce((acc, c) => acc + (c.unreadBySellerCount || 0), 0);
  }, [conversations, currentSeller]);

  // Cart operations
  const addToCart = (product: Product, quantity = 1): { success: boolean; message: string } => {
    if (product.stock <= 0) {
      return { success: false, message: 'Sorry, this product is currently out of stock.' };
    }
    if (product.isAvailable === false || product.isRemovedByModeration) {
      return { success: false, message: 'This product is currently unavailable.' };
    }

    const existingIndex = cart.findIndex((item) => item.productId === product.id);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      const newQty = currentQty + quantity;

      if (newQty > product.stock) {
        return {
          success: false,
          message: `Cannot add more. You have ${currentQty} in cart, and available stock is ${product.stock}.`,
        };
      }

      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: newQty,
      };
      setCart(updatedCart);
      return { success: true, message: `Added ${quantity} more to your cart.` };
    } else {
      if (quantity > product.stock) {
        return {
          success: false,
          message: `Cannot add ${quantity} items. Only ${product.stock} available.`,
        };
      }

      setCart([...cart, { productId: product.id, quantity, product }]);
      return { success: true, message: `Added "${product.name}" to your cart.` };
    }
  };

  const updateCartQuantity = (
    productId: string,
    quantity: number
  ): { success: boolean; message: string } => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true, message: 'Item removed from cart.' };
    }

    const existing = cart.find((item) => item.productId === productId);
    if (!existing) {
      return { success: false, message: 'Item not found in cart.' };
    }

    if (quantity > existing.product.stock) {
      return {
        success: false,
        message: `Maximum available stock is ${existing.product.stock}.`,
      };
    }

    const updated = cart.map((item) => (item.productId === productId ? { ...item, quantity } : item));
    setCart(updated);
    return { success: true, message: 'Cart updated.' };
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Favourites
  const toggleFavourite = (productId: string) => {
    if (favourites.includes(productId)) {
      setFavourites(favourites.filter((id) => id !== productId));
    } else {
      setFavourites([...favourites, productId]);
    }
  };

  const isFavourite = (productId: string): boolean => {
    return favourites.includes(productId);
  };

  const removeFavourite = (productId: string) => {
    setFavourites(favourites.filter((id) => id !== productId));
  };

  // Customer Order Operations with Multi-Seller Support (Phase 2 Requirement 8, 9, 10)
  const placeOrder = (
    deliveryAddress: Address,
    deliveryMethodBySeller?: Record<string, DeliveryMethod>,
    notes?: string
  ): { success: boolean; orderId?: string; error?: string } => {
    if (cart.length === 0) {
      return { success: false, error: 'Shopping cart is empty.' };
    }

    // Verify stock availability
    for (const item of cart) {
      if (item.quantity > item.product.stock) {
        return {
          success: false,
          error: `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}`,
        };
      }
    }

    const parentOrderId = `ORD-${Date.now().toString().slice(-6)}`;
    const subtotal = cartSubtotal;

    // Group items by seller
    const itemsBySeller = cart.reduce((acc, item) => {
      const sId = item.product.sellerId || 'unknown-seller';
      if (!acc[sId]) {
        acc[sId] = {
          sellerId: sId,
          sellerName: item.product.sellerName,
          items: [],
        };
      }
      acc[sId].items.push(item);
      return acc;
    }, {} as Record<string, { sellerId: string; sellerName: string; items: CartItem[] }>);

    const sellerCount = Object.keys(itemsBySeller).length;
    // Standard delivery calculation: $5 per seller parcel, or free if seller subtotal > $50
    let totalDeliveryFee = 0;
    const newSellerFulfilmentOrders: SellerFulfilmentOrder[] = [];
    const newNotifications: Notification[] = [];

    Object.values(itemsBySeller).forEach((sellerGroup, idx) => {
      const sellerSub = sellerGroup.items.reduce((s, it) => {
        const pr = it.product.discountedPrice ?? it.product.originalPrice;
        return s + pr * it.quantity;
      }, 0);

      const chosenMethod =
        deliveryMethodBySeller?.[sellerGroup.sellerId] || 'Seller Delivery';
      const parcelDeliveryFee = sellerSub > 50 ? 0 : 5;
      totalDeliveryFee += parcelDeliveryFee;

      const sellerOrderItems = sellerGroup.items.map((it) => ({
        productId: it.productId,
        productName: it.product.name,
        sellerName: it.product.sellerName,
        sellerId: it.product.sellerId,
        quantity: it.quantity,
        unitPrice: it.product.discountedPrice ?? it.product.originalPrice,
        total: (it.product.discountedPrice ?? it.product.originalPrice) * it.quantity,
        image: it.product.images[0],
      }));

      const sellerOrderId = `SO-${parentOrderId.replace('ORD-', '')}-${sellerGroup.sellerId.slice(-4)}-${idx + 1}`;

      const sOrder: SellerFulfilmentOrder = {
        id: sellerOrderId,
        parentOrderId,
        sellerId: sellerGroup.sellerId,
        sellerName: sellerGroup.sellerName,
        customerName: deliveryAddress.fullName,
        customerPhone: deliveryAddress.phone,
        deliveryAddress,
        deliveryMethod: chosenMethod,
        deliveryFee: parcelDeliveryFee,
        items: sellerOrderItems,
        subtotal: sellerSub,
        total: sellerSub + parcelDeliveryFee,
        status: 'Pending',
        paymentMethod: 'Cash on Delivery',
        codCollected: false,
        readyForPickup: false,
        createdAt: new Date().toISOString(),
        notes,
      };

      newSellerFulfilmentOrders.push(sOrder);

      // Create seller notification
      newNotifications.push({
        id: `notif-seller-${Date.now()}-${sellerGroup.sellerId}`,
        title: 'New Order Received',
        message: `Order #${sellerOrderId} received from ${deliveryAddress.fullName}. Total: $${(sellerSub + parcelDeliveryFee).toFixed(2)} (${chosenMethod}).`,
        type: 'order',
        isRead: false,
        createdAt: new Date().toISOString(),
        sellerId: sellerGroup.sellerId,
        linkView: 'seller-orders',
        linkId: sellerOrderId,
      });
    });

    const total = subtotal + totalDeliveryFee;

    const allOrderItems = cart.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      sellerName: item.product.sellerName,
      sellerId: item.product.sellerId,
      quantity: item.quantity,
      unitPrice: item.product.discountedPrice ?? item.product.originalPrice,
      total: (item.product.discountedPrice ?? item.product.originalPrice) * item.quantity,
      image: item.product.images[0],
    }));

    const parentOrder: Order = {
      id: parentOrderId,
      customerId: user ? user.id : 'guest-cust',
      customerName: deliveryAddress.fullName,
      customerPhone: deliveryAddress.phone,
      deliveryAddress,
      items: allOrderItems,
      subtotal,
      deliveryFee: totalDeliveryFee,
      total,
      paymentMethod: 'Cash on Delivery',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      isSimulated: true,
      notes,
      sellerOrders: newSellerFulfilmentOrders,
      deliveryMethodBySeller,
    };

    // Deduct stock in products
    const updatedProducts = products.map((prod) => {
      const cartItem = cart.find((c) => c.productId === prod.id);
      if (cartItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartItem.quantity),
        };
      }
      return prod;
    });

    setProducts(updatedProducts);
    setOrders([parentOrder, ...orders]);
    setSellerOrders([...newSellerFulfilmentOrders, ...sellerOrders]);
    setCart([]);

    // Create Customer Notification
    const customerNotification: Notification = {
      id: `notif-${Date.now()}`,
      title: 'Order Placed (Simulated)',
      message: `Your order #${parentOrderId} across ${sellerCount} seller(s) for $${total.toFixed(2)} has been placed via Cash on Delivery.`,
      type: 'order',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkView: 'orders',
      linkId: parentOrderId,
    };

    setNotifications([customerNotification, ...newNotifications, ...notifications]);

    return { success: true, orderId: parentOrderId };
  };

  const cancelOrder = (orderId: string): boolean => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing || existing.status !== 'Pending') {
      return false;
    }

    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: 'Cancelled' as OrderStatus } : o));
    setOrders(updated);

    // Cancel related seller orders
    const updatedSellerOrders = sellerOrders.map((so) =>
      so.parentOrderId === orderId ? { ...so, status: 'Cancelled' as OrderStatus, rejectionReason: 'Cancelled by customer' } : so
    );
    setSellerOrders(updatedSellerOrders);

    // Restore stock
    const restoredProducts = products.map((prod) => {
      const orderItem = existing.items.find((item) => item.productId === prod.id);
      if (orderItem) {
        return {
          ...prod,
          stock: prod.stock + orderItem.quantity,
        };
      }
      return prod;
    });
    setProducts(restoredProducts);

    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      title: 'Order Cancelled',
      message: `Order #${orderId} has been cancelled.`,
      type: 'order',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkView: 'orders',
      linkId: orderId,
    };
    setNotifications([newNotif, ...notifications]);

    return true;
  };

  // Seller Order Fulfilment Actions (Phase 2 Requirement 8, 9)
  const updateSellerOrderStatus = (
    sellerOrderId: string,
    newStatus: OrderStatus,
    reason?: string
  ): boolean => {
    const existing = sellerOrders.find((so) => so.id === sellerOrderId);
    if (!existing) return false;

    const updatedSO = sellerOrders.map((so) => {
      if (so.id === sellerOrderId) {
        return {
          ...so,
          status: newStatus,
          rejectionReason: reason || so.rejectionReason,
          updatedAt: new Date().toISOString(),
        };
      }
      return so;
    });

    setSellerOrders(updatedSO);

    // If cancelled, restore stock for this seller's items
    if (newStatus === 'Cancelled') {
      const restoredProducts = products.map((prod) => {
        const item = existing.items.find((it) => it.productId === prod.id);
        if (item) {
          return { ...prod, stock: prod.stock + item.quantity };
        }
        return prod;
      });
      setProducts(restoredProducts);
    }

    // Update parent order status representation
    const parent = orders.find((o) => o.id === existing.parentOrderId);
    if (parent) {
      const updatedOrders = orders.map((o) => {
        if (o.id === parent.id) {
          return {
            ...o,
            status: newStatus,
          };
        }
        return o;
      });
      setOrders(updatedOrders);
    }

    // Send customer notification
    const customerNotif: Notification = {
      id: `notif-cust-${Date.now()}`,
      title: `Order Status: ${newStatus}`,
      message: `Your package #${sellerOrderId} from ${existing.sellerName} is now ${newStatus}.${
        reason ? ` Note: ${reason}` : ''
      }`,
      type: 'order',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkView: 'orders',
      linkId: existing.parentOrderId,
    };

    setNotifications([customerNotif, ...notifications]);
    return true;
  };

  const recordSellerCodCollection = (sellerOrderId: string): boolean => {
    const existing = sellerOrders.find((so) => so.id === sellerOrderId);
    if (!existing) return false;

    const updated = sellerOrders.map((so) =>
      so.id === sellerOrderId
        ? {
            ...so,
            codCollected: true,
            status: 'Delivered' as OrderStatus,
            updatedAt: new Date().toISOString(),
          }
        : so
    );
    setSellerOrders(updated);

    const notif: Notification = {
      id: `notif-cod-${Date.now()}`,
      title: 'Payment Received',
      message: `Cash on Delivery for order #${sellerOrderId} ($${existing.total.toFixed(2)}) recorded as collected.`,
      type: 'order',
      isRead: false,
      createdAt: new Date().toISOString(),
      sellerId: existing.sellerId,
    };
    setNotifications([notif, ...notifications]);
    return true;
  };

  const markSupermarketPickupReady = (sellerOrderId: string): boolean => {
    const existing = sellerOrders.find((so) => so.id === sellerOrderId);
    if (!existing) return false;

    const updated = sellerOrders.map((so) =>
      so.id === sellerOrderId
        ? {
            ...so,
            readyForPickup: true,
            status: 'Ready for Delivery' as OrderStatus,
            deliveryPersonAssigned: 'Supermarket Express Logistics (Partner Dispatch)',
            updatedAt: new Date().toISOString(),
          }
        : so
    );
    setSellerOrders(updated);

    const notif: Notification = {
      id: `notif-pickup-${Date.now()}`,
      title: 'Supermarket Courier Assigned',
      message: `Order #${sellerOrderId} marked ready for pickup. Supermarket courier partner assigned for transit.`,
      type: 'order',
      isRead: false,
      createdAt: new Date().toISOString(),
      sellerId: existing.sellerId,
    };
    setNotifications([notif, ...notifications]);
    return true;
  };

  // Customer Auth
  const registerUser = async (
    name: string,
    email: string,
    _password: string,
    phone?: string,
    address?: Address
  ): Promise<{ success: boolean; error?: string }> => {
    if (!name.trim() || !email.trim()) {
      return { success: false, error: 'Name and email are required.' };
    }

    const newUser: User = {
      id: `user-${Date.now().toString().slice(-5)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phone?.trim(),
      deliveryAddress: address,
      createdAt: new Date().toISOString(),
    };

    setUser(newUser);
    return { success: true };
  };

  const loginUser = async (email: string, _password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email.trim()) {
      return { success: false, error: 'Email is required.' };
    }

    const existingUser = StorageService.getUser();
    if (existingUser && existingUser.email === email.trim().toLowerCase()) {
      setUser(existingUser);
      return { success: true };
    }

    const sessionUser: User = {
      id: `user-${Date.now().toString().slice(-5)}`,
      name: email.split('@')[0],
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    };
    setUser(sessionUser);
    return { success: true };
  };

  const logoutUser = () => {
    setUser(null);
    setCurrentView('welcome');
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
  };

  const requestPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!email.trim() || !email.includes('@')) {
      return { success: false, message: 'Please provide a valid email address.' };
    }
    return {
      success: true,
      message: `Password reset link simulated for ${email}. In production with Firebase Auth, a secure reset token is emailed.`,
    };
  };

  // Seller Auth & Registration (Phase 2 Requirement 3)
  const registerSeller = async (data: {
    fullName: string;
    shopName: string;
    phone: string;
    email: string;
    shopLocation: string;
    shopDescription: string;
    shopLogo?: string;
    password?: string;
  }): Promise<{ success: boolean; sellerId?: string; error?: string }> => {
    if (!data.fullName.trim() || !data.shopName.trim() || !data.phone.trim()) {
      return { success: false, error: 'Full name, shop name, and phone number are required.' };
    }

    // Check duplicate seller by email or phone
    const existingByEmail = sellerAccounts.find(
      (s) => s.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    if (existingByEmail && data.email.trim()) {
      return { success: false, error: 'A seller account with this email address already exists.' };
    }

    const existingByPhone = sellerAccounts.find(
      (s) => s.phone.trim() === data.phone.trim()
    );
    if (existingByPhone) {
      return { success: false, error: 'A seller account with this phone number already exists.' };
    }

    // Generate permanent unique Seller ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const sellerId = `SELL-${randomSuffix}`;

    const newSeller: SellerAccount = {
      id: sellerId,
      userId: user?.id,
      fullName: data.fullName.trim(),
      shopName: data.shopName.trim(),
      phone: data.phone.trim(),
      email: data.email.trim().toLowerCase(),
      shopLocation: data.shopLocation.trim() || 'Central Marketplace',
      shopDescription: data.shopDescription.trim() || `${data.shopName} official storefront on Supermarket.`,
      shopLogo: data.shopLogo?.trim() || undefined,
      isOpen: true,
      createdAt: new Date().toISOString(),
      notificationPreferences: {
        orderUpdates: true,
        messages: true,
        lowStock: true,
      },
    };

    const updatedSellers = [newSeller, ...sellerAccounts];
    setSellerAccounts(updatedSellers);
    setCurrentSeller(newSeller);

    // If customer user exists, link seller ID
    if (user) {
      setUser({ ...user, isSeller: true, sellerId });
    }

    // Add welcoming notification
    const welcomeNotif: Notification = {
      id: `notif-welcome-${sellerId}`,
      title: 'Seller Account Activated',
      message: `Welcome to Supermarket! Your shop "${newSeller.shopName}" is now active with Seller ID: ${sellerId}. You can start adding products immediately.`,
      type: 'seller',
      isRead: false,
      createdAt: new Date().toISOString(),
      sellerId,
    };
    setNotifications([welcomeNotif, ...notifications]);

    // Give immediate access to Seller Dashboard
    setCurrentView('seller-dashboard');
    setSellerDashboardTab('overview');

    return { success: true, sellerId };
  };

  const loginSeller = async (
    emailOrPhone: string,
    _passwordOrId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const clean = emailOrPhone.trim().toLowerCase();
    const found = sellerAccounts.find(
      (s) =>
        s.email.toLowerCase() === clean ||
        s.phone.trim() === clean ||
        s.id.toLowerCase() === clean
    );

    if (!found) {
      return { success: false, error: 'Seller account not found. Please register your shop first.' };
    }

    setCurrentSeller(found);
    setCurrentView('seller-dashboard');
    setSellerDashboardTab('overview');
    return { success: true };
  };

  const logoutSeller = () => {
    setCurrentSeller(null);
    setCurrentView('welcome');
  };

  const updateSellerShop = (data: Partial<SellerAccount>) => {
    if (!currentSeller) return;

    // Prevent modifying permanent Seller ID
    const { id: _ignoreId, ...allowedUpdates } = data;

    const updatedSeller: SellerAccount = {
      ...currentSeller,
      ...allowedUpdates,
    };

    setCurrentSeller(updatedSeller);
    setSellerAccounts(
      sellerAccounts.map((s) => (s.id === currentSeller.id ? updatedSeller : s))
    );

    // Update shop name and location on existing products
    if (allowedUpdates.shopName || allowedUpdates.shopLocation) {
      setProducts(
        products.map((p) => {
          if (p.sellerId === currentSeller.id) {
            return {
              ...p,
              sellerName: allowedUpdates.shopName || p.sellerName,
              sellerLocation: allowedUpdates.shopLocation || p.sellerLocation,
            };
          }
          return p;
        })
      );
    }
  };

  const toggleShopOpenStatus = () => {
    if (!currentSeller) return;
    updateSellerShop({ isOpen: !currentSeller.isOpen });
  };

  // Product Management (Phase 2 Requirement 7)
  const addSellerProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'sellerId' | 'sellerName' | 'sellerLocation'>
  ): Product => {
    if (!currentSeller) {
      throw new Error('Must be signed in as a seller to add products.');
    }

    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      sellerId: currentSeller.id,
      sellerName: currentSeller.shopName,
      sellerLocation: currentSeller.shopLocation,
      isAvailable: productData.isAvailable ?? true,
      createdAt: new Date().toISOString(),
    };

    // Immediately available on customer website!
    const updated = [newProduct, ...products];
    setProducts(updated);

    // Notify seller
    const notif: Notification = {
      id: `notif-prod-${newProduct.id}`,
      title: 'Product Published',
      message: `"${newProduct.name}" is now live on the Supermarket customer marketplace.`,
      type: 'seller',
      isRead: false,
      createdAt: new Date().toISOString(),
      sellerId: currentSeller.id,
      linkView: 'product',
      linkId: newProduct.id,
    };
    setNotifications([notif, ...notifications]);

    return newProduct;
  };

  const updateSellerProduct = (
    productId: string,
    data: Partial<Product>
  ): { success: boolean; error?: string } => {
    const existing = products.find((p) => p.id === productId);
    if (!existing) return { success: false, error: 'Product not found.' };

    if (currentSeller && existing.sellerId !== currentSeller.id) {
      return { success: false, error: 'You are not authorized to edit this product.' };
    }

    const updatedProduct = { ...existing, ...data };
    setProducts(products.map((p) => (p.id === productId ? updatedProduct : p)));

    // Check low stock alert
    if (typeof data.stock === 'number' && data.stock <= 5 && data.stock > 0) {
      const lowStockNotif: Notification = {
        id: `notif-stock-${productId}`,
        title: 'Low Stock Alert',
        message: `Stock for "${existing.name}" is down to ${data.stock} units. Consider replenishing.`,
        type: 'low_stock',
        isRead: false,
        createdAt: new Date().toISOString(),
        sellerId: existing.sellerId,
        linkView: 'seller-products',
        linkId: productId,
      };
      setNotifications([lowStockNotif, ...notifications]);
    }

    return { success: true };
  };

  const deleteSellerProduct = (productId: string): { success: boolean; error?: string } => {
    const existing = products.find((p) => p.id === productId);
    if (!existing) return { success: false, error: 'Product not found.' };

    if (currentSeller && existing.sellerId !== currentSeller.id) {
      return { success: false, error: 'You are not authorized to delete this product.' };
    }

    setProducts(products.filter((p) => p.id !== productId));
    return { success: true };
  };

  const toggleProductAvailability = (productId: string) => {
    const existing = products.find((p) => p.id === productId);
    if (!existing) return;
    updateSellerProduct(productId, { isAvailable: existing.isAvailable === false });
  };

  const moderateProduct = (productId: string, reason: string, hide: boolean) => {
    const existing = products.find((p) => p.id === productId);
    if (!existing) return;

    setProducts(
      products.map((p) =>
        p.id === productId
          ? {
              ...p,
              isRemovedByModeration: hide,
              moderationReason: reason,
              isAvailable: !hide,
            }
          : p
      )
    );

    // Notify seller of moderation action
    const notif: Notification = {
      id: `notif-mod-${productId}`,
      title: hide ? 'Product Prohibited & Hidden' : 'Product Moderation Restored',
      message: `Your product "${existing.name}" was ${
        hide ? 'hidden by marketplace moderation' : 'restored'
      }. Reason: ${reason}`,
      type: 'moderation',
      isRead: false,
      createdAt: new Date().toISOString(),
      sellerId: existing.sellerId,
    };
    setNotifications([notif, ...notifications]);
  };

  // Messaging (supports customer <-> seller communication)
  const startConversation = (
    sellerId: string,
    sellerName: string,
    productRef?: ProductReference,
    initialMessage?: string,
    orderRef?: { id: string; total: number }
  ): string => {
    const existing = conversations.find(
      (c) => c.sellerId === sellerId && (!productRef || c.productRef?.id === productRef.id)
    );

    let conversationId: string;

    if (existing) {
      conversationId = existing.id;
    } else {
      conversationId = `conv-${Date.now()}`;
      const newConv: Conversation = {
        id: conversationId,
        sellerId,
        sellerName,
        customerId: user?.id || 'guest',
        customerName: user?.name || 'Customer',
        lastMessageText: initialMessage || 'Conversation started',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        unreadBySellerCount: initialMessage ? 1 : 0,
        productRef,
        orderRef,
      };
      setConversations([newConv, ...conversations]);
    }

    if (initialMessage?.trim()) {
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        conversationId,
        sender: 'customer',
        senderName: user ? user.name : 'Customer',
        text: initialMessage.trim(),
        createdAt: new Date().toISOString(),
        productRef,
        orderRef,
      };

      const existingMsgs = messages[conversationId] || [];
      setMessages({
        ...messages,
        [conversationId]: [...existingMsgs, newMsg],
      });

      // Seller notification
      const sellerNotif: Notification = {
        id: `notif-msg-${Date.now()}`,
        title: 'New Customer Inquiry',
        message: `${user?.name || 'A customer'} sent a message regarding ${
          productRef ? `"${productRef.name}"` : 'your shop'
        }.`,
        type: 'message',
        isRead: false,
        createdAt: new Date().toISOString(),
        sellerId,
        linkView: 'seller-messages',
        linkId: conversationId,
      };
      setNotifications([sellerNotif, ...notifications]);
    }

    setSelectedConversationId(conversationId);
    return conversationId;
  };

  const sendMessage = (
    conversationId: string,
    text: string,
    asSender: 'customer' | 'seller' = 'customer'
  ) => {
    if (!text.trim()) return;

    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const senderName =
      asSender === 'seller'
        ? currentSeller?.shopName || 'Seller'
        : user?.name || 'Customer';

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      sender: asSender,
      senderName,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      productRef: conv.productRef,
      orderRef: conv.orderRef,
    };

    const existingMsgs = messages[conversationId] || [];
    setMessages({
      ...messages,
      [conversationId]: [...existingMsgs, newMsg],
    });

    const updatedConvs = conversations.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            lastMessageText: text.trim(),
            lastMessageTime: new Date().toISOString(),
            unreadCount: asSender === 'seller' ? c.unreadCount + 1 : c.unreadCount,
            unreadBySellerCount: asSender === 'customer' ? (c.unreadBySellerCount || 0) + 1 : 0,
          }
        : c
    );
    setConversations(updatedConvs);

    // Notify counterpart
    if (asSender === 'seller') {
      const custNotif: Notification = {
        id: `notif-reply-${Date.now()}`,
        title: `Reply from ${conv.sellerName}`,
        message: text.trim().slice(0, 120),
        type: 'message',
        isRead: false,
        createdAt: new Date().toISOString(),
        linkView: 'messages',
        linkId: conversationId,
      };
      setNotifications([custNotif, ...notifications]);
    } else {
      const sNotif: Notification = {
        id: `notif-sreply-${Date.now()}`,
        title: `Message from ${conv.customerName || 'Customer'}`,
        message: text.trim().slice(0, 120),
        type: 'message',
        isRead: false,
        createdAt: new Date().toISOString(),
        sellerId: conv.sellerId,
        linkView: 'seller-messages',
        linkId: conversationId,
      };
      setNotifications([sNotif, ...notifications]);
    }
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Prototype Sandbox Utilities
  const addPrototypeProduct = (productData: Omit<Product, 'id' | 'createdAt'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      isAvailable: productData.isAvailable ?? true,
      createdAt: new Date().toISOString(),
    };
    const updated = [newProduct, ...products];
    setProducts(updated);
    return newProduct;
  };

  const resetAllMarketplaceData = () => {
    StorageService.clearAllState();
    setProducts([]);
    setCart([]);
    setFavourites([]);
    setOrders([]);
    setSellerOrders([]);
    setUser(null);
    setSellerAccounts([]);
    setCurrentSeller(null);
    setConversations([]);
    setMessages({});
    setNotifications([]);
    setCurrentView('home');
  };

  return (
    <MarketplaceContext.Provider
      value={{
        currentView,
        previousView,
        selectedProductId,
        selectedCategorySlug,
        selectedSellerId,
        selectedConversationId,
        sellerDashboardTab,
        setSellerDashboardTab,
        navigateTo,
        goBack,
        authInitialMode,
        setAuthInitialMode,
        welcomeStep,
        setWelcomeStep,
        accountPurpose,
        setAccountPurpose,
        searchQuery,
        setSearchQuery,
        activeCategoryFilter,
        setActiveCategoryFilter,
        activeSellerFilter,
        setActiveSellerFilter,
        priceRange,
        setPriceRange,
        sortBy,
        setSortBy,
        resetFilters,
        products,
        categories,
        cart,
        favourites,
        orders,
        sellerOrders,
        user,
        sellerAccounts,
        currentSeller,
        conversations,
        messages,
        notifications,
        cartCount,
        cartSubtotal,
        unreadNotificationsCount,
        unreadMessagesCount,
        unreadSellerNotificationsCount,
        unreadSellerMessagesCount,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleFavourite,
        isFavourite,
        removeFavourite,
        placeOrder,
        cancelOrder,
        updateSellerOrderStatus,
        recordSellerCodCollection,
        markSupermarketPickupReady,
        registerUser,
        loginUser,
        logoutUser,
        updateUserProfile,
        requestPasswordReset,
        registerSeller,
        loginSeller,
        logoutSeller,
        updateSellerShop,
        toggleShopOpenStatus,
        addSellerProduct,
        updateSellerProduct,
        deleteSellerProduct,
        toggleProductAvailability,
        moderateProduct,
        startConversation,
        sendMessage,
        markNotificationAsRead,
        clearAllNotifications,
        isSandboxModalOpen,
        setIsSandboxModalOpen,
        addPrototypeProduct,
        resetAllMarketplaceData,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = (): MarketplaceContextType => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
