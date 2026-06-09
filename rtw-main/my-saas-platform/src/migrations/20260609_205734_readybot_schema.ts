import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_candidates_ready_bot_screening_status" AS ENUM('new', 'incomplete', 'contacted', 'awaiting_reply', 'info_received', 'needs_human_review', 'verified', 'unresponsive', 'opted_out');
  CREATE TYPE "public"."enum_candidates_ready_bot_preferred_contact_channel" AS ENUM('whatsapp', 'email', 'none');
  CREATE TYPE "public"."enum_candidate_screening_tasks_status" AS ENUM('pending', 'message_sent', 'awaiting_reply', 'reply_received', 'processed', 'needs_human_review', 'completed', 'failed', 'unresponsive');
  CREATE TYPE "public"."enum_candidate_screening_tasks_channel" AS ENUM('whatsapp', 'email');
  CREATE TYPE "public"."enum_candidate_messages_channel" AS ENUM('whatsapp', 'email');
  CREATE TYPE "public"."enum_candidate_messages_direction" AS ENUM('inbound', 'outbound');
  CREATE TYPE "public"."enum_candidate_messages_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed', 'received');
  CREATE TYPE "public"."enum_human_review_tasks_status" AS ENUM('pending', 'approved', 'rejected', 'edited_and_approved');
  CREATE TYPE "public"."enum_screening_results_status" AS ENUM('draft', 'ready_to_contact', 'contacted', 'completed', 'needs_human_review');
  CREATE TYPE "public"."enum_agent_events_event_type" AS ENUM('user_message', 'assistant_message', 'candidate_message', 'bot_message', 'tool_call', 'tool_result', 'profile_update', 'score_update', 'status_change', 'permission_decision', 'compaction_event', 'error', 'resume_marker', 'human_override');
  CREATE TABLE IF NOT EXISTS "candidates_ready_bot_missing_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "candidate_screening_tasks_missing_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "candidate_screening_tasks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"candidate_id" integer NOT NULL,
  	"job_posting_id" integer,
  	"screening_result_id" integer,
  	"status" "enum_candidate_screening_tasks_status" DEFAULT 'pending' NOT NULL,
  	"channel" "enum_candidate_screening_tasks_channel" DEFAULT 'whatsapp' NOT NULL,
  	"message_template" varchar,
  	"message_body" varchar,
  	"last_sent_at" timestamp(3) with time zone,
  	"reply_received_at" timestamp(3) with time zone,
  	"reply_text" varchar,
  	"extracted_data" jsonb,
  	"confidence_score" numeric,
  	"human_review_reason" varchar,
  	"attempt_count" numeric DEFAULT 0,
  	"next_follow_up_at" timestamp(3) with time zone,
  	"completed_at" timestamp(3) with time zone,
  	"error_log" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "candidate_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"candidate_id" integer NOT NULL,
  	"screening_task_id" integer,
  	"channel" "enum_candidate_messages_channel" NOT NULL,
  	"direction" "enum_candidate_messages_direction" NOT NULL,
  	"from" varchar,
  	"to" varchar,
  	"subject" varchar,
  	"body" varchar NOT NULL,
  	"external_message_id" varchar,
  	"status" "enum_candidate_messages_status" DEFAULT 'pending' NOT NULL,
  	"raw_payload" jsonb,
  	"sent_at" timestamp(3) with time zone,
  	"received_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "candidate_memory_confirmed_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "candidate_memory_unconfirmed_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "candidate_memory_missing_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "candidate_memory_important_corrections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar NOT NULL,
  	"previous_value" varchar,
  	"new_value" varchar,
  	"reason" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "candidate_memory_risk_flags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"flag" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "candidate_memory" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"candidate_id" integer NOT NULL,
  	"profile_summary" varchar,
  	"cv_summary" varchar,
  	"conversation_summary" varchar,
  	"last_question_asked" varchar,
  	"last_agent_decision" varchar,
  	"whatsapp_session" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "human_review_tasks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"candidate_id" integer NOT NULL,
  	"screening_task_id" integer,
  	"reason" varchar NOT NULL,
  	"suggested_update" jsonb NOT NULL,
  	"status" "enum_human_review_tasks_status" DEFAULT 'pending' NOT NULL,
  	"reviewed_by_id" integer,
  	"reviewed_at" timestamp(3) with time zone,
  	"admin_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "agent_audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"agent_name" varchar DEFAULT 'ReadyBot' NOT NULL,
  	"candidate_id" integer,
  	"screening_task_id" integer,
  	"action" varchar NOT NULL,
  	"before_data" jsonb,
  	"after_data" jsonb,
  	"reason" varchar,
  	"confidence" numeric,
  	"model_used" varchar,
  	"tool_used" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "screening_results_gaps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"gap" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "screening_results_recommended_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "screening_results" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"candidate_id" integer NOT NULL,
  	"job_posting_id" integer,
  	"screening_task_id" integer,
  	"target_role_title" varchar NOT NULL,
  	"fit_score" numeric,
  	"fit_summary" varchar,
  	"cv_summary" varchar,
  	"profile_understanding" jsonb,
  	"status" "enum_screening_results_status" DEFAULT 'draft' NOT NULL,
  	"model_used" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "readybot_ops_chat_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'New chat' NOT NULL,
  	"user_id" integer NOT NULL,
  	"locale" varchar DEFAULT 'en',
  	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
  	"memory_summary" varchar,
  	"key_facts" jsonb,
  	"memory_compacted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "agent_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_type" "enum_agent_events_event_type" NOT NULL,
  	"candidate_id" integer,
  	"job_id" integer,
  	"conversation_id" varchar,
  	"session_id" varchar,
  	"payload" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "ready_bot_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"use_lang_graph_multi_agent" boolean DEFAULT true,
  	"parallel_agent_count" numeric DEFAULT 3,
  	"use_lang_graph_chat_brain" boolean DEFAULT true,
  	"automated_scan_enabled" boolean DEFAULT true,
  	"scan_interval_minutes" numeric DEFAULT 15,
  	"automated_follow_up_enabled" boolean DEFAULT true,
  	"last_automated_scan_at" timestamp(3) with time zone,
  	"last_automated_follow_up_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "ready_bot_ready_bot_enabled" boolean DEFAULT true;
  ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "ready_bot_screening_status" "enum_candidates_ready_bot_screening_status" DEFAULT 'new';
  ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "ready_bot_whatsapp_number" varchar;
  ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "ready_bot_whatsapp_opt_in" boolean DEFAULT false;
  ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "ready_bot_whatsapp_opt_in_at" timestamp(3) with time zone;
  ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "ready_bot_preferred_contact_channel" "enum_candidates_ready_bot_preferred_contact_channel" DEFAULT 'whatsapp';
  ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "ready_bot_last_screened_at" timestamp(3) with time zone;
  ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "ready_bot_last_contacted_at" timestamp(3) with time zone;
  ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "ready_bot_last_reply_at" timestamp(3) with time zone;
  ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "ready_bot_screening_summary" varchar;
  ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "ready_bot_screening_confidence" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "candidate_screening_tasks_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "candidate_messages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "candidate_memory_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "human_review_tasks_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "agent_audit_logs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "screening_results_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "readybot_ops_chat_sessions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "agent_events_id" integer;
  ALTER TABLE "candidates_ready_bot_missing_fields" ADD CONSTRAINT "candidates_ready_bot_missing_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "candidate_screening_tasks_missing_fields" ADD CONSTRAINT "candidate_screening_tasks_missing_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."candidate_screening_tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "candidate_screening_tasks" ADD CONSTRAINT "candidate_screening_tasks_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_screening_tasks" ADD CONSTRAINT "candidate_screening_tasks_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_screening_tasks" ADD CONSTRAINT "candidate_screening_tasks_screening_result_id_screening_results_id_fk" FOREIGN KEY ("screening_result_id") REFERENCES "public"."screening_results"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_messages" ADD CONSTRAINT "candidate_messages_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_messages" ADD CONSTRAINT "candidate_messages_screening_task_id_candidate_screening_tasks_id_fk" FOREIGN KEY ("screening_task_id") REFERENCES "public"."candidate_screening_tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_memory_confirmed_fields" ADD CONSTRAINT "candidate_memory_confirmed_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."candidate_memory"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "candidate_memory_unconfirmed_fields" ADD CONSTRAINT "candidate_memory_unconfirmed_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."candidate_memory"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "candidate_memory_missing_fields" ADD CONSTRAINT "candidate_memory_missing_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."candidate_memory"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "candidate_memory_important_corrections" ADD CONSTRAINT "candidate_memory_important_corrections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."candidate_memory"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "candidate_memory_risk_flags" ADD CONSTRAINT "candidate_memory_risk_flags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."candidate_memory"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "candidate_memory" ADD CONSTRAINT "candidate_memory_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "human_review_tasks" ADD CONSTRAINT "human_review_tasks_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "human_review_tasks" ADD CONSTRAINT "human_review_tasks_screening_task_id_candidate_screening_tasks_id_fk" FOREIGN KEY ("screening_task_id") REFERENCES "public"."candidate_screening_tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "human_review_tasks" ADD CONSTRAINT "human_review_tasks_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "agent_audit_logs" ADD CONSTRAINT "agent_audit_logs_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "agent_audit_logs" ADD CONSTRAINT "agent_audit_logs_screening_task_id_candidate_screening_tasks_id_fk" FOREIGN KEY ("screening_task_id") REFERENCES "public"."candidate_screening_tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "screening_results_gaps" ADD CONSTRAINT "screening_results_gaps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."screening_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "screening_results_recommended_questions" ADD CONSTRAINT "screening_results_recommended_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."screening_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "screening_results" ADD CONSTRAINT "screening_results_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "screening_results" ADD CONSTRAINT "screening_results_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "screening_results" ADD CONSTRAINT "screening_results_screening_task_id_candidate_screening_tasks_id_fk" FOREIGN KEY ("screening_task_id") REFERENCES "public"."candidate_screening_tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "readybot_ops_chat_sessions" ADD CONSTRAINT "readybot_ops_chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "agent_events" ADD CONSTRAINT "agent_events_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "agent_events" ADD CONSTRAINT "agent_events_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "candidates_ready_bot_missing_fields_order_idx" ON "candidates_ready_bot_missing_fields" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "candidates_ready_bot_missing_fields_parent_id_idx" ON "candidates_ready_bot_missing_fields" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "candidate_screening_tasks_missing_fields_order_idx" ON "candidate_screening_tasks_missing_fields" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "candidate_screening_tasks_missing_fields_parent_id_idx" ON "candidate_screening_tasks_missing_fields" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "candidate_screening_tasks_candidate_idx" ON "candidate_screening_tasks" USING btree ("candidate_id");
  CREATE INDEX IF NOT EXISTS "candidate_screening_tasks_job_posting_idx" ON "candidate_screening_tasks" USING btree ("job_posting_id");
  CREATE INDEX IF NOT EXISTS "candidate_screening_tasks_screening_result_idx" ON "candidate_screening_tasks" USING btree ("screening_result_id");
  CREATE INDEX IF NOT EXISTS "candidate_screening_tasks_updated_at_idx" ON "candidate_screening_tasks" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "candidate_screening_tasks_created_at_idx" ON "candidate_screening_tasks" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "candidate_messages_candidate_idx" ON "candidate_messages" USING btree ("candidate_id");
  CREATE INDEX IF NOT EXISTS "candidate_messages_screening_task_idx" ON "candidate_messages" USING btree ("screening_task_id");
  CREATE INDEX IF NOT EXISTS "candidate_messages_external_message_id_idx" ON "candidate_messages" USING btree ("external_message_id");
  CREATE INDEX IF NOT EXISTS "candidate_messages_updated_at_idx" ON "candidate_messages" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "candidate_messages_created_at_idx" ON "candidate_messages" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "candidate_memory_confirmed_fields_order_idx" ON "candidate_memory_confirmed_fields" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "candidate_memory_confirmed_fields_parent_id_idx" ON "candidate_memory_confirmed_fields" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "candidate_memory_unconfirmed_fields_order_idx" ON "candidate_memory_unconfirmed_fields" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "candidate_memory_unconfirmed_fields_parent_id_idx" ON "candidate_memory_unconfirmed_fields" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "candidate_memory_missing_fields_order_idx" ON "candidate_memory_missing_fields" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "candidate_memory_missing_fields_parent_id_idx" ON "candidate_memory_missing_fields" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "candidate_memory_important_corrections_order_idx" ON "candidate_memory_important_corrections" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "candidate_memory_important_corrections_parent_id_idx" ON "candidate_memory_important_corrections" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "candidate_memory_risk_flags_order_idx" ON "candidate_memory_risk_flags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "candidate_memory_risk_flags_parent_id_idx" ON "candidate_memory_risk_flags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "candidate_memory_candidate_idx" ON "candidate_memory" USING btree ("candidate_id");
  CREATE INDEX IF NOT EXISTS "candidate_memory_updated_at_idx" ON "candidate_memory" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "candidate_memory_created_at_idx" ON "candidate_memory" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "human_review_tasks_candidate_idx" ON "human_review_tasks" USING btree ("candidate_id");
  CREATE INDEX IF NOT EXISTS "human_review_tasks_screening_task_idx" ON "human_review_tasks" USING btree ("screening_task_id");
  CREATE INDEX IF NOT EXISTS "human_review_tasks_reviewed_by_idx" ON "human_review_tasks" USING btree ("reviewed_by_id");
  CREATE INDEX IF NOT EXISTS "human_review_tasks_updated_at_idx" ON "human_review_tasks" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "human_review_tasks_created_at_idx" ON "human_review_tasks" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "agent_audit_logs_candidate_idx" ON "agent_audit_logs" USING btree ("candidate_id");
  CREATE INDEX IF NOT EXISTS "agent_audit_logs_screening_task_idx" ON "agent_audit_logs" USING btree ("screening_task_id");
  CREATE INDEX IF NOT EXISTS "agent_audit_logs_updated_at_idx" ON "agent_audit_logs" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "agent_audit_logs_created_at_idx" ON "agent_audit_logs" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "screening_results_gaps_order_idx" ON "screening_results_gaps" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "screening_results_gaps_parent_id_idx" ON "screening_results_gaps" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "screening_results_recommended_questions_order_idx" ON "screening_results_recommended_questions" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "screening_results_recommended_questions_parent_id_idx" ON "screening_results_recommended_questions" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "screening_results_candidate_idx" ON "screening_results" USING btree ("candidate_id");
  CREATE INDEX IF NOT EXISTS "screening_results_job_posting_idx" ON "screening_results" USING btree ("job_posting_id");
  CREATE INDEX IF NOT EXISTS "screening_results_screening_task_idx" ON "screening_results" USING btree ("screening_task_id");
  CREATE INDEX IF NOT EXISTS "screening_results_updated_at_idx" ON "screening_results" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "screening_results_created_at_idx" ON "screening_results" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "readybot_ops_chat_sessions_user_idx" ON "readybot_ops_chat_sessions" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "readybot_ops_chat_sessions_updated_at_idx" ON "readybot_ops_chat_sessions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "readybot_ops_chat_sessions_created_at_idx" ON "readybot_ops_chat_sessions" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "agent_events_event_type_idx" ON "agent_events" USING btree ("event_type");
  CREATE INDEX IF NOT EXISTS "agent_events_candidate_idx" ON "agent_events" USING btree ("candidate_id");
  CREATE INDEX IF NOT EXISTS "agent_events_job_idx" ON "agent_events" USING btree ("job_id");
  CREATE INDEX IF NOT EXISTS "agent_events_conversation_id_idx" ON "agent_events" USING btree ("conversation_id");
  CREATE INDEX IF NOT EXISTS "agent_events_session_id_idx" ON "agent_events" USING btree ("session_id");
  CREATE INDEX IF NOT EXISTS "agent_events_updated_at_idx" ON "agent_events" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "agent_events_created_at_idx" ON "agent_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_screening_tasks_fk" FOREIGN KEY ("candidate_screening_tasks_id") REFERENCES "public"."candidate_screening_tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_messages_fk" FOREIGN KEY ("candidate_messages_id") REFERENCES "public"."candidate_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_memory_fk" FOREIGN KEY ("candidate_memory_id") REFERENCES "public"."candidate_memory"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_human_review_tasks_fk" FOREIGN KEY ("human_review_tasks_id") REFERENCES "public"."human_review_tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agent_audit_logs_fk" FOREIGN KEY ("agent_audit_logs_id") REFERENCES "public"."agent_audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_screening_results_fk" FOREIGN KEY ("screening_results_id") REFERENCES "public"."screening_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_readybot_ops_chat_sessions_fk" FOREIGN KEY ("readybot_ops_chat_sessions_id") REFERENCES "public"."readybot_ops_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agent_events_fk" FOREIGN KEY ("agent_events_id") REFERENCES "public"."agent_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_candidate_screening_tasks__idx" ON "payload_locked_documents_rels" USING btree ("candidate_screening_tasks_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_candidate_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("candidate_messages_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_candidate_memory_id_idx" ON "payload_locked_documents_rels" USING btree ("candidate_memory_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_human_review_tasks_id_idx" ON "payload_locked_documents_rels" USING btree ("human_review_tasks_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_agent_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("agent_audit_logs_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_screening_results_id_idx" ON "payload_locked_documents_rels" USING btree ("screening_results_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_readybot_ops_chat_sessions_idx" ON "payload_locked_documents_rels" USING btree ("readybot_ops_chat_sessions_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_agent_events_id_idx" ON "payload_locked_documents_rels" USING btree ("agent_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "candidates_ready_bot_missing_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "candidate_screening_tasks_missing_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "candidate_screening_tasks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "candidate_messages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "candidate_memory_confirmed_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "candidate_memory_unconfirmed_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "candidate_memory_missing_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "candidate_memory_important_corrections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "candidate_memory_risk_flags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "candidate_memory" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "human_review_tasks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agent_audit_logs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "screening_results_gaps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "screening_results_recommended_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "screening_results" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "readybot_ops_chat_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agent_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ready_bot_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "candidates_ready_bot_missing_fields" CASCADE;
  DROP TABLE "candidate_screening_tasks_missing_fields" CASCADE;
  DROP TABLE "candidate_screening_tasks" CASCADE;
  DROP TABLE "candidate_messages" CASCADE;
  DROP TABLE "candidate_memory_confirmed_fields" CASCADE;
  DROP TABLE "candidate_memory_unconfirmed_fields" CASCADE;
  DROP TABLE "candidate_memory_missing_fields" CASCADE;
  DROP TABLE "candidate_memory_important_corrections" CASCADE;
  DROP TABLE "candidate_memory_risk_flags" CASCADE;
  DROP TABLE "candidate_memory" CASCADE;
  DROP TABLE "human_review_tasks" CASCADE;
  DROP TABLE "agent_audit_logs" CASCADE;
  DROP TABLE "screening_results_gaps" CASCADE;
  DROP TABLE "screening_results_recommended_questions" CASCADE;
  DROP TABLE "screening_results" CASCADE;
  DROP TABLE "readybot_ops_chat_sessions" CASCADE;
  DROP TABLE "agent_events" CASCADE;
  DROP TABLE "ready_bot_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_candidate_screening_tasks_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_candidate_messages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_candidate_memory_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_human_review_tasks_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_agent_audit_logs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_screening_results_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_readybot_ops_chat_sessions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_agent_events_fk";
  
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'moderator', 'user');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  ALTER TABLE "purchases" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "purchases" ALTER COLUMN "status" SET DEFAULT 'active'::text;
  DROP TYPE "public"."enum_purchases_status";
  CREATE TYPE "public"."enum_purchases_status" AS ENUM('active', 'cancelled');
  ALTER TABLE "purchases" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."enum_purchases_status";
  ALTER TABLE "purchases" ALTER COLUMN "status" SET DATA TYPE "public"."enum_purchases_status" USING "status"::"public"."enum_purchases_status";
  ALTER TABLE "purchases" ALTER COLUMN "source" SET DATA TYPE text;
  ALTER TABLE "purchases" ALTER COLUMN "source" SET DEFAULT 'mock_checkout'::text;
  DROP TYPE "public"."enum_purchases_source";
  CREATE TYPE "public"."enum_purchases_source" AS ENUM('mock_checkout', 'admin');
  ALTER TABLE "purchases" ALTER COLUMN "source" SET DEFAULT 'mock_checkout'::"public"."enum_purchases_source";
  ALTER TABLE "purchases" ALTER COLUMN "source" SET DATA TYPE "public"."enum_purchases_source" USING "source"::"public"."enum_purchases_source";
  DROP INDEX "payload_locked_documents_rels_candidate_screening_tasks__idx";
  DROP INDEX "payload_locked_documents_rels_candidate_messages_id_idx";
  DROP INDEX "payload_locked_documents_rels_candidate_memory_id_idx";
  DROP INDEX "payload_locked_documents_rels_human_review_tasks_id_idx";
  DROP INDEX "payload_locked_documents_rels_agent_audit_logs_id_idx";
  DROP INDEX "payload_locked_documents_rels_screening_results_id_idx";
  DROP INDEX "payload_locked_documents_rels_readybot_ops_chat_sessions_idx";
  DROP INDEX "payload_locked_documents_rels_agent_events_id_idx";
  ALTER TABLE "media" ALTER COLUMN "prefix" SET DEFAULT 'uploads';
  ALTER TABLE "users" DROP COLUMN "display_name";
  ALTER TABLE "users" DROP COLUMN "invitation_token";
  ALTER TABLE "users" DROP COLUMN "invitation_expires";
  ALTER TABLE "users" DROP COLUMN "invitation_sent_at";
  ALTER TABLE "users" DROP COLUMN "session_id";
  ALTER TABLE "candidates" DROP COLUMN "session_id";
  ALTER TABLE "candidates" DROP COLUMN "ready_bot_ready_bot_enabled";
  ALTER TABLE "candidates" DROP COLUMN "ready_bot_screening_status";
  ALTER TABLE "candidates" DROP COLUMN "ready_bot_whatsapp_number";
  ALTER TABLE "candidates" DROP COLUMN "ready_bot_whatsapp_opt_in";
  ALTER TABLE "candidates" DROP COLUMN "ready_bot_whatsapp_opt_in_at";
  ALTER TABLE "candidates" DROP COLUMN "ready_bot_preferred_contact_channel";
  ALTER TABLE "candidates" DROP COLUMN "ready_bot_last_screened_at";
  ALTER TABLE "candidates" DROP COLUMN "ready_bot_last_contacted_at";
  ALTER TABLE "candidates" DROP COLUMN "ready_bot_last_reply_at";
  ALTER TABLE "candidates" DROP COLUMN "ready_bot_screening_summary";
  ALTER TABLE "candidates" DROP COLUMN "ready_bot_screening_confidence";
  ALTER TABLE "employers" DROP COLUMN "session_id";
  ALTER TABLE "purchases" DROP COLUMN "payment_gateway_id";
  ALTER TABLE "interviews" DROP COLUMN "candidate_accepted_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "candidate_screening_tasks_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "candidate_messages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "candidate_memory_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "human_review_tasks_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "agent_audit_logs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "screening_results_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "readybot_ops_chat_sessions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "agent_events_id";
  DROP TYPE "public"."enum_candidates_ready_bot_screening_status";
  DROP TYPE "public"."enum_candidates_ready_bot_preferred_contact_channel";
  DROP TYPE "public"."enum_candidate_screening_tasks_status";
  DROP TYPE "public"."enum_candidate_screening_tasks_channel";
  DROP TYPE "public"."enum_candidate_messages_channel";
  DROP TYPE "public"."enum_candidate_messages_direction";
  DROP TYPE "public"."enum_candidate_messages_status";
  DROP TYPE "public"."enum_human_review_tasks_status";
  DROP TYPE "public"."enum_screening_results_status";
  DROP TYPE "public"."enum_agent_events_event_type";`)
}
