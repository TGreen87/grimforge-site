"use client";
import React from "react";
import { Segmented } from "antd";
import { AppstoreOutlined, BarsOutlined, ProjectOutlined } from "@ant-design/icons";

export type AdminView = 'table' | 'cards' | 'board';

function keyFor(resource: string) {
  return `admin:view:${resource}`;
}

export function getStoredView(resource: string, fallback: AdminView = 'table'): AdminView {
  try {
    const raw = localStorage.getItem(keyFor(resource));
    if (raw === 'table' || raw === 'cards' || raw === 'board') return raw;
  } catch {}
  return fallback;
}

export default function AdminViewToggle({
  resource,
  value,
  onChange,
  allowBoard = false,
}: {
  resource: string;
  value: AdminView;
  onChange: (v: AdminView) => void;
  allowBoard?: boolean;
}) {
  const options = [
    { label: <span className="flex items-center gap-1"><BarsOutlined /> Table</span>, value: 'table' },
    { label: <span className="flex items-center gap-1"><AppstoreOutlined /> Cards</span>, value: 'cards' },
  ] as any[];
  if (allowBoard) options.push({ label: <span className="flex items-center gap-1"><ProjectOutlined /> Board</span>, value: 'board' });

  return (
    <Segmented
      value={value}
      onChange={(v) => {
        const next = v as AdminView;
        try { localStorage.setItem(keyFor(resource), next); } catch {}
        onChange(next);
      }}
      options={options}
    />
  );
}

