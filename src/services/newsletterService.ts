export type Subscriber = {
  email: string;
  consent: boolean;
  createdAt: string;
};

const KEY = "orr_newsletter_subscribers";

export function subscribe(email: string, consent: boolean): { ok: boolean; message: string } {
  try {
    const raw = localStorage.getItem(KEY);
    const list: Subscriber[] = raw ? JSON.parse(raw) : [];
    const exists = list.some((s) => s.email.toLowerCase() === email.toLowerCase());
    if (exists) return { ok: true, message: "You're already subscribed." };
    list.push({ email, consent, createdAt: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(list));
    return { ok: true, message: "Subscribed successfully." };
  } catch (e) {
    return { ok: false, message: "Could not subscribe. Please try again." };
  }
}
