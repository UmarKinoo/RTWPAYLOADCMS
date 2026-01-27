'use client'

import React, { useState } from 'react'
import { Link, useRouter, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Menu, LogOut, LayoutDashboard, DollarSign, FileText, Users, BookOpen, Info, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { UserMenu } from '@/components/navbar/UserMenu'
import { CandidateUserMenu } from '@/components/navbar/CandidateUserMenu'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { AvatarCircle } from '@/components/navbar/AvatarCircle'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Separator } from '@/components/ui/separator'
import { clearAuthCookies } from '@/lib/auth'
import { toast } from 'sonner'
import type { Employer, Candidate } from '@/payload-types'

// Logo image - the full combined logo
const logoSrc = '/assets/03bdd9d6f0fa9e8b68944b910c59a8474fc37999.svg'

const SHEET_CLS = cn('flex flex-1 flex-col px-6 pt-20 overflow-y-auto overscroll-contain', 'pb-24 md:pb-6')
const SECTION_TITLE_CLS = 'mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500'
const LINK_BASE_CLS = 'group flex items-center gap-3 rounded-lg transition-all px-4 py-3.5 h-auto min-h-[52px]'
const ICON_BOX_BASE_CLS = 'flex justify-center items-center rounded-lg transition-colors h-10 w-10'

const NAV_THEMES = {
  employer: { activeBg: 'bg-[#f6b500]', activeIcon: 'text-[#f6b500]' },
  candidate: { activeBg: 'bg-[#4644b8]', activeIcon: 'text-[#4644b8]' },
} as const

interface HomepageNavbarProps {
  employer?: Employer | null
  candidate?: Candidate | null
}

function getEmployerDisplayName(employer: Employer): string {
  if (employer.companyName) return employer.companyName
  if (employer.responsiblePerson) return employer.responsiblePerson
  if (employer.email) return employer.email.split('@')[0]
  return 'User'
}

function getCandidateDisplayName(candidate: Candidate): string {
  if (candidate.firstName && candidate.lastName) {
    return `${candidate.firstName} ${candidate.lastName}`
  }
  if (candidate.email) return candidate.email.split('@')[0]
  return 'User'
}

type NavLinkItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> }
type NavCtx = {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (v: boolean) => void
  handleLogout: () => void
  pathname: string | null
  t: (key: string) => string
  navLinks: NavLinkItem[]
  router: { push: (url: string) => void; refresh: () => void }
}

function NavRightSide(props: Readonly<{
  kind: 'employer' | 'candidate' | 'guest'
  employer?: Employer | null
  candidate?: Candidate | null
  ctx: NavCtx
}>) {
  const { kind, employer, candidate, ctx } = props
  if (kind === 'employer' && employer) return <EmployerNavActions employer={employer} ctx={ctx} />
  if (kind === 'candidate' && candidate) return <CandidateNavActions candidate={candidate} ctx={ctx} />
  return <GuestNavActions ctx={ctx} />
}

type NavTheme = (typeof NAV_THEMES)[keyof typeof NAV_THEMES]

