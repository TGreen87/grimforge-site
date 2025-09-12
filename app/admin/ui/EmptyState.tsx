"use client";
import React from "react";
import { Button } from "antd";

export default function EmptyState({
  icon,
  title,
  helper,
  primaryAction,
  secondaryLink,
}: {
  icon?: React.ReactNode;
  title: string;
  helper?: string;
  primaryAction?: { label: string; href?: string; onClick?: () => void };
  secondaryLink?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-border rounded" style={{ background: "var(--clr-bg-elev0)" }}>
      {icon && <div className="mb-3 text-[var(--clr-text-med)]">{icon}</div>}
      <h3 className="text-bone text-lg mb-1">{title}</h3>
      {helper && <p className="text-[13px] text-[var(--clr-text-med)] mb-4 max-w-md">{helper}</p>}
      <div className="flex items-center gap-3">
        {primaryAction && (
          <Button type="primary" href={primaryAction.href} onClick={primaryAction.onClick}>{primaryAction.label}</Button>
        )}
        {secondaryLink && (
          <a href={secondaryLink.href} className="text-[var(--clr-primary)] text-[13px] underline">{secondaryLink.label}</a>
        )}
      </div>
    </div>
  );
}
