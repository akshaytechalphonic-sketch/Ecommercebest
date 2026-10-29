const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');

const UserModel = require('./user.model');
const RefreshTokenModel = require('./refreshToken.model');
const PasswordResetTokenModel = require('./passwordResetToken.model');
const AddressModel = require('./address.model');
const VendorModel = require('./vendor.model');
const CategoryModel = require('./category.model');
const ProductModel = require('./product.model');
const CartModel = require('./cart.model');
const CartItemModel = require('./cartItem.model');
const WishlistModel = require('./wishlist.model');
const InventoryLogModel = require('./inventoryLog.model');
const BannerModel = require('./banner.model');
const SettingModel = require('./setting.model');
const OrderModel = require('./order.model');
const OrderItemModel = require('./orderItem.model');
const PaymentModel = require('./payment.model');
const CommissionModel = require('./commission.model');
const SellerPayoutModel = require('./sellerPayout.model');
const RefundModel = require('./refund.model');

// Initialize models
const User = UserModel(sequelize);
const RefreshToken = RefreshTokenModel(sequelize);
const PasswordResetToken = PasswordResetTokenModel(sequelize);
const Address = AddressModel(sequelize);
const Vendor = VendorModel(sequelize);
const Category = CategoryModel(sequelize);
const Product = ProductModel(sequelize);
const Cart = CartModel(sequelize);
const CartItem = CartItemModel(sequelize);
const Wishlist = WishlistModel(sequelize);
const InventoryLog = InventoryLogModel(sequelize);
const Banner = BannerModel(sequelize);
const Setting = SettingModel(sequelize);
const Order = OrderModel(sequelize);
const OrderItem = OrderItemModel(sequelize);
const Payment = PaymentModel(sequelize);
const Commission = CommissionModel(sequelize);
const SellerPayout = SellerPayoutModel(sequelize);
const Refund = RefundModel(sequelize);

// Model Associations
User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});
RefreshToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(PasswordResetToken, {
  foreignKey: 'user_id',
  as: 'passwordResetTokens',
  onDelete: 'CASCADE',
});
PasswordResetToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(Address, {
  foreignKey: 'user_id',
  as: 'addresses',
  onDelete: 'CASCADE',
});
Address.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasOne(Vendor, {
  foreignKey: 'user_id',
  as: 'vendor',
  onDelete: 'CASCADE',
});
Vendor.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Category Self-Referencing Associations for Subcategories
Category.hasMany(Category, {
  foreignKey: 'parent_id',
  as: 'subcategories',
  onDelete: 'CASCADE',
});
Category.belongsTo(Category, {
  foreignKey: 'parent_id',
  as: 'parent',
});

// Product Associations with Vendor and Categories
Vendor.hasMany(Product, {
  foreignKey: 'vendor_id',
  as: 'products',
  onDelete: 'CASCADE',
});
Product.belongsTo(Vendor, {
  foreignKey: 'vendor_id',
  as: 'vendor',
});

Category.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products',
  onDelete: 'RESTRICT',
});
Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category',
});

Product.belongsTo(Category, {
  foreignKey: 'subcategory_id',
  as: 'subcategory',
});

// Cart Associations
User.hasOne(Cart, {
  foreignKey: 'user_id',
  as: 'cart',
  onDelete: 'CASCADE',
});
Cart.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Cart.hasMany(CartItem, {
  foreignKey: 'cart_id',
  as: 'items',
  onDelete: 'CASCADE',
});
CartItem.belongsTo(Cart, {
  foreignKey: 'cart_id',
  as: 'cart',
});

Product.hasMany(CartItem, {
  foreignKey: 'product_id',
  as: 'cartItems',
  onDelete: 'CASCADE',
});
CartItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

// Wishlist Associations
User.hasMany(Wishlist, {
  foreignKey: 'user_id',
  as: 'wishlists',
  onDelete: 'CASCADE',
});
Wishlist.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Product.hasMany(Wishlist, {
  foreignKey: 'product_id',
  as: 'wishlists',
  onDelete: 'CASCADE',
});
Wishlist.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

// Inventory Audit Logs Associations
Product.hasMany(InventoryLog, {
  foreignKey: 'product_id',
  as: 'inventoryLogs',
  onDelete: 'CASCADE',
});
InventoryLog.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

