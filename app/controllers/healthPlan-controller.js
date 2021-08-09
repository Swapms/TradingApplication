const mysql = require('mysql2/promise');
const config = require('../config/config.js');
const { db: { pool } } = config;
const healthRoute = require('../routes/health-route.js');
const healthPlan = require('../models/HealthPlan.js');
//const { json } = require('body-parser');
const { getAge, getBMI } = require("./helpers/index");
const plan = require('../files/checkup_details.json');

// Create and Save a new user
exports.getHealthPlans = async (req, res) => {
  console.log(req.params)
  // Validate request
  const user_id = req.params.id;

  if (!user_id) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  //get plans from table
  const connection = await pool.getConnection();
  
  const selectQuery = 'SELECT h.checkup_id, h.checkup_name,r.recomm_level ' +
      ' FROM healthplan h ' +
      ' INNER JOIN `recommendedandcustomizedplan` r' +
      ' ON h.checkup_id = r.checkup_id where user_id = ? order by checkup_category;'
  let query = mysql.format(selectQuery, [user_id]);
  let rows = await connection.query(query);
  if(rows.length > 0){
    let recommendedcount = 0;
    let result = [];
      let testTypes = [];
      const selectQueryMain = 'SELECT count(h.checkup_category) as count, h.checkup_category ' +
        ' FROM healthplan h ' +
        ' INNER JOIN `recommendedandcustomizedplan` r' +
        ' ON h.checkup_id = r.checkup_id where user_id = ? group by checkup_category ;'
      let querymain = mysql.format(selectQueryMain, [user_id]);
      rowsmain = await connection.query(querymain);
      connection.release();
      if (rowsmain.length > 0) {
        jsondata = JSON.parse(JSON.stringify(rowsmain));
      //  console.log(rows)
        let startPtr = 0, endPtr = 0;
        jsondata[0].forEach(function (healthplan) {
          endPtr = endPtr + healthplan.count;
          for (let i = startPtr; i < endPtr; i++) {
            testTypes.push(rows[0][i]);
          }
          recommendedcount = recommendedcount + healthplan.count;
          result.push({ testName: healthplan.checkup_category, testTypes: testTypes });
          startPtr = healthplan.count;
          testTypes = [];
        });
        res.status(200).json({
          status: true,
          messages: "success",
          data: JSON.parse(JSON.stringify({ Recommended: result,recommendedcount:recommendedcount }))
        });
      }
  }
};

exports.getHealthPlanbyId = async (req, res) => {
  // Validate request
  console.log(req.params.user_id);
  const user_id = req.params.user_id;
  const checkup_id = req.params.checkup_id;

  if (!user_id || !checkup_id) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  const connection = await pool.getConnection();
  
  const selectQuery = 'SELECT r.recomm_level,' +
      ' r.additional_fields->>"$.frequency" frequency,r.additional_fields->>"$.why_recomm" why_recomm ,' +
      ' h.healthplan_attributes->>"$.conditions" conditions,h.healthplan_attributes->>"$.test_details" test_details ,' +
      ' h.healthplan_attributes->>"$.other_info" other_info'+
      ' FROM `recommendedandcustomizedplan` r,`healthplan` h' +
      ' WHERE r.`user_id` = ? AND r.`checkup_id` = ? AND h.`checkup_id` = ?' ;

  let query = mysql.format(selectQuery, [user_id, checkup_id,checkup_id]);
  let rows = await connection.query(query);
   connection.release(); 
   if (rows.length > 0 && plan != null ) {
    let result = [];
    rows =  JSON.parse(JSON.stringify(rows[0]));
    let frequency = rows[0].frequency;
    let why_recomm = rows[0].why_recomm;
    let conditions = rows[0].conditions;
    let test_details = rows[0].test_details;
    let other_info = rows[0].other_info;
    let why_recomm_arr = why_recomm.split(",")
       
    for (let i = 0; i < why_recomm_arr.length; i++) {
      result.push(plan[why_recomm_arr[i]])
    }
    let finalResult = '';
    if(rows[0].recomm_level == 0){
      finalResult = 'This checkup is highly recommended for you.' +finalResult;
    }else{
      finalResult = 'This checkup is recommended for you.' +finalResult;
    }
    //why recommonded
    finalResult = finalResult + 'Because ' + result.toString().replace(/.,/g, " and ");
    //frequency
    finalResult = finalResult + 'The recommended frequency for your risk level is '+plan[frequency];
    //conditions
    if(conditions != '' && conditions != null)
        finalResult = finalResult + 'This checkup is used to diagnose ' +plan[conditions];
   
    finalResult = finalResult + plan[test_details] + plan[other_info];
 //   jsonData = JSON.parse(JSON.stringify({ recomm_level: rows[0].recomm_level, frequency: plan[frequency], why_recomm: finalResult }));
    res.status(200).json({
      status: true,
      messages: "success",
      data: JSON.parse(JSON.stringify({finalResult}))
    });
  
  }else{
    res.status(200).json({
      status: true,
      messages: "success",
      data: ''
    });
  }

};

