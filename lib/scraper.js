const url = require('url');
const request = require('request-promise');
const cheerio = require('cheerio');

const _ = {};
[
  'isString', 'isArray', 'isObject', 'isFunction', 'isMatch', 'isError',
  'each', 'omit', 'omitBy', 'compact', 'clone',
].forEach((module) => {
  // eslint-disable-next-line global-require,import/no-dynamic-require
  _[module] = require(`lodash/${module}`);
});

const paramRegex = /{{(.*?)}}/;

const webScraper = {

  scrape(options) {
    this.params = options.params || options.parameters || {};
    this.logger = options.logger;

    if (!options.url) {
      throw new Error('Please specify the url. Even when passing in HTML, ' +
        "it's still necessary to make relative paths absolute.");
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

  getParam(val) {
    if (_.isString(val) && paramRegex.test(val)) {
      const paramKey = RegExp.$1;
      return this.params[paramKey];
    }
    return val;
  },

  parseData(inputData, contextElement) {
    const data = this.normalize(inputData);

    if (_.isString(data)) {
      const elem = contextElement || this.getElement(data);
      return Promise.resolve(this.getElementValue(elem));
    }

    // don't individually loop over properties when any _
    // properties are present.
    if (data._elem || data._value || data._follow || data._filter) {
      const elem = contextElement || this.getElement(data);
      return Promise.resolve(this.getObjectValue(data, elem));
    }

    const json = {};
    const keys = Object.keys(data);

    return Promise.all(keys.map((key) => {
      const item = this.normalize(data[key]);

      if (_.isArray(item)) {
        return this.getArrayValue(item[0])
          .then((val) => {
            json[key] = _.compact(val);
          })
          .catch(this.logger.setProperty(json, key, []));
      }

      if (_.isObject(item)) {
        const elem = (item._elem)
          ? this.getElement(item, contextElement)
          : null;

        return this.parseData(item, elem)
          .then((val) => {
            json[key] = val;
          })
          .catch(this.logger.setProperty(json, key, {}));
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
    const selector = (_.isObject(data)) ? data._elem : data;

    if (!selector) {
      throw new Error('An object was specified without an `_elem`, which is required.');
    }

    let $elem;
    let errMsg = `Couldn't find '${selector}'`;

    if (contextElement) {
      $elem = contextElement.find(selector);
      errMsg = `${errMsg} in ${contextElement.selector}`;
    }
    else {
      $elem = this.$(selector);
    }

    const err = this.logger.checkIsElement($elem, errMsg);
    if (err) {
      return err;
    }

    return $elem;
  },

  getArrayValue(inputData) {
    const data = this.normalize(inputData);
    const selection = this.getElement(data);
    if (_.isError(selection)) {
      return Promise.reject(selection);
    }

    const elements = selection.toArray();

    delete data._elem;
    return Promise.all(elements.map((elem) => this.parseData(data, this.$(elem))));
  },

  getObjectValue(data, contextElement) {
    if (!data._elem && !contextElement) {
      // no selector, so this is a nested object.
      return this.parseData(data);
    }

    const ctxElement = contextElement || this.getElement(data);
    if (_.isError(ctxElement)) {
      return Promise.reject(ctxElement.message);
    }

    if (data._value) {
      // don't nest the value.
      return this.getElementValue(ctxElement, data._value);
    }

    const follow = this.normalize(data._follow);
    const filter = data._filter;

    const filteredData = _.omitBy(data, (value, key) => key.substr(0, 1) === '_');

    if (!filter && !follow) {
      const json = {};

      _.each(filteredData, (prop, key) => {
        json[key] = this.getElementValue(ctxElement, prop);
      });
      return json;
    }

    const hasKeys = Object.keys(filteredData).length > 0;
    if (!hasKeys && follow) {
      // NOTE currently, this makes it impossible to filter
      // an object with only a _follow property.
      return this.follow(follow, contextElement);
    }

    return this.parseData(filteredData, contextElement)
      .then((parsedData) => {
        if (filter && !this.filter(parsedData, filter)) {
          return null;
        }

        if (!follow) {
          return parsedData;
        }

        return this.follow(follow, contextElement, parsedData);
      });
  },

  getElementValue(elem, property) {
    const prop = property || this.getDefaultElementProperty(elem);

    switch (prop) {
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

  getDefaultElementProperty(elem) {
    if (elem.is('a,link')) {
      return 'href';
    }
    if (elem.is('img')) {
      return 'src';
    }
    return 'text';
  },

  getURL(elem) {
    const href = elem.attr('href');
    if (this.domain && href.indexOf(this.host) === -1) {
      return url.resolve(this.domain, href);
    }
    return href;
  },

  follow(follow, contextElement, json = {}) {
    const href = (follow._elem)
      ? this.getElementValue(this.getElement(follow, contextElement))
      : this.getElementValue(contextElement);

    const opts = {
      url   : href,
      data  : (follow._elem) ? _.omit(follow, ['_elem']) : follow,
      params: this.params,
      logger: this.logger,
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
    if (_.isFunction(filter)) {
      return filter(object);
    }
    if (_.isObject(filter)) {
      return _.isMatch(object, filter);
    }
    return false;
  },
};

function scrape(options) {
  const scraper = Object.create(webScraper);
  return scraper.scrape(options);
}

module.exports = scrape;
