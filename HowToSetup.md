# How to Set Up Supermarket — Multi-Vendor Marketplace

Complete installation, Firebase provisioning, seeding, local emulator development, testing, and production deployment guide starting from a clean machine.

---

## Architecture Overview

Supermarket is a serverless multi-vendor marketplace built with:
- **Frontend**: React 19 + TypeScript + Vite 8 + Tailwind CSS v4 (root directory `/`)
- **Backend Services**: Firebase Authentication (Email/Password), Cloud Firestore (real-time marketplace database + `firestore.rules`), and Firebase Storage (product & shop logo assets capped at 200 KB + `storage.rules`)

> **Note on Cloud Functions**: This codebase runs entirely on the Firebase Client SDK backed by zero-trust server-side `firestore.rules` and `storage.rules`. No separate Cloud Functions backend directory is required unless you extend the project with server-side webhooks or scheduled jobs.

---

## A. System Requirements

- **Node.js**: `v22.x` LTS or `v24.x` (`node -v`)
- **npm**: `v10.9+` (`npm -v`)
- **Git**: `v2.40+` (`git --version`)
- **Firebase CLI**: `v13+` / `v15+` (`npm install -g firebase-tools`, verify with `firebase --version`)
- **Java JDK**: `17+` (only required if running the **Firebase Local Emulator Suite**)

---

## B. Installation

Clone the repository and install dependencies from the project root:

```bash
git clone <your-repository-url>
cd <repository-folder>
npm install
```

Verify the lockfile integrity and security audit:

```bash
npm audit
npm run lint
```

> **Note**: There is no separate `functions/` directory to install because all marketplace operations run via Firebase Client SDK + Firestore/Storage Security Rules.

---

## C. Firebase Project Setup (From Empty Project)

