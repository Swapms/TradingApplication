const { sign, verify } = require("jsonwebtoken");


const getAge = (dateString) => {
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
                        status:false,
                        message: 'Unauthorized Access'
                    });
                }
                req.decoded = decoded;
                console.log(decoded);
                next();
            });
    } else {
        return res.status(403).json({
            status:false,
            message: 'Forbidden Access'
        });
    }
 
};

module.exports = { getAge, getBMI,createTokens,validateToken };