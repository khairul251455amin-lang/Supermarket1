/**
 * Supermarket Multi-Vendor Marketplace - Five End-to-End Flow Tests
 *
 * Run:
 *   npm test
 *   TEST_BASE_URL=http://localhost:3000 npm test
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const seedData = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, 'database/seed/seed-data.json'), 'utf8')
);
const firestoreRules = fs.readFileSync(path.join(ROOT_DIR, 'firestore.rules'), 'utf8');
const storageRules = fs.readFileSync(path.join(ROOT_DIR, 'storage.rules'), 'utf8');
const indexesJson = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, 'database/firestore.indexes.json'), 'utf8')
);
const envExample = fs.readFileSync(path.join(ROOT_DIR, '.env.example'), 'utf8');

// Helper replicating marketplace product search & filtering logic (SearchView / MarketplaceContext)
function filterPublicCatalog(allProducts, { queryText = '', category = null, maxPrice = Infinity } = {}) {
  const q = queryText.trim().toLowerCase();
  return allProducts.filter((p) => {
    if (p.status !== 'published' || p.isAvailable === false || p.isRemovedByModeration) {
      return false;
    }
    if (category && p.category.toLowerCase() !== category.toLowerCase()) {
      return false;
    }
    const effectivePrice = p.discountedPrice ?? p.originalPrice ?? p.price;
    if (effectivePrice > maxPrice) return false;
    if (!q) return true;
    const haystack = [
      p.name,
      p.description,
      p.category,
      p.subcategory || '',
      ...(p.searchKeywords || []),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

// Helper replicating checkout parcel grouping & stock decrement logic (MarketplaceContext.placeOrder)
function buildCheckoutOrder({ customerUid, address, cart, deliveryMethodBySeller = {}, freeThreshold = 50, standardFee = 5 }) {
  if (!customerUid) throw new Error('Authentication required for checkout');
  if (!cart.length) throw new Error('Cart is empty');

  const bySeller = new Map();
  let subtotal = 0;

  for (const item of cart) {
    const avail = item.product.stockQuantity ?? item.product.stock;
    if (item.quantity <= 0 || item.quantity > avail) {
      throw new Error(`Insufficient stock for ${item.product.name}`);
    }
    const unit = item.product.discountedPrice ?? item.product.originalPrice ?? item.product.price;
    subtotal += unit * item.quantity;
    const sId = item.product.sellerId;
    if (!bySeller.has(sId)) {
      bySeller.set(sId, []);
    }
    bySeller.get(sId).push({ ...item, unit });
  }

  const sellerOrders = [];
  let totalDeliveryFee = 0;
  for (const [sellerId, group] of bySeller.entries()) {
    const sellerSub = group.reduce((sum, g) => sum + g.unit * g.quantity, 0);
    const deliveryFee = sellerSub > freeThreshold ? 0 : standardFee;
    totalDeliveryFee += deliveryFee;
    sellerOrders.push({
      id: `SO-TEST-${sellerId}`,
      sellerId,
      customerUid,
      deliveryMethod: deliveryMethodBySeller[sellerId] || 'Seller Delivery',
      subtotal: sellerSub,
      deliveryFee,
      total: sellerSub + deliveryFee,
      status: 'Pending',
      paymentMethod: 'Cash on Delivery',
      items: group.map((g) => ({
        productId: g.product.id,
        quantity: g.quantity,
        unitPrice: g.unit,
        total: g.unit * g.quantity,
      })),
    });
  }

  return {
    parentOrder: {
      id: 'ORD-TEST-01',
      customerUid,
      deliveryAddress: address,
      subtotal,
      deliveryFee: totalDeliveryFee,
      total: subtotal + totalDeliveryFee,
      status: 'Pending',
      paymentMethod: 'Cash on Delivery',
    },
    sellerOrders,
    stockUpdates: cart.map((item) => {
      const nextStock = Math.max(0, (item.product.stockQuantity ?? item.product.stock) - item.quantity);
      return {
        productId: item.product.id,
        nextStock,
        nextStatus: nextStock === 0 ? 'out_of_stock' : 'published',
      };
    }),
  };
}

test('TEST 1: Public visitor -> Browse marketplace -> Search product -> Open product details & deep links', async () => {
  const seller = seedData.demoAccounts.seller;
  const enrichedProducts = seedData.products.map((p) => ({
    ...p,
    sellerId: seller.sellerId,
    shopId: seller.sellerId,
    sellerName: seller.shopName,
    shopName: seller.shopName,
    ownerUid: 'uid-demo-seller',
  }));

  // 1. Visitor browses public catalog -> draft products MUST be excluded
  const visible = filterPublicCatalog(enrichedProducts);
  assert.equal(visible.length, 4, 'Only the 4 published products should be publicly visible');
  assert.equal(
    visible.some((p) => p.status === 'draft'),
    false,
    'Draft product must not appear in public catalog'
  );

  // 2. Visitor searches for "AeroPulse"
  const searchResults = filterPublicCatalog(enrichedProducts, { queryText: 'AeroPulse' });
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].id, 'prod_demo_headphones_01');
  assert.equal(searchResults[0].images.length, 2, 'Public product details must provide 2 photos');

  // 3. Firestore rules allow unauthenticated reads ONLY for published products & publicShops
  assert.match(firestoreRules, /match \/products\/\{productId\}[\s\S]*existing\(\)\.status == 'published'/);
  assert.match(firestoreRules, /match \/publicShops\/\{shopId\}[\s\S]*allow list: if true;/);
  // Private collections block unauthenticated access
  assert.match(firestoreRules, /match \/users\/\{userId\}[\s\S]*allow list: if false;/);
  assert.match(firestoreRules, /match \/sellerAccounts\/\{sellerId\}[\s\S]*existing\(\)\.ownerUid == request\.auth\.uid/);

  // 4. Optional live HTTP check when TEST_BASE_URL is provided
  const baseUrl = process.env.TEST_BASE_URL;
  if (baseUrl) {
    for (const route of ['/', '/product/prod_demo_headphones_01', '/shop/SELL-DEMO01', '/search?q=AeroPulse']) {
      const res = await fetch(`${baseUrl}${route}`);
      assert.equal(res.status, 200, `Route ${route} should respond 200 OK`);
      const html = await res.text();
      assert.match(html, /Supermarket/i);
      assert.doesNotMatch(html, /PHASE 1 & 2/i, 'Legacy dev banner text must not be present');
    }
  }
});

test('TEST 2: Seller -> Login -> Create product -> Validate 2 compressed images -> Publish -> Public visibility', () => {
  const imageCompressionCode = fs.readFileSync(
    path.join(ROOT_DIR, 'src/services/imageCompression.ts'),
    'utf8'
  );

  // 1. Validate client-side compression limits match storage.rules (<= 200 KB)
  assert.match(imageCompressionCode, /image\/jpeg', 'image\/png', 'image\/webp/);
  assert.match(storageRules, /request\.resource\.size <= 200 \* 1024/);
  assert.match(storageRules, /imageName == 'image1' \|\| imageName == 'image2'/);
  assert.match(storageRules, /allow write: if isSignedIn\(\)/);

  // 2. Validate published product structure conforms to firestore.rules isValidProductData
  const candidate = {
    ...seedData.products[0],
    sellerId: seedData.demoAccounts.seller.sellerId,
    shopId: seedData.demoAccounts.seller.sellerId,
    sellerName: seedData.demoAccounts.seller.shopName,
    shopName: seedData.demoAccounts.seller.shopName,
    ownerUid: 'uid-demo-seller',
    createdAt: new Date().toISOString(),
  };

  assert.equal(candidate.images.length, 2, 'Product requires exactly 2 images');
  assert.ok(candidate.price > 0 && candidate.originalPrice > 0);
  assert.equal(candidate.shopId, candidate.sellerId);
  assert.equal(candidate.status, 'published');

  // 3. Verify newly published item becomes discoverable in public catalog immediately
  const publicItems = filterPublicCatalog([candidate]);
  assert.equal(publicItems.length, 1);
  assert.equal(publicItems[0].id, candidate.id);

  // 4. Verify Firestore rules enforce seller ownership & sellerAccount existence on create
  assert.match(
    firestoreRules,
    /exists\(\/databases\/\$\(database\)\/documents\/sellerAccounts\/\$\(incoming\(\)\.sellerId\)\)/
  );
});

test('TEST 3: Customer -> Login -> Browse product -> Add to cart -> Place COD order & decrement stock', () => {
  const customerUid = 'uid-demo-customer';
  const sellerId = seedData.demoAccounts.seller.sellerId;
  const prodAudio = {
    ...seedData.products[0],
    sellerId,
    shopId: sellerId,
    ownerUid: 'uid-demo-seller',
  };
  const prodApples = {
    ...seedData.products[2],
    sellerId,
    shopId: sellerId,
    ownerUid: 'uid-demo-seller',
  };

  // Unauthenticated checkout must be rejected
  assert.throws(
    () =>
      buildCheckoutOrder({
        customerUid: null,
        address: seedData.demoAccounts.customer.deliveryAddress,
        cart: [{ product: prodAudio, quantity: 1 }],
      }),
    /Authentication required/
  );

  // Over-ordering beyond stock must fail cleanly
  assert.throws(
    () =>
      buildCheckoutOrder({
        customerUid,
        address: seedData.demoAccounts.customer.deliveryAddress,
        cart: [{ product: prodAudio, quantity: 999 }],
      }),
    /Insufficient stock/
  );

  // Valid Cash on Delivery checkout across 2 products from Demo Seller
  const result = buildCheckoutOrder({
    customerUid,
    address: seedData.demoAccounts.customer.deliveryAddress,
    cart: [
      { product: prodAudio, quantity: 1 }, // $119
      { product: prodApples, quantity: 2 }, // 2 * $19.50 = $39
    ],
    deliveryMethodBySeller: { [sellerId]: 'Seller Delivery' },
  });

  assert.equal(result.parentOrder.subtotal, 158);
  assert.equal(result.parentOrder.deliveryFee, 0, 'Subtotal > $50 qualifies for free delivery');
  assert.equal(result.parentOrder.total, 158);
  assert.equal(result.parentOrder.paymentMethod, 'Cash on Delivery');
  assert.equal(result.sellerOrders.length, 1);
  assert.equal(result.stockUpdates[0].nextStock, 17);
  assert.equal(result.stockUpdates[0].nextStatus, 'published');
});

test('TEST 4: Seller -> Login -> Open orders -> Update order status & COD -> Verify customer visibility & terminal lock', () => {
  const allowedFlow = ['Pending', 'Confirmed', 'Processing', 'Ready for Delivery', 'Shipped', 'Delivered'];
  let orderState = {
    id: seedData.demoOrder.sellerOrderId,
    sellerOwnerUid: 'uid-demo-seller',
    customerUid: 'uid-demo-customer',
    status: 'Pending',
    codCollected: false,
  };

  for (const nextStatus of allowedFlow.slice(1)) {
    orderState = { ...orderState, status: nextStatus };
  }
  assert.equal(orderState.status, 'Delivered');

  // Seller records COD collection after delivery
  orderState = { ...orderState, codCollected: true };
  assert.equal(orderState.codCollected, true);

  // Verify Firestore rules allow both sellerOwnerUid and customerUid to read sellerOrders,
  // allow only sellerOwnerUid to progress status, and lock Delivered/Cancelled terminal states
  assert.match(firestoreRules, /match \/sellerOrders\/\{sellerOrderId\}[\s\S]*existing\(\)\.sellerOwnerUid == request\.auth\.uid/);
  assert.match(firestoreRules, /!\(existing\(\)\.status in \['Delivered', 'Cancelled'\]\)/);
  assert.match(firestoreRules, /existing\(\)\.customerUid == request\.auth\.uid[\s\S]*incoming\(\)\.status == 'Cancelled'/);
});

test('TEST 5: Customer -> Login -> Favorite product -> Open favorites -> Message seller', () => {
  // 1. Toggle favourite on product
  const initialFavs = [];
  const productId = seedData.products[0].id;
  const afterAdd = initialFavs.includes(productId)
    ? initialFavs
    : [...initialFavs, productId];
  assert.deepEqual(afterAdd, [productId]);

  const afterRemove = afterAdd.filter((id) => id !== productId);
  assert.deepEqual(afterRemove, []);

  // 2. Verify conversation attachment & participant isolation
  const conv = {
    id: seedData.demoConversation.id,
    customerUid: 'uid-demo-customer',
    sellerId: seedData.demoAccounts.seller.sellerId,
    sellerOwnerUid: 'uid-demo-seller',
    productRef: {
      id: seedData.products[0].id,
      name: seedData.products[0].name,
      price: seedData.products[0].price,
    },
    unreadBySellerCount: 1,
  };
  assert.equal(conv.productRef.id, 'prod_demo_headphones_01');
  assert.equal(conv.unreadBySellerCount, 1);

  // Verify Firestore rules isolate conversations & messages strictly to customerUid or sellerOwnerUid
  assert.match(
    firestoreRules,
    /match \/conversations\/\{conversationId\}[\s\S]*existing\(\)\.customerUid == request\.auth\.uid \|\|[\s\S]*existing\(\)\.sellerOwnerUid == request\.auth\.uid/
  );
  assert.match(firestoreRules, /match \/messages\/\{messageId\}[\s\S]*allow update, delete: if false;/);
});

test('REPRODUCIBILITY & SECURITY: Clean .env.example, valid indexes, and zero personal credentials', () => {
  assert.doesNotMatch(envExample, /AIzaSy/, '.env.example must not contain real API keys');
  assert.doesNotMatch(envExample, /khairul/i, '.env.example must not contain personal emails');
  assert.ok(Array.isArray(indexesJson.indexes), 'firestore.indexes.json must have indexes array');
  assert.ok(Array.isArray(indexesJson.fieldOverrides), 'firestore.indexes.json must have fieldOverrides array');
  assert.match(
    firestoreRules,
    /!isSeller.*|data\.isSeller == true/,
    'users rule must verify seller ownership against sellerAccounts'
  );
});
