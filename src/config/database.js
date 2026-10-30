const path = require('path');
const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const env = require('./env');

const sslOptions = env.DB.SSL
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }
  : {};

// Use embedded local SQLite database when DB_DIALECT=sqlite or when running in cloud (e.g. Render)
// without an external MySQL DATABASE_URL / remote DB_HOST configured.
const isLocalHostDb = !process.env.DB_HOST || process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';
const useEmbeddedSqlite =
  process.env.DB_DIALECT === 'sqlite' ||
  (!env.DATABASE_URL && isLocalHostDb && Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL || process.env.NODE_ENV === 'production'));

let sequelize;
let pool = null;

if (useEmbeddedSqlite) {
  const sqliteStoragePath = process.env.SQLITE_STORAGE || path.join(__dirname, '../../data/multivendor.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqliteStoragePath,
    logging: false,
  });
} else if (env.DATABASE_URL) {
  sequelize = new Sequelize(env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: sslOptions,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  sequelize = new Sequelize(
    env.DB.NAME,
    env.DB.USER,
    env.DB.PASSWORD,
    {
      host: env.DB.HOST,
      port: env.DB.PORT,
      dialect: 'mysql',
      logging: false,
      dialectOptions: sslOptions,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

// Backward compatibility for raw mysql2 pool when using MySQL
if (!useEmbeddedSqlite) {
  const poolConfig = env.DATABASE_URL
    ? env.DATABASE_URL
    : {
        host: env.DB.HOST,
        port: env.DB.PORT,
        user: env.DB.USER,
        password: env.DB.PASSWORD,
        database: env.DB.NAME,
        waitForConnections: true,
        connectionLimit: 10,
        ssl: env.DB.SSL ? { rejectUnauthorized: false } : undefined,
      };

  pool = mysql.createPool(poolConfig);
}

module.exports = sequelize;
module.exports.sequelize = sequelize;
module.exports.pool = pool;
module.exports.useEmbeddedSqlite = useEmbeddedSqlite;
