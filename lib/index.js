const isFunction = require('lodash/isFunction');
const omit = require('lodash/omit');
const logger = require('./logger');
const normalize = require('./normalize');
const scraper = require('./scraper');

function process(options, cb) {
  const params = options.params || options.parameters || null;
  const opts = omit(options, ['config', 'params', 'parameters']);
  opts.logger = logger(options.config);

  if (params) {
    opts.data = normalize(opts.data, params);
  }

  if (!isFunction(cb)) {
    return scraper(opts);
  }

  scraper(opts)
    .then((json) => cb(null, json))
    .catch(cb);
}

module.exports = process;
