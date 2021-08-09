const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const config = require('./app/config/config');
//const { db: { pool } } = config;
/*var corsOptions = {
  origin :"http://localhost:3000"
}

app.use(cors(corsOptions));*/

// CORS
app.use(cors())
// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
/*
// Serve static files
app.use(express.static(path.join(__dirname, 'client', 'build')))
// Redirect back to index.html if urls do not match
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"))
})*/
//app.use(express.json());
require("./app/routes/user-route")(app);
require("./app/routes/health-route")(app);


app.listen(config.app.port, () => {
  console.log('Server is running at port 8080');
});

