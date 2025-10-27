"use client"

import { useState } from "react"

const TEST_ROUTES_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TEST_ROUTES === "1"
const TEST_PRICE_ID = process.env.NEXT_PUBLIC_TEST_PRICE_ID ?? ""

export default function TestCheckoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!TEST_ROUTES_ENABLED) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">Test checkout route is disabled.</p>
      </main>
    )
  }

  const handleCheckout = async () => {
    setErrorMessage(null)

    if (!TEST_PRICE_ID) {
      setErrorMessage("NEXT_PUBLIC_TEST_PRICE_ID is not configured.")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId: TEST_PRICE_ID, quantity: 1 }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data || typeof data.url !== "string") {
        const fallback =
          typeof data?.message === "string"
            ? data.message
            : typeof data?.error === "string"
            ? data.error
            : `Checkout failed with status ${response.status}`
        throw new Error(fallback)
      }

      window.location.assign(data.url)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout."
      setErrorMessage(message)
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-lg font-semibold">Stripe Checkout Smoke Test</h1>
      <p className="text-sm text-muted-foreground">
        Press the button below to create a checkout session using the configured test price.
      </p>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isSubmitting}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating session..." : "Start Test Checkout"}
      </button>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </main>
  )
}