//async function createHealthPlans (user_id) {
  exports.createHealthPlans = async (user_id) => {
  const connection = await pool.getConnection();
  
  const selectQuery = 'SELECT user_attributes->>"$.dob" dob,user_attributes->>"$.gender" gender,' +
  ' user_attributes->>"$.height" height,user_attributes->>"$.weight" weight,user_attributes->>"$.family_history" family_history, ' +
  ' user_attributes->>"$.diet" diet , user_attributes->>"$.smoke" smoke,user_attributes->>"$.alcohol" alcohol,user_attributes->>"$.exisiting_conditions" exisiting_conditions,user_attributes->>"$.excercise" excercise ' +
  ' FROM `user_details` WHERE `user_id` = ?';
  let query = mysql.format(selectQuery, [user_id]);
  let rows = await connection.query(query)
  connection.release();
  if(rows.length> 0){
    let jsondata = JSON.parse(JSON.stringify(rows[0]))
    console.log(jsondata[0])
    const age = getAge("'" + (jsondata[0].dob) + "'")
        let height = jsondata[0].height;
        console.log(jsondata[0].dob)
        const bmi = getBMI(height, jsondata[0].weight)
        let gender = jsondata[0].gender;
        let family_history = jsondata[0].family_history;
        let exisiting_conditions = jsondata[0].exisiting_conditions;
  
      await generatePlansForBloodTest(user_id, age, bmi, jsondata.diet, jsondata.smoke, jsondata.alcohol, jsondata.excercise, gender, exisiting_conditions, family_history)

      await generatePlansForDiagnostic(user_id, age, bmi,jsondata.diet,jsondata.smoke, jsondata.alcohol, jsondata.excercise, gender, exisiting_conditions,family_history)

      await generatePlansForDoctorCheckup(user_id, age, bmi,jsondata.diet,jsondata.smoke, jsondata.alcohol, jsondata.excercise, gender, exisiting_conditions,family_history);

      return true;
    
    }
}

/**
 * This function is used to create plans under blood test
 * @param {*} age 
 * @param {*} gender 
 * @param {*} exisiting_conditions 
 * @param {*} family_history 
 */
