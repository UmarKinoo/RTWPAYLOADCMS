'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from 'ai'
import { Loader2, Send, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { ReadyBotChatSessionSummary } from '@/lib/readybot/chatSessions'
import { setMessageText } from '@/lib/readybot/chatMessageUtils'
import { ReadyBotChatMessage, ReadyBotChatWelcome } from './ReadyBotChatMessage'
import { readybotDark } from './readybot-ui'
import { cn } from '@/lib/utils'

type ReadyBotChatThreadProps = {
  locale: string
  sessionId: string
  initialMessages: UIMessage[]
  onSessionUpdated: (summary: ReadyBotChatSessionSummary) => void
}

export function ReadyBotChatThread({
  locale,
  sessionId,
  initialMessages,
  onSessionUpdated,
}: ReadyBotChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevStatusRef = useRef<string>('ready')
  const [input, setInput] = useState('')

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/readybot/chat',
        credentials: 'include',
        body: { locale, sessionId },
      }),
    [locale, sessionId],
  )

  const refreshSessionSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/readybot/chat/sessions/${sessionId}`, {
        credentials: 'include',
      })
      const json = await res.json()
      if (res.ok && json.success && json.session) {
        onSessionUpdated({
          id: json.session.id,
          title: json.session.title,
          updatedAt: json.session.updatedAt,
          preview: json.session.preview ?? null,
        })
      }
    } catch {
      // Best-effort sidebar refresh.
    }
  }, [sessionId, onSessionUpdated])

  const {
    messages,
    sendMessage,
    status,
    error,
    addToolApprovalResponse,
    stop,
    setMessages,
    regenerate,
  } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onFinish: async () => {
      await refreshSessionSummary()
    },
  })

  const isBusy = status === 'submitted' || status === 'streaming'

  const persistMessages = useCallback(
    async (msgs: UIMessage[]) => {
      const res = await fetch(`/api/readybot/chat/sessions/${sessionId}/messages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs }),
        credentials: 'include',
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed to save messages')
      }
      const json = await res.json()
      if (json.success && json.session) {
        onSessionUpdated(json.session)
      }
    },
    [sessionId, onSessionUpdated],
  )

  // Persist partial output when the user stops mid-stream (onFinish may not run).
  useEffect(() => {
    const prev = prevStatusRef.current
    if (
      (prev === 'streaming' || prev === 'submitted') &&
      status === 'ready' &&
      messages.length > 0
    ) {
      void persistMessages(messages).catch(() => {})
    }
    prevStatusRef.current = status
  }, [status, messages, persistMessages])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  useEffect(() => {
    if (stickToBottomRef.current) {
      scrollToBottom(messages.length <= 2 ? 'auto' : 'smooth')
    }
  }, [messages, status, scrollToBottom])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distance < 96
  }

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [input])

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || isBusy) return
    stickToBottomRef.current = true
    void sendMessage({ text })
    setInput('')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  const handleEditSubmit = async (messageId: string, newText: string) => {
    if (isBusy) {
      stop()
    }
    const idx = messages.findIndex((m) => m.id === messageId)
    if (idx === -1) return

    const updated = setMessageText(messages[idx], newText)
    const trimmed = [...messages.slice(0, idx), updated]
    setMessages(trimmed)

    try {
      await persistMessages(trimmed)
      stickToBottomRef.current = true
      await regenerate({ messageId: updated.id })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Edit failed')
    }
  }

  const handleRegenerate = async (messageId: string) => {
    if (isBusy) return
    stickToBottomRef.current = true
    try {
      await regenerate({ messageId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Regenerate failed')
    }
  }

  const handleStop = () => {
    stop()
  }

  const showWelcome = messages.length === 0

  const messageActions = {
    canMutate: !isBusy,
    onEditSubmit: handleEditSubmit,
    onRegenerate: handleRegenerate,
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
      >
        {showWelcome ? <ReadyBotChatWelcome /> : null}
        <div className="mx-auto w-full max-w-3xl">
          {messages.map((m) => (
            <ReadyBotChatMessage
              key={m.id}
              message={m}
              addToolApprovalResponse={addToolApprovalResponse}
              isBusy={isBusy}
              actions={messageActions}
            />
          ))}
          {isBusy && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {status === 'submitted' ? 'Sending…' : 'ReadyBot is typing…'}
            </div>
          )}
          {error && (
            <p className="px-4 py-2 text-sm text-red-400">
              {error.message || 'Something went wrong. Try again.'}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-800 bg-zinc-950/90 px-4 py-4">
        <form
          className="mx-auto flex w-full max-w-3xl items-end gap-2"
          onSubmit={onSubmit}
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message ReadyBot…"
            rows={1}
            disabled={isBusy}
            className="max-h-[200px] min-h-[44px] resize-none border-zinc-700 bg-zinc-900 py-3 text-zinc-100 placeholder:text-zinc-500"
          />
          {isBusy ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleStop}
              className="h-11 w-11 shrink-0 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              aria-label="Stop generating"
            >
              <Square className="h-4 w-4 fill-current" aria-hidden />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="h-11 w-11 shrink-0 bg-emerald-600 hover:bg-emerald-500"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </form>
        <p className={cn('mx-auto mt-2 max-w-3xl text-center text-[11px]', readybotDark.muted)}>
          Enter to send · Shift+Enter for new line · Hover messages to edit or regenerate
        </p>
      </div>
    </div>
  )
}
