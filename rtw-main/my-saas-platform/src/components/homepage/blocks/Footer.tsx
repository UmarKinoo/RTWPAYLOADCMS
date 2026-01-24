import React from 'react'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { HomepageSection } from '../HomepageSection'
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTranslations } from 'next-intl/server'

// Logo for dark background (light colored version)
const logoLightSrc = '/assets/ba0487a1acd5a7d0db5850ddb61c7571d272bfee.svg'

export const Footer: React.FC = async () => {
  const t = await getTranslations('homepage.footer')

  // Quicklinks with their routes
  const quickLinks = [
    { label: t('links.aboutUs'), href: '/about' },
    { label: t('links.companyInformation'), href: '/about' }, // Company info can be part of about page
    { label: t('links.siteMap'), href: '/about' }, // Sitemap can redirect to about or be a future page
  ]

  // Policy links with their routes
  const policyLinks = [
    { label: t('links.termsAndCondition'), href: '/terms-and-conditions' },
    { label: t('links.privacyAndPolicy'), href: '/privacy-policy' },
    { label: t('links.legal'), href: '/terms-and-conditions' }, // Legal info can be part of terms
    { label: t('links.disclaimer'), href: '/terms-and-conditions' }, // Disclaimer can be part of terms
  ]

  return (
    <HomepageSection className="pb-0">
      {/* Background container - full width dark */}
      <div className="bg-[#16252d] -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 2xl:-mx-[95px]">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px] py-8 sm:py-10 md:py-12 lg:py-14">
          {/* Main Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 lg:gap-8 mb-8">
            {/* Column 1 - Logo and Social */}
            <div className="flex flex-col gap-5">
              {/* Logo - aspect ratio 382:59 (~6.5:1) */}
              <Link href="/">
                <div className="relative h-6 w-[156px] sm:h-8 sm:w-[208px] md:h-10 md:w-[260px]">
                  <Image
                    src={logoLightSrc}
                    alt="Ready to Work"
                    fill
                    className="object-contain object-left"
                  />
                </div>
              </Link>

              {/* Stay Connected */}
              <div className="flex flex-col gap-2">
                <h3 className="text-base sm:text-lg md:text-xl font-bold font-inter text-white">
                  {t('stayConnected')}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 text-[#d8e530] hover:text-[#d8e530] hover:bg-white/10 rounded-full p-0"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 text-[#d8e530] hover:text-[#d8e530] hover:bg-white/10 rounded-full p-0"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 text-[#d8e530] hover:text-[#d8e530] hover:bg-white/10 rounded-full p-0"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 text-[#d8e530] hover:text-[#d8e530] hover:bg-white/10 rounded-full p-0"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Column 2 - Quicklinks */}
            <div className="flex flex-col gap-3">
              <h3 className="text-base sm:text-lg md:text-xl font-bold font-inter text-[#d8e530]">
                {t('quicklinks')}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm sm:text-base font-normal font-inter text-white hover:text-[#d8e530] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 - Policies */}
            <div className="flex flex-col gap-3">
              <h3 className="text-base sm:text-lg md:text-xl font-bold font-inter text-[#d8e530]">
                {t('policies')}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {policyLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm sm:text-base font-normal font-inter text-white hover:text-[#d8e530] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4 - Contact Details */}
            <div className="flex flex-col gap-3">
              <h3 className="text-base sm:text-lg md:text-xl font-bold font-inter text-[#d8e530]">
                {t('contactDetails')}
              </h3>
              <ul className="flex flex-col gap-1.5">
                <li className="text-sm sm:text-base font-normal font-inter text-white">
                  <span className="font-semibold">{t('address')}:</span> {t('addressValue')}
                </li>
                <li className="text-sm sm:text-base font-normal font-inter text-white">
                  <span className="font-semibold">{t('phone')}:</span>{' '}
                  <a
                    href={`tel:${t('phoneValue')}`}
                    className="hover:text-[#d8e530] transition-colors"
                  >
                    {t('phoneValue')}
                  </a>
                </li>
                <li className="text-sm sm:text-base font-normal font-inter text-white">
                  <span className="font-semibold">{t('open')}:</span> {t('hoursValue')}
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/20 mb-6" />

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            <p className="text-xs sm:text-sm font-normal font-inter text-white">
              {t('copyright')}
            </p>
          </div>
        </div>
      </div>
    </HomepageSection>
  )
}
