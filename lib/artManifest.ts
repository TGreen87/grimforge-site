export interface ArtManifestEntry {
  /** URL pointing to the void-mode asset */
  void: string
}

export type ArtManifest = Record<string, ArtManifestEntry>

/**
 * Placeholder manifest. Replace the sample selectors with production assets when ready.
 */
export const voidArtManifest: ArtManifest = {
  'img[data-void-key="hero-logo"]': { void: '/art/ant/hero-logo-void.png' },
  'img[data-void-key="hero-art"]': { void: '/art/ant/hero-art-void.jpg' },
  'img[data-void-key="album-1"]': { void: '/art/ant/album-1-void.jpg' },
  'img[data-void-key="album-2"]': { void: '/art/ant/album-2-void.jpg' },
  'img[data-void-key="album-3"]': { void: '/art/ant/album-3-void.jpg' },
  'img[data-void-key="album-4"]': { void: '/art/ant/album-4-void.jpg' },
  'img[data-void-key="album-5"]': { void: '/art/ant/album-5-void.jpg' },
  'img[data-void-key="album-6"]': { void: '/art/ant/album-6-void.jpg' },
  'img[data-void-key^="preorder-album-1"]': { void: '/art/ant/album-1-void.jpg' },
  'img[data-void-key^="preorder-album-2"]': { void: '/art/ant/album-2-void.jpg' },
  'img[data-void-key^="preorder-album-3"]': { void: '/art/ant/album-3-void.jpg' },
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
