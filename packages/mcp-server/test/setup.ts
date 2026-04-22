import { afterEach } from "vitest";

afterEach(() => {
    delete process.env.DATABASE_URL;
});
