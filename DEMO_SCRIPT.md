# Admin App Demo — Recording Script

A shot-by-shot walkthrough covering all 17 features from `apps/admin/features.txt`, in the order
you should record them. Follow it top to bottom in one continuous take, or cut between sections —
either works.

## Before you hit record

1. Start the API: `pnpm dev:api` (from repo root). Confirm it logs
   `🚀 BiteBolt API running on: http://0.0.0.0:3001/api/v1`.
2. Make sure demo data is seeded: `cd apps/api && npx tsx scripts/seed-demo.ts`. This creates:
   - Admin phone **9653158855**
   - 3 demo customers (Rahul Sharma, Priya Patel, Amit Kumar) with addresses, orders, payments,
     and wallet transactions
   - A handful of categories and food items
   - At least one order left in `PENDING` status so you have something to Accept on camera
3. Start the admin app: `pnpm dev:admin`, then open it in Expo Go or a simulator.
4. Log in: enter phone `9653158855`, then the OTP. In dev mode the OTP is **not texted** — it's
   printed in the API's terminal log as `🔐 DEV OTP for 9653158855: XXXXXX`. Use that.
5. Optional but effective: keep the **customer mobile app** (`pnpm dev:mobile`) open on a second
   device/simulator, logged in as one of the demo customers, so you can place a live order and
   show it landing in the admin Orders tab — this is the most convincing way to demo "real-time"
   order receiving on camera.

---

## Section 1 — Analytics Dashboard (5 features)

*Land here automatically after login.*

1. **Orders per day / Total revenue**: point at the "Today's Overview" row — call out Orders
   Today, Revenue Today, Total Revenue, and Pending Orders cards.
2. **Daily sales reports**: scroll to "Revenue Insights" — show the 7-day bar chart, mention it
   updates automatically every 5 minutes.
3. **Most ordered food items**: scroll to "Trending Items" — point out the ranked list with order
   counts.
4. **Order statistics and sales insights**: scroll to "Order Statistics" at the bottom — show the
   by-status breakdown (Pending/Accepted/Preparing/etc.) and the by-payment-method breakdown
   (UPI/Card/etc.).

*(That's all 5 Analytics Dashboard features.)*

---

## Section 2 — Order Management (3 features)

5. Tap the **Orders** tab.
6. **Receive incoming orders in real time**: if you have the mobile app open, place an order there
   now and narrate "watching for it to appear" — it'll show up within 15 seconds without any
   manual refresh. (If not demoing live placement, just point out the existing order list and
   mention the 15-second auto-refresh / pull-to-refresh.)
7. **Accept or reject orders**: open a `PENDING` order (or swipe right on its card to quick-accept).
   In the detail screen, show both buttons — tap **Accept Order**. Then open another pending order
   and tap **Reject**, show the reason bottom sheet, type a reason, confirm rejection.
8. **Update order status through the full lifecycle**: on an `ACCEPTED` order's detail screen, tap
   through **Start Preparing → Out for Delivery → Mark Delivered**, pointing out the status badge
   and the Status Timeline updating after each tap.

*(That's all 3 Order Management features.)*

---

## Section 3 — Food Management (4 features)

9. Tap the **Menu** tab (defaults to "Food Items").
10. **Add food items**: tap the FAB, fill in name/category/price/prep time, optionally pick an
    image, save — show the new item appear in the list.
11. **Edit food items**: tap the pencil icon on an existing item — show the form pre-filled with
    its real data, change the price, save — show the updated price reflected in the list.
12. **Delete food items**: tap the trash icon on an item, confirm in the sheet — show it disappear.
    (Mention: if an item has active orders, deletion is blocked with a message telling you to
    disable availability instead — a deliberate safety rail, not a bug.)
13. **Price management**: already shown in step 11 — call it out explicitly ("price management").
14. **Availability / stock management**: toggle the availability Switch on a food row — mention
    that this instantly hides/shows the item on the customer app.
15. **Category management**: switch the segmented control to "Categories" — show the list, add a
    new category via the FAB, edit an existing one (name pre-fills correctly), toggle its active
    switch, and delete one (only if it has no food items — otherwise show the "has food items"
    guard message).

*(That's all 4 Food Management features — steps 10, 11/13, 12, 14 map to the 4 sub-features, plus
category CRUD.)*

---

## Section 4 — Customer Details (3 features)

16. Tap the **Customers** tab.
17. **View customer information**: show the list (Rahul Sharma / Priya Patel / Amit Kumar), try
    the search bar with a name or phone number.
18. Tap into one customer's detail screen.
19. **Customer-wise order history**: point out their past orders list, tap into one to jump to its
    order detail screen.
20. **Saved address details**: point out their saved address(es) on the same detail screen.

*(That's all 3 Customer Details features.)*

---

## Section 5 — Payment Management (2 features)

21. Tap the **Payments** tab (defaults to "Payments").
22. **Razorpay payment tracking**: show the list — point out method icon, amount, status badge,
    linked order number (tap it to jump to that order), and tap a Razorpay ID to copy it.
23. Switch the segmented control to "Wallet Txns".
24. **Wallet transaction tracking**: show the credit (top-up) and debit (order payment) entries,
    with running balance-after and customer name on each row.

*(That's all 2 Payment Management features.)*

---

## Wrap-up

That's all 17 features across the 5 categories, each shown working against the real API and
database — nothing on screen is mocked. If you want to mention limitations to the client while
wrapping up, see `NOT_WORKING.md` for the short, honest list (mainly: "real time" is ~15s polling
not push, and new admins are provisioned via a CLI script rather than self-service sign-up).
