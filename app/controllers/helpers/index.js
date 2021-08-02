
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

module.exports = { getAge, getBMI};