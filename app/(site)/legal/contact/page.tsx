import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'How to reach Obsidian Rite Records support.',
}

export default function ContactPage() {
  return (
    <article className="space-y-6 text-muted-foreground">
      <header className="space-y-2">
        <h1 className="blackletter text-4xl text-bone">Contact</h1>
        <p className="leading-relaxed">Questions about an order, wholesale or licensing? We respond within two business days.</p>
      </header>

      <section className="space-y-2">
        <h2 className="gothic-heading text-bone text-xl">Email</h2>
        <p>
          <a className="underline" href="mailto:arg@obsidianriterecords.com">arg@obsidianriterecords.com</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="gothic-heading text-bone text-xl">Social</h2>
        <p className="leading-relaxed">Instagram DMs are open for quick questions: <a className="underline" href="https://www.instagram.com/obsidianriterecords/" target="_blank" rel="noreferrer">@obsidianriterecords</a>. Facebook messages are currently routed through <a className="underline" href="https://www.facebook.com/scruffylikestoast" target="_blank" rel="noreferrer">Scruffy Likes Toast</a> until the business page is live.</p>
      </section>

      <section className="space-y-2">
        <h2 className="gothic-heading text-bone text-xl">Demos &amp; Press Kits</h2>
        <p className="leading-relaxed">Send Bandcamp or private streaming links. We review submissions monthly.</p>
      </section>
    </article>
  )
}
