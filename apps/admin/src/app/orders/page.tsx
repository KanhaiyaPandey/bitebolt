'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '../../lib/api';
import { OrderCard } from '../../components/OrderCard';
import { getOrderStatusLabel, getOrderStatusColor } from '@bitebolt/utils';
import type { Order } from '@bitebolt/types';

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: '🟡 Pending', value: 'PENDING' },
  { label: '✅ Accepted', value: 'ACCEPTED' },
  { label: '👨‍🍳 Preparing', value: 'PREPARING' },
  { label: '🛵 Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: '✔️ Delivered', value: 'DELIVERED' },
];

export default function OrdersPage() {
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', activeStatus],
    queryFn: () => adminApi.getOrders({ status: activeStatus }),
    refetchInterval: 15000, // Auto-refresh every 15s
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {data?.meta?.total ?? 0} total orders · auto-refreshes every 15s
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveStatus(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeStatus === tab.value
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-orange-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {(data?.orders as Order[] | undefined)?.map((order) => (
            <OrderCard key={order.id} order={order} onUpdate={() => refetch()} />
          ))}
          {(!data?.orders || data.orders.length === 0) && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-medium">No orders found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
