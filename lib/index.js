"use strict";

let scraper = require('./scraper');

function process(options, cb)
{
    scraper(options, function(err, json)
    {
        if (err)
        {
            return cb(err);
        }

        cb(null, json);
    });
}

module.exports = process;