const mysql = require('mysql');
const pool = require('../config/config');
const { createTokens, validateToken } = require("./helpers/index");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
exports.login = (req, res) => {
    // Validate request
    if (!req.body.Mobile_Number) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
      return;
    }
  
    const user = {
      username: req.body.Mobile_Number,
      password: req.body.password
    };
    console.log(user)
    pool.getConnection((err, connection) => {
        if(err) throw err;
    connection.query(
        'SELECT * FROM `authentication` WHERE `username` = ?',
        [user.username],
        function(err, results) {
            connection.release(); // return the connection to pool
            if(err) throw err;
          console.log(results);
          if (results.length > 0) {
            const dbPassword = results[0].password;
            bcrypt.compare(user.password, dbPassword).then((match) => {
                if (!match) {
                res
                    .status(400)
                    .json({ error: "Wrong Username and Password Combination!" });
                } else {
                userdata = JSON.parse(JSON.stringify(results[0]));  
                const accessToken = createTokens(userdata);
               
                /*res.cookie("access-token", accessToken, {
                    maxAge: 60 * 60 * 24 * 30 * 1000,
                    httpOnly: true,
                });*/

                res.status(200).json({
                    message: 'Login Successful',
                    userId:userdata.user_id,
                    jwtoken: accessToken
                    });
                }
            });
          } else {
            res.status(400).json({ error: "User Doesn't Exist" });
          }
        }
      );
    });
  };
  exports.register = (req, res) => {
    // Validate request
    if (!req.body.Mobile_Number) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
      return;
    }
    // Create a User
    const user = {
      username: req.body.Mobile_Number,
      password: req.body.password
    };
    bcrypt.hash(user.password, 10).then((hash) => {
    let insertQuery = 'INSERT INTO ?? (??,??,??,??) VALUES (?,?,now(),now())';
    let query = mysql.format(insertQuery,["authentication","username","password","createdAt","updatedAt",user.username,hash]);
    console.log(query)
    pool.query(query,(err, resp) => {
       
        if(err) {
            console.error(err);
            res.status(500).send({
                message:
                  err.message || "Some error occurred while creating the User."
              });
            return;
        }
       
        //Add the entry in user_details table 
        let insertQuery = 'INSERT INTO ?? (??,??,??) VALUES (?,?,\'{}\')';
        let query = mysql.format(insertQuery,["user_details","user_id","phone_Number","user_attributes",res.insertId,user.username,]);
        console.log(query)
        pool.query(query,(err, resp) => {
            if(err) {
              console.error(err);
              res.status(500).send({
                  message:
                    err.message || "Some error occurred while creating the User."
                });
              return;
            }
        });
        res.status(200).json({
          message: 'User registeration successful',
          });
    });
   });
  };