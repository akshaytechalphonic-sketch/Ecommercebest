require('dotenv').config();

const sslOptions = process.env.DB_SSL === 'true' || Boolean(process.env.DATABASE_URL?.includes('ssl'))
  ? { ssl: { require: true, rejectUnauthorized: false } }
  : {};

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'multivendor_db',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
    dialectOptions: sslOptions,
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'multivendor_db',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
    dialectOptions: sslOptions,
  },
  production: process.env.DATABASE_URL
    ? {
        use_env_variable: 'DATABASE_URL',
        dialect: 'mysql',
        logging: false,
        dialectOptions: sslOptions,
      }
    : {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || null,
        database: process.env.DB_NAME || 'multivendor_db',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        dialect: 'mysql',
        logging: false,
        dialectOptions: sslOptions,
      },
};
