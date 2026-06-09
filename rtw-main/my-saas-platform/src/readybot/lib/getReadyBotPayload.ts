import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'

/** One Payload instance per request (layout + page share the same pool). */
export const getReadyBotPayload = cache(async () => getPayload({ config }))
