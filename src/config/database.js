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

let sequelize;

if (env.DATABASE_URL) {
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

// Backward compatibility for raw mysql2 pool
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

const pool = mysql.createPool(poolConfig);

module.exports = sequelize;
module.exports.sequelize = sequelize;
module.exports.pool = pool;
