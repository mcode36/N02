"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const LocalStrategy = require("passport-local");

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

  app.get("/insertone", function(req, res) {
    // Insert a single document 
    db.collection("users").insertOne({ username: "Santa" }, function(err, r) {
      if (err) {
        console.log("error inserting new record.");
        res.send({ insertone: "error" });
      } else {
        console.log("insert successful.");
        res.send({ insertone: "successful" });
      }
    });
  });

  app.route("/").get((req, res) => {
    res.render(process.cwd() + "/views/pug/index", {
      title: "Hello",
      message: "login",
      showLogin: true,
      showRegistration: true
    });
  });
});

app.get("/test", function(req, res) {
  res.send({ route: "test" });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
