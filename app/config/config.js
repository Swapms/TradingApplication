
const mysql = require('mysql2');
//const mysql = require('mysql2/promise');

module.exports  = mysql.createPool({
  connectionLimit : 100, //important
  host     : 'database-1.cgzohsjvm2s5.us-east-2.rds.amazonaws.com',
 //host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'demo',
  debug    :  false
});