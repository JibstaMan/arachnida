const isFunction = require('lodash/isFunction');
const omit = require('lodash/omit');
const logger = require('./logger');
const scraper = require('./scraper');

function process(options, cb) {
  const opts = omit(options, ['config']);
  opts.logger = logger(options.config);

  if (!isFunction(cb)) {
    return scraper(opts);
  }

  scraper(opts)
    .then((json) => cb(null, json))
    .catch(cb);
}

module.exports = process;
