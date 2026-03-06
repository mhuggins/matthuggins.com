/// <reference types="vitest/config" />

import { defineConfig } from "vitest/config";

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    passWithNoTests: true,
    environment: "jsdom",
    projects: ["apps/*", "packages/*"],
  },
});
