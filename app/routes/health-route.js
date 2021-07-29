module.exports = app => {
    const health = require("../controllers/healthPlan-controller.js");
    const validateToken  = require("../controllers/helpers/index").validateToken;
    var router = require("express").Router();
  
    // Create a new Tutorial
    router.get("/gethealthplans/:id",validateToken, health.getHealthPlans);

    router.get("/getHealthPlanbyId/:id", health.getHealthPlanbyId);

    

    // router.get("/", health.findAll);

    app.use('/api/users', router);
  };
  