function MobileNavSheet(props: Readonly<{
  open: boolean
  onOpenChange: (v: boolean) => void
  theme: NavTheme
  header: React.ReactNode
  navLinks: NavLinkItem[]
  pathname: string | null
  accountSection: React.ReactNode
  footer: React.ReactNode
}>) {
  const { open, onOpenChange, theme, header, navLinks, pathname, accountSection, footer } = props
  const linkCls = (active: boolean) =>
    cn(LINK_BASE_CLS, active ? `${theme.activeBg} text-white` : 'text-[#16252d] hover:bg-gray-50 active:bg-gray-100')
  const iconBoxCls = (active: boolean) =>
    cn(ICON_BOX_BASE_CLS, active ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200')
  const onClose = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 text-[#16252d] flex-shrink-0" aria-label="Toggle menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-[320px] sm:w-[360px] p-0 flex flex-col overflow-hidden z-[110]">
        <VisuallyHidden><SheetTitle>Navigation Menu</SheetTitle></VisuallyHidden>
        <div className={SHEET_CLS}>
          {header}
          <h2 className={SECTION_TITLE_CLS}>Navigation</h2>
          <div className="flex flex-col gap-2 mb-6">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = Boolean(pathname === link.href || pathname?.startsWith(link.href + '/'))
              return (
                <Link key={link.href} href={link.href} className={linkCls(isActive)} onClick={onClose}>
                  <div className={iconBoxCls(isActive)}><Icon className={cn('h-5 w-5', isActive ? 'text-white' : theme.activeIcon)} /></div>
                  <span className={cn('font-medium flex-1 text-base', isActive && 'text-white')}>{link.label}</span>
                </Link>
              )
            })}
          </div>
          <Separator className="mb-6 bg-gray-200" />
          <h2 className={SECTION_TITLE_CLS}>Account</h2>
          <div className="flex flex-col gap-2 mb-6">{accountSection}</div>
          <Separator className="mb-6 bg-gray-200" />
          {footer}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function AccountLink(props: Readonly<{ href: string; isActive: boolean; theme: NavTheme; icon: React.ReactNode; label: string; onClose: () => void }>) {
  const { href, isActive, theme, icon, label, onClose } = props
  const linkCls = cn(LINK_BASE_CLS, isActive ? `${theme.activeBg} text-white` : 'text-[#16252d] hover:bg-gray-50 active:bg-gray-100')
  const iconBoxCls = cn(ICON_BOX_BASE_CLS, isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200')
  return (
    <Link href={href} className={linkCls} onClick={onClose}>
      <div className={iconBoxCls}>{icon}</div>
      <span className={cn('font-medium flex-1 text-base', isActive && 'text-white')}>{label}</span>
    </Link>
  )
}

function EmployerNavActions({ employer, ctx }: Readonly<{ employer: Employer; ctx: NavCtx }>) {
  const { mobileMenuOpen, setMobileMenuOpen, handleLogout, pathname, navLinks } = ctx
  const name = getEmployerDisplayName(employer)
  const onClose = () => setMobileMenuOpen(false)
  const theme = NAV_THEMES.employer
  const header = (
    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
      <AvatarCircle name={name} size="md" />
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-base font-semibold text-[#16252d] truncate">{name}</p>
        {employer.email && <p className="text-xs text-gray-500 truncate mt-0.5">{employer.email}</p>}
        {employer.wallet && (
          <div className="flex gap-4 mt-1.5 text-xs">
            <span className="text-gray-500">Credits: <span className="font-semibold text-[#4644b8]">{employer.wallet.interviewCredits ?? 0}</span></span>
          </div>
        )}
      </div>
    </div>
  )
  const accountSection = (
    <>
      <AccountLink href="/employer/dashboard" isActive={Boolean(pathname?.startsWith('/employer/dashboard'))} theme={theme} onClose={onClose} icon={<LayoutDashboard className={cn('h-5 w-5', pathname?.startsWith('/employer/dashboard') ? 'text-white' : theme.activeIcon)} />} label="Dashboard" />
      <AccountLink href="/pricing" isActive={pathname === '/pricing'} theme={theme} onClose={onClose} icon={<DollarSign className={cn('h-5 w-5', pathname === '/pricing' ? 'text-white' : theme.activeIcon)} />} label="Pricing" />
    </>
  )
  const footer = (
    <>
      <div className="mb-6"><LanguageSwitcher /></div>
      <Separator className="mb-6 bg-gray-200" />
      <Button variant="ghost" onClick={handleLogout} className="group flex w-full items-center gap-3 rounded-lg px-4 py-3.5 h-auto min-h-[52px] text-[#dc0000] hover:bg-red-50 active:bg-red-100">
        <div className="flex justify-center items-center rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors h-10 w-10"><LogOut className="h-5 w-5 text-[#dc0000]" /></div>
        <span className="font-medium flex-1 text-left text-base">Logout</span>
      </Button>
    </>
  )
  return (
    <>
      <div className="hidden sm:block"><UserMenu employer={employer} /></div>
      <MobileNavSheet
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        theme={NAV_THEMES.employer}
        header={header}
        navLinks={navLinks}
        pathname={pathname}
        accountSection={accountSection}
        footer={footer}
      />
    </>
  )
}

function CandidateNavActions({ candidate, ctx }: Readonly<{ candidate: Candidate; ctx: NavCtx }>) {
  const { mobileMenuOpen, setMobileMenuOpen, handleLogout, pathname, navLinks } = ctx
  const name = getCandidateDisplayName(candidate)
  const onClose = () => setMobileMenuOpen(false)
  const theme = NAV_THEMES.candidate
  const header = (
    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
      <AvatarCircle name={name} size="md" />
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-base font-semibold text-[#16252d] truncate">{name}</p>
        {candidate.email && <p className="text-xs text-gray-500 truncate mt-0.5">{candidate.email}</p>}
      </div>
    </div>
  )
  const accountSection = (
    <>
      <AccountLink href="/dashboard" isActive={Boolean(pathname?.startsWith('/dashboard'))} theme={theme} onClose={onClose} icon={<LayoutDashboard className={cn('h-5 w-5', pathname?.startsWith('/dashboard') ? 'text-white' : theme.activeIcon)} />} label="Dashboard" />
      <AccountLink href="/dashboard/resume" isActive={pathname === '/dashboard/resume'} theme={theme} onClose={onClose} icon={<FileText className={cn('h-5 w-5', pathname === '/dashboard/resume' ? 'text-white' : theme.activeIcon)} />} label="My Resume" />
    </>
  )
  const footer = (
    <>
      <div className="mb-6"><LanguageSwitcher /></div>
      <Separator className="mb-6 bg-gray-200" />
      <Button variant="ghost" onClick={handleLogout} className="group flex w-full items-center gap-3 rounded-lg px-4 py-3.5 h-auto min-h-[52px] text-[#dc0000] hover:bg-red-50 active:bg-red-100">
        <div className="flex justify-center items-center rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors h-10 w-10"><LogOut className="h-5 w-5 text-[#dc0000]" /></div>
        <span className="font-medium flex-1 text-left text-base">Logout</span>
      </Button>
    </>
  )
  return (
    <>
      <div className="hidden sm:block"><CandidateUserMenu candidate={candidate} /></div>
      <MobileNavSheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} theme={theme} header={header} navLinks={navLinks} pathname={pathname} accountSection={accountSection} footer={footer} />
    </>
  )
}

function GuestNavActions({ ctx }: Readonly<{ ctx: NavCtx }>) {
  const { mobileMenuOpen, setMobileMenuOpen, pathname, t, navLinks, router } = ctx
  const onClose = () => setMobileMenuOpen(false)
  const theme = NAV_THEMES.candidate
  const header = null
  const accountSection = (
    <>
      <Link href="/login" className={cn(LINK_BASE_CLS, pathname === '/login' ? `${theme.activeBg} text-white` : 'text-[#16252d] hover:bg-gray-50 active:bg-gray-100')} onClick={onClose}>
        <div className={cn(ICON_BOX_BASE_CLS, pathname === '/login' ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200')}><div className={cn('h-2 w-2 rounded-full', pathname === '/login' ? 'bg-white' : theme.activeIcon)} /></div>
        <span className={cn('font-medium flex-1 text-base', pathname === '/login' && 'text-white')}>{t('login')}</span>
      </Link>
      <Button onClick={() => { onClose(); router.push('/register-type') }} className="cursor-pointer group flex w-full items-center gap-3 rounded-lg px-4 py-3.5 h-auto min-h-[52px] bg-[#4644b8] hover:bg-[#3a3aa0] text-white">
        <div className="flex justify-center items-center rounded-lg bg-white/20 transition-colors h-10 w-10"><div className="h-2 w-2 rounded-full bg-white" /></div>
        <span className="font-medium flex-1 text-left text-base">{t('getStarted')}</span>
      </Button>
    </>
  )
  const footer = <div className="mb-6"><LanguageSwitcher /></div>
  return (
    <>
      <Link href="/login" className="hidden sm:block text-sm lg:text-base font-semibold font-inter text-[#16252d] hover:text-[#4545b8] transition-colors whitespace-nowrap">{t('login')}</Link>
      <Button onClick={() => router.push('/register-type')} className={cn('cursor-pointer bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-lg sm:rounded-xl px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5 text-xs sm:text-base lg:text-lg font-bold whitespace-nowrap hidden sm:inline-flex')}>
        {t('getStarted')}
      </Button>
      <MobileNavSheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} theme={theme} header={header} navLinks={navLinks} pathname={pathname} accountSection={accountSection} footer={footer} />
    </>
  )
}

export const HomepageNavbar: React.FC<HomepageNavbarProps> = ({ employer, candidate }) => {
  const t = useTranslations('nav')
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogoutAsync = async () => {
    try {
      const result = await clearAuthCookies()
      if (result.success) {
        toast.success('Logged out successfully')
        setMobileMenuOpen(false)
        router.push('/')
        router.refresh()
      } else {
        toast.error('Failed to log out')
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('An error occurred while logging out')
    }
  }
  const handleLogout = () => {
    void handleLogoutAsync()
  }

  const navLinks = [
    { label: t('candidates'), href: '/candidates', icon: Users },
    { label: t('pricing'), href: '/pricing', icon: DollarSign },
    { label: t('blog'), href: '/blog', icon: BookOpen },
    { label: t('about'), href: '/about', icon: Info },
    { label: t('contact'), href: '/contact', icon: Mail },
  ]

  const navKind: 'employer' | 'candidate' | 'guest' = employer ? 'employer' : candidate ? 'candidate' : 'guest'
  const navCtx: NavCtx = { mobileMenuOpen, setMobileMenuOpen, handleLogout, pathname, t, navLinks, router }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full">
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px] py-3 sm:py-4">
        <div className="backdrop-blur-md bg-white/95 rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            {/* Logo - aspect ratio 319:49 (~6.5:1) */}
            <Link href="/" className="flex-shrink-0">
              <div className="relative h-5 w-[130px] sm:h-6 sm:w-[156px] md:h-8 md:w-[208px] lg:h-10 lg:w-[260px]">
                <Image
                  src={logoSrc}
                  alt="Ready to Work"
                  fill
                  priority
                  className="object-contain object-left"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm lg:text-base xl:text-lg font-semibold font-inter text-[#16252d] hover:text-[#4545b8] transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
              <NavRightSide kind={navKind} employer={employer} candidate={candidate} ctx={navCtx} />
            </div>
          </div>

        </div>
      </div>
    </nav>
  )
}
