/**
 * One-Click Cloud Database Importer
 * Imports multivendor_db_backup.sql into any remote Cloud MySQL database (Aiven, TiDB, Railway, etc.)
 *
 * Usage:
 * node scripts/import_to_cloud.js "mysql://user:password@host:port/database"
 * OR
 * node scripts/import_to_cloud.js host port user password database
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const args = process.argv.slice(2);
  let config = {};

  if (args.length === 0 && !process.env.DATABASE_URL) {
    console.log('------------------------------------------------------------');
    console.log('Multivendor Cloud Database Importer');
    console.log('------------------------------------------------------------');
    console.log('Usage:');
    console.log('  node scripts/import_to_cloud.js "<DATABASE_URL>"');
    console.log('Example:');
    console.log('  node scripts/import_to_cloud.js "mysql://avnadmin:secret@mysql-xxxx.aivencloud.com:12345/defaultdb"');
    console.log('------------------------------------------------------------');
    process.exit(1);
  }

  const sqlFilePath = path.join(__dirname, '..', 'multivendor_db_backup.sql');
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Backup file not found at: ${sqlFilePath}`);
    process.exit(1);
  }

  console.log('Reading database backup SQL file...');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  let connection;
  try {
    if (args[0] && args[0].startsWith('mysql://')) {
      const url = new URL(args[0]);
      config = {
        host: url.hostname,
        port: Number(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.replace(/^\//, ''),
        ssl: { rejectUnauthorized: false },
        multipleStatements: true,
      };
    } else if (args.length >= 5) {
      config = {
        host: args[0],
        port: Number(args[1]) || 3306,
        user: args[2],
        password: args[3],
        database: args[4],
        ssl: { rejectUnauthorized: false },
        multipleStatements: true,
      };
    } else if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      config = {
        host: url.hostname,
        port: Number(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.replace(/^\//, ''),
        ssl: { rejectUnauthorized: false },
        multipleStatements: true,
      };
    }

    console.log(`Connecting to Cloud MySQL at ${config.host}:${config.port}...`);
    connection = await mysql.createConnection(config);
    console.log('Connected successfully!');

    console.log('Importing tables, schema, and sample data into cloud database...');
    // Split and execute statements or execute multipleStatements
    await connection.query(sqlContent);

    console.log('============================================================');
    console.log('SUCCESS: All tables and data imported into Cloud MySQL!');
    console.log('============================================================');
    console.log('\nNow configure these exact variables in Render Dashboard > Environment:');
    console.log(`DB_HOST=${config.host}`);
    console.log(`DB_PORT=${config.port}`);
    console.log(`DB_USER=${config.user}`);
    console.log(`DB_PASSWORD=${config.password}`);
    console.log(`DB_NAME=${config.database}`);
    console.log('DB_SSL=true');
    console.log('============================================================');
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}

main();
