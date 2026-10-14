# RevenueCat — integrated (2026-06, updated 2026-06)
This file is supposed to serve as a memory to you if you have to interact with user's RevenueCat account via integration proxy at any later point in time.

## Identifiers (from /setup response — copy verbatim)
- rc_project_id: proj16b671b2
- apple_app_id: app1982c09c2b
- play_app_id: app102076f939
- entitlement_lookup_key: pro
- offering_lookup_key: default
- Packages (package -> product_id, current price):
  - $rc_monthly -> prodc333e80cdb (default pricing, see dashboard)
  - $rc_annual  -> prodee3728a264 (default pricing, see dashboard)
- Dashboard: https://app.revenuecat.com/projects/proj16b671b2

## App identifiers used at setup
- bundle_id (ios): com.emergent.feelingsfriends.zun4dm
- package_name (android): com.emergent.feelingsfriends.zun4dm

## Check for project_state in revenuecat status api response. if the project_state is less than project_created, re-fetch RevenueCat playbook via the integration expert tool.
Status check:
`curl -sS -H "$AUTH" "$INTEGRATION_PROXY_URL/internal/revenuecat/projects/3e6244c8-d924-49c5-a28f-2c1c6b73fbd3/status"`
→ `{"connection_state":"connected","project_state":"...","rc_project_id":"..."}`

## Later updates to user's products (integration proxy APIs ONLY — NEVER call the RevenueCat REST API)
- Change price/duration/trial OR add a package (upsert):
  POST $INTEGRATION_PROXY_URL/internal/revenuecat/projects/3e6244c8-d924-49c5-a28f-2c1c6b73fbd3/products
  body: {"products":[{"package":"$rc_monthly","price":14.99,"currency":"USD",
         "period":"P1M","trial":"P1W",
         "prices":[{"amount_micros":14990000,"currency":"USD"}]}]}
  (amount_micros = price × 1,000,000; omit "trial" for none)
- Remove a package:
  DELETE $INTEGRATION_PROXY_URL/internal/revenuecat/projects/3e6244c8-d924-49c5-a28f-2c1c6b73fbd3/products/%24rc_monthly
  ($ -> %24)
- Recover identifiers / repopulate .env: re-run the idempotent /setup call.

## App-side implementation notes
- RevenueCat is used ONLY for native (iOS/Android) purchases. Web keeps the existing
  Razorpay checkout flow (app/paywall.tsx branches on Platform.OS).
- SDK init: `/app/frontend/lib/revenuecat.tsx`, initialized at module scope in
  `app/_layout.tsx` (try/catch wrapped), wrapped with `SubscriptionProvider`.
- Identity binding (`Purchases.logIn` / `logOut`) wired inside `src/auth.tsx`'s
  AuthProvider on every auth path (session restore, sign-in, sign-up, sign-out).
- Entitlement gating client-side only via `useSubscription().isSubscribed`
  (`customerInfo.entitlements.active["pro"]`). No backend pro/is_pro tracking added
  for RevenueCat (per playbook — client SDK is sole source of truth).

## Taking in-app purchases LIVE — store-side steps (USER does these — agent cannot verify or perform)
Needed ONLY for REAL purchases in published store builds. Test Store (Expo Go / web
preview / dev build) needs none of this.
- Step 1 — Upload App Store / Play Store credentials to the RevenueCat dashboard
  (Home → project → Apps → App name)
- Step 2 — Set up payment profiles for the app in App Store Connect and Play Console
- Step 3 — Create matching in-app purchase products in App Store Connect and Google
  Play using the SAME product IDs shown in the RevenueCat dashboard
- Step 4 — Make a release build, test via TestFlight / Play internal testing, then
  submit for review.

All the steps needed to integrate RevenueCat in their production app are present in the
FAQ section of the payments panel.
