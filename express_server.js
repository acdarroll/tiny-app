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
};

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
  let conflict = null;
  for(let user in users) {
    if(users[user].email === email) {
      conflict = true;
    }
  }
  if(email === '' || password === '') {
    return false;
  } else if(conflict) {
    return false;
  } else {
    let id = generateRandomString();
    users[id] = { id, email, password: bcrypt.hashSync(password, saltRounds) };
    return users[id];
  }
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
  }

  if(userId) {
    userUrls = urlsForUser(userId);   // If a user is logged in then collect their URLs to display
    templateVars.urls = userUrls;
  }

  res.render("urls_index", templateVars);
});

app.post('/urls', (req, res) => {
  const { userId } = req.session;
  const { longUrl } = req.body;
  let shortUrl = generateRandomString();

  urlDatabase[shortUrl] = { userId, shortUrl, longUrl };

  res.redirect(303, '/urls');   // Redirect to the generated short url after a form submission /${shortUrl}`
});

/* ---------------- REGISTER ------------------ */
app.get('/register', (req, res) => {
  let templateVars = { user: req.session.userid, failed: false};

  if(templateVars.user) {
    res.redirect('/urls');      // If logged in then
  } else if(req.session.registerFailed) {
    templateVars.failed = true;
    req.session = null;
  }

  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  let user = registerUser(email, password);

  if(user) {      // If generating a new user was successful then add them
    let id = generateRandomString();
    users[id] = {
      id,
      email: user.email,
      password: user.password
    };

    req.session.userId = users[id].id;
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
    }

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
  }
  if(req.session.loginFailed) {
    templateVars.failed = true;
    req.session = null;
  }

  if(templateVars.user) {
    res.redirect('/urls');
  }

  res.render('urls_login', templateVars);
});

app.post('/login', (req, res) => {
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

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

/* ------------- REDIRECT TO LONGURL -------------- */
app.get('/u/:id', (req, res) => {
  const { id } = req.params;
  if (urlDatabase[id]) {
    res.redirect(307, urlDatabase[id].longUrl);  // Redirect to the longurl if the short URL exists
  } else {
    req.session.failed = true;

    res.redirect('/u');   // Redirect to a /u page displaying an error if the short URL is not in the database
  }
});

app.get('/u', (req, res) => {
  let templateVars = {
    user: users[req.session.userId],
    failed: false
  }
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

    res.redirect(`/urls/${id}`);   // Redirect to the updated short url after a form submission
  } else {
    res.redirect('/urls');   // If they do not have permission to edit the URL then redirect to URLS
  }

});

app.get('/urls/:id', (req, res) => {
  const { id } = req.params;
  let templateVars = {
    shortUrl: id,
    url: urlDatabase[id],
    user: users[req.session.userId]
  }

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