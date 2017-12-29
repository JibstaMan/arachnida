const request = require('request-promise');
const omit = require('lodash/omit');

const jars = {};

function auth(options) {
  if (!options) {
    return Promise.resolve();
  }

  const sessionId = options.sessionId;
  if (!sessionId) {
    return Promise.reject(new Error('Please specify a `sessionId`. This makes it ' +
      'unnecessary to repeat the auth data when continueing with the same session.'));
  }

  if (jars[sessionId]) {
    return Promise.resolve(jars[sessionId]);
  }

  if (!options.url) {
    return Promise.reject(new Error('Please specify the `auth.url`.'));
  }

  const jar = request.jar();
  jars[sessionId] = jar;
  const opts = Object.assign({
    method: 'POST',
    jar,
  }, omit(options, 'sessionId'));
  return request(opts)
    .then(() => jar)
    .catch((err) => {
      if (err.statusCode >= 300 && err.statusCode < 400) {
        return Promise.resolve(jar);
      }
      delete jars[sessionId];
      return Promise.reject(err);
    });
}

module.exports = auth;
