'use client'

import React, { useState } from 'react'
import { Link } from '@/i18n/routing'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { UserMenu } from '@/components/navbar/UserMenu'
import { CandidateUserMenu } from '@/components/navbar/CandidateUserMenu'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import type { Employer, Candidate } from '@/payload-types'

// Logo image - the full combined logo
const logoSrc = '/assets/03bdd9d6f0fa9e8b68944b910c59a8474fc37999.svg'

interface HomepageNavbarProps {
  employer?: Employer | null
  candidate?: Candidate | null
}

export const HomepageNavbar: React.FC<HomepageNavbarProps> = ({ employer, candidate }) => {
  const t = useTranslations('nav')
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'en'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: t('candidates'), href: '/candidates' },
    { label: t('pricing'), href: '/pricing' },
    { label: t('blog'), href: '/blog' },
    { label: t('about'), href: '/about' },
    { label: t('contact'), href: '/contact' },
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
            <div className="flex items-center gap-3 sm:gap-4">
              <LanguageSwitcher />
              {employer ? (
                // Employer is logged in - show Employer UserMenu
                <>
                  <UserMenu employer={employer} />
                  {/* Mobile Menu Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-9 w-9 text-[#16252d]"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </>
              ) : candidate ? (
                // Candidate is logged in - show Candidate UserMenu
                <>
                  <CandidateUserMenu candidate={candidate} />
                  {/* Mobile Menu Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-9 w-9 text-[#16252d]"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </>
              ) : (
                // User is not logged in - show Login and Get Started
                <>
                  {/* Login Link - Hidden on mobile */}
                  <Link
                    href="/login"
                    className="hidden sm:block text-sm lg:text-base font-semibold font-inter text-[#16252d] hover:text-[#4545b8] transition-colors"
                  >
                    {t('login')}
                  </Link>

                  {/* Get Started Button */}
                  <Button
                    onClick={() => router.push(`/${locale}/register-type`)}
                    className={cn(
                      'bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-lg sm:rounded-xl',
                      'px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5',
                      'text-sm sm:text-base lg:text-lg font-bold whitespace-nowrap'
                    )}
                  >
                    {t('getStarted')}
                  </Button>

                  {/* Mobile Menu Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-9 w-9 text-[#16252d]"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col gap-3">
                {navLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="text-base font-semibold font-inter text-[#16252d] hover:text-[#4545b8] transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {!employer && !candidate && (
                  <Link
                    href="/login"
                    className="sm:hidden text-base font-semibold font-inter text-[#16252d] hover:text-[#4545b8] transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('login')}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
