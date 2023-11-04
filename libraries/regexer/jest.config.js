import { createRequire } from "module";
const require = createRequire(import.meta.url);
const data = require("./tsconfig.json");
import { pathsToModuleNameMapper } from 'ts-jest';

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleNameMapper: pathsToModuleNameMapper( data.compilerOptions.paths , { prefix: '<rootDir>/' } )
};