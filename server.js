"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
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

  // start to add things down below
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    db.collection("users").findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
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
        //if (password !== user.password) {
        //  return done(null, false);
        //}
        if (!bcrypt.compareSync(password, user.password)) { 
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
      db.collection("users").findOne({ username: req.body.username }, function(
        err,
        user
      ) {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect("/");
        } else {
          var hash = bcrypt.hashSync(req.body.password, 12);
          db.collection("users").insertOne(
            { username: req.body.username, password: hash },
            (err, doc) => {
              if (err) {
                res.redirect("/");
              } else {
                next(null, user);
              }
            }
          );
        }
      });
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
  // spacer
}); // end_of client.connect

app.get("/test", function(req, res) {
  res.send({ route: "test" });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
