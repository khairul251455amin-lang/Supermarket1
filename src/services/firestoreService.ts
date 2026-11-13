/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebaseConfig';
import {
  Product,
  ProductStatus,
  User,
  SellerAccount,
  PublicShop,
  Order,
  SellerFulfilmentOrder,
  Conversation,
  Message,
  Notification,
} from '../types';

/**
 * Recursively strips undefined keys from an object before writing to Firestore
 * (Firestore rejects explicit `undefined` values).
 */
export function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = stripUndefined(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Estimates serialized UTF-8 byte length of a Firestore document payload
 * to prevent exceeding the 1 MB Firestore document ceiling.
 */
export function estimateDocSizeBytes(data: unknown): number {
  return new TextEncoder().encode(JSON.stringify(data)).length;
}

// ---------------------------------------------------------------------------
// PUBLIC CATALOG & SHOPS (No Authentication Required)
// ---------------------------------------------------------------------------

/**
 * Real-time subscription to published marketplace products.
 * Accessible by visitors, customers, and sellers on any device.
 */
export function subscribeToPublishedProducts(
  onData: (products: Product[]) => void,
  onError: (err: Error) => void,
  maxItems = 100
): Unsubscribe {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('status', '==', 'published'), limit(maxItems));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        if (data && data.status === 'published' && data.isAvailable !== false && !data.isRemovedByModeration) {
          items.push({ ...data, id: data.id || docSnap.id });
        }
      });
      // Sort newest first by publishedAt or createdAt
      items.sort((a, b) => {
        const tA = new Date(a.publishedAt || a.createdAt).getTime();
        const tB = new Date(b.publishedAt || b.createdAt).getTime();
        return tB - tA;
      });
      onData(items);
    },
    (error) => {
      console.error('[Firestore] subscribeToPublishedProducts failed:', error);
      onError(error instanceof Error ? error : new Error('Failed to load marketplace products.'));
    }
  );
}

/**
 * Real-time subscription to public shop storefronts.
 */
export function subscribeToPublicShops(
  onData: (shops: PublicShop[]) => void,
  onError?: (err: Error) => void,
  maxItems = 100
): Unsubscribe {
  const shopsRef = collection(db, 'publicShops');
  const q = query(shopsRef, limit(maxItems));

  return onSnapshot(
    q,
    (snapshot) => {
      const shops: PublicShop[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as PublicShop;
        shops.push({ ...data, id: data.id || docSnap.id });
      });
      shops.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(shops);
    },
    (error) => {
      console.error('[Firestore] subscribeToPublicShops failed:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error('Failed to load seller shops.'));
      }
    }
  );
}

/**
 * Fetches a single product by ID directly from Firestore (useful for deep links).
 */
