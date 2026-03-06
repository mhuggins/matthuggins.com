/// <reference types="vitest/config" />

import { defineConfig } from "vitest/config";

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    passWithNoTests: true,
    environment: "jsdom",
    coverage: {
      excludeAfterRemap: true,
      reporter: ["html", "json-summary", "json"],
      include: ["apps/**/src", "packages/**/src"],
    },
    projects: ["apps/*", "packages/*"],
  },
});
