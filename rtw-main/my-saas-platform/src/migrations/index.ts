import * as migration_20260128_180338 from './20260128_180338'
import * as migration_20260129_000000_add_last_login_at from './20260129_000000_add_last_login_at'
import * as migration_20260129_100000_add_session_id from './20260129_100000_add_session_id'
import * as migration_20260202_000000_purchases_myfatoorah from './20260202_000000_purchases_myfatoorah'
import * as migration_20260211_000000_add_blog_editor_role from './20260211_000000_add_blog_editor_role'
import * as migration_20260211_100000_add_user_invitation_fields from './20260211_100000_add_user_invitation_fields'
import * as migration_20260211_200000_add_moderator_role from './20260211_200000_add_moderator_role'

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
  {
    up: migration_20260202_000000_purchases_myfatoorah.up,
    down: migration_20260202_000000_purchases_myfatoorah.down,
    name: '20260202_000000_purchases_myfatoorah'
  },
  {
    up: migration_20260211_000000_add_blog_editor_role.up,
    down: migration_20260211_000000_add_blog_editor_role.down,
    name: '20260211_000000_add_blog_editor_role'
  },
  {
    up: migration_20260211_100000_add_user_invitation_fields.up,
    down: migration_20260211_100000_add_user_invitation_fields.down,
    name: '20260211_100000_add_user_invitation_fields'
  },
  {
    up: migration_20260211_200000_add_moderator_role.up,
    down: migration_20260211_200000_add_moderator_role.down,
    name: '20260211_200000_add_moderator_role'
  },
]
