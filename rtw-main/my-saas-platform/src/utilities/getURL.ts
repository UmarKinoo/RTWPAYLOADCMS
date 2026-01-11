import canUseDOM from './canUseDOM'

export const getServerSideURL = () => {
  // Check multiple environment variables for production URL
  // Priority: NEXT_PUBLIC_SERVER_URL > APP_URL > NEXT_PUBLIC_APP_URL > VERCEL_PROJECT_PRODUCTION_URL > localhost
  return (
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')
  )
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  // Always return a valid URL, fallback to localhost if NEXT_PUBLIC_SERVER_URL is not set
  return process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
}
