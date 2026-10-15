import { defineConfig } from 'eslint/config';
import obsidianmd from 'eslint-plugin-obsidianmd';

// Match the documented Community scanner, retaining its security errors and
// advisory severities. No plugin-specific rule suppressions are added.
// https://github.com/obsidianmd/eslint-plugin/blob/master/docs/configuration.md
const security = new Set(['no-eval', 'no-implied-eval', 'no-unsanitized/method',
  'no-unsanitized/property', 'obsidianmd/regex-lookbehind', 'obsidianmd/no-forbidden-elements']);
const scannerConfigs = obsidianmd.configs.recommended.map(config => ({...config,
  ...(config.rules ? {rules: Object.fromEntries(Object.entries(config.rules).map(([name, value]) => {
    const options = Array.isArray(value) ? value : [value];
    const severity = options[0];
    return [name, security.has(name) || name.startsWith('eslint-comments/') ? ['error', ...options.slice(1)] :
      severity === 'error' || severity === 2 ? ['warn', ...options.slice(1)] : value];
  }))} : {}),
}));
export default defineConfig([
  {ignores: ['node_modules/**', 'build/**', '.test-build/**', 'tests/**', 'scripts/**', 'docs/**', '**/*.mjs']},
  ...scannerConfigs,
  {
    languageOptions: {parserOptions: {
      projectService: {allowDefaultProject: ['manifest.json']},
      tsconfigRootDir: import.meta.dirname,
      extraFileExtensions: ['.json'],
    }},
  },
  {files: ['src/**/*.ts'], rules: {
    ...Object.fromEntries([...security].map(name => [name, 'error'])),
    'no-undef': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
    'import/no-unresolved': 'off',
    'obsidianmd/validate-manifest': 'off',
    'obsidianmd/validate-license': 'off',
    'obsidianmd/commands/no-command-in-command-id': 'off',
    'obsidianmd/commands/no-plugin-id-in-command-id': 'off',
  }},
]);
