const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config();
let app = express();

let token = process.env.cookie_token;
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieSession( {
  name: 'session',
  secret: token,
  maxAge: 1000 * 60 * 60 * 24
}));

app.set('view engine', 'ejs');
var PORT = process.env.PORT || 8080; // default port 8080
const saltRounds = 10;

/* Initiate user and url databases, see below for format
  users = {
    'h43ksI': {
      id: h43ksI,
      email: user@example.com,
      password: <hashed password string>
    }
  }

  urlDatabase = {
    '4db8Ws': {
      userId: 'h43ksI',
      shortUrl: '4db8Ws',
      longUrl: http://www.google.ca,
      date: <date object corresponding to date created>,
      visits: 3,
      visitors: [h43ksI, 83Ns2x],
      history: [[<date>, h43ksI], [<date>, 83Ns2x], [<date>, h43ksI]]
    }
  }
*/
const users = {};
const urlDatabase = {};

// Generates a random string of
let generateRandomString = function() {
  let legend = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shortURL = '';

  while(shortURL.length < 6) {
    shortURL += legend.charAt(Math.floor(Math.random() * 62) + 1);
  }
  return shortURL;
};

let urlsForUser = function(id) {
  let userUrls = [];
  for(var url in urlDatabase) {
    if(urlDatabase[url].userId === id) {
      userUrls.push(urlDatabase[url]);
    }
  }
  return userUrls;
};

// Find and return a user object given an email
let findUser = function(email) {
  for(let user in users) {
    if(users[user].email === email)
      return users[user];
  }
  return false;
};

// Attempt to register a user and return false if the email exists or the email/password string is empty
// Return the user object if succesful
let registerUser = function(email, password) {
  for(let user in users) {
    if(users[user].email === email) {
      return false;
    }
  }

  if(email === '' || password === '') {
    return false;
  } else {
    let id = generateRandomString();
    users[id] = { id, email, password: bcrypt.hashSync(password, saltRounds) };
    return users[id];
  }
};

let uniqueVisitor = function(shortUrl, userId) {
  if(urlDatabase[shortUrl].visitors.indexOf(userId) > -1) {
    return false;
  } else {
  return true;
  }
};

let addVisitData = function(shortUrl, userId) {
  let date = new Date();
  urlDatabase[shortUrl].history.push([date, userId]);
};

/* --------------- INDEX PAGE -------------- */
app.get('/', (req, res) => {
  const { userId } = req.session;

  if(userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  const { userId } = req.session;
  let userUrls = [];

  let templateVars = {
    user: users[userId]
  };

  if(userId) {
    userUrls = urlsForUser(userId);   // If a user is logged in then collect their URLs to display
    templateVars.urls = userUrls;
  }

  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const { userId } = req.session;
  let { longUrl } = req.body;
  let shortUrl = generateRandomString();
  let date = new Date();

  if(!longUrl.startsWith('http://') && !longUrl.startsWith('https://')) {
    longUrl = 'http://' + longUrl;
  }

  urlDatabase[shortUrl] = { userId, shortUrl, longUrl, date, visits: 0, visitors: [], history: [] };

  res.redirect(303, '/urls');   // Redirect to the urls page after adding a new url (${shortUrl} previous redirect)
});

/* ---------------- REGISTER ------------------ */
app.get('/register', (req, res) => {
  let templateVars = { user: req.session.userId, failed: false};

  if(users[templateVars.user]) {
    res.redirect('/urls');      // If logged in then
  } else {
    if(req.session.registerFailed) {
      templateVars.failed = true;
      req.session = null;
    }
    res.render('urls_register', templateVars);
  }
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  let user = registerUser(email, password);

  if(user) {
    req.session.userId = user.id; // If generating a new user was successful then set that user's cookie to their id
    res.redirect('/urls');
  } else {
    req.session.registerFailed = true;
    res.redirect('/register');
  }
});

/* ---------------- NEW URLS -------------------- */
app.get('/urls/new', (req, res) => {
  if(req.session.userId) {
    let templateVars = {
      user: users[req.session.userId]
    };

    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

/* ------------- LOGIN AND LOGOUT --------------- */
app.get('/login', (req, res) => {
  let templateVars = {
    user: users[req.session.userId],
    failed: false
  };
  if(req.session.loginFailed) {
    templateVars.failed = true;
    req.session = null;
  }

  if(templateVars.user) {
    res.redirect('/urls');
  } else {
    res.render('urls_login', templateVars);
  }
});

app.put('/login', (req, res) => {
  const { email, password } = req.body;
  const user = findUser(email);

  if(user && bcrypt.compareSync(password, user.password)) {
    req.session.userId = user.id;
    res.redirect('/urls');
  } else {
    req.session.loginFailed = true;
    res.redirect('/login');
  }
});

app.put('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

/* ------------- REDIRECT TO LONGURL -------------- */
app.get('/u/:id', (req, res) => {
  const { id } = req.params;
  let { userId } = req.session;

  if (!urlDatabase[id]) {
    req.session.failed = true;

    res.redirect('/u');   // Redirect to a /u page displaying an error if the short URL is not in the database
  } else {
    if(!userId) {
      userId = generateRandomString();
      req.session.userId = userId;
    }

    if(uniqueVisitor(id, userId)) {
      urlDatabase[id].visitors.push(userId);
    }

    urlDatabase[id].visits += 1;
    addVisitData(id, userId);
    res.redirect(urlDatabase[id].longUrl);  // Redirect to the longurl if the short URL exists
  }
});

app.get('/u', (req, res) => {
  let templateVars = {
    user: users[req.session.userId],
    failed: false
  };
  if(req.session.failed) {
    templateVars.failed = true;
    req.session.failed = null;
  }

  res.render('urls_redirect', templateVars);   // Redirect to failed message, URL isn't in database
});

/* ----------------- SHORT URLS ------------------- */
app.put('/urls/:id', (req, res) => {
  const { id } = req.params;
  const { longUrl } = req.body;
  const { userId } = req.session;

  if(urlDatabase[id].userId === userId) {
    urlDatabase[id].longUrl = longUrl;
  }

  res.redirect('/urls');   // Redirect to the urls page regardless of whether they have permission or not
});

app.get('/urls/:id', (req, res) => {
  const { id } = req.params;
  let templateVars = {
    shortUrl: id,
    url: urlDatabase[id],
    user: users[req.session.userId]
  };

  res.render('urls_show', templateVars);
});

app.delete('/urls/:id/delete', (req, res) => {
  const { id } = req.params;
  if(urlDatabase[id].userId === req.session.userId) {
    delete urlDatabase[id];
  }
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});