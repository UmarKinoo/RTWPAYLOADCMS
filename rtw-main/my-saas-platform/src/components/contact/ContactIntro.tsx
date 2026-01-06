import React from 'react'
import { HomepageSection } from '../homepage/HomepageSection'

export const ContactIntro: React.FC = () => {
  return (
    <HomepageSection className="py-10 sm:py-12 md:py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-inter text-[#141514] leading-tight mb-4">
          How can we help you?
        </h2>
        <p className="text-sm sm:text-base md:text-lg font-medium text-[#16252d] leading-normal">
          We'd love to hear from you! Whether you have a question, feedback, or just want to say hello, feel free to reach out. Our team is here to assist you.
        </p>
      </div>
    </HomepageSection>
  )
}










