import React from 'react'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { HomepageSection } from '../HomepageSection'
import { Facebook, Instagram } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

// TikTok-only icon (single path, viewBox cropped from combined asset)
const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="131 0 30 35"
    fill="currentColor"
    className={className}
    aria-hidden
  >
    <path d="M156.456 8.06102C156.236 7.94714 156.021 7.82232 155.814 7.68702C155.21 7.28812 154.656 6.81808 154.165 6.28702C153.2 5.20703 152.556 3.87868 152.306 2.45202H152.312C152.22 2.00239 152.196 1.54175 152.24 1.08502H146.64V22.752C146.64 23.042 146.64 23.331 146.628 23.615C146.628 23.65 146.628 23.682 146.622 23.721C146.624 23.737 146.624 23.7531 146.622 23.769V23.782C146.563 24.5605 146.313 25.3125 145.894 25.9716C145.476 26.6306 144.901 27.1765 144.222 27.561C143.515 27.9633 142.715 28.1742 141.902 28.173C140.64 28.173 139.43 27.6717 138.537 26.7794C137.645 25.8871 137.144 24.6769 137.144 23.415C137.144 22.1531 137.645 20.9429 138.537 20.0506C139.43 19.1583 140.64 18.657 141.902 18.657C142.396 18.657 142.888 18.7353 143.358 18.889L143.365 13.182C141.938 12.9979 140.489 13.1116 139.108 13.5159C137.727 13.9202 136.446 14.6064 135.344 15.531C134.378 16.37 133.566 17.371 132.944 18.489C132.16 19.9345 131.737 21.5472 131.708 23.191C131.694 24.4558 131.897 25.7136 132.308 26.91V26.924C132.678 27.9177 133.19 28.8521 133.83 29.698C134.522 30.5767 135.34 31.3487 136.257 31.989V31.975L136.27 31.989C137.969 33.1047 139.957 33.7026 141.99 33.71C143.456 33.7078 144.904 33.3878 146.235 32.772C147.548 32.1523 148.721 31.2706 149.681 30.181C150.48 29.2553 151.116 28.2002 151.561 27.061C151.971 25.9136 152.199 24.709 152.237 23.491V11.991C152.305 12.032 153.211 12.63 153.211 12.63C154.254 13.2438 155.378 13.7084 156.55 14.01C157.675 14.269 158.822 14.4263 159.976 14.48V8.92002C158.748 8.93556 157.538 8.64005 156.456 8.06102Z" />
  </svg>
)

// Social links – Instagram, TikTok, Facebook only (open in new tab)
const SOCIAL_LINKS = [
  { url: 'https://www.instagram.com/readytowork.sa/', ariaLabel: 'Instagram', Icon: Instagram },
  {
    url: 'https://www.tiktok.com/@readytoworksa',
    ariaLabel: 'TikTok',
    Icon: TikTokIcon,
  },
  { url: 'https://www.facebook.com/readytowork.saudi', ariaLabel: 'Facebook', Icon: Facebook },
] as const

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
    { label: t('links.disclaimer'), href: '/disclaimer' },
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
                  {SOCIAL_LINKS.map((item) => (
                    <a
                      key={item.ariaLabel}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.ariaLabel}
                      className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 text-[#d8e530] hover:bg-white/10 rounded-full transition-colors"
                    >
                      <item.Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </a>
                  ))}
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
                    <span dir="ltr">{t('phoneValue')}</span>
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
