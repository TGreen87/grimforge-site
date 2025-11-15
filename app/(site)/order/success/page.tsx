import Link from 'next/link'
import ClearCartEffect from '@/components/cart/ClearCartEffect'

interface SuccessPageProps {
  searchParams: { session_id?: string }
}

export const dynamic = 'force-dynamic'

export default function OrderSuccessPage({ searchParams }: SuccessPageProps) {
  const sessionId = searchParams?.session_id

  return (
    <main className="container mx-auto px-4 py-16 lg:py-24 min-h-[60vh]">
      <ClearCartEffect />
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card/70 p-8 text-center shadow-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Thank you</p>
        <h1 className="mt-4 blackletter text-4xl text-bone">Order received</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          We&apos;re preparing your items for dispatch. You&apos;ll get a receipt and tracking details via email soon.
        </p>
        {sessionId ? (
          <p className="mt-2 text-xs text-muted-foreground">Stripe session: {sessionId}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm uppercase tracking-[0.3em] text-bone hover:bg-border/30"
          >
            Continue browsing
          </Link>
          <Link
            href="/status"
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            View site status
          </Link>
        </div>
      </div>
    </main>
  )
}
