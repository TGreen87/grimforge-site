"use client";
import React from "react";
import { Dropdown, Button, Checkbox, Space } from "antd";
import { SettingOutlined } from "@ant-design/icons";

type ColumnDef = { key: string; label: string };

function storageKey(resource: string) {
  return `admin:cols:${resource}`;
}

export default function AdminColumnSettings({
  resource,
  columns,
  value,
  onChange,
}: {
  resource: string;
  columns: ColumnDef[];
  value: string[];
  onChange: (keys: string[]) => void;
}) {
  const items = columns.map((c) => ({
    key: c.key,
    label: (
      <Checkbox
        checked={value.includes(c.key)}
        onChange={(e) => {
          const next = e.target.checked
            ? Array.from(new Set([...value, c.key]))
            : value.filter((k) => k !== c.key);
          onChange(next);
          try {
            localStorage.setItem(storageKey(resource), JSON.stringify(next));
          } catch {}
        }}
      >
        {c.label}
      </Checkbox>
    ),
  }));

  return (
    <Dropdown
      menu={{ items }}
      trigger={["click"]}
    >
      <Button icon={<SettingOutlined />}>Columns</Button>
    </Dropdown>
  );
}

export function getStoredColumns(resource: string, fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(storageKey(resource));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) return parsed as string[];
    }
  } catch {}
  return fallback;
}

