const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'commonjs',
            globals: {
                // Node.js globals
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                process: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^(next|req|res|_)',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'no-console': 'warn',
            eqeqeq: ['error', 'always'],
            'no-var': 'error',
            'prefer-const': 'warn',
            'preserve-caught-error': 'off',
        },
    },
    {
        ignores: [
            'node_modules/',
            'logs/',
            'coverage/',
            'tests/',
            'docs/',
            'vitest.config.js',
            'eslint.config.js',
        ],
    },
];
