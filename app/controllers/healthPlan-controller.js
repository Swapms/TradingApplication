const mysql = require('mysql');
const pool = require('../config/config.js');
const healthRoute = require('../routes/health-route.js');
const healthPlan = require('../models/HealthPlan.js');
//const { json } = require('body-parser');
const { getAge, getBMI } = require("./helpers/index");

// Create and Save a new user
exports.getHealthPlans = (req, res) => {
  // Validate request
  const user_id = req.params.id;

  if (!user_id) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  //get plans from table
  pool.getConnection((err, connection) => {
    if (err) throw err;
    console.log('connected as id ' + connection.threadId);
    const selectQuery = 'SELECT h.checkup_id, h.checkup_name,r.recomm_level ' +
      ' FROM healthplan h ' +
      ' INNER JOIN `recommendedandcustomizedplan` r' +
      ' ON h.checkup_id = r.checkup_id where user_id = ? order by checkup_category;'
    let query = mysql.format(selectQuery, [user_id]);
    console.log(query);
    connection.query(query, (err, rows) => {
      // connection.release(); // return the connection to pool
      if (err) throw err;
      let result = [];
      let testTypes = [];
      const selectQueryMain = 'SELECT count(h.checkup_category) as count, h.checkup_category ' +
        ' FROM healthplan h ' +
        ' INNER JOIN `recommendedandcustomizedplan` r' +
        ' ON h.checkup_id = r.checkup_id where user_id = ? group by checkup_category ;'
      let querymain = mysql.format(selectQueryMain, [user_id]);
      connection.query(querymain, (err, rowsmain) => {
        connection.release(); // return the connection to pool
        jsondata = JSON.parse(JSON.stringify(rowsmain));
        let startPtr = 0;
        let endPtr = 0;
        let recommendedcount = 0;
        let selfAddedcount = 0;
        jsondata.forEach(function (healthplan) {
          endPtr = endPtr + healthplan.count;
          for (let i = startPtr; i < endPtr; i++) {
            testTypes.push(rows[i]);
          }
          recommendedcount = recommendedcount + healthplan.count;
          result.push({ testName: healthplan.checkup_category, testTypes: testTypes });
          startPtr = healthplan.count;
          testTypes = [];
        });

        //for self added plans
        // let selfAddedArr = getSelfAddedCheckups(user_id);
        const selectQuerySelfAdded = 'SELECT additional_fields->>"$.checkup_name" checkup_name ' +
          ' FROM `recommendedandcustomizedplan` WHERE `user_id` = ? AND additional_fields->>"$.plan_type" = ? ';

        let query = mysql.format(selectQuerySelfAdded, [user_id, 'selfadded']);
        console.log(query);
        connection.query(query, (err, rows) => {
          connection.release(); // return the connection to pool
          if (err) throw err;
          let tempResult = [];
          selfAddedcount = rows.length;
          tempResult.push({ test_name: 'SelfAdded', testTypes: rows })
          //  finalResult.push({Recommendedcount:recommendedcount,SelfAddedcount:selfAddedcount}); 
          //     finalResult.push({Recommended:result,Recommendedcount:recommendedcount,SelfAddedcount:selfAddedcount,SelfAdded:{test_name :'SelfAdded',testTypes:rows}})           
          //  finalResult.push({SelfAdded:tempResult});
          //  console.log(JSON.parse(JSON.stringify(finalResult)))
          res.status(200).json({
            data: JSON.parse(JSON.stringify({ Recommended: result, Recommendedcount: recommendedcount, SelfAddedcount: selfAddedcount, SelfAdded: tempResult }))
          });
        });
      });
    });
  });
};

