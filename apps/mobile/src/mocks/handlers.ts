import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:3001/api/v1';

const ok = (data: unknown, status = 200) =>
  HttpResponse.json({ success: true, statusCode: status, data }, { status });

const fail = (message: string, status: number) =>
  HttpResponse.json({ success: false, statusCode: status, message }, { status });

export const handlers = [
  // ── Auth ───────────────────────────────────────────────────────────────────
  http.post(`${BASE}/auth/send-otp`, () =>
    ok({ message: 'OTP sent to +919876543210', expiresIn: 600 }),
  ),

  http.post(`${BASE}/auth/verify-otp`, () =>
    ok({
      isNewUser: false,
      user: { id: 'user-1', phone: '9876543210', name: 'Test User', role: 'CUSTOMER' },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 604800,
    }),
  ),

  http.post(`${BASE}/auth/register`, () =>
    ok({ id: 'user-1', phone: '9876543210', name: 'Test User', email: null, role: 'CUSTOMER' }),
  ),

  http.post(`${BASE}/auth/refresh`, () =>
    ok({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token', expiresIn: 604800 }),
  ),

  // ── Foods ──────────────────────────────────────────────────────────────────
  http.get(`${BASE}/foods`, () =>
    ok({
      items: [
        {
          id: 'food-1',
          name: 'Paneer Butter Masala',
          slug: 'paneer-butter-masala',
          price: '250',
          discountedPrice: null,
          isVeg: true,
          isAvailable: true,
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    }),
  ),

  http.get(`${BASE}/foods/featured`, () => ok([])),

  http.get(`${BASE}/foods/:slug`, ({ params }) =>
    ok({
      id: 'food-1',
      name: 'Paneer Butter Masala',
      slug: params.slug,
      price: '250',
      discountedPrice: null,
      isVeg: true,
      isAvailable: true,
    }),
  ),

  // ── Categories ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/categories`, () =>
    ok([{ id: 'cat-1', name: 'Main Course', slug: 'main-course' }]),
  ),

  // ── Cart ───────────────────────────────────────────────────────────────────
  http.get(`${BASE}/cart`, () =>
    ok({ items: [], itemCount: 0, subtotal: 0, deliveryFee: 0, taxes: 0, total: 0 }),
  ),

  http.post(`${BASE}/cart/items`, () =>
    ok({ id: 'cart-1', foodItemId: 'food-1', quantity: 1, userId: 'user-1' }),
  ),

  http.patch(`${BASE}/cart/items/:id`, () =>
    ok({ id: 'cart-1', quantity: 2 }),
  ),

  http.delete(`${BASE}/cart/items/:id`, () => ok({ removed: true })),

  http.delete(`${BASE}/cart`, () => ok({ cleared: true })),

  // ── Orders ─────────────────────────────────────────────────────────────────
  http.post(`${BASE}/orders`, () =>
    ok({ id: 'order-1', orderNumber: 'BB-TEST-001', status: 'PENDING', total: '303.00' }),
  ),

  http.get(`${BASE}/orders`, () =>
    ok({ orders: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
  ),

  http.get(`${BASE}/orders/:id`, ({ params }) =>
    ok({ id: params.id, orderNumber: 'BB-TEST-001', status: 'PENDING' }),
  ),

  http.patch(`${BASE}/orders/:id/cancel`, () =>
    ok({ id: 'order-1', status: 'CANCELLED' }),
  ),

  // ── Payments ───────────────────────────────────────────────────────────────
  http.post(`${BASE}/payments/create-order`, () =>
    ok({ razorpayOrderId: 'order_rp_test', amount: 30300, currency: 'INR', keyId: 'rzp_test' }),
  ),

  http.post(`${BASE}/payments/verify`, () => ok({ success: true, paymentId: 'pay-1' })),

  // ── Wallet ─────────────────────────────────────────────────────────────────
  http.get(`${BASE}/wallet`, () =>
    ok({ id: 'wallet-1', balance: '100.00', transactions: [] }),
  ),

  http.get(`${BASE}/wallet/transactions`, () =>
    ok({ transactions: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
  ),

  // ── Users ──────────────────────────────────────────────────────────────────
  http.get(`${BASE}/users/me`, () =>
    ok({ id: 'user-1', phone: '9876543210', name: 'Test User', email: null }),
  ),

  http.patch(`${BASE}/users/me`, () =>
    ok({ id: 'user-1', phone: '9876543210', name: 'Updated User', email: null }),
  ),

  http.get(`${BASE}/users/me/addresses`, () => ok([])),

  http.post(`${BASE}/users/me/addresses`, () =>
    ok({ id: 'addr-1', label: 'Home', addressLine1: '123 Street', city: 'Mumbai' }),
  ),

  // ── Notifications ──────────────────────────────────────────────────────────
  http.get(`${BASE}/notifications`, () =>
    ok({ notifications: [], unreadCount: 0, meta: { total: 0 } }),
  ),

  http.patch(`${BASE}/notifications/:id/read`, () => ok({ success: true })),

  http.patch(`${BASE}/notifications/read-all`, () => ok({ success: true })),
];

export { fail, ok };
