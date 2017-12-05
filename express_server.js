var express = require("express");
const bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.urlencoded({extended: true}));

var PORT = process.env.PORT || 8080; // default port 8080

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Generates a 6 character random string based on character set
function generateRandomString() {
  let legend = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let shortURL = '';

  while(shortURL.length < 6) {
    shortURL += legend.charAt(Math.floor(Math.random() * 62) + 1);
  }
  return shortURL;
}


app.set('view engine', 'ejs')

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase}
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  var shortUrl = generateRandomString();
  urlDatabase[shortUrl] = req.body.longURL;
  res.redirect(303, `/urls/${shortUrl}`);         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/u/:id", (req, res) => {
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    res.redirect(307, urlDatabase[req.params.id]);
  } else {
    res.redirect(307, '/urls/new');
  }
});

app.get("/urls/:id", (req, res) => {
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    let templateVars = { shortURL: req.params.id, urls: urlDatabase };
    res.render("urls_show", templateVars);
  } else {
    res.sendStatus(404).end();
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});