exports.getHealthPlanbyId = (req, res) => {
  // Validate request
  const user_id = req.params.id;
  // const checkup_id;
  if (!user_id) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  let plan = '';
  const fs = require('fs');
  fs.readFile('../TradingApplication/app/files/healthplandetails.json', (err, data) => {
    if (err) throw err;
    try {
      plan = JSON.parse(data);
    } catch (err) {
      console.log("Error parsing JSON string:", err);
    }
  });
  //get json keys from table
  pool.getConnection((err, connection) => {
    if (err) throw err;
    console.log('connected as id ' + connection.threadId);
    const selectQuery = 'SELECT recomm_level,' +
      ' additional_fields->>"$.frequency" frequency,additional_fields->>"$.why_recomm" why_recomm' +
      ' FROM `recommendedandcustomizedplan` WHERE `user_id` = ? AND `checkup_id` = ?';

    let query = mysql.format(selectQuery, [user_id, 1]);
    console.log(query);
    connection.query(query, (err, rows) => {
      connection.release(); // return the connection to pool
      if (err) throw err;
      if (rows.length > 0) {
        let frequency = rows[0].frequency;
        let why_recomm_arr = rows[0].why_recomm_arr;
        jsonData = JSON.parse(JSON.stringify({ recomm_level: rows[0].recomm_level, frequency: plan[frequency], why_recomm: plan[why_recomm] }))
      } else {
        //no records found
      }
      res.status(200).json({
        status: true,
        messages: "success",
        data: jsonData
      });
    });
  });

};
exports.createHealthPlans = (user_id) => {

  pool.getConnection((err, connection) => {
    if (err) throw err;
    console.log('connected as id ' + connection.threadId);
    const selectQuery = 'SELECT user_attributes->>"$.dob" dob,user_attributes->>"$.gender" gender,' +
      ' user_attributes->>"$.height" height,user_attributes->>"$.weight" weight,user_attributes->>"$.family_history" family_history, ' +
      ' user_attributes->>"$.diet" diet , user_attributes->>"$.smoke" smoke,user_attributes->>"$.alcohol" alcohol,user_attributes->>"$.exisiting_conditions" exisiting_conditions,user_attributes->>"$.excercise" excercise ' +
      ' FROM `user_details` WHERE `user_id` = ?';
    let query = mysql.format(selectQuery, [user_id]);
    console.log(query);
    connection.query(query, (err, rows) => {
      connection.release(); // return the connection to pool
      if (err) throw err;

      console.log('The data from users table are: \n', rows);
      jsondata = JSON.parse(JSON.stringify(rows[0]))
      const age = getAge("'" + (jsondata.dob) + "'")
      console.log(age);
      let height = jsondata.height;
      const bmi = getBMI(height, jsondata.weight)
      let gender = jsondata.gender;
      let family_history = jsondata.family_history;
      let exisiting_conditions = jsondata.exisiting_conditions;

      generatePlansForBloodTest(user_id, age, bmi, jsondata.smoke, jsondata.alcohol, jsondata.excercise, gender, exisiting_conditions, family_history)

      generatePlansForDiagnostic(user_id, age, gender, jsondata.smoke, exisiting_conditions, family_history)

      generatePlansForDoctorCheckup(user_id, age, gender, exisiting_conditions, family_history);

      // res.status(200).json({elems:rows[0]})
    });
  });

}
/**
 * This function is used to create plans under blood test
 * @param {*} age 
 * @param {*} gender 
 * @param {*} exisiting_conditions 
 * @param {*} family_history 
 */
