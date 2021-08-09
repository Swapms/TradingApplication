module.exports = app => {
  const health = require("../controllers/healthPlan-controller.js");
  var router = require("express").Router();

  // Create a new Tutorial
  router.get("/gethealthplans/:id", health.getHealthPlans);

  router.get("/getHealthPlanbyId/:user_id/:checkup_id", health.getHealthPlanbyId);

 // router.post("/update",health.updateHealthDetails);

  app.use('/api/users', router);
};
