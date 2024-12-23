const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const logger = require('morgan');
const path = require('path');
const router = require('./routes/index');
const { auth } = require('express-openid-connect');
const { Database } = require("sqlite3");
const util = require("util");
const bodyParser = require("body-parser");

dotenv.load();

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

//shit for post requests
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

const config = {
  authRequired: false,
  auth0Logout: true
};

const port = process.env.PORT || 3000;
if (!config.baseURL && !process.env.BASE_URL && process.env.PORT && process.env.NODE_ENV !== 'production') {
  config.baseURL = `http://localhost:${port}`;
}

app.use(auth(config));

// Middleware to make the `user` object available for all views
app.use(function (req, res, next) {
  res.locals.user = req.oidc.user;
  next();
});

app.use('/', router);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handlers
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: process.env.NODE_ENV !== 'production' ? err : {}
  });
});

//get request for the open project button
setInterval(() => {
  var k;
  let db = new Database("./database/projects.db");
  db.all('SELECT * FROM projects', (err, rows) => {
    for (k in rows) {
      router.get(`/projects/${rows[k].projectid}`, (req, res) => {
        res.sendFile(__dirname + "/routes/project.html");
      });
      router.get(`/projects/${rows[k].projectid}/data`, (req, res) => {
        res.send(rows[k]);
      })
    }
  })
}, 200);

//for displaying all the members of a project (still not complete)
setInterval(async () => {
  let mdb = new Database("./database/members.db");
  mdb.all('SELECT * FROM members GROUP BY projectid', (err, rows) => {
    //console.log(rows);
  })
  // db.all('SELECT * FROM projects', async (err, rows) => {
  //   for (k in rows) {
  //     let info = await mdb.all('SELECT * FROM members WHERE projectid = ?', rows[k].projectid);
  //     router.get(`/projects/${rows[k].projectid}/data/members`, (req, res) => {
  //       res.send(info);
  //     })
  //   }
  // })
}, 200);

//get request for edit project button
setInterval(() => {
  var k;
  let db = new Database("./database/projects.db");
  db.all('SELECT * FROM projects', (err, rows) => {
    for (k in rows) {
      router.get(`/edit/${rows[k].projectid}`, (req, res) => {
        res.sendFile(__dirname + "/routes/edit.html");
      });
    }
  })
}, 200);

//post request for updating the title and the description of the project
router.post("/submit", (req, res) => {
  let db = new Database("./database/projects.db");
  db.all(`UPDATE projects SET projectname = ?, description = ? WHERE projectid = ?`, req.body.title, req.body.description, req.body.projectid, (err, rows) => {
    console.log(err);
    res.status(200).send("Success!")
  });
})


http.createServer(app)
  .listen(port, () => {
    console.log(`Listening on ${config.baseURL}`);
  });
