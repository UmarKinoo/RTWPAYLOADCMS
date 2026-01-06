import { HeaderThemeProvider } from '@/providers/HeaderTheme'

export const dynamic = 'force-dynamic'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  return <HeaderThemeProvider>{children}</HeaderThemeProvider>
}
