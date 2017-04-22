module.exports = {
  'extends': 'airbnb-base',
  'plugins': [
    'import'
  ],
  'rules': {
    'arrow-parens': ['error', 'always'],
    'brace-style': ['error', 'stroustrup'],
    'consistent-return': 'off',
    'key-spacing': ['error', {
      'align': {
        'beforeColon': false,
        'afterColon': true,
        'on': 'colon',
      },
      'multiLine': {
        'beforeColon': false,
        'afterColon': true,
      },
    }],
    'no-underscore-dangle': ['error', {
      'allow': [
        '_elem',
        '_value',
        '_filter',
        '_follow',
      ],
    }],
    'no-use-before-define': 'off',
  }
};
