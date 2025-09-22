import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Care Instructions',
  description: 'How to keep merch purchased from Obsidian Rite Records in top condition.',
}

export default function CareInstructionsPage() {
  return (
    <article className="space-y-6 text-muted-foreground">
      <header className="space-y-2">
        <h1 className="blackletter text-4xl text-bone">Care Instructions</h1>
        <p className="leading-relaxed">Take a moment to store your records properly—most damage happens long after the parcel arrives.</p>
      </header>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Vinyl Records</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Store jackets upright in a cool, dry space away from direct sunlight.</li>
          <li>Swap paper inners for anti-static sleeves to reduce surface noise.</li>
          <li>Brush each side with a carbon fibre brush before the needle drops.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Cassettes &amp; CDs</h2>
        <p className="leading-relaxed">Keep plastic shells out of heat and humidity. If cases arrive cracked, email us and we will send replacements with your next order.</p>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Packaging &amp; Collectibles</h2>
        <p className="leading-relaxed">Limited inserts and booklets are best stored in acid-free sleeves. Avoid folding posters along new seams—re-roll them loosely if you need to transport them.</p>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Apparel Coming Soon</h2>
        <p className="leading-relaxed">We are not selling apparel just yet. When the first run lands, we will publish care specifics alongside the product listings.</p>
      </section>
    </article>
  )
}
