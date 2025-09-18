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
      id: "create-campaign",
      name: "Create Campaign",
      shortcut: ["n", "c"],
      keywords: "new campaign hero",
      section: "Create",
      perform: () => router.push("/admin/campaigns/create"),
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
    {
      id: "new-stock-unit",
      name: "Create Stock Unit",
      shortcut: ["n", "s"],
      keywords: "variant stock unit create",
      section: "Create",
      perform: () => router.push("/admin/variants/create"),
    },
    {
      id: "inventory-cards",
      name: "Inventory (Cards)",
      shortcut: ["i", "c"],
      section: "Navigate",
      perform: () => { try { localStorage.setItem("admin:view:inventory", "cards"); } catch {}; router.push("/admin/inventory"); },
    },
    {
      id: "customers-cards",
      name: "Customers (Cards)",
      shortcut: ["c", "c"],
      section: "Navigate",
      perform: () => { try { localStorage.setItem("admin:view:customers", "cards"); } catch {}; router.push("/admin/customers"); },
    },
    {
      id: "articles-cards",
      name: "Articles (Cards)",
      shortcut: ["a", "c"],
      section: "Navigate",
      perform: () => { try { localStorage.setItem("admin:view:articles", "cards"); } catch {}; router.push("/admin/articles"); },
    },
    {
      id: "campaigns-cards",
      name: "Campaigns (Cards)",
      shortcut: ["c", "p"],
      section: "Navigate",
      perform: () => { try { localStorage.setItem("admin:view:campaigns", "cards"); } catch {}; router.push("/admin/campaigns"); },
    },
  ];

  useRegisterActions(actions, []);
  return null;
}
