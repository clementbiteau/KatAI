import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/**/*.test.{ts,tsx}"],
          exclude: ["tests/emulator/**"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "emulator",
          include: ["tests/emulator/**/*.test.ts"],
          environment: "node",
          fileParallelism: false,
        },
      },
    ],
  },
});
