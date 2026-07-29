-- Enable RLS on ReadyBot tables exposed via PostgREST.
-- Payload CMS connects as postgres (bypasses RLS); no policies are required.
-- This blocks anon/authenticated API access and clears Supabase linter errors.

ALTER TABLE IF EXISTS public.ready_bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidates_ready_bot_missing_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidate_screening_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidate_screening_tasks_missing_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidate_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidate_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidate_memory_confirmed_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidate_memory_unconfirmed_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidate_memory_missing_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidate_memory_important_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidate_memory_risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.human_review_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.screening_results_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.screening_results_recommended_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.readybot_ops_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_events ENABLE ROW LEVEL SECURITY;
