module.exports = app => {
    const user = require("../controllers/user-controller.js");
  
    var router = require("express").Router();
  
    // Create a new Tutorial
    router.post("/", user.create);

    router.post("/update", user.updateHealthDetails);

    router.post("/addMember", user.addMember);
    
     router.get("/", user.findAll);
   
    app.use('/api/users', router);
  };
  