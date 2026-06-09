import type { GlobalConfig } from 'payload'
import { allowOnlyAdmin } from '@/access/allowOnlyAdmin'

export const ReadyBotSettings: GlobalConfig = {
  slug: 'ready-bot-settings',
  label: 'ReadyBot Settings',
  access: {
    read: allowOnlyAdmin,
    update: allowOnlyAdmin,
  },
  admin: {
    group: 'ReadyBot',
    hidden: true,
  },
  fields: [
    {
      name: 'useLangGraphMultiAgent',
      type: 'checkbox',
      label: 'Use LangGraph multi-agent scan',
      defaultValue: true,
      admin: {
        description:
          'When enabled, scheduled scans partition the candidate queue across parallel scanner agents (LangGraph).',
      },
    },
    {
      name: 'parallelAgentCount',
      type: 'number',
      label: 'Parallel scanner agents',
      min: 1,
      max: 8,
      defaultValue: 3,
    },
    {
      name: 'useLangGraphChatBrain',
      type: 'checkbox',
      label: 'LangGraph ops chat brain',
      defaultValue: true,
      admin: {
        description:
          'Pre-classify chat intent and run tools via LangGraph before streaming the assistant reply.',
      },
    },
    {
      name: 'automatedScanEnabled',
      type: 'checkbox',
      label: 'Enable Trigger automated scan',
      defaultValue: true,
      admin: {
        description:
          'When off, the Trigger.dev scheduled scan task exits without processing the queue.',
      },
    },
    {
      name: 'scanIntervalMinutes',
      type: 'number',
      label: 'Minimum minutes between automated scans',
      min: 5,
      max: 1440,
      defaultValue: 15,
      admin: {
        description:
          'Trigger ticks every 15 minutes; scans only run when this interval has elapsed since the last automated run.',
      },
    },
    {
      name: 'automatedFollowUpEnabled',
      type: 'checkbox',
      label: 'Enable Trigger automated follow-ups',
      defaultValue: true,
    },
    {
      name: 'lastAutomatedScanAt',
      type: 'date',
      label: 'Last automated scan',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'lastAutomatedFollowUpAt',
      type: 'date',
      label: 'Last automated follow-up batch',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}
