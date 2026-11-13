# Changelog

All notable changes to **Supermarket — Multi-Vendor Marketplace** are documented here.

## [1.0.0] - 2026-11-13
### Added
- Full multi-vendor marketplace UI/UX redesign (`#2563EB` / `#0F172A` / `#F8FAFC` design system, responsive storefront, mobile bottom navigation, integrated search).
- Public seller storefronts (`/shop/:sellerId`) and swipeable 2-photo product detail pages (`/product/:productId`) accessible without sign-in.
- Firebase Authentication, Cloud Firestore real-time subscriptions (`products`, `publicShops`, `sellerAccounts`, `users`, `orders`, `sellerOrders`, `conversations`, `notifications`), and Firebase Storage 200 KB WebP upload pipeline.
- Complete reproducibility package: `HowToSetup.md`, `.env.example`, `package-lock.json`, `firebase.json`, `database/firestore.indexes.json`, `database/seed/`, `tests/flows.test.mjs`, `docs/architecture.md`, and `docs/data-model.md`.

### Security
- Hardened `/firestore.rules` with server-side ownership checks, `sellerAccounts` verification for `isSeller` role linkage, terminal order status locking (`Delivered`, `Cancelled`), and strict field allowlists.
- Hardened `/storage.rules` to require Firebase Authentication (`request.auth != null`) for all image uploads and deletions while keeping published product/logo reads public.
