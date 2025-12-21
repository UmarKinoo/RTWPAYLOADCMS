import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '../../components/Media'
import { Container } from '@/components/ds'

type Props = MediaBlockProps & {
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

/**
 * Media Block Component
 * Follows the "Full-Width / Centered-Content" pattern:
 * - Outer: <section> with w-full
 * - Inner: <Container> for centered content
 */
export const MediaBlock: React.FC<Props> = (props) => {
  const {
    captionClassName,
    className,
    imgClassName,
    media,
    staticImage,
  } = props

  let caption
  if (media && typeof media === 'object') caption = media.caption

  return (
    <section className={cn('w-full', className)}>
      <Container>
        {(media || staticImage) && (
          <Media
            imgClassName={cn('border border-border rounded-[0.8rem]', imgClassName)}
            resource={media}
            src={staticImage}
          />
        )}
        {caption && (
          <div className={cn('mt-6', captionClassName)}>
            <RichText data={caption} enableGutter={false} />
          </div>
        )}
      </Container>
    </section>
  )
}
