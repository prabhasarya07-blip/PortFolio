require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({ dateStrings: ['DATE'],
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 3,
});

module.exports = pool;

