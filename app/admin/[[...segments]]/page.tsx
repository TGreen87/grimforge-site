"use client";

import { NavigateToResource } from "@refinedev/nextjs-router";

export default function AdminPage({ params }: { params: { segments?: string[] } }) {
  // If no segments, redirect to products list (default resource)
  if (!params.segments || params.segments.length === 0) {
    return <NavigateToResource resource="products" />;
  }

  // This page acts as a catch-all for admin routes
  // The actual routing is handled by the RefineProvider and individual resource pages
  return null;
}