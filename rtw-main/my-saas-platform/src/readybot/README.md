# ReadyBot

AI screening inside ReadyToWork: CV → profile understanding → role fit → targeted WhatsApp → reply extraction → safe updates or human review.

**Full architecture, chat docs, gaps & roadmap:** [`docs/READYBOT.md`](../../docs/READYBOT.md)

## Pipeline (all phases implemented)

```txt
Candidate + CV
  → extract PDF/text + LLM summary (CandidateMemory.cvSummary)
  → compare to job-postings title/description (Screening Result)
  → create screening task + tailored questions (LLM)
  → WhatsApp template (first) / session message (follow-ups)
  → inbound webhook → LLM extract → validate → auto-update OR human review
  → follow-ups (2d, max 3) → unresponsive
```

## Ops dashboard (shadcn, dark)

Admin-only frontend (not Payload admin):

`/{locale}/readybot` — overview stats, **Live** tab (polls `/api/readybot/live-logs` every 3.5s), tabs for results / tasks / messages / memory / human review / audit / pipeline. Candidate detail: `/{locale}/readybot/candidates/{id}`.

Activity is written to `agent-audit-logs` via `logReadyBotActivity()` (phase, step, tool, candidate, status).

## Commands

```bash
pnpm seed:readybot-test-candidates  # 10 QA candidates (gaps, opt-in, statuses)
pnpm readybot:scan                  # Scan incomplete candidates (≤50), run full pipeline
pnpm readybot:followup              # Daily-style follow-up job (manual)
```

QA candidates use password `ReadyBotTest2026!` and emails `readybot.*@readybot-qa.example.test`.

## Trigger.dev

Config: `trigger.config.ts`. Tasks: `src/trigger/readybotTasks.ts`

- `readybot-scan-incomplete` — cron `*/15 * * * *`
- `readybot-send-followups` — cron `0 9 * * *`
- `readybot-process-inbound` — event task (wire from webhook when deployed)

Deploy: `npx trigger.dev@latest deploy` with `TRIGGER_PROJECT_REF` and `TRIGGER_SECRET_KEY`.

## Environment

```env
OPENAI_API_KEY=                    # or READYBOT_LLM_API_KEY
READYBOT_LLM_MODEL=gpt-4o-mini
READYBOT_DEFAULT_JOB_POSTING_ID=   # optional job for role fit
READYBOT_WHATSAPP_TEMPLATE_NAME=profile_completion_v1
READYBOT_USE_LANGGRAPH=1           # optional LangGraph wrapper

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=

TRIGGER_PROJECT_REF=
TRIGGER_SECRET_KEY=
```

## API

- `GET/POST /api/whatsapp/webhook` — Meta verify + inbound
- `POST /api/readybot/approve-update` — admin approves human review
- `POST /api/readybot/reject-update`

## Collections (Payload → ReadyBot group)

- `screening-results` — fit score, gaps, questions
- `candidate-screening-tasks`
- `candidate-messages`
- `candidate-memory`
- `human-review-tasks`
- `agent-audit-logs`

## Safety

See `tools/permissionTool.ts` — auto-update allowlist only; visa/skill/hiring decisions → human review.
