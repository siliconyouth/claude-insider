import * as migration_20251212_090731 from './20251212_090731';
import * as migration_20251212_094918 from './20251212_094918';
import * as migration_20251212_114827 from './20251212_114827';
import * as migration_20251212_120000 from './20251212_120000';

export const migrations = [
  {
    up: migration_20251212_090731.up,
    down: migration_20251212_090731.down,
    name: '20251212_090731',
  },
  {
    up: migration_20251212_094918.up,
    down: migration_20251212_094918.down,
    name: '20251212_094918',
  },
  {
    up: migration_20251212_114827.up,
    down: migration_20251212_114827.down,
    name: '20251212_114827',
  },
  {
    up: migration_20251212_120000.up,
    down: migration_20251212_120000.down,
    name: '20251212_120000',
  },
];
