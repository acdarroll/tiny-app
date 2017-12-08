const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

let app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieSession( {
  name: 'session',
  keys: ['random string', 'another random'],
  maxAge: 1000 * 60 * 60
}));

app.set('view engine', 'ejs');

var PORT = process.env.PORT || 8080; // default port 8080

const saltRounds = 10;

const users = {
  "h2h": {
    id: "h2h",
    email: "user@example.com",
    password: bcrypt.hashSync('never', saltRounds)
  },
  "lhl": {
    id: "lhl",
    email: "ajc@gmail.com",
    password: bcrypt.hashSync('never', saltRounds)
  },
 "brb": {
    id: "brb",
    email: "user2@example.com",
    password: bcrypt.hashSync('never', saltRounds)
  }
}

const urlDatabase = {
  'b2xVn2': {
    userId: 'h2h',
    shortUrl: 'b2xVn2',
    longUrl: 'http://www.lighthouselabs.ca'
  },
  '9sm5xK': {
    userId: 'brb',
    shortUrl: '9sm5xK',
    longUrl: 'http://www.google.com'
  }
};

// Generates a 6 character random string based on character set
let generateRandomString = function() {
  let legend = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shortURL = '';

  while(shortURL.length < 6) {
    shortURL += legend.charAt(Math.floor(Math.random() * 62) + 1);
  }
  return shortURL;
}

let urlsForUser = function(id) {
  let userUrls = [];
  for(var url in urlDatabase) {
    if(urlDatabase[url].userId === id) {
      userUrls.push(urlDatabase[url]);
    }
  }
  return userUrls;
}

/*  INDEX PAGE  */
app.get('/', (req, res) => {
  let userId = req.session.userId;

  if(userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  let userUrls = [];
  let userId = req.session.userId;

  let templateVars = {
    user: users[userId]
  }

  if(users[userId]) {
    userUrls = urlsForUser(userId);
    templateVars.urls = userUrls
  }

  res.render("urls_index", templateVars);
});

app.post('/urls', (req, res) => {
  let shortUrl = generateRandomString();
  let userId = req.session.userId;

  urlDatabase[shortUrl] = {
    userId: userId,
    shortUrl: shortUrl,
    longUrl: req.body.longURL
  }

  res.redirect(303, `/urls/${shortUrl}`);   // Redirect to the generated short url after a form submission
});

/*  REGISTER  */
app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.session.userId]
  }
  if(templateVars.user) {
    res.redirect('/urls')
  }
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  var generatedId = generateRandomString();
  for(var user in users) {
    if(users[user].email === req.body.email) {
      res.sendStatus(400);
    }
  }

  if(req.body.email && req.body.password) {
    users[generatedId] = {
      id: generatedId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, saltRounds)
    }

    req.session.userId = users[generatedId].id;

    res.redirect('/urls');
  } else {
    res.sendStatus(400);
  }
});

/*  NEW URLS  */
app.get('/urls/new', (req, res) => {
  if(req.session.userId) {
    let templateVars = {
      user: users[req.session.userId]
    }

    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login')
  }
});

/*  LOGIN AND LOGOUT  */
app.get('/login', (req, res) => {
  let templateVars = {
    user: users[req.session.userId]
  }
  if(templateVars.user) {
    res.redirect('/urls');
  }

  res.render('urls_login', templateVars);
});

app.post('/login', (req, res) => {
  for(var user in users) {
    if(users[user].email === req.body.email) {
      if(bcrypt.compareSync(req.body.password, users[user].password)) {
        req.session.userId = users[user].id;
        res.redirect('/urls');
      } else {
        res.sendStatus(403).send("Wrong password");
      }
    }
  }
  res.sendStatus(403).send('User not found');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

/*  REDIRECT WEBSITE  */
app.get('/u/:id', (req, res) => {
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    res.redirect(307, urlDatabase[req.params.id].longUrl);  // Redirect to the longurl of the short url
  } else {
    let templateVars = {
      user: users[req.session.userId]
    }

    res.render('urls_redirect', templateVars);   // Redirect to the form submission if the short url does not exist
  }
});

/*  URL SHORT URLS  */
app.put('/urls/:id', (req, res) => {
  if(urlDatabase[req.params.id].userId === req.session.userId) {
    urlDatabase[req.params.id].longUrl = req.body.longURL;

  res.redirect(`/urls/${req.params.id}`);   // Redirect to the generated short url after a form submission
  } else {
    res.redirect('/urls');
  }

});

app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortUrl: req.params.id,
    url: urlDatabase[req.params.id],
    user: users[req.session.userId]
  }

  res.render('urls_show', templateVars);
  // } else {
  //   res.sendStatus(404).end();    // Send a 404 response when the short url is not in the database
  // }
});

app.delete('/urls/:id/delete', (req, res) => {
  if(urlDatabase[req.params.id].userId === req.session.userId) {
    delete urlDatabase[req.params.id];
  }
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});