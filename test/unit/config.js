/* eslint-disable no-sync */

const test = require('tape');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const express = require('express');
const webScraper = require('../../lib/index');

const url = 'http://localhost:8888';
const cache = {};

let server = null;

function getData(filePath, data) {
  let html;
  if (cache[filePath]) {
    html = cache[filePath];
  }
  else {
    const htmlPath = path.resolve(__dirname, '../fixtures/', `${filePath}.html`);
    html = fs.readFileSync(htmlPath);
    cache[filePath] = html;
  }

  return Object.assign({
    url: `${url}/${path.dirname(filePath)}`,
    html,
  }, data);
}

function catchErr(assert) {
  return (err) => {
    assert.ifErr(err);
    assert.end();
  };
}

test('Config', (nest) => {
  nest.test('pre-fetched HTML', (assert) => {
    const data = getData('title/tt3498820/index', {
      data: {
        title: '.title_wrapper h1',
      },
    });

    webScraper(data)
      .then((json) => {
        const actual = json;
        const expected = {
          title: 'Captain America: Civil War (2016)',
        };
        assert.deepEqual(actual, expected);
        assert.end();
      })
      .catch(catchErr(assert));
  });

  nest.test('start test server', (assert) => {
    const app = express();

    app.use(express.static('test/fixtures'));

    server = app.listen(8888, () => assert.end());
  });

  nest.test('inline errors', (assert) => {
    const data = getData('search/title', {
      data: {
        titles: [{
          _elem : '.title > a',
          _value: 'text',
        }],
      },
      config: {
        testing: true,
      },
    });

    webScraper(data)
      .then((json) => {
        const actual = json;
        const err = new Error("Couldn't find '.title > a'");
        const expected = {
          titles: err.message,
        };
        assert.deepEqual(actual, expected);
        assert.end();
      })
      .catch(catchErr(assert));
  });

  nest.test('separate errors', (assert) => {
    const data = getData('search/title', {
      data: {
        titles: [{
          _elem : '.title > a',
          _value: 'text',
        }],
      },
      config: {
        separateErrors: true,
      },
    });

    webScraper(data)
      .then((json) => {
        const actual = json;
        const expected = {
          errors: {
            titles: new Error("Couldn't find '.title > a'"),
          },
          titles: [],
        };
        assert.deepEqual(actual, expected);
        assert.end();
      })
      .catch(catchErr(assert));
  });

  nest.test('separate errors > before follow', (assert) => {
    const data = getData('search/title', {
      data: {
        shows: [{
          _elem: '.title > a',
          _filter(show) {
            return /^Iron Man($| )/.test(show.title);
          },
          title: {
            // find the text value of the title for filter function
            _elem : '.lister-item-header > a',
            _value: 'text',
          },
          _follow: {
            // specify where to find the link to follow.
            _elem   : '.lister-item-header > a',
            // overwrite the previous title.
            title   : '.title_wrapper h1',
            // also select the director from the other page
            director: '[itemprop=director] [itemprop=name]',
          },
        }],
      },
      config: {
        separateErrors: true,
      },
    });

    webScraper(data)
      .then((json) => {
        const actual = json;
        const expected = {
          errors: {
            shows: new Error("Couldn't find '.title > a'"),
          },
          shows: [],
        };
        assert.deepEqual(actual, expected);
        assert.equal(actual.errors.shows.message, expected.errors.shows.message);
        assert.end();
      })
      .catch(catchErr(assert));
  });

  nest.test('separate errors > follow', (assert) => {
    const data = getData('search/title', {
      data: {
        shows: [{
          _elem  : '.lister-list .lister-item-header > a',
          _follow: {
            title   : '.title > h1',
            director: '[itemprop=dirlector] [itemprop=name]',
          },
        }],
      },
      config: {
        separateErrors: true,
      },
    });

    webScraper(data)
      .then((json) => {
        const actual = json;
        const expected = {
          errors: {
            shows: new Error("Couldn't find '.title > h1'"),
          },
          shows: [],
        };
        assert.deepEqual(actual, expected);
        assert.equal(actual.errors.shows.message, expected.errors.shows.message);
        assert.end();
      })
      .catch(catchErr(assert));
  });

  nest.test('separate errors > deep nested object', (assert) => {
    const data = getData('title/tt3498820/index', {
      data: {
        captain: {
          america: {
            civilWar: {
              title: '.title > h1',
            },
          },
        },
      },
      config: {
        separateErrors: true,
      },
    });

    webScraper(data)
      .then((json) => {
        const actual = json;
        const expected = {
          captain: {
            america: {
              // this might not be expected behavior
              errors: {
                civilWar: new Error("Couldn't find '.title > h1'"),
              },
              civilWar: {},
            },
          },
        };
        assert.deepEqual(actual, expected);
        const message = 'captain.america.errors.title.message';
        assert.equal(_.get(actual, message), _.get(expected, message));
        assert.end();
      })
      .catch(catchErr(assert));
  });

  nest.test('stop test server', (assert) => {
    server.close();
    assert.end();
  });
});
