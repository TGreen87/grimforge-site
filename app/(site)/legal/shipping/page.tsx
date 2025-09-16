import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping Information',
  description: 'How we pack and ship Obsidian Rite Records orders.',
}

export default function ShippingPage() {
  return (
    <article className="space-y-6 text-muted-foreground">
      <header className="space-y-2">
        <h1 className="blackletter text-4xl text-bone">Shipping Information</h1>
        <p>We ship worldwide from Australia. All parcels are packed by hand with rigid mailers and corner protection.</p>
      </header>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Dispatch cadence</h2>
        <p>Orders are processed within 3 business days. Preorders ship on the release date announced on the product page.</p>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Carriers &amp; tracking</h2>
        <p>Domestic orders ship with Australia Post tracked satchels. International orders travel with Australia Post International Standard unless you request an upgrade during checkout.</p>
        <p>Tracking numbers are emailed automatically when the parcel is lodged.</p>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Rates &amp; customs</h2>
        <p>Shipping rates shown at checkout are based on weight bands pulled directly from Australia Post. International customers are responsible for any customs duty or VAT charged at the destination.</p>
      </section>
    </article>
  )
}

