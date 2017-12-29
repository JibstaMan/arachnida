const test = require('tape');
const _ = require('lodash');
const webScraper = require('../../lib/index');

const url = 'http://localhost:8888';
const queryString = '?release_date=2000,2016&sort=year,asc&title=Iron%20Man&title_type=feature';

test('Scraper basics', (nest) => {
  nest.test('url is required', (assert) => {
    const data = {};

    webScraper(data, (err, json) => {
      const actualErr = err;
      const expectedErr = new Error('Please specify the `url`. Even when passing in HTML, ' +
        "it's still necessary to make relative paths absolute.");
      assert.equal(_.isError(actualErr), true,
        'should be an error');
      assert.equal(actualErr.message, expectedErr.message,
        'should have correct error message');

      const actual = json;
      const expectedJSON = undefined;
      assert.equal(actual, expectedJSON,
        "shouldn't return JSON data");
      assert.end();
    });
  });

  nest.test('default attribute > text', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: '.title_wrapper h1',
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = 'Captain America: Civil War (2016)';
      assert.equal(actual, expected,
        'returns the text of the element');
      assert.end();
    });
  });

  nest.test('default attribute > not found', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: '.gobbledygook',
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = '';
      assert.equal(actual, expected,
        'returns an empty string');
      assert.end();
    });
  });

  nest.test('default attribute > relative url', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: '.poster a',
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = `${url}/title/tt3498820/mediaviewer/rm3218348288?ref_=tt_ov_i`;
      assert.equal(actual, expected,
        'returns the absolute URL of the anchor');
      assert.end();
    });
  });

  nest.test('default attribute > absolute url', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: '.slate a',
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = `${url}/video/imdb/vi174044441?playlistId=tt3498820&ref_=tt_ov_vi`;
      assert.equal(actual, expected,
        "returns the URL of the anchor when it's already absolute.");
      assert.end();
    });
  });

  nest.test('default attribute > src', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: '.poster img',
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = 'https://images-na.ssl-images-amazon.com/images/M/MV5BMjQ0MTgyNjAxMV5BMl5BanBnXkFtZTgwNjUzMDkyODE@._V1_UX182_CR0,0,182,268_AL_.jpg';
      assert.equal(actual, expected,
        'returns the source attribute of the image');
      assert.end();
    });
  });

  nest.test('custom attribute > html', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: {
        _elem : '.title_wrapper h1',
        _value: 'html',
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = '<h1 itemprop="name" class="">Captain America: Civil War <span id="titleYear">(<a href="/year/2016/?ref_=tt_ov_inf">2016</a>)</span></h1>';
      assert.equal(actual, expected,
        'returns the entire HTML of the selected element');
      assert.end();
    });
  });

  nest.test('custom attribute > tag', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: {
        _elem : '.title_wrapper h1',
        _value: 'tag',
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = '<h1 itemprop="name" class=""></h1>';
      assert.equal(actual, expected,
        'returns the outer HTML of the selected element.');
      assert.end();
    });
  });

  nest.test('multiple attributes', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: {
        image: {
          _elem  : '.slate a',
          link   : 'href',
          video  : 'data-video',
          context: 'data-context',
          id     : 'data-tconst',
          ref    : 'data-refsuffix',
        },
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = {
        image: {
          link   : `${url}/video/imdb/vi174044441?playlistId=tt3498820&ref_=tt_ov_vi`,
          video  : 'vi174044441',
          context: 'imdb',
          id     : 'tt3498820',
          ref    : 'tt_ov_vi',
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
      assert.ifErr(err, "doesn't return an error");

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

  nest.test('list', (assert) => {
    const data = {
      url : `${url}/title/tt3498820/`,
      data: ['.cast_list span.itemprop'],
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = [
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
      ];
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('list nested', (assert) => {
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
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('list of objects', (assert) => {
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
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });
});
