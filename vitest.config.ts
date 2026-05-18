import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
        exclude: ["tests/", "e2e/", "node_modules/"],
        environment: "jsdom",
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "tests/",
                "e2e/",
                "node_modules/",
                "**/*.config.ts",
                "**/*.d.ts",
            ],
        },
    },
});
