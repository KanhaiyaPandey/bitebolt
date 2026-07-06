import { client } from './client';

// ── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  sendOtp: (phone: string) =>
    client.post('/auth/send-otp', { phone }).then((r) => r.data.data ?? r.data),

  verifyOtp: (phone: string, otp: string) =>
    client.post('/auth/verify-otp', { phone, otp }).then((r) => r.data.data ?? r.data),
};

// ── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  getOverview: () => client.get('/analytics/overview').then((r) => r.data.data ?? r.data),

  getDailySales: (days = 7) =>
    client.get('/analytics/daily-sales', { params: { days } }).then((r) => r.data.data ?? r.data),

  getPopularItems: (limit = 10) =>
    client
      .get('/analytics/popular-items', { params: { limit } })
      .then((r) => r.data.data ?? r.data),

  getOrderStats: () => client.get('/analytics/order-stats').then((r) => r.data.data ?? r.data),
};

// ── Orders ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    client.get('/orders/admin/all', { params }).then((r) => r.data.data ?? r.data),

  getById: (id: string) => client.get(`/orders/admin/${id}`).then((r) => r.data.data ?? r.data),

  updateStatus: (
    id: string,
    data: {
      status: string;
      notes?: string;
      rejectionReason?: string;
      estimatedDeliveryTime?: number;
    },
  ) => client.patch(`/orders/admin/${id}/status`, data).then((r) => r.data.data ?? r.data),
};

// ── Foods ────────────────────────────────────────────────────────────────────

export const foodsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    client.get('/foods/admin/list', { params }).then((r) => r.data.data ?? r.data),

  getById: (id: string) => client.get(`/foods/admin/${id}`).then((r) => r.data.data ?? r.data),

  getPublicAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
  }) => client.get('/foods', { params }).then((r) => r.data.data ?? r.data),

  create: (data: {
    name: string;
    categoryId: string;
    description?: string;
    price: number;
    discountedPrice?: number;
    imageUrl?: string;
    images?: string[];
    isVeg: boolean;
    isAvailable?: boolean;
    preparationTime: number;
    tags?: string[];
    sortOrder?: number;
  }) => client.post('/foods/admin', data).then((r) => r.data.data ?? r.data),

  update: (
    id: string,
    data: Partial<{
      name: string;
      categoryId: string;
      description: string;
      price: number;
      discountedPrice: number | null;
      imageUrl: string;
      images: string[];
      isVeg: boolean;
      isAvailable: boolean;
      preparationTime: number;
      tags: string[];
      sortOrder: number;
    }>,
  ) => client.patch(`/foods/admin/${id}`, data).then((r) => r.data.data ?? r.data),

  delete: (id: string) => client.delete(`/foods/admin/${id}`).then((r) => r.data.data ?? r.data),

  toggleAvailability: (id: string, isAvailable: boolean) =>
    client
      .patch(`/foods/admin/${id}/availability`, { isAvailable })
      .then((r) => r.data.data ?? r.data),
};

// ── Categories ───────────────────────────────────────────────────────────────

export const categoriesApi = {
  getAll: () => client.get('/categories/admin').then((r) => r.data.data ?? r.data),

  getById: (id: string) => client.get(`/categories/admin/${id}`).then((r) => r.data.data ?? r.data),

  getPublicAll: () => client.get('/categories').then((r) => r.data.data ?? r.data),

  create: (data: {
    name: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) => client.post('/categories/admin', data).then((r) => r.data.data ?? r.data),

  update: (
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      imageUrl: string;
      isActive: boolean;
      sortOrder: number;
    }>,
  ) => client.patch(`/categories/admin/${id}`, data).then((r) => r.data.data ?? r.data),

  delete: (id: string) =>
    client.delete(`/categories/admin/${id}`).then((r) => r.data.data ?? r.data),
};

// ── Customers ────────────────────────────────────────────────────────────────

export const customersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    client.get('/users/admin/customers', { params }).then((r) => r.data.data ?? r.data),

  getById: (id: string) =>
    client.get(`/users/admin/customers/${id}`).then((r) => r.data.data ?? r.data),
};

// ── Payments ─────────────────────────────────────────────────────────────────

export const paymentsAdminApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; method?: string }) =>
    client.get('/payments/admin', { params }).then((r) => r.data.data ?? r.data),
};

// ── Wallet ───────────────────────────────────────────────────────────────────

export const walletAdminApi = {
  getTransactions: (params?: { page?: number; limit?: number; userId?: string; type?: string }) =>
    client.get('/wallet/admin/transactions', { params }).then((r) => r.data.data ?? r.data),
};

// ── Upload ───────────────────────────────────────────────────────────────────

export const uploadApi = {
  uploadImage: async (uri: string, mimeType = 'image/jpeg') => {
    console.debug('[AdminAPI] Uploading image', { mimeType });
    const formData = new FormData();
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    formData.append('file', {
      uri,
      type: mimeType,
      name: filename,
    } as unknown as Blob);

    const res = await client.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const url = res.data.data?.url ?? res.data.url;
    console.debug('[AdminAPI] Image uploaded', { url });
    return url as string;
  },
};
