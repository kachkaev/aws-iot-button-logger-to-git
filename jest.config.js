"use strict";

const REPORT_TEST_RESULTS_AND_COVERAGE = !!process.env
  .REPORT_TEST_RESULTS_AND_COVERAGE;

module.exports = {
  collectCoverage: REPORT_TEST_RESULTS_AND_COVERAGE,
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts", "!src/testUtil.ts"],
  coverageReporters: ["cobertura", "html", "text"],
  reporters: REPORT_TEST_RESULTS_AND_COVERAGE
    ? ["default", ["jest-junit", { suiteNameTemplate: "{filepath}" }]]
    : ["default"],
};
