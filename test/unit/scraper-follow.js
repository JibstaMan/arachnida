/* eslint-disable no-param-reassign */
const test = require('tape');
const _ = require('lodash');
const webScraper = require('../../lib/index');

const url = 'http://localhost:8888';
const queryString = '?release_date=2000,2016&sort=year,asc&title=Iron%20Man&title_type=feature';

test('Scraper filter', (nest) => {
  nest.test('object follow', (assert) => {
    const data = {
      url : `${url}/search/title.html${queryString}`,
      data: {
        title  : '.lister-list .lister-item-header',
        _follow: {
          _elem   : '.lister-item-header > a',
          director: '[itemprop=director] [itemprop=name]',
        },
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = {
        title   : '1. David Knight: Iron Man of Enduro (2004)',
        director: 'Michael McKnight',
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
      assert.ifErr(err, "doesn't return an error");

      if (json && json.titles && _.isArray(json.titles)) {
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
          title: {
            // find the text value of the title for filter function
            _elem : '.lister-item-header > a',
            _value: 'text',
          },
          _filter(show) {
            return /^Iron Man($| )/.test(show.title);
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
      assert.ifErr(err, "doesn't return an error");

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
          _elem: '.lister-list .lister-item-content',
          title: {
            // find the text value of the title for filter function
            _elem : '{{title}}',
            _value: 'text',
          },
          _filter: '{{filter}}',
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
      assert.ifErr(err, "doesn't return an error");

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
});
