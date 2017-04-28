const test = require('tape');
const normalize = require('../../lib/normalize');

test('Normalize', (nest) => {
  nest.test('string input', (assert) => {
    const data = '{{title}}';
    const params = {
      title: '.title_wrapper h1',
    };

    const actual = normalize(data, params);
    const expected = '.title_wrapper h1';
    assert.deepEqual(actual, expected);
    assert.end();
  });

  nest.test('object input', (assert) => {
    const data = {
      title: '{{title}}',
    };
    const params = {
      title: '.title_wrapper h1',
    };

    const actual = normalize(data, params);
    const expected = {
      title: '.title_wrapper h1',
    };
    assert.deepEqual(actual, expected);
    assert.end();
  });

  nest.test('array input', (assert) => {
    const data = {
      title: ['{{title}}'],
    };
    const params = {
      title: '.title_wrapper h1',
    };

    const actual = normalize(data, params);
    const expected = {
      title: ['.title_wrapper h1'],
    };
    assert.deepEqual(actual, expected);
    assert.end();
  });

  nest.test('object inside array input', (assert) => {
    const data = {
      shows: [{
        title: '{{title}}',
      }],
    };
    const params = {
      title: '.title_wrapper h1',
    };

    const actual = normalize(data, params);
    const expected = {
      shows: [{
        title: '.title_wrapper h1',
      }],
    };
    assert.deepEqual(actual, expected);
    assert.end();
  });

  nest.test('nested objects input', (assert) => {
    const data = {
      shows: {
        title: {
          _elem: '{{title}}',
        },
      },
    };
    const params = {
      title: '.title_wrapper h1',
    };

    const actual = normalize(data, params);
    const expected = {
      shows: {
        title: {
          _elem: '.title_wrapper h1',
        },
      },
    };
    assert.deepEqual(actual, expected);
    assert.end();
  });

  nest.test('multiple param string input', (assert) => {
    const data = '{{wrapper}} {{header}}';
    const params = {
      wrapper: '.title_wrapper',
      header : 'h1',
    };

    const actual = normalize(data, params);
    const expected = '.title_wrapper h1';
    assert.deepEqual(actual, expected);
    assert.end();
  });

  nest.test('nested params object', (assert) => {
    const data = {
      title: '{{shows.title}}',
    };
    const params = {
      shows: {
        title: '.title_wrapper h1',
      },
    };

    const actual = normalize(data, params);
    const expected = {
      title: '.title_wrapper h1',
    };
    assert.deepEqual(actual, expected);
    assert.end();
  });

  nest.test('complicated', (assert) => {
    const data = {
      shows: [{
        title: {
          _elem : '{{shows.title}}',
          _value: 'text',
        },
        _filter: '{{shows.filter}}',
      }],
      movie: {
        gameOfThrones: {
          title  : '{{movie.title}}',
          _filter: '{{movie.filter}}',
        },
      },
    };
    const params = {
      shows: {
        title : '.title_wrapper h1',
        filter: (json) => json.title === 'Game of Thrones',
      },
      movie: {
        title : '.title > h1',
        filter: /^Iron Man($| )/,
      },
    };

    const actual = normalize(data, params);
    const expected = {
      shows: [{
        title: {
          _elem : '.title_wrapper h1',
          _value: 'text',
        },
        _filter: params.shows.filter,
      }],
      movie: {
        gameOfThrones: {
          title  : '.title > h1',
          _filter: params.movie.filter,
        },
      },
    };
    assert.deepEqual(actual, expected);
    assert.end();
  });
});
