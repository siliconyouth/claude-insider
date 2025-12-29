import * as migration_20251228_133917 from './20251228_133917';
import * as migration_20251228_234303 from './20251228_234303';
import * as migration_20251229_000209 from './20251229_000209';

export const migrations = [
  {
    up: migration_20251228_133917.up,
    down: migration_20251228_133917.down,
    name: '20251228_133917',
  },
  {
    up: migration_20251228_234303.up,
    down: migration_20251228_234303.down,
    name: '20251228_234303',
  },
  {
    up: migration_20251229_000209.up,
    down: migration_20251229_000209.down,
    name: '20251229_000209'
  },
];
