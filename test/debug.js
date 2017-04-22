/* eslint-disable no-console */

const webScraper = require('../lib/index');
const express = require('express');

const app = express();
const url = 'http://localhost:8888';

app.use(express.static('test/fixtures'));

const server = app.listen(8888, () => {
  const data = {
    url : `${url}/search/title.html`,
    data: {
      titles: [{
        _elem  : '.lister-list .lister-item-header > a',
        _follow: '.title_wrapper h1',
      }],
    },
  };

  webScraper(data, (err, json) => {
    if (err) {
      return console.error(err);
    }

    console.log(JSON.stringify(json, null, 2));
    server.close();
  });
});
