const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');

let app = express();
app.use(bodyParser.urlencoded({extended: true}));

var PORT = process.env.PORT || 8080; // default port 8080

const users = {
  "h2h": {
    id: "h2h",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "brb": {
    id: "brb",
    email: "user2@example.com",
    password: "dishwasher-funk"
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


app.use(methodOverride('_method'));
app.use(cookieParser());
app.set('view engine', 'ejs');

/*  INDEX PAGE  */
app.get('/urls', (req, res) => {
  let userUrls = [];
  if(req.cookies['user_id']) {
    userUrls = urlsForUser(req.cookies['user_id']);
  }
  console.log(userUrls);
  let templateVars = {
    urls: userUrls,
    user: users[req.cookies['user_id']]
  }

  res.render("urls_index", templateVars);
});

app.post('/urls', (req, res) => {
  let shortUrl = generateRandomString();
  let userId = req.cookies['user_id'];

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
    user: users[req.cookies['user_id']]
  }
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  var userId = generateRandomString();
  for(var user in users) {
    if(users[user].email === req.body.email) {
      res.sendStatus(400);
    }
  }

  if(req.body.email && req.body.password) {
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: req.body.password
    }

    res.cookie('user_id', userId);
    res.redirect('/urls');
  } else {
    res.sendStatus(400);
  }
});

/*  NEW URLS  */
app.get('/urls/new', (req, res) => {
  if(req.cookies['user_id']) {
    let templateVars = {
      user: users[req.cookies['user_id']]
    }

    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login')
  }
});

/*  LOGIN AND LOGOUT  */
app.get('/login', (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']]
  }

  res.render('urls_login', templateVars);
});

app.post('/login', (req, res) => {
  for(var user in users) {
    if(users[user].email === req.body.email) {
      if(users[user].password === req.body.password) {
        res.cookie('user_id', users[user].id);
        res.redirect('/urls');
      } else {
        res.sendStatus(403).send("Wrong password");
      }
    }
  }
  res.sendStatus(403).send('User not found');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

/*  REDIRECT WEBSITE  */
app.get('/u/:id', (req, res) => {
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    res.redirect(307, urlDatabase[req.params.id].longUrl);  // Redirect to the longurl of the short url
  } else {
    res.redirect(307, '/urls/new');   // Redirect to the form submission if the short url does not exist
  }
});

/*  URL SHORT URLS  */
app.put('/urls/:id', (req, res) => {
  if(urlDatabase[req.params.id].userId === req.cookies['user_id']) {
    urlDatabase[req.params.id].longUrl = req.body.longURL;

  res.redirect(`/urls/${req.params.id}`);   // Redirect to the generated short url after a form submission
  } else {
    res.redirect('/urls');
  }

});

app.get('/urls/:id', (req, res) => {
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    let templateVars = {
      shortUrl: req.params.id,
      url: urlDatabase[req.params.id],
      user: users[req.cookies['user_id']]
    }

    console.log(templateVars);

    res.render('urls_show', templateVars);
  } else {
    res.sendStatus(404).end();    // Send a 404 response when the short url is not in the database
  }
});

app.delete('/urls/:id/delete', (req, res) => {
  if(urlDatabase[req.params.id].userId === req.cookies['user_id']) {
    delete urlDatabase[req.params.id];
  }
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});