'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  getToolName,
  isToolUIPart,
  type UIMessage,
} from 'ai'
import { Bot, Check, Copy, Pencil, RefreshCw, User, Wrench, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getMessageText } from '@/lib/readybot/chatMessageUtils'
import { readybotDark } from './readybot-ui'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const WELCOME_TEXT =
  'ReadyBot Ops Assistant online. Ask me to run a scan, list pending reviews, find a candidate, or propose profile edits. Profile changes require your approval before they are saved.'

type ProfileUpdateInput = {
  candidateId?: number
  reason?: string
  fields?: Record<string, unknown>
}

type MessageActions = {
  onEditSubmit?: (messageId: string, newText: string) => void
  onRegenerate?: (messageId: string) => void
  canMutate: boolean
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string' && value.length > 120) return `${value.slice(0, 120)}…`
  return String(value)
}

function ProfileUpdateApprovalCard({
  input,
  approvalId,
  onApprove,
  onDeny,
  disabled,
}: {
  input: ProfileUpdateInput
  approvalId: string
  onApprove: () => void
  onDeny: () => void
  disabled: boolean
}) {
  const fields = input.fields ?? {}
  const entries = Object.entries(fields)

  return (
    <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-3 text-xs">
      <p className="font-medium text-amber-200">Profile update — approval required</p>
      <p className="mt-1 text-zinc-400">
        Candidate #{input.candidateId ?? '?'}
        {input.reason ? ` · ${input.reason}` : ''}
      </p>
      {entries.length > 0 ? (
        <ul className="mt-2 space-y-1 text-zinc-300">
          {entries.map(([key, value]) => (
            <li key={key} className="break-words">
              <span className="text-zinc-500">{key}:</span>{' '}
              <span className="text-zinc-100">{formatFieldValue(value)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-zinc-500">No fields in proposal</p>
      )}
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-500"
          onClick={onApprove}
        >
          <Check className="h-3.5 w-3.5" aria-hidden />
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          className="h-8 gap-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
          onClick={onDeny}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Deny
        </Button>
      </div>
      <p className="mt-2 text-[10px] text-zinc-600">Approval id: {approvalId.slice(0, 8)}…</p>
    </div>
  )
}

function ToolPart({
  part,
  addToolApprovalResponse,
  isBusy,
}: {
  part: UIMessage['parts'][number]
  addToolApprovalResponse: (args: { id: string; approved: boolean; reason?: string }) => void
  isBusy: boolean
}) {
  if (!isToolUIPart(part)) return null
  const name = getToolName(part)
  const state = part.state

  if (name === 'updateCandidateProfile' && state === 'approval-requested' && part.approval) {
    return (
      <ProfileUpdateApprovalCard
        input={(part.input ?? {}) as ProfileUpdateInput}
        approvalId={part.approval.id}
        disabled={isBusy}
        onApprove={() => addToolApprovalResponse({ id: part.approval!.id, approved: true })}
        onDeny={() =>
          addToolApprovalResponse({
            id: part.approval!.id,
            approved: false,
            reason: 'Denied by admin',
          })
        }
      />
    )
  }

  if (name === 'updateCandidateProfile' && state === 'approval-responded' && part.approval) {
    return (
      <div className="mt-3 rounded-lg border border-zinc-700/80 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-400">
        Profile update {part.approval.approved ? 'approved — applying…' : 'denied'}
      </div>
    )
  }

  if (name === 'updateCandidateProfile' && state === 'output-denied') {
    return (
      <div className="mt-3 rounded-lg border border-zinc-700/80 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-400">
        Profile update was not applied (denied).
      </div>
    )
  }

  let detail = ''
  if (state === 'output-available' && 'output' in part) {
    detail = JSON.stringify(part.output, null, 2).slice(0, 500)
  } else if (state === 'output-error' && 'errorText' in part) {
    detail = part.errorText
  } else if (state !== 'approval-requested' && state !== 'approval-responded') {
    detail = state
  }

  if (!detail && (state === 'approval-requested' || state === 'approval-responded')) {
    return null
  }

  return (
    <div className="mt-3 rounded-lg border border-zinc-700/80 bg-zinc-900/90 px-3 py-2 text-xs">
      <div className="flex items-center gap-1.5 font-medium text-emerald-400/90">
        <Wrench className="h-3 w-3 shrink-0" aria-hidden />
        {name}
        <span className="text-zinc-500">({state})</span>
      </div>
      {detail ? (
        <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words text-zinc-400">
          {detail}
        </pre>
      ) : null}
    </div>
  )
}

function renderParts(
  message: UIMessage,
  addToolApprovalResponse: (args: { id: string; approved: boolean; reason?: string }) => void,
  isBusy: boolean,
) {
  return message.parts.map((part, index) => {
    if (part.type === 'text') {
      const chunks = part.text.split(/(\/[\w-]+\/readybot\/candidates\/\d+)/g)
      return (
        <span key={index} className="whitespace-pre-wrap break-words">
          {chunks.map((chunk, i) =>
            chunk.match(/^\/[\w-]+\/readybot\/candidates\/\d+$/) ? (
              <Link
                key={i}
                href={chunk}
                className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
              >
                {chunk}
              </Link>
            ) : (
              <span key={i}>{chunk}</span>
            ),
          )}
        </span>
      )
    }
    if (isToolUIPart(part)) {
      return (
        <ToolPart
          key={index}
          part={part}
          addToolApprovalResponse={addToolApprovalResponse}
          isBusy={isBusy}
        />
      )
    }
    return null
  })
}

function copyMessageText(message: UIMessage) {
  const text = getMessageText(message)
  if (!text) return
  void navigator.clipboard.writeText(text).then(() => toast.success('Copied'))
}

export function ReadyBotChatMessage({
  message,
  addToolApprovalResponse,
  isBusy,
  actions,
}: {
  message: UIMessage
  addToolApprovalResponse: (args: { id: string; approved: boolean; reason?: string }) => void
  isBusy: boolean
  actions?: MessageActions
}) {
  const isUser = message.role === 'user'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => getMessageText(message))
  const hasText = getMessageText(message).trim().length > 0
  const canMutate = actions?.canMutate ?? false

  const submitEdit = () => {
    const text = draft.trim()
    if (!text || !actions?.onEditSubmit) return
    actions.onEditSubmit(message.id, text)
    setEditing(false)
  }

  return (
    <div
      className={cn(
        'group flex w-full gap-3 px-4 py-3',
        isUser ? 'bg-zinc-900/40' : 'bg-transparent',
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
          isUser
            ? 'border-zinc-600 bg-zinc-800 text-zinc-300'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        )}
      >
        {isUser ? <User className="h-4 w-4" aria-hidden /> : <Bot className="h-4 w-4" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-xs font-medium text-zinc-500">{isUser ? 'You' : 'ReadyBot'}</p>
          {canMutate && hasText && !editing && !isBusy ? (
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-500 hover:text-zinc-200"
                aria-label="Copy message"
                onClick={() => copyMessageText(message)}
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
              </Button>
              {isUser && actions?.onEditSubmit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-500 hover:text-zinc-200"
                  aria-label="Edit message"
                  onClick={() => {
                    setDraft(getMessageText(message))
                    setEditing(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </Button>
              ) : null}
              {!isUser && actions?.onRegenerate ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-500 hover:text-zinc-200"
                  aria-label="Regenerate response"
                  onClick={() => actions.onRegenerate!(message.id)}
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="border-zinc-700 bg-zinc-900 text-zinc-100"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500"
                onClick={submitEdit}
                disabled={!draft.trim()}
              >
                Save &amp; resend
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-zinc-100">
            {renderParts(message, addToolApprovalResponse, isBusy)}
          </div>
        )}
      </div>
    </div>
  )
}

export function ReadyBotChatWelcome() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
        <Bot className="h-6 w-6 text-emerald-400" aria-hidden />
      </div>
      <h2 className="text-lg font-medium text-zinc-100">ReadyBot Ops Assistant</h2>
      <p className={cn('mt-2 max-w-lg text-sm', readybotDark.muted)}>{WELCOME_TEXT}</p>
    </div>
  )
}
