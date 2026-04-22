import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["test/**/*.test.ts"],
        setupFiles: ["test/setup.ts"],
        fileParallelism: false,
        clearMocks: true,
        restoreMocks: true,
        unstubEnvs: true,
        coverage: {
            provider: "v8",
            reporter: ["text", "json-summary", "html"],
            include: ["src/**/*.ts"],
            exclude: ["src/shared/types.ts"],
            thresholds: {
                lines: 95,
                functions: 95,
                branches: 95,
                statements: 95,
            },
        },
    },
});
