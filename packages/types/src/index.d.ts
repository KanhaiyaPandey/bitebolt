export declare enum UserRole {
    CUSTOMER = "CUSTOMER",
    ADMIN = "ADMIN",
    DELIVERY = "DELIVERY"
}
export declare enum OrderStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    PREPARING = "PREPARING",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    CAPTURED = "CAPTURED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare enum PaymentMethod {
    UPI = "UPI",
    CARD = "CARD",
    NET_BANKING = "NET_BANKING",
    WALLET = "WALLET",
    COD = "COD"
}
export declare enum WalletTransactionType {
    CREDIT = "CREDIT",
    DEBIT = "DEBIT"
}
export declare enum WalletTransactionReason {
    ORDER_PAYMENT = "ORDER_PAYMENT",
    ORDER_REFUND = "ORDER_REFUND",
    TOP_UP = "TOP_UP",
    CASHBACK = "CASHBACK"
}
export declare enum NotificationType {
    ORDER_UPDATE = "ORDER_UPDATE",
    PAYMENT = "PAYMENT",
    PROMOTIONAL = "PROMOTIONAL",
    SYSTEM = "SYSTEM"
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    meta?: PaginationMeta;
    error?: string;
    statusCode: number;
}
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface User {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserProfile extends User {
    addresses: Address[];
    walletBalance: number;
}
export interface Address {
    id: string;
    userId: string;
    label: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export type CreateAddressDto = Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type UpdateAddressDto = Partial<CreateAddressDto>;
export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface FoodItem {
    id: string;
    categoryId: string;
    category?: Category;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    discountedPrice: number | null;
    imageUrl: string | null;
    images: string[];
    isVeg: boolean;
    isAvailable: boolean;
    preparationTime: number;
    rating: number;
    totalRatings: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface CartItem {
    id: string;
    userId: string;
    foodItemId: string;
    foodItem?: FoodItem;
    quantity: number;
    specialInstructions: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface Cart {
    items: CartItem[];
    itemCount: number;
    subtotal: number;
    deliveryFee: number;
    taxes: number;
    total: number;
}
export interface OrderItem {
    id: string;
    orderId: string;
    foodItemId: string;
    foodItem?: Pick<FoodItem, 'id' | 'name' | 'imageUrl' | 'isVeg'>;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
    specialInstructions: string | null;
}
export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    user?: Pick<User, 'id' | 'name' | 'phone'>;
    addressId: string;
    deliveryAddress?: Address;
    status: OrderStatus;
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    taxes: number;
    discount: number;
    total: number;
    specialInstructions: string | null;
    estimatedDeliveryTime: number | null;
    payment?: Payment;
    createdAt: Date;
    updatedAt: Date;
}
export interface Payment {
    id: string;
    orderId: string;
    userId: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    razorpaySignature: string | null;
    walletAmountUsed: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Wallet {
    id: string;
    userId: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface WalletTransaction {
    id: string;
    walletId: string;
    orderId: string | null;
    type: WalletTransactionType;
    reason: WalletTransactionReason;
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: Date;
}
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data: Record<string, unknown>;
    isRead: boolean;
    createdAt: Date;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface AuthUser {
    id: string;
    phone: string;
    name: string | null;
    role: UserRole;
}
export interface SendOtpDto {
    phone: string;
}
export interface VerifyOtpDto {
    phone: string;
    otp: string;
}
export interface RegisterDto {
    phone: string;
    name: string;
    email?: string;
}
//# sourceMappingURL=index.d.ts.map