/*
to calculate age of person
*/
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
}
/*
to calculate BMI
*/
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
}