async function generatePlansForBloodTest(user_id, age, bmi, diet,smoke,alcohol, excercise, gender, exisiting_conditions,family_history) {
  let recomm_level = '', frequency = '';
  let why_recomm_arr = [];
  //condition for blood test PSA, get checkup_id from healthplan table
  if (gender === 'male') {
    if (exisiting_conditions.includes("Cancer -  Prostate")) {
      recomm_level = 1;
      frequency = "frequency_blood_PSA_c1";
      why_recomm_arr.push("recomm_blood_PSA_c1");
    } else if (age > 39 && age < 76 && family_history.includes("Cancer -  Prostate")) {
        recomm_level = 1;
        frequency = "frequency_blood_PSA_c2";
        why_recomm_arr.push("recomm_blood_PSA_c2");
    } else if (age > 39 && age < 76 && (family_history.includes('Cancer - Ovarian') || family_history.includes('Cancer - Breast'))) {
        recomm_level = 1;
        frequency = "frequency_blood_PSA_c3";
        why_recomm_arr.push("recomm_blood_PSA_c3");
    } else if(age > 44 && age < 76){
      recomm_level = 0;
      frequency = "frequency_blood_PSA_c4";
      why_recomm_arr.push("recomm_blood_PSA_c4");
    } 
    
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
   await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Prostate Specific Antigen (PSA)');
    recomm_level = ''
    why_recomm_arr = [];
  }
 //Blood Test Fecal occult blood test
 if(exisiting_conditions.includes("Cancer -  Colorectal / colon")){
  recomm_level = 1;
  frequency = "frequency_blood_FCBT_c1";
  why_recomm_arr.push("recomm_blood_FCBT_c1");
 }else if (age > 39 && age < 76 && family_history.includes("Cancer -  Colorectal / colon")) {
  recomm_level = 1;
  frequency = "frequency_blood_FCBT_c2";
  why_recomm_arr.push("recomm_blood_FCBT_c2");
} else if (age > 49 && age < 76) {
  recomm_level = 0;
  frequency = "frequency_blood_FCBT_c3";
  why_recomm_arr.push("recomm_blood_FCBT_c3");
}
if (recomm_level != '' || why_recomm_arr.length > 0) {
  await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Fecal Occult Blood Test');
  recomm_level = ''
  why_recomm_arr = [];
}
  //condition for blood test CA-125
  if (gender == 'female') {
    if (exisiting_conditions.includes("Cancer - Ovarian")) {
      recomm_level = 1;
      frequency = "frequency_blood_CA-125_c1";
      why_recomm_arr.push("recomm_blood_CA-125_c1");
    } else if (age > 29 && family_history.includes("Cancer - Ovarian") && family_history.includes("Cancer - Breast")) {
      recomm_level = 1;
      frequency = "frequency_blood_CA-125_c2";
      why_recomm_arr.push("recomm_blood_CA-125_c2");
    }
   if (recomm_level != '' || why_recomm_arr.length > 0) {
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'CA-125');
      recomm_level = '';
      why_recomm_arr = [];
    }
  }

  //condition for blood test CBC
  if (exisiting_conditions.includes('Diabetes') || exisiting_conditions.includes('Hypertension')
    || exisiting_conditions.includes('Hypercholesterolemia')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_CBC_c1");
  }else{
    if (bmi > 22) {
      recomm_level = 1;
      why_recomm_arr.push("recomm_blood_CBC_c2");
    }
    if (excercise == 'Less than 30 minutes' || excercise == 'More than 30 minutes and less than 1.5 hour') {
      recomm_level = 1;
      why_recomm_arr.push("recomm_blood_CBC_c3");
    }
    if (smoke > 0) {
      recomm_level = 1;
      why_recomm_arr.push("recomm_smoke>0");
    }
    if (alcohol == 'Yes') {
      recomm_level = 1;
      why_recomm_arr.push("recomm_alcohol_yes");
    }
    if (age > 59) {
      recomm_level = 1;
      why_recomm_arr.push("recomm_age>59");
    }
  }
  
 if (recomm_level != '' || why_recomm_arr.length > 0) {
    frequency = "frequency_blood_CBC_c1";
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Complete Blood Count (CBC)');
    recomm_level = '';
    why_recomm_arr = [];
  } else {
    //only when recomm level is blank then only the lower recomm level condition will be excecuted
    if (age > 29 && age < 60) {
      recomm_level = 0;
      frequency = "frequency_age>29andage<60";
      why_recomm_arr.push("recomm_age>29andage<60");
    } else if (age > 18 && age < 30) {
      recomm_level = 0;
      frequency = "frequency_age>18andage<30";
      why_recomm_arr.push("recomm_age>18andage<30");
    }
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
  await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Complete Blood Count (CBC)');
    recomm_level = ''
    why_recomm_arr = [];
  }
  //condition for blood test Lipid Profie
  if (exisiting_conditions.includes('Diabetes') || exisiting_conditions.includes('Hypertension')
    || exisiting_conditions.includes('Hypercholesterolemia') || exisiting_conditions.includes('Cardiovascular disease')
    || exisiting_conditions.includes('Kidney disease')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_LipidProfie_c1");
  }
  if (family_history.includes('Cardiovascular disease')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_LipidProfie_c2");
  }
  if (bmi > 22) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_bmi>22");
  }
  if (excercise == 'Less than 30 minutes' || excercise == 'More than 30 minutes and less than 1.5 hour') {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_LipidProfie_c3");
  }
  if (smoke > 0) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_smoke>0");
  }
  if (alcohol == 'Yes') {
    recomm_level = 1;
    why_recomm_arr.push("recomm_alcohol_yes");
  }
  if (age > 54) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_age>54");
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
    frequency = "frequency_blood_LipidProfie_c1";
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Lipid Profie');
    recomm_level = '';
    why_recomm_arr = [];
  } else {
    //only when recomm level is blank then only the lower recomm level condition will be excecuted
    if (age > 29 && age < 55) {
      recomm_level = 0;
      frequency = "frequency_age>29andage<55";
      why_recomm_arr.push("recomm_age>29andage<55");
    } else if (age > 18 && age < 30) {
      recomm_level = 0;
      frequency = "frequency_age>18andage<30";
      why_recomm_arr.push("recomm_age>18andage<30");
    }
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
  await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Lipid Profie');
    recomm_level = ''
    why_recomm_arr = [];
  }

  //condition for blood test Sugar Profile (HbA1c)
  if (exisiting_conditions.includes('Diabetes') || exisiting_conditions.includes('Prediabetes')
    || exisiting_conditions.includes('Gestational diabetes') || exisiting_conditions.includes('Hypertension')
    || exisiting_conditions.includes('Hypercholesterolemia') || exisiting_conditions.includes('Polycystic ovarian syndrome')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_SugarProfie_c1");
  }else{
    if (family_history.includes('Diabetes')) {
      recomm_level = 1;
      why_recomm_arr.push("recomm_blood_SugarProfie_c2");
    }
    if (bmi > 22) {
      recomm_level = 1;
      why_recomm_arr.push("recomm_bmi>22");
    }
    if (excercise == 'Less than 30 minutes' || excercise == 'More than 30 minutes and less than 1.5 hour') {
      recomm_level = 1;
      why_recomm_arr.push("recomm_blood_SugarProfie_c3");
    }
    if (age > 59) {
      recomm_level = 1;
      why_recomm_arr.push("recomm_age>59");
    }
  }
  
 if (recomm_level != '' || why_recomm_arr.length > 0) {
    frequency = "frequency_blood_SugarProfie_c1";
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Sugar Profile (HbA1c)');
    recomm_level = '';
    why_recomm_arr = [];
  } else {
    //only when recomm level is blank then only the lower recomm level condition will be excecuted
    if (age > 29 && age < 60) {
      recomm_level = 0;
      frequency = "frequency_age>18andage<30";
      why_recomm_arr.push("recomm_age>29andage<60");
    } else if (age > 18 && age < 30) {
      recomm_level = 0;
      frequency = "frequency_age>18andage<30";
      why_recomm_arr.push("recomm_age>18andage<30");
    }
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
  await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Sugar Profile (HbA1c)');
    recomm_level = ''
    why_recomm_arr = [];
  }

  //condition for blood test Thyroid profile
  if (exisiting_conditions.includes('Thyroid disease')) {
    recomm_level = 1;
    frequency = "frequency_blood_ThyroidProfie_c1";
    why_recomm_arr.push("recomm_blood_ThyroidProfie_c1");
  }else{
    if (exisiting_conditions.includes('Diabetes')) {
      frequency = "frequency_blood_ThyroidProfie_c1";
      recomm_level = 1;
      why_recomm_arr.push("recomm_blood_ThyroidProfie_c2");
    }
    if (family_history.includes('Thyroid disease')) {
      recomm_level = 1;
      frequency = "frequency_blood_ThyroidProfie_c1";
      why_recomm_arr.push("recomm_blood_ThyroidProfie_c3");
    }
    if (age > 59) {
      frequency = "frequency_blood_ThyroidProfie_c1";
      recomm_level = 1;
      why_recomm_arr.push("recomm_blood_age>59");
    }
    if(age > 18 && age <60 && gender == 'female'){
      //frequency is different here
      if(recomm_level == '')
         frequency = "frequency_blood_ThyroidProfie_c2";
      recomm_level = 1;
      why_recomm_arr.push("recomm_blood_ThyroidProfie_c4");
    }
  }
  
 if (recomm_level != '' || why_recomm_arr.length > 0) {
  await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Thyroid profile');
    recomm_level = '';
    why_recomm_arr = [];
  } else if (age > 18 && age < 60) {
    recomm_level = 0;
    frequency = "frequency_blood_ThyroidProfie_c3";
    why_recomm_arr.push("recomm_blood_ThyroidProfie_c5");
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Thyroid profile');
    recomm_level = ''
    why_recomm_arr = [];
  }

  //condition for blood test Liver profile 
  if(exisiting_conditions.includes('Liver disease')){
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_LiverProfie_c1");
  }
  else{
    if (exisiting_conditions.includes('Diabetes') || exisiting_conditions.includes('Hypertension')
    || exisiting_conditions.includes('Hypercholesterolemia')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_LiverProfie_c2");
  }
  if (family_history.includes('Liver disease')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_LiverProfie_c3");
  }
  if (bmi > 22) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_bmi>22");
  }
  if (alcohol == 'Yes') {
    recomm_level = 1;
    why_recomm_arr.push("recomm_alcohol_yes");
  }
  if (age > 59) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_age>59");
  }

  }
  
 if (recomm_level != '' || why_recomm_arr.length > 0) {
    frequency = "frequency_blood_LiverProfie_c1";
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Liver Function Test');
    recomm_level = '';
    why_recomm_arr = [];
  } else {
    //only when recomm level is blank then only the lower recomm level condition will be excecuted
    if (age > 29 && age < 60) {
      recomm_level = 0;
      frequency = "frequency_blood_age>29_and_age<60";
      why_recomm_arr.push("recomm_blood_age>29_and_age<60");
    } else if (age > 18 && age < 30) {
      recomm_level = 0;
      frequency = "frequency_blood_age>29_and_age<30";
      why_recomm_arr.push("recomm_blood_age>18_and_age<30");
    }

   if (recomm_level != '' || why_recomm_arr.length > 0) {
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Sugar Profile (HbA1c)');
      recomm_level = ''
      why_recomm_arr = [];
    }
  }

  //condition for blood test Kidney Function Test 
  if (exisiting_conditions.includes('Kidney disease')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_Kidney_c1");
  }else{
    if (exisiting_conditions.includes('Diabetes') || exisiting_conditions.includes('Hypertension')
    || exisiting_conditions.includes('Hypercholesterolemia')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_Kidney_c2");
  }
  if (family_history.includes('Kidney disease')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_Kidney_c3");
  }
  if (age > 59) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_age>59");
  }

  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
    frequency = "frequency_blood_Kidney_c1";
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Kidney Function Test');
    recomm_level = '';
    why_recomm_arr = [];
  } else {
    //only when recomm level is blank then only the lower recomm level condition will be excecuted
    if (age > 29 && age < 60) {
      recomm_level = 0;
      frequency = "frequency_age>29andage<60";
      why_recomm_arr.push("recomm_age>29andage<60");
    } else if (age > 18 && age < 30) {
      recomm_level = 0;
      frequency = "frequency_age>18andage<30";
      why_recomm_arr.push("recomm_age>18andage<30");
    }

   if (recomm_level != '' || why_recomm_arr.length > 0) {
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Kidney Function Test');
      recomm_level = ''
      why_recomm_arr = [];
    }
  }
  //condition for blood test Pancreas profile
  if (exisiting_conditions.includes('Pancreatic disease')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_Pancreas_c1");
    frequency = "frequency_blood_Pancreas_c1";
  }else{
    if (alcohol == 'Yes') {
      recomm_level = 1;
      why_recomm_arr.push("recomm_alcohol_yes");
      frequency = "frequency_blood_Pancreas_c2";
    }
    if (smoke > 0) {
      recomm_level = 1;
      why_recomm_arr.push("recomm_blood_smoke_>0");
      frequency = "frequency_blood_Pancreas_c2";
    }
  }

 if (recomm_level != '' || why_recomm_arr.length > 0) {
  await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Pancreas Profile');
    recomm_level = '';
    why_recomm_arr = [];
  }

  //condition for blood test Iron Studies
  if (age > 18 && age < 60 && gender == 'female') {
    recomm_level = 0;
    why_recomm_arr.push("recomm_blood_IronStudies_c1");
  }
  if (age > 59) {
    recomm_level = 0;
    why_recomm_arr.push("recomm_age>59");
  }
  if (diet == 'Vegetarian') {
    recomm_level = 0;
    why_recomm_arr.push("recomm_veg");
  }

 if (recomm_level != '' || why_recomm_arr.length > 0) {
    frequency = "frequency_blood_IronStudies_c1";
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Iron Studies');
    recomm_level = '';
    why_recomm_arr = [];
  }

  //condition for blood test Vitamin B12
  if (diet == 'Vegetarian') {
    recomm_level = 1;
    why_recomm_arr.push("recomm_veg");
  }
  if (age > 59) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_age>59");
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
    frequency = "frequency_blood_VitaminB12_c1";
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Vitamin B12');
    recomm_level = '';
    why_recomm_arr = [];
  } else {
    if (age > 18 && age < 60) {
      recomm_level = 0;
      why_recomm_arr.push("recomm_age>18andage<60");
      frequency = "frequency_blood_VitaminB12_c2";
      await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Vitamin B12');
      recomm_level = '';
      why_recomm_arr = [];
    }
  }

  //condition for blood test Vitamin D
  if (exisiting_conditions.includes('Bone disorders') || exisiting_conditions.includes('Liver disease')
    || exisiting_conditions.includes('Kidney disease') || exisiting_conditions.includes('Inflammatory bowel disease')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_VitaminD_c1");
    frequency = "frequency_blood_VitaminD_c1";
  }
  if (bmi > 22) {
    recomm_level = 1;
    frequency = "frequency_blood_VitaminD_c1";
    why_recomm_arr.push("recomm_bmi>22");
  }
  if (age > 59) {
    if(recomm_level == '')
        frequency =  "frequency_age>59";
    recomm_level = 1;
    why_recomm_arr.push("recomm_age>59");
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
  
  await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Vitamin D');
    recomm_level = '';
    why_recomm_arr = [];
  } else if (age > 18 && age < 60) {
    recomm_level = 0;
    why_recomm_arr.push("recomm_age>18andage<60");
    frequency = "frequency_age>29andage<60";
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Vitamin D');
    recomm_level = '';
    why_recomm_arr = [];
  }

}
/**
 * * This function is used to create plans under Diagnostic
 * @param {*} user_id 
 * @param {*} age 
 * @param {*} gender 
 * @param {*} exisiting_conditions 
 * @param {*} family_history 
 */
 async function generatePlansForDiagnostic(user_id, age, bmi, diet,smoke,alcohol, excercise, gender, exisiting_conditions,family_history) {
  let recomm_level = '', frequency = '';
  let why_recomm_arr = [];
  if (gender === 'female') {
    //condition for diagnostic 	Mammography
    if (exisiting_conditions.includes("Cancer - Breast")) {
      recomm_level = 1;
      frequency = "frequency_diagnostic_Mammography_c1";
      why_recomm_arr.push("recomm_diagnostic_Mammography_c1");
    }
    else if (age > 20 && (family_history.includes("Cancer - Ovarian") || exisiting_conditions.includes("Cancer - Breast"))) {
      recomm_level = 1;
      frequency = "frequency_diagnostic_Mammography_c2";
      why_recomm_arr.push("recomm_diagnostic_Mammography_c2");
    } else if (age > 70) {
      recomm_level = 0;
      frequency = "frequency_diagnostic_Mammography_c3";
      why_recomm_arr.push("recomm_diagnostic_Mammography_c3");
    } else if (age > 39 && age < 71) {
      recomm_level = 0;
      frequency = "frequency_diagnostic_Mammography_c4";
      why_recomm_arr.push("recomm_diagnostic_Mammography_c4");
    }
   if (recomm_level != '' || why_recomm_arr.length > 0) {
      await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'Mammography');
      recomm_level = '';
      why_recomm_arr = [];
    }
    //Transvaginal ultrasound
    if (age > 29 && family_history.includes("Cancer - Breast")) {
      recomm_level = 1;
      frequency = "frequency_diagnostic_TU_c1";
      why_recomm_arr.push("recomm_diagnostic_TU_c1");
    }
   if (recomm_level != '' || why_recomm_arr.length > 0) {
      await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'Transvaginal ultrasound');
      recomm_level = '';
      why_recomm_arr = [];
    }
    //diagnostic 	Pap Smear
    if (age > 21 && age < 66) {
      recomm_level = 0;
      frequency = "frequency_diagnostic_PS_c1";
      why_recomm_arr.push("recomm_diagnostic_PS_c1");
    }
   if (recomm_level != '' || why_recomm_arr.length > 0) {
      await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'Pap Smear');
      recomm_level = '';
      why_recomm_arr = [];
    }
    //diagnostic HPV DNA test
    if (age > 29 && age < 66) {
      recomm_level = 0;
      frequency = "frequency_diagnostic_HPVDNA_c1";
      why_recomm_arr.push("recomm_diagnostic_HPVDNA_c1");
    }
   if (recomm_level != '' || why_recomm_arr.length > 0) {
      await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'HPV DNA test');
      recomm_level = '';
      why_recomm_arr = [];
    }

  }
  //diagnostic Low Dose CT Scan (LDCT)
  if (age > 54 && age < 78 && smoke > 29) {
    recomm_level = 1;
    frequency = "frequency_diagnostic_LDCT_c1";
    why_recomm_arr.push("recomm_diagnostic_LDCT_c1");
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'Low Dose CT Scan (LDCT)');
    recomm_level = '';
    why_recomm_arr = [];
  }
  //diagnostic Colonoscopy
  if(exisiting_conditions.includes("Cancer -  Colorectal / colon")){
    recomm_level = 1;
    frequency = "frequency_diagnostic_colonoscopy_c1";
    why_recomm_arr.push("recomm_diagnostic_colonoscopy_c1");
  }
  else if (age > 39 && age < 76 && family_history.includes("Cancer -  Colorectal / colon")) {
    recomm_level = 1;
    frequency = "frequency_diagnostic_colonoscopy_c2";
    why_recomm_arr.push("recomm_diagnostic_colonoscopy_c2");

  } else if (age > 49 && age < 76) {
    recomm_level = 0;
    frequency = "frequency_diagnostic_colonoscopy_c3";
    why_recomm_arr.push("recomm_diagnostic_colonoscopy_c3");
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'Colonoscopy');
    recomm_level = '';
    why_recomm_arr = [];
  }

  //diagnostic Bone Density Testing
  if (gender == 'female' && age > 64) {
    recomm_level = 1;
    frequency = "frequency_diagnostic_Bone_Density_Testing_c1";
    why_recomm_arr.push("recomm_diagnostic_Bone_Density_Testing_c1");

  } else if (gender == 'female' && age > 44) {
    recomm_level = 0;
    frequency = "frequency_diagnostic_Bone_Density_Testing_c1";
    why_recomm_arr.push("recomm_diagnostic_Bone_Density_Testing_c2");
  } else if (gender == 'male' && age > 69) {
    recomm_level = 0;
    frequency = "frequency_diagnostic_Bone_Density_Testing_c1";
    why_recomm_arr.push("recomm_diagnostic_Bone_Density_Testing_c3");
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'Bone Density Test');
    recomm_level = '';
    why_recomm_arr = [];
  }

  //diagnostic ECG
  if (exisiting_conditions.includes('Diabetes') || exisiting_conditions.includes('Hypertension')
    || exisiting_conditions.includes('Hypercholesterolemia') || exisiting_conditions.includes('Cardiovascular disease') || exisiting_conditions.includes('Kidney disease')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_diagnostic_ECG_c1");
  }
  if (family_history.includes('Cardiovascular disease')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_diagnostic_ECG_c2");
  }
  if (bmi > 22) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_bmi>22");
  }
  if (excercise == 'Less than 30 minutes' || excercise == 'More than 30 minutes and less than 1.5 hour') {
    recomm_level = 1;
    why_recomm_arr.push("recomm_diagnostic_ECG_c3");
  }
  if (smoke > 0) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_smoke>0");
  }
  if (alcohol == 'Yes') {
    recomm_level = 1;
    why_recomm_arr.push("recomm_alcohol_yes");
  }
  if (age > 54) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_age>54");
  }

 if (recomm_level != '' || why_recomm_arr.length > 0) {
    frequency = "frequency_diagnostic_ECG_c1";
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'ECG');
    recomm_level = '';
    why_recomm_arr = [];
  } else {
    //only when recomm level is blank then only the lower recomm level condition will be excecuted
    if (age > 18 && age < 55) {
      recomm_level = 0;
      frequency = "frequency_diagnostic_ECG_c2";
      why_recomm_arr.push("recomm_diagnostic_ECG_c4");
      await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'ECG');
      recomm_level = '';
      why_recomm_arr = [];
    }
  }
  //diagnostic ECHO
  if (exisiting_conditions.includes('Diabetes') || exisiting_conditions.includes('Hypertension')
    || exisiting_conditions.includes('Hypercholesterolemia') || exisiting_conditions.includes('Cardiovascular disease') || exisiting_conditions.includes('Kidney disease')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_diagnostic_ECHO_c1");
  }
  if (family_history.includes('Cardiovascular disease')) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_diagnostic_ECHO_c2");
  }
  if (bmi > 22) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_bmi>22");
  }
  if (excercise == 'Less than 30 minutes' || excercise == 'More than 30 minutes and less than 1.5 hour') {
    recomm_level = 1;
    why_recomm_arr.push("recomm_diagnostic_ECHO_c3");
  }
  if (smoke > 0) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_smoke>0");
  }
  if (alcohol == 'Yes') {
    recomm_level = 1;
    why_recomm_arr.push("recomm_alcohol_yes");
  }
  if (age > 54) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_age>54");
  }

 if (recomm_level != '' || why_recomm_arr.length > 0) {
    frequency = "frequency_diagnostic_ECHO_c1";
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'ECHO');
    recomm_level = '';
    why_recomm_arr = [];
  } else {
    //only when recomm level is blank then only the lower recomm level condition will be excecuted
    if (age > 18 && age < 55) {
      recomm_level = 0;
      frequency = "frequency_diagnostic_ECHO_c2";
      why_recomm_arr.push("recomm_diagnostic_ECHO_c4");
      await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'ECHO');
      recomm_level = '';
      why_recomm_arr = [];
    }
  }

  //diagnostic Chest X-ray
  if (age > 18) {
    recomm_level = 0;
    why_recomm_arr.push("recomm_diagnostic_ChestX-ray_c1");
    frequency = "frequency_diagnostic_ChestX-ray_c1";
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'Chest X-ray');
    recomm_level = '';
    why_recomm_arr = [];
  }
  return true;
}

