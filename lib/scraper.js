const url = require('url');
const request = require('request-promise');
const cheerio = require('cheerio');

const _ = {};
[
  'isString', 'isArray', 'isObject', 'isFunction', 'isUndefined',
  'isRegExp', 'isMatch', 'isError', 'each', 'omit', 'compact', 'clone',
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

  normalize(data) {
    if (_.isString(data)) {
      // console.log(`Normalizing string: ${data}`);
      return this.getParam(data);
    }

    if (_.isArray(data)) {
      // console.log('Normalizing array', data);
      return data.map(this.getParam);
    }

    if (_.isObject(data)) {
      // console.log('Normalizing object', data);
      const newData = _.clone(data);
      _.each(newData, (val, key) => {
        newData[key] = this.getParam(val);
      });
      return newData;
    }

    // console.log('Normalizing other', data);
    return data;
  },

  parseData(inputData, contextElement) {
    const data = this.normalize(inputData);

    if (data === null && contextElement) {
      return this.getSafeElementValue(contextElement);
    }

    if (_.isString(data)) {
      return this.getSingleElement(data, contextElement)
        .then((elem) => this.getSafeElementValue(elem));
    }

    if (_.isArray(data)) {
      return this.getArrayValue(data[0]);
    }

    const filter = data._filter;
    const follow = this.normalize(data._follow);

    const filteredData = _.omit(data, ['_filter', '_follow']);

    return this.getObjectValue(filteredData, contextElement)
      .then(({ value, contextElement: ctxElement }) => {
        if (filter && !this.filter(value, filter)) {
          return null;
        }

        if (!follow) {
          return value;
        }

        return this.follow(follow, ctxElement, value);
      });
  },

  getArrayValue(data) {
    return this.getElementList(data)
      .then((elements) => {
        const filteredData = (data._elem) ? _.omit(data, ['_elem']) : null;
        return Promise.all(elements.map((elem) => this.parseData(filteredData, elem)));
      });
  },

  getObjectValue(data, contextElement) {
    if (data._elem) {
      return this.getSingleElement(data, contextElement)
        .then((elem) => this.getObjectAttributeValue(data, elem));
    }

    if (data._value && contextElement) {
      // array with { _elem, _value } will have removed the _elem from data.
      return Promise.resolve(this.getObjectAttributeValue(data, contextElement));
    }

    return this.getNestedObjectValue(data, contextElement);
  },

  getObjectAttributeValue(data, contextElement) {
    if (data._value) {
      // don't nest the value.
      return { value: this.getElementValue(contextElement, data._value) };
    }

    const filteredData = _.omit(data, ['_elem']);

    const json = {};
    _.each(filteredData, (prop, key) => {
      json[key] = this.getElementValue(contextElement, prop);
    });
    return { value: json, contextElement };
  },

  getNestedObjectValue(data, contextElement) {
    const json = {};
    const keys = Object.keys(data);

    return Promise.all(keys.map((key) => (
      this.parseData(data[key], contextElement)
        .then((val) => {
          json[key] = (_.isArray(val)) ? _.compact(val) : val;
        })
        .catch(this.logger.setProperty(json, key, this.getDefaultValue(data[key])))
    )))
      .then(() => ({ value: json, contextElement }));
  },

  getSingleElement(data, contextElement, fallback) {
    return this.getElement(data, contextElement, fallback)
      .then((elem) => ((elem.length > 1) ? this.$(elem[0]) : elem));
  },

  getElementList(data) {
    return this.getElement(data)
      .then((elements) => elements.toArray().map(this.$));
  },

  getElement(data, contextElement, fallback) {
    const selector = (_.isObject(data)) ? data._elem : data;

    if (!selector) {
      if (_.isUndefined(fallback)) {
        throw new Error('An object was specified without an `_elem`, which is required.');
      }
      else {
        return Promise.resolve(fallback);
      }
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
      return Promise.reject(err);
    }

    return Promise.resolve($elem);
  },

  getSafeElementValue(elem, property) {
    if (_.isError(elem)) {
      return Promise.reject(elem);
    }

    return Promise.resolve(this.getElementValue(elem, property));
  },

  getElementValue(elem, property) {
    const prop = property || this.getDefaultElementProperty(elem);

    switch (prop) {
      case 'text':
        return elem.text().trim();
      case 'href':
        return this.getURL(elem);
      case 'html':
        return cheerio.html(elem);
      case 'tag':
        return cheerio.html(elem.empty());
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
    // when follow is a string, fallback should be used.
    const followObj = _.isObject(follow) ? follow : {};
    return this.getSingleElement(followObj, contextElement, contextElement)
      .then((elem) => this.getElementValue(elem))
      .then((href) => {
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
      });
  },

  filter(value, filter) {
    if (_.isFunction(filter)) {
      return filter(value);
    }
    if (_.isObject(value) && _.isObject(filter)) {
      return _.isMatch(value, filter);
    }
    if (_.isString(value)) {
      if (_.isString(filter)) {
        return value.indexOf(filter) > -1;
      }
      if (_.isRegExp(filter)) {
        return filter.test(value);
      }
    }
    return true;
  },

  getDefaultValue(value) {
    if (_.isString(value) || value._value) {
      return '';
    }
    if (_.isArray(value)) {
      return [];
    }
    return {};
  },
};

function scrape(options) {
  const scraper = Object.create(webScraper);
  return scraper.scrape(options);
}

module.exports = scrape;
