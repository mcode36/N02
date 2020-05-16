"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const MongoClient = require("mongodb").MongoClient;


const fccTesting = require("./freeCodeCamp/fcctesting.js");
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

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
  })
);
app.use(passport.initialize());
app.use(passport.session());

const client = new MongoClient(process.env.DATABASE, {
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

  app.use((req, res, next) => {
    res
      .status(404)
      .type("text")
      .send("Not Found");
  });
  // spacer
}); // end_of client.connect

app.get("/test", function(req, res) {
  res.send({ route: "test" });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
