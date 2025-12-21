import { Footer } from '@/components/site/footer'
import { Header } from '@/components/site/header'
import { Main } from '@/components/ds'
import { HeaderThemeProvider } from '@/providers/HeaderTheme'

export const dynamic = 'force-dynamic'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <HeaderThemeProvider>
      <Header />
      <Main className="flex-1">{children}</Main>
      <Footer />
    </HeaderThemeProvider>
  )
}