function generatePlansForBloodTest(user_id, age, bmi, smoke, alcohol, excercise, gender, exisiting_conditions, family_history) {
  let recomm_level = '', frequency = '';
  let why_recomm_arr = [];
  //condition for blood test PSA, get checkup_id from healthplan table
  if (gender === 'male') {
    if (exisiting_conditions.includes("Prostate cancer")) {
      recomm_level = 2;
      frequency = "frequency_blood_PSA_c5";
      why_recomm_arr.push("recomm_blood_PSA_c5");
    } else if (age > 40 && age < 75) {
      if (family_history.includes("Prostate cancer") && family_history.includes("Breast or ovarian cancer")) {
        recomm_level = 2;
        frequency = "frequency_blood_PSA_c4";
        why_recomm_arr.push("recomm_blood_PSA_c4");
      } else if (family_history.includes("Prostate cancer")) {
        recomm_level = 2;
        frequency = "frequency_blood_PSA_c2";
        why_recomm_arr.push("recomm_blood_PSA_c2");
      } else if (family_history.includes("Breast or ovarian cancer")) {
        recomm_level = 2;
        frequency = "frequency_blood_PSA_c3";
        why_recomm_arr.push("recomm_blood_PSA_c3");
      } else {
        recomm_level = 1;
        frequency = "frequency_blood_PSA_c1";
        why_recomm_arr.push("recomm_blood_PSA_c1");
      }

      if (recomm_level != '') {
        addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Prostate Specific Antigen (PSA)');
        recomm_level = ''
        why_recomm_arr = [];
      }
      //Blood Test Fecal occult blood test
      if (age > 39 && age < 76 && family_history.includes("colorectal cancer")) {
        recomm_level = 2;
        frequency = "frequency_blood_FCBT_c2";
        why_recomm_arr.push("recomm_blood_FCBT_c2");
      } else if (age > 49 && age < 76) {
        recomm_level = 1;
        frequency = "frequency_blood_FCBT_c1";
        why_recomm_arr.push("recomm_blood_FCBT_c1");
      }
      if (recomm_level != '') {
        addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Fecal Occult Blood Test');
        recomm_level = ''
        why_recomm_arr = [];
      }
    }
  }

  //condition for blood test CBC
  if (exisiting_conditions.includes('Diabetes') || exisiting_conditions.includes('Hypertension')
    || exisiting_conditions.includes('Hypercholesterolemia')) {
    recomm_level = 1;
    //frequency = "frequency_blood_CBC_c1";
    why_recomm_arr.push("recomm_blood_CBC_c1");
  }
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
    why_recomm_arr.push("recomm_blood_CBC_c4");
  }
  if (alcohol == 'yes') {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_CBC_c5");
  }
  if (age > 59) {
    recomm_level = 1;
    why_recomm_arr.push("recomm_blood_CBC_c6");
  }
  if (recomm_level != '') {
    frequency = "frequency_blood_CBC_c1";
    addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Complete Blood Count (CBC)');
    recomm_level = '';
    why_recomm_arr = [];
  } else {
    //only when recomm level is blank then only the lower recomm level condition will be excecuted
    if (age > 29 && age < 60) {
      recomm_level = 0;
      frequency = "frequency_blood_CBC_c2";
      why_recomm_arr.push("recomm_blood_CBC_c7");
    } else if (age > 18 && age < 30) {
      recomm_level = 0;
      frequency = "frequency_blood_CBC_c3";
      why_recomm_arr.push("recomm_blood_CBC_c8");
    }
  }
  if (recomm_level != '') {
    addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Complete Blood Count (CBC)');
    recomm_level = ''
    why_recomm_arr = [];
  }
   //condition for blood test Lipid Profie
   if (exisiting_conditions.includes('Diabetes') || exisiting_conditions.includes('Hypertension')
   || exisiting_conditions.includes('Hypercholesterolemia') || exisiting_conditions.includes('Cardiovascular disease')) {
   recomm_level = 1;
   //frequency = "frequency_blood_CBC_c1";
   why_recomm_arr.push("recomm_blood_LipidProfie_c1");
 }
 if(family_history.includes('Cardiovascular disease')){
  recomm_level = 1;
  //frequency = "frequency_blood_CBC_c1";
  why_recomm_arr.push("recomm_blood_LipidProfie_c2");
 }
 if (bmi > 22) {
   recomm_level = 1;
   why_recomm_arr.push("recomm_blood_LipidProfie_c3");
 }
 if (excercise == 'Less than 30 minutes' || excercise == 'More than 30 minutes and less than 1.5 hour') {
   recomm_level = 1;
   why_recomm_arr.push("recomm_blood_LipidProfie_c4");
 }
 if (smoke > 0) {
   recomm_level = 1;
   why_recomm_arr.push("recomm_blood_LipidProfie_c5");
 }
 if (alcohol == 'yes') {
   recomm_level = 1;
   why_recomm_arr.push("recomm_blood_LipidProfie_c6");
 }
 if (age > 59) {
   recomm_level = 1;
   why_recomm_arr.push("recomm_blood_LipidProfie_c7");
 }
 if (recomm_level != '') {
   frequency = "frequency_blood_LipidProfie_c1";
   addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Lipid Profie');
   recomm_level = '';
   why_recomm_arr = [];
 } else {
   //only when recomm level is blank then only the lower recomm level condition will be excecuted
   if (age > 29 && age < 60) {
     recomm_level = 0;
     frequency = "frequency_blood_LipidProfie_c2";
     why_recomm_arr.push("recomm_blood_LipidProfie_c8");
   } else if (age > 18 && age < 30) {
     recomm_level = 0;
     frequency = "frequency_blood_LipidProfie_c3";
     why_recomm_arr.push("recomm_blood_LipidProfie_c9");
   }
 }
 if (recomm_level != '') {
   addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'Lipid Profie');
   recomm_level = ''
   why_recomm_arr = [];
 }


  //condition for blood test CA-125
  if (gender == 'female') {
    if (exisiting_conditions.includes("CA-125")) {
      recomm_level = 2;
      frequency = "frequency_blood_CA-125_c2";
      why_recomm_arr.push("recomm_blood_CA-125_c2");
    } else if (age > 30 && family_history.includes("Breast or ovarian cancer")) {
      recomm_level = 2;
      frequency = "frequency_blood_CA-125_c1";
      why_recomm_arr.push("recomm_blood_CA-125_c1");
    }
  }

  if (recomm_level != '') {
    addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Blood Test', 'CA-125');
    recomm_level = '';
    why_recomm_arr = [];
  }

}
//pack_year pending
/**
 * * This function is used to create plans under Diagnostic
 * @param {*} user_id 
 * @param {*} age 
 * @param {*} gender 
 * @param {*} exisiting_conditions 
 * @param {*} family_history 
 */
