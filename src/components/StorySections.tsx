"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const timeline = [
  {
    year: "2015",
    title: "Ritual Beginnings",
    description: "Obsidian Rite Records forms in a Hobart basement, pressing 50 copies of a demo on recycled wax.",
  },
  {
    year: "2017",
    title: "Into the Underground",
    description: "Partnerships across AUS/NZ bring in exclusive cassettes and first press vinyl runs for touring acts.",
  },
  {
    year: "2020",
    title: "Global Distribution",
    description: "Warehouse upgrade + Supabase storefront launch enables worldwide fulfilment during lockdowns.",
  },
  {
    year: "2024",
    title: "Campaign Era",
    description: "Dynamic campaign hero + analytics stack give artists a spotlight ahead of each ritual release.",
  },
];

const testimonials = [
  {
    quote: "The only label that ships faster than the blast beats they promote.",
    author: "Serpent's Wake Zine",
  },
  {
    quote: "Packaging is immaculate, pressings are pristine, and every parcel smells like bonfire smoke.",
    author: "Nocturnal Frequencies",
  },
  {
    quote: "Obsidian Rite championed our debut when bigger labels wouldn’t return email.",
    author: "Thy Ossuary (NZ)",
  },
];

export function StorySections() {
  return (
    <section className="bg-background/95 py-20">
      <div className="container mx-auto grid gap-16 px-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-6"
        >
          <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Label Story</span>
          <h2 className="blackletter text-4xl text-bone sm:text-5xl">An underground lineage</h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Obsidian Rite amplifies black metal with handmade pressings, artist-first releases, and rituals spanning antipodean forests to Nordic crypts.
          </p>
          <ol className="relative space-y-6 border-l border-border pl-6">
            {timeline.map((item) => (
              <li key={item.year} className="space-y-1">
                <div className="absolute -left-[7px] h-3 w-3 rounded-full border border-border bg-background" aria-hidden="true" />
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{item.year}</p>
                <p className="font-semibold text-bone">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ol>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-6 rounded-2xl border border-border bg-[#0d1117] p-8 shadow-lg"
        >
          <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Testimony</span>
          <h2 className="blackletter text-3xl text-bone">What the coven says</h2>
          <div className="space-y-5">
            {testimonials.map(({ quote, author }) => (
              <blockquote
                key={author}
                className="rounded-xl border border-border/60 bg-background/30 p-5 text-sm text-muted-foreground"
              >
                <p className="italic">“{quote}”</p>
                <footer className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground/80">{author}</footer>
              </blockquote>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function NewsletterSection() {
  return (
    <section className="bg-gradient-to-b from-[#0d1117] via-background to-background py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-2xl rounded-3xl border border-border bg-background/60 p-8 shadow-xl backdrop-blur"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Newsletter</span>
          <h2 className="blackletter mt-3 text-3xl text-bone sm:text-4xl">Join the midnight mailing list</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Monthly rituals, early access to limited pressings, and subscriber-only discount codes delivered straight from the furnace.
          </p>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              placeholder="you@abyssalmail.com"
              className="w-full rounded-lg border border-border bg-background/80 px-4 py-3 text-sm text-bone focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Email address"
            />
            <Button type="submit" className="h-12 px-6" size="lg">
              Subscribe
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">No spam. Unsubscribe anytime.</p>
        </motion.div>
      </div>
    </section>
  );
}
