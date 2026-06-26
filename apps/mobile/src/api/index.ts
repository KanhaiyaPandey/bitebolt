import type {
  FoodItem,
  Category,
  Cart,
  Order,
  Address,
  UserProfile,
  PaginationMeta,
} from '@bitebolt/types';

import apiClient from './client';

// ── Foods ─────────────────────────────────────────────────────────────────────
export const foodsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isVeg?: boolean;
  }) => apiClient.get<unknown, { items: FoodItem[]; meta: PaginationMeta }>('/foods', { params }),

  getFeatured: () => apiClient.get<unknown, FoodItem[]>('/foods/featured'),

  getBySlug: (slug: string) => apiClient.get<unknown, FoodItem>(`/foods/${slug}`),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll: () => apiClient.get<unknown, Category[]>('/categories'),
};

// ── Cart ──────────────────────────────────────────────────────────────────────
export const cartApi = {
  getCart: () => apiClient.get<unknown, Cart>('/cart'),

  addItem: (data: { foodItemId: string; quantity: number; specialInstructions?: string }) =>
    apiClient.post('/cart/items', data),

  updateItem: (id: string, quantity: number) => apiClient.patch(`/cart/items/${id}`, { quantity }),

  removeItem: (id: string) => apiClient.delete(`/cart/items/${id}`),

  clearCart: () => apiClient.delete('/cart'),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  placeOrder: (data: {
    addressId: string;
    paymentMethod: string;
    walletAmountToUse?: number;
    specialInstructions?: string;
  }) => apiClient.post<unknown, Order>('/orders', data),

  getOrders: (params?: { page?: number; limit?: number }) =>
    apiClient.get<unknown, { orders: Order[]; meta: PaginationMeta }>('/orders', { params }),

  getOrderById: (id: string) => apiClient.get<unknown, Order>(`/orders/${id}`),

  cancelOrder: (id: string) => apiClient.patch(`/orders/${id}/cancel`),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
  createRazorpayOrder: (data: { orderId: string; method: string; walletAmountUsed?: number }) =>
    apiClient.post<
      unknown,
      { razorpayOrderId: string; amount: number; currency: string; keyId: string }
    >('/payments/create-order', data),

  verifyPayment: (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => apiClient.post('/payments/verify', data),
};

// ── Wallet ────────────────────────────────────────────────────────────────────
export const walletApi = {
  getWallet: () => apiClient.get('/wallet'),
  getTransactions: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/wallet/transactions', { params }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile: () => apiClient.get<unknown, UserProfile>('/users/me'),
  updateProfile: (data: { name?: string; email?: string }) => apiClient.patch('/users/me', data),
  getAddresses: () => apiClient.get<unknown, Address[]>('/users/me/addresses'),
  addAddress: (data: object) => apiClient.post('/users/me/addresses', data),
  updateAddress: (id: string, data: object) => apiClient.patch(`/users/me/addresses/${id}`, data),
  deleteAddress: (id: string) => apiClient.delete(`/users/me/addresses/${id}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getNotifications: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/notifications', { params }),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsApi = {
  getAll: () => apiClient.get<unknown, Record<string, string>>('/settings'),
};

export { authApi } from './auth';
export { default as apiClient } from './client';
