# Otomater IoT PWA (customer app)

Next.js 14 app router, built as an installable PWA. Talks to the `otm_iot_platform`
Odoo module — never calls Odoo directly from the browser; every request goes through
this app's own `/api/*` routes on the server, which forward the Odoo session cookie.

## Environment variables (`.env.local`)

```
ODOO_BASE_URL=https://iot.otomater.com
ODOO_DB=otomater_iot

RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```
`RAZORPAY_KEY_SECRET` must never be exposed to the browser - it's only used server-side in
`/api/subscribe/create-order` (to create the order) and `/api/subscribe/verify` (to recompute
and check the payment signature). Get both from your Razorpay dashboard → Settings → API Keys.

## Run locally

```
npm install
npm run dev
```

## Deploy

```
npm run build
npm start
```
Put it behind the same reverse proxy/domain strategy you already use (nginx + Cloudflare
Origin CA, per your other deployments) — HTTPS is required for the service worker and for
iOS to allow "Add to Home Screen" install with push notifications.

## Icons

`public/manifest.json` references `/icons/icon-192.png`, `/icons/icon-512.png`, and
`/icons/icon-maskable-512.png` — placeholders, not included. Drop in real PNGs at those
sizes (512 maskable needs safe-zone padding per the standard PWA maskable-icon spec)
before shipping; iOS's "Add to Home Screen" icon comes from the largest one listed.

## What's wired up

- **Auth**: `/api/auth/login` calls Odoo's `/web/session/authenticate`, stores the
  returned `session_id` as an httpOnly cookie on this app's own domain.
- **Devices**: `/api/devices` (GET) and `/api/devices/toggle` (POST) proxy to the
  `otm_iot_platform` module's `/api/iot/devices` and `/api/iot/device/toggle` endpoints.
- **Dashboard**: groups devices by `location` (room), each channel gets its own toggle.
  Polls every 5s for now — see "Next steps" below for real-time.
- **PWA**: `public/manifest.json` + `public/sw.js` make it installable on iOS/Android;
  service worker also has a push-notification handler wired (device offline, subscription
  expiring, etc.) ready for a VAPID push-subscription flow to be added server-side.

- **Subscriptions**: `/subscribe` lists active plans (from `otm.iot.subscription.plan` via
  `/api/plans`), customer pays with Razorpay Checkout, `/api/subscribe/verify` independently
  recomputes the payment signature server-side (never trusts the browser's "success" claim)
  before telling Odoo to activate it via `/api/iot/subscribe/confirm` →
  `partner.action_renew_iot_subscription()`.

## Next steps (not built yet)

1. **Real-time instead of polling**: subscribe to Odoo's `bus.bus` (longpolling) from a
   server-sent-events or WebSocket bridge route, so a toggle from one phone reflects
   instantly on another instead of waiting up to 5s.
2. **Push notification subscription flow**: capture the browser's push subscription and
   store it against the Odoo partner, so the module can push "device went offline" /
   "subscription expiring" alerts.
3. **Real icons** (see above).
4. **Razorpay webhook as a backup path**: the current flow confirms the subscription from
   the browser's payment callback (`handler`), which is reliable but skipped if the user
   closes the tab mid-flow. Add a Razorpay webhook endpoint that also calls
   `/api/iot/subscribe/confirm` server-to-server as a safety net for that edge case.
