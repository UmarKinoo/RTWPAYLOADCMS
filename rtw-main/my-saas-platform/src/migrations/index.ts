import * as migration_20260128_180338 from './20260128_180338'
import * as migration_20260129_000000_add_last_login_at from './20260129_000000_add_last_login_at'
import * as migration_20260129_100000_add_session_id from './20260129_100000_add_session_id'

export const migrations = [
  {
    up: migration_20260128_180338.up,
    down: migration_20260128_180338.down,
    name: '20260128_180338'
  },
  {
    up: migration_20260129_000000_add_last_login_at.up,
    down: migration_20260129_000000_add_last_login_at.down,
    name: '20260129_000000_add_last_login_at'
  },
  {
    up: migration_20260129_100000_add_session_id.up,
    down: migration_20260129_100000_add_session_id.down,
    name: '20260129_100000_add_session_id'
  },
]
