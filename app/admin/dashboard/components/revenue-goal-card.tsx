"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface RevenueGoalCardProps {
  current: number;
  previous: number;
  changePct: number | null;
  target: number;
  period: "7d" | "30d";
  currency: string;
}

function formatCurrency(amount: number, currency: string) {
  if (!Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(amount);
  } catch (error) {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatPeriod(period: "7d" | "30d") {
  return period === "7d" ? "Last 7 days" : "Last 30 days";
}

export default function RevenueGoalCard({ current, previous, changePct, target, period, currency }: RevenueGoalCardProps) {
  const { toast } = useToast();
  const [localTarget, setLocalTarget] = useState<string>(target.toString());
  const [localPeriod, setLocalPeriod] = useState<"7d" | "30d">(period);
  const [isPending, startTransition] = useTransition();

  const targetNumber = Number(localTarget);
  const progress = targetNumber > 0 ? Math.min((current / targetNumber) * 100, 999) : 0;
  const goalMet = targetNumber > 0 && current >= targetNumber;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!Number.isFinite(targetNumber) || targetNumber <= 0) {
      toast({ title: "Enter a valid target", description: "Set a positive revenue target before saving.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dashboard_revenue_goal: {
            target: targetNumber,
            period: localPeriod,
          },
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        toast({ title: 'Failed to save goal', description: message || 'Please try again.', variant: 'destructive' });
        return;
      }

      toast({ title: 'Goal updated', description: `Tracking ${formatPeriod(localPeriod).toLowerCase()} target of ${formatCurrency(targetNumber, currency)}.` });
    });
  };

  return (
    <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
      <div className="rounded-xl border border-border bg-background/40 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Revenue goal</p>
            <h2 className="text-2xl font-semibold text-bone">{formatCurrency(current, currency)}</h2>
            <p className="text-xs text-muted-foreground">{formatPeriod(localPeriod)} performance</p>
          </div>
          <div className="text-right">
            <p className={cn('text-xs font-medium', changePct !== null ? (changePct >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-muted-foreground')}>
              {changePct !== null ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}% vs prev` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Prev: {formatCurrency(previous, currency)}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{targetNumber > 0 ? `${Math.min(progress, 999).toFixed(0)}%` : 'Set a target'}</span>
          </div>
          <Progress
            value={Number.isFinite(progress) ? Math.min(progress, 100) : 0}
            className="h-2"
            aria-label="Revenue goal progress"
          />
          <div className="flex items-baseline justify-between text-xs text-muted-foreground">
            <span>Goal</span>
            <span className={cn('font-medium', goalMet ? 'text-emerald-400' : undefined)}>
              {formatCurrency(targetNumber > 0 ? targetNumber : target, currency)}
            </span>
          </div>
          {goalMet ? (
            <p className="text-xs text-emerald-400">Goal exceeded—time to queue the next drop.</p>
          ) : null}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-background/30 p-4 shadow-sm">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="revenue-target">Target ({currency})</Label>
            <Input
              id="revenue-target"
              type="number"
              min={0}
              step="100"
              inputMode="decimal"
              value={localTarget}
              onChange={(event) => setLocalTarget(event.target.value)}
              className="bg-background/60"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="revenue-period">Period</Label>
            <Select
              value={localPeriod}
              onValueChange={(value: "7d" | "30d") => setLocalPeriod(value)}
            >
              <SelectTrigger id="revenue-period" aria-label="Revenue tracking period" className="bg-background/60">
                <SelectValue placeholder="Select window" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" size="sm" className="mt-4 w-full" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save goal'}
        </Button>
      </form>
    </section>
  );
}
