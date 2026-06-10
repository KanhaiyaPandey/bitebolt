'use strict';
// ─── ENUMS ────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, '__esModule', { value: true });
exports.NotificationType =
  exports.WalletTransactionReason =
  exports.WalletTransactionType =
  exports.PaymentMethod =
  exports.PaymentStatus =
  exports.OrderStatus =
  exports.UserRole =
    void 0;
var UserRole;
(function (UserRole) {
  UserRole['CUSTOMER'] = 'CUSTOMER';
  UserRole['ADMIN'] = 'ADMIN';
  UserRole['DELIVERY'] = 'DELIVERY';
})(UserRole || (exports.UserRole = UserRole = {}));
var OrderStatus;
(function (OrderStatus) {
  OrderStatus['PENDING'] = 'PENDING';
  OrderStatus['ACCEPTED'] = 'ACCEPTED';
  OrderStatus['REJECTED'] = 'REJECTED';
  OrderStatus['PREPARING'] = 'PREPARING';
  OrderStatus['OUT_FOR_DELIVERY'] = 'OUT_FOR_DELIVERY';
  OrderStatus['DELIVERED'] = 'DELIVERED';
  OrderStatus['CANCELLED'] = 'CANCELLED';
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
  PaymentStatus['PENDING'] = 'PENDING';
  PaymentStatus['CAPTURED'] = 'CAPTURED';
  PaymentStatus['FAILED'] = 'FAILED';
  PaymentStatus['REFUNDED'] = 'REFUNDED';
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
  PaymentMethod['UPI'] = 'UPI';
  PaymentMethod['CARD'] = 'CARD';
  PaymentMethod['NET_BANKING'] = 'NET_BANKING';
  PaymentMethod['WALLET'] = 'WALLET';
  PaymentMethod['COD'] = 'COD';
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var WalletTransactionType;
(function (WalletTransactionType) {
  WalletTransactionType['CREDIT'] = 'CREDIT';
  WalletTransactionType['DEBIT'] = 'DEBIT';
})(WalletTransactionType || (exports.WalletTransactionType = WalletTransactionType = {}));
var WalletTransactionReason;
(function (WalletTransactionReason) {
  WalletTransactionReason['ORDER_PAYMENT'] = 'ORDER_PAYMENT';
  WalletTransactionReason['ORDER_REFUND'] = 'ORDER_REFUND';
  WalletTransactionReason['TOP_UP'] = 'TOP_UP';
  WalletTransactionReason['CASHBACK'] = 'CASHBACK';
})(WalletTransactionReason || (exports.WalletTransactionReason = WalletTransactionReason = {}));
var NotificationType;
(function (NotificationType) {
  NotificationType['ORDER_UPDATE'] = 'ORDER_UPDATE';
  NotificationType['PAYMENT'] = 'PAYMENT';
  NotificationType['PROMOTIONAL'] = 'PROMOTIONAL';
  NotificationType['SYSTEM'] = 'SYSTEM';
})(NotificationType || (exports.NotificationType = NotificationType = {}));
//# sourceMappingURL=index.js.map
