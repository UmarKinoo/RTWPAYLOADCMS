'use client'

import React from 'react'
import { HomepageSection } from '../HomepageSection'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ImageWithSkeleton } from '../ImageWithSkeleton'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

// Image assets
const imgBeautifulWaitressAtCounter1 = '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg'
const imgBeautifulWaitressAtCounter2 = '/assets/d826842a597cf4f275b759305f610c24ccc8d0c0.webp'
const imgBeautifulWaitressAtCounter3 = '/assets/8a36f35a05e8867a0bf698d48d329c14908d8e4c.webp'
const imgBeautifulWaitressAtCounter4 = '/assets/ca0d7136a6793430357f1aed71378d042716163c.webp'
const imgBeautifulWaitressAtCounter5 = '/assets/e2592868d581a4220b3f5b18f6680e41e6b16f1d.webp'
const imgBeautifulWaitressAtCounter6 = '/assets/8ef927bad934c17ab6c948ddea636fe45328bf54.webp'
const imgBeautifulWaitressAtCounter7 = '/assets/ee37e2e81115be02a56e755bd886e01749e53950.webp'
const imgMaleSweeperOutdoorsMar1320251 = '/assets/917b8c2db520242e3f5a1688bf7e2f2bf11d9820.webp'
const imgIndianCleaningServiceWindowWash1 = '/assets/67ac121b22e917950fef75b0f23b2b80005f5d77.webp'
const imgBeautifulWaitressAtCounter8 = '/assets/097b84522d9ca844392b50aaa5b73610f15dd197.webp'
const imgBeautifulWaitressAtCounter9 = '/assets/da8e4bcefdc0520f3f2eed4a58a13fab760fdd28.webp'
const imgBeautifulWaitressAtCounter10 = '/assets/29e444883f7acaf3453e7e1b8b432c22dd3b195f.webp'
const imgBeautifulWaitressAtCounter11 = '/assets/64f34b277ae47d754a07f44ebc7b75cd26860c11.webp'
const imgBeautifulWaitressAtCounter12 = '/assets/5a6537c468619803e50a4e8a88affbb0a6f74b25.webp'
const imgBeautifulWaitressAtCounter13 = '/assets/6b2d7bf1ded0d2ff1f3eb710947575dc30ef8fb3.webp'
const imgBeautifulWaitressAtCounter14 = '/assets/df806ef3a37f38f45c61dc8be4094fc8c776515a.webp'
const imgBeautifulWaitressAtCounter15 = '/assets/6e1044c6c63484140d886a28921bf45bba7548cc.webp'
const imgBeautifulWaitressAtCounter16 = '/assets/31b0d877118018231ba48265ad3b1795028001ea.webp'

interface DisciplineCardProps {
  title: string
  image: string
  imageMask?: string
  isHighlighted?: boolean
}

const DisciplineCard: React.FC<DisciplineCardProps> = ({ title, image, imageMask, isHighlighted = false }) => {
  return (
    <Card
      className={cn(
        'flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all duration-300 hover:shadow-md border-0 min-h-[72px] sm:min-h-[80px]',
        isHighlighted ? 'bg-[#e9d5ff]' : 'bg-gray-100'
      )}
    >
      {/* Image */}
      <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg overflow-hidden relative">
        {imageMask ? (
          <div
            className="w-full h-full relative"
            style={{
              maskImage: `url('${imageMask}')`,
              WebkitMaskImage: `url('${imageMask}')`,
              maskSize: 'cover',
              maskPosition: 'center',
              maskRepeat: 'no-repeat',
            }}
          >
            <ImageWithSkeleton src={image} alt={title} fill objectFit="cover" />
          </div>
        ) : (
          <ImageWithSkeleton src={image} alt={title} fill objectFit="cover" />
        )}
      </div>

      {/* Text - with line clamping to prevent overflow */}
      <p className="text-sm sm:text-base md:text-lg font-semibold font-inter text-[#16252d] leading-tight flex-1 line-clamp-2">
        {title}
      </p>
    </Card>
  )
}

export const MajorDisciplines: React.FC = () => {
  const disciplines = [
    { title: 'Agriculture & Farm Services', image: imgMaleSweeperOutdoorsMar1320251, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Construction', image: imgBeautifulWaitressAtCounter4, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Housekeeping & Home Services', image: imgBeautifulWaitressAtCounter5, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Events & Hospitality', image: imgBeautifulWaitressAtCounter7, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Business', image: imgBeautifulWaitressAtCounter10, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Education', image: imgBeautifulWaitressAtCounter11, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'IT', image: imgBeautifulWaitressAtCounter14, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Facility Management', image: imgIndianCleaningServiceWindowWash1, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Cafe & Restaurant', image: imgBeautifulWaitressAtCounter3, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Entertainment & Leisure', image: imgBeautifulWaitressAtCounter9, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Healthcare', image: imgBeautifulWaitressAtCounter16, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Industrial & Logistic', image: imgBeautifulWaitressAtCounter3, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Lifestyle & Personal Care', image: imgBeautifulWaitressAtCounter6, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Retail', image: imgBeautifulWaitressAtCounter2, imageMask: imgBeautifulWaitressAtCounter1, isHighlighted: true },
    { title: 'Mechanical & Auto Repair', image: imgBeautifulWaitressAtCounter12, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Sustainability & Waste', image: imgBeautifulWaitressAtCounter13, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Media & Visualization', image: imgBeautifulWaitressAtCounter8, imageMask: imgBeautifulWaitressAtCounter1 },
    { title: 'Transport & Vehicle', image: imgBeautifulWaitressAtCounter15, imageMask: imgBeautifulWaitressAtCounter1 },
  ]

  return (
    <HomepageSection className="pb-12 sm:pb-16 md:pb-20">
      {/* Background container */}
      <div className="bg-white rounded-t-3xl sm:rounded-t-[40px] md:rounded-t-[50px] lg:rounded-t-[60px] -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 2xl:-mx-[95px] overflow-hidden">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px] py-8 sm:py-10 md:py-12 lg:py-16">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold font-inter text-[#16252d] mb-2 sm:mb-3 md:mb-4 leading-tight">
              Explore Jobs by Major Discipline
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-medium font-inter text-[#16252d]/80 max-w-2xl mx-auto">
              Our platform connects you with top employers across various industries
            </p>
          </div>

          {/* Mobile: Carousel */}
          <div className="block md:hidden">
            <Carousel
              opts={{
                align: 'start',
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2">
                {disciplines.map((discipline, index) => (
                  <CarouselItem key={index} className="pl-2 basis-[85%] sm:basis-1/2">
                    <DisciplineCard
                      title={discipline.title}
                      image={discipline.image}
                      imageMask={discipline.imageMask}
                      isHighlighted={discipline.isHighlighted}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-2 mt-4">
                <CarouselPrevious className="static translate-y-0" />
                <CarouselNext className="static translate-y-0" />
              </div>
            </Carousel>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {disciplines.map((discipline, index) => (
              <DisciplineCard
                key={index}
                title={discipline.title}
                image={discipline.image}
                imageMask={discipline.imageMask}
                isHighlighted={discipline.isHighlighted}
              />
            ))}
          </div>
        </div>
      </div>
    </HomepageSection>
  )
}
