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
        <p className="leading-relaxed">Follow the guidelines below to preserve prints, vinyl and packaging.</p>
      </header>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Apparel</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Wash inside-out on a cold, gentle cycle.</li>
          <li>Hang dry out of direct sunlight to prevent cracking.</li>
          <li>Do not iron directly over prints—use a pressing cloth.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Vinyl Records</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Store vertically in a cool, dry space.</li>
          <li>Replace inner sleeves with anti-static rice paper if available.</li>
          <li>Wipe dust with a carbon fibre brush before each spin.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="gothic-heading text-bone text-xl">Cassettes &amp; CDs</h2>
        <p className="leading-relaxed">Keep plastics free from heat. If shells or cases crack during shipping, contact us for replacements.</p>
      </section>
    </article>
  )
}
