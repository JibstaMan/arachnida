/* eslint-disable no-param-reassign */
const test = require('tape');
const _ = require('lodash');
const webScraper = require('../../lib/index');

const url = 'http://localhost:8888';
const queryString = '?release_date=2000,2016&sort=year,asc&title=Iron%20Man&title_type=feature';

test('Scraper filter', (nest) => {
  nest.test('filter > string', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        titles: [{
          _elem  : '.lister-item-header > a',
          _value : 'text',
          _filter: 'Iron Man',
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = {
        titles: [
          'David Knight: Iron Man of Enduro',
          'The Iron Man',
          'Iron Man',
          'Iron Man 2',
          'Iron Man Three',
        ],
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('filter > RegExp', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        titles: [{
          _elem  : '.lister-item-header > a',
          _value : 'text',
          _filter: /^Iron Man/,
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = {
        titles: [
          'Iron Man',
          'Iron Man 2',
          'Iron Man Three',
        ],
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('filter > _.match', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        shows: [{
          _elem: '.lister-list .lister-item-content',
          title: {
            _elem : '.lister-item-header > a',
            _value: 'text',
          },
          year   : '.lister-item-header .lister-item-year',
          _filter: {
            year: '(2012)',
          },
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = {
        shows: [
          {
            title: 'The Man with the Iron Fists',
            year : '(2012)',
          },
          {
            title: 'Adam Ahani',
            year : '(2012)',
          },
        ],
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('filter > function', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        shows: [{
          _elem: '.lister-list .lister-item-content',
          title: {
            _elem : '.lister-item-header > a',
            _value: 'text',
          },
          year   : '.lister-item-header .lister-item-year',
          _filter: (show) => /^Iron Man/.test(show.title),
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = {
        shows: [
          {
            title: 'Iron Man',
            year : '(2008)',
          },
          {
            title: 'Iron Man 2',
            year : '(2010)',
          },
          {
            title: 'Iron Man Three',
            year : '(2013)',
          },
        ],
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('filter > number (invalid)', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        titles: [{
          _elem  : '.lister-item-header > a',
          _value : 'text',
          _filter: 10,
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = {
        titles: [
          'David Knight: Iron Man of Enduro',
          'The Iron Man',
          'Iron Man',
          'Iron Man 2',
          'The Man with the Iron Fists',
          'Adam Ahani',
          'Iron Man Three',
        ],
      };
      assert.deepEqual(actual, expected,
        "doesn't filter anything.");
      assert.end();
    });
  });

  nest.test('filter > filter strings with an object', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        titles: [{
          _elem  : '.lister-item-header > a',
          _value : 'text',
          _filter: {
            year: '(2012)',
          },
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = {
        titles: [
          'David Knight: Iron Man of Enduro',
          'The Iron Man',
          'Iron Man',
          'Iron Man 2',
          'The Man with the Iron Fists',
          'Adam Ahani',
          'Iron Man Three',
        ],
      };
      assert.deepEqual(actual, expected,
        "doesn't filter anything.");
      assert.end();
    });
  });

  nest.test('filter > filter objects with a string', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        shows: [{
          _elem: '.lister-list .lister-item-content',
          title: {
            _elem : '.lister-item-header > a',
            _value: 'text',
          },
          year   : '.lister-item-header .lister-item-year',
          _filter: 'Iron Man',
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = {
        shows: [
          {
            title: 'David Knight: Iron Man of Enduro',
            year : '(2004)',
          },
          {
            title: 'The Iron Man',
            year : '(2006)',
          },
          {
            title: 'Iron Man',
            year : '(2008)',
          },
          {
            title: 'Iron Man 2',
            year : '(2010)',
          },
          {
            title: 'The Man with the Iron Fists',
            year : '(2012)',
          },
          {
            title: 'Adam Ahani',
            year : '(2012)',
          },
          {
            title: 'Iron Man Three',
            year : '(2013)',
          },
        ],
      };
      assert.deepEqual(actual, expected,
        "doesn't filter anything.");
      assert.end();
    });
  });

  nest.test('filter > filter objects with a RegExp', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        shows: [{
          _elem: '.lister-list .lister-item-content',
          title: {
            _elem : '.lister-item-header > a',
            _value: 'text',
          },
          year   : '.lister-item-header .lister-item-year',
          _filter: /^Iron Man/,
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = {
        shows: [
          {
            title: 'David Knight: Iron Man of Enduro',
            year : '(2004)',
          },
          {
            title: 'The Iron Man',
            year : '(2006)',
          },
          {
            title: 'Iron Man',
            year : '(2008)',
          },
          {
            title: 'Iron Man 2',
            year : '(2010)',
          },
          {
            title: 'The Man with the Iron Fists',
            year : '(2012)',
          },
          {
            title: 'Adam Ahani',
            year : '(2012)',
          },
          {
            title: 'Iron Man Three',
            year : '(2013)',
          },
        ],
      };
      assert.deepEqual(actual, expected,
        "doesn't filter anything.");
      assert.end();
    });
  });

  nest.test('object filter', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: {
        captainAmerica: {
          title      : '.title_wrapper h1',
          link       : '.poster a',
          description: '.summary_text',
          _filter    : (json) => json.title === 'Captain America: Civil War (2016)',
        },
        ironMan: {
          title      : '.title_wrapper h1',
          link       : '.poster a',
          description: '.summary_text',
          _filter    : (json) => json.title === 'Iron Man (2008)',
        },
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = {
        captainAmerica: {
          title      : 'Captain America: Civil War (2016)',
          link       : `${url}/title/tt3498820/mediaviewer/rm3218348288?ref_=tt_ov_i`,
          description: "Political interference in the Avengers' activities causes a rift " +
          'between former allies Captain America and Iron Man.',
        },
        ironMan: null,
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });
});
