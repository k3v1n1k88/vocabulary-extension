export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat',     // New feature
      'fix',      // Bug fix
      'docs',     // Documentation
      'style',    // Formatting (no code change)
      'refactor', // Code change (no feature/fix)
      'test',     // Adding tests
      'chore',    // Maintenance
      'perf',     // Performance
      'ci',       // CI/CD changes
      'build',    // Build system
      'revert'    // Revert commit
    ]],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never']
  }
}
