/**
 * ESCO API client — server-only.
 * Base URL and version are read from env so the provider can be swapped.
 *
 * ESCO_API_BASE  — default https://ec.europa.eu/esco/api
 * ESCO_VERSION   — default v1.2.0
 */

export class EscoUnavailableError extends Error {
  constructor(
    public readonly status?: number,
    message?: string,
  ) {
    super(message ?? `ESCO API unavailable (HTTP ${status ?? 'network error'})`)
    this.name = 'EscoUnavailableError'
  }
}

function escoBase(): string {
  return (process.env.ESCO_API_BASE ?? 'https://ec.europa.eu/esco/api').replace(/\/$/, '')
}

function escoVersion(): string {
  return process.env.ESCO_VERSION ?? 'v1.2.0'
}

/**
 * Fetch a URL from the ESCO API with timeout, retries, and structured errors.
 * Retry on 5xx or network failure — NOT on 4xx (bad request).
 */
export async function escoFetch(
  path: string,
  params: Record<string, string> = {},
  retries = 2,
): Promise<unknown> {
  const url = new URL(`${escoBase()}${path}`)
  url.searchParams.set('selectedVersion', escoVersion())
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)
    try {
      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        // Next.js — do not cache at the fetch level; we handle caching ourselves
        cache: 'no-store',
      })
      clearTimeout(timeout)

      if (res.status === 429 || res.status >= 500) {
        lastError = new EscoUnavailableError(res.status)
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
          continue
        }
        throw lastError
      }

      if (!res.ok) {
        throw new EscoUnavailableError(res.status, `ESCO returned ${res.status}`)
      }

      return res.json()
    } catch (err) {
      clearTimeout(timeout)
      if (err instanceof EscoUnavailableError) throw err
      // AbortError (timeout) or network error
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
        continue
      }
      throw new EscoUnavailableError(undefined, lastError.message)
    }
  }

  throw lastError ?? new EscoUnavailableError()
}
