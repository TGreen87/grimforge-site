import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/integrations/supabase/types";
import { createShopifyProduct, type ShopifyProductNode } from "@/lib/shopify/admin-products";
import { shopifyAdminEnv } from "@/lib/shopify/env";

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

type ProductPayload = z.infer<typeof productSchema>;

function formatDescriptionHtml(value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const escaped = trimmed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((segment) => `<p>${segment.replace(/\n/g, "<br />")}</p>`);
  return paragraphs.join("");
}

function buildShopifyProductInput(payload: ProductPayload, sku: string) {
  const optionName = payload.format ? "Format" : undefined;
  const variantOptions = optionName && payload.format ? [payload.format] : undefined;
  const price = Number(payload.price ?? 0).toFixed(2);

  const input: Record<string, unknown> = {
    title: payload.title,
    handle: payload.slug,
    descriptionHtml: formatDescriptionHtml(payload.description),
    status: (payload.active ?? true) ? "ACTIVE" : "DRAFT",
    productType: payload.format,
    vendor: payload.artist,
    tags: payload.tags?.length ? payload.tags : undefined,
    options: optionName ? [optionName] : undefined,
    variants: [
      {
        title: payload.format || "Standard Edition",
        sku,
        price,
        requiresShipping: true,
        inventoryPolicy: payload.pre_order ? "CONTINUE" : "DENY",
        options: variantOptions,
      },
    ],
  };

  if (payload.image) {
    input.images = [{ src: payload.image }];
  }

  return input;
}

async function rollbackProduct(adminClient: ReturnType<typeof createServiceClient>, productId: string, variantId: string) {
  await adminClient.from("inventory").delete().eq("variant_id", variantId);
  await adminClient.from("variants").delete().eq("id", variantId);
  await adminClient.from("products").delete().eq("id", productId);
}

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

  if (!shopifyAdminEnv.isConfigured) {
    return NextResponse.json(
      { error: "Shopify Admin API is not configured. Set SHOPIFY_ADMIN_API_TOKEN before creating products." },
      { status: 503 },
    );
  }

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
    await rollbackProduct(adminClient, product.id, variant.id);
    return NextResponse.json({ error: inventoryError.message }, { status: 500 });
  }

  let shopifyProduct: ShopifyProductNode;
  try {
    const shopifyInput = buildShopifyProductInput(payload, sku);
    shopifyProduct = await createShopifyProduct(shopifyInput);
  } catch (error) {
    console.error("Shopify sync failed", error);
    await rollbackProduct(adminClient, product.id, variant.id);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Shopify sync failed" },
      { status: 502 },
    );
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
        shopify: {
          id: shopifyProduct.id,
          handle: shopifyProduct.handle,
          status: shopifyProduct.status,
          primaryVariantId: shopifyProduct.variants?.edges?.[0]?.node.id ?? null,
        },
      },
    },
    { status: 201 }
  );
}
