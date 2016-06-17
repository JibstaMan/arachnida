'use strict';

const _ = require('lodash'),
    url = require('url'),
    async = require('async'),
    request = require('request'),
    cheerio = require('cheerio');

const paramRegex = /{{(.*)}}/;

function isElement(elem)
{
    return (elem instanceof cheerio);
}

function setProperty(json, key, callback)
{
    return function(err, val)
    {
        if (err)
        {
            return callback(err);
        }

        json[key] = val;
        callback();
    }
}

function Scraper(options, cb)
{
    this.request(options, function(err, html)
    {
        this.getDomain(options);

        this.$ = cheerio.load(html, {
            normalizeWhitespace: true
        });

        this.params = options.params || options.parameters || {};
        this.parseData(options.data, cb);
    }.bind(this));
}

Scraper.prototype.request = function(options, cb)
{
    request(options.url, function(err, resp, body)
    {
        if (err)
        {
            return cb(err);
        }

        if (resp.statusCode !== 200)
        {
            return cb(resp.statusCode);
        }

        cb(null, body);
    });
};

Scraper.prototype.getDomain = function(options)
{
    const parsed = url.parse(options.url);
    this.host = parsed.host;
    this.domain = parsed.protocol + '//' + parsed.host;
};

Scraper.prototype.normalize = function(item)
{
    if (!item || _.isString(item) || _.isArray(item)) return item;
    
    const keys = _.keys(item);
    const values = _.map(keys, function(key)
    {
        const val = item[key];
        if (_.isString(val) && paramRegex.test(val))
        {
            var paramKey = RegExp.$1;
            return this.params[paramKey];
        }
        return val;
    }.bind(this));
    return _.zipObject(keys, values);
};

Scraper.prototype.parseData = function(data, element, cb)
{
    // elem is specified when parsing an array.
    if (_.isFunction(element))
    {
        cb = element;
        element = null;
    }

    if (_.isString(data))
    {
        let elem = element || this.getElement(data);
        return cb(null, this.getElementValue(elem));
    }

    // normalize the data. This also means we can mutate the data
    // without modifying the original.
    data = this.normalize(data);
    
    // don't individually loop over properties when any _
    // properties are present.
    if (data._elem || data._value || data._follow || data._filter)
    {
        let elem = element || this.getElement(data);
        return this.getObjectValue(data, elem, cb);
    }

    let json = {},
        keys = _.keys(data);
    async.each(keys, function (key, callback)
    {
        let item = this.normalize(data[key]);

        if (_.isArray(item))
        {
            this.getArrayValue(item[0], function (err, val)
            {
                if (err)
                {
                    return callback(err);
                }

                val = _.compact(val);

                json[key] = val;
                callback();
            });
        }
        else if (_.isObject(item))
        {
            if (!item._elem)
            {
                return this.parseData(item, setProperty(json, key, callback))
            }

            let elem = this.getElement(item, element);
            this.getObjectValue(item, elem, setProperty(json, key, callback));
        }
        else
        {
            let elem = this.getElement(item, element);
            json[key] = this.getElementValue(elem);
            callback();
        }
    }.bind(this), function ()
    {
        return cb(null, json);
    });
};

Scraper.prototype.getElement = function(item, elem)
{
    if (_.isObject(item))
    {
        if (!item._elem)
        {
            throw new Error("An object was specified without an `_elem`, which is required.");
        }

        if (elem)
        {
            return elem.find(item._elem);
        }

        return this.$(item._elem);
    }

    if (elem)
    {
        return elem.find(item);
    }
    return this.$(item);
};

Scraper.prototype.getArrayValue = function(object, cb)
{
    let item = this.normalize(object);
    const elements = this.getElement(item).toArray();

    // by deleting the _elem, the item passed to `parseData`
    // will be a "nested object".
    delete item._elem;
    return async.map(elements, function(elem, callback)
    {
        this.parseData(item, this.$(elem), callback);
    }.bind(this), cb);
};

Scraper.prototype.getObjectValue = function(item, elem, cb)
{
    if (!item._elem && !elem)
    {
        // no selector, so this is a nested object.
        return this.parseData(item, cb);
    }

    elem = elem || this.getElement(item);

    if (item._value)
    {
        // don't nest the value
        return cb(null, this.getValue(elem, item._value));
    }

    let follow = this.normalize(item._follow),
        filter = item._filter;

    delete item._elem;
    delete item._follow;
    delete item._filter;

    if (!filter && !follow)
    {
        let json = {};

        // loop over the properties and retrieve the values.
        _.each(item, function(prop, key)
        {
            json[key] = this.getValue(elem, prop);
        }.bind(this));
        return cb(null, json);
    }

    let hasKeys = _.keys(item).length > 0;
    if (!hasKeys && follow)
    {
        // NOTE currently, this makes it impossible to filter
        // an object with only a _follow property.
        // TODO re-add the _filter property to item in order to filter the _follow result?
        return this.follow(item, elem, follow, cb);
    }

    this.parseData(item, elem, function(err, data)
    {
        if (err)
        {
            return cb(err);
        }

        if (filter && !this.filter(data, filter))
        {
            return cb();
        }
        
        if (!follow)
        {
            return cb(null, data);
        }

        return this.follow(item, elem, follow, data, cb);
    }.bind(this));
};

Scraper.prototype.getElementValue = function(elem)
{
    if (elem.is('a,link'))
    {
        return this.getValue(elem, 'href');
    }

    if (elem.is('img'))
    {
        return elem.attr('src');
    }

    return this.getValue(elem, 'text');
};

Scraper.prototype.getValue = function(elem, prop)
{
    switch (prop)
    {
        case 'text':
            return elem.text().trim();
        case 'href':
            return this.getURL(elem);
        default:
            return elem.attr(prop);
    }
};

Scraper.prototype.getURL = function(elem)
{
    let href = elem.attr('href');
    if (this.domain && href.indexOf(this.host) === -1)
    {
        return url.resolve(this.domain, href);
    }
    return href;
};

Scraper.prototype.follow = function(item, elem, follow, json, cb)
{
    if (_.isFunction(json))
    {
        cb = json;
        json = {};
    }

    // follow the link and scrape the other page.
    let href = (follow._elem)
        ? this.getElementValue(this.getElement(follow, elem))
        : this.getElementValue(elem);

    let opts = {
        url: href,
        data: (follow._elem)
            ? _.omit(follow, ['_elem'])
            : follow,
        params: this.params
    };

    return new Scraper(opts, function(err, data)
    {
        if (err)
        {
            return cb(err);
        }

        if (_.isObject(data))
        {
            return cb(null, _.extend(json, data));
        }

        cb(null, data);
    });
};

Scraper.prototype.filter = function(object, filter)
{
    if (_.isFunction(filter))
    {
        return filter(object);
    }
    if (_.isObject(filter))
    {
        return _.isMatch(object, filter);
    }
    return false;
};

function scrape(options, cb)
{
    new Scraper(options, cb);
}

module.exports = scrape;