function generatePlansForDiagnostic(user_id, age, gender, pack_year, exisiting_conditions, family_history) {
  let why_recomm_arr = [];
  if (gender === 'female') {
    //condition for diagnostic 	Mammography
    if (exisiting_conditions.includes("Breast or ovarian cancer")) {
      recomm_level = 2;
      frequency = "frequency_diagnostic_BC_c4";
      why_recomm_arr.push("recomm_diagnostic_BC_c4");
    }
    else if (age > 21 && family_history.includes("Breast or ovarian cancer")) {
      recomm_level = 2;
      frequency = "frequency_diagnostic_BC_c3";
      why_recomm_arr.push("recomm_diagnostic_BC_c3");
    } else if (age > 70) {
      recomm_level = 1;
      frequency = "frequency_diagnostic_BC_c2";
      why_recomm_arr.push("recomm_diagnostic_BC_c2");
    } else if (age > 40 && age < 71) {
      recomm_level = 1;
      frequency = "frequency_diagnostic_BC_c1";
      why_recomm_arr.push("recomm_diagnostic_BC_c1");
    }
    if (recomm_level != '') {
      addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'Mammography');
      recomm_level = '';
      why_recomm_arr = [];
    }
    if (age > 30 && family_history.includes("Breast or ovarian cancer")) {
      recomm_level = 2;
      frequency = "frequency_diagnostic_TU_c1";
      why_recomm_arr.push("recomm_diagnostic_TU_c1");
    }
    //existing cond Transvaginal ultrasound not added
    if (recomm_level != '') {
      addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'Transvaginal ultrasound');
      recomm_level = '';
      why_recomm_arr = [];
    }
    //diagnostic 	Pap Smear
    if (age > 21 && age < 66) {
      recomm_level = 1;
      frequency = "frequency_diagnostic_PS_c1";
      why_recomm_arr.push("recomm_diagnostic_PS_c1");
    }
    if (recomm_level != '') {
      addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'Pap Smear');
      recomm_level = '';
      why_recomm_arr = [];
    }
    //diagnosticHPV DNA test
    if (age > 30 && age < 66) {
      recomm_level = 0;
      frequency = "frequency_diagnostic_HPVDNA_c1";
      why_recomm_arr.push("recomm_diagnostic_HPVDNA_c1");
    }
    if (recomm_level != '') {
      addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'HPV DNA');
      recomm_level = '';
      why_recomm_arr = [];
    }
    //diagnostic Low Dose CT Scan (LDCT)
    if (age > 54 && age < 78 && pack_year > 29) {
      recomm_level = 2;
      frequency = "frequency_diagnostic_LDCT_c1";
      why_recomm_arr.push("recomm_diagnostic_LDCT_c1");
    }
    if (recomm_level != '') {
      addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'Low Dose CT Scan');
      recomm_level = '';
      why_recomm_arr = [];
    }
    //diagnostic Colonoscopy
    if (age > 39 && age < 76 && family_history.includes("colorectal cancer")) {
      recomm_level = 2;
      frequency = "frequency_diagnostic_colonoscopy_c2";
      why_recomm_arr.push("recomm_diagnostic_colonoscopy_c2");

    } else if (age > 49 && age < 76) {
      recomm_level = 1;
      frequency = "frequency_diagnostic_colonoscopy_c1";
      why_recomm_arr.push("recomm_diagnostic_colonoscopy_c1");
    }
    if (recomm_level != '') {
      addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Diagnostic', 'Colonoscopy');
      recomm_level = '';
      why_recomm_arr = [];
    }
  }
}


