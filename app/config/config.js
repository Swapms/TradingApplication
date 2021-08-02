const mysql = require('mysql2');
//const mysql = require('mysql2/promise');
const env = process.env.NODE_ENV; // 'dev' or 'test'

/*module.exports  = mysql.createPool({
  connectionLimit : 100, //important
  host     : 'database-1.cgzohsjvm2s5.us-east-2.rds.amazonaws.com',
 //host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'test',
  debug    :  false
});*/

const config = {
  app: {
    port: parseInt(process.env.DEV_APP_PORT) || 8080
  },
  db: {
    pool :mysql.createPool({
      connectionLimit : 100, //important
      host     : 'database-1.cgzohsjvm2s5.us-east-2.rds.amazonaws.com',
     //host     : 'localhost',
      user     : 'root',
      password : 'password',
      database : 'healthplantest',
      debug    :  false
    })
  }
 };
 /*const test = {
  app: {
    port: parseInt(process.env.TEST_APP_PORT) || 8080
  },
  db: {
    pool:mysql.createPool({
      connectionLimit : 100, //important
      host     : 'database-1.cgzohsjvm2s5.us-east-2.rds.amazonaws.com',
     //host     : 'localhost',
      user     : 'root',
      password : 'password',
      database : 'test',
      debug    :  false
    })
  }
 };
 
 const config = {
  dev,
  test
 };*/
 
 module.exports = config