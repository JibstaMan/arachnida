const get = require('lodash/get');
const isString = require('lodash/isString');
const isObject = require('lodash/isObject');
const isArray = require('lodash/isArray');
const reduce = require('lodash/reduce');

const paramRegex = /{{(.*?)}}/g;

function getParams(val) {
  let match;
  const matches = [];
  // eslint-disable-next-line no-cond-assign
  while (match = paramRegex.exec(val)) {
    matches.push(match);
  }
  return matches;
}

function getParam(val, params) {
  const matches = getParams(val);
  if (matches.length === 1) {
    const match = matches[0];
    if (match[0].length === val.length) {
      return get(params, match[1]);
    }
    return val.replace(match[0], get(params, match[1]));
  }

  if (matches.length > 0) {
    let value = val;
    matches.forEach((match) => {
      value = value.replace(match[0], get(params, match[1]));
    });
    return value;
  }

  return val;
}

function normalize(data, params) {
  if (isString(data)) {
    return getParam(data, params);
  }

  if (isArray(data)) {
    return data.map((val) => normalize(val, params));
  }

  if (isObject(data)) {
    return reduce(data, (acc, val, key) => {
      acc[key] = normalize(val, params);
      return acc;
    }, {});
  }

  return data;
}

module.exports = normalize;
