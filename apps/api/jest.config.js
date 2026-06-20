const path = require('path');

const mswDir = path.dirname(require.resolve('msw/package.json', { paths: [__dirname] }));
const resolveFromMsw = (pkg) => require.resolve(pkg, { paths: [mswDir] });

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'mjs'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '[/\\\\]node_modules[/\\\\](?:\\.pnpm[/\\\\][^/\\\\]+[/\\\\]node_modules[/\\\\])?(?:msw|@mswjs|rettime|until-async|@open-draft)[/\\\\].+\\.(?:mjs|js)$':
      [
        'ts-jest',
        {
          useESM: false,
          tsconfig: { allowJs: true },
        },
      ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:msw|@mswjs|rettime|until-async|@open-draft))',
  ],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@bitebolt/types$': '<rootDir>/../../../packages/types/src',
    '^@bitebolt/utils$': '<rootDir>/../../../packages/utils/src',
    '^@open-draft/deferred-promise$': resolveFromMsw('@open-draft/deferred-promise'),
    '^@open-draft/until$': resolveFromMsw('@open-draft/until'),
    '^outvariant$': resolveFromMsw('outvariant'),
    '^is-node-process$': resolveFromMsw('is-node-process'),
    '^strict-event-emitter$': resolveFromMsw('strict-event-emitter'),
  },
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
  testTimeout: 90000,
};
