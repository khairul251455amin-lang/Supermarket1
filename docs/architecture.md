# Supermarket Marketplace Architecture (`docs/architecture.md`)

## 1. Layering & Source Structure

```text
/
├── index.html                  # SPA entry document (fonts + SEO meta)
├── package.json                # Dependencies, npm scripts (dev, build, lint, test, seed)
├── package-lock.json           # Reproducible npm lockfile
├── firebase.json               # Firebase CLI config (Firestore, Storage, Hosting, Emulators)
├── firestore.rules             # Zero-trust Firestore ownership & role enforcement
├── storage.rules               # Firebase Storage 200 KB image upload rules
├── firebase-blueprint.json     # Schema IR for Firestore entities
├── .env.example                # Single clean placeholder env template
├── database/
│   ├── firestore.indexes.json  # Composite index manifest
│   └── seed/                   # Reproducible demo data & Node seed runner
├── tests/
│   ├── flows.test.mjs          # 5 automated end-to-end flow tests
│   └── E2E_TEST_FLOWS.md       # Interactive QA checklist
├── docs/
│   ├── architecture.md         # System architecture overview
│   └── data-model.md           # Firestore & Storage data model
└── src/
    ├── config/                 # Runtime branding & delivery config (marketplaceConfig.ts)
    ├── data/                   # Static category definitions (categories.ts)
    ├── types/                  # TypeScript interfaces (types/index.ts)
    ├── services/               # Firebase SDK init, Firestore queries, Storage & image compression
    ├── context/                # Central MarketplaceProvider (auth observer + live streams)
    └── components/
        ├── layout/             # Navbar, BottomNav, AnnouncementBar, Footer
        ├── common/             # ProductCard, PhotoUploader, EmptyState, CategoryIcon
        ├── modals/             # AuthRequiredModal
        ├── views/              # Storefront, Search, Category, ProductDetail, PublicShop, Cart, Checkout, Orders, Favourites, Messages, Notifications, Profile, Welcome, Auth
        └── seller/             # SellerRegistrationView, SellerDashboard & 9 modular vendor tabs
```

## 2. Public vs Authenticated Boundaries

- **Unauthenticated Visitors** can immediately browse `/` (Home), `/search`, `/category/:slug`, `/product/:id`, and `/shop/:id`, subscribing only to `products` where `status == 'published'` and `publicShops`.
- **Authenticated Customers** gain Firestore-backed `/users/{uid}` profiles, saved favourites, multi-vendor Cash on Delivery order placement (`/orders` + split `/sellerOrders`), real-time buyer–seller messaging (`/conversations`), and order/message notifications.
- **Authenticated Sellers** register via Firebase Auth, receive an atomic `sellerAccounts/{sellerId}` + `publicShops/{sellerId}` pair, upload compressed <= 200 KB WebP product photos, publish items globally, and manage order fulfilment (`Pending` → `Delivered`) and COD collection.

## 3. Image Optimization Pipeline

`src/services/imageCompression.ts` + `src/services/firebaseStorage.ts`:
1. Validates MIME/extension (`JPG`, `JPEG`, `PNG`, `WEBP`).
2. Resizes max dimension to `1200px` and iteratively compresses to WebP (or JPEG fallback) targeting 50–160 KB (strict ceiling `< 200 KB`).
3. Uploads to Firebase Storage (`products/{sellerId}/{productId}/image1|2` or `shops/{sellerId}/logo`) with timeout guard and compressed WebP fallback so mobile sellers never stall.
