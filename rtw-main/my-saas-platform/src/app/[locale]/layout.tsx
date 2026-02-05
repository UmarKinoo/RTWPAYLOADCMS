import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Geist as FontSans } from 'next/font/google'
import { Geist_Mono as FontMono } from 'next/font/google'
import { Cairo } from 'next/font/google'
// import { SessionProvider } from '@/components/providers/SessionProvider' // Disabled: NextAuth not in use (Google login disabled)
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import { getServerSideURL } from '@/utilities/getURL'
import type { Metadata } from 'next'
import Script from 'next/script'
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
  // Do not set title/description here. Each page sets them via generateMetadata so
  // Next.js puts <title> and <link rel="canonical"> in <head> reliably.
  metadataBase: new URL(getServerSideURL()),
  verification: {
    google: 'google80006dce542d45d5',
  },
  icons: {
    icon: [
      { url: '/assets/RTW-Logo-VF-Icon-01.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/RTW-Logo-VF-Icon-01.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/RTW-Logo-VF-Icon-01.png', sizes: '48x48', type: 'image/png' },
      { url: '/assets/RTW-Logo-VF-Icon-01.png', sizes: '96x96', type: 'image/png' },
      { url: '/assets/RTW-Logo-VF-Icon-01.png', sizes: '192x192', type: 'image/png' },
      { url: '/assets/RTW-Logo-VF-Icon-01.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/assets/RTW-Logo-VF-Icon-01.png',
    apple: [
      { url: '/assets/RTW-Logo-VF-Icon-01.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  // No openGraph/twitter here: Next.js 15 can put <title> and <link canonical> in body when
  // layout + page metadata are merged with og/twitter. Each page sets its own via generateMetadata.
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
      <head>
        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KCL74CX7');`,
          }}
        />
      </head>
      <body className={cn('flex flex-col min-h-screen', isArabic ? cairo.className : fontSans.className)}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KCL74CX7"
            title="Google Tag Manager"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        <Toaster richColors expand={true} closeButton />
        <Analytics />
      </body>
    </html>
  )
}

