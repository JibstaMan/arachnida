const path = require('path');
const express = require('express');

module.exports = function staticServer() {
  return new Promise((resolve) => {
    const app = express();

    app.use(express.static(path.join(__dirname, 'fixtures')));

    app.listen(8888, resolve);
  });
};
