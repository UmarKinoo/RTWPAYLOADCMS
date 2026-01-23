import React from 'react'
import { HomepageSection } from '../HomepageSection'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

// Government logos from Hero component
const logoMediaAuthority = '/assets/شعار الهيئة العامة لتنظيم الإعلام بدقة عالية png – svg.svg'
const logoVision2030 = '/assets/شعار رؤية المملكة 2030 – Saudi vision 2030 Logo SVG.svg'
const logoSaudiBusinessCenter = '/assets/شعار المركز السعودي للأعمال – Saudi Business Center Logo – PNG – SVG.svg'
const logoCommerceMinistry = '/assets/شعار وزارة التجارة SVG.svg'

// Government organizations data with balanced sizing
const companies = [
  { 
    name: 'الهيئة العامة لتنظيم الإعلام', 
    nameEn: 'General Authority for Media Regulation',
    logo: logoMediaAuthority 
  },
  { 
    name: 'رؤية المملكة 2030', 
    nameEn: 'Saudi Vision 2030',
    logo: logoVision2030 
  },
  { 
    name: 'المركز السعودي للأعمال', 
    nameEn: 'Saudi Business Center',
    logo: logoSaudiBusinessCenter 
  },
  { 
    name: 'وزارة التجارة', 
    nameEn: 'Ministry of Commerce',
    logo: logoCommerceMinistry 
  },
]

export const TrustedBy: React.FC = async () => {
  const t = await getTranslations('homepage.trustedBy')

  return (
    <HomepageSection className="pb-12 sm:pb-16 md:pb-20">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold font-inter text-[#16252d]">
          {t('title')}
        </h2>
      </div>

      {/* Logos - Scrollable on mobile, centered on desktop */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide">
        <div className="flex items-center justify-start sm:justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 min-w-max sm:min-w-0">
          {companies.map((company, index) => (
            <div
              key={index}
              className="bg-white hover:bg-gray-50 transition-colors rounded-lg px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center shadow-sm border border-gray-100"
              style={{ minWidth: '140px', maxWidth: '180px' }}
            >
              <Image
                src={company.logo}
                alt={company.nameEn || company.name}
                width={140}
                height={60}
                className="h-12 sm:h-14 md:h-16 w-auto opacity-90 hover:opacity-100 transition-opacity object-contain"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </HomepageSection>
  )
}
