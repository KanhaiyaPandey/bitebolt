'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '../lib/api';
import { formatCurrency, formatDateTime, getOrderStatusLabel, getOrderStatusColor } from '@bitebolt/utils';
import type { Order } from '@bitebolt/types';

const STATUS_ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
  PENDING: [
    { label: '✅ Accept', next: 'ACCEPTED', color: 'bg-green-500' },
    { label: '❌ Reject', next: 'REJECTED', color: 'bg-red-500' },
  ],
  ACCEPTED: [
    { label: '👨‍🍳 Start Preparing', next: 'PREPARING', color: 'bg-blue-500' },
  ],
  PREPARING: [
    { label: '🛵 Out for Delivery', next: 'OUT_FOR_DELIVERY', color: 'bg-orange-500' },
  ],
  OUT_FOR_DELIVERY: [
    { label: '✔️ Mark Delivered', next: 'DELIVERED', color: 'bg-green-600' },
  ],
};

interface OrderCardProps {
  order: Order;
  onUpdate: () => void;
}

export function OrderCard({ order, onUpdate }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = getOrderStatusColor(order.status);
  const actions = STATUS_ACTIONS[order.status] ?? [];

  const mutation = useMutation({
    mutationFn: (status: string) =>
      adminApi.updateOrderStatus(order.id, { status }),
    onSuccess: (_, status) => {
      toast.success(`Order ${order.orderNumber} → ${getOrderStatusLabel(status)}`);
      onUpdate();
    },
    onError: () => toast.error('Failed to update order status'),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{order.orderNumber}</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: statusColor + '20', color: statusColor }}
              >
                {getOrderStatusLabel(order.status)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {(order.user as { name?: string; phone?: string })?.name ?? 'Customer'} · {(order.user as { phone?: string })?.phone}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900 text-lg">{formatCurrency(Number(order.total))}</p>
            <p className="text-xs text-gray-400">{order.items.length} items</p>
          </div>
        </div>

        {/* Items preview */}
        <p className="text-sm text-gray-600 mt-2">
          {order.items.slice(0, 3).map((i) => `${i.name} ×${i.quantity}`).join(', ')}
          {order.items.length > 3 ? ` +${order.items.length - 3} more` : ''}
        </p>

        {/* Delivery address */}
        {order.deliveryAddress && (
          <p className="text-xs text-gray-400 mt-1">
            📍 {(order.deliveryAddress as { addressLine1?: string; city?: string }).addressLine1}, {(order.deliveryAddress as { city?: string }).city}
          </p>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {actions.map((action) => (
              <button
                key={action.next}
                onClick={() => mutation.mutate(action.next)}
                disabled={mutation.isPending}
                className={`${action.color} text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50`}
              >
                {mutation.isPending ? '...' : action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expandable order items */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 text-xs text-gray-400 border-t border-gray-50 hover:bg-gray-50 text-left transition-colors"
      >
        {expanded ? '▲ Hide details' : '▼ Show details'}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="text-gray-400 text-xs">
                <th className="text-left pb-1">Item</th>
                <th className="text-center pb-1">Qty</th>
                <th className="text-right pb-1">Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-gray-50">
                  <td className="py-1.5 text-gray-700">{item.name}</td>
                  <td className="text-center text-gray-500">×{item.quantity}</td>
                  <td className="text-right text-gray-700">{formatCurrency(Number(item.subtotal))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 font-semibold">
                <td colSpan={2} className="pt-2 text-gray-500 text-xs">Total</td>
                <td className="pt-2 text-right text-gray-900">{formatCurrency(Number(order.total))}</td>
              </tr>
            </tfoot>
          </table>
          {order.specialInstructions && (
            <p className="text-xs text-gray-500 mt-2 bg-amber-50 px-2 py-1.5 rounded-lg">
              📝 {order.specialInstructions}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
