// =====================================
// utils/db.js (reusable MySQL connection)
const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306

});

connection.connect((err) => {
  if (err) {
    console.error('❌ Failed to connect to MySQL:', err.message);
  }
});

module.exports = connection;
