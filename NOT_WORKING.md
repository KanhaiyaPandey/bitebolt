# BiteBolt Admin — Known Limitations

This is an honest list of what is **not** fully working, or works differently than a client
might assume, in the current admin app. Everything not listed here — all 17 features defined in
`apps/admin/features.txt` — is implemented and verified working end-to-end against the real API
and database (see `DEMO_SCRIPT.md` for the walkthrough, and `ADMIN.md` §12 for the verification
checklist).

## 1. "Real time" orders = fast polling, not push

New orders appear in the Orders tab within **15 seconds** (auto-refresh), not instantly. There is
no WebSocket/push channel between the API and the admin app. Analytics refresh every 60s
(overview, order stats) or 5 minutes (daily sales, popular items). This is an intentional,
documented tradeoff (see `ADMIN.md` §5) — not a bug — but worth setting expectations with the
client if they picture an instant "ding" the moment an order lands.

## 2. Admin accounts are not self-service

There is no in-app sign-up, invite, or "request admin access" flow. A phone number becomes an
admin only via a database update or the `promote-admin.ts` CLI script (see the README's
"Onboarding a New Admin" section). A brand-new phone number can complete OTP login on the admin
app, but will then be rejected with "Admin access only" until someone with database/CLI access
promotes it.

## 3. No mid-flow admin cancellation

Admin can **Accept** or **Reject** a `PENDING` order, and progress an accepted order through
`Preparing → Out for Delivery → Delivered`. There is no admin-side "Cancel" action once an order
has been accepted — cancellation of an in-flight order is a customer-side action only
(`PATCH /orders/:id/cancel` on the customer app). If the client needs staff to be able to cancel
an order mid-flow (e.g. kitchen equipment failure), that's a small gap to raise with them.

## 4. Push notifications are stored, not delivered

Order status changes write a row to the `notifications` table, and the `users` table has an
unused `fcmToken` column — but there is no Firebase Cloud Messaging (or APNs) integration wired
up (`FCM_SERVER_KEY` is a placeholder in `.env.example`). Notifications exist in the database for
future use but customers/admins do not receive an actual push alert on their device today.

## 5. Third-party integrations need real credentials to fully work

- **Razorpay**: if `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` aren't set, payment-creation endpoints
  return a clear `BadRequestException` rather than crashing — but no real payment can be taken
  until real (or sandbox) Razorpay keys are configured.
- **Twilio (OTP SMS)**: in `NODE_ENV=development`, OTPs are printed to the API console log instead
  of being texted — convenient for local demos, but means real SMS delivery needs valid Twilio
  credentials in production.
- **AWS S3 (food/category images)**: the image picker in the Add/Edit Food and Add/Edit Category
  screens uploads to S3. Without valid AWS credentials, image upload fails (the rest of the form
  still works — an image URL just won't be set).

## 6. No search on some lists, no infinite scroll on any of them

- Orders, Payments, and Wallet Transactions support status/type filter chips but not free-text
  search (Customers and Food Items do have search).
- All admin lists fetch a fixed page (up to 50–100 records) with no "load more" / infinite scroll
  in the UI. A restaurant with a very large order/customer history would only see the most recent
  batch in-app; older records are still reachable via the API's `page`/`limit` query params.
