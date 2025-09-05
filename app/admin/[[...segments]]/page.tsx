"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// Catch-all admin route handler.
// If user visits /admin directly, redirect to /admin/products.
// Specific admin subpages (e.g. /admin/products) are handled by their own routes.
export default function AdminPage() {
  const router = useRouter();
  const params = useParams();
  const segmentsParam = params?.segments as string | string[] | undefined;
  const segments = Array.isArray(segmentsParam)
    ? segmentsParam
    : segmentsParam
    ? [segmentsParam]
    : [];

  useEffect(() => {
    if (!segments || segments.length === 0) {
      router.replace("/admin/products");
    }
  }, [router]);

  // For specific segments, dedicated pages under /admin/* will match and render.
  // This catch-all returns null to avoid interfering with those routes.
  return null;
}
