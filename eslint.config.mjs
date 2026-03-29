// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
    rules: {
    'vue/attribute-hyphenation': 'off',
    'vue/first-attribute-linebreak' : 'off',
    'vue/no-multiple-template-root' : 'off',
    'no-console': ['error', { allow: ['error', 'warn'] }],

    'vue/no-deprecated-filter' : 'off',
    
    // This disables the warning/error when using the 'any' type
    '@typescript-eslint/no-explicit-any': 'off',
    
    // Sometimes 'no-explicit-any' isn't enough; this disables 
    // checks for using 'any' in specific positions if needed
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',



    // --- SENIOR-LEVEL LOGIC GUARDRAILS ---
    'eqeqeq': ['error', 'always'],
    'no-self-compare': 'error',
    'no-template-curly-in-string': 'error',
    'no-unreachable-loop': 'error',
    'no-implicit-coercion': 'warn', // Should be error
    "no-prototype-builtins": "warn", // Should be error

    // --- CLEAN CODE & READABILITY ---
    // 'curly': ['error', 'all'], // Prevents bugs in if-statements without braces
    'no-lonely-if': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'spaced-comment': ['error', 'always'],

    // --- TYPESCRIPT ARCHITECTURE ---
    // '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-non-null-assertion': 'warn',
  }
})
