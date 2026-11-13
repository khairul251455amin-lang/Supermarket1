# Database Seed System (`database/seed/`)

This folder provides reproducible demo records that match the exact Firestore schema and Security Rules in `/firestore.rules`.

## Files

- `seed-data.json` — Fictional demo data for Customer, Seller, Public Shop, 5 Products (4 published, 1 draft), Order + Seller Fulfilment Order, and Customer–Seller Conversation.
- `seed.mjs` — Runnable Node.js script supporting schema validation (`--dry-run`), Firebase Local Emulators (`--emulators`), and live Firebase projects configured via `.env`.

## Demo Credentials (Fictional)

| Role | Email | Password |
| :--- | :--- | :--- |
| Demo Customer | `demo-customer@example.com` | `DemoPass!2026` |
| Demo Seller | `demo-seller@example.com` | `DemoPass!2026` |

> You can override the password with `DEMO_ACCOUNT_PASSWORD` before running `seed.mjs`.

## Commands

```bash
# 1. Validate seed schema & Firestore rule invariants without connecting to Firebase
npm run seed:dry-run

# 2. Seed local Firebase Emulators (start emulators in another terminal first)
node database/seed/seed.mjs --emulators

# 3. Seed your configured Firebase project from .env
npm run seed
```
