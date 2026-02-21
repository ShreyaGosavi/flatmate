module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    moduleNameMapper: {
        "^@flatmate/db$": "<rootDir>/src/mocks/@flatmate/db.ts",
        "^@flatmate/auth$": "<rootDir>/src/mocks/@flatmate/auth.ts",
    },
    testMatch: ["**/*.test.ts"],
};
