//module.exports = app => {
    const user = require("../controllers/user-controller");
    const userLogin = require("../controllers/loginController");
    const validateToken  = require("../controllers/helpers/index").validateToken;
    var router = require("express").Router();
    module.exports = app => {
    // Create a new user
    router.post("/", user.create);
    //login user
    router.post("/login", userLogin.login);

    router.post("/register", userLogin.register);

    router.post("/update", user.updateHealthDetails);

    router.post("/addMember",validateToken,user.addMember);
    //router.get('/data', validateToken, user.findAll);
   
    app.use('/api/users', router);
  };
  