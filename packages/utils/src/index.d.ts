import { z } from 'zod';
export declare const phoneSchema: z.ZodString;
export declare const otpSchema: z.ZodString;
export declare const sendOtpSchema: z.ZodObject<{
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
}, {
    phone: string;
}>;
export declare const verifyOtpSchema: z.ZodObject<{
    phone: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    otp: string;
}, {
    phone: string;
    otp: string;
}>;
export declare const registerSchema: z.ZodObject<{
    phone: z.ZodString;
    name: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone: string;
    email?: string | undefined;
}, {
    name: string;
    phone: string;
    email?: string | undefined;
}>;
export declare const addressSchema: z.ZodObject<{
    label: z.ZodString;
    addressLine1: z.ZodString;
    addressLine2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    pincode: z.ZodString;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    label: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
    addressLine2?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
}, {
    label: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
    addressLine2?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    isDefault?: boolean | undefined;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const addToCartSchema: z.ZodObject<{
    foodItemId: z.ZodString;
    quantity: z.ZodNumber;
    specialInstructions: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    foodItemId: string;
    quantity: number;
    specialInstructions?: string | undefined;
}, {
    foodItemId: string;
    quantity: number;
    specialInstructions?: string | undefined;
}>;
export declare const updateCartItemSchema: z.ZodObject<{
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    quantity: number;
}, {
    quantity: number;
}>;
export declare const placeOrderSchema: z.ZodObject<{
    addressId: z.ZodString;
    paymentMethod: z.ZodEnum<["UPI", "CARD", "NET_BANKING", "WALLET", "COD"]>;
    walletAmountToUse: z.ZodDefault<z.ZodNumber>;
    specialInstructions: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    addressId: string;
    paymentMethod: "UPI" | "CARD" | "NET_BANKING" | "WALLET" | "COD";
    walletAmountToUse: number;
    specialInstructions?: string | undefined;
}, {
    addressId: string;
    paymentMethod: "UPI" | "CARD" | "NET_BANKING" | "WALLET" | "COD";
    specialInstructions?: string | undefined;
    walletAmountToUse?: number | undefined;
}>;
export declare const walletTopUpSchema: z.ZodObject<{
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    amount: number;
}, {
    amount: number;
}>;
export declare const formatCurrency: (amount: number, currency?: string) => string;
export declare const formatPhone: (phone: string) => string;
export declare const formatDate: (date: Date | string) => string;
export declare const formatDateTime: (date: Date | string) => string;
export declare const ORDER_STATUS_LABELS: Record<string, string>;
export declare const ORDER_STATUS_COLORS: Record<string, string>;
export declare const getOrderStatusLabel: (status: string) => string;
export declare const getOrderStatusColor: (status: string) => string;
export declare const DELIVERY_FEE = 40;
export declare const TAX_RATE = 0.05;
export declare const calculateCartTotals: (subtotal: number) => {
    subtotal: number;
    taxes: number;
    deliveryFee: number;
    total: number;
};
export declare const slugify: (text: string) => string;
export declare const generateOtp: () => string;
export declare const generateOrderNumber: () => string;
export declare const maskPhone: (phone: string) => string;
export declare const isValidIndianPhone: (phone: string) => boolean;
export declare const isValidPincode: (pincode: string) => boolean;
//# sourceMappingURL=index.d.ts.map