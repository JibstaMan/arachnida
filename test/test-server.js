const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');

function checkAuth(req, res, next) {
  if (req.url === '/secure' && (!req.session || !req.session.authenticated)) {
    return res.sendStatus(403);
  }
  next();
}

module.exports = function testServer() {
  return new Promise((resolve) => {
    const app = express();

    app.use(cookieParser());
    app.use(cookieSession({ secret: 'INSECURE_COOKIE_TESTING_SECRET' }));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(checkAuth);
    app.use(express.static(path.join(__dirname, 'fixtures')));

    app.post('/login', (req, res) => {
      if (req.body.username === 'test' && req.body.password === 'password') {
        req.session.authenticated = true;
        return res.sendFile(path.join(__dirname, 'fixtures/title/tt3498820/index.html'));
      }
      return res.sendStatus(401);
    });

    app.post('/login-redirect', (req, res) => {
      if (req.body.username === 'test' && req.body.password === 'password') {
        req.session.authenticated = true;
        return res.redirect('/secure');
      }
      return res.sendStatus(401);
    });


    app.get('/secure', (req, res) => {
      res.sendFile(path.join(__dirname, 'fixtures/title/tt3498820/index.html'));
    });

    const server = app.listen(8888, () => {
      resolve(server);
    });
  });
};
