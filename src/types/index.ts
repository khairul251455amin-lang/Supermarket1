/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProductStatus =
  | 'draft'
  | 'published'
  | 'paused'
  | 'out_of_stock'
  | 'removed';

export type DeliveryMethod = 'Seller Delivery' | 'Supermarket Delivery';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  originalPrice: number;
  discountedPrice?: number; // Only supplied if genuine discount exists
  discountPercentage?: number; // Only supplied if genuine discount exists
  currency: string;
  stock: number;
  stockQuantity: number;
  images: string[];
  category: string;
  subcategory?: string;
  sellerName: string;
  shopName: string;
  sellerId: string;
  shopId: string;
  ownerUid: string;
  sellerLocation?: string;
  location?: string;
  deliveryOptions?: DeliveryMethod[];
  searchKeywords?: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  isAvailable?: boolean; // Seller can toggle availability
  isFeatured?: boolean;
  isRecommended?: boolean;
  isRemovedByModeration?: boolean;
  moderationReason?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
}

export interface Address {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  stateDivision?: string;
  postalCode: string;
  deliveryNotes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  profilePhoto?: string;
  deliveryAddress?: Address;
  favourites?: string[];
  createdAt: string;
  isSeller?: boolean;
  sellerId?: string;
}

export interface SellerAccount {
  id: string; // Permanent unique Seller ID (e.g., SELL-8291)
  ownerUid: string; // Firebase Auth UID of the shop owner
  userId?: string; // Optional linked customer User ID
  fullName: string;
  shopName: string;
  shopCategory?: string;
  phone: string;
  email: string;
  shopLocation: string;
  shopDescription: string;
  shopLogo?: string;
  isOpen: boolean; // Open or temporarily closed
  showSellerName?: boolean;
  showSellerId?: boolean;
  deliveryOptions?: DeliveryMethod[];
  createdAt: string;
  updatedAt?: string;
  notificationPreferences?: {
    orderUpdates: boolean;
    messages: boolean;
    lowStock: boolean;
  };
}

export interface PublicShop {
  id: string;
  shopId: string;
  sellerId: string;
  ownerUid: string;
  shopName: string;
  publicSellerName?: string;
  shopCategory?: string;
  shopLocation: string;
  shopDescription: string;
  shopLogo?: string;
  isOpen: boolean;
  showSellerName?: boolean;
  showSellerId?: boolean;
  deliveryOptions?: DeliveryMethod[];
  rating?: number | null;
  ratingCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Ready for Delivery'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  sellerName: string;
  sellerId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image?: string;
}

export interface SellerFulfilmentOrder {
  id: string; // e.g., SO-1042-SELL01
  parentOrderId: string;
  sellerId: string;
  sellerOwnerUid: string;
  sellerName: string;
  customerUid: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: Address;
  deliveryMethod: DeliveryMethod;
  deliveryFee: number;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'Cash on Delivery';
  codCollected?: boolean;
  rejectionReason?: string;
  readyForPickup?: boolean;
  deliveryPersonAssigned?: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerUid: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: Address;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'Cash on Delivery';
  status: OrderStatus;
  createdAt: string;
  isSimulated?: boolean;
  notes?: string;
  sellerOrders?: SellerFulfilmentOrder[];
  deliveryMethodBySeller?: Record<string, DeliveryMethod>;
}

export interface ProductReference {
  id: string;
  name: string;
  price: number;
  image?: string;
  sellerName: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'customer' | 'seller';
  senderUid?: string;
  senderName: string;
  text: string;
  createdAt: string;
  productRef?: ProductReference;
  orderRef?: { id: string; total: number };
}

export interface Conversation {
  id: string;
  sellerId: string;
  sellerOwnerUid?: string;
  sellerName: string;
  customerId: string;
  customerUid: string;
  customerName?: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
  unreadBySellerCount?: number;
  productRef?: ProductReference;
  orderRef?: { id: string; total: number };
  createdAt?: string;
}

export type NotificationType =
  | 'order'
  | 'message'
  | 'seller'
  | 'marketplace'
  | 'low_stock'
  | 'moderation';

export interface Notification {
  id: string;
  recipientUid?: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  linkView?: string;
  linkId?: string;
  sellerId?: string; // If notification is for a specific seller
}

export type AppView =
  | 'welcome'
  | 'home'
  | 'search'
  | 'product'
  | 'category'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'favourites'
  | 'messages'
  | 'notifications'
  | 'profile'
  | 'auth'
  | 'shop' // Public view of a seller shop
  | 'seller-register' // Create Seller Account
  | 'seller-dashboard'; // Seller Dashboard

export type SellerDashboardTab =
  | 'overview'
  | 'myshop'
  | 'products'
  | 'add-product'
  | 'orders'
  | 'delivery'
  | 'messages'
  | 'notifications'
  | 'settings';
