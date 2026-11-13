/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
} from 'firebase/auth';
import {
  Product,
  ProductStatus,
  Category,
  CartItem,
  Order,
  OrderStatus,
  User,
  Address,
  SellerAccount,
  PublicShop,
  SellerFulfilmentOrder,
  DeliveryMethod,
  SellerDashboardTab,
  Conversation,
  Message,
  Notification,
  AppView,
  ProductReference,
} from '../types';
import { marketplaceConfig, formatPrice } from '../config/marketplaceConfig';
import { StorageService } from '../services/storage';
import { auth, isFirebaseConfigured } from '../services/firebaseConfig';
import {
  subscribeToPublishedProducts,
  subscribeToPublicShops,
  subscribeToSellerOwnedProducts,
  fetchProductById,
  fetchPublicShopById,
  saveProductToFirestore,
  updateProductInFirestore,
  deleteProductFromFirestore,
  decrementProductStockInFirestore,
  getUserProfileFromFirestore,
  saveUserProfileToFirestore,
  getSellerAccountByOwnerUid,
  createOrUpdateSellerAndPublicShop,
  subscribeToCustomerOrders,
  subscribeToSellerFulfilmentOrders,
  saveOrderAndFulfilmentsToFirestore,
  updateOrderStatusInFirestore,
  updateSellerFulfilmentInFirestore,
  subscribeToConversationsForUser,
  subscribeToConversationMessages,
  saveConversationToFirestore,
  saveMessageToFirestore,
  subscribeToUserNotifications,
  saveNotificationToFirestore,
  markNotificationReadInFirestore,
  deleteNotificationInFirestore,
} from '../services/firestoreService';

export interface NavigationParams {
  productId?: string;
  categorySlug?: string;
  sellerId?: string;
  conversationId?: string;
  searchQuery?: string;
  sellerTab?: SellerDashboardTab;
  authMode?: 'login' | 'register';
  welcomeStep?: 'welcome' | 'purpose' | 'action';
  accountPurpose?: 'customer' | 'seller';
  editingProductId?: string | null;
}

export interface AddSellerProductInput {
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  originalPrice: number;
  discountedPrice?: number;
  discountPercentage?: number;
  stock: number;
  images: string[];
  status?: ProductStatus;
  deliveryOptions?: DeliveryMethod[];
  searchKeywords?: string[];
  isAvailable?: boolean;
  isFeatured?: boolean;
  isRecommended?: boolean;
}

interface InitialRouteState {
  view: AppView;
  productId: string | null;
  categorySlug: string | null;
  sellerId: string | null;
  searchQuery: string;
}

