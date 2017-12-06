const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');

let app = express();
app.use(bodyParser.urlencoded({extended: true}));

var PORT = process.env.PORT || 8080; // default port 8080

let urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

// Generates a 6 character random string based on character set
var generateRandomString = function() {
  let legend = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shortURL = '';

  while(shortURL.length < 6) {
    shortURL += legend.charAt(Math.floor(Math.random() * 62) + 1);
  }
  return shortURL;
}

app.use(methodOverride('_method'));
app.use(cookieParser());
app.set('view engine', 'ejs');

app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
  }

  res.render("urls_index", templateVars);
});

app.post('/urls', (req, res) => {
  var shortUrl = generateRandomString();
  urlDatabase[shortUrl] = req.body.longURL;

  res.redirect(303, `/urls/${shortUrl}`);   // Redirect to the generated short url after a form submission
});

app.delete('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.get('/urls/new', (req, res) => {
  let templateVars = {
    username: req.cookies['username']
  }

  res.render('urls_new', templateVars);
});

app.get('/u/:id', (req, res) => {
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    res.redirect(307, urlDatabase[req.params.id]);  // Redirect to the longurl of the short url
  } else {
    res.redirect(307, '/urls/new');   // Redirect to the form submission if the short url does not exist
  }
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.put('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;

  res.redirect(`/urls/${req.params.id}`);   // Redirect to the generated short url after a form submission
});

app.get('/urls/:id', (req, res) => {
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    let templateVars = {
      shortURL: req.params.id,
      urls: urlDatabase,
      username: req.cookies['username']
    }

    res.render('urls_show', templateVars);
  } else {
    res.sendStatus(404).end();    // Send a 404 response when the short url is not in the database
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});