/**
 * Mock for server-only package
 *
 * The server-only package throws an error when imported in client environments.
 * This mock allows us to test server-side code in Vitest.
 */

// Empty export - the real package just throws if imported on client
export {};
