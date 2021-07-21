module.exports = app => {
    const health = require("../controllers/healthPlan-controller.js");
  
    var router = require("express").Router();
  
    // Create a new Tutorial
    router.get("/gethealthplans/:id", health.getHealthPlans);

    // router.get("/", health.findAll);

    app.use('/api/users', router);
  };
  