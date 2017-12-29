/* eslint-disable no-param-reassign */
const test = require('tape');
const _ = require('lodash');
const webScraper = require('../../lib/index');

const url = 'http://localhost:8888';

test('Sessions', (nest) => {
  nest.test('name is required', (assert) => {
    const data = {
      url : `${url}/secure`,
      data: '.title_wrapper h1',
      auth: {
        url : `${url}/login`,
        form: {
          username: 'test',
          password: 'password',
        },
      },
    };

    webScraper(data, (err, json) => {
      const actualErr = err;
      const expectedErr = new Error('Please specify a `sessionId`. This makes it ' +
        'unnecessary to repeat the auth data when continueing with the same session.');
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

  nest.test('url is required', (assert) => {
    const data = {
      url : `${url}/secure`,
      data: '.title_wrapper h1',
      auth: {
        sessionId: 'session',
        form     : {
          username: 'test',
          password: 'password',
        },
      },
    };

    webScraper(data, (err, json) => {
      const actualErr = err;
      const expectedErr = new Error('Please specify the `auth.url`.');
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

  nest.test('authentication failure', (assert) => {
    const data = {
      url : `${url}/secure`,
      data: '.title_wrapper h1',
    };

    webScraper(data, (err, json) => {
      assert.ok(err, 'throws an error');
      assert.equal(err.error, 'Forbidden', 'is forbidden');

      const actual = json;
      const expectedJSON = undefined;
      assert.equal(actual, expectedJSON,
        "shouldn't return JSON data");
      assert.end();
    });
  });

  nest.test('login failure', (assert) => {
    const data = {
      url : `${url}/secure`,
      data: '.title_wrapper h1',
      auth: {
        sessionId: 'session',
        url      : `${url}/login`,
        form     : {
          username: 'username',
          password: 'password',
        },
      },
    };

    webScraper(data, (err, json) => {
      assert.ok(err, 'throws an error');
      assert.equal(err.error, 'Unauthorized', 'is unauthorized');

      const actual = json;
      const expectedJSON = undefined;
      assert.equal(actual, expectedJSON,
        "shouldn't return JSON data");
      assert.end();
    });
  });

  nest.test('authentication', (assert) => {
    const data = {
      url : `${url}/secure`,
      data: '.title_wrapper h1',
      auth: {
        sessionId: 'session1',
        url      : `${url}/login`,
        form     : {
          username: 'test',
          password: 'password',
        },
      },
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

  nest.test('authentication with redirect', (assert) => {
    const data = {
      url : `${url}/secure`,
      data: '.title_wrapper h1',
      auth: {
        sessionId: 'session2',
        url      : `${url}/login-redirect`,
        form     : {
          username: 'test',
          password: 'password',
        },
      },
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

  nest.test('re-authentication using name', (assert) => {
    const data = {
      url : `${url}/secure`,
      data: '.title_wrapper h1',
      auth: {
        sessionId: 'session3',
        url      : `${url}/login-redirect`,
        form     : {
          username: 'test',
          password: 'password',
        },
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err, "doesn't return an error");

      const actual = json;
      const expected = 'Captain America: Civil War (2016)';
      assert.equal(actual, expected,
        'returns the text of the element');

      const data2 = {
        url : `${url}/secure`,
        data: '.title_wrapper h1',
        auth: {
          sessionId: 'session3',
        },
      };
      webScraper(data2, (err2, json2) => {
        assert.ifErr(err2, "doesn't return an error");

        const actual2 = json2;
        const expected2 = 'Captain America: Civil War (2016)';
        assert.equal(actual2, expected2,
          'returns the text of the element');
        assert.end();
      });
    });
  });
});
