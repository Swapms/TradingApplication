//global.config = require('../../../jwt');
const { sign, verify } = require("jsonwebtoken");
//const {jwtDetails} = require('../config/jwt.js');
/*
to calculate age of person

 exports.getAge=function(dateString) {
     console.log("age from index js")
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) 
    {
        age--;
    }
    return age;
}*/
const getAge = (dateString) => {
  console.log("age from index js")
  let today = new Date();
  let birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  let m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) 
  {
      age--;
  }
  return age;
};
/*
to calculate BMI

exports.getBMI = function(height,weight) {
  var heightInCm ='';
  if(height.includes(".")){
    var feet = height.split(".")[0];
    var inches = height.split(".")[1];
    console.log("fee : "+feet +"inches :"+inches);
    heightInCm =(Number(inches) +(feet * 12))*2.54;
  }else{
     // only feet provided
     heightInCm = (height*12) * 2.54
  }
  var BMI = Math.round((Number(weight) / heightInCm / heightInCm ) * 10000,2);
  return BMI;
}*/
const getBMI = (height,weight) => {
  let heightInCm ='';
  if(height.includes(".")){
    let feet = height.split(".")[0];
    let inches = height.split(".")[1];
    console.log("fee : "+feet +"inches :"+inches);
    heightInCm =(Number(inches) +(feet * 12))*2.54;
  }else{
     // only feet provided
     heightInCm = (height*12) * 2.54
  }
  let BMI = Math.round((Number(weight) / heightInCm / heightInCm ) * 10000,2);
  return BMI;

}

const createTokens = (user) => {
  const accessToken = sign(
    { username: user.username, id: user.user_id },
    global.config.secretKey,
    {
      algorithm : global.config.algorithm,
      expiresIn: '7d'
    });

  return accessToken;
};

const validateToken = (req, res, next) => {
  var token = req.headers['x-access-token'];
    console.log(token);
    if (token) {
        verify(token, global.config.secretKey,
            {
                algorithm: global.config.algorithm

            }, function (err, decoded) {
                if (err) {
                    let errordata = {
                        message: err.message,
                        expiredAt: err.expiredAt
                    };
                    console.log(errordata);
                    return res.status(401).json({
                        message: 'Unauthorized Access'
                    });
                }
                req.decoded = decoded;
                console.log(decoded);
                next();
            });
    } else {
        return res.status(403).json({
            message: 'Forbidden Access'
        });
    }
  /*const accessToken = req.cookies["access-token"];
  var token = req.headers['x-access-token'];
  console.log(token);

  if (!accessToken)
    return res.status(400).json({ error: "User not Authenticated!" });

  try {
    const validToken = verify(accessToken, jwtDetails.secretKey);
    if (validToken) {
      req.authenticated = true;
      return next();
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }*/
};

module.exports = { getAge, getBMI,createTokens,validateToken };