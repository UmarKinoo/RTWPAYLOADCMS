'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import {
  Loader2,
  MessageSquarePlus,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react'
import type { UIMessage } from 'ai'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { ReadyBotChatSessionSummary } from '@/lib/readybot/chatSessions'
import { ReadyBotChatThread } from './ReadyBotChatThread'
import { readybotDark } from './readybot-ui'
import { cn } from '@/lib/utils'

type ReadyBotChatProps = {
  locale: string
}

type LoadedSession = {
  id: string
  title: string
  messages: UIMessage[]
}

export function ReadyBotChat({ locale }: ReadyBotChatProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatParam = searchParams.get('chat')

  const [sessions, setSessions] = useState<ReadyBotChatSessionSummary[]>([])
  const [activeSession, setActiveSession] = useState<LoadedSession | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [creating, setCreating] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)

  const setChatInUrl = useCallback(
    (sessionId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', 'chat')
      if (sessionId) {
        params.set('chat', sessionId)
      } else {
        params.delete('chat')
      }
      router.replace(`/${locale}/readybot?${params.toString()}`, { scroll: false })
    },
    [locale, router, searchParams],
  )

  const fetchSessions = useCallback(async () => {
    const res = await fetch('/api/readybot/chat/sessions', { credentials: 'include' })
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to load chats')
    }
    return json.sessions as ReadyBotChatSessionSummary[]
  }, [])

  const loadSession = useCallback(async (sessionId: string) => {
    setSessionLoading(true)
    try {
      const res = await fetch(`/api/readybot/chat/sessions/${sessionId}`, {
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load chat')
      }
      setActiveSession({
        id: json.session.id,
        title: json.session.title,
        messages: json.session.messages ?? [],
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load chat')
      setActiveSession(null)
      setChatInUrl(null)
    } finally {
      setSessionLoading(false)
    }
  }, [setChatInUrl])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setListLoading(true)
      try {
        const list = await fetchSessions()
        if (cancelled) return
        setSessions(list)
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Failed to load chats')
        }
      } finally {
        if (!cancelled) setListLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fetchSessions])

  useEffect(() => {
    if (listLoading) return

    // Don't touch the URL if the user navigated to a different dashboard tab
    const tabParam = searchParams.get('tab')
    if (tabParam !== null && tabParam !== 'chat') return

    if (!chatParam) {
      if (sessions.length > 0) {
        setChatInUrl(sessions[0].id)
      }
      return
    }

    if (activeSession?.id === chatParam) return
    void loadSession(chatParam)
  }, [chatParam, listLoading, sessions, activeSession?.id, loadSession, setChatInUrl, searchParams])

  const handleNewChat = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/readybot/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Failed to create chat')
        return
      }
      const session = json.session as ReadyBotChatSessionSummary
      setSessions((prev) => [session, ...prev])
      setActiveSession({ id: session.id, title: session.title, messages: [] })
      setChatInUrl(session.id)
      setSidebarOpen(false)
    } catch {
      toast.error('Request failed')
    } finally {
      setCreating(false)
    }
  }

  const handleSelectSession = (sessionId: string) => {
    if (sessionId === activeSession?.id) return
    setChatInUrl(sessionId)
    void loadSession(sessionId)
    setSidebarOpen(false)
  }

  const handleSessionUpdated = (summary: ReadyBotChatSessionSummary) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== summary.id)
      return [summary, ...next]
    })
    setActiveSession((prev) =>
      prev && prev.id === summary.id ? { ...prev, title: summary.title } : prev,
    )
  }

  const handleRename = async () => {
    if (!activeSession) return
    setActionBusy(true)
    try {
      const res = await fetch(`/api/readybot/chat/sessions/${activeSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameValue }),
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Rename failed')
        return
      }
      handleSessionUpdated(json.session)
      setRenameOpen(false)
      toast.success('Chat renamed')
    } catch {
      toast.error('Request failed')
    } finally {
      setActionBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!activeSession) return
    setActionBusy(true)
    try {
      const res = await fetch(`/api/readybot/chat/sessions/${activeSession.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Delete failed')
        return
      }
      const remaining = sessions.filter((s) => s.id !== activeSession.id)
      setSessions(remaining)
      setDeleteOpen(false)
      toast.success('Chat deleted')

      if (remaining.length > 0) {
        setChatInUrl(remaining[0].id)
        await loadSession(remaining[0].id)
      } else {
        setActiveSession(null)
        setChatInUrl(null)
        await handleNewChat()
      }
    } catch {
      toast.error('Request failed')
    } finally {
      setActionBusy(false)
    }
  }

  const activeTitle = activeSession?.title ?? 'Ops chat'

  return (
    <div
      className={cn(
        'flex h-[calc(100dvh-10.5rem)] min-h-[520px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60',
        readybotDark.card,
      )}
    >
      <aside
        className={cn(
          'flex shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/80 transition-[width] duration-200',
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0',
        )}
      >
        <div className="flex items-center gap-2 border-b border-zinc-800 p-3">
          <Button
            type="button"
            size="sm"
            className="flex-1 justify-start gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
            onClick={handleNewChat}
            disabled={creating}
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <MessageSquarePlus className="h-4 w-4" aria-hidden />
            )}
            New chat
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {listLoading ? (
            <div className="flex items-center justify-center py-8 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            </div>
          ) : sessions.length === 0 ? (
            <p className={cn('px-2 py-4 text-center text-xs', readybotDark.muted)}>
              No chats yet. Start a new conversation.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {sessions.map((session) => {
                const active = session.id === activeSession?.id
                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectSession(session.id)}
                      className={cn(
                        'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
                        active
                          ? 'bg-zinc-800 text-zinc-50'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
                      )}
                    >
                      <p className="truncate text-sm font-medium">{session.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                        {session.preview ?? 'Empty chat'}
                        {' · '}
                        {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-zinc-800 px-3 py-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-zinc-400 hover:text-zinc-100"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? 'Hide chat history' : 'Show chat history'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" aria-hidden />
            ) : (
              <PanelLeftOpen className="h-4 w-4" aria-hidden />
            )}
          </Button>
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-100">{activeTitle}</p>
            <p className={cn('truncate text-[11px]', readybotDark.muted)}>
              Streaming ops assistant with tools &amp; approvals
            </p>
          </div>
          {activeSession ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-zinc-400 hover:text-zinc-100"
                  aria-label="Chat options"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-zinc-700 bg-zinc-900 text-zinc-100">
                <DropdownMenuItem
                  onClick={() => {
                    setRenameValue(activeSession.title)
                    setRenameOpen(true)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" aria-hidden />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-300"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </header>

        {sessionLoading || listLoading ? (
          <div className="flex flex-1 items-center justify-center text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          </div>
        ) : activeSession ? (
          <ReadyBotChatThread
            key={activeSession.id}
            locale={locale}
            sessionId={activeSession.id}
            initialMessages={activeSession.messages}
            onSessionUpdated={handleSessionUpdated}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
            <p className={cn('text-sm', readybotDark.muted)}>Start a conversation with ReadyBot.</p>
            <Button
              type="button"
              onClick={handleNewChat}
              disabled={creating}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" aria-hidden />
              New chat
            </Button>
          </div>
        )}
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription className={readybotDark.muted}>
              Give this conversation a short title.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="border-zinc-700 bg-zinc-950 text-zinc-100"
            maxLength={120}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameOpen(false)} disabled={actionBusy}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={actionBusy || !renameValue.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Delete chat?</DialogTitle>
            <DialogDescription className={readybotDark.muted}>
              This permanently removes the conversation history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={actionBusy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionBusy}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
