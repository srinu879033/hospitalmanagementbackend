const mysql = require('mysql');
var conn = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: 'sql6585445',
});

conn.connect((err) => {
  if (err) {
    console.log(err + '----');
  } else {
    console.log('mysql database connected');
  }
});

mysqlQuery = (query) => {
  return new Promise((resolve, reject) => {
    conn.query(query, (err, result, fields) => {
      if (err) {
        console.log(err.message, 'fuck');
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = mysqlQuery;
