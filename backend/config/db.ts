import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'pce_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to MySQL database: ' + (process.env.DB_NAME || 'pce_management'));
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
  });

export default pool;
