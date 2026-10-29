require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  DATABASE_URL: process.env.DATABASE_URL || process.env.MYSQL_URL || null,
  
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: Number(process.env.DB_PORT || 3306),
    NAME: process.env.DB_NAME || 'multivendor_db',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    SSL: process.env.DB_SSL === 'true' || Boolean(process.env.DATABASE_URL?.includes('ssl')),
  },

  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'default_access_secret_change_in_production_multivendor',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_in_production_multivendor',
    ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
    REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 10),
};

module.exports = env;