Vendor.hasMany(InventoryLog, {
  foreignKey: 'vendor_id',
  as: 'inventoryLogs',
  onDelete: 'SET NULL',
});
InventoryLog.belongsTo(Vendor, {
  foreignKey: 'vendor_id',
  as: 'vendor',
});

User.hasMany(InventoryLog, {
  foreignKey: 'user_id',
  as: 'inventoryLogs',
  onDelete: 'CASCADE',
});
InventoryLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'actor',
});

// Category and Banner Associations
Category.hasMany(Banner, {
  foreignKey: 'category_id',
  as: 'banners',
  onDelete: 'SET NULL',
});
Banner.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category',
});

// Order & OrderItem Associations
User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'orders',
  onDelete: 'RESTRICT',
});
Order.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'customer',
});

Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items',
  onDelete: 'CASCADE',
});
OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

Vendor.hasMany(OrderItem, {
  foreignKey: 'vendor_id',
  as: 'orderItems',
  onDelete: 'RESTRICT',
});
OrderItem.belongsTo(Vendor, {
  foreignKey: 'vendor_id',
  as: 'vendor',
});

Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  as: 'orderItems',
  onDelete: 'RESTRICT',
});
OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

// Payment Associations
Order.hasMany(Payment, {
  foreignKey: 'order_id',
  as: 'payments',
  onDelete: 'CASCADE',
});
Payment.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

User.hasMany(Payment, {
  foreignKey: 'user_id',
  as: 'payments',
  onDelete: 'RESTRICT',
});
Payment.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Commission & Earnings Associations
Order.hasMany(Commission, {
  foreignKey: 'order_id',
  as: 'commissions',
  onDelete: 'CASCADE',
});
Commission.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

OrderItem.hasOne(Commission, {
  foreignKey: 'order_item_id',
  as: 'commission',
  onDelete: 'CASCADE',
});
Commission.belongsTo(OrderItem, {
  foreignKey: 'order_item_id',
  as: 'orderItem',
});

Vendor.hasMany(Commission, {
  foreignKey: 'vendor_id',
  as: 'commissions',
  onDelete: 'RESTRICT',
});
Commission.belongsTo(Vendor, {
  foreignKey: 'vendor_id',
  as: 'vendor',
});

// Seller Payout / Withdrawal Associations
Vendor.hasMany(SellerPayout, {
  foreignKey: 'vendor_id',
  as: 'payouts',
  onDelete: 'RESTRICT',
});
SellerPayout.belongsTo(Vendor, {
  foreignKey: 'vendor_id',
  as: 'vendor',
});

// Refund Associations
Order.hasMany(Refund, {
  foreignKey: 'order_id',
  as: 'refunds',
  onDelete: 'CASCADE',
});
Refund.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

OrderItem.hasMany(Refund, {
  foreignKey: 'order_item_id',
  as: 'refunds',
  onDelete: 'SET NULL',
});
Refund.belongsTo(OrderItem, {
  foreignKey: 'order_item_id',
  as: 'orderItem',
});

Vendor.hasMany(Refund, {
  foreignKey: 'vendor_id',
  as: 'refunds',
  onDelete: 'RESTRICT',
});
Refund.belongsTo(Vendor, {
  foreignKey: 'vendor_id',
  as: 'vendor',
});

User.hasMany(Refund, {
  foreignKey: 'user_id',
  as: 'refunds',
  onDelete: 'RESTRICT',
});
Refund.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Payment.hasMany(Refund, {
  foreignKey: 'payment_id',
  as: 'refunds',
  onDelete: 'SET NULL',
});
Refund.belongsTo(Payment, {
  foreignKey: 'payment_id',
  as: 'payment',
});

const db = {
  sequelize,
  Sequelize,
  User,
  RefreshToken,
  PasswordResetToken,
  Address,
  Vendor,
  Category,
  Product,
  Cart,
  CartItem,
  Wishlist,
  InventoryLog,
  Banner,
  Setting,
  Order,
  OrderItem,
  Payment,
  Commission,
  SellerPayout,
  Refund,
};

module.exports = db;

