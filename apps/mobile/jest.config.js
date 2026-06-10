const path = require('path');
const preset = require('jest-expo/jest-preset');

// jest-expo's react-native resolver applies ['require', 'react-native'] export conditions,
// but in practice the resolver falls through to `default` for these MSW transitive deps,
// picking their ESM builds. Resolve each dep from MSW's tree so pnpm symlinks and
// export-map changes (e.g. deferred-promise v3 is ESM-only) stay correct.
const mswDir = path.dirname(require.resolve('msw/package.json'));
const resolveFromMsw = (pkg) => require.resolve(pkg, { paths: [mswDir] });

module.exports = {
  ...preset,
  setupFilesAfterEnv: ['./jest.setup.ts'],
  transform: {
    ...preset.transform,
    // rettime and until-async are ESM-only MSW deps; transform them with Babel
    '^.+\\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:(jest-)?react-native|@react-native(-community)?|@react-native(/.*)?|expo(nent)?|@expo(nent)?(/.*)?|@expo-google-fonts(/.*)?|react-navigation|@react-navigation(/.*)?|@unimodules(/.*)?|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-toast-message|react-native-skeleton-placeholder|react-native-css-interop|@shopify(/.*)?|@bitebolt(/.*)?|@testing-library(/.*)?|@open-draft/deferred-promise|rettime|until-async))',
  ],
  moduleNameMapper: {
    ...(preset.moduleNameMapper || {}),
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@bitebolt/types$': '<rootDir>/../../packages/types/src',
    '^@bitebolt/utils$': '<rootDir>/../../packages/utils/src',
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^@open-draft/deferred-promise$': resolveFromMsw('@open-draft/deferred-promise'),
    '^@open-draft/until$': resolveFromMsw('@open-draft/until'),
    '^outvariant$': resolveFromMsw('outvariant'),
    '^is-node-process$': resolveFromMsw('is-node-process'),
    '^strict-event-emitter$': resolveFromMsw('strict-event-emitter'),
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
