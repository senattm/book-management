module.exports = {
  testEnvironment: "node",

 
  setupFiles: ["<rootDir>/src/tests/jest.env.js"],

  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.js"],

  testMatch: ["**/src/tests/**/*.test.js"],
  clearMocks: true,
};
