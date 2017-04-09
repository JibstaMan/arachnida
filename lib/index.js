"use strict";

const isFunction = require('lodash/isFunction');
const scraper = require('./scraper');

function process(options, cb)
{
    if (!isFunction(cb)) {
        return scraper(options);
    }

    scraper(options)
        .then((json) => cb(null, json))
        .catch(cb);
}

module.exports = process;