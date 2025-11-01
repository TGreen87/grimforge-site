import { getStripe } from "@/lib/stripe";

type Props = { searchParams?: { session_id?: string } };

export default async function SuccessPage({ searchParams }: Props) {
  const sid = searchParams?.session_id;
  if (!sid) {
    return (
      <main className="container mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-semibold mb-2">No session found</h1>
        <p className="text-sm text-muted-foreground">
          We could not find your payment session. If you just paid, please check your email for the Stripe receipt.
        </p>
      </main>
    );
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sid, {
    expand: ["line_items.data.price.product"],
  });

  const email =
    session.customer_details?.email || session.customer_email || "customer";
  const items = session.line_items?.data ?? [];
  const totalAud = ((session.amount_total ?? 0) / 100).toFixed(2);

  return (
    <main className="container mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Thanks, {email}</h1>
        <p className="text-sm text-muted-foreground">
          Your payment was received. Below is a summary of your order.
        </p>
      </div>

      <section className="rounded-lg border border-border/60 p-4">
        <h2 className="mb-3 font-medium">Items</h2>
        <ul className="space-y-2">
          {items.map((li) => {
            const qty = li.quantity ?? 1;
            // @ts-ignore expanded by Stripe retrieve
            const price = li.price;
            const product = price?.product as { name?: string } | undefined;
            const name = product?.name ?? "Item";
            const amount = ((li.amount_subtotal ?? 0) / 100).toFixed(2);
            return (
              <li key={li.id} className="flex items-center justify-between text-sm">
                <span>{name} × {qty}</span>
                <span>${amount} AUD</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-sm">
          <span>Total paid</span>
          <span>${totalAud} AUD</span>
        </div>
      </section>

      <div className="text-sm text-muted-foreground">
        <p>If you do not see a confirmation email, check your spam folder.</p>
      </div>
    </main>
  );
}
