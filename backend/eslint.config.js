import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            globals: {
                // Node.js globals
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
