/* eslint-disable no-param-reassign */
const test = require('tape');
const _ = require('lodash');
const express = require('express');
const webScraper = require('../../lib/index');

const url = 'http://localhost:8888';
const queryString = '?release_date=2000,2016&sort=year,asc&title=Iron%20Man&title_type=feature';
let server = null;

test('Scraper', (nest) => {
  nest.test('start test server', (assert) => {
    const app = express();

    app.use(express.static('test/fixtures'));

    server = app.listen(8888, () => assert.end());
  });

  nest.test('text attribute', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: {
        title    : '.title_wrapper h1',
        jibberish: '.gobbledygook',
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        title    : 'Captain America: Civil War (2016)',
        jibberish: '',
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('url attribute', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: {
        poster: '.poster a',
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        poster: `${url}/title/tt3498820/mediaviewer/rm3218348288?ref_=tt_ov_i`,
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('string', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: '.title_wrapper h1',
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = 'Captain America: Civil War (2016)';
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('object', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: {
        image: {
          _elem: '.poster a',
          link : 'href',
        },
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        image: {
          link: `${url}/title/tt3498820/mediaviewer/rm3218348288?ref_=tt_ov_i`,
        },
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('nested object', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: {
        show: {
          title      : '.title_wrapper h1',
          link       : '.poster a',
          description: '.summary_text',
        },
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        show: {
          title      : 'Captain America: Civil War (2016)',
          link       : `${url}/title/tt3498820/mediaviewer/rm3218348288?ref_=tt_ov_i`,
          description: "Political interference in the Avengers' activities causes a rift " +
            'between former allies Captain America and Iron Man.',
        },
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('array', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: {
        cast: ['.cast_list span.itemprop'],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        cast: [
          'Chris Evans',
          'Robert Downey Jr.',
          'Scarlett Johansson',
          'Sebastian Stan',
          'Anthony Mackie',
          'Don Cheadle',
          'Jeremy Renner',
          'Chadwick Boseman',
          'Paul Bettany',
          'Elizabeth Olsen',
          'Paul Rudd',
          'Emily VanCamp',
          'Tom Holland',
          'Daniel Brühl',
          'Frank Grillo',
        ],
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('array object', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        titles: [{
          _elem : '.lister-item-header > a',
          _value: 'text',
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

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
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('array objects', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        shows: [{
          _elem: '.lister-list .lister-item-content',
          title: {
            _elem : '.lister-item-header > a',
            _value: 'text',
          },
          year: '.lister-item-header .lister-item-year',
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

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
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('array follow', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        titles: [{
          _elem  : '.lister-list .lister-item-header > a',
          _follow: '.title_wrapper h1',
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      if (json && json.titles) {
        json.titles.sort();
      }
      const actual = json;
      const expected = {
        titles: [
          'Adam Ahani (2012)',
          'David Knight: Iron Man of Enduro (2004)',
          'Iron Man (2008)',
          'Iron Man 2 (2010)',
          'Iron Man Three (2013)',
          'The Iron Man (2006)',
          'The Man with the Iron Fists (2012)',
        ],
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('array filter', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        shows: [{
          _elem: '.lister-list .lister-item-content',
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
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      if (json && json.shows) {
        json.shows = _.sortBy(json.shows, 'title');
      }
      const actual = json;
      const expected = {
        shows: [
          {
            title   : 'Iron Man (2008)',
            director: 'Jon Favreau',
          },
          {
            title   : 'Iron Man 2 (2010)',
            director: 'Jon Favreau',
          },
          {
            title   : 'Iron Man Three (2013)',
            director: 'Shane Black',
          },
        ],
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('params', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        shows: [{
          _elem  : '.lister-list .lister-item-content',
          _filter: '{{filter}}',
          title  : {
            // find the text value of the title for filter function
            _elem : '{{title}}',
            _value: 'text',
          },
          _follow: {
            // specify where to find the link to follow.
            _elem   : '{{title}}',
            // overwrite the previous title.
            title   : '.title_wrapper h1',
            // also select the director from the other page
            director: '[itemprop=director] [itemprop=name]',
          },
        }],
      },
      params: {
        filter(show) {
          return /^Iron Man($| )/.test(show.title);
        },
        title: '.lister-item-header > a',
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        shows: [
          {
            title   : 'Iron Man (2008)',
            director: 'Jon Favreau',
          },
          {
            title   : 'Iron Man 2 (2010)',
            director: 'Jon Favreau',
          },
          {
            title   : 'Iron Man Three (2013)',
            director: 'Shane Black',
          },
        ],
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('stop test server', (assert) => {
    server.close();
    assert.end();
  });
});
