const mysql = require('mysql');
const pool = require('../config/config.js');
const healthRoute = require('../routes/health-route.js');
const healthPlan= require('../models/HealthPlan.js');
const { json } = require('body-parser');
const { agefun, BMIfun } = require("./helpers/index");
//const agefun = require('./helpers/index.js').getAge;
//const BMIfun= require('./helpers/index.js').getBMI;

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
      if(err) throw err;
      console.log('connected as id ' + connection.threadId);
     /* const selectQuery = 'SELECT checkup_id,recomm_level,'+
      ' additional_fields->>"$.frequency" frequency,additional_fields->>"$.why_recomm" why_recomm'+
      ' FROM `recommendedandcustomizedplan` WHERE `user_id` = ?';*/
      const selectQuery = 'SELECT h.checkup_id, h.checkup_name,r.recomm_level '+
     ' FROM demo.healthplan h '+
     ' INNER JOIN `demo`.`recommendedandcustomizedplan` r'+
     ' ON h.checkup_id = r.checkup_id where user_id = ? order by checkup_category;'
      let query = mysql.format(selectQuery,[user_id]);
      console.log(query);
      connection.query(query, (err, rows) => {
         // connection.release(); // return the connection to pool
          if(err) throw err;
          let result = [];
         // let finalResult = [];
          let testTypes = [];
          const selectQueryMain = 'SELECT count(h.checkup_category) as count, h.checkup_category '+
          ' FROM demo.healthplan h '+
          ' INNER JOIN `demo`.`recommendedandcustomizedplan` r'+
          ' ON h.checkup_id = r.checkup_id where user_id = ? group by checkup_category ;'
           let querymain = mysql.format(selectQueryMain,[user_id]);
           connection.query(querymain, (err, rowsmain) => {
            connection.release(); // return the connection to pool
            jsondata = JSON.parse(JSON.stringify(rowsmain));  
          let startPtr = 0;
          let endPtr = 0;
          let recommendedcount = 0;
          let selfAddedcount = 0;
            jsondata.forEach(function(healthplan) {
              endPtr = endPtr + healthplan.count;
            for (let i = startPtr; i <endPtr; i++) {
              testTypes.push(rows[i]);
            }
            recommendedcount = recommendedcount + healthplan.count;
            result.push({testName: healthplan.checkup_category, testTypes:testTypes});
            startPtr = healthplan.count;
            testTypes = [];
          });
        
          //for self added plans
          // let selfAddedArr = getSelfAddedCheckups(user_id);
            const selectQuerySelfAdded = 'SELECT additional_fields->>"$.checkup_name" checkup_name '+
                          ' FROM `recommendedandcustomizedplan` WHERE `user_id` = ? AND additional_fields->>"$.plan_type" = ? ';
    
            let query = mysql.format(selectQuerySelfAdded,[user_id,'selfadded']);
            console.log(query);
            connection.query(query, (err, rows) => {
                connection.release(); // return the connection to pool
                if(err) throw err;
                let tempResult = [];
                selfAddedcount = rows.length;
                tempResult.push({test_name :'SelfAdded',testTypes:rows})
          //  finalResult.push({Recommendedcount:recommendedcount,SelfAddedcount:selfAddedcount}); 
       //     finalResult.push({Recommended:result,Recommendedcount:recommendedcount,SelfAddedcount:selfAddedcount,SelfAdded:{test_name :'SelfAdded',testTypes:rows}})           
          //  finalResult.push({SelfAdded:tempResult});
          //  console.log(JSON.parse(JSON.stringify(finalResult)))
            res.status(200).json(JSON.parse(JSON.stringify({Recommended:result,Recommendedcount:recommendedcount,SelfAddedcount:selfAddedcount,SelfAdded:tempResult})))
          });
        });
      });
    });
  };

  exports.createHealthPlans = (user_id) => {
  
    pool.getConnection((err, connection) => {
      if(err) throw err;
      console.log('connected as id ' + connection.threadId);
      const selectQuery = 'SELECT user_attributes->>"$.dob" dob,user_attributes->>"$.gender" gender,'+
      ' user_attributes->>"$.height" height,user_attributes->>"$.weight" weight,user_attributes->>"$.family_history" family_history, '+
      ' user_attributes->>"$.diet" diet , user_attributes->>"$.exisiting_conditions" exisiting_conditions,user_attributes->>"$.excercise" excercise '+
      ' FROM `user_details` WHERE `user_id` = ?';
      let query = mysql.format(selectQuery,[user_id]);
      console.log(query);
      connection.query(query, (err, rows) => {
          connection.release(); // return the connection to pool
          if(err) throw err;
          
          console.log('The data from users table are: \n', rows);
          jsondata = JSON.parse(JSON.stringify(rows[0]))  
          const age = agefun("'"+(jsondata.dob)+"'")
          let height = jsondata.height;
          const bmi = BMIfun(height,jsondata.weight)
          let gender = jsondata.gender;
          let family_history =  jsondata.family_history;
          let exisiting_conditions =  jsondata.exisiting_conditions;
         
          generatePlansForBloodTest(user_id,age,gender,exisiting_conditions,family_history)
          
          generatePlansForDiagnostic(user_id,age,gender,exisiting_conditions,family_history)
          
          generatePlansForDoctorCheckup(user_id,age,gender,exisiting_conditions,family_history);
          
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
  function generatePlansForBloodTest (user_id,age,gender,exisiting_conditions,family_history) {
    let recomm_level = '',frequency = '',why_recomm = '';
    //condition for blood test PSA, get checkup_id from healthplan table
    if( gender === 'male' ) {
      if(exisiting_conditions.includes("Prostate cancer")){
        recomm_level= 2;
        frequency = "frequency_blood_PSA_c5";
        why_recomm = "recomm_blood_PSA_c5";
      }else if(age > 40 && age < 75){
        if(family_history.includes("Prostate cancer") && family_history.includes("Breast or ovarian cancer")){
         console.log("in Prostate cancer and Breast or ovarian cancer ")
         recomm_level= 2;
         frequency = "frequency_blood_PSA_c4";
         why_recomm = "recomm_blood_PSA_c4";
        }else if(family_history.includes("Prostate cancer")){
          recomm_level= 2;
          frequency = "frequency_blood_PSA_c2";
         why_recomm = "recomm_blood_PSA_c2";
        }else if(family_history.includes("Breast or ovarian cancer")){
         recomm_level= 2;
         frequency = "frequency_blood_PSA_c3";
         why_recomm = "recomm_blood_PSA_c3";
        }else{
          recomm_level= 1;
          frequency = "frequency_blood_PSA_c1";
          why_recomm = "recomm_blood_PSA_c1";
       }
       console.log(recomm_level)
       if(recomm_level != ''){
        addPlan(user_id,recomm_level,frequency,why_recomm,'Blood Test', 'Prostate Specific Antigen (PSA)');
        recomm_level = ''
        }
      }  
    }
     //condition for blood test CBC, get checkup_id from healthplan table
     if(exisiting_conditions != ''){
      recomm_level= 2;
      frequency = "frequency_blood_CBC_c1";
      why_recomm = "recomm_blood_CBC_c1";
     }else if(bmi > 30 ){
      recomm_level= 1;
      frequency = "frequency_blood_CBC_c3";
      why_recomm = "recomm_blood_CBC_c3";
     }else if(age > 60 ){
      recomm_level= 1;
      frequency = "frequency_blood_CBC_c2";
      why_recomm = "recomm_blood_CBC_c2";
     }else if(age > 18  && age < 60){
      recomm_level= 0;
      frequency = "frequency_blood_CBC_c1";
      why_recomm = "recomm_blood_CBC_c1";
     }

    if(recomm_level != ''){
      addPlan(user_id,recomm_level,frequency,why_recomm,'Blood Test', 'Complete Blood Count (CBC)');
      recomm_level = ''
    }

     //condition for blood test CA-125
     if(gender == 'female'){
      if(exisiting_conditions.includes("CA-125")){
        recomm_level= 2;
        frequency = "frequency_blood_CA-125_c2";
        why_recomm = "recomm_blood_CA-125_c2";
      } else if(age > 30 && family_history.includes("Breast or ovarian cancer")){
        recomm_level= 2;
        frequency = "frequency_blood_CA-125_c1";
        why_recomm = "recomm_blood_CA-125_c1";
      }
     }

    if(recomm_level != ''){
      addPlan(user_id,recomm_level,frequency,why_recomm,'Blood Test', 'CA-125');
      recomm_level = ''
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
  function generatePlansForDiagnostic(user_id,age,gender,exisiting_conditions,family_history) {
    if(gender === 'female'){
      //condition for diagnostic 	Mammography
     if(exisiting_conditions.includes("Breast or ovarian cancer")){
       recomm_level= 2;
       frequency = "frequency_diagnostic_BC_c4";
       why_recomm = "recomm_diagnostic_BC_c4";
     }
     else if(age > 21 && family_history.includes("Breast or ovarian cancer")){
       recomm_level= 2;
       frequency = "frequency_diagnostic_BC_c3";
       why_recomm = "recomm_diagnostic_BC_c3";
     }else if(age > 70){
       recomm_level= 1;
       frequency = "frequency_diagnostic_BC_c2";
       why_recomm = "recomm_diagnostic_BC_c2";
     } else if(age > 40 && age < 71){
       recomm_level= 1;
       frequency = "frequency_diagnostic_BC_c1";
       why_recomm = "recomm_diagnostic_BC_c1";
     }
     if(recomm_level != ''){
       addPlan(user_id,recomm_level,frequency,why_recomm,'Diagnostic', 'Mammography');
       recomm_level = ''
     }
     if(age > 30 && family_history.includes("Breast or ovarian cancer")){
       recomm_level= 2;
       frequency = "frequency_diagnostic_TU_c1";
       why_recomm = "recomm_diagnostic_TU_c1";
     }
     //existing cond Transvaginal ultrasound not added
     if(recomm_level != ''){
       addPlan(user_id,recomm_level,frequency,why_recomm,'Diagnostic', 'Transvaginal ultrasound');
       recomm_level = ''
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
  function generatePlansForDoctorCheckup (user_id,age,gender,exisiting_conditions,family_history) {
       let recomm_level = '',frequency = '',why_recomm = '';
        //Doctor checkup Genetic counseling
        if(age > 21 && family_history.includes("Breast or ovarian cancer")){
          recomm_level= 2;
          frequency = "frequency_doctorcheckup_genetic_c1";
          why_recomm = "recomm_blood_doctorcheckup_genetic_c1";
         }
         if(recomm_level != ''){
          addPlan(user_id,recomm_level,frequency,why_recomm,'Doctor Checkup', 'Genetic counseling');
          recomm_level = ''
        }
         //Doctor checkup Physician
         if(age > 50 && age < 61) {
          recomm_level= 1;
          frequency = "frequency_doctorcheckup_physician_c2";
          why_recomm = "recomm_blood_doctorcheckup_physician_c2";
         }else if(age > 30 && age < 51) {
          recomm_level= 0;
          frequency = "frequency_doctorcheckup_physician_c1";
          why_recomm = "recomm_blood_doctorcheckup_physician_c1";
         }
         if(recomm_level != ''){
          addPlan(user_id,recomm_level,frequency,why_recomm,'Doctor Checkup', 'Physician');
          recomm_level = ''
        }
          //Doctor checkup Geriatric specialist or Physican
        if(age > 60) {
            recomm_level= 1;
            frequency = "frequency_doctorcheckup_geriatric_c1";
            why_recomm = "recomm_blood_doctorcheckup_geriatric_c1";
        }
      
        if(recomm_level != ''){
          addPlan(user_id,recomm_level,frequency,why_recomm,'Doctor Checkup', 'Geriatric specialist or Physican');
          addPlan(user_id,recomm_level,'frequency_doctorcheckup_ent_c1','recomm_blood_doctorcheckup_ent_c1','Doctor Checkup', 'ENT');
          recomm_level = ''
        }
        //Doctor checkup Dentist
        if(age > 18) {
          recomm_level= 0;
          frequency = "frequency_doctorcheckup_dentist_c1";
          why_recomm = "recomm_blood_doctorcheckup_dentist_c1";
        }
        if(recomm_level != ''){
          addPlan(user_id,recomm_level,frequency,why_recomm,'Doctor Checkup', 'Dentist');
          recomm_level = ''
        }
        //Doctor checkup Opthamologist
        if(age > 20 && exisiting_conditions.includes('diabetic')) {
          recomm_level= 1;
          frequency = "frequency_doctorcheckup_Opthamologist_c4";
          why_recomm = "recomm_blood_doctorcheckup_Opthamologist_c4";
        }else if(age > 65){
          recomm_level= 1;
          frequency = "frequency_doctorcheckup_Opthamologist_c3";
          why_recomm = "recomm_blood_doctorcheckup_Opthamologist_c3";
        }else if(age > 40 && age < 66) {
          recomm_level= 1;
          frequency = "frequency_doctorcheckup_Opthamologist_c2";
          why_recomm = "recomm_blood_doctorcheckup_Opthamologist_c2";
        }else if(age > 20 && age < 41) {
          recomm_level= 0;
          frequency = "frequency_doctorcheckup_Opthamologist_c1";
          why_recomm = "recomm_blood_doctorcheckup_Opthamologist_c1";
        }
        if(recomm_level != ''){
          addPlan(user_id,recomm_level,frequency,why_recomm,'Doctor Checkup', 'Opthamologist');
          recomm_level = ''
        }
         //Doctor checkup Gynocologist
         if( gender == 'female' && (age > 24 && age < 41)) {
          recomm_level= 1;
          frequency = "frequency_doctorcheckup_Gynocologist_c1";
          why_recomm = "recomm_blood_doctorcheckup_Gynocologist_c1";
        }else if(age > 40){
          recomm_level= 1;
          frequency = "frequency_doctorcheckup_Gynocologist_c2";
          why_recomm = "recomm_blood_doctorcheckup_Gynocologist_c2";
        }

        if(recomm_level != ''){
          addPlan(user_id,recomm_level,frequency,why_recomm,'Doctor Checkup', 'Gynocologist');
          recomm_level = ''
        }
          //Doctor checkup Influenza Vaccine
        if(age > 65 ) {
            recomm_level= 1;
            frequency = "frequency_doctorcheckup_Influenza_c1";
            why_recomm = "recomm_blood_doctorcheckup_Influenza_c1";
        }
        if(recomm_level != ''){
          addPlan(user_id,recomm_level,frequency,why_recomm,'Doctor Checkup', 'Influenza Vaccine');
          recomm_level = ''
        }
  }
  /**
   * It will add entry in table
   * @param {*} user_id 
   * @param {*} recomm_level 
   * @param {*} frequency 
   * @param {*} why_recomm 
   * @param {*} checkup_category 
   * @param {*} checkup_name 
   */
  function addPlan(user_id, recomm_level,frequency,why_recomm,checkup_category, checkup_name) {
    pool.getConnection((err, connection) => {
      if(err) throw err;
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
      //check rows[0] not null
      healthPlanJson = JSON.parse(JSON.stringify(rows[0]))
      console.log(healthPlanJson);
      var checkup_id = healthPlanJson.checkup_id;
      console.log(checkup_id);
      //check entry already present 
      const selectQueryForPlan =  'SELECT user_id,checkup_id,recomm_level,'+
      ' additional_fields->>"$.frequency" frequency,additional_fields->>"$.why_recomm" why_recomm,'+
      ' FROM `recommendedandcustomizedplan` WHERE `user_id` = ?';
      let query = mysql.format(selectQuery, [checkup_category, checkup_name]);
      console.log(query);
        //add the entry in table
      let insertQuery = 'INSERT INTO recommendedandcustomizedplan (user_id,checkup_id,recomm_level,additional_fields,created_date)' +
        ' SELECT * FROM (SELECT ? as user_id,? as checkup_id,? as recomm_level,JSON_OBJECT(\'frequency\',?,\'why_recomm\',?),now()) AS tmp'+
        ' WHERE NOT EXISTS ('+
        ' SELECT user_id FROM recommendedandcustomizedplan'+
        ' WHERE (user_id =? AND checkup_id = ? AND recomm_level = ? AND additional_fields->>"$.frequency" = ? AND additional_fields->>"$.why_recomm"=?' +
        ' )) LIMIT 1';
      let insQuery = mysql.format(insertQuery, [user_id, checkup_id, recomm_level,frequency,why_recomm,user_id, checkup_id, recomm_level,frequency,why_recomm]);
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
        console.log("Rows Affected " +res.affectedRows);
      });
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