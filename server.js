const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

var corsOptions = {
  origin :"http://localhost:3000"
}

app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));


require("./app/routes/user-route")(app);
require("./app/routes/health-route")(app);

app.listen(8080, () => {
  console.log('Server is running at port 8080');
});