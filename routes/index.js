var router = require('express').Router();
const { requiresAuth } = require('express-openid-connect');
const {Database} = require("sqlite3");

router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Auth0 Webapp sample Nodejs',
    isAuthenticated: req.oidc.isAuthenticated()
  });
});

router.get('/profile', requiresAuth(), function (req, res, next) {
  res.render('profile', {
    userProfile: JSON.stringify(req.oidc.user, null, 2),
    title: 'Profile page'
  });
});

//all the projects of the user are displayed here (not complete though)
router.get('/projects', (req, res) => {
  res.sendFile(__dirname + "/dashboard.html")
});

//get request to load the projects of a user (livetime shit)
router.get("/uprojects", requiresAuth(), (req, res, next) => {
  let db = new Database("./database/projects.db", err => console.log(err));
  db.all(`SELECT * FROM projects WHERE id = ?`, req.oidc.user.nickname, (err, rows) => {
    if (err) return res.status(400).send(err);
    if (rows === undefined) {
      res.status(200).send('<span>You are not woking in any projects!</span>');
    } else {
      let a = [];
      var i;
      for (i = 0; i < rows.length; i++) {
        const b = i + 1
        var j;
        let c = [];
        for(j=0;j<51;j++) {
          c.push(rows[i].description.split('')[j]);
        }
        if(rows[i].description.split('').length > 50) {
          c.push('....');
        } else {
          c.push(' ');
        }
        a.push('<tr id=' + rows[i].projectid + ' style="text-align: center;"><th scope="col" style="color: white;">' + b + '</th><th scope="col" style="color: white;"><p style="text-decoration: none;">' + rows[i].projectname + '</p></th><th scope="col" style="color: white;"><p style="text-decoration: none;">' + rows[i].role + '</p></th><th scope="col" style="color: white;"><p style="text-decoration: none;">' + c.join('') + '</p></th><th scope="col" style="color: white;"><p style="text-decoration: none;">' + rows[i].type + '</p></th><th scope="col" style="color: white;"><div class="button-container"><button class="action-button open-button" onclick="window.location.href = \'/projects/'+ rows[i].projectid +'\'"><span class="icon">🔗</span> OPEN</button><button class="action-button edit-button" onclick="window.location.href = \'/edit/'+ rows[i].projectid + '\'"><span class="icon">✏️</span> EDIT</button><button class="action-button delete-button"><span class="icon">🗑️</span>DELETE</button></div></th></tr>')
      }
      res.status(200).send(a.join(''));
    }
  });
});

module.exports = router;