/**
 * This function is used to create plans under doctor checkup
 * @param {*} user_id 
 * @param {*} age 
 * @param {*} gender 
 * @param {*} exisiting_conditions 
 * @param {*} family_history 
 */
 async function generatePlansForDoctorCheckup(user_id, age, bmi, diet,smoke,alcohol, excercise, gender, exisiting_conditions,family_history) {
  let recomm_level = '', frequency = '';
  let why_recomm_arr = [];
  //Doctor checkup Genetic counseling
  if (age > 20 && family_history.includes("Cancer - Ovarian") && family_history.includes("Cancer - Breast")) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_genetic_c1";
    why_recomm_arr.push("recomm_doctorcheckup_genetic_c1");
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Genetic counseling');
    recomm_level = '';
    why_recomm_arr = [];
  }
  //Doctor checkup Physician
  if (age > 29 && age < 50) {
    recomm_level = 0;
    frequency = "frequency_doctorcheckup_physician_c1";
    why_recomm_arr.push("recomm_doctorcheckup_physician_c1");
  } else if (age > 49 && age < 60) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_physician_c2";
    why_recomm_arr.push("recomm_doctorcheckup_physician_c2");
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Physician');
    recomm_level = '';
    why_recomm_arr = [];
  }
  //Doctor checkup Geriatric specialist or Physican
  if (age > 59) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_geriatric_c1";
    why_recomm_arr.push("recomm_doctorcheckup_geriatric_c1");
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Geriatric specialist or Physican');
    recomm_level = '';
    why_recomm_arr = [];
  }

  //Doctor checkup Dentist
  if (age > 18) {
    recomm_level = 0;
    frequency = "frequency_doctorcheckup_dentist_c1";
    why_recomm_arr.push("recomm_doctorcheckup_dentist_c1");
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Dentist');
    recomm_level = '';
    why_recomm_arr = [];
  }

  //Doctor checkup ENT
  if (age > 59) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_ent_c1";
    why_recomm_arr.push("recomm_doctorcheckup_ent_c1");
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'ENT');
    recomm_level = '';
    why_recomm_arr = [];
  }
 
  //Doctor checkup Opthamologist
  if (age > 20 && exisiting_conditions.includes('diabetic')) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_Opthamologist_c4";
    why_recomm_arr.push("recomm_doctorcheckup_Opthamologist_c4");
  } else if (age > 66) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_Opthamologist_c3";
    why_recomm_arr.push("recomm_doctorcheckup_Opthamologist_c3");
  } else if (age > 40 && age < 65) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_Opthamologist_c2";
    why_recomm_arr.push("recomm_doctorcheckup_Opthamologist_c2");
  } else if (age > 20 && age < 41) {
    recomm_level = 0;
    frequency = "frequency_doctorcheckup_Opthamologist_c1";
    why_recomm_arr.push("recomm_doctorcheckup_Opthamologist_c1");
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Opthamologist');
    recomm_level = '';
    why_recomm_arr = [];
  }
  //Doctor checkup Gynocologist
  if (gender == 'female' && (age > 24 && age < 40)) {
    recomm_level = 0;
    frequency = "frequency_doctorcheckup_Gynocologist_c1";
    why_recomm_arr.push("recomm_doctorcheckup_Gynocologist_c1");
  } else if (age > 39) {
    recomm_level = 0;
    frequency = "frequency_doctorcheckup_Gynocologist_c2";
    why_recomm_arr.push("recomm_doctorcheckup_Gynocologist_c2");
  }

 if (recomm_level != '' || why_recomm_arr.length > 0) {
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Gynocologist');
    recomm_level = '';
    why_recomm_arr = [];
  }
 
  //Doctor checkup Influenza Vaccine
  if(exisiting_conditions.includes('Chronic Obstructive Pulmonary Disease') || exisiting_conditions.includes('Bronchial Asthma')
      || exisiting_conditions.includes('Cardiovascular disease') || exisiting_conditions.includes('Liver disease')
      || exisiting_conditions.includes('Kidney disease') || exisiting_conditions.includes('Blood disorders')
      || exisiting_conditions.includes('Diabetes') || exisiting_conditions.includes('Cancer - Others')
      || exisiting_conditions.includes('Immunocompromised')){
        recomm_level = 0;
        why_recomm_arr.push("recomm_doctorcheckup_Influenza_c1");
      }
    if (age > 64) {
      recomm_level = 0;
      why_recomm_arr.push("recomm_doctorcheckup_Influenza_c2");
    }
   if (recomm_level != '' || why_recomm_arr.length > 0) {
      frequency = "frequency_doctorcheckup_Influenza_c1";
      await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Influenza Vaccine');
      recomm_level = '';
      why_recomm_arr = [];
    }
    //Doctor checkup Pneumococcal/ Pneumonia Vaccine
  if(exisiting_conditions.includes('Cardiovascular disease') || exisiting_conditions.includes('Liver disease')
  || exisiting_conditions.includes('Lung disease') || exisiting_conditions.includes('Kidney disease')
  || exisiting_conditions.includes('Diabetes') || exisiting_conditions.includes('Cancer - Others')){
    recomm_level = 0;
    why_recomm_arr.push("recomm_doctorcheckup_Pneumonia_c1");
  }
  if(smoke > 0){
    recomm_level = 0;
    why_recomm_arr.push("recomm_doctorcheckup_Pneumonia_c2");
  }
  if(alcohol == 'Yes'){
    recomm_level = 0;
    why_recomm_arr.push("recomm_doctorcheckup_Pneumonia_c3");
  }
  if (age > 64) {
    recomm_level = 0;
    why_recomm_arr.push("recomm_doctorcheckup_Pneumonia_c4");
  }
 if (recomm_level != '' || why_recomm_arr.length > 0) {
  frequency = "frequency_doctorcheckup_Pneumonia_c1";
  await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Pneumococcal/ Pneumonia Vaccine');
  recomm_level = '';
  why_recomm_arr = [];
  }
   //Doctor checkup DPT Vaccine   
   if(age > 18 && age < 64){
     recomm_level = 0;
     frequency = "frequency_doctorcheckup_DPTVaccine_c1";
     why_recomm_arr.push("recomm_doctorcheckup_DPTVaccine_c1");
   }else if (age > 64) {
     recomm_level = 0;
     frequency = "frequency_doctorcheckup_DPTVaccine_c1";
     why_recomm_arr.push("recomm_doctorcheckup_DPTVaccine_c2");
   }
   if (recomm_level != '' || why_recomm_arr.length > 0) {
   await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'DPT Vaccine');
   recomm_level = '';
   why_recomm_arr = [];
 }

  //Doctor checkup Zoster Vaccine
  if (age > 59) {
    recomm_level = 0;
    why_recomm_arr.push("recomm_doctorcheckup_Zoster_c1");
    frequency = "frequency_doctorcheckup_Zoster_c1";
    await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Zoster Vaccine');
    recomm_level = '';
    why_recomm_arr = [];
  }

 //Doctor checkup Varicella Vaccine
 if (age > 18 && age < 60) {
  recomm_level = 0;
  why_recomm_arr.push("recomm_doctorcheckup_Varicella_c1");
  frequency = "frequency_doctorcheckup_Varicella_c1";
  await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Varicella Vaccine'); 
  recomm_level = '';
  why_recomm_arr = [];
}

 //Doctor checkup HPV Vaccine
  if (gender == 'female' && age > 18 && age < 27) {
    recomm_level = 0;
    why_recomm_arr.push("recomm_doctorcheckup_HPV_c1");
    frequency = "frequency_doctorcheckup_HPV_c1";
  await addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'HPV Vaccine');
  recomm_level = '';
  why_recomm_arr = [];
  }

}
/**
 * It will add entry in table
 * @param {*} user_id 
 * @param {*} recomm_level 
 * @param {*} frequency 
 * @param {*} why_recomm_arr 
 * @param {*} checkup_category 
 * @param {*} checkup_name 
 */
