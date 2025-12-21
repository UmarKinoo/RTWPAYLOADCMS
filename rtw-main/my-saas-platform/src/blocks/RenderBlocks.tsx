import React from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { HeroBlock } from '@/blocks/Hero/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'

/**
 * Block Manager Component
 * Renders blocks from Payload CMS layout array with strict type checking
 * and consistent vertical spacing.
 */
export const RenderBlocks: React.FC<{
  layout: Page['layout']
}> = (props) => {
  const { layout } = props

  if (!layout || !Array.isArray(layout) || layout.length === 0) {
    return null
  }

  return (
    <>
      {layout.map((block, index) => {
        const { blockType } = block

        if (!blockType) {
          return null
        }

        // Strict switch/case for block rendering
        // All blocks follow the pattern: full-width outer wrapper, constrained inner content
        // Background colors/images extend full width, content has left/right spacing
        switch (blockType) {
          case 'hero': {
            return (
              <div key={index} className="my-12">
                {/* @ts-expect-error there may be some mismatch between the expected types here */}
                <HeroBlock {...block} />
              </div>
            )
          }

          case 'cta': {
            return (
              <div key={index} className="my-12">
                {/* @ts-expect-error there may be some mismatch between the expected types here */}
                <CallToActionBlock {...block} />
              </div>
            )
          }

          case 'content': {
            return (
              <div key={index} className="my-12">
                {/* @ts-expect-error there may be some mismatch between the expected types here */}
                <ContentBlock {...block} />
              </div>
            )
          }

          case 'mediaBlock': {
            return (
              <div key={index} className="my-12">
                {/* @ts-expect-error there may be some mismatch between the expected types here */}
                <MediaBlock {...block} />
              </div>
            )
          }

          case 'archive': {
            return (
              <div key={index} className="my-12">
                {/* @ts-expect-error there may be some mismatch between the expected types here */}
                <ArchiveBlock {...block} />
              </div>
            )
          }

          case 'formBlock': {
            return (
              <div key={index} className="my-12">
                {/* @ts-expect-error there may be some mismatch between the expected types here */}
                <FormBlock {...block} />
              </div>
            )
          }

          default: {
            // Log unknown block types for debugging
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Unknown block type: ${blockType}`)
            }
            return null
          }
        }
      })}
    </>
  )
}
