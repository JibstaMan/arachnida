# Arachnida

[![Greenkeeper badge](https://badges.greenkeeper.io/JibstaMan/arachnida.svg)](https://greenkeeper.io/)
Makes it easy to scrape the web for specific information.

[![npm package](https://nodei.co/npm/arachnida.png)](https://nodei.co/npm/request/)

[![Build Status](https://travis-ci.org/JibstaMan/arachnida.svg?branch=master)](https://travis-ci.org/JibstaMan/arachnida)
[![Coverage Status](https://coveralls.io/repos/github/JibstaMan/arachnida/badge.svg?branch=master)](https://coveralls.io/github/JibstaMan/arachnida?branch=master)

## Features

**Declarative**: You specify what information you want and where to find it, Arachnida will perform the request and find the information you're looking for.
 
**Easy to maintain**: Instead of maintaining a complex regular expression or your own scraping solution, it's now as simple as updating some selectors.

**Database support**: Since the input is JSON, you can easily store it inside a database. Any properties that are dynamic (e.g. functions) can be specified separately.

Because of it's flexibility, there can be a bit of a learning curve involved. The same tricks can be applied in different situations, so some experimentation can go a long way. Besides the documentation, the tests can also show different configuration setups. 

## Usage

```js
const webScraper = require('arachnida');

const options = {
  url : 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/JavaScript_basics',
  data: {
    javascript: {
      source  : 'article h2:nth-of-type(2)',
      question: 'article h2:nth-of-type(1)',
      answer  : {
        _elem : 'article .glossaryLink',
        _value: 'title',
      },
    },
  },
};

// Note that you can also use promises
webScraper(options, (err, json) => {
  if (err) {
    return console.error(err);
  }
  
  console.log(JSON.stringify(json, null, 2));
  //=> {
  //  "javascript": {
  //    "source": "A \"hello world\" example",
  //    "question": "What is JavaScript, really?",
  //    "answer": "JavaScript: JavaScript (JS) is a programming language mostly used client-side to dynamically script webpages, but often also server-side."
  //  }
  //}
});
```

## Table of contents

* [Options](#options)
* [Data query](#data-query)
    * [Selector query](#selector-query)
    * [Element values](#element-values)
    * [Custom values](#custom-values)
    * [Private properties](#private-properties)
    * [Attributes](#attributes)
    * [Nesting](#nesting)
    * [Lists](#lists)
    * [Following links](#following-links)
    * [Filter](#filter)
    * [Filter before follow](#filter-before-follow)
* [Parameters](#parameters)
* [Configuration](#configuration)

## Options

The options object consists of multiple parts:

#### url

The `url` is always required. It determines which web page to scrape. It's also used to prefix relative URLs to make them absolute.
 
#### html

You can also use Arachnida when you've already obtained the HTML. The `html` property can be used to pass the HTML you've already fetched.

#### data

The `data` property specifies what to obtain from the URL. The return value will have mostly the same structure as the data input, but with the retrieved values.

#### params

The `parameters` or `params` property is a plain object. When a property in the data object has `{{property}}` as value, it will be replaced with `parameters[property]`.

This is useful when you store the data inside a database and want to pass in functions or runtime variables. 

#### config

There are also some configuration options that allow you to troubleshoot your data object.

## Data query

There are many different ways to query the data from the HTML.

#### Selector query

Generally, `string` values are interpreted as selectors. Since Arachnida uses [Cheerio](https://github.com/cheeriojs/cheerio), you can use CSS3 selectors.

```js
data: 'article .glossaryLink'
//=> 'https://developer.mozilla.org/en-US/docs/Glossary/JavaScript'
```

<small>(All the examples use the URL from the usage example earlier.)</small>

#### Element values

When you don't specify a custom value, the default value will be returned.

* `href` is returned for `a` or `link`.
* `src` is returned for `img`.
* `text` is returned for all the rest.

In the above example, the selector obtained a list of `<a>` tags. Since the default value for `a` is `href`, that is what was returned. Since we didn't ask for a list, we only retrieved the value of the first element.

#### Custom values

There will be many situations in which the default attribute isn't what you're interested in. In these cases, you can specifically tell what attribute you want.

```js
data: {
  _elem : 'article .glossaryLink',
  _value: 'title', // retrieve the title attribute
}
//=> 'JavaScript: JavaScript (JS) is a programming language mostly used client-side to dynamically script webpages, but often also server-side.'
```

#### Private properties

This would be a good time to take a closer look at private properties. Any property that starts with `_` is private, which means it is used for query purposes only. It will not be present in the returned JSON object.

In the above example, we see a combination of `_elem` and `_value`. The `_elem` property determines which element to select and the `_value` attribute determines the attribute to retrieve as the value. Since there are no other properties inside the data query, the returned JSON is a string, containing the tite of the `.glossaryLink`. In essence, the `_elem` and `_value` combination allows to retrieve a custom attribute without any further nesting inside the returned JSON.

#### Attributes

When you specify `_elem` with other properties that aren't private, these properties will be used to retrieve multiple attributes from the selected element.

```js
url: 'http://example.com/movie/captain-america-civil-war',
data: {
  movie: {
    _elem: '.movie',
    id: 'id',
    title: 'data-title',
    likes: 'data-likes'
  }
}
//=> {
//  movie: {
//    id: 'main_movie',
//    title: 'Captain America: Civil War',
//    likes: 12
//  }
//}
```

#### Nesting

When no `_elem` property is present, this is interpreted as a nested object. All properties will be evaluated as if it was a new root data object. However, the returned data structure will closely match the query structure.

```js
data: {
  javascript: {
    source  : 'article h2:nth-of-type(2)',
    question: 'article h2:nth-of-type(1)',
    answer  : {
      _elem : 'article .glossaryLink',
      _value: 'title',
    },
  },
}
//=> {
//  javascript: {
//    source: 'A "hello world" example',
//    question: 'What is JavaScript, really?',
//    answer: 'JavaScript: JavaScript (JS) is a programming language mostly used client-side to dynamically script webpages, but often also server-side.'
//  }
//}
```

#### Lists

When you want to retrieve a list, you need to use an array as input. This array has only one item, either a string or object.

```js
data: {
  glossary: [{
    _elem : 'article .glossaryLink',
    _value: 'title',
  }],
}
//=> {
//  glossary: [
//    'JavaScript: JavaScript (JS) is a programming language mostly used client-side to dynamically script webpages, but often also server-side.',
//    'dynamic programming language: A dynamic programming language is a programming language in which operations otherwise done at compile-time can be done at run-time. For example, in JavaScript it is possible to change the type of a variable or add new properties or methods to an object while the program is running.',
//    'HTML: HTML (HyperText Markup Language) is a descriptive language that specifies webpage structure.',
//    ...
//  ]
//}
```

When you specify an array, it's assumed that the selector inside (either string or `_elem` property) will retrieve multiple elements. It will then iterate over each element and process the rest of the data query for each element individually.

#### Following links

A very interesting feature is the ability to follow a link to a different page and retrieve values from that page as well. This can be done with the `_follow` property. 

Just like everything else, `_follow` can have a string or object as its value. When it's a string, the object containing the `_follow` property should also have an `_elem` property that points to a link (`<a>`).

```js
data: {
  javascript: {
    // Select the first .glossaryLink, which has a href linking to
    // https://developer.mozilla.org/en-US/docs/Glossary/JavaScript
    _elem  : 'article .glossaryLink',
    // select the first paragraph of the newly fetched page.
    _follow: 'article > p:nth-of-type(1)',
  },
}
//=> {
//  javascript: 'JavaScript (JS) is a programming language mostly used client-side to dynamically script webpages, but often also server-side.'
//}
```

#### Filter

There may be situations in which you want to filter the result of an array. This can be done with the `_filter` property.

The `_filter` property can have multiple values:

* Function: `(val) => true` (similar to [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter?v=example)). 
* Object: used as source for the [`_.isMatch`](https://lodash.com/docs#isMatch) function.
* String: filters out anything that doesn't contain the filter string (using [String.indexOf](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf) > -1).
* RegExp: filters out anything that fails the [RegExp.test](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test) function.

```js
data: {
  glossary: [{
    _elem  : 'article .glossaryLink',
    _value : 'title',
    _filter: 'JavaScript',
  }],
}
//=> {
//  glossary: [
//    'JavaScript: JavaScript (JS) is a programming language mostly used ...',
//    'dynamic programming language: A dynamic programming language is a ...',
//    'Number: In JavaScript, Number is a numeric data type in the ...',
//    'Boolean: In computer science, a boolean is a logical data type ...',
//    'Object: Object refers to a data structure containing data and ...',
//    'operator: Reserved syntax consisting of punctuation or alphanumeric ...',
//    'Functions: A function is a code snippet that can be called by other ...',
//  ],
//}
```

#### Filter before follow

Filter is especially useful in combination with `_follow`, when following all found elements would increase the amount of HTTP requests performed. Note that filter and follow always happen after the rest of the object has been retrieved.

```js
data: {
  glossary: [{
    _elem: 'article .glossaryLink',
    title: {
      _value: 'text',
    },
    // retrieve the description for filtering purposes.
    description: {
      _value: 'title',
    },
    // json = { title, description }
    _filter: (json) => /JavaScript/.test(json.description),
    _follow: {
      // overwrite the description retrieved earlier.
      description: 'article > p:nth-of-type(1)',
    },
  }],
}
//=> {
//  glossary: [
//    {
//      title      : 'JavaScript',
//      description: 'JavaScript (JS) is a programming language mostly used ...',
//   },
//    {
//      title      : 'dynamic programming language',
//      description: 'A dynamic programming language is a programming language ...',
//    },
//    {
//      title      : 'Number',
//      description: 'In JavaScript, Number is a numeric data type in the ...',
//    },
//    ...
//  ],
//}
```

#### Parameters

An important idea behind Arachnida is the ability to store the scraping configuration within a database. But since functions cannot be stored within a database, it's possible to specify a separate object containing dynamic information, either called `parameters` or `params`.

Parameters can be retrieved using `{{parameter}}`. If the string contains a single parameter (e.g. `"{{filter}}"`), the value will be replaced with the `filter` property inside the `parameters` object. This means the parameter object can contain anything; objects, arrays, function, etc. 

When there are multiple parameters, or a single one but with extra text (e.g. `"{{article}} h1"`), [String.replace](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace) will be used.  

You can retrieve nested properties from the parameters object using the dot notation, e.g. `"{{func.filter}}"`.

```js
data: {
  glossary: [{
    _elem: '{{article}} {{link}}',
    title: {
      _value: 'text',
    },
    description: {
      _value: 'title',
    },
    _filter: '{{func.filter}}',
    _follow: {
      description: '{{article}} > p:nth-of-type(1)',
    },
  }],
},
params: {
  article: 'article',
  link: '.glossaryLink',
  func: {
    filter: (json) => /JavaScript/.test(json.description),
  },
}
//=> same response as above.
```

### Troubleshooing config

The are multiple options to help you troubleshoot your data query.

##### Testing

When a selector couldn't find any element, a message will be put inside the JSON response. This makes it really easy to see which selector failed. Currently, this only works when the data is an object. If you pass a string, you will get an error (or Promise rejection) with the same error message.

```js
data: {
  link: 'article .glassoryLink',
},
config: {
  testing: true,
}
//=> {
//  link: "Couldn't find 'article .glassoryLink'",
//}
```

##### enableLogging

This allows Arachnida to log warnings to the console (using `console.warn`).

```js
config: {
  enableLogging: true,
}
```

##### Logger

Allows you to specify your own log function. `enableLogging: true` isn't necessary when specifying a logger.

This is mainly useful if you use a logger with log levels. You can choose which log level to give to the scraper.

```js
config: {
  logger: console.error,
}
```

##### separateErrors

Similar to testing, only instead of including the error messages inside the JSON itself, the JSON will receive separate error sections with actual Error objects. This can be combined with `testing: true`.

```js
data: {
  link: 'article .glassoryLink',
},
config: {
  separateErrors: true,
}
//=>
//  errors: {
//    link: [Error "Couldn't find 'article .glassoryLink'"],
//  },
//  link: '',
//}
```
