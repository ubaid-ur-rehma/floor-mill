# Nazir Atta Chakki — Website + Order/Payment Backend

A professional website for **Nazir Atta Chakki** (Mustafabad, Lahore) with a real
backend for taking orders and processing payments — the same architecture used
by food brands.

## What's included

**Front end (static pages)**
- `index.html` — homepage (hero, products, about, testimonials, payment, map)
- `product.html` — products / menu
- `payment.html` — payment methods
- `checkout.html` — **real checkout** (cart, customer details, payment choice)
- `about.html`, `location.html`, `contact.html`
- `style.css`, `checkout.js`

**Back end (`server/`)**
- `server/server.js` — Express server: static hosting + REST API + CORS
- `server/data/catalogue.js` — products, prices, shop info, payment accounts
- `server/db.js` — **real SQLite database** (orders, order_items, payments tables)
- `server/payments.js` — payment engine (**Easypaisa & JazzCash only**)

## Run it

```bash
npm install
npm start
```

Then open **http://localhost:3000**

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/shop` | shop info, products, payment accounts |
| GET | `/api/products` | product catalogue |
| POST | `/api/orders` | create an order |
| GET | `/api/orders/:id` | fetch one order |
| POST | `/api/orders/:id/pay` | start a payment (Easypaisa / JazzCash) |
| POST | `/api/payments/:session/confirm` | confirm a payment |
| POST | `/api/orders/:id/reference` | attach a bank/wallet reference |

### Example

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customer":{"name":"Ali","phone":"03001234567"},
       "items":[{"id":"desi-gandum-atta","qty":5}],
       "paymentMethod":"easypaisa"}'
```

## Payments

`server/payments.js` runs in **sandbox** mode by default, so the entire flow is
testable immediately with no real money.

To go live:
1. Get merchant credentials from Easypaisa / JazzCash.
2. Copy `.env.example` → `.env` and fill in the values.
3. Set `PAYMENT_MODE=live`.
4. Complete the `createLiveSession()` call in `server/payments.js` with the
   provider's checkout request, and verify their webhook signature in
   `confirmPayment()`.

## Editing prices / products

Everything is in **`server/data/catalogue.js`**. Change a price there and it
updates the site and the checkout automatically.

## Cinematic experience assets

The homepage film uses the local Three.js runtime and procedural fallback geometry when supplied assets are absent. Brand-facing experience data is centralized in **`experience-config.js`** so models and media can be added without changing scene code.

Replaceable asset locations:

- `assets/models/` - GLB/GLTF wheat, chakki, and package models
- `assets/textures/` - wheat, flour, stone, wood, and package textures
- `assets/products/` - Nazir logo and product artwork
- `assets/audio/` - optional wind, chakki, flour, and kitchen audio
- `assets/fonts/` - brand font files

The current procedural package, chakki, wheat field, flour particles, and kitchen are intentional fallbacks. Add real files at the paths in `experience-config.js` before wiring a loader for them.

## Orders

Orders are saved to `server/data/orders.json`. View any order:

```bash
curl http://localhost:3000/api/orders/NAC-1001
```

For production, swap `server/orders.js` for a real database — the interface
(`create`/`get`/`update`/`list`) is small on purpose.