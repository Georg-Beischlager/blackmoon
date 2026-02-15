import * as migration_20260215_150319 from './20260215_150319';

export const migrations = [
  {
    up: migration_20260215_150319.up,
    down: migration_20260215_150319.down,
    name: '20260215_150319'
  },
];
