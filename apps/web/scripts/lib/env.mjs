/**
 * Environment loader using dotenvx
 *
 * Usage in scripts:
 *   import './lib/env.mjs';
 *
 * Or with explicit path:
 *   import { loadEnv } from './lib/env.mjs';
 *   loadEnv('.env.local');
 */

import { config } from '@dotenvx/dotenvx';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..');

/**
 * Load environment variables from a .env file
 * @param {string} filename - The env file to load (default: '.env.local')
 */
export function loadEnv(filename = '.env.local') {
  const path = join(rootDir, filename);
  config({ path, quiet: true });
}

// Auto-load .env.local when this module is imported
loadEnv();

export default loadEnv;
