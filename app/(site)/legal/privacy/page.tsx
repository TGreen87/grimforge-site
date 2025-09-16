import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Obsidian Rite Records handles personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <article className="space-y-6 text-muted-foreground">
      <header className="space-y-2">
        <h1 className="blackletter text-4xl text-bone">Privacy Policy</h1>
        <p>This policy outlines what data we collect, how it is used, and your rights.</p>
      </header>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Information we collect</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Contact details provided during checkout (name, email, shipping address).</li>
          <li>Order history and payment confirmations from Stripe.</li>
          <li>Optional newsletter subscription info.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">How it is used</h2>
        <p>We use your information to fulfil orders, communicate shipping updates and send opt-in marketing emails. We do not sell or rent customer data.</p>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Third parties</h2>
        <p>Payment processing is handled by Stripe. Shipping labels are generated through Australia Post. These providers only receive the data required to complete the service.</p>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Your rights</h2>
        <p>Contact us to update or delete your account information. You can unsubscribe from the newsletter at any time using the link in each email.</p>
      </section>
    </article>
  )
}

