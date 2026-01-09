import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Geist as FontSans } from 'next/font/google'
import { Geist_Mono as FontMono } from 'next/font/google'
import { Cairo } from 'next/font/google'
import { ThemeProvider } from '@/components/theme/theme-provider'
// import { SessionProvider } from '@/components/providers/SessionProvider' // Disabled: NextAuth not in use (Google login disabled)
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import { getServerSideURL } from '@/utilities/getURL'
import type { Metadata } from 'next'
import '@/globals.css'

const fontSans = FontSans({
  subsets: ['latin'],
})

const fontMono = FontMono({
  subsets: ['latin'],
})

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
})

export const metadata: Metadata = {
  title: 'Ready to Work',
  description: 'Connect with talented candidates and find the right talent for your team. Ready to Work - Your trusted partner for hiring.',
  metadataBase: new URL(getServerSideURL()),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: getServerSideURL(),
    siteName: 'Ready to Work',
    title: 'Ready to Work',
    description: 'Connect with talented candidates and find the right talent for your team.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ready to Work',
    description: 'Connect with talented candidates and find the right talent for your team.',
  },
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale })

  // Determine font based on locale
  const isArabic = locale === 'ar'
  const fontClassName = isArabic ? cairo.variable : `${fontSans.className} ${fontMono.className}`

  return (
    <html
      lang={locale}
      dir={isArabic ? 'rtl' : 'ltr'}
      className={cn(fontClassName, 'antialiased')}
      suppressHydrationWarning
    >
      <body className={cn('flex flex-col min-h-screen', isArabic ? cairo.className : fontSans.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
          <Toaster richColors expand={true} closeButton />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

