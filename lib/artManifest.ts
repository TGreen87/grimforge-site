export interface ArtManifestEntry {
  /** URL pointing to the void-mode asset */
  void: string
}

export type ArtManifest = Record<string, ArtManifestEntry>

/**
 * Placeholder manifest. Replace the sample selectors with production assets when ready.
 */
export const voidArtManifest: ArtManifest = {
  // '#hero-marquee img': { void: '/void/hero-marquee.jpg' },
  // '.catalog-tile img': { void: '/void/catalog-tile.jpg' },
}

function isImageElement(node: Element): node is HTMLImageElement {
  return node.tagName === 'IMG'
}

type QueryableRoot = Document | DocumentFragment | Element

/**
 * Enriches matching <img> tags with data-void-src attributes so void-mode swaps instantly.
 */
export function applyArtManifest(manifest: ArtManifest, root?: QueryableRoot): void {
  if (typeof window === 'undefined') return

  const scope: QueryableRoot = root ?? document

  Object.entries(manifest).forEach(([selector, entry]) => {
    if (!entry?.void || typeof scope.querySelectorAll !== 'function') return

    const matches = scope.querySelectorAll(selector)
    matches.forEach((node) => {
      if (!isImageElement(node)) return
      if (!node.dataset.voidSrc) {
        node.dataset.voidSrc = entry.void
      }
    })
  })
}
