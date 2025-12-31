import React from 'react'
import { HomepageSection } from '../HomepageSection'
import Image from 'next/image'

// Complete logo images
const imgAirbnb = '/assets/c590fb13c93f778ca78535868125737d83f0af01.svg'
const imgFivetran = '/assets/d4b5bd24d268329bf2ed3f5b08d3c397eb248846.svg'
const imgFramer = '/assets/c68f7d3dd27aa8351555d8cd14a736fbf710af10.svg'

// Company data with proper sizing
const companies = [
  { name: 'Airbnb', logo: imgAirbnb },
  { name: 'Fivetran', logo: imgFivetran },
  { name: 'Framer', logo: imgFramer },
  { name: 'Airbnb', logo: imgAirbnb },
  { name: 'Fivetran', logo: imgFivetran },
  { name: 'Framer', logo: imgFramer },
]

export const TrustedBy: React.FC = () => {
  return (
    <HomepageSection className="pb-12 sm:pb-16 md:pb-20">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold font-inter text-[#16252d]">
          Trusted by
        </h2>
      </div>

      {/* Logos - Scrollable on mobile, centered on desktop */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide">
        <div className="flex items-center justify-start sm:justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 min-w-max sm:min-w-0">
          {companies.map((company, index) => (
            <div
              key={index}
              className="bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-center"
            >
              <Image
                src={company.logo}
                alt={`${company.name} logo`}
                width={100}
                height={32}
                className="h-5 sm:h-6 md:h-8 w-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </HomepageSection>
  )
}
