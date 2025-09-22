import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Size Guide',
  description: 'Fit information for Obsidian Rite Records merchandise.',
}

export default function SizeGuidePage() {
  return (
    <article className="space-y-6 text-muted-foreground">
      <header className="space-y-2">
        <h1 className="blackletter text-4xl text-bone">Size Guide</h1>
        <p className="leading-relaxed">Apparel is coming later in the release schedule. When we launch the first drop, this page will include flat measurements, fit notes and care instructions.</p>
      </header>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">While You Wait</h2>
        <p className="leading-relaxed">If you are planning ahead for merch, drop us a line with your preferred fit. We will confirm blank suppliers and sizing before pre-orders open so you can order confidently.</p>
      </section>
    </article>
  )
}
