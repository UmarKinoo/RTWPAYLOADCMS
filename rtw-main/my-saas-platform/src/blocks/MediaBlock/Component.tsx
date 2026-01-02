import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/ui'
import React from 'react'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '../../components/Media'
import { Container } from '@/components/ds'

type Props = MediaBlockProps & {
  breakout?: boolean
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
    className,
    imgClassName,
    media,
    staticImage,
  } = props

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
      </Container>
    </section>
  )
}
