const { response } = require('express');
const mysql = require('mysql2/promise');
const config = require('../config/config.js');
const { db: { pool } } = config;
const health_details = require('../models/Health-Details.js');
const healthPlanController = require('./healthPlan-controller.js');

  exports.updateHealthDetails = async (req, res) => {
    console.log(req.body)
    health_details.smoke = req.body.smoking;
    health_details.alcohol = req.body.alcoholIntake;
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
   let insertQuery = 'INSERT INTO user_details (user_attributes,createdDate)'+
                     ' VALUES(JSON_OBJECT(\'location\',?,\'gender\',?,\'dob\',?,\'height\',?,\'weight\',?,\'diet\',?,\'smoke\',?,'+
                     ' \'alcohol\',?,\'excercise\',?,\'family_history\',?,\'exisiting_conditions\',?),now())'
   
   let query = mysql.format(insertQuery,[health_details.location,health_details.gender,health_details.dob
                            ,health_details.height,health_details.weight,health_details.diet,health_details.smoke,health_details.alcohol,health_details.excercise,
                             JSON.stringify(health_details.family_history),JSON.stringify(health_details.exisiting_conditions)]);  
  // console.log(query);
   data = await pool.query(query);
  // console.log(data[0].insertId);
   var responseFromHealthPlan = await healthPlanController.createHealthPlans(data[0].insertId)
   if(responseFromHealthPlan){
    res.status(200).json({
      status:true,
      message:"Data inserted successfully and plans generated",
      data:{user_id:data[0].insertId}
      });
    //  console.log('response sent')
   }
  };