//module.exports = app => {
  const user = require("../controllers/user-controller");
  var router = require("express").Router();
  module.exports = app => {
 
  router.post("/update",user.updateHealthDetails);

  app.use('/api/users', router);
};
