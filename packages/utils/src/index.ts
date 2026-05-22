import { z } from 'zod';

// ─── ZOD VALIDATION SCHEMAS (shared between frontend and backend) ──────────────

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

export const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d+$/, 'OTP must contain only digits');

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export const registerSchema = z.object({
  phone: phoneSchema,
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Enter a valid email').optional(),
});

export const addressSchema = z.object({
  label: z.string().min(1).max(30),
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2).max(50),
  state: z.string().min(2).max(50),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().default(false),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const addToCartSchema = z.object({
  foodItemId: z.string().uuid(),
  quantity: z.number().int().positive().max(20),
  specialInstructions: z.string().max(200).optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(20),
});

export const placeOrderSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: z.enum(['UPI', 'CARD', 'NET_BANKING', 'WALLET', 'COD']),
  walletAmountToUse: z.number().min(0).default(0),
  specialInstructions: z.string().max(500).optional(),
});

export const walletTopUpSchema = z.object({
  amount: z.number().positive().min(10).max(10000),
});

// ─── FORMATTING UTILITIES ─────────────────────────────────────────────────────

export const formatCurrency = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPhone = (phone: string): string => {
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
};

export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date: Date | string): string => {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─── ORDER UTILITIES ──────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order Received',
  ACCEPTED: 'Order Accepted',
  REJECTED: 'Order Rejected',
  PREPARING: 'Preparing Your Food',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  ACCEPTED: '#3B82F6',
  REJECTED: '#EF4444',
  PREPARING: '#8B5CF6',
  OUT_FOR_DELIVERY: '#F97316',
  DELIVERED: '#10B981',
  CANCELLED: '#6B7280',
};

export const getOrderStatusLabel = (status: string): string =>
  ORDER_STATUS_LABELS[status] ?? status;

export const getOrderStatusColor = (status: string): string =>
  ORDER_STATUS_COLORS[status] ?? '#6B7280';

// ─── CALCULATION UTILITIES ───────────────────────────────────────────────────

export const DELIVERY_FEE = 40;
export const TAX_RATE = 0.05; // 5% GST

export const calculateCartTotals = (subtotal: number) => {
  const taxes = Math.round(subtotal * TAX_RATE);
  const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + taxes + deliveryFee;
  return { subtotal, taxes, deliveryFee, total };
};

// ─── STRING UTILITIES ─────────────────────────────────────────────────────────

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');

export const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `BB-${timestamp}-${random}`;
};

export const maskPhone = (phone: string): string =>
  `${phone.slice(0, 3)}****${phone.slice(-3)}`;

// ─── VALIDATION UTILITIES ─────────────────────────────────────────────────────

export const isValidIndianPhone = (phone: string): boolean =>
  /^[6-9]\d{9}$/.test(phone);

export const isValidPincode = (pincode: string): boolean =>
  /^\d{6}$/.test(pincode);
