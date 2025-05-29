// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Recommended: Add timezone setting to ensure consistency
  timezone: '+00:00' // Or your preferred timezone, e.g., 'Asia/Jakarta' if storing in local time
});

module.exports = pool;