async function addPlan(user_id, recomm_level, frequency, why_recomm_arr, checkup_category, checkup_name) {
    const connection = await pool.getConnection();
    //retrive check up from health plan table
    const selectQuery = 'SELECT checkup_id FROM `healthplan`' +
      '  WHERE lcase(`checkup_category`) like lcase(?) AND lcase(checkup_name) like lcase(?)';
    let query = mysql.format(selectQuery, [checkup_category, checkup_name]);
    rows = await connection.query(query);
      try {
        //check rows[0] not null
        if (rows.length > 0) {
          healthPlanJson = JSON.parse(JSON.stringify(rows[0]))
          var checkup_id = healthPlanJson[0].checkup_id; 
          //add the entry in table
            let insertQuery = 'INSERT INTO recommendedandcustomizedplan (user_id,checkup_id,recomm_level,additional_fields,created_date)' +
                              'VALUES(?,?,?,JSON_OBJECT(\'frequency\',?,\'why_recomm\',?),now())'
        //  let insQuery = mysql.format(insertQuery, [user_id, checkup_id, recomm_level, frequency, why_recomm_arr.toString(), user_id, checkup_id, recomm_level, frequency, why_recomm_arr.toString()]);
        let insQuery = mysql.format(insertQuery, [user_id, checkup_id, recomm_level, frequency, why_recomm_arr.toString()]);  
        const inserted = await connection.query(insQuery);
        console.log("ROw affaected :"+inserted[0].affectedRows)
        connection.release();
        }
      } catch (e) {
          console.log(e)
      }
}