function parseUrlRoute(): InitialRouteState {
  if (typeof window === 'undefined') {
    return { view: 'home', productId: null, categorySlug: null, sellerId: null, searchQuery: '' };
  }

  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.replace(/^#/, '');

  // Query parameter support (?product=..., ?shop=..., ?category=...)
  const qProduct = searchParams.get('product');
  if (qProduct) {
    return { view: 'product', productId: qProduct, categorySlug: null, sellerId: null, searchQuery: '' };
  }
  const qShop = searchParams.get('shop');
  if (qShop) {
    return { view: 'shop', productId: null, categorySlug: null, sellerId: qShop, searchQuery: '' };
  }
  const qCategory = searchParams.get('category');
  if (qCategory) {
    return { view: 'category', productId: null, categorySlug: qCategory, sellerId: null, searchQuery: '' };
  }

  // Hash fallback support (#shop/SELL-123, #product/prod-123)
  if (hash.startsWith('shop/')) {
    return {
      view: 'shop',
      productId: null,
      categorySlug: null,
      sellerId: decodeURIComponent(hash.slice(5)),
      searchQuery: '',
    };
  }
  if (hash.startsWith('product/')) {
    return {
      view: 'product',
      productId: decodeURIComponent(hash.slice(8)),
      categorySlug: null,
      sellerId: null,
      searchQuery: '',
    };
  }

  // Path-based deep links (/product/{id}, /shop/{id}, /category/{slug}, /search)
  const productMatch = pathname.match(/^\/product\/([^/]+)$/);
  if (productMatch) {
    return {
      view: 'product',
      productId: decodeURIComponent(productMatch[1]),
      categorySlug: null,
      sellerId: null,
      searchQuery: '',
    };
  }

  const shopMatch = pathname.match(/^\/shop\/([^/]+)$/);
  if (shopMatch) {
    return {
      view: 'shop',
      productId: null,
      categorySlug: null,
      sellerId: decodeURIComponent(shopMatch[1]),
      searchQuery: '',
    };
  }

  const categoryMatch = pathname.match(/^\/category\/([^/]+)$/);
  if (categoryMatch) {
    return {
      view: 'category',
      productId: null,
      categorySlug: decodeURIComponent(categoryMatch[1]),
      sellerId: null,
      searchQuery: '',
    };
  }

  if (pathname === '/search') {
    return {
      view: 'search',
      productId: null,
      categorySlug: null,
      sellerId: null,
      searchQuery: searchParams.get('q') || '',
    };
  }

  if (pathname === '/welcome' || searchParams.get('welcome') === '1') {
    return { view: 'welcome', productId: null, categorySlug: null, sellerId: null, searchQuery: '' };
  }

  // Default public entry point is ALWAYS the browseable marketplace catalog ('home')
  return { view: 'home', productId: null, categorySlug: null, sellerId: null, searchQuery: '' };
}

function buildUrlForView(view: AppView, params?: NavigationParams): string {
  switch (view) {
    case 'product':
      return params?.productId ? `/product/${encodeURIComponent(params.productId)}` : '/';
    case 'shop':
      return params?.sellerId ? `/shop/${encodeURIComponent(params.sellerId)}` : '/';
    case 'category':
      return params?.categorySlug ? `/category/${encodeURIComponent(params.categorySlug)}` : '/';
    case 'search':
      return params?.searchQuery ? `/search?q=${encodeURIComponent(params.searchQuery)}` : '/search';
    case 'welcome':
      return '/welcome';
    case 'home':
    default:
      return '/';
  }
}

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const message = err instanceof Error ? err.message : String(err);

  if (code.includes('email-already-in-use')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (code.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code.includes('weak-password')) {
    return 'Password must be at least 6 characters long.';
  }
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'Incorrect email or password. Please verify your credentials and try again.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return message || 'Authentication failed. Please try again.';
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
  editingProductId: string | null;
  setEditingProductId: (id: string | null) => void;
  navigateTo: (view: AppView, params?: NavigationParams) => void;
  goBack: () => void;

  // Welcome & Auth routing state
  authInitialMode: 'login' | 'register';
  setAuthInitialMode: (mode: 'login' | 'register') => void;
  welcomeStep: 'welcome' | 'purpose' | 'action';
  setWelcomeStep: (step: 'welcome' | 'purpose' | 'action') => void;
  accountPurpose: 'customer' | 'seller';
  setAccountPurpose: (purpose: 'customer' | 'seller') => void;
  isAuthReady: boolean;

  // Account-Required Gate Modal
  authGate: { isOpen: boolean; message: string };
  openAuthGate: (message?: string) => void;
  closeAuthGate: () => void;

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

  // Data Collections & Loading/Error States
  products: Product[]; // Strictly published products visible to everyone
  sellerProducts: Product[]; // Current seller's products (draft, published, paused, out_of_stock)
  productsLoading: boolean;
  productsError: string | null;
  retryProductsSubscription: () => void;
  publicShops: PublicShop[];
  publicShopsLoading: boolean;
  categories: Category[];
  cart: CartItem[];
  favourites: string[];
  orders: Order[];
  sellerOrders: SellerFulfilmentOrder[];
  user: User | null;
  sellerAccounts: PublicShop[]; // Public-safe view for existing consumers
  currentSeller: SellerAccount | null;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  notifications: Notification[];

  // Helpers
  getShopById: (shopId: string) => PublicShop | undefined;
  loadProductById: (productId: string) => Promise<Product | null>;
  loadPublicShopById: (shopId: string) => Promise<PublicShop | null>;

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
  ) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  cancelOrder: (orderId: string) => Promise<boolean>;

  // Seller Order Management
  updateSellerOrderStatus: (
    sellerOrderId: string,
    newStatus: OrderStatus,
    reason?: string
  ) => Promise<boolean>;
  recordSellerCodCollection: (sellerOrderId: string) => Promise<boolean>;
  markSupermarketPickupReady: (sellerOrderId: string) => Promise<boolean>;

  // Customer Auth & Profile Operations
  registerUser: (
    name: string,
    email: string,
    password: string,
    phone?: string,
    address?: Address
  ) => Promise<{ success: boolean; error?: string }>;
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;

  // Seller Auth & Account Operations
  registerSeller: (data: {
    fullName: string;
    shopName: string;
    shopCategory?: string;
    phone: string;
    email: string;
    shopLocation: string;
    shopDescription: string;
    shopLogo?: string;
    password?: string;
    deliveryOptions?: DeliveryMethod[];
  }) => Promise<{ success: boolean; sellerId?: string; error?: string }>;
  loginSeller: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutSeller: () => Promise<void>;
  updateSellerShop: (data: Partial<SellerAccount>) => Promise<void>;
  toggleShopOpenStatus: () => Promise<void>;
  updateSellerAuthPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // Product Management (Seller & Marketplace)
  addSellerProduct: (productData: AddSellerProductInput) => Promise<Product>;
  updateSellerProduct: (
    productId: string,
    data: Partial<Product>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteSellerProduct: (productId: string) => Promise<{ success: boolean; error?: string }>;
  toggleProductAvailability: (productId: string) => Promise<void>;

  // Messaging Operations
  startConversation: (
    sellerId: string,
    sellerName: string,
    productRef?: ProductReference,
    initialMessage?: string,
    orderRef?: { id: string; total: number }
  ) => Promise<string>;
  sendMessage: (
    conversationId: string,
    text: string,
    asSender?: 'customer' | 'seller'
  ) => Promise<void>;

  // Notifications Operations
  markNotificationAsRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialRoute = useMemo(() => parseUrlRoute(), []);

  // Navigation
  const [currentView, setCurrentView] = useState<AppView>(initialRoute.view);
  const [previousView, setPreviousView] = useState<AppView | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialRoute.productId);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(
    initialRoute.categorySlug
  );
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(initialRoute.sellerId);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [sellerDashboardTab, setSellerDashboardTab] = useState<SellerDashboardTab>('overview');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [welcomeStep, setWelcomeStep] = useState<'welcome' | 'purpose' | 'action'>('welcome');
  const [accountPurpose, setAccountPurpose] = useState<'customer' | 'seller'>('customer');
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  const [authGate, setAuthGate] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: 'Please sign in or create an account to continue.',
  });

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState<string>(initialRoute.searchQuery);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [activeSellerFilter, setActiveSellerFilter] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'newest'>('newest');

  // Core Firestore-Backed State
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [subscriptionNonce, setSubscriptionNonce] = useState<number>(0);

  const [publicShops, setPublicShops] = useState<PublicShop[]>([]);
  const [publicShopsLoading, setPublicShopsLoading] = useState<boolean>(true);

  const [categories] = useState<Category[]>(marketplaceConfig.categories);
  const [cart, setCart] = useState<CartItem[]>(() => StorageService.getCart());
  const [favourites, setFavourites] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<SellerFulfilmentOrder[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [currentSeller, setCurrentSeller] = useState<SellerAccount | null>(null);

  const [customerConversations, setCustomerConversations] = useState<Conversation[]>([]);
  const [sellerConversations, setSellerConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Track active registration to avoid race conditions inside onAuthStateChanged
  const isRegisteringSellerRef = useRef(false);

  const conversations = useMemo(() => {
    const map = new Map<string, Conversation>();
    [...customerConversations, ...sellerConversations].forEach((c) => map.set(c.id, c));
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }, [customerConversations, sellerConversations]);

  // Persist local shopping cart across refreshes even for logged-out visitors
  useEffect(() => {
    StorageService.saveCart(cart);
  }, [cart]);

  // Sync browser back/forward button with URL routes
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseUrlRoute();
      setCurrentView(parsed.view);
      if (parsed.productId) setSelectedProductId(parsed.productId);
      if (parsed.categorySlug) setSelectedCategorySlug(parsed.categorySlug);
      if (parsed.sellerId) setSelectedSellerId(parsed.sellerId);
      setSearchQuery(parsed.searchQuery);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ---------------------------------------------------------------------------
  // 1. REAL-TIME PUBLIC SUBSCRIPTIONS (ACTIVE FOR ALL VISITORS & DEVICES)
  // ---------------------------------------------------------------------------
  const retryProductsSubscription = useCallback(() => {
    setProductsLoading(true);
    setProductsError(null);
    setSubscriptionNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setProductsLoading(false);
      setPublicShopsLoading(false);
      setProductsError('Marketplace database configuration is missing.');
      return;
    }

    setProductsLoading(true);
    setProductsError(null);

    const unsubProducts = subscribeToPublishedProducts(
      (items) => {
        setProducts(items);
        setProductsLoading(false);
        setProductsError(null);
      },
      (err) => {
        setProductsLoading(false);
        setProductsError(err.message || 'Unable to load marketplace products right now.');
      }
    );

    const unsubShops = subscribeToPublicShops(
      (shops) => {
        setPublicShops(shops);
        setPublicShopsLoading(false);
      },
      () => {
        setPublicShopsLoading(false);
      }
    );

    return () => {
      unsubProducts();
      unsubShops();
    };
  }, [subscriptionNonce]);

  // ---------------------------------------------------------------------------
  // 2. FIREBASE AUTHENTICATION OBSERVER & USER/SELLER PRIVATE STREAMS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let unsubSellerProds: (() => void) | null = null;
    let unsubCustOrders: (() => void) | null = null;
    let unsubSellerFulfil: (() => void) | null = null;
    let unsubCustFulfil: (() => void) | null = null;
    let unsubCustConvs: (() => void) | null = null;
    let unsubSellerConvs: (() => void) | null = null;
    let unsubNotifs: (() => void) | null = null;

    const cleanupPrivateStreams = () => {
      unsubSellerProds?.();
      unsubCustOrders?.();
      unsubSellerFulfil?.();
      unsubCustFulfil?.();
      unsubCustConvs?.();
      unsubSellerConvs?.();
      unsubNotifs?.();
      unsubSellerProds = null;
      unsubCustOrders = null;
      unsubSellerFulfil = null;
      unsubCustFulfil = null;
      unsubCustConvs = null;
      unsubSellerConvs = null;
      unsubNotifs = null;
    };

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      cleanupPrivateStreams();

      if (!firebaseUser) {
        setUser(null);
        setCurrentSeller(null);
        setFavourites([]);
        setSellerProducts([]);
        setOrders([]);
        setSellerOrders([]);
        setCustomerConversations([]);
        setSellerConversations([]);
        setMessages({});
        setNotifications([]);
        setIsAuthReady(true);
        return;
      }

      const uid = firebaseUser.uid;

      try {
        // Load customer profile
        let profile = await getUserProfileFromFirestore(uid);
        if (!profile && !isRegisteringSellerRef.current) {
          profile = {
            id: uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Customer',
            email: (firebaseUser.email || '').toLowerCase(),
            favourites: [],
            createdAt: new Date().toISOString(),
          };
          await saveUserProfileToFirestore(profile);
        }

        if (profile) {
          setUser(profile);
          setFavourites(Array.isArray(profile.favourites) ? profile.favourites : []);
        }

        // Check if this Firebase Auth user also owns a Seller shop
        if (!isRegisteringSellerRef.current) {
          const sellerProfile = await getSellerAccountByOwnerUid(uid);
          if (sellerProfile) {
            setCurrentSeller(sellerProfile);
          } else {
            setCurrentSeller(null);
          }
        }
      } catch (err) {
        console.warn('[AuthObserver] Profile load error:', err);
      }

      // Attach real-time private streams for this authenticated UID
      unsubSellerProds = subscribeToSellerOwnedProducts(uid, (items) => {
        setSellerProducts(items);
      });

      unsubCustOrders = subscribeToCustomerOrders(uid, (list) => {
        setOrders(list);
      });

      const sellerOrderMap = new Map<string, SellerFulfilmentOrder>();
      const mergeSellerOrders = (incomingList: SellerFulfilmentOrder[]) => {
        incomingList.forEach((so) => sellerOrderMap.set(so.id, so));
        const merged = Array.from(sellerOrderMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSellerOrders(merged);
      };

      unsubSellerFulfil = subscribeToSellerFulfilmentOrders(uid, 'seller', mergeSellerOrders);
      unsubCustFulfil = subscribeToSellerFulfilmentOrders(uid, 'customer', mergeSellerOrders);

      unsubCustConvs = subscribeToConversationsForUser(uid, 'customerUid', setCustomerConversations);
      unsubSellerConvs = subscribeToConversationsForUser(
        uid,
        'sellerOwnerUid',
        setSellerConversations
      );

      unsubNotifs = subscribeToUserNotifications(uid, setNotifications);

      setIsAuthReady(true);
    });

    return () => {
      cleanupPrivateStreams();
      unsubAuth();
    };
  }, []);

  // Live messages subscription for all active conversations of signed-in user
  useEffect(() => {
    if (!auth.currentUser || conversations.length === 0) return;

    const unsubs = conversations.map((conv) =>
      subscribeToConversationMessages(conv.id, (msgs) => {
        setMessages((prev) => ({
          ...prev,
          [conv.id]: msgs,
        }));
      })
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [conversations.map((c) => c.id).join(',')]);

  // ---------------------------------------------------------------------------
  // NAVIGATION & AUTH GATE
  // ---------------------------------------------------------------------------
  const openAuthGate = useCallback((message = 'Please sign in or create an account to continue.') => {
    setAuthGate({ isOpen: true, message });
  }, []);

  const closeAuthGate = useCallback(() => {
    setAuthGate((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const navigateTo = useCallback(
    (view: AppView, params?: NavigationParams) => {
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
      if (params?.editingProductId !== undefined) setEditingProductId(params.editingProductId);

      // Keep clean browser URLs for shareable public pages
      if (
        typeof window !== 'undefined' &&
        (view === 'home' || view === 'product' || view === 'shop' || view === 'category' || view === 'search' || view === 'welcome')
      ) {
        const nextUrl = buildUrlForView(view, {
          ...params,
          productId: params?.productId ?? selectedProductId ?? undefined,
          sellerId: params?.sellerId ?? selectedSellerId ?? undefined,
          categorySlug: params?.categorySlug ?? selectedCategorySlug ?? undefined,
          searchQuery: params?.searchQuery ?? searchQuery ?? undefined,
        });
        if (window.location.pathname + window.location.search !== nextUrl) {
          window.history.pushState({}, '', nextUrl);
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [currentView, selectedProductId, selectedSellerId, selectedCategorySlug, searchQuery]
  );

  const goBack = useCallback(() => {
    if (previousView) {
      setCurrentView(previousView);
      setPreviousView(null);
    } else {
      navigateTo('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [previousView, navigateTo]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setActiveCategoryFilter(null);
    setActiveSellerFilter(null);
    setPriceRange([0, 10000]);
    setSortBy('newest');
  }, []);

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  const getShopById = useCallback(
    (shopId: string): PublicShop | undefined => {
      return publicShops.find((s) => s.id === shopId || s.shopId === shopId || s.sellerId === shopId);
    },
    [publicShops]
  );

  const loadProductById = useCallback(async (productId: string): Promise<Product | null> => {
    return fetchProductById(productId);
  }, []);

  const loadPublicShopById = useCallback(async (shopId: string): Promise<PublicShop | null> => {
    return fetchPublicShopById(shopId);
  }, []);

  // ---------------------------------------------------------------------------
  // COMPUTED METRICS
  // ---------------------------------------------------------------------------
  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = item.product.discountedPrice ?? item.product.originalPrice ?? item.product.price;
      return acc + price * item.quantity;
    }, 0);
  }, [cart]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead && !n.sellerId).length;
  }, [notifications]);

  const unreadMessagesCount = useMemo(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return 0;
    return conversations
      .filter((c) => c.customerUid === uid)
      .reduce((acc, c) => acc + (c.unreadCount || 0), 0);
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

  // ---------------------------------------------------------------------------
  // CART OPERATIONS (ALLOWED FOR LOGGED-OUT VISITORS; CHECKOUT REQUIRES AUTH)
  // ---------------------------------------------------------------------------
  const addToCart = (product: Product, quantity = 1): { success: boolean; message: string } => {
    const availableStock = product.stockQuantity ?? product.stock;
    if (availableStock <= 0) {
      return { success: false, message: 'Sorry, this product is currently out of stock.' };
    }
    if (
      product.status !== 'published' ||
      product.isAvailable === false ||
      product.isRemovedByModeration
    ) {
      return { success: false, message: 'This product is currently unavailable.' };
    }

    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      const newQty = currentQty + quantity;
      if (newQty > availableStock) {
        return {
          success: false,
          message: `Cannot add more. You have ${currentQty} in cart, and available stock is ${availableStock}.`,
        };
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex] = { ...updatedCart[existingIndex], quantity: newQty, product };
      setCart(updatedCart);
      return { success: true, message: `Added ${quantity} more to your cart.` };
    }

    if (quantity > availableStock) {
      return {
        success: false,
        message: `Cannot add ${quantity} items. Only ${availableStock} available.`,
      };
    }

    setCart([...cart, { productId: product.id, quantity, product }]);
    return { success: true, message: `Added "${product.name}" to your cart.` };
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
    if (!existing) return { success: false, message: 'Item not found in cart.' };

    const maxStock = existing.product.stockQuantity ?? existing.product.stock;
    if (quantity > maxStock) {
      return { success: false, message: `Maximum available stock is ${maxStock}.` };
    }

    setCart(cart.map((item) => (item.productId === productId ? { ...item, quantity } : item)));
    return { success: true, message: 'Cart updated.' };
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // ---------------------------------------------------------------------------
  // FAVOURITES (AUTH-GATED, FIRESTORE-PERSISTED)
  // ---------------------------------------------------------------------------
  const toggleFavourite = (productId: string) => {
    if (!auth.currentUser || !user) {
      openAuthGate('Please sign in or create an account to save favourite products.');
      return;
    }

    const next = favourites.includes(productId)
      ? favourites.filter((id) => id !== productId)
      : [...favourites, productId];

    setFavourites(next);
    const updatedUser: User = { ...user, favourites: next };
    setUser(updatedUser);
    saveUserProfileToFirestore(updatedUser).catch((err) =>
      console.warn('Failed to sync favourites:', err)
    );
  };

  const isFavourite = (productId: string): boolean => {
    return favourites.includes(productId);
  };

  const removeFavourite = (productId: string) => {
    if (!auth.currentUser || !user) return;
    const next = favourites.filter((id) => id !== productId);
    setFavourites(next);
    const updatedUser: User = { ...user, favourites: next };
    setUser(updatedUser);
    saveUserProfileToFirestore(updatedUser).catch((err) =>
      console.warn('Failed to remove favourite:', err)
    );
  };

  // ---------------------------------------------------------------------------
  // CUSTOMER ORDERS (AUTH-GATED, FIRESTORE-PERSISTED)
  // ---------------------------------------------------------------------------
  const placeOrder = async (
    deliveryAddress: Address,
    deliveryMethodBySeller?: Record<string, DeliveryMethod>,
    notes?: string
  ): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      openAuthGate('Please sign in or create an account to place your order.');
      return { success: false, error: 'Please sign in or create an account to continue.' };
    }

    if (cart.length === 0) {
      return { success: false, error: 'Shopping cart is empty.' };
    }

    for (const item of cart) {
      const liveProd = products.find((p) => p.id === item.productId) || item.product;
      const avail = liveProd.stockQuantity ?? liveProd.stock;
      if (item.quantity > avail) {
        return {
          success: false,
          error: `Insufficient stock for "${item.product.name}". Available: ${avail}`,
        };
      }
    }

    const parentOrderId = `ORD-${Date.now().toString().slice(-6)}`;
    const subtotal = cartSubtotal;

    const itemsBySeller = cart.reduce((acc, item) => {
      const sId = item.product.sellerId || 'unknown-seller';
      if (!acc[sId]) {
        acc[sId] = {
          sellerId: sId,
          sellerName: item.product.shopName || item.product.sellerName,
          sellerOwnerUid:
            item.product.ownerUid || getShopById(sId)?.ownerUid || firebaseUser.uid,
          items: [],
        };
      }
      acc[sId].items.push(item);
      return acc;
    }, {} as Record<string, { sellerId: string; sellerName: string; sellerOwnerUid: string; items: CartItem[] }>);

    let totalDeliveryFee = 0;
    const newSellerFulfilmentOrders: SellerFulfilmentOrder[] = [];
    const notificationsToSend: Notification[] = [];

    Object.values(itemsBySeller).forEach((sellerGroup, idx) => {
      const sellerSub = sellerGroup.items.reduce((s, it) => {
        const pr = it.product.discountedPrice ?? it.product.originalPrice ?? it.product.price;
        return s + pr * it.quantity;
      }, 0);

      const chosenMethod = deliveryMethodBySeller?.[sellerGroup.sellerId] || 'Seller Delivery';
      const parcelDeliveryFee =
        sellerSub > marketplaceConfig.delivery.freeShippingThreshold
          ? 0
          : marketplaceConfig.delivery.standardFee;
      totalDeliveryFee += parcelDeliveryFee;

      const sellerOrderItems = sellerGroup.items.map((it) => {
        const unit = it.product.discountedPrice ?? it.product.originalPrice ?? it.product.price;
        return {
          productId: it.productId,
          productName: it.product.name,
          sellerName: it.product.shopName || it.product.sellerName,
          sellerId: it.product.sellerId,
          quantity: it.quantity,
          unitPrice: unit,
          total: unit * it.quantity,
          image: it.product.images[0],
        };
      });

      const sellerOrderId = `SO-${parentOrderId.replace('ORD-', '')}-${sellerGroup.sellerId.slice(-4)}-${idx + 1}`;

      const sOrder: SellerFulfilmentOrder = {
        id: sellerOrderId,
        parentOrderId,
        sellerId: sellerGroup.sellerId,
        sellerOwnerUid: sellerGroup.sellerOwnerUid,
        sellerName: sellerGroup.sellerName,
        customerUid: firebaseUser.uid,
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

      notificationsToSend.push({
        id: `notif-seller-${Date.now()}-${idx}`,
        recipientUid: sellerGroup.sellerOwnerUid,
        title: 'New Order Received',
        message: `Order #${sellerOrderId} received from ${deliveryAddress.fullName}. Total: ${formatPrice(sellerSub + parcelDeliveryFee)} (${chosenMethod}).`,
        type: 'order',
        isRead: false,
        createdAt: new Date().toISOString(),
        sellerId: sellerGroup.sellerId,
        linkView: 'seller-orders',
        linkId: sellerOrderId,
      });
    });

    const total = subtotal + totalDeliveryFee;
    const allOrderItems = cart.map((item) => {
      const unit = item.product.discountedPrice ?? item.product.originalPrice ?? item.product.price;
      return {
        productId: item.productId,
        productName: item.product.name,
        sellerName: item.product.shopName || item.product.sellerName,
        sellerId: item.product.sellerId,
        quantity: item.quantity,
        unitPrice: unit,
        total: unit * item.quantity,
        image: item.product.images[0],
      };
    });

    const parentOrder: Order = {
      id: parentOrderId,
      customerId: firebaseUser.uid,
      customerUid: firebaseUser.uid,
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
      notes,
      sellerOrders: newSellerFulfilmentOrders,
      deliveryMethodBySeller,
    };

    try {
      await saveOrderAndFulfilmentsToFirestore(parentOrder, newSellerFulfilmentOrders);

      // Decrement stock in Firestore for each purchased item
      await Promise.all(
        cart.map(async (item) => {
          const liveProd = products.find((p) => p.id === item.productId) || item.product;
          const currentStock = liveProd.stockQuantity ?? liveProd.stock;
          const nextStock = Math.max(0, currentStock - item.quantity);
          const nextStatus: ProductStatus = nextStock === 0 ? 'out_of_stock' : 'published';
          await decrementProductStockInFirestore(item.productId, nextStock, nextStatus);
        })
      );

      // Customer notification
      notificationsToSend.push({
        id: `notif-cust-${Date.now()}`,
        recipientUid: firebaseUser.uid,
        title: 'Order Confirmed',
        message: `Your order #${parentOrderId} for ${formatPrice(total)} has been placed via Cash on Delivery.`,
        type: 'order',
        isRead: false,
        createdAt: new Date().toISOString(),
        linkView: 'orders',
        linkId: parentOrderId,
      });

      await Promise.all(notificationsToSend.map((n) => saveNotificationToFirestore(n)));
      setCart([]);

      return { success: true, orderId: parentOrderId };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unable to save your order. Please try again.',
      };
    }
  };

  const cancelOrder = async (orderId: string): Promise<boolean> => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing || existing.status !== 'Pending') return false;

    try {
      await updateOrderStatusInFirestore(orderId, 'Cancelled');
      const relatedSellerOrders = sellerOrders.filter((so) => so.parentOrderId === orderId);
      await Promise.all(
        relatedSellerOrders.map((so) =>
          updateSellerFulfilmentInFirestore(so.id, {
            status: 'Cancelled',
            rejectionReason: 'Cancelled by customer',
            updatedAt: new Date().toISOString(),
          })
        )
      );

      if (auth.currentUser) {
        await saveNotificationToFirestore({
          id: `notif-cancel-${Date.now()}`,
          recipientUid: auth.currentUser.uid,
          title: 'Order Cancelled',
          message: `Order #${orderId} has been cancelled.`,
          type: 'order',
          isRead: false,
          createdAt: new Date().toISOString(),
          linkView: 'orders',
          linkId: orderId,
        });
      }
      return true;
    } catch (err) {
      console.error('cancelOrder failed:', err);
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // SELLER ORDER FULFILMENT
  // ---------------------------------------------------------------------------
  const updateSellerOrderStatus = async (
    sellerOrderId: string,
    newStatus: OrderStatus,
    reason?: string
  ): Promise<boolean> => {
    const existing = sellerOrders.find((so) => so.id === sellerOrderId);
    if (!existing) return false;

    try {
      await updateSellerFulfilmentInFirestore(sellerOrderId, {
        status: newStatus,
        rejectionReason: reason || existing.rejectionReason,
        updatedAt: new Date().toISOString(),
      });

      if (newStatus === 'Cancelled' && currentSeller) {
        // Seller owner restores stock on rejected order
        for (const item of existing.items) {
          const prod = sellerProducts.find((p) => p.id === item.productId);
          if (prod && prod.ownerUid === auth.currentUser?.uid) {
            const restoredQty = (prod.stockQuantity ?? prod.stock) + item.quantity;
            await updateProductInFirestore(prod.id, {
              ...prod,
              stock: restoredQty,
              stockQuantity: restoredQty,
              status: restoredQty > 0 && prod.status === 'out_of_stock' ? 'published' : prod.status,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      if (existing.customerUid) {
        await saveNotificationToFirestore({
          id: `notif-status-${Date.now()}`,
          recipientUid: existing.customerUid,
          title: `Order Status: ${newStatus}`,
          message: `Your package #${sellerOrderId} from ${existing.sellerName} is now ${newStatus}.${
            reason ? ` Note: ${reason}` : ''
          }`,
          type: 'order',
          isRead: false,
          createdAt: new Date().toISOString(),
          linkView: 'orders',
          linkId: existing.parentOrderId,
        });
      }
      return true;
    } catch (err) {
      console.error('updateSellerOrderStatus failed:', err);
      return false;
    }
  };

  const recordSellerCodCollection = async (sellerOrderId: string): Promise<boolean> => {
    const existing = sellerOrders.find((so) => so.id === sellerOrderId);
    if (!existing) return false;

    try {
      await updateSellerFulfilmentInFirestore(sellerOrderId, {
        codCollected: true,
        status: 'Delivered',
        updatedAt: new Date().toISOString(),
      });

      if (auth.currentUser) {
        await saveNotificationToFirestore({
          id: `notif-cod-${Date.now()}`,
          recipientUid: auth.currentUser.uid,
          title: 'Payment Received',
          message: `Cash on Delivery for order #${sellerOrderId} (${formatPrice(existing.total)}) recorded as collected.`,
          type: 'order',
          isRead: false,
          createdAt: new Date().toISOString(),
          sellerId: existing.sellerId,
        });
      }
      return true;
    } catch (err) {
      console.error('recordSellerCodCollection failed:', err);
      return false;
    }
  };

  const markSupermarketPickupReady = async (sellerOrderId: string): Promise<boolean> => {
    const existing = sellerOrders.find((so) => so.id === sellerOrderId);
    if (!existing) return false;

    try {
      await updateSellerFulfilmentInFirestore(sellerOrderId, {
        readyForPickup: true,
        status: 'Ready for Delivery',
        deliveryPersonAssigned: `${marketplaceConfig.marketplaceName} Courier Dispatch`,
        updatedAt: new Date().toISOString(),
      });

      if (auth.currentUser) {
        await saveNotificationToFirestore({
          id: `notif-pickup-${Date.now()}`,
          recipientUid: auth.currentUser.uid,
          title: 'Courier Dispatch Assigned',
          message: `Order #${sellerOrderId} marked ready for ${marketplaceConfig.marketplaceName} pickup.`,
          type: 'order',
          isRead: false,
          createdAt: new Date().toISOString(),
          sellerId: existing.sellerId,
        });
      }
      return true;
    } catch (err) {
      console.error('markSupermarketPickupReady failed:', err);
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // CUSTOMER AUTH & PROFILE (REAL FIREBASE AUTH)
  // ---------------------------------------------------------------------------
  const registerUser = async (
    name: string,
    email: string,
    password: string,
    phone?: string,
    address?: Address
  ): Promise<{ success: boolean; error?: string }> => {
    if (!name.trim() || !email.trim() || !password) {
      return { success: false, error: 'Name, email, and password are required.' };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });

      const newUser: User = {
        id: cred.user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phone?.trim() || undefined,
        deliveryAddress: address,
        favourites: [],
        createdAt: new Date().toISOString(),
      };

      await saveUserProfileToFirestore(newUser);
      setUser(newUser);
      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err) };
    }
  };

  const loginUser = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!email.trim() || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      let profile = await getUserProfileFromFirestore(cred.user.uid);
      if (!profile) {
        profile = {
          id: cred.user.uid,
          name: cred.user.displayName || email.split('@')[0],
          email: email.trim().toLowerCase(),
          favourites: [],
          createdAt: new Date().toISOString(),
        };
        await saveUserProfileToFirestore(profile);
      }
      setUser(profile);
      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err) };
    }
  };

  const logoutUser = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
    setCurrentSeller(null);
    navigateTo('home');
  };

  const updateUserProfile = async (data: Partial<User>): Promise<void> => {
    if (!user || !auth.currentUser) return;
    const updated: User = { ...user, ...data, id: auth.currentUser.uid };
    setUser(updated);
    await saveUserProfileToFirestore(updated);
  };

  const requestPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!email.trim() || !email.includes('@')) {
      return { success: false, message: 'Please provide a valid email address.' };
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return {
        success: true,
        message: `Password reset email sent to ${email.trim()}. Check your inbox to reset your password.`,
      };
    } catch (err) {
      return { success: false, message: mapAuthError(err) };
    }
  };

  // ---------------------------------------------------------------------------
  // SELLER REGISTRATION, SIGN-IN & SHOP MANAGEMENT
  // ---------------------------------------------------------------------------
  const registerSeller = async (data: {
    fullName: string;
    shopName: string;
    shopCategory?: string;
    phone: string;
    email: string;
    shopLocation: string;
    shopDescription: string;
    shopLogo?: string;
    password?: string;
    deliveryOptions?: DeliveryMethod[];
  }): Promise<{ success: boolean; sellerId?: string; error?: string }> => {
    if (!data.fullName.trim() || !data.shopName.trim() || !data.phone.trim() || !data.email.trim()) {
      return { success: false, error: 'Full name, shop name, email, and phone number are required.' };
    }
    if (!data.password || data.password.length < 6) {
      return { success: false, error: 'A password of at least 6 characters is required.' };
    }

    isRegisteringSellerRef.current = true;

    try {
      let firebaseUser = auth.currentUser;
      const cleanEmail = data.email.trim().toLowerCase();

      if (firebaseUser && firebaseUser.email?.toLowerCase() === cleanEmail) {
        // Use currently authenticated user to upgrade to seller
      } else {
        try {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
          firebaseUser = cred.user;
          await updateProfile(cred.user, { displayName: data.fullName.trim() });
        } catch (createErr) {
          const code = (createErr as { code?: string })?.code || '';
          if (code.includes('email-already-in-use')) {
            // Try signing in with provided password in case customer already registered that email
            const signInCred = await signInWithEmailAndPassword(auth, cleanEmail, data.password);
            firebaseUser = signInCred.user;
          } else {
            throw createErr;
          }
        }
      }

      if (!firebaseUser) {
        return { success: false, error: 'Authentication failed during seller registration.' };
      }

      const existingSeller = await getSellerAccountByOwnerUid(firebaseUser.uid);
      if (existingSeller) {
        setCurrentSeller(existingSeller);
        navigateTo('seller-dashboard', { sellerTab: 'overview' });
        return { success: true, sellerId: existingSeller.id };
      }

      const sellerId = `SELL-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowIso = new Date().toISOString();

      const newSeller: SellerAccount = {
        id: sellerId,
        ownerUid: firebaseUser.uid,
        userId: firebaseUser.uid,
        fullName: data.fullName.trim(),
        shopName: data.shopName.trim(),
        shopCategory: data.shopCategory || 'General Store',
        phone: data.phone.trim(),
        email: cleanEmail,
        shopLocation: data.shopLocation.trim() || marketplaceConfig.contact.cityHub,
        shopDescription:
          data.shopDescription.trim() ||
          `${data.shopName.trim()} official storefront on ${marketplaceConfig.marketplaceName}.`,
        shopLogo: data.shopLogo?.trim() || undefined,
        isOpen: true,
        showSellerName: true,
        showSellerId: true,
        deliveryOptions: data.deliveryOptions || ['Seller Delivery', 'Supermarket Delivery'],
        createdAt: nowIso,
        updatedAt: nowIso,
        notificationPreferences: {
          orderUpdates: true,
          messages: true,
          lowStock: true,
        },
      };

      await createOrUpdateSellerAndPublicShop(newSeller);
      setCurrentSeller(newSeller);

      // Ensure user profile exists and links sellerId
      let userProfile = await getUserProfileFromFirestore(firebaseUser.uid);
      if (!userProfile) {
        userProfile = {
          id: firebaseUser.uid,
          name: data.fullName.trim(),
          email: cleanEmail,
          phoneNumber: data.phone.trim(),
          favourites: [],
          createdAt: nowIso,
          isSeller: true,
          sellerId,
        };
      } else {
        userProfile = { ...userProfile, isSeller: true, sellerId };
      }
      await saveUserProfileToFirestore(userProfile);
      setUser(userProfile);

      await saveNotificationToFirestore({
        id: `notif-welcome-${sellerId}`,
        recipientUid: firebaseUser.uid,
        title: 'Seller Account Activated',
        message: `Welcome to ${marketplaceConfig.marketplaceName}! Your shop "${newSeller.shopName}" is now live with Seller ID: ${sellerId}.`,
        type: 'seller',
        isRead: false,
        createdAt: nowIso,
        sellerId,
      });

      setCurrentView('seller-dashboard');
      setSellerDashboardTab('overview');
      return { success: true, sellerId };
    } catch (err) {
      return { success: false, error: mapAuthError(err) };
    } finally {
      isRegisteringSellerRef.current = false;
    }
  };

  const loginSeller = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter your registered email address and password.' };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const sellerProfile = await getSellerAccountByOwnerUid(cred.user.uid);

      if (!sellerProfile) {
        return {
          success: false,
          error:
            'No Seller Shop is linked to this account yet. Switch to "Create Seller Account" to open your shop.',
        };
      }

      setCurrentSeller(sellerProfile);
      setCurrentView('seller-dashboard');
      setSellerDashboardTab('overview');
      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err) };
    }
  };

  const logoutSeller = async (): Promise<void> => {
    await signOut(auth);
    setCurrentSeller(null);
    setUser(null);
    navigateTo('home');
  };

  const updateSellerShop = async (data: Partial<SellerAccount>): Promise<void> => {
    if (!currentSeller || !auth.currentUser) return;
    const { id: _ignoreId, ownerUid: _ignoreOwner, ...allowed } = data;

    const updatedSeller: SellerAccount = {
      ...currentSeller,
      ...allowed,
      id: currentSeller.id,
      ownerUid: currentSeller.ownerUid,
      updatedAt: new Date().toISOString(),
    };

    await createOrUpdateSellerAndPublicShop(updatedSeller);
    setCurrentSeller(updatedSeller);

    if (allowed.shopName || allowed.shopLocation) {
      const owned = sellerProducts.filter((p) => p.sellerId === currentSeller.id);
      await Promise.all(
        owned.map((p) =>
          updateProductInFirestore(p.id, {
            ...p,
            sellerName: allowed.shopName || p.sellerName,
            shopName: allowed.shopName || p.shopName,
            sellerLocation: allowed.shopLocation || p.sellerLocation,
            location: allowed.shopLocation || p.location,
            updatedAt: new Date().toISOString(),
          })
        )
      );
    }
  };

  const toggleShopOpenStatus = async (): Promise<void> => {
    if (!currentSeller) return;
    await updateSellerShop({ isOpen: !currentSeller.isOpen });
  };

  const updateSellerAuthPassword = async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser) {
      return { success: false, error: 'You must be signed in to update your password.' };
    }
    try {
      await updatePassword(auth.currentUser, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err) };
    }
  };

  // ---------------------------------------------------------------------------
  // PRODUCT MANAGEMENT (WRITES DIRECTLY TO FIRESTORE FOR GLOBAL VISIBILITY)
  // ---------------------------------------------------------------------------
  const addSellerProduct = async (productData: AddSellerProductInput): Promise<Product> => {
    if (!currentSeller || !auth.currentUser) {
      throw new Error('Must be signed in as a seller to publish products.');
    }
    if (!productData.images || productData.images.length !== 2) {
      throw new Error('Each product must include exactly 2 compressed photos.');
    }

    const nowIso = new Date().toISOString();
    const effectivePrice =
      typeof productData.discountedPrice === 'number' &&
      productData.discountedPrice > 0 &&
      productData.discountedPrice < productData.originalPrice
        ? productData.discountedPrice
        : productData.originalPrice;

    const requestedStatus: ProductStatus =
      productData.status ||
      (productData.isAvailable === false
        ? 'paused'
        : productData.stock <= 0
        ? 'out_of_stock'
        : 'published');

    const keywords =
      productData.searchKeywords && productData.searchKeywords.length > 0
        ? productData.searchKeywords
        : Array.from(
            new Set(
              `${productData.name} ${productData.category} ${productData.subcategory || ''} ${currentSeller.shopName}`
                .toLowerCase()
                .split(/[\s,.-]+/)
                .filter((w) => w.length >= 2)
            )
          ).slice(0, 20);

    const newProduct: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: productData.name.trim(),
      description: productData.description.trim(),
      price: effectivePrice,
      compareAtPrice:
        productData.discountedPrice && productData.discountedPrice < productData.originalPrice
          ? productData.originalPrice
          : undefined,
      originalPrice: productData.originalPrice,
      discountedPrice: productData.discountedPrice,
      discountPercentage: productData.discountPercentage,
      currency: marketplaceConfig.currency.code,
      stock: productData.stock,
      stockQuantity: productData.stock,
      images: [productData.images[0], productData.images[1]],
      category: productData.category,
      subcategory: productData.subcategory?.trim() || undefined,
      sellerName: currentSeller.shopName,
      shopName: currentSeller.shopName,
      sellerId: currentSeller.id,
      shopId: currentSeller.id,
      ownerUid: auth.currentUser.uid,
      sellerLocation: currentSeller.shopLocation,
      location: currentSeller.shopLocation,
      deliveryOptions:
        productData.deliveryOptions ||
        currentSeller.deliveryOptions || ['Seller Delivery', 'Supermarket Delivery'],
      searchKeywords: keywords,
      status: requestedStatus,
      isAvailable: requestedStatus === 'published',
      isFeatured: productData.isFeatured,
      isRecommended: productData.isRecommended,
      createdAt: nowIso,
      updatedAt: nowIso,
      publishedAt: requestedStatus === 'published' ? nowIso : undefined,
    };

    await saveProductToFirestore(newProduct);

    await saveNotificationToFirestore({
      id: `notif-prod-${newProduct.id}`,
      recipientUid: auth.currentUser.uid,
      title: requestedStatus === 'published' ? 'Product Published Live' : 'Product Draft Saved',
      message:
        requestedStatus === 'published'
          ? `"${newProduct.name}" is now visible to all customers and visitors on ${marketplaceConfig.marketplaceName}.`
          : `"${newProduct.name}" was saved with status "${requestedStatus}".`,
      type: 'seller',
      isRead: false,
      createdAt: nowIso,
      sellerId: currentSeller.id,
      linkView: 'product',
      linkId: newProduct.id,
    });

    return newProduct;
  };

  const updateSellerProduct = async (
    productId: string,
    data: Partial<Product>
  ): Promise<{ success: boolean; error?: string }> => {
    const existing =
      sellerProducts.find((p) => p.id === productId) || products.find((p) => p.id === productId);
    if (!existing) return { success: false, error: 'Product not found.' };
    if (!auth.currentUser || existing.ownerUid !== auth.currentUser.uid) {
      return { success: false, error: 'You are not authorized to edit this product.' };
    }

    const nextStock =
      typeof data.stock === 'number'
        ? data.stock
        : typeof data.stockQuantity === 'number'
        ? data.stockQuantity
        : existing.stock;

    const nextOrigPrice =
      typeof data.originalPrice === 'number' ? data.originalPrice : existing.originalPrice;
    const nextDiscPrice =
      'discountedPrice' in data ? data.discountedPrice : existing.discountedPrice;
    const nextEffectivePrice =
      typeof nextDiscPrice === 'number' && nextDiscPrice > 0 && nextDiscPrice < nextOrigPrice
        ? nextDiscPrice
        : nextOrigPrice;

    let nextStatus: ProductStatus = data.status || existing.status || 'published';
    if (data.status === undefined && typeof data.stock === 'number') {
      if (data.stock === 0) nextStatus = 'out_of_stock';
      else if (existing.status === 'out_of_stock' && data.stock > 0) nextStatus = 'published';
    }
    if (data.isAvailable === false && data.status === undefined) nextStatus = 'paused';
    if (data.isAvailable === true && data.status === undefined) {
      nextStatus = nextStock > 0 ? 'published' : 'out_of_stock';
    }

    const nowIso = new Date().toISOString();
    const updatedProduct: Product = {
      ...existing,
      ...data,
      price: nextEffectivePrice,
      compareAtPrice:
        typeof nextDiscPrice === 'number' && nextDiscPrice < nextOrigPrice
          ? nextOrigPrice
          : undefined,
      originalPrice: nextOrigPrice,
      discountedPrice: nextDiscPrice,
      stock: nextStock,
      stockQuantity: nextStock,
      status: nextStatus,
      isAvailable: nextStatus === 'published',
      updatedAt: nowIso,
      publishedAt:
        nextStatus === 'published' ? existing.publishedAt || nowIso : existing.publishedAt,
    };

    try {
      await updateProductInFirestore(productId, updatedProduct);

      if (typeof data.stock === 'number' && data.stock <= 5 && data.stock > 0) {
        await saveNotificationToFirestore({
          id: `notif-stock-${productId}-${Date.now()}`,
          recipientUid: auth.currentUser.uid,
          title: 'Low Stock Alert',
          message: `Stock for "${existing.name}" is down to ${data.stock} units.`,
          type: 'low_stock',
          isRead: false,
          createdAt: nowIso,
          sellerId: existing.sellerId,
          linkView: 'seller-products',
          linkId: productId,
        });
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update product.',
      };
    }
  };

  const deleteSellerProduct = async (
    productId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const existing =
      sellerProducts.find((p) => p.id === productId) || products.find((p) => p.id === productId);
    if (!existing) return { success: false, error: 'Product not found.' };
    if (!auth.currentUser || existing.ownerUid !== auth.currentUser.uid) {
      return { success: false, error: 'You are not authorized to delete this product.' };
    }

    try {
      await deleteProductFromFirestore(productId);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete product.',
      };
    }
  };

  const toggleProductAvailability = async (productId: string): Promise<void> => {
    const existing = sellerProducts.find((p) => p.id === productId);
    if (!existing) return;

    const nextStatus: ProductStatus =
      existing.status === 'published'
        ? 'paused'
        : existing.stock > 0
        ? 'published'
        : 'out_of_stock';

    await updateSellerProduct(productId, {
      status: nextStatus,
      isAvailable: nextStatus === 'published',
    });
  };

  // ---------------------------------------------------------------------------
  // MESSAGING (AUTH-GATED, FIRESTORE-PERSISTED)
  // ---------------------------------------------------------------------------
  const startConversation = async (
    sellerId: string,
    sellerName: string,
    productRef?: ProductReference,
    initialMessage?: string,
    orderRef?: { id: string; total: number }
  ): Promise<string> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      openAuthGate('Please sign in or create an account to message this seller.');
      return '';
    }

    const existing = conversations.find(
      (c) =>
        c.sellerId === sellerId &&
        c.customerUid === firebaseUser.uid &&
        (!productRef || c.productRef?.id === productRef.id)
    );

    const shopInfo = getShopById(sellerId) || (await fetchPublicShopById(sellerId));
    const sellerOwnerUid = shopInfo?.ownerUid || '';

    let conversationId = existing?.id || '';
    const nowIso = new Date().toISOString();

    if (!existing) {
      conversationId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newConv: Conversation = {
        id: conversationId,
        sellerId,
        sellerOwnerUid,
        sellerName,
        customerId: firebaseUser.uid,
        customerUid: firebaseUser.uid,
        customerName: user?.name || firebaseUser.displayName || 'Customer',
        lastMessageText: initialMessage?.trim() || 'Conversation started',
        lastMessageTime: nowIso,
        unreadCount: 0,
        unreadBySellerCount: initialMessage?.trim() ? 1 : 0,
        productRef,
        orderRef,
        createdAt: nowIso,
      };
      // Create parent conversation document first so subcollection security rule `get(...)` succeeds
      await saveConversationToFirestore(newConv);
    }

    if (initialMessage?.trim()) {
      const msg: Message = {
        id: `msg_${Date.now()}`,
        conversationId,
        sender: 'customer',
        senderUid: firebaseUser.uid,
        senderName: user?.name || firebaseUser.displayName || 'Customer',
        text: initialMessage.trim(),
        createdAt: nowIso,
        productRef,
        orderRef,
      };
      await saveMessageToFirestore(conversationId, msg, {
        lastMessageText: initialMessage.trim(),
        lastMessageTime: nowIso,
        unreadBySellerCount: (existing?.unreadBySellerCount || 0) + 1,
      });

      if (sellerOwnerUid) {
        await saveNotificationToFirestore({
          id: `notif-msg-${Date.now()}`,
          recipientUid: sellerOwnerUid,
          title: 'New Customer Inquiry',
          message: `${user?.name || 'A customer'} sent a message regarding ${
            productRef ? `"${productRef.name}"` : 'your shop'
          }.`,
          type: 'message',
          isRead: false,
          createdAt: nowIso,
          sellerId,
          linkView: 'seller-messages',
          linkId: conversationId,
        });
      }
    }

    setSelectedConversationId(conversationId);
    navigateTo('messages', { conversationId });
    return conversationId;
  };

  const sendMessage = async (
    conversationId: string,
    text: string,
    asSender: 'customer' | 'seller' = 'customer'
  ): Promise<void> => {
    if (!text.trim() || !auth.currentUser) return;
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const nowIso = new Date().toISOString();
    const senderName =
      asSender === 'seller' ? currentSeller?.shopName || 'Seller' : user?.name || 'Customer';

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId,
      sender: asSender,
      senderUid: auth.currentUser.uid,
      senderName,
      text: text.trim(),
      createdAt: nowIso,
      productRef: conv.productRef,
      orderRef: conv.orderRef,
    };

    await saveMessageToFirestore(conversationId, newMsg, {
      lastMessageText: text.trim(),
      lastMessageTime: nowIso,
      unreadCount: asSender === 'seller' ? (conv.unreadCount || 0) + 1 : 0,
      unreadBySellerCount: asSender === 'customer' ? (conv.unreadBySellerCount || 0) + 1 : 0,
    });

    if (asSender === 'seller' && conv.customerUid) {
      await saveNotificationToFirestore({
        id: `notif-reply-${Date.now()}`,
        recipientUid: conv.customerUid,
        title: `Reply from ${conv.sellerName}`,
        message: text.trim().slice(0, 120),
        type: 'message',
        isRead: false,
        createdAt: nowIso,
        linkView: 'messages',
        linkId: conversationId,
      });
    } else if (asSender === 'customer' && conv.sellerOwnerUid) {
      await saveNotificationToFirestore({
        id: `notif-sreply-${Date.now()}`,
        recipientUid: conv.sellerOwnerUid,
        title: `Message from ${conv.customerName || 'Customer'}`,
        message: text.trim().slice(0, 120),
        type: 'message',
        isRead: false,
        createdAt: nowIso,
        sellerId: conv.sellerId,
        linkView: 'seller-messages',
        linkId: conversationId,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------------------------
  const markNotificationAsRead = async (id: string): Promise<void> => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await markNotificationReadInFirestore(id);
  };

  const clearAllNotifications = async (): Promise<void> => {
    const toDelete = [...notifications];
    setNotifications([]);
    await Promise.all(toDelete.map((n) => deleteNotificationInFirestore(n.id)));
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
        editingProductId,
        setEditingProductId,
        navigateTo,
        goBack,
        authInitialMode,
        setAuthInitialMode,
        welcomeStep,
        setWelcomeStep,
        accountPurpose,
        setAccountPurpose,
        isAuthReady,
        authGate,
        openAuthGate,
        closeAuthGate,
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
        sellerProducts,
        productsLoading,
        productsError,
        retryProductsSubscription,
        publicShops,
        publicShopsLoading,
        categories,
        cart,
        favourites,
        orders,
        sellerOrders,
        user,
        sellerAccounts: publicShops,
        currentSeller,
        conversations,
        messages,
        notifications,
        getShopById,
        loadProductById,
        loadPublicShopById,
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
        updateSellerAuthPassword,
        addSellerProduct,
        updateSellerProduct,
        deleteSellerProduct,
        toggleProductAvailability,
        startConversation,
        sendMessage,
        markNotificationAsRead,
        clearAllNotifications,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
