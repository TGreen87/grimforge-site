import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Returns & Exchanges',
  description: 'Return policy for Obsidian Rite Records online orders.',
}

export default function ReturnsPage() {
  return (
    <article className="space-y-6 text-muted-foreground">
      <header className="space-y-2">
        <h1 className="blackletter text-4xl text-bone">Returns &amp; Exchanges</h1>
        <p>Pressed music is fragile. Let us know within 7 days of delivery if something arrives damaged so we can make it right.</p>
      </header>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Damaged or defective items</h2>
        <p>Email photos to <a className="underline" href="mailto:arg@obsidianriterecords.com">arg@obsidianriterecords.com</a> along with your order number. We will ship a replacement or issue a refund once the claim is approved.</p>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Change of mind</h2>
        <p>Because of the limited nature of our releases we cannot offer returns for change of mind. Please double-check formats and quantities before completing checkout.</p>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Return shipping</h2>
        <p>If we request that you send an item back, please reuse the mailer and include the original packing slip. We will email a prepaid label for approved cases.</p>
      </section>
    </article>
  )
}
