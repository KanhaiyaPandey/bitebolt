/**
 * Design System · Status colour maps
 *
 * Canonical background + foreground pairs for every stateful badge in the app:
 * order lifecycle, payment status, and wallet transaction reason. These are the
 * ONLY place status colours are defined — badges must read from here.
 */

export interface StatusTone {
  bg: string;
  text: string;
  label: string;
}

const FALLBACK: StatusTone = { bg: '#F3F4F6', text: '#374151', label: '' };

export const orderStatus: Record<string, StatusTone> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  ACCEPTED: { bg: '#DBEAFE', text: '#1E3A5F', label: 'Accepted' },
  PREPARING: { bg: '#EDE9FE', text: '#4C1D95', label: 'Preparing' },
  OUT_FOR_DELIVERY: { bg: '#FFEDD5', text: '#9A3412', label: 'Out for Delivery' },
  DELIVERED: { bg: '#D1FAE5', text: '#065F46', label: 'Delivered' },
  REJECTED: { bg: '#FEE2E2', text: '#7F1D1D', label: 'Rejected' },
  CANCELLED: { bg: '#F3F4F6', text: '#374151', label: 'Cancelled' },
};

export const paymentStatus: Record<string, Pick<StatusTone, 'bg' | 'text'>> = {
  CAPTURED: { bg: '#D1FAE5', text: '#065F46' },
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  FAILED: { bg: '#FEE2E2', text: '#7F1D1D' },
  REFUNDED: { bg: '#DBEAFE', text: '#1E3A5F' },
};

export const walletReason: Record<string, Pick<StatusTone, 'bg' | 'text'>> = {
  ORDER_PAYMENT: { bg: '#FEE2E2', text: '#7F1D1D' },
  ORDER_REFUND: { bg: '#D1FAE5', text: '#065F46' },
  TOP_UP: { bg: '#DBEAFE', text: '#1E3A5F' },
  CASHBACK: { bg: '#EDE9FE', text: '#4C1D95' },
};

export function orderTone(status: string): StatusTone {
  return orderStatus[status] ?? { ...FALLBACK, label: status };
}

export function paymentTone(status: string): Pick<StatusTone, 'bg' | 'text'> {
  return paymentStatus[status] ?? FALLBACK;
}

export function walletTone(reason: string): Pick<StatusTone, 'bg' | 'text'> {
  return walletReason[reason] ?? FALLBACK;
}
