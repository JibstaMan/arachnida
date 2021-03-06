const isFunction = require('lodash/isFunction');

const defaults = {
  logger        : null,
  enableLogging : false,
  separateErrors: false,
  testing       : false,
};

const logger = (options) => {
  const opts = Object.assign({}, defaults, options);
  opts.allowErrors = opts.separateErrors || opts.testing || false;

  return {
    log(...params) {
      if (isFunction(opts.logger)) {
        opts.logger(...params);
      }
      if (opts.enableLogging) {
        // eslint-disable-next-line no-console
        console.warn(...params);
      }
    },


    setProperty(json, key, defaultValue) {
      /* eslint-disable no-param-reassign */
      // catch handler, so val is always an error.
      return (val) => {
        if (opts.separateErrors) {
          if (!json.errors) {
            json.errors = {};
          }
          json.errors[key] = val;
        }

        if (opts.testing) {
          json[key] = val.message;
        }
        else {
          json[key] = defaultValue;
        }
      };
      /* eslint-enable no-param-reassign */
    },

    checkIsElement($elem, errMsg) {
      if (!$elem || !$elem.length) {
        this.log(errMsg);
        if (opts.allowErrors) {
          return new Error(errMsg);
        }
      }
      return false;
    },
  };
};

module.exports = logger;
