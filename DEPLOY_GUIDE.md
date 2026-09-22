# Deploying Nazir Atta Chakki

The project has two parts that can be hosted in different places:

| Part | What it is | Where it goes |
|---|---|---|
| **Front end** | The HTML/CSS/JS pages | GitHub Pages (free, static) |
| **Backend** | The Node/Express API + order & payment engine | Render (free tier, runs Node) |

GitHub Pages **cannot run the backend**, so the checkout needs the Render API.

---

## Part 1 — Push the code to GitHub

```powershell
cd C:\Users\w10\Desktop\NAC
& "$env:LOCALAPPDATA\PortableGit\cmd\git.exe" push -u origin main --force
```
(username `ubaid-ur-rehma`; password = a Personal Access Token with `repo` scope, or use GitHub Desktop)

---

## Part 2 — Deploy the backend to Render (free)

1. Go to **https://dashboard.render.com** and sign up (free) — you can sign in with GitHub.
2. Click **New +** → **Blueprint**.
3. Choose the **floor-mill** repository. Render finds `render.yaml` and sets everything up.
4. Click **Apply**. Render builds and starts the server (1–2 minutes).
5. When it's live you get a URL like:
   ```
   https://nazir-atta-chakki.onrender.com
   ```
6. Test it in a browser:
   ```
   https://nazir-atta-chakki.onrender.com/api/shop
   ```
   You should see JSON with the products. ✅

> **Free-tier note:** the Render free service sleeps after ~15 minutes of no traffic. The first request after sleeping takes ~30 seconds to wake. That's normal on the free plan.

---

## Part 3 — Point the checkout at the backend

1. Open `checkout.html`.
2. Find this near the bottom:
   ```html
   <script>
       window.API_BASE_URL = "";
   </script>
   ```
3. Put your Render URL inside the quotes:
   ```html
   <script>
       window.API_BASE_URL = "https://nazir-atta-chakki.onrender.com";
   </script>
   ```
4. Commit and push again.

Now the checkout on GitHub Pages will talk to the Render backend. ✅

---

## Part 4 — Go live with real payments (business step)

Real Easypaisa / JazzCash payments require a **merchant account** from those
companies. When you have it:

1. In Render → your service → **Environment**, add:
   - `PAYMENT_MODE` = `live`
   - `EASYPAISA_STORE_ID`, `EASYPAISA_MERCHANT_ID`, `EASYPAISA_HASH_KEY`
   - `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT`
2. Complete the `createLiveSession()` call in `server/payments.js` with the
   provider's checkout request, and verify their webhook signature in
   `confirmPayment()`.

---

## Notes & limitations (be aware)

- **Orders on the free Render plan are stored on an ephemeral disk** — they are
  wiped when the service restarts/redeploys. For durability, connect a database
  (Render Postgres, MongoDB Atlas, etc.) inside `server/orders.js`.
- **Prices** are edited in `server/data/catalogue.js` — one place, updates the
  whole site + checkout.
- **Never commit real credentials.** `.env` is git-ignored; put secrets in the
  Render dashboard's Environment tab instead.