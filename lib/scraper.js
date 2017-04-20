'use strict';

const url = require('url'),
    request = require('request-promise'),
    cheerio = require('cheerio');

const _ = {};
[
    'isString', 'isArray', 'isObject', 'isFunction', 'isMatch', 'isError',
    'each', 'omit', 'omitBy', 'compact', 'clone',
].forEach((module) => {
    _[module] = require(`lodash/${module}`);
});

const paramRegex = /{{(.*?)}}/;

const webScraper = {

    scrape(options) {
        this.params = options.params || options.parameters || {};
        this.config = options.config || {};
        this.config.allowErrors = this.config.separateErrors === true || this.config.testing === true || false;

        if (!options.url) {
            throw new Error("Please specify the url. Even when passing in HTML, it's still necessary to make relative paths absolute.");
        }
        this.getDomain(options.url);

        if (options.html) {
            this.loadHTML(options.html);
            return this.parseData(options.data);
        }

        return request(options.url)
            .then((html) => this.loadHTML(html))
            .then(() => this.parseData(options.data));
    },

    /**
     * Retrieve the host and domain of the website being scraped.
     * These will be used to make relative URLs absolute.
     */
    getDomain(URL) {
        const parsed = url.parse(URL);
        this.host = parsed.host;
        this.domain = `${parsed.protocol}//${parsed.host}`;
    },

    loadHTML(html) {
        this.$ = cheerio.load(html, {
            normalizeWhitespace: true,
        });
    },

    log(...params) {
        if (_.isFunction(this.config.logger)) {
            this.config.logger(...params);
        }
        if (this.config.enableLogging) {
            console.warn(...params);
        }
    },

    getParam(val) {
        // TODO allow multiple parameters in a single string?
        if (_.isString(val) && paramRegex.test(val))
        {
            const paramKey = RegExp.$1;
            return this.params[paramKey];
        }
        return val;
    },

    setProperty(json, key, modifier) {
        return (val) => {
            if (this.config.separateErrors && _.isError(val)) {
                if (!json.errors) {
                    json.errors = {};
                }
                json.errors[key] = val;
            }

            if (_.isFunction(modifier)) {
                json[key] = modifier(val);
            }
            else if (this.config.separateErrors && modifier) {
                json[key] = modifier;
            }
            else if (this.config.testing && _.isError(val)) {
                json[key] = val.message;
            }
            else {
                json[key] = val;
            }
        }
    },

    parseData(inputData, contextElement) {
        const data = this.normalize(inputData);

        if (_.isString(data)) {
            const elem = contextElement || this.getElement(data);
            return Promise.resolve(this.getElementValue(elem));
        }

        // don't individually loop over properties when any _
        // properties are present.
        if (data._elem || data._value || data._follow || data._filter)
        {
            let elem = contextElement || this.getElement(data);
            return Promise.resolve(this.getObjectValue(data, elem));
        }

        const json = {},
            keys = Object.keys(data);

        return Promise.all(keys.map((key) => {
            const item = this.normalize(data[key]);

            if (_.isArray(item)) {
                return this.getArrayValue(item[0])
                    .then(this.setProperty(json, key, _.compact))
                    .catch(this.setProperty(json, key, []));
            }

            if (_.isObject(item)) {
                const elem = (item._elem)
                    ? this.getElement(item, contextElement)
                    : undefined;

                return this.parseData(item, elem)
                    .then(this.setProperty(json, key))
                    .catch(this.setProperty(json, key, {}));
            }

            const elem = this.getElement(item, contextElement);
            json[key] = this.getElementValue(elem);
            return Promise.resolve();
        })).then(() => json);
    },

    normalize(data) {
        if (_.isString(data)) {
            return this.getParam(data);
        }

        if (_.isArray(data)) {
            return data.map(this.getParam);
        }

        if (_.isObject(data)) {
            const newData = _.clone(data);
            _.each(newData, (val, key) => {
                newData[key] = this.getParam(val);
            });
            return newData;
        }

        return data;
    },

    getElement(data, contextElement) {
        let selector = (_.isObject(data)) ? data._elem : data;

        if (!selector) {
            throw new Error("An object was specified without an `_elem`, which is required.");
        }

        let errMsg = `Couldn't find '${selector}'`;

        let $elem = null;
        if (contextElement) {
            $elem = contextElement.find(selector);

            if (!$elem || !$elem.length) {
                errMsg = `${errMsg} in ${contextElement.selector}`;
                this.log(errMsg);
                if (this.config.allowErrors) {
                    return new Error(errMsg);
                }
            }
        }

        if (!$elem) {
            $elem = this.$(selector);

            if (!$elem || !$elem.length) {
                this.log(errMsg);
                if (this.config.allowErrors) {
                    return new Error(errMsg);
                }
            }
        }

        return $elem;
    },

    getArrayValue(data) {
        data = this.normalize(data);
        const selection = this.getElement(data);
        if (_.isError(selection)) {
            return Promise.reject(selection);
        }

        const elements = selection.toArray();

        delete data._elem;
        return Promise.all(elements.map((elem) => {
            return this.parseData(data, this.$(elem));
        }));
    },

    getObjectValue(data, contextElement) {
        if (!data._elem && !contextElement) {
            // no selector, so this is a nested object.
            return this.parseData(data);
        }

        contextElement = contextElement || this.getElement(data);
        if (_.isError(contextElement)) {
            return Promise.reject(contextElement.message);
        }

        if (data._value) {
            // don't nest the value.
            return this.getElementValue(contextElement, data._value);
        }

        const follow = this.normalize(data._follow),
            filter = data._filter;

        data = _.omitBy(data, (value, key) => key.substr(0, 1) === '_');

        if (!filter && !follow) {
            const json = {};

            _.each(data, (prop, key) => {
                json[key] = this.getElementValue(contextElement, prop);
            });
            return json;
        }

        const hasKeys = Object.keys(data).length > 0;
        if (!hasKeys && follow) {
            // NOTE currently, this makes it impossible to filter
            // an object with only a _follow property.
            // TODO re-add the _filter property to item in order to filter the _follow result?
            return this.follow(follow, contextElement);
        }

        return this.parseData(data, contextElement)
            .then((data) => {
                if (filter && !this.filter(data, filter)) {
                    return null;
                }

                if (!follow) {
                    return data;
                }

                return this.follow(follow, contextElement, data);
            });
    },

    getElementValue(elem, prop) {
        if (!prop) {
            prop = 'text';
            if (elem.is('a,link')) {
                prop = 'href';
            }
            else if (elem.is('img')) {
                prop = 'src';
            }
        }

        switch (prop)
        {
            case 'text':
                return elem.text().trim();
            case 'href':
                return this.getURL(elem);
            case 'html':
                return elem.html();
            case 'toString':
                return elem.empty().html();
            default:
                return elem.attr(prop);
        }
    },

    getURL(elem) {
        let href = elem.attr('href');
        if (this.domain && href.indexOf(this.host) === -1)
        {
            return url.resolve(this.domain, href);
        }
        return href;
    },

    follow(follow, contextElement, json = {}) {
        const href = (follow._elem)
            ? this.getElementValue(this.getElement(follow, contextElement))
            : this.getElementValue(contextElement);

        const opts = {
            url: href,
            data: (follow._elem) ? _.omit(follow, ['_elem']) : follow,
            params: this.params,
            config: this.config,
        };

        return scrape(opts)
            .then((data) => {
                if (_.isObject(data)) {
                    return Object.assign(json, data);
                }

                return data;
            });
    },

    filter(object, filter) {
        if (_.isFunction(filter))
        {
            return filter(object);
        }
        if (_.isObject(filter))
        {
            return _.isMatch(object, filter);
        }
        return false;
    }
};

function scrape(options) {
    const scraper = Object.create(webScraper);
    return scraper.scrape(options);
}

module.exports = scrape;