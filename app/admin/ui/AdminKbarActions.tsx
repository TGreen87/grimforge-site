"use client";
import React from "react";
import { useRouter } from "next/navigation";
import type { Action } from "kbar";
import { useRegisterActions } from "kbar";

export default function AdminKbarActions() {
  const router = useRouter();

  const actions: Action[] = [
    {
      id: "create-product",
      name: "Create Product",
      shortcut: ["n", "p"],
      keywords: "new product create",
      section: "Create",
      perform: () => router.push("/admin/products/create"),
    },
    {
      id: "create-article",
      name: "Create Article",
      shortcut: ["n", "a"],
      keywords: "new article create",
      section: "Create",
      perform: () => router.push("/admin/articles/create"),
    },
    {
      id: "receive-stock",
      name: "Receive Stock",
      shortcut: ["r", "s"],
      keywords: "inventory receive",
      section: "Inventory",
      perform: () => router.push("/admin/inventory"),
    },
    {
      id: "orders-board",
      name: "Orders Board",
      shortcut: ["o", "b"],
      keywords: "orders board kanban",
      section: "Navigate",
      perform: () => {
        try { localStorage.setItem("admin:view:orders", "board"); } catch {}
        router.push("/admin/orders");
      },
    },
    {
      id: "products-cards",
      name: "Products (Cards)",
      shortcut: ["p", "c"],
      section: "Navigate",
      perform: () => { try { localStorage.setItem("admin:view:products", "cards"); } catch {}; router.push("/admin/products"); },
    },
  ];

  useRegisterActions(actions, []);
  return null;
}

