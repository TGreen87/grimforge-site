"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table } from "antd";

type RoleRow = { user_id: string; email: string; role: string };

export default function UsersAdminPage() {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/roles", { cache: "no-store" });
      const json = await res.json();
      setRows(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grantAdmin = async () => {
    if (!email) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "admin" }),
      });
      if (!res.ok) {
        const j = await res.json();
        alert("Failed: " + (j?.error || res.statusText));
      } else {
        setEmail("");
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const removeAdmin = async (row: RoleRow) => {
    if (!confirm(`Remove admin role for ${row.email}?`)) return;
    const res = await fetch("/api/admin/users/roles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: row.email }),
    });
    if (!res.ok) {
      const j = await res.json();
      alert("Failed: " + (j?.error || res.statusText));
    } else {
      load();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Users & Roles</h1>

      <Card className="p-4 space-y-3">
        <div className="text-sm text-muted-foreground">
          Grant or remove the admin role by email. This uses a secure server API; no direct Supabase admin UI needed.
        </div>
        <div className="flex gap-2 items-center max-w-xl">
          <Input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={grantAdmin} disabled={saving || !email}>
            {saving ? "Saving…" : "Grant Admin"}
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table
          dataSource={rows}
          loading={loading}
          rowKey={(r) => r.user_id + ":" + r.role}
          columns={[
            { title: "Email", dataIndex: "email" },
            { title: "Role", dataIndex: "role", render: (v: string) => <Badge>{v}</Badge> },
            {
              title: "Actions",
              key: "actions",
              render: (_: any, row: RoleRow) => (
                <div className="flex gap-2">
                  {row.role === "admin" && (
                    <Button variant="outline" onClick={() => removeAdmin(row)}>
                      Remove Admin
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          pagination={false}
        />
      </Card>
    </div>
  );
}

