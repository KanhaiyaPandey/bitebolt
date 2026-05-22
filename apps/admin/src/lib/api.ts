import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const adminApi = {
  getOrders: async (params?: { page?: number; limit?: number; status?: string }) => {
    const res = await client.get('/orders/admin/all', { params });
    return res.data.data;
  },

  getOrderById: async (id: string) => {
    const res = await client.get(`/orders/${id}`);
    return res.data.data;
  },

  updateOrderStatus: async (
    id: string,
    data: { status: string; notes?: string; rejectionReason?: string; estimatedDeliveryTime?: number },
  ) => {
    const res = await client.patch(`/orders/admin/${id}/status`, data);
    return res.data.data;
  },
};
