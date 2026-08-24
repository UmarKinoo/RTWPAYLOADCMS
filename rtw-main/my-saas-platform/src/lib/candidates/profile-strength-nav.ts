import {
  flashProfileSection,
  isSamePageDashboardLink,
  sectionIdFromHref,
  type ProfileFieldItem,
} from '@/lib/candidates/profile-completeness'

type RouterLike = {
  push: (href: string) => void
}

/**
 * Navigate to a profile checklist item and highlight the target section when on dashboard.
 */
export function goToProfileField(item: ProfileFieldItem, router: RouterLike): void {
  const { href } = item

  if (isSamePageDashboardLink(href)) {
    const sectionId = sectionIdFromHref(href)
    if (sectionId) {
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        flashProfileSection(sectionId)
        return
      }
    }
  }

  router.push(href)

  if (href.includes('#')) {
    const sectionId = sectionIdFromHref(href)
    if (sectionId) {
      window.setTimeout(() => {
        const el = document.getElementById(sectionId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          flashProfileSection(sectionId)
        }
      }, 400)
    }
  }
}
