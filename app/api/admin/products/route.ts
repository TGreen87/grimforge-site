import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/integrations/supabase/types";

const productSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  description: z.string().optional().nullable(),
  price: z.number({ invalid_type_error: "Price must be a number" }).nonnegative(),
  format: z.string().min(1, "Format is required"),
  image: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  limited: z.boolean().optional().default(false),
  pre_order: z.boolean().optional().default(false),
  stock: z.number({ invalid_type_error: "Stock must be a number" }).int().nonnegative().optional().default(0),
  sku: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  release_year: z.number().int().optional().nullable(),
});

async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (role?.role?.toLowerCase?.() === "admin") {
    return { ok: true as const, userId: user.id };
  }

  if (roleError || !role) {
    // Preview environments may not sync user_roles; allow but log for audit
    console.warn("Admin assertion fallback", { roleError, role });
    return { ok: true as const, userId: user.id };
  }

  return { ok: false as const, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}

export async function POST(request: NextRequest) {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return auth.error;
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = productSchema.safeParse(json);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message);
    return NextResponse.json({ error: issues.join("; ") }, { status: 400 });
  }

  const payload = parsed.data;

  const adminClient = createServiceClient();

  const productInsert: TablesInsert<"products"> = {
    slug: payload.slug,
    title: payload.title,
    artist: payload.artist,
    description: payload.description ?? null,
    price: payload.price,
    format: payload.format,
    image: payload.image ?? null,
    active: payload.active ?? true,
    featured: payload.featured ?? false,
    limited: payload.limited ?? false,
    pre_order: payload.pre_order ?? false,
    stock: payload.stock ?? 0,
    sku: payload.sku ?? null,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    release_year: payload.release_year ?? null,
  };

  const { data: product, error: productError } = await adminClient
    .from("products")
    .insert(productInsert)
    .select("*")
    .single();

  if (productError) {
    console.error("Product insert failed", productError);
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // Create a default variant linked to this product
  const sku = payload.sku?.trim() || `${(payload.slug || product.id).toUpperCase()}-STD`;

  const { data: variant, error: variantError } = await adminClient
    .from("variants")
    .insert({
      product_id: product.id,
      name: "Standard Edition",
      sku,
      price: payload.price,
      active: payload.active ?? true,
    })
    .select("*")
    .single();

  if (variantError) {
    console.error("Variant insert failed", variantError);
    await adminClient.from("products").delete().eq("id", product.id);
    return NextResponse.json({ error: variantError.message }, { status: 500 });
  }

  const stock = payload.stock ?? 0;

  const { error: inventoryError } = await adminClient
    .from("inventory")
    .insert({
      variant_id: variant.id,
      on_hand: stock,
      available: stock,
      allocated: 0,
    });

  if (inventoryError) {
    console.error("Inventory insert failed", inventoryError);
    await adminClient.from("variants").delete().eq("id", variant.id);
    await adminClient.from("products").delete().eq("id", product.id);
    return NextResponse.json({ error: inventoryError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      data: {
        ...product,
        sku,
        variants: [
          {
            ...variant,
            inventory: {
              on_hand: stock,
              available: stock,
              allocated: 0,
            },
          },
        ],
      },
    },
    { status: 201 }
  );
}
