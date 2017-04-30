/* eslint-disable no-script-url */
const test = require('tape');
const express = require('express');
const webScraper = require('../../lib/index');

const url = 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/JavaScript_basics';
let server = null;

test('Scraper', (nest) => {
  nest.test('start test server', (assert) => {
    const app = express();

    app.use(express.static('test/fixtures'));

    server = app.listen(8888, () => assert.end());
  });

  nest.test('primary example', (assert) => {
    const data = {
      url,
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

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        javascript: {
          source  : 'A "hello world" example',
          question: 'What is JavaScript, really?',
          answer  : 'JavaScript: JavaScript (JS) is a programming language mostly used client-side to dynamically script webpages, but often also server-side.',
        },
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('selector query', (assert) => {
    const data = {
      url,
      data: 'article .glossaryLink',
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = 'https://developer.mozilla.org/en-US/docs/Glossary/JavaScript';
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('custom values', (assert) => {
    const data = {
      url,
      data: {
        _elem : 'article .glossaryLink',
        _value: 'title', // retrieve the title attribute
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = 'JavaScript: JavaScript (JS) is a programming language mostly used client-side to dynamically script webpages, but often also server-side.';
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('list', (assert) => {
    const data = {
      url,
      data: {
        glossary: [{
          _elem : 'article .glossaryLink',
          _value: 'title',
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        glossary: [
          'JavaScript: JavaScript (JS) is a programming language mostly used client-side to dynamically script webpages, but often also server-side.',
          'dynamic programming language: A dynamic programming language is a programming language in which operations otherwise done at compile-time can be done at run-time. For example, in JavaScript it is possible to change the type of a variable or add new properties or methods to an object while the program is running.',
          'HTML: HTML (HyperText Markup Language) is a descriptive language that specifies webpage structure.',
          'APIs: An API (Application Programming Interface) is a set of features and rules that exist inside a software program enabling interaction between the software and other items, such as other software or hardware.',
          'Variables: A variable is a named location for storing a value. That way an unpredictable value can be accessed through a predetermined name.',
          'String: In any computer programming language, a string is a sequence of characters used to represent text.',
          'Number: In JavaScript, Number is a numeric data type in the double-precision 64-bit floating point format (IEEE 754). In other programming languages different numeric types can exist, for examples: Integers, Floats, Doubles, or Bignums.',
          "Boolean: In computer science, a boolean is a logical data type that can have only the values true or false. A boolean is how a programming language lets you represent true and false. Without the ability to represent the boolean values a number of things in a language would no longer work. For example, in JavaScript, an if statement's conditional has to resolve to a boolean value for it to execute at all.  In a JavaScript for loop without it's boolean conditional the loop would never know whether to run it's coding or not.",
          'Array: An array is an ordered collection of data (either primitive or object depending upon the language). Arrays are used to store multiple values in a single variable. This is compared to a variable that can store only one value.',
          'Object: Object refers to a data structure containing data and instructions for working with the data. Objects sometimes refer to real-world things, for example a car or map object in a racing game. JavaScript, Java, C++, Python, and Ruby are examples of object-oriented programming languages.',
          'operator: Reserved syntax consisting of punctuation or alphanumeric characters that carrying out built-in functionality. For example, in JavaScript the addition operator ("+") adds numbers together and concatenates strings, whereas the "not" operator ("!") negates an expression — for example making a true statement return false.',
          'Functions: A function is a code snippet that can be called by other code or by itself, or a variable that refers to the function. When a function is called, arguments are passed to the function as input, and the function can optionally return an output. A function in JavaScript is also an object.',
          'arguments: An argument is a value (primitive or object) passed as input to a function.',
          'scoping: The current context of execution. The context in which values and expressions are "visible," or can be referenced. If a variable or other expression is not "in the current scope," then it is unavailable for use. Scopes can also be layered in a hierarchy, so that child scopes have access to parent scopes, but not vice versa.',
        ],
      };

      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('follow', (assert) => {
    const data = {
      url,
      data: {
        javascript: {
          _elem  : 'article .glossaryLink',
          _follow: 'article > p:nth-of-type(1)',
        },
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        javascript: 'JavaScript (JS) is a programming language mostly used client-side to dynamically script webpages, but often also server-side.',
      };

      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('filter', (assert) => {
    const data = {
      url,
      data: {
        glossary: [{
          _elem  : 'article .glossaryLink',
          _value : 'title',
          _filter: 'JavaScript',
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        glossary: [
          'JavaScript: JavaScript (JS) is a programming language mostly used client-side to dynamically script webpages, but often also server-side.',
          'dynamic programming language: A dynamic programming language is a programming language in which operations otherwise done at compile-time can be done at run-time. For example, in JavaScript it is possible to change the type of a variable or add new properties or methods to an object while the program is running.',
          'Number: In JavaScript, Number is a numeric data type in the double-precision 64-bit floating point format (IEEE 754). In other programming languages different numeric types can exist, for examples: Integers, Floats, Doubles, or Bignums.',
          "Boolean: In computer science, a boolean is a logical data type that can have only the values true or false. A boolean is how a programming language lets you represent true and false. Without the ability to represent the boolean values a number of things in a language would no longer work. For example, in JavaScript, an if statement's conditional has to resolve to a boolean value for it to execute at all.  In a JavaScript for loop without it's boolean conditional the loop would never know whether to run it's coding or not.",
          'Object: Object refers to a data structure containing data and instructions for working with the data. Objects sometimes refer to real-world things, for example a car or map object in a racing game. JavaScript, Java, C++, Python, and Ruby are examples of object-oriented programming languages.',
          'operator: Reserved syntax consisting of punctuation or alphanumeric characters that carrying out built-in functionality. For example, in JavaScript the addition operator ("+") adds numbers together and concatenates strings, whereas the "not" operator ("!") negates an expression — for example making a true statement return false.',
          'Functions: A function is a code snippet that can be called by other code or by itself, or a variable that refers to the function. When a function is called, arguments are passed to the function as input, and the function can optionally return an output. A function in JavaScript is also an object.',
        ],
      };

      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('filter before follow', (assert) => {
    const data = {
      url,
      data: {
        glossary: [{
          _elem: 'article .glossaryLink',
          title: {
            _value: 'text',
          },
          description: {
            _value: 'title',
          },
          _filter: (json) => /JavaScript/.test(json.description),
          _follow: {
            description: 'article > p:nth-of-type(1)',
          },
        }],
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        glossary: [
          {
            title      : 'JavaScript',
            description: 'JavaScript (JS) is a programming language mostly used client-side to dynamically script webpages, but often also server-side.',
          },
          {
            title      : 'dynamic programming language',
            description: 'A dynamic programming language is a programming language in which operations otherwise done at compile-time can be done at run-time. For example, in JavaScript it is possible to change the type of a variable or add new properties or methods to an object while the program is running.',
          },
          {
            title      : 'Number',
            description: 'In JavaScript, Number is a numeric data type in the double-precision 64-bit floating point format (IEEE 754). In other programming languages different numeric types can exist, for examples: Integers, Floats, Doubles, or Bignums.',
          },
          {
            title      : 'Boolean',
            description: "In computer science, a boolean is a logical data type that can have only the values true or false. A boolean is how a programming language lets you represent true and false. Without the ability to represent the boolean values a number of things in a language would no longer work. For example, in JavaScript, an if statement's conditional has to resolve to a boolean value for it to execute at all. In a JavaScript for loop without it's boolean conditional the loop would never know whether to run it's coding or not.",
          },
          {
            title      : 'Object',
            description: 'Object refers to a data structure containing data and instructions for working with the data. Objects sometimes refer to real-world things, for example a car or map object in a racing game. JavaScript, Java, C++, Python, and Ruby are examples of object-oriented programming languages.',
          },
          {
            title      : 'operator',
            description: 'Reserved syntax consisting of punctuation or alphanumeric characters that carrying out built-in functionality. For example, in JavaScript the addition operator ("+") adds numbers together and concatenates strings, whereas the "not" operator ("!") negates an expression — for example making a true statement return false.',
          },
          {
            title      : 'Functions',
            description: 'A function is a code snippet that can be called by other code or by itself, or a variable that refers to the function. When a function is called, arguments are passed to the function as input, and the function can optionally return an output. A function in JavaScript is also an object.',
          },
        ],
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('filter before follow', (assert) => {
    const data = {
      url,
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
        link   : '.glossaryLink',
        func   : {
          filter: (json) => /JavaScript/.test(json.description),
        },
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        glossary: [
          {
            title      : 'JavaScript',
            description: 'JavaScript (JS) is a programming language mostly used client-side to dynamically script webpages, but often also server-side.',
          },
          {
            title      : 'dynamic programming language',
            description: 'A dynamic programming language is a programming language in which operations otherwise done at compile-time can be done at run-time. For example, in JavaScript it is possible to change the type of a variable or add new properties or methods to an object while the program is running.',
          },
          {
            title      : 'Number',
            description: 'In JavaScript, Number is a numeric data type in the double-precision 64-bit floating point format (IEEE 754). In other programming languages different numeric types can exist, for examples: Integers, Floats, Doubles, or Bignums.',
          },
          {
            title      : 'Boolean',
            description: "In computer science, a boolean is a logical data type that can have only the values true or false. A boolean is how a programming language lets you represent true and false. Without the ability to represent the boolean values a number of things in a language would no longer work. For example, in JavaScript, an if statement's conditional has to resolve to a boolean value for it to execute at all. In a JavaScript for loop without it's boolean conditional the loop would never know whether to run it's coding or not.",
          },
          {
            title      : 'Object',
            description: 'Object refers to a data structure containing data and instructions for working with the data. Objects sometimes refer to real-world things, for example a car or map object in a racing game. JavaScript, Java, C++, Python, and Ruby are examples of object-oriented programming languages.',
          },
          {
            title      : 'operator',
            description: 'Reserved syntax consisting of punctuation or alphanumeric characters that carrying out built-in functionality. For example, in JavaScript the addition operator ("+") adds numbers together and concatenates strings, whereas the "not" operator ("!") negates an expression — for example making a true statement return false.',
          },
          {
            title      : 'Functions',
            description: 'A function is a code snippet that can be called by other code or by itself, or a variable that refers to the function. When a function is called, arguments are passed to the function as input, and the function can optionally return an output. A function in JavaScript is also an object.',
          },
        ],
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('testing', (assert) => {
    const data = {
      url,
      data: {
        link: 'article .glassoryLink',
      },
      config: {
        testing: true,
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        link: "Couldn't find 'article .glassoryLink'",
      };
      assert.deepEqual(actual, expected);
      assert.end();
    });
  });

  nest.test('separateErrors', (assert) => {
    const data = {
      url,
      data: {
        link: 'article .glassoryLink',
      },
      config: {
        separateErrors: true,
      },
    };

    webScraper(data, (err, json) => {
      assert.ifErr(err);

      const actual = json;
      const expected = {
        errors: {
          link: new Error("Couldn't find 'article .glassoryLink'"),
        },
        link: '',
      };
      assert.deepEqual(actual, expected);
      assert.equal(actual.errors.link.message, expected.errors.link.message);
      assert.end();
    });
  });

  nest.test('stop test server', (assert) => {
    server.close();
    assert.end();
  });
});