Follow these steps to create your own clean Firebase environment (never reuse another developer's project credentials):

1. Open the [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Enter a project name (for example, `my-supermarket-prod`) and finish creating the project.
3. **Enable Authentication**:
   - Go to **Build → Authentication → Get started**.
   - Under **Sign-in method**, enable **Email/Password** and save.
4. **Enable Cloud Firestore**:
   - Go to **Build → Firestore Database → Create database**.
   - Select your preferred Cloud region and start in **Production mode** (we will deploy `firestore.rules` next).
   - Keep the database ID as `(default)` unless creating a named Firestore database.
5. **Enable Firebase Storage**:
   - Go to **Build → Storage → Get started** and initialize the default bucket in production mode.
6. **Register a Web App**:
   - Open **Project Settings (gear icon) → General → Your apps → Add app (`</> Web`)**.
   - Copy the `firebaseConfig` object (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
7. **Connect Firebase CLI**:
   ```bash
   firebase login
   firebase use --add <your_firebase_project_id>
   ```

---

## D. Environment Variables

Copy the single example configuration file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in **your own** Firebase Web App credentials:

| Variable | Required | Description |
| :--- | :---: | :--- |
| `VITE_FIREBASE_API_KEY` | Yes | Public Web API key from Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Usually `<project-id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Your Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Usually `<project-id>.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase Web App ID |
| `VITE_FIREBASE_DATABASE_ID` | Yes | Leave as `(default)` for standard Firestore databases |
| `VITE_FIREBASE_USE_EMULATORS` | No | Set `"true"` for Target 1 local emulator mode, `"false"` otherwise |
| `VITE_MARKETPLACE_NAME` | No | Storefront brand name (default: `Supermarket`) |
| `VITE_CURRENCY_CODE` | No | Currency code (default: `USD`) |
| `VITE_CURRENCY_SYMBOL` | No | Currency symbol (default: `$`) |
| `VITE_SUPPORT_EMAIL` | No | Footer & customer support email |
| `VITE_SUPPORT_PHONE` | No | Contact phone displayed in footer |
| `VITE_MARKETPLACE_HUB` | No | Default city hub fallback |
| `VITE_FREE_DELIVERY_THRESHOLD` | No | Order subtotal qualifying for free delivery (default: `50`) |
| `VITE_STANDARD_DELIVERY_FEE` | No | Standard delivery fee below threshold (default: `5`) |
| `VITE_ANNOUNCEMENT_TEXT` | No | Top announcement bar copy |
| `VITE_SHOW_ANNOUNCEMENT_BAR` | No | `"true"` or `"false"` |

> **Security Reminder**: Never commit `.env`, service account JSON keys, or private passwords to version control. `.gitignore` ignores `.env*` automatically.

---

## E. Firestore Rules, Storage Rules & Indexes

Deploy security rules and indexes to your Firebase project before writing application data:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

- **Rules**: `/firestore.rules` (ownership + role guards) and `/storage.rules` (authenticated uploads, JPG/PNG/WEBP, 200 KB max)
- **Indexes**: `/database/firestore.indexes.json` (all active queries use single-field `where()` + client-side sorting, so zero composite indexes are needed on initial setup)

> If your project uses a named Firestore database instead of `(default)`, update `"database"` inside `firebase.json` before running `firebase deploy`.

---

## F. Seed / Demo Data

Populate realistic fictional demo accounts, a demo shop, 5 sample products (4 published + 1 draft), an order, and a sample buyer–seller conversation:

```bash
# Validate seed payload locally without network calls
npm run seed:dry-run

# Seed your live Firebase project configured in .env
npm run seed
```

### Demo Accounts Created by `seed.mjs`

| Role | Email | Default Password |
| :--- | :--- | :--- |
| **Demo Customer** | `demo-customer@example.com` | `DemoPass!2026` |
| **Demo Seller** | `demo-seller@example.com` | `DemoPass!2026` |

> You may override the password via `DEMO_ACCOUNT_PASSWORD="YourPassword"` before running `npm run seed`.

---

## G. Setup Target 1 — Local Development & Firebase Emulators

### Option 1A: Local React Frontend against Your Firebase Project
1. Ensure `.env` has `VITE_FIREBASE_USE_EMULATORS="false"` and your Firebase project keys.
2. Start Vite on port `3000`:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`.

### Option 1B: Fully Offline Local Development with Firebase Emulators
1. Install Java JDK 17+ and Firebase CLI (`firebase --version`).
2. Set `VITE_FIREBASE_USE_EMULATORS="true"` in `.env`.
3. Terminal 1 — Start Auth, Firestore, Storage, and Hosting emulators:
   ```bash
   npm run emulators
   ```
4. Terminal 2 — Seed the local emulators:
   ```bash
   node database/seed/seed.mjs --emulators
   ```
5. Terminal 2 — Start the frontend dev server:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:3000` (and Emulator UI at `http://127.0.0.1:4000`).

---

## H. Running Automated Tests

```bash
# Run the 5 end-to-end flow and security-rule tests
npm test

# Optional: include live HTTP route verification against a running server
TEST_BASE_URL=http://localhost:3000 npm test
```

See `tests/E2E_TEST_FLOWS.md` for step-by-step interactive test checklists.

---

## I. Setup Target 2 — Production Deployment (Firebase Hosting)

1. Build and type-check the production bundle:
   ```bash
   npm run lint
   npm run build
   ```
2. Deploy Firestore rules, indexes, Storage rules, and the built SPA (`dist/`) to Firebase Hosting:
   ```bash
   firebase deploy
   ```
3. Your live URL (`https://<your-project-id>.web.app`) now serves the marketplace with SPA deep-link routing (`/product/*`, `/shop/*`, `/category/*`, `/search`).

---

## J. Troubleshooting

- **`auth/operation-not-allowed` during sign-in or seeding**: Enable **Email/Password** under **Firebase Console → Authentication → Sign-in method**.
- **Published products not showing on another device**: Confirm `firestore.rules` is deployed (`firebase deploy --only firestore:rules`), and verify `VITE_FIREBASE_DATABASE_ID` matches your Firestore database ID.
- **Image upload fails or falls back locally**: Ensure **Firebase Storage** is initialized in Firebase Console and `storage.rules` is deployed (`firebase deploy --only storage`). Note that uploaded photos must be JPG, JPEG, PNG, or WEBP and are automatically compressed under 200 KB client-side.
- **`ERESOLVE` error during `npm install`**: Run with Node `v22+` and ensure you are using the committed `package.json` (`esbuild: ^0.28.0`) and `package-lock.json`.
