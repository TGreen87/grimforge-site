"use client";

import { NavigateToResource } from "@refinedev/nextjs-router";
import { use } from "react";

export default function AdminPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  // Use React's use() hook to unwrap the promise in client component
  const resolvedParams = use(params);
  
  // If no segments, navigate to dashboard by default
  if (!resolvedParams.segments || resolvedParams.segments.length === 0) {
    return <NavigateToResource resource="dashboard" />;
  }
  
  // Let Refine handle the routing for specific segments
  return <NavigateToResource />;
}
