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

  const quickLinks = [
    t('links.aboutUs'),
    t('links.companyInformation'),
    t('links.codeOfConduct'),
    t('links.investorRelations'),
    t('links.siteMap'),
  ]

  const policyLinks = [
    t('links.policies'),
    t('links.termsAndCondition'),
    t('links.legal'),
    t('links.disclaimer'),
    t('links.privacyAndPolicy'),
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
                    <a
                      href="#"
                      className="text-sm sm:text-base font-normal font-inter text-white hover:text-[#d8e530] transition-colors"
                    >
                      {link}
                    </a>
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
                    <a
                      href="#"
                      className="text-sm sm:text-base font-normal font-inter text-white hover:text-[#d8e530] transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4 - Contact Details */}
            <div className="flex flex-col gap-3">
              <h3 className="text-base sm:text-lg md:text-xl font-bold font-inter text-[#d8e530]">
                {t('contactDetails')}
              </h3>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm sm:text-base font-inter text-white">
                  <span className="font-bold">{t('address')}: </span>
                  <span>{t('addressValue')}</span>
                </p>
                <p className="text-sm sm:text-base font-inter text-white">
                  <span className="font-bold">{t('email')}: </span>
                  <a href={`mailto:${t('emailValue')}`} className="hover:text-[#d8e530] transition-colors">
                    {t('emailValue')}
                  </a>
                </p>
                <p className="text-sm sm:text-base font-inter text-white">
                  <span className="font-bold">{t('phone')}: </span>
                  <a href="tel:59186338" className="hover:text-[#d8e530] transition-colors">
                    {t('phoneValue')}
                  </a>
                </p>
                <p className="text-sm sm:text-base font-inter text-white">
                  <span className="font-bold">{t('open')}: </span>
                  <span>{t('hoursValue')}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/20 mb-6" />

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
            <p className="text-xs sm:text-sm font-normal font-inter text-white">
              {t('copyright')}
            </p>
            <p className="text-xs sm:text-sm font-normal font-inter text-white">
              {t('designedBy')}{' '}
              <span className="font-bold text-[#d8e530]">MoodWeb</span>
            </p>
          </div>
        </div>
      </div>
    </HomepageSection>
  )
}
