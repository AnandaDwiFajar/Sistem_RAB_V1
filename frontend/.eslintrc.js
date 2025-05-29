module.exports = {
  root: true,

  parserOptions: {
    ecmaVersion: 2018,       // or 'latest'
    sourceType: 'module',    // needed for import/export
    ecmaFeatures: {
      jsx: true              // if you use React
    }
  },

  env: {
    es6: true,
    node: true,
    browser: true            // add this if you run in browser too
  },

  extends: [
    'google',
    'plugin:react/recommended'
  ],

  rules: {
    'indent': 'off',
    // style / spacing
    'object-curly-spacing': 'off',
    'block-spacing': 'off',
    'brace-style': 'off',
    'comma-dangle': 'off',
    'max-len': 'off',
    'quotes': 'off',
    'eol-last': 'off',
'linebreak-style': 'off',

    // code hygiene
    'no-unused-vars': 'off',
    'arrow-parens': 'off',
    'camelcase': 'off',
    'require-jsdoc': 'off',
    'react/prop-types': 'off'
  },

  overrides: [
    {
      files: ['**/*.spec.*'],
      env: {
        mocha: true
      },
      rules: {
        'object-curly-spacing': 'off',
        'max-len': 'off',
        'no-unused-vars': 'off',
        'comma-dangle': 'off',
        'quotes': 'off',
        'eol-last': 'off',
'linebreak-style': 'off',
      }
    }
  ],

  settings: {
    react: {
      version: 'detect'
    }
  },

  globals: {
    // add any global identifiers here, e.g. React: 'readonly'
  }
};
