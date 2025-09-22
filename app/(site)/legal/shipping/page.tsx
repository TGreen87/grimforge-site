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
        <p className="leading-relaxed">We ship worldwide from Australia. All parcels are packed by hand with rigid mailers and corner protection.</p>
      </header>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Dispatch Cadence</h2>
        <p className="leading-relaxed">Orders are processed within three business days. Pre-orders ship on the release date announced on each product page.</p>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Carriers &amp; Tracking</h2>
        <p className="leading-relaxed">Domestic orders ship with Australia Post tracked satchels. International orders travel with Australia Post International Standard unless you request an upgrade during checkout.</p>
        <p className="leading-relaxed">Tracking numbers are emailed automatically when the parcel is lodged.</p>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Rates &amp; Customs</h2>
        <p className="leading-relaxed">Shipping rates shown at checkout are calculated from Australia Post weight bands. International customers are responsible for any customs duty or VAT charged at the destination.</p>
      </section>
    </article>
  )
}