/**
 * This function is used to create plans under doctor checkup
 * @param {*} user_id 
 * @param {*} age 
 * @param {*} gender 
 * @param {*} exisiting_conditions 
 * @param {*} family_history 
 */
function generatePlansForDoctorCheckup(user_id, age, gender, exisiting_conditions, family_history) {
  let recomm_level = '', frequency = '';
  let why_recomm_arr = [];
  //Doctor checkup Genetic counseling
  if (age > 21 && family_history.includes("Breast or ovarian cancer")) {
    recomm_level = 2;
    frequency = "frequency_doctorcheckup_genetic_c1";
    why_recomm_arr.push("recomm_doctorcheckup_genetic_c1");
   
  }
  if (recomm_level != '') {
    addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Genetic counseling');
    recomm_level = '';
    why_recomm_arr = [];
  }
  //Doctor checkup Physician
  if (age > 50 && age < 61) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_physician_c2";
    why_recomm_arr.push("recomm_doctorcheckup_physician_c2");
  } else if (age > 30 && age < 51) {
    recomm_level = 0;
    frequency = "frequency_doctorcheckup_physician_c1";
    why_recomm_arr.push("recomm_doctorcheckup_physician_c1");
  }
  if (recomm_level != '') {
    addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Physician');
    recomm_level = '';
    why_recomm_arr = [];
  }
  //Doctor checkup Geriatric specialist or Physican
  if (age > 60) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_geriatric_c1";
    why_recomm_arr.push("recomm_doctorcheckup_geriatric_c1");
  }

  if (recomm_level != '') {
    addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Geriatric specialist or Physican');
    addPlan(user_id, recomm_level, 'frequency_doctorcheckup_ent_c1', 'recomm_doctorcheckup_ent_c1', 'Doctor Checkup', 'ENT');
    recomm_level = '';
    why_recomm_arr = [];
  }
  //Doctor checkup Dentist
  if (age > 18) {
    recomm_level = 0;
    frequency = "frequency_doctorcheckup_dentist_c1";
    why_recomm_arr.push("recomm_doctorcheckup_dentist_c1");
  }
  if (recomm_level != '') {
    addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Dentist');
    recomm_level = '';
    why_recomm_arr = [];
  }
  //Doctor checkup Opthamologist
  if (age > 20 && exisiting_conditions.includes('diabetic')) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_Opthamologist_c4";
    why_recomm_arr.push("recomm_doctorcheckup_Opthamologist_c4");
  } else if (age > 65) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_Opthamologist_c3";
    why_recomm_arr.push("recomm_doctorcheckup_Opthamologist_c3");
  } else if (age > 40 && age < 66) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_Opthamologist_c2";
    why_recomm_arr.push("recomm_doctorcheckup_Opthamologist_c2");
  } else if (age > 20 && age < 41) {
    recomm_level = 0;
    frequency = "frequency_doctorcheckup_Opthamologist_c1";
    why_recomm_arr.push("recomm_doctorcheckup_Opthamologist_c1");
  }
  if (recomm_level != '') {
    addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Opthamologist');
    recomm_level = '';
    why_recomm_arr = [];
  }
  //Doctor checkup Gynocologist
  if (gender == 'female' && (age > 24 && age < 41)) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_Gynocologist_c1";
    why_recomm_arr.push("recomm_doctorcheckup_Gynocologist_c1");
  } else if (age > 40) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_Gynocologist_c2";
    why_recomm_arr.push("recomm_doctorcheckup_Gynocologist_c2");
  }

  if (recomm_level != '') {
    addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Gynocologist');
    recomm_level = '';
    why_recomm_arr = [];
  }
  //Doctor checkup Influenza Vaccine
  if (age > 65) {
    recomm_level = 1;
    frequency = "frequency_doctorcheckup_Influenza_c1";
    why_recomm_arr.push("recomm_doctorcheckup_Influenza_c1");
  }
  if (recomm_level != '') {
    addPlan(user_id, recomm_level, frequency, why_recomm_arr, 'Doctor Checkup', 'Influenza Vaccine');
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
function addPlan(user_id, recomm_level, frequency, why_recomm_arr, checkup_category, checkup_name) {
  pool.getConnection((err, connection) => {
    if (err) throw err;
    console.log('connected as id ' + connection.threadId);
    //retrive check up from health plan table
    const selectQuery = 'SELECT checkup_id FROM `healthplan`' +
      '  WHERE `checkup_category` = ? AND checkup_name = ?';
    let query = mysql.format(selectQuery, [checkup_category, checkup_name]);
    console.log(query);
    connection.query(query, (err, rows) => {
      connection.release(); // return the connection to pool
      if (err) throw err;

      console.log('The data from healthplan table are: \n', rows);
      try {
        //check rows[0] not null
        if (rows.length > 0) {
          healthPlanJson = JSON.parse(JSON.stringify(rows[0]))
          console.log(healthPlanJson);
          var checkup_id = healthPlanJson.checkup_id;
          console.log(checkup_id);
          //add the entry in table
          let insertQuery = 'INSERT INTO recommendedandcustomizedplan (user_id,checkup_id,recomm_level,additional_fields,created_date)' +
            ' SELECT * FROM (SELECT ? as user_id,? as checkup_id,? as recomm_level,JSON_OBJECT(\'frequency\',?,\'why_recomm\',?),now()) AS tmp' +
            ' WHERE NOT EXISTS (' +
            ' SELECT user_id FROM recommendedandcustomizedplan' +
            ' WHERE (user_id =? AND checkup_id = ? AND recomm_level = ? AND additional_fields->>"$.frequency" = ? AND additional_fields->>"$.why_recomm_arr"=?' +
            ' )) LIMIT 1';
          let insQuery = mysql.format(insertQuery, [user_id, checkup_id, recomm_level, frequency, why_recomm_arr.toString(), user_id, checkup_id, recomm_level, frequency, why_recomm_arr.toString()]);
          console.log(insQuery);
          pool.query(insQuery, (err, res) => {
            if (err) {
              console.error(err);
              res.status(500).send({
                message:
                  err.message || "Some error occurred while creating the User."
              });
              return;
            }
            console.log("Rows Affected " + res.affectedRows);
          });
        }
      } catch (e) {

      }
    });
  });
}

/*function getSelfAddedCheckups(user_id){
  pool.getConnection((err, connection) => {
    if(err) throw err;
    console.log('connected as id ' + connection.threadId);
    const selectQuerySelfAdded = 'SELECT additional_fields->>"$.checkup_name" checkup_name '+
                        ' FROM `recommendedandcustomizedplan` WHERE `user_id` = ? AND additional_fields->>"$.plan_type" = ? ';

    let query = mysql.format(selectQuerySelfAdded,[user_id,'selfadded']);
    console.log(query);
    connection.query(query, (err, rows) => {
        connection.release(); // return the connection to pool
        if(err) throw err;
        let result = [];
        console.log(rows)
        result.push({plan_type :'SelfAdded',testName :'Self'})
        result.push({testTypes:rows});
        return result;
    });
  });
}*/