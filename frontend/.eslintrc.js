module.exports = {
  root: true,

  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },

  env: {
    es6: true,
    node: true,
    browser: true
  },

  extends: [
    'google',
    'plugin:react/recommended'
  ],

  rules: {
    'indent': 'off',
    'no-console': 'off',
    'object-curly-spacing': 'off',
    'block-spacing': 'off',
    'brace-style': 'off',
    'comma-dangle': 'off',
    'max-len': 'off',
    'quotes': 'off',
    'eol-last': 'off',
    'linebreak-style': 'off',
    'semi': 'off',
    'no-trailing-spaces': 'off',
    'no-multiple-empty-lines': 'off',
    'no-mixed-spaces-and-tabs': 'off',
    'no-undef': 'off',
    'no-unused-expressions': 'off',
    'no-unused-vars': 'off',
    'no-unused-vars': 'off',
    'arrow-parens': 'off',
    'camelcase': 'off',
    'require-jsdoc': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'new-cap': "off"
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
        'react/display-name': 'off',
            'new-cap': "off"

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
