const mysql = require('mysql');
const pool = require('../config/config.js')
const health_details = require('../models/Health-Details.js');
const user_details = require('../models/User.js');
const createHealthPlans = require('./healthPlan-controller.js').createHealthPlans;
// Create and Save a new user
exports.create = (req, res) => {
    // Validate request
    if (!req.body.Mobile_Number) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
      return;
    }
    // Create a User
    const user = {
      Mobile_Number: req.body.Mobile_Number,
      password: req.body.password
    };
    console.log(user)
    let insertQuery = 'INSERT INTO ?? (??,??) VALUES (?,?)';
    let query = mysql.format(insertQuery,["Authentication","Mobile_Number","password",user.Mobile_Number,user.password]);
    pool.query(query,(err, res) => {
        if(err) {
            console.error(err);
            res.status(500).send({
                message:
                  err.message || "Some error occurred while creating the User."
              });
            return;
        }
        // rows added
        console.log("row inserted")
    });
    res.status(200).send(user);
  };

  exports.findAll = (req, res) => {
  /*  connection.query(
      'SELECT * FROM `users` WHERE `name` = ? AND `age` > ?',
      ['Page', 45],
      function(err, results) {
        console.log(results);
      }
    );*/

    res.status(200).send("success");
  };
  //Add Member
  exports.addMember = (req, res) => {
    
    user_details.user_id = req.body.user_id;
    user_details.name = req.body.name;
    user_details.relation = req.body.relation;
    user_details.phone_number = req.body.phone_number;
    user_details.whatsApp_number = req.body.whatsApp_number;
    
   // console.log(JSON.stringify(health_details.excercise))
   //var user_attributes_Json = JSON.stringify(req.body);
   let updateQuery = 'UPDATE user_details'+
   ' SET name = ?,phone_number=?,relation=?,user_attributes = JSON_SET(user_attributes,"$.whatsApp_number",?)'+
   ' WHERE user_id=?';
   let query = mysql.format(updateQuery,[user_details.name,user_details.phone_number,
                            user_details.relation,user_details.whatsApp_number,user_details.user_id]);  
   console.log(query);
   pool.query(query,(err, res) => {
        if(err) {
            console.error(err);
            res.status(500).send({
                message:
                  err.message || "Some error occurred while updating the User."
              });
            return;
        }
        // rows added
        console.log("row UPDATED")
   });
    res.status(200).send("Member Added successfully");
  };

  exports.updateHealthDetails = (req, res) => {
    
    console.log(req.body)
    health_details.user_id = 1;
    health_details.gender = req.body.gender;
    health_details.location = req.body.city;
    health_details.dob = req.body.birthdate;
    health_details.height = req.body.height;
    health_details.weight = req.body.weight;
    health_details.diet = req.body.diet;
    health_details.excercise = req.body.exercise;
    health_details.family_history = req.body.familyHistoryConditions;
    health_details.exisiting_conditions = req.body.diagnosedCondition;
    console.log(JSON.stringify(health_details.family_history))
    console.log(JSON.stringify(health_details.exisiting_conditions))
   //var user_attributes_Json = JSON.stringify(req.body);
   let updateQuery = 'UPDATE user_details'+
   ' SET user_attributes = JSON_SET(user_attributes,"$.location",?,"$.gender",?,"$.dob",?,'+
   ' "$.height",?,"$.weight",?,"$.diet",?,"$.excercise",?,"$.family_history",?,"$.exisiting_conditions",?)'+
   ' WHERE user_id=?';
   let query = mysql.format(updateQuery,[health_details.location,health_details.gender,health_details.dob
                            ,health_details.height,health_details.weight,health_details.diet,health_details.excercise,
                             JSON.stringify(health_details.family_history),JSON.stringify(health_details.exisiting_conditions),1]);  
   console.log(query);
   pool.query(query,(err, res) => {
        if(err) {
            console.error(err);
            res.status(500).send({
                message:
                  err.message || "Some error occurred while updating the User."
              });
            return;
        }
        // rows added
        console.log("row UPDATED")
        //call health plan algo
        createHealthPlans(health_details.user_id);
   });
    res.status(200).send("Data updated successfully");
  };