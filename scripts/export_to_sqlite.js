/**
 * Exports all data from local MySQL (multivendor_db) into an embedded SQLite database (data/multivendor.sqlite)
 * so the application works out-of-the-box with a local file database both locally and on Render without external MySQL.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const UserModel = require('../src/models/user.model');
const RefreshTokenModel = require('../src/models/refreshToken.model');
const PasswordResetTokenModel = require('../src/models/passwordResetToken.model');
const AddressModel = require('../src/models/address.model');
const VendorModel = require('../src/models/vendor.model');
const CategoryModel = require('../src/models/category.model');
const ProductModel = require('../src/models/product.model');
const CartModel = require('../src/models/cart.model');
const CartItemModel = require('../src/models/cartItem.model');
const WishlistModel = require('../src/models/wishlist.model');
const InventoryLogModel = require('../src/models/inventoryLog.model');
const BannerModel = require('../src/models/banner.model');
const SettingModel = require('../src/models/setting.model');
const OrderModel = require('../src/models/order.model');
const OrderItemModel = require('../src/models/orderItem.model');
const PaymentModel = require('../src/models/payment.model');
const CommissionModel = require('../src/models/commission.model');
const SellerPayoutModel = require('../src/models/sellerPayout.model');
const RefundModel = require('../src/models/refund.model');

const modelInitializers = [
  ['User', UserModel],
  ['RefreshToken', RefreshTokenModel],
  ['PasswordResetToken', PasswordResetTokenModel],
  ['Address', AddressModel],
  ['Vendor', VendorModel],
  ['Category', CategoryModel],
  ['Product', ProductModel],
  ['Cart', CartModel],
  ['CartItem', CartItemModel],
  ['Wishlist', WishlistModel],
  ['InventoryLog', InventoryLogModel],
  ['Banner', BannerModel],
  ['Setting', SettingModel],
  ['Order', OrderModel],
  ['OrderItem', OrderItemModel],
  ['Payment', PaymentModel],
  ['Commission', CommissionModel],
  ['SellerPayout', SellerPayoutModel],
  ['Refund', RefundModel],
];

async function exportMysqlToSqlite() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const sqlitePath = path.join(dataDir, 'multivendor.sqlite');
  if (fs.existsSync(sqlitePath)) {
    fs.unlinkSync(sqlitePath);
  }

  const mysqlSeq = new Sequelize(
    process.env.DB_NAME || 'multivendor_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      dialect: 'mysql',
      logging: false,
    }
  );

  const sqliteSeq = new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath,
    logging: false,
  });

  const mysqlModels = {};
  const sqliteModels = {};

  for (const [name, initFn] of modelInitializers) {
    mysqlModels[name] = initFn(mysqlSeq);
    sqliteModels[name] = initFn(sqliteSeq);
  }

  await mysqlSeq.authenticate();
  console.log('Connected to local MySQL database.');

  await sqliteSeq.authenticate();
  await sqliteSeq.query('PRAGMA foreign_keys = OFF;');
  await sqliteSeq.sync({ force: true });
  console.log('Initialized SQLite schema at:', sqlitePath);

  for (const [name] of modelInitializers) {
    const rows = await mysqlModels[name].findAll({ raw: true });
    if (rows.length > 0) {
      // Parse JSON fields if returned as strings or objects from raw query
      const modelAttrs = sqliteModels[name].rawAttributes;
      const cleanedRows = rows.map((row) => {
        const copy = { ...row };
        for (const [key, attr] of Object.entries(modelAttrs)) {
          if (attr.type && attr.type.key === 'JSON' && typeof copy[key] === 'string') {
            try {
              copy[key] = JSON.parse(copy[key]);
            } catch (e) {
              // keep as is
            }
          }
        }
        return copy;
      });
      await sqliteModels[name].bulkCreate(cleanedRows);
    }
    console.log(`Copied ${rows.length} rows for ${name}`);
  }

  await sqliteSeq.query('PRAGMA foreign_keys = ON;');
  await mysqlSeq.close();
  await sqliteSeq.close();
  console.log('Successfully created embedded local SQLite database with all MySQL data!');
}

exportMysqlToSqlite().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
