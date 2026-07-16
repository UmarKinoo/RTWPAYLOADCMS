import * as migration_20260128_180338 from './20260128_180338';
import * as migration_20260129_000000_add_last_login_at from './20260129_000000_add_last_login_at';
import * as migration_20260129_100000_add_session_id from './20260129_100000_add_session_id';
import * as migration_20260202_000000_purchases_myfatoorah from './20260202_000000_purchases_myfatoorah';
import * as migration_20260211_000000_add_blog_editor_role from './20260211_000000_add_blog_editor_role';
import * as migration_20260211_100000_add_user_invitation_fields from './20260211_100000_add_user_invitation_fields';
import * as migration_20260211_200000_add_moderator_role from './20260211_200000_add_moderator_role';
import * as migration_20260512_000000_add_interviews_candidate_accepted_at from './20260512_000000_add_interviews_candidate_accepted_at';
import * as migration_20260513_000000_add_users_display_name from './20260513_000000_add_users_display_name';
import * as migration_20260609_205734_readybot_schema from './20260609_205734_readybot_schema';
import * as migration_20260611_120000_candidate_profile_moderation from './20260611_120000_candidate_profile_moderation';
import * as migration_20260618_120000_candidate_skills_industry from './20260618_120000_candidate_skills_industry';
import * as migration_20260715_120000_interview_credit_deducted from './20260715_120000_interview_credit_deducted';

export const migrations = [
  {
    up: migration_20260128_180338.up,
    down: migration_20260128_180338.down,
    name: '20260128_180338',
  },
  {
    up: migration_20260129_000000_add_last_login_at.up,
    down: migration_20260129_000000_add_last_login_at.down,
    name: '20260129_000000_add_last_login_at',
  },
  {
    up: migration_20260129_100000_add_session_id.up,
    down: migration_20260129_100000_add_session_id.down,
    name: '20260129_100000_add_session_id',
  },
  {
    up: migration_20260202_000000_purchases_myfatoorah.up,
    down: migration_20260202_000000_purchases_myfatoorah.down,
    name: '20260202_000000_purchases_myfatoorah',
  },
  {
    up: migration_20260211_000000_add_blog_editor_role.up,
    down: migration_20260211_000000_add_blog_editor_role.down,
    name: '20260211_000000_add_blog_editor_role',
  },
  {
    up: migration_20260211_100000_add_user_invitation_fields.up,
    down: migration_20260211_100000_add_user_invitation_fields.down,
    name: '20260211_100000_add_user_invitation_fields',
  },
  {
    up: migration_20260211_200000_add_moderator_role.up,
    down: migration_20260211_200000_add_moderator_role.down,
    name: '20260211_200000_add_moderator_role',
  },
  {
    up: migration_20260512_000000_add_interviews_candidate_accepted_at.up,
    down: migration_20260512_000000_add_interviews_candidate_accepted_at.down,
    name: '20260512_000000_add_interviews_candidate_accepted_at',
  },
  {
    up: migration_20260513_000000_add_users_display_name.up,
    down: migration_20260513_000000_add_users_display_name.down,
    name: '20260513_000000_add_users_display_name',
  },
  {
    up: migration_20260609_205734_readybot_schema.up,
    down: migration_20260609_205734_readybot_schema.down,
    name: '20260609_205734_readybot_schema'
  },
  {
    up: migration_20260611_120000_candidate_profile_moderation.up,
    down: migration_20260611_120000_candidate_profile_moderation.down,
    name: '20260611_120000_candidate_profile_moderation',
  },
  {
    up: migration_20260618_120000_candidate_skills_industry.up,
    down: migration_20260618_120000_candidate_skills_industry.down,
    name: '20260618_120000_candidate_skills_industry',
  },
  {
    up: migration_20260715_120000_interview_credit_deducted.up,
    down: migration_20260715_120000_interview_credit_deducted.down,
    name: '20260715_120000_interview_credit_deducted',
  },
];
