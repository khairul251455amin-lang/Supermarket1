/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Supermarket Marketplace - Firebase Cloud Firestore Architecture & Security Rules Blueprint
 * 
 * Collections Architecture:
 * 
 * 1. `users/{userId}`:
 *    - name, email, phoneNumber, profilePhoto, deliveryAddress, createdAt, isSeller, sellerId
 * 
 * 2. `sellerAccounts/{sellerId}`:
 *    - id (permanent unique Seller ID, e.g. SELL-XXXX), userId, fullName, shopName, phone, email,
 *      shopLocation, shopDescription, shopLogo, isOpen, createdAt, notificationPreferences
 * 
 * 3. `shops/{shopId}` (linked 1:1 to sellerId):
 *    - sellerId, shopName, logoUrl, bannerUrl, location, status ('open' | 'closed'), rating, followersCount
 * 
 * 4. `products/{productId}`:
 *    - name, description, category, subcategory, originalPrice, discountedPrice, discountPercentage,
 *      stock, images (exactly 2 photos: image1 and image2, <= 200 KB each, JPG/PNG/WEBP),
 *      sellerId, sellerName, sellerLocation, isAvailable, isFeatured,
 *      isRecommended, isRemovedByModeration, moderationReason, createdAt, updatedAt
 * 
 * Firebase Storage Architecture:
 * - `shops/{sellerId}/logo` (Shop logo photo, max 200 KB, public read, seller write)
 * - `products/{sellerId}/{productId}/image1` (Product Image 1, max 200 KB, public read, seller write)
 * - `products/{sellerId}/{productId}/image2` (Product Image 2, max 200 KB, public read, seller write)
 * 
 * 5. `categories/{categoryId}`:
 *    - name, slug, description, iconName, displayOrder
 * 
 * 6. `orders/{orderId}` (Customer Parent Order):
 *    - customerId, customerName, customerPhone, deliveryAddress, items, subtotal, deliveryFee,
 *      total, paymentMethod ('Cash on Delivery'), status, createdAt, deliveryMethodBySeller
 * 
 * 7. `sellerOrders/{sellerOrderId}` (Seller Fulfilment Order):
 *    - parentOrderId, sellerId, sellerName, customerName, customerPhone, deliveryAddress,
 *      items (seller-specific only), subtotal, deliveryFee, total, status, deliveryMethod
 *      ('Seller Delivery' | 'Supermarket Delivery'), codCollected, readyForPickup,
 *      rejectionReason, createdAt, updatedAt
 * 
 * 8. `deliveryAssignments/{assignmentId}`:
 *    - sellerOrderId, deliveryMethod, status ('pending_pickup' | 'in_transit' | 'delivered'),
 *      assignedCourierId, pickupAddress, destinationAddress, codAmount
 * 
 * 9. `conversations/{conversationId}`:
 *    - customerId, sellerId, sellerName, lastMessageText, lastMessageTime, unreadCount, productRef
 * 
 * 10. `conversations/{conversationId}/messages/{messageId}`:
 *     - sender ('customer' | 'seller'), senderName, text, createdAt, productRef, orderRef
 * 
 * 11. `notifications/{notificationId}`:
 *     - recipientId (userId or sellerId), title, message, type, isRead, linkView, linkId, createdAt
 * 
 * 12. `moderationLogs/{logId}`:
 *     - productId, sellerId, action ('hidden' | 'flagged' | 'restored'), reason, timestamp, moderatorId
 */

export const FIRESTORE_SECURITY_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reusable Auth Helpers
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function isSeller(sellerId) {
      return isSignedIn() && (
        request.auth.uid == sellerId || 
        request.auth.token.sellerId == sellerId
      );
    }

    // 1. Users Collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isOwner(userId);
    }

    // 2. Seller Accounts Collection
    match /sellerAccounts/{sellerId} {
      allow read: if true; // Public shop details are readable by customers
      allow create: if isSignedIn();
      allow update, delete: if isSeller(sellerId);
    }

    // 3. Products Collection
    match /products/{productId} {
      // Anyone can read active, non-moderated products
      allow read: if resource.data.isRemovedByModeration != true || isSeller(resource.data.sellerId);
      
      // Sellers can create products with their own sellerId
      allow create: if isSignedIn() && request.resource.data.sellerId == request.auth.uid;
      
      // Sellers can update or delete their own products
      allow update, delete: if isSignedIn() && resource.data.sellerId == request.auth.uid;
    }

    // 4. Customer Parent Orders
    match /orders/{orderId} {
      allow read: if isSignedIn() && (
        resource.data.customerId == request.auth.uid
      );
      allow create: if isSignedIn();
      allow update: if false; // Server authoritative
    }

    // 5. Seller Fulfilment Orders (Seller isolation)
    match /sellerOrders/{sellerOrderId} {
      allow read: if isSignedIn() && (
        resource.data.sellerId == request.auth.uid ||
        resource.data.customerId == request.auth.uid
      );
      // Only the assigned seller can update fulfilment progress (e.g., status, COD collected)
      allow update: if isSeller(resource.data.sellerId);
      allow create: if isSignedIn();
    }

    // 6. Conversations and Messages
    match /conversations/{conversationId} {
      allow read, write: if isSignedIn() && (
        resource.data.customerId == request.auth.uid ||
        resource.data.sellerId == request.auth.uid
      );
      
      match /messages/{messageId} {
        allow read, create: if isSignedIn();
      }
    }

    // 7. Notifications
    match /notifications/{notificationId} {
      allow read, update: if isSignedIn() && (
        resource.data.recipientId == request.auth.uid ||
        resource.data.sellerId == request.auth.uid
      );
    }
  }
}
`;
