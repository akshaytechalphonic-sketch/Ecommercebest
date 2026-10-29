const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const env = require('./env');

const sequelize = new Sequelize(
  env.DB.NAME,
  env.DB.USER,
  env.DB.PASSWORD,
  {
    host: env.DB.HOST,
    port: env.DB.PORT,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Backward compatibility for raw mysql2 pool
const pool = mysql.createPool({
  host: env.DB.HOST,
  port: env.DB.PORT,
  user: env.DB.USER,
  password: env.DB.PASSWORD,
  database: env.DB.NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = sequelize;
module.exports.sequelize = sequelize;
module.exports.pool = pool;
