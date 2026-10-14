import { defineConfig } from 'vitest/config';

// Security-rules tests: run through `npm run test:rules`, which starts the Firebase emulators.
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
