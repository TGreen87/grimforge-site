'use client'

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { subscribe } from "@/services/newsletterService";

const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const res = subscribe(email, consent);
    setLoading(false);
    toast({
      title: res.ok ? "Subscribed" : "Subscription failed",
      description: res.message,
      variant: res.ok ? "default" : "destructive",
    });
    if (res.ok) setEmail("");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex">
        <Input
          type="email"
          placeholder="arg@obsidianriterecords.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-r-none"
          required
          aria-label="Email address"
        />
        <Button type="submit" disabled={loading} className="rounded-l-none">
          {loading ? "Subscribing..." : "Subscribe"}
        </Button>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} />
        I agree to receive emails and accept the privacy policy.
      </label>
    </form>
  );
};

export default NewsletterSignup;
