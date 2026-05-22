"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPincode = exports.isValidIndianPhone = exports.maskPhone = exports.generateOrderNumber = exports.generateOtp = exports.slugify = exports.calculateCartTotals = exports.TAX_RATE = exports.DELIVERY_FEE = exports.getOrderStatusColor = exports.getOrderStatusLabel = exports.ORDER_STATUS_COLORS = exports.ORDER_STATUS_LABELS = exports.formatDateTime = exports.formatDate = exports.formatPhone = exports.formatCurrency = exports.walletTopUpSchema = exports.placeOrderSchema = exports.updateCartItemSchema = exports.addToCartSchema = exports.paginationSchema = exports.updateProfileSchema = exports.addressSchema = exports.registerSchema = exports.verifyOtpSchema = exports.sendOtpSchema = exports.otpSchema = exports.phoneSchema = void 0;
const zod_1 = require("zod");
// ─── ZOD VALIDATION SCHEMAS (shared between frontend and backend) ──────────────
exports.phoneSchema = zod_1.z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');
exports.otpSchema = zod_1.z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only digits');
exports.sendOtpSchema = zod_1.z.object({
    phone: exports.phoneSchema,
});
exports.verifyOtpSchema = zod_1.z.object({
    phone: exports.phoneSchema,
    otp: exports.otpSchema,
});
exports.registerSchema = zod_1.z.object({
    phone: exports.phoneSchema,
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: zod_1.z.string().email('Enter a valid email').optional(),
});
exports.addressSchema = zod_1.z.object({
    label: zod_1.z.string().min(1).max(30),
    addressLine1: zod_1.z.string().min(5).max(200),
    addressLine2: zod_1.z.string().max(200).optional(),
    city: zod_1.z.string().min(2).max(50),
    state: zod_1.z.string().min(2).max(50),
    pincode: zod_1.z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    isDefault: zod_1.z.boolean().default(false),
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50).optional(),
    email: zod_1.z.string().email().optional(),
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(10),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.addToCartSchema = zod_1.z.object({
    foodItemId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive().max(20),
    specialInstructions: zod_1.z.string().max(200).optional(),
});
exports.updateCartItemSchema = zod_1.z.object({
    quantity: zod_1.z.number().int().min(0).max(20),
});
exports.placeOrderSchema = zod_1.z.object({
    addressId: zod_1.z.string().uuid(),
    paymentMethod: zod_1.z.enum(['UPI', 'CARD', 'NET_BANKING', 'WALLET', 'COD']),
    walletAmountToUse: zod_1.z.number().min(0).default(0),
    specialInstructions: zod_1.z.string().max(500).optional(),
});
exports.walletTopUpSchema = zod_1.z.object({
    amount: zod_1.z.number().positive().min(10).max(10000),
});
// ─── FORMATTING UTILITIES ─────────────────────────────────────────────────────
const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
const formatPhone = (phone) => {
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
};
exports.formatPhone = formatPhone;
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};
exports.formatDate = formatDate;
const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
exports.formatDateTime = formatDateTime;
// ─── ORDER UTILITIES ──────────────────────────────────────────────────────────
exports.ORDER_STATUS_LABELS = {
    PENDING: 'Order Received',
    ACCEPTED: 'Order Accepted',
    REJECTED: 'Order Rejected',
    PREPARING: 'Preparing Your Food',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};
exports.ORDER_STATUS_COLORS = {
    PENDING: '#F59E0B',
    ACCEPTED: '#3B82F6',
    REJECTED: '#EF4444',
    PREPARING: '#8B5CF6',
    OUT_FOR_DELIVERY: '#F97316',
    DELIVERED: '#10B981',
    CANCELLED: '#6B7280',
};
const getOrderStatusLabel = (status) => exports.ORDER_STATUS_LABELS[status] ?? status;
exports.getOrderStatusLabel = getOrderStatusLabel;
const getOrderStatusColor = (status) => exports.ORDER_STATUS_COLORS[status] ?? '#6B7280';
exports.getOrderStatusColor = getOrderStatusColor;
// ─── CALCULATION UTILITIES ───────────────────────────────────────────────────
exports.DELIVERY_FEE = 40;
exports.TAX_RATE = 0.05; // 5% GST
const calculateCartTotals = (subtotal) => {
    const taxes = Math.round(subtotal * exports.TAX_RATE);
    const deliveryFee = subtotal > 0 ? exports.DELIVERY_FEE : 0;
    const total = subtotal + taxes + deliveryFee;
    return { subtotal, taxes, deliveryFee, total };
};
exports.calculateCartTotals = calculateCartTotals;
// ─── STRING UTILITIES ─────────────────────────────────────────────────────────
const slugify = (text) => text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
exports.slugify = slugify;
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
exports.generateOtp = generateOtp;
const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `BB-${timestamp}-${random}`;
};
exports.generateOrderNumber = generateOrderNumber;
const maskPhone = (phone) => `${phone.slice(0, 3)}****${phone.slice(-3)}`;
exports.maskPhone = maskPhone;
// ─── VALIDATION UTILITIES ─────────────────────────────────────────────────────
const isValidIndianPhone = (phone) => /^[6-9]\d{9}$/.test(phone);
exports.isValidIndianPhone = isValidIndianPhone;
const isValidPincode = (pincode) => /^\d{6}$/.test(pincode);
exports.isValidPincode = isValidPincode;
//# sourceMappingURL=index.js.map