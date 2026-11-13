# End-to-End Flow Test Suite (`tests/E2E_TEST_FLOWS.md`)

Supermarket verifies five core multi-vendor marketplace user journeys via both automated tests (`npm test`) and interactive live-URL verification.

## Automated Execution

```bash
# Run offline unit + rules-alignment + checkout/fulfilment flow tests
npm test

# Run tests with live local dev/preview server route assertions
TEST_BASE_URL=http://localhost:3000 npm test
```

---

## Flow Descriptions & Acceptance Criteria

### TEST 1: Public Visitor → Browse Marketplace → Search Product → Open Product Details
1. Open the app URL without signing in (incognito window or second mobile browser).
2. Confirm the storefront renders immediately (no login wall and no development banners).
3. Verify published products appear (`AeroPulse Wireless ANC Headphones`, `ChronoCraft Field Automatic Watch`, etc.) while `status: "draft"` items remain hidden.
4. Type `AeroPulse` into the top search bar and press Enter.
5. Open the product card and verify:
   - Swipeable 2-photo viewer (`1/2` / `2/2` indicator)
   - Original vs discounted price and discount badge
   - Shop card linking to `/shop/SELL-DEMO01` without requiring login

### TEST 2: Seller → Login → Create Product → Upload Images → Publish → Verify Public Visibility
1. Navigate to **Profile / Welcome → I'm a Seller → Existing Seller Sign In**.
2. Sign in with `demo-seller@example.com` / `DemoPass!2026`.
3. Open **Seller Dashboard → Add Product**.
4. Select **Product Image 1** and **Product Image 2** from device storage (client compresses to WebP/JPEG <= 200 KB and stores via Firebase Storage).
5. Enter title, category, price, and stock (`> 0`) and click **Publish Product Live**.
6. Open an unauthenticated browser tab and confirm the new product appears on the public Home feed and Search page immediately.

### TEST 3: Customer → Login → Browse Product → Add to Cart → Place Demo Order
1. Sign in as `demo-customer@example.com` / `DemoPass!2026`.
2. Open a published product and click **Add to Cart**.
3. Open **Cart → Proceed to Checkout**.
4. Fill delivery address and select delivery option (`Seller Delivery` or `Supermarket Delivery`).
5. Click **Confirm Order (Cash on Delivery)**.
6. Verify confirmation ID (`ORD-...`), automatic stock decrement in Firestore, and order entry under **My Orders**.

### TEST 4: Seller → Login → Open Orders → Update Order Status → Verify Customer Order Status
1. Sign in as `demo-seller@example.com`.
2. Open **Seller Dashboard → Orders**.
3. Locate the `Pending` fulfilment order (`SO-...`) and progress through:
   - **Confirm Order** → **Start Processing (Packing)** → **Mark Ready for Delivery** → **Dispatch / Mark Shipped** → **Mark Delivered**.
4. In the **Customer** account under **My Orders**, verify the real-time status badge reflects the updated state.

### TEST 5: Customer → Login → Favorite Product → Open Favorites → Message Seller
1. Sign in as `demo-customer@example.com`.
2. Tap the **Heart (Favourite)** overlay button on any product card or product detail viewer.
3. Open **Favourites** and verify the saved item persists across reload (stored in `/users/{uid}.favourites`).
4. Open the product detail page and tap **Contact Seller**, send a message, and confirm it arrives in the **Seller Dashboard → Messages** inbox (`conversations/{id}/messages`).
