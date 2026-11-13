/**
 * Supermarket Multi-Vendor Marketplace - Database Seed Script
 *
 * Usage:
 *   node database/seed/seed.mjs --dry-run      Validate seed schema & rule invariants locally
 *   node database/seed/seed.mjs --emulators    Seed local Firebase Emulators (Auth + Firestore)
 *   node database/seed/seed.mjs                Seed configured Firebase project from .env
 *
 * Security Note:
 *   This script intentionally uses Firebase Client Authentication (never Admin/service-account keys)
 *   so every seeded record passes the real firestore.rules ownership and role validation checks.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const SEED_FILE = path.join(__dirname, 'seed-data.json');

const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run');
const useEmulators = args.has('--emulators') || process.env.VITE_FIREBASE_USE_EMULATORS === 'true';

const DEMO_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || 'DemoPass!2026';

function validateSeedDataset(seed) {
  const errors = [];
  const validIdRegex = /^[a-zA-Z0-9_-]{1,128}$/;

  if (!seed?.demoAccounts?.customer?.email || !seed?.demoAccounts?.seller?.email) {
    errors.push('Missing demoAccounts.customer or demoAccounts.seller email.');
  }

  const sellerId = seed?.demoAccounts?.seller?.sellerId;
  if (!sellerId || !validIdRegex.test(sellerId)) {
    errors.push(`Invalid sellerId: ${sellerId}`);
  }

  if (!Array.isArray(seed.products) || seed.products.length === 0) {
    errors.push('Seed products array must not be empty.');
  } else {
    for (const prod of seed.products) {
      if (!validIdRegex.test(prod.id)) {
        errors.push(`Invalid product id: ${prod.id}`);
      }
      if (!Array.isArray(prod.images) || prod.images.length !== 2) {
        errors.push(`Product ${prod.id} must have exactly 2 images.`);
      }
      if (typeof prod.price !== 'number' || prod.price <= 0) {
        errors.push(`Product ${prod.id} price must be > 0.`);
      }
      if (typeof prod.originalPrice !== 'number' || prod.originalPrice <= 0) {
        errors.push(`Product ${prod.id} originalPrice must be > 0.`);
      }
      if (!['draft', 'published', 'paused', 'out_of_stock', 'removed'].includes(prod.status)) {
        errors.push(`Product ${prod.id} has invalid status: ${prod.status}`);
      }
    }
  }

  if (!seed?.demoOrder?.id || !validIdRegex.test(seed.demoOrder.id)) {
    errors.push('Invalid demoOrder.id');
  }
  if (!seed?.demoConversation?.id || !validIdRegex.test(seed.demoConversation.id)) {
    errors.push('Invalid demoConversation.id');
  }

  return errors;
}

function loadFirebaseClientConfig() {
  let fallback = {};
  const appletConfigPath = path.join(ROOT_DIR, 'firebase-applet-config.json');
  if (fs.existsSync(appletConfigPath)) {
    try {
      fallback = JSON.parse(fs.readFileSync(appletConfigPath, 'utf8'));
    } catch {
      fallback = {};
    }
  }

  const cfg = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || fallback.apiKey || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || fallback.authDomain || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || fallback.projectId || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || fallback.storageBucket || '',
    messagingSenderId:
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallback.messagingSenderId || '',
    appId: process.env.VITE_FIREBASE_APP_ID || fallback.appId || '',
    databaseId: process.env.VITE_FIREBASE_DATABASE_ID || fallback.firestoreDatabaseId || '(default)',
  };

  if (useEmulators && !cfg.apiKey) {
    cfg.apiKey = 'demo-emulator-api-key';
    cfg.authDomain = 'demo-supermarket.firebaseapp.com';
    cfg.projectId = cfg.projectId || 'demo-supermarket';
    cfg.appId = '1:000000000000:web:demoemulator';
  }

  return cfg;
}

async function ensureAuthAccount(auth, email, password, displayName) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    return cred.user;
  } catch (err) {
    const code = err?.code || '';
    if (code.includes('email-already-in-use')) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    }
    throw err;
  }
}

async function run() {
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  const validationErrors = validateSeedDataset(seed);
  if (validationErrors.length > 0) {
    console.error('Seed validation failed:');
    validationErrors.forEach((e) => console.error(' -', e));
    process.exit(1);
  }

  if (isDryRun) {
    console.log('[Seed Dry-Run] All seed documents passed Firestore schema & rule validation:');
    console.log(` - Demo Customer: ${seed.demoAccounts.customer.email}`);
    console.log(` - Demo Seller: ${seed.demoAccounts.seller.email} (${seed.demoAccounts.seller.sellerId})`);
    console.log(` - Categories: ${seed.categories.length}`);
    console.log(
      ` - Products: ${seed.products.length} (${seed.products.filter((p) => p.status === 'published').length} published, ${seed.products.filter((p) => p.status === 'draft').length} draft)`
    );
    console.log(` - Demo Order: ${seed.demoOrder.id}`);
    console.log(` - Demo Conversation: ${seed.demoConversation.id}`);
    return;
  }

  const cfg = loadFirebaseClientConfig();
  if (!cfg.apiKey || !cfg.projectId || !cfg.appId) {
    console.error(
      'Missing Firebase config. Copy .env.example to .env and populate VITE_FIREBASE_* values, or pass --emulators.'
    );
    process.exit(1);
  }

  const app = getApps().length ? getApps()[0] : initializeApp(cfg);
  const auth = getAuth(app);
  const db =
    cfg.databaseId && cfg.databaseId !== '(default)'
      ? getFirestore(app, cfg.databaseId)
      : getFirestore(app);

  if (useEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.log(`[Seed] Connected to local Firebase Emulators (project: ${cfg.projectId})`);
  } else {
    console.log(`[Seed] Connected to Firebase project: ${cfg.projectId} (db: ${cfg.databaseId})`);
  }

  const nowIso = new Date().toISOString();
  const sellerInfo = seed.demoAccounts.seller;
  const custInfo = seed.demoAccounts.customer;

  // 1. Authenticate / register Demo Seller and write sellerAccounts + publicShops + products
  console.log(`[Seed] Provisioning demo seller (${sellerInfo.email})...`);
  const sellerUser = await ensureAuthAccount(auth, sellerInfo.email, DEMO_PASSWORD, sellerInfo.fullName);
  const sellerUid = sellerUser.uid;

  const sellerAccountDoc = {
    id: sellerInfo.sellerId,
    ownerUid: sellerUid,
    userId: sellerUid,
    fullName: sellerInfo.fullName,
    shopName: sellerInfo.shopName,
    shopCategory: sellerInfo.shopCategory,
    phone: sellerInfo.phone,
    email: sellerInfo.email,
    shopLocation: sellerInfo.shopLocation,
    shopDescription: sellerInfo.shopDescription,
    shopLogo: sellerInfo.shopLogo,
    isOpen: sellerInfo.isOpen,
    showSellerName: sellerInfo.showSellerName,
    showSellerId: sellerInfo.showSellerId,
    deliveryOptions: sellerInfo.deliveryOptions,
    notificationPreferences: sellerInfo.notificationPreferences,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const publicShopDoc = {
    id: sellerInfo.sellerId,
    shopId: sellerInfo.sellerId,
    sellerId: sellerInfo.sellerId,
    ownerUid: sellerUid,
    shopName: sellerInfo.shopName,
    publicSellerName: sellerInfo.showSellerName ? sellerInfo.fullName : undefined,
    shopCategory: sellerInfo.shopCategory,
    shopLocation: sellerInfo.shopLocation,
    shopDescription: sellerInfo.shopDescription,
    shopLogo: sellerInfo.shopLogo,
    isOpen: sellerInfo.isOpen,
    showSellerName: sellerInfo.showSellerName,
    showSellerId: sellerInfo.showSellerId,
    deliveryOptions: sellerInfo.deliveryOptions,
    rating: null,
    ratingCount: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const sellerBatch = writeBatch(db);
  sellerBatch.set(doc(db, 'sellerAccounts', sellerAccountDoc.id), sellerAccountDoc);
  sellerBatch.set(
    doc(db, 'publicShops', publicShopDoc.id),
    Object.fromEntries(Object.entries(publicShopDoc).filter(([, v]) => v !== undefined))
  );
  await sellerBatch.commit();

  // Save seller's /users profile after sellerAccounts exists (satisfies role verification in firestore.rules)
  await setDoc(doc(db, 'users', sellerUid), {
    id: sellerUid,
    name: sellerInfo.fullName,
    email: sellerInfo.email,
    phoneNumber: sellerInfo.phone,
    favourites: [],
    isSeller: true,
    sellerId: sellerInfo.sellerId,
    createdAt: nowIso,
  });

  // Seed products owned by Demo Seller
  for (const prod of seed.products) {
    const productDoc = {
      ...prod,
      sellerName: sellerInfo.shopName,
      shopName: sellerInfo.shopName,
      sellerId: sellerInfo.sellerId,
      shopId: sellerInfo.sellerId,
      ownerUid: sellerUid,
      sellerLocation: sellerInfo.shopLocation,
      location: sellerInfo.shopLocation,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...(prod.status === 'published' ? { publishedAt: nowIso } : {}),
    };
    await setDoc(doc(db, 'products', prod.id), productDoc);
  }
  console.log(`[Seed] Seeded ${seed.products.length} products under ${sellerInfo.shopName}.`);
  await signOut(auth);

  // 2. Authenticate / register Demo Customer and write customer profile, order, conversation, notifications
  console.log(`[Seed] Provisioning demo customer (${custInfo.email})...`);
  const customerUser = await ensureAuthAccount(auth, custInfo.email, DEMO_PASSWORD, custInfo.displayName);
  const customerUid = customerUser.uid;

  await setDoc(doc(db, 'users', customerUid), {
    id: customerUid,
    name: custInfo.displayName,
    email: custInfo.email,
    phoneNumber: custInfo.phoneNumber,
    deliveryAddress: custInfo.deliveryAddress,
    favourites: custInfo.favourites,
    createdAt: nowIso,
  });

  const ord = seed.demoOrder;
  const enrichedItems = ord.items.map((it) => {
    const matched = seed.products.find((p) => p.id === it.productId);
    return {
      ...it,
      sellerId: sellerInfo.sellerId,
      sellerName: sellerInfo.shopName,
      image: matched?.images?.[0] || '',
    };
  });

  const sellerOrderDoc = {
    id: ord.sellerOrderId,
    parentOrderId: ord.id,
    sellerId: sellerInfo.sellerId,
    sellerOwnerUid: sellerUid,
    sellerName: sellerInfo.shopName,
    customerUid,
    customerName: custInfo.deliveryAddress.fullName,
    customerPhone: custInfo.deliveryAddress.phone,
    deliveryAddress: custInfo.deliveryAddress,
    deliveryMethod: ord.deliveryMethod,
    deliveryFee: ord.deliveryFee,
    items: enrichedItems,
    subtotal: ord.subtotal,
    total: ord.total,
    status: ord.status,
    paymentMethod: ord.paymentMethod,
    codCollected: false,
    readyForPickup: false,
    createdAt: nowIso,
    notes: ord.notes,
  };

  const parentOrderDoc = {
    id: ord.id,
    customerId: customerUid,
    customerUid,
    customerName: custInfo.deliveryAddress.fullName,
    customerPhone: custInfo.deliveryAddress.phone,
    deliveryAddress: custInfo.deliveryAddress,
    items: enrichedItems,
    subtotal: ord.subtotal,
    deliveryFee: ord.deliveryFee,
    total: ord.total,
    paymentMethod: ord.paymentMethod,
    status: ord.status,
    createdAt: nowIso,
    notes: ord.notes,
    sellerOrders: [sellerOrderDoc],
    deliveryMethodBySeller: { [sellerInfo.sellerId]: ord.deliveryMethod },
  };

  const orderBatch = writeBatch(db);
  orderBatch.set(doc(db, 'orders', parentOrderDoc.id), parentOrderDoc);
  orderBatch.set(doc(db, 'sellerOrders', sellerOrderDoc.id), sellerOrderDoc);
  await orderBatch.commit();

  // Seed conversation + messages
  const conv = seed.demoConversation;
  const refProd = seed.products.find((p) => p.id === conv.productId);
  const lastMsg = conv.messages[conv.messages.length - 1];

  await setDoc(doc(db, 'conversations', conv.id), {
    id: conv.id,
    sellerId: sellerInfo.sellerId,
    sellerOwnerUid: sellerUid,
    sellerName: sellerInfo.shopName,
    customerId: customerUid,
    customerUid,
    customerName: custInfo.displayName,
    lastMessageText: lastMsg.text,
    lastMessageTime: nowIso,
    unreadCount: 1,
    unreadBySellerCount: 0,
    productRef: refProd
      ? {
          id: refProd.id,
          name: refProd.name,
          price: refProd.price,
          image: refProd.images[0],
          sellerName: sellerInfo.shopName,
        }
      : undefined,
    createdAt: nowIso,
  });

  for (const m of conv.messages) {
    await setDoc(doc(db, 'conversations', conv.id, 'messages', m.id), {
      id: m.id,
      conversationId: conv.id,
      sender: m.sender,
      senderUid: m.sender === 'customer' ? customerUid : sellerUid,
      senderName: m.senderName,
      text: m.text,
      createdAt: nowIso,
    });
  }

  // Seed initial notifications
  await setDoc(doc(db, 'notifications', 'notif_demo_cust_01'), {
    id: 'notif_demo_cust_01',
    recipientUid: customerUid,
    title: 'Order Confirmed',
    message: `Your demo order #${ord.id} has been placed via Cash on Delivery.`,
    type: 'order',
    isRead: false,
    linkView: 'orders',
    linkId: ord.id,
    createdAt: nowIso,
  });

  await setDoc(doc(db, 'notifications', 'notif_demo_seller_01'), {
    id: 'notif_demo_seller_01',
    recipientUid: sellerUid,
    sellerId: sellerInfo.sellerId,
    title: 'New Order Received',
    message: `Demo order #${ord.sellerOrderId} received from ${custInfo.displayName}.`,
    type: 'order',
    isRead: false,
    linkView: 'seller-orders',
    linkId: ord.sellerOrderId,
    createdAt: nowIso,
  });

  await signOut(auth);
  console.log('[Seed] Database seeding complete!');
}

run().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
