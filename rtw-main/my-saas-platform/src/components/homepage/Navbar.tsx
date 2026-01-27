'use client'

import React, { useState } from 'react'
import { Link, useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut, LayoutDashboard, DollarSign, FileText, Users, BookOpen, Info, Mail, Search } from 'lucide-react'
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
import { usePathname } from '@/i18n/routing'
import { Separator } from '@/components/ui/separator'
import { clearAuthCookies } from '@/lib/auth'
import { toast } from 'sonner'
import type { Employer, Candidate } from '@/payload-types'

// Logo image - the full combined logo
const logoSrc = '/assets/03bdd9d6f0fa9e8b68944b910c59a8474fc37999.svg'

interface HomepageNavbarProps {
  employer?: Employer | null
  candidate?: Candidate | null
}

// Helper functions to get display names
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

export const HomepageNavbar: React.FC<HomepageNavbarProps> = ({ employer, candidate }) => {
  const t = useTranslations('nav')
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
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

  const navLinks = [
    { label: t('candidates'), href: '/candidates', icon: Users },
    { label: t('pricing'), href: '/pricing', icon: DollarSign },
    { label: t('blog'), href: '/blog', icon: BookOpen },
    { label: t('about'), href: '/about', icon: Info },
    { label: t('contact'), href: '/contact', icon: Mail },
  ]

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
              {navLinks.map((link, index) => (
                <Link
                  key={index}
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
              {employer ? (
                // Employer is logged in - show Employer UserMenu
                <>
                  <div className="hidden sm:block">
                    <UserMenu employer={employer} />
                  </div>
                  {/* Mobile Menu Button */}
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden h-9 w-9 text-[#16252d] flex-shrink-0"
                        aria-label="Toggle menu"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full max-w-[320px] sm:w-[360px] p-0 flex flex-col overflow-hidden z-[110]">
                      <VisuallyHidden>
                        <SheetTitle>Navigation Menu</SheetTitle>
                      </VisuallyHidden>
                      <div className={cn(
                        'flex flex-1 flex-col px-6 pt-20 overflow-y-auto overscroll-contain',
                        'pb-24 md:pb-6' // Extra bottom padding on mobile to account for bottom nav
                      )}>
                        {/* User Info */}
                        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
                          <AvatarCircle name={getEmployerDisplayName(employer)} size="md" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <p className="text-base font-semibold text-[#16252d] truncate">
                              {getEmployerDisplayName(employer)}
                            </p>
                            {employer.email && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {employer.email}
                              </p>
                            )}
                            {employer.wallet && (
                              <div className="flex gap-4 mt-1.5 text-xs">
                                <span className="text-gray-500">
                                  Credits: <span className="font-semibold text-[#4644b8]">{employer.wallet.interviewCredits ?? 0}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Navigation Links */}
                        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Navigation
                        </h2>
                        <div className="flex flex-col gap-2 mb-6">
                          {navLinks.map((link, index) => {
                            const Icon = link.icon
                            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
                            return (
                              <Link
                                key={index}
                                href={link.href}
                                className={cn(
                                  'group flex items-center gap-3 rounded-lg transition-all',
                                  'px-4 py-3.5 h-auto min-h-[52px]',
                                  isActive
                                    ? 'bg-[#f6b500] text-white'
                                    : 'text-[#16252d] hover:bg-gray-50 active:bg-gray-100'
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <div className={cn(
                                  'flex items-center justify-center rounded-lg transition-colors',
                                  'h-10 w-10',
                                  isActive 
                                    ? 'bg-white/20' 
                                    : 'bg-gray-100 group-hover:bg-gray-200'
                                )}>
                                  <Icon className={cn(
                                    'h-5 w-5',
                                    isActive ? 'text-white' : 'text-[#f6b500]'
                                  )} />
                                </div>
                                <span className={cn(
                                  'font-medium flex-1 text-base',
                                  isActive && 'text-white'
                                )}>
                                  {link.label}
                                </span>
                              </Link>
                            )
                          })}
                        </div>
                        
                        <Separator className="mb-6 bg-gray-200" />
                        
                        {/* User Actions */}
                        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Account
                        </h2>
                        <div className="flex flex-col gap-2 mb-6">
                          <Link
                            href="/employer/dashboard"
                            className={cn(
                              'group flex items-center gap-3 rounded-lg transition-all',
                              'px-4 py-3.5 h-auto min-h-[52px]',
                              pathname?.startsWith('/employer/dashboard')
                                ? 'bg-[#f6b500] text-white'
                                : 'text-[#16252d] hover:bg-gray-50 active:bg-gray-100'
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className={cn(
                              'flex items-center justify-center rounded-lg transition-colors',
                              'h-10 w-10',
                              pathname?.startsWith('/employer/dashboard')
                                ? 'bg-white/20'
                                : 'bg-gray-100 group-hover:bg-gray-200'
                            )}>
                              <LayoutDashboard className={cn(
                                'h-5 w-5',
                                pathname?.startsWith('/employer/dashboard') ? 'text-white' : 'text-[#f6b500]'
                              )} />
                            </div>
                            <span className={cn(
                              'font-medium flex-1 text-base',
                              pathname?.startsWith('/employer/dashboard') && 'text-white'
                            )}>
                              Dashboard
                            </span>
                          </Link>
                          <Link
                            href="/pricing"
                            className={cn(
                              'group flex items-center gap-3 rounded-lg transition-all',
                              'px-4 py-3.5 h-auto min-h-[52px]',
                              pathname === '/pricing'
                                ? 'bg-[#f6b500] text-white'
                                : 'text-[#16252d] hover:bg-gray-50 active:bg-gray-100'
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className={cn(
                              'flex items-center justify-center rounded-lg transition-colors',
                              'h-10 w-10',
                              pathname === '/pricing'
                                ? 'bg-white/20'
                                : 'bg-gray-100 group-hover:bg-gray-200'
                            )}>
                              <DollarSign className={cn(
                                'h-5 w-5',
                                pathname === '/pricing' ? 'text-white' : 'text-[#f6b500]'
                              )} />
                            </div>
                            <span className={cn(
                              'font-medium flex-1 text-base',
                              pathname === '/pricing' && 'text-white'
                            )}>
                              Pricing
                            </span>
                          </Link>
                        </div>
                        
                        <Separator className="mb-6 bg-gray-200" />
                        
                        {/* Language Switcher */}
                        <div className="mb-6">
                          <LanguageSwitcher />
                        </div>
                        
                        <Separator className="mb-6 bg-gray-200" />
                        
                        {/* Logout */}
                        <Button
                          variant="ghost"
                          onClick={handleLogout}
                          className="group flex w-full items-center gap-3 rounded-lg px-4 py-3.5 h-auto min-h-[52px] text-[#dc0000] hover:bg-red-50 active:bg-red-100"
                        >
                          <div className="flex items-center justify-center rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors h-10 w-10">
                            <LogOut className="h-5 w-5 text-[#dc0000]" />
                          </div>
                          <span className="font-medium flex-1 text-left text-base">Logout</span>
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </>
              ) : candidate ? (
                // Candidate is logged in - show Candidate UserMenu
                <>
                  <div className="hidden sm:block">
                    <CandidateUserMenu candidate={candidate} />
                  </div>
                  {/* Mobile Menu Button */}
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden h-9 w-9 text-[#16252d] flex-shrink-0"
                        aria-label="Toggle menu"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full max-w-[320px] sm:w-[360px] p-0 flex flex-col overflow-hidden z-[110]">
                      <VisuallyHidden>
                        <SheetTitle>Navigation Menu</SheetTitle>
                      </VisuallyHidden>
                      <div className={cn(
                        'flex flex-1 flex-col px-6 pt-20 overflow-y-auto overscroll-contain',
                        'pb-24 md:pb-6' // Extra bottom padding on mobile to account for bottom nav
                      )}>
                        {/* User Info */}
                        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
                          <AvatarCircle name={getCandidateDisplayName(candidate)} size="md" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <p className="text-base font-semibold text-[#16252d] truncate">
                              {getCandidateDisplayName(candidate)}
                            </p>
                            {candidate.email && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {candidate.email}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Navigation Links */}
                        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Navigation
                        </h2>
                        <div className="flex flex-col gap-2 mb-6">
                          {navLinks.map((link, index) => {
                            const Icon = link.icon
                            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
                            return (
                              <Link
                                key={index}
                                href={link.href}
                                className={cn(
                                  'group flex items-center gap-3 rounded-lg transition-all',
                                  'px-4 py-3.5 h-auto min-h-[52px]',
                                  isActive
                                    ? 'bg-[#4644b8] text-white'
                                    : 'text-[#16252d] hover:bg-gray-50 active:bg-gray-100'
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <div className={cn(
                                  'flex items-center justify-center rounded-lg transition-colors',
                                  'h-10 w-10',
                                  isActive 
                                    ? 'bg-white/20' 
                                    : 'bg-gray-100 group-hover:bg-gray-200'
                                )}>
                                  <Icon className={cn(
                                    'h-5 w-5',
                                    isActive ? 'text-white' : 'text-[#4644b8]'
                                  )} />
                                </div>
                                <span className={cn(
                                  'font-medium flex-1 text-base',
                                  isActive && 'text-white'
                                )}>
                                  {link.label}
                                </span>
                              </Link>
                            )
                          })}
                        </div>
                        
                        <Separator className="mb-6 bg-gray-200" />
                        
                        {/* User Actions */}
                        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Account
                        </h2>
                        <div className="flex flex-col gap-2 mb-6">
                          <Link
                            href="/dashboard"
                            className={cn(
                              'group flex items-center gap-3 rounded-lg transition-all',
                              'px-4 py-3.5 h-auto min-h-[52px]',
                              pathname?.startsWith('/dashboard')
                                ? 'bg-[#4644b8] text-white'
                                : 'text-[#16252d] hover:bg-gray-50 active:bg-gray-100'
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className={cn(
                              'flex items-center justify-center rounded-lg transition-colors',
                              'h-10 w-10',
                              pathname?.startsWith('/dashboard')
                                ? 'bg-white/20'
                                : 'bg-gray-100 group-hover:bg-gray-200'
                            )}>
                              <LayoutDashboard className={cn(
                                'h-5 w-5',
                                pathname?.startsWith('/dashboard') ? 'text-white' : 'text-[#4644b8]'
                              )} />
                            </div>
                            <span className={cn(
                              'font-medium flex-1 text-base',
                              pathname?.startsWith('/dashboard') && 'text-white'
                            )}>
                              Dashboard
                            </span>
                          </Link>
                          <Link
                            href="/dashboard/resume"
                            className={cn(
                              'group flex items-center gap-3 rounded-lg transition-all',
                              'px-4 py-3.5 h-auto min-h-[52px]',
                              pathname === '/dashboard/resume'
                                ? 'bg-[#4644b8] text-white'
                                : 'text-[#16252d] hover:bg-gray-50 active:bg-gray-100'
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className={cn(
                              'flex items-center justify-center rounded-lg transition-colors',
                              'h-10 w-10',
                              pathname === '/dashboard/resume'
                                ? 'bg-white/20'
                                : 'bg-gray-100 group-hover:bg-gray-200'
                            )}>
                              <FileText className={cn(
                                'h-5 w-5',
                                pathname === '/dashboard/resume' ? 'text-white' : 'text-[#4644b8]'
                              )} />
                            </div>
                            <span className={cn(
                              'font-medium flex-1 text-base',
                              pathname === '/dashboard/resume' && 'text-white'
                            )}>
                              My Resume
                            </span>
                          </Link>
                        </div>
                        
                        <Separator className="mb-6 bg-gray-200" />
                        
                        {/* Language Switcher */}
                        <div className="mb-6">
                          <LanguageSwitcher />
                        </div>
                        
                        <Separator className="mb-6 bg-gray-200" />
                        
                        {/* Logout */}
                        <Button
                          variant="ghost"
                          onClick={handleLogout}
                          className="group flex w-full items-center gap-3 rounded-lg px-4 py-3.5 h-auto min-h-[52px] text-[#dc0000] hover:bg-red-50 active:bg-red-100"
                        >
                          <div className="flex items-center justify-center rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors h-10 w-10">
                            <LogOut className="h-5 w-5 text-[#dc0000]" />
                          </div>
                          <span className="font-medium flex-1 text-left text-base">Logout</span>
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </>
              ) : (
                // User is not logged in - show Login and Get Started
                <>
                  {/* Login Link - Hidden on mobile */}
                  <Link
                    href="/login"
                    className="hidden sm:block text-sm lg:text-base font-semibold font-inter text-[#16252d] hover:text-[#4545b8] transition-colors whitespace-nowrap"
                  >
                    {t('login')}
                  </Link>

                  {/* Get Started Button - Hidden on mobile when hamburger is shown */}
                  <Button
                    onClick={() => router.push('/register-type')}
                    className={cn(
                      'cursor-pointer bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-lg sm:rounded-xl',
                      'px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5',
                      'text-xs sm:text-base lg:text-lg font-bold whitespace-nowrap',
                      'hidden sm:inline-flex' // Hide on mobile
                    )}
                  >
                    {t('getStarted')}
                  </Button>

                  {/* Mobile Menu Button */}
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden h-9 w-9 text-[#16252d] flex-shrink-0"
                        aria-label="Toggle menu"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full max-w-[320px] sm:w-[360px] p-0 flex flex-col overflow-hidden z-[110]">
                      <VisuallyHidden>
                        <SheetTitle>Navigation Menu</SheetTitle>
                      </VisuallyHidden>
                      <div className={cn(
                        'flex flex-1 flex-col px-6 pt-20 overflow-y-auto overscroll-contain',
                        'pb-24 md:pb-6' // Extra bottom padding on mobile to account for bottom nav
                      )}>
                        {/* Navigation Links */}
                        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Navigation
                        </h2>
                        <div className="flex flex-col gap-2 mb-6">
                          {navLinks.map((link, index) => {
                            const Icon = link.icon
                            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
                            return (
                              <Link
                                key={index}
                                href={link.href}
                                className={cn(
                                  'group flex items-center gap-3 rounded-lg transition-all',
                                  'px-4 py-3.5 h-auto min-h-[52px]',
                                  isActive
                                    ? 'bg-[#4644b8] text-white'
                                    : 'text-[#16252d] hover:bg-gray-50 active:bg-gray-100'
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <div className={cn(
                                  'flex items-center justify-center rounded-lg transition-colors',
                                  'h-10 w-10',
                                  isActive 
                                    ? 'bg-white/20' 
                                    : 'bg-gray-100 group-hover:bg-gray-200'
                                )}>
                                  <Icon className={cn(
                                    'h-5 w-5',
                                    isActive ? 'text-white' : 'text-[#4644b8]'
                                  )} />
                                </div>
                                <span className={cn(
                                  'font-medium flex-1 text-base',
                                  isActive && 'text-white'
                                )}>
                                  {link.label}
                                </span>
                              </Link>
                            )
                          })}
                        </div>
                        
                        <Separator className="mb-6 bg-gray-200" />
                        
                        {/* Auth Actions */}
                        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Account
                        </h2>
                        <div className="flex flex-col gap-2 mb-6">
                          <Link
                            href="/login"
                            className={cn(
                              'group flex items-center gap-3 rounded-lg transition-all',
                              'px-4 py-3.5 h-auto min-h-[52px]',
                              pathname === '/login'
                                ? 'bg-[#4644b8] text-white'
                                : 'text-[#16252d] hover:bg-gray-50 active:bg-gray-100'
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className={cn(
                              'flex items-center justify-center rounded-lg transition-colors',
                              'h-10 w-10',
                              pathname === '/login'
                                ? 'bg-white/20'
                                : 'bg-gray-100 group-hover:bg-gray-200'
                            )}>
                              <div className={cn(
                                'h-2 w-2 rounded-full',
                                pathname === '/login' ? 'bg-white' : 'bg-[#4644b8]'
                              )} />
                            </div>
                            <span className={cn(
                              'font-medium flex-1 text-base',
                              pathname === '/login' && 'text-white'
                            )}>
                              {t('login')}
                            </span>
                          </Link>
                          <Button
                            onClick={() => {
                              setMobileMenuOpen(false)
                              router.push('/register-type')
                            }}
                            className="cursor-pointer group flex w-full items-center gap-3 rounded-lg px-4 py-3.5 h-auto min-h-[52px] bg-[#4644b8] hover:bg-[#3a3aa0] text-white"
                          >
                            <div className="flex items-center justify-center rounded-lg bg-white/20 transition-colors h-10 w-10">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                            <span className="font-medium flex-1 text-left text-base">{t('getStarted')}</span>
                          </Button>
                        </div>
                        
                        <Separator className="mb-6 bg-gray-200" />
                        
                        {/* Language Switcher */}
                        <div className="mb-6">
                          <LanguageSwitcher />
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </nav>
  )
}
