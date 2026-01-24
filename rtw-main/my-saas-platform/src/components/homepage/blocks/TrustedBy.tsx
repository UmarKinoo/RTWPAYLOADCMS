import React from 'react'
import { HomepageSection } from '../HomepageSection'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

// Government logos from Hero component
const logoMediaAuthority = '/assets/Media Authority Logo.svg'
const logoVision2030 = '/assets/Saudi Vision 2030 Logo.svg'
const logoSaudiBusinessCenter = '/assets/sbcw.webp'
const logoCommerceMinistry = '/assets/Ministry of Commerce Logo.svg'

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
      {/* Logos - Scrollable on mobile, centered on desktop */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide">
        <div className="flex items-center justify-start sm:justify-center gap-4 sm:gap-5 md:gap-6 min-w-max sm:min-w-0">
          {companies.map((company, index) => (
            <div
              key={index}
              className="bg-white hover:bg-gray-50/50 transition-all duration-300 rounded-xl flex items-center justify-center shadow-sm hover:shadow-lg border border-[#EDEDED] hover:border-[#CBCBCB] overflow-hidden group"
              style={{ 
                width: '180px',
                height: '120px',
                padding: '20px 24px'
              }}
            >
              <Image
                src={company.logo}
                alt={company.nameEn || company.name}
                width={160}
                height={88}
                className="w-full h-full object-contain object-center opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </HomepageSection>
  )
}
