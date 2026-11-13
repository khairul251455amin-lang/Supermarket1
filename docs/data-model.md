# Firestore & Storage Data Model (`docs/data-model.md`)

All collection names, fields, relationships, and security constraints below reflect the active implementation in `src/services/firestoreService.ts`, `src/types/index.ts`, `firebase-blueprint.json`, `firestore.rules`, and `storage.rules`.

---

## 1. Firestore Collections

### `users/{userId}` *(Private — Owner Only)*
- **Document ID**: Firebase Auth UID (`userId == request.auth.uid`)
- **Required fields**: `id`, `name`, `email`, `createdAt`
- **Optional fields**: `phoneNumber`, `profilePhoto`, `deliveryAddress`, `favourites` (max 500 IDs), `isSeller`, `sellerId`
- **Access**: `get` / `create` / `update` only by `request.auth.uid == userId`; `list` and `delete` denied. `isSeller: true` requires ownership of the referenced `sellerAccounts/{sellerId}` document.

### `sellerAccounts/{sellerId}` *(Private PII — Seller Owner Only)*
- **Document ID**: Unique shop/seller ID (`SELL-XXXX`)
- **Required fields**: `id`, `ownerUid`, `fullName`, `shopName`, `phone`, `email`, `shopLocation`, `isOpen`, `createdAt`
- **Optional fields**: `userId`, `shopCategory`, `shopDescription`, `shopLogo`, `showSellerName`, `showSellerId`, `deliveryOptions`, `notificationPreferences`, `updatedAt`
- **Access**: Readable/listable/writable strictly where `ownerUid == request.auth.uid`.

### `publicShops/{shopId}` *(Public Storefront Metadata)*
- **Document ID**: Matches `sellerAccounts/{sellerId}` (`id == shopId == sellerId`)
- **Required fields**: `id`, `shopId`, `sellerId`, `ownerUid`, `shopName`, `shopLocation`, `isOpen`, `createdAt`
- **Optional fields**: `publicSellerName`, `shopCategory`, `shopDescription`, `shopLogo`, `showSellerName`, `showSellerId`, `deliveryOptions`, `rating`, `ratingCount`, `updatedAt`
- **Access**: Public `get` and `list` (`true`); `create` requires atomic/existing `sellerAccounts/{shopId}`; `update` locked to `ownerUid == request.auth.uid` with `rating`/`ratingCount` immutable from client SDK.

### `products/{productId}` *(Central Multi-Vendor Catalog)*
- **Required fields**: `id`, `name`, `description`, `price`, `originalPrice`, `currency`, `stock`, `stockQuantity`, `images` (array of **exactly 2** strings), `category`, `sellerName`, `shopName`, `sellerId`, `shopId`, `ownerUid`, `status`, `createdAt`
- **Allowed `status` values**: `'draft' | 'published' | 'paused' | 'out_of_stock' | 'removed'`
- **Access**:
  - Public `get` / `list`: allowed when `status == 'published'` (or owned by signed-in `ownerUid`).
  - `create` / `delete` / full `update`: strictly seller owner (`ownerUid == request.auth.uid` + verified `sellerAccounts/{sellerId}`).
  - Stock decrement `update` (Tier 2): authenticated checkout may decrement `stock` / `stockQuantity` and flip `status` to `'out_of_stock'` when stock reaches `0`.

### `orders/{orderId}` *(Customer Parent Order)*
- **Required fields**: `id`, `customerId`, `customerUid`, `customerName`, `customerPhone`, `deliveryAddress`, `items`, `subtotal`, `deliveryFee`, `total`, `paymentMethod`, `status`, `createdAt`
- **Access**: Scoped strictly to `customerUid == request.auth.uid`; customer may only cancel while `status == 'Pending'`.

### `sellerOrders/{sellerOrderId}` *(Per-Seller Fulfilment Parcel)*
- **Relationships**: `parentOrderId -> orders/{orderId}`, `sellerId -> publicShops/{sellerId}`, `sellerOwnerUid`, `customerUid`
- **Access**: Readable by `sellerOwnerUid` or `customerUid`; seller owner progresses fulfilment workflow (`Confirmed` → `Processing` → `Ready for Delivery` → `Shipped` → `Delivered`) and records `codCollected`; customer may cancel only while `Pending`. Terminal states (`Delivered`, `Cancelled`) are locked.

### `conversations/{conversationId}` + `/messages/{messageId}`
- **Relationships**: `customerUid`, `sellerId`, `sellerOwnerUid`, optional `productRef` / `orderRef`
- **Access**: Strict participant isolation (`customerUid == request.auth.uid || sellerOwnerUid == request.auth.uid`). Messages are append-only (`update, delete: if false`).

### `notifications/{notificationId}`
- **Required fields**: `id`, `recipientUid`, `title`, `message`, `type`, `isRead`, `createdAt`
- **Access**: Only `recipientUid == request.auth.uid` may read, mark read (`isRead` only), or delete.

---

## 2. Query Patterns & Indexes (`database/firestore.indexes.json`)

Every Firestore query in `src/services/firestoreService.ts` filters on a single indexed field (`status`, `ownerUid`, `customerUid`, `sellerOwnerUid`, `recipientUid`) with `limit(...)` and performs sorting in memory. Because no multi-field `where()` + `orderBy()` queries are issued, **zero composite indexes are required** (`indexes: []`), enabling instant startup from a completely empty Firestore database.

---

## 3. Firebase Storage Paths (`storage.rules`)

- `shops/{sellerId}/logo` — Shop logo asset (public read; authenticated write/delete; JPG/PNG/WEBP `<= 200 KB`)
- `products/{sellerId}/{productId}/image1` & `image2` — Required 2-photo product gallery (public read; authenticated write/delete; JPG/PNG/WEBP `<= 200 KB`)
