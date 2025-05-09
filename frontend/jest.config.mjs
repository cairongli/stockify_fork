import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/app/(.*)$": "<rootDir>/src/app/$1",
  },
  testMatch: ["**/__tests__/**/*.test.js", "**/__tests__/**/*.test.jsx"],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  // Run tests sequentially to avoid interference
  maxWorkers: 1,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
