import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms for using the Obsidian Rite Records online store.',
}

export default function TermsPage() {
  return (
    <article className="space-y-6 text-muted-foreground">
      <header className="space-y-2">
        <h1 className="blackletter text-4xl text-bone">Terms of Service</h1>
        <p>By purchasing through this store you agree to the terms set out below.</p>
      </header>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Pricing &amp; payments</h2>
        <p>All prices are listed in AUD and processed securely via Stripe. Orders are confirmed only after payment is authorised.</p>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Preorders</h2>
        <p>Preorder dates are estimates. If manufacturing delays occur we will notify you via email with the updated ship date. You can cancel for a full refund before the release ships.</p>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Limitation of liability</h2>
        <p>We are not liable for loss once a package is marked delivered by the carrier. Please choose tracked shipping and ensure your delivery address is secure.</p>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Governing law</h2>
        <p>These terms are governed by the laws of Victoria, Australia.</p>
      </section>
    </article>
  )
}

