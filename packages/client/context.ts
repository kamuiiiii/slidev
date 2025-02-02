import { shallowRef, toRef } from 'vue'
import { injectLocal, objectOmit, provideLocal } from '@vueuse/core'
import { useFixedClicks } from './composables/useClicks'
import {
  FRONTMATTER_FIELDS,
  HEADMATTER_FIELDS,
  injectionClicksContext,
  injectionCurrentPage,
  injectionFrontmatter,
  injectionRenderContext,
  injectionRoute,
  injectionSlidevContext,
} from './constants'

const clicksContextFallback = shallowRef(useFixedClicks()[1])

/**
 * Get the current slide context, should be called inside the setup function of a component inside slide
 */
export function useSlideContext() {
  const $slidev = injectLocal(injectionSlidevContext)!
  const $nav = toRef($slidev, 'nav')
  const $clicksContext = injectLocal(injectionClicksContext, clicksContextFallback)!.value
  const $clicks = toRef($clicksContext, 'current')
  const $page = injectLocal(injectionCurrentPage)!
  const $renderContext = injectLocal(injectionRenderContext)!
  const $frontmatter = injectLocal(injectionFrontmatter, {})
  const $route = injectLocal(injectionRoute, undefined)

  return {
    $slidev,
    $nav,
    $clicksContext,
    $clicks,
    $page,
    $route,
    $renderContext,
    $frontmatter,
  }
}

export function provideFrontmatter(frontmatter: Record<string, any>) {
  provideLocal(injectionFrontmatter, frontmatter)

  const {
    $slidev,
    $page,
  } = useSlideContext()

  // update frontmatter in router to make HMR work better
  const route = $slidev.nav.rawRoutes.find(i => i.path === String($page.value))
  if (route?.meta?.slide?.frontmatter) {
    for (const key of Object.keys(route.meta.slide.frontmatter)) {
      if (!(key in frontmatter))
        delete route.meta.slide.frontmatter[key]
    }
    Object.assign(route.meta.slide.frontmatter, frontmatter)
  }
}

/**
 * Convert frontmatter options to props for v-bind
 * It removes known options fields, and expose an extra `frontmatter` field that contains full frontmatter
 */
export function frontmatterToProps(frontmatter: Record<string, any>, pageNo: number) {
  return {
    ...objectOmit(frontmatter, pageNo === 0 ? HEADMATTER_FIELDS : FRONTMATTER_FIELDS),
    frontmatter,
  }
}