export async function fetchProductById(productId: string): Promise<Product | null> {
  const path = `products/${productId}`;
  try {
    const snap = await getDoc(doc(db, 'products', productId));
    if (!snap.exists()) return null;
    const data = snap.data() as Product;
    return { ...data, id: data.id || snap.id };
  } catch (error) {
    // Unauthenticated visitors reading a non-published product receive permission-denied -> treat as unavailable
    const msg = error instanceof Error ? error.message.toLowerCase() : '';
    if (msg.includes('permission') || msg.includes('insufficient')) {
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Fetches a single public shop by ID directly from Firestore.
 */
export async function fetchPublicShopById(shopId: string): Promise<PublicShop | null> {
  const path = `publicShops/${shopId}`;
  try {
    const snap = await getDoc(doc(db, 'publicShops', shopId));
    if (!snap.exists()) return null;
    const data = snap.data() as PublicShop;
    return { ...data, id: data.id || snap.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ---------------------------------------------------------------------------
// SELLER OWNED PRODUCTS & STOREFRONT MANAGEMENT
// ---------------------------------------------------------------------------

/**
 * Real-time subscription to all products owned by the authenticated seller
 * (includes draft, published, paused, out_of_stock).
 */
export function subscribeToSellerOwnedProducts(
  ownerUid: string,
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('ownerUid', '==', ownerUid), limit(200));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        if (data.status !== 'removed') {
          items.push({ ...data, id: data.id || docSnap.id });
        }
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      console.error('[Firestore] subscribeToSellerOwnedProducts failed:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  const payload = stripUndefined(product);
  const byteSize = estimateDocSizeBytes(payload);
  if (byteSize > 920 * 1024) {
    throw new Error(
      'Image payload is too large for database storage. Please upload compressed photos under 160 KB each.'
    );
  }

  const path = `products/${product.id}`;
  try {
    await setDoc(doc(db, 'products', product.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateProductInFirestore(
  productId: string,
  fullUpdatedProduct: Product
): Promise<void> {
  const payload = stripUndefined(fullUpdatedProduct);
  const byteSize = estimateDocSizeBytes(payload);
  if (byteSize > 920 * 1024) {
    throw new Error('Updated product payload exceeds 920 KB size limit.');
  }

  const path = `products/${productId}`;
  try {
    await setDoc(doc(db, 'products', productId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function decrementProductStockInFirestore(
  productId: string,
  newStock: number,
  newStatus: ProductStatus
): Promise<void> {
  const path = `products/${productId}`;
  try {
    await updateDoc(doc(db, 'products', productId), {
      stock: newStock,
      stockQuantity: newStock,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------------------------------------------------------
// USERS & SELLER PROFILES
// ---------------------------------------------------------------------------

export async function getUserProfileFromFirestore(uid: string): Promise<User | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as User) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfileToFirestore(user: User): Promise<void> {
  const payload = stripUndefined(user);
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getSellerAccountByOwnerUid(ownerUid: string): Promise<SellerAccount | null> {
  const path = 'sellerAccounts';
  try {
    const q = query(collection(db, 'sellerAccounts'), where('ownerUid', '==', ownerUid), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as SellerAccount;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function buildPublicShopFromSeller(seller: SellerAccount): PublicShop {
  return stripUndefined({
    id: seller.id,
    shopId: seller.id,
    sellerId: seller.id,
    ownerUid: seller.ownerUid,
    shopName: seller.shopName,
    publicSellerName: seller.showSellerName !== false ? seller.fullName : undefined,
    shopCategory: seller.shopCategory || 'General Store',
    shopLocation: seller.shopLocation,
    shopDescription: seller.shopDescription,
    shopLogo: seller.shopLogo,
    isOpen: seller.isOpen,
    showSellerName: seller.showSellerName ?? true,
    showSellerId: seller.showSellerId ?? true,
    deliveryOptions: seller.deliveryOptions || ['Seller Delivery', 'Supermarket Delivery'],
    rating: null,
    ratingCount: 0,
    createdAt: seller.createdAt,
    updatedAt: seller.updatedAt || seller.createdAt,
  });
}

export async function createOrUpdateSellerAndPublicShop(seller: SellerAccount): Promise<void> {
  const cleanSeller = stripUndefined(seller);
  const publicShop = buildPublicShopFromSeller(cleanSeller);

  const batch = writeBatch(db);
  batch.set(doc(db, 'sellerAccounts', cleanSeller.id), cleanSeller);
  batch.set(doc(db, 'publicShops', publicShop.id), publicShop);

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `sellerAccounts/${cleanSeller.id}`);
  }
}

// ---------------------------------------------------------------------------
// ORDERS & FULFILMENT
// ---------------------------------------------------------------------------

export function subscribeToCustomerOrders(
  customerUid: string,
  onData: (orders: Order[]) => void
): Unsubscribe {
  const q = query(collection(db, 'orders'), where('customerUid', '==', customerUid), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      const list: Order[] = [];
      snap.forEach((d) => list.push(d.data() as Order));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      console.error('[Firestore] subscribeToCustomerOrders error:', error);
    }
  );
}

export function subscribeToSellerFulfilmentOrders(
  ownerUid: string,
  asRole: 'seller' | 'customer',
  onData: (orders: SellerFulfilmentOrder[]) => void
): Unsubscribe {
  const field = asRole === 'seller' ? 'sellerOwnerUid' : 'customerUid';
  const q = query(collection(db, 'sellerOrders'), where(field, '==', ownerUid), limit(150));
  return onSnapshot(
    q,
    (snap) => {
      const list: SellerFulfilmentOrder[] = [];
      snap.forEach((d) => list.push(d.data() as SellerFulfilmentOrder));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      console.error('[Firestore] subscribeToSellerFulfilmentOrders error:', error);
    }
  );
}

export async function saveOrderAndFulfilmentsToFirestore(
  order: Order,
  sellerOrders: SellerFulfilmentOrder[]
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, 'orders', order.id), stripUndefined(order));
  sellerOrders.forEach((so) => {
    batch.set(doc(db, 'sellerOrders', so.id), stripUndefined(so));
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${order.id}`);
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  status: string
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateSellerFulfilmentInFirestore(
  sellerOrderId: string,
  updates: Partial<SellerFulfilmentOrder>
): Promise<void> {
  const path = `sellerOrders/${sellerOrderId}`;
  try {
    await updateDoc(doc(db, 'sellerOrders', sellerOrderId), stripUndefined(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------------------------------------------------------
// CONVERSATIONS, MESSAGES & NOTIFICATIONS
// ---------------------------------------------------------------------------

export function subscribeToConversationsForUser(
  uid: string,
  field: 'customerUid' | 'sellerOwnerUid',
  onData: (conversations: Conversation[]) => void
): Unsubscribe {
  const q = query(collection(db, 'conversations'), where(field, '==', uid), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      const list: Conversation[] = [];
      snap.forEach((d) => list.push(d.data() as Conversation));
      list.sort(
        (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
      onData(list);
    },
    (error) => {
      console.error('[Firestore] subscribeToConversations error:', error);
    }
  );
}

export function subscribeToConversationMessages(
  conversationId: string,
  onData: (messages: Message[]) => void
): Unsubscribe {
  const q = query(collection(db, 'conversations', conversationId, 'messages'), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const list: Message[] = [];
      snap.forEach((d) => list.push(d.data() as Message));
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onData(list);
    },
    (error) => {
      console.error('[Firestore] subscribeToConversationMessages error:', error);
    }
  );
}

export async function saveConversationToFirestore(conv: Conversation): Promise<void> {
  const path = `conversations/${conv.id}`;
  try {
    await setDoc(doc(db, 'conversations', conv.id), stripUndefined(conv));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveMessageToFirestore(
  conversationId: string,
  msg: Message,
  convUpdates: Partial<Conversation>
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, 'conversations', conversationId, 'messages', msg.id), stripUndefined(msg));
  batch.update(doc(db, 'conversations', conversationId), stripUndefined(convUpdates));

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `conversations/${conversationId}/messages/${msg.id}`);
  }
}

export function subscribeToUserNotifications(
  recipientUid: string,
  onData: (notifs: Notification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', recipientUid),
    limit(100)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: Notification[] = [];
      snap.forEach((d) => list.push(d.data() as Notification));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      console.error('[Firestore] subscribeToUserNotifications error:', error);
    }
  );
}

export async function saveNotificationToFirestore(notif: Notification): Promise<void> {
  if (!notif.recipientUid) return;
  const path = `notifications/${notif.id}`;
  try {
    await setDoc(doc(db, 'notifications', notif.id), stripUndefined(notif));
  } catch (error) {
    console.warn('[Firestore] saveNotification warning:', error);
  }
}

export async function markNotificationReadInFirestore(notifId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notifId), { isRead: true });
  } catch (error) {
    console.warn('[Firestore] markNotificationRead warning:', error);
  }
}

export async function deleteNotificationInFirestore(notifId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', notifId));
  } catch (error) {
    console.warn('[Firestore] deleteNotification warning:', error);
  }
}
