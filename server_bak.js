"use strict";

const express = require("express");
const bodyParser = require("body-parser");
//const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const LocalStrategy = require("passport-local");

const app = express();

//fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

const normal = 0;
// Create a new MongoClient
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

  app.get("/debug", function(req, res) {
    // Insert a single document
    db.collection("users").insertOne({ username: "Santa" }, function(err, r) {
      if (err) {
        console.log("error inserting new record.");
      } else {
        console.log("insert successful.");
      }
    });
    res.send("debug mode");
  });
});

if (normal == 1) {
  client.connect((err, db) => {
    if (err) {
      console.log("Database error: " + err);
    } else {
      console.log("Successful database connection");

      passport.serializeUser((user, done) => {
        done(null, user._id);
      });

      passport.deserializeUser((id, done) => {
        db.collection("users").findOne(
          { _id: new ObjectID(id) },
          (err, doc) => {
            done(null, doc);
          }
        );
      });

      passport.use(
        new LocalStrategy(function(username, password, done) {
          db.collection("users").findOne({ username: username }, function(
            err,
            user
          ) {
            console.log("User " + username + " attempted to log in.");
            if (err) {
              return done(err);
            }
            if (!user) {
              return done(null, false);
            }
            if (password !== user.password) {
              return done(null, false);
            }
            return done(null, user);
          });
        })
      );

      function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
          return next();
        }
        res.redirect("/");
      }

      app.route("/").get((req, res) => {
        res.render(process.cwd() + "/views/pug/index", {
          title: "Hello",
          message: "login",
          showLogin: true,
          showRegistration: true
        });
      });

      app
        .route("/login")
        .post(
          passport.authenticate("local", { failureRedirect: "/" }),
          (req, res) => {
            res.redirect("/profile");
          }
        );

      app.route("/profile").get(ensureAuthenticated, (req, res) => {
        res.render(process.cwd() + "/views/pug/profile", {
          username: req.user.username
        });
      });

      app.route("/register").post(
        (req, res, next) => {
          db.collection("users").findOne(
            { username: req.body.username },
            function(err, user) {
              if (err) {
                next(err);
              } else if (user) {
                res.redirect("/");
              } else {
                db.collection("users").insertOne(
                  { username: req.body.username, password: req.body.password },
                  (err, doc) => {
                    if (err) {
                      res.redirect("/");
                    } else {
                      next(null, user);
                    }
                  }
                );
              }
            }
          );
        },
        passport.authenticate("local", { failureRedirect: "/" }),
        (req, res, next) => {
          res.redirect("/profile");
        }
      );

      app.route("/logout").get((req, res) => {
        req.logout();
        res.redirect("/");
      });

      app.use((req, res, next) => {
        res
          .status(404)
          .type("text")
          .send("Not Found");
      });

      app.listen(process.env.PORT || 3000, () => {
        console.log("Listening on port " + process.env.PORT);
      });
    }
  });
} //  if
