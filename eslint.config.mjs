import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
  {
    files: ['src/**/*.ts'],
    ...js.configs.recommended
  },
  {
    ignores: ['.wrangler/', 'functions/', 'public/'],
  },
  {    
    languageOptions: { 
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
				parser: tseslint.parser,
			},
    }
  },
  
  ...tseslint.configs.recommended,
  {
    rules: {
      'quotes': [
          'error',
          'single'
      ],
      'semi': [
        'error',
        'always'
      ],
      // 'no-undef': 'error',
    }
  }
];