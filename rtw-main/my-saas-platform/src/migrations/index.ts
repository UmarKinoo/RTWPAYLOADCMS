import * as migration_20260128_180338 from './20260128_180338';

export const migrations = [
  {
    up: migration_20260128_180338.up,
    down: migration_20260128_180338.down,
    name: '20260128_180338'
  },
];
