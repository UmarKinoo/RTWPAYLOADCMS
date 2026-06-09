import type { Payload } from 'payload'
import type { UIMessage } from 'ai'

export type ReadyBotChatSessionSummary = {
  id: string
  title: string
  updatedAt: string
  preview: string | null
}

export type ReadyBotChatSessionDetail = ReadyBotChatSessionSummary & {
  locale: string
  messages: UIMessage[]
  memorySummary: string | null
  keyFacts: string[]
}

function firstUserPreview(messages: UIMessage[]): string | null {
  for (const m of messages) {
    if (m.role !== 'user') continue
    const text = m.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
      .trim()
    if (text) return text.length > 80 ? `${text.slice(0, 80)}…` : text
  }
  return null
}

export function deriveChatTitle(messages: UIMessage[], fallback = 'New chat'): string {
  for (const m of messages) {
    if (m.role !== 'user') continue
    const text = m.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
      .trim()
    if (text) {
      const oneLine = text.replace(/\s+/g, ' ')
      return oneLine.length > 56 ? `${oneLine.slice(0, 56)}…` : oneLine
    }
  }
  return fallback
}

function asMessages(value: unknown): UIMessage[] {
  if (!Array.isArray(value)) return []
  return value as UIMessage[]
}

export async function listReadyBotChatSessions(
  payload: Payload,
  userId: string | number,
  limit = 50,
): Promise<ReadyBotChatSessionSummary[]> {
  const result = await payload.find({
    collection: 'readybot-ops-chat-sessions',
    where: { user: { equals: userId } },
    sort: '-updatedAt',
    limit,
    depth: 0,
    overrideAccess: true,
  })

  return result.docs.map((doc) => {
    const messages = asMessages(doc.messages)
    return {
      id: String(doc.id),
      title: doc.title || 'New chat',
      updatedAt: doc.updatedAt,
      preview: firstUserPreview(messages),
    }
  })
}

export async function getReadyBotChatSession(
  payload: Payload,
  sessionId: string | number,
  userId: string | number,
): Promise<ReadyBotChatSessionDetail | null> {
  try {
    const doc = await payload.findByID({
      collection: 'readybot-ops-chat-sessions',
      id: sessionId,
      depth: 0,
      overrideAccess: true,
    })
    const ownerId =
      typeof doc.user === 'object' && doc.user != null ? doc.user.id : doc.user
    if (String(ownerId) !== String(userId)) return null

    const messages = asMessages(doc.messages)
    const keyFacts = Array.isArray(doc.keyFacts)
      ? doc.keyFacts.filter((f): f is string => typeof f === 'string')
      : []
    return {
      id: String(doc.id),
      title: doc.title || 'New chat',
      updatedAt: doc.updatedAt,
      preview: firstUserPreview(messages),
      locale: doc.locale || 'en',
      messages,
      memorySummary: typeof doc.memorySummary === 'string' ? doc.memorySummary : null,
      keyFacts,
    }
  } catch {
    return null
  }
}

export async function createReadyBotChatSession(
  payload: Payload,
  userId: string | number,
  locale: string,
): Promise<ReadyBotChatSessionDetail> {
  const doc = await payload.create({
    collection: 'readybot-ops-chat-sessions',
    data: {
      title: 'New chat',
      user: typeof userId === 'number' ? userId : Number(userId),
      locale,
      messages: [],
    },
    overrideAccess: true,
  })

  return {
    id: String(doc.id),
    title: doc.title || 'New chat',
    updatedAt: doc.updatedAt,
    preview: null,
    locale: doc.locale || locale,
    messages: [],
    memorySummary: null,
    keyFacts: [],
  }
}

export async function saveReadyBotChatSessionMessages(
  payload: Payload,
  sessionId: string | number,
  userId: string | number,
  messages: UIMessage[],
): Promise<ReadyBotChatSessionSummary | null> {
  const existing = await getReadyBotChatSession(payload, sessionId, userId)
  if (!existing) return null

  const title =
    existing.title === 'New chat' ? deriveChatTitle(messages) : existing.title

  const doc = await payload.update({
    collection: 'readybot-ops-chat-sessions',
    id: sessionId,
    data: {
      messages: messages as never,
      title,
    },
    overrideAccess: true,
  })

  const saved = asMessages(doc.messages)
  return {
    id: String(doc.id),
    title: doc.title || 'New chat',
    updatedAt: doc.updatedAt,
    preview: firstUserPreview(saved),
  }
}

export async function renameReadyBotChatSession(
  payload: Payload,
  sessionId: string | number,
  userId: string | number,
  title: string,
): Promise<ReadyBotChatSessionSummary | null> {
  const existing = await getReadyBotChatSession(payload, sessionId, userId)
  if (!existing) return null

  const trimmed = title.trim().slice(0, 120) || 'New chat'
  const doc = await payload.update({
    collection: 'readybot-ops-chat-sessions',
    id: sessionId,
    data: { title: trimmed },
    overrideAccess: true,
  })

  const messages = asMessages(doc.messages)
  return {
    id: String(doc.id),
    title: doc.title || trimmed,
    updatedAt: doc.updatedAt,
    preview: firstUserPreview(messages),
  }
}

export async function deleteReadyBotChatSession(
  payload: Payload,
  sessionId: string | number,
  userId: string | number,
): Promise<boolean> {
  const existing = await getReadyBotChatSession(payload, sessionId, userId)
  if (!existing) return false

  await payload.delete({
    collection: 'readybot-ops-chat-sessions',
    id: sessionId,
    overrideAccess: true,
  })
  return true
}
