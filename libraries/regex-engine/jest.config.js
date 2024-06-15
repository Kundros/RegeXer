const data = require("./tsconfig.json");
const { pathsToModuleNameMapper } = require('ts-jest');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleNameMapper: pathsToModuleNameMapper( data.compilerOptions.paths , { prefix: '<rootDir>' } ),
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    "^.+\\.(mt|t|cj|j)s$": [
      "ts-jest",
      {
        "useESM": true
      }
    ]
  }
};