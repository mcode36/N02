"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const passport = require("passport");
const session = require("express-session");
const mongo = require("mongodb").MongoClient;
const routes = require('./routes.js');
const auth = require('./auth.js');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "pug");

const client = new mongo(process.env.DATABASE, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

client.connect((err, client) => {
  if (err) {
    console.log("Database error: " + err);
  } else {
    console.log("Successful database connection");
  }

  const db = client.db("userAuth");
  
  auth(app, db);
  routes(app, db);

  
  // spacer
}); // end_of client.connect



app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
