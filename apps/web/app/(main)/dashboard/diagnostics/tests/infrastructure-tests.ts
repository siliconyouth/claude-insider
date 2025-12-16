/**
 * Infrastructure Tests
 *
 * Tests for environment variables and core configuration.
 */

import type { TestSuite } from "../diagnostics.types";
import { createDbCheckTest } from "./test-utils";

export const infrastructureTests: TestSuite[] = [
  createDbCheckTest("Environment Variables", "env", (env) => {
    const allPresent =
      env?.hasSupabaseUrl && env?.hasServiceRoleKey && env?.hasDatabaseUrl;
    return {
      status: allPresent ? "success" : "error",
      message: allPresent
        ? "All required env vars present"
        : "Missing environment variables",
      details: env as Record<string, unknown>,
    };
  }),
];
