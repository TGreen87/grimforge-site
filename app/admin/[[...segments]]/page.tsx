"use client";

import { NavigateToResource } from "@refinedev/nextjs-router";

export default function AdminPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  // This is a client component, so we can't await params
  // The actual routing is handled by RefineProvider
  return <NavigateToResource resource="products" />;
}