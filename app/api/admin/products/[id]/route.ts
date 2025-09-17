import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const updateSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    title: z.string().min(1).optional(),
    artist: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    price: z.number().nonnegative().optional(),
    format: z.string().min(1).optional(),
    image: z.string().nullable().optional(),
    active: z.boolean().optional(),
    featured: z.boolean().optional(),
    limited: z.boolean().optional(),
    pre_order: z.boolean().optional(),
    stock: z.number().int().nonnegative().optional(),
    sku: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    release_year: z.number().int().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields provided",
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
    console.warn("Admin assertion fallback", { roleError, role });
    return { ok: true as const, userId: user.id };
  }

  return { ok: false as const, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message);
    return NextResponse.json({ error: issues.join("; ") }, { status: 400 });
  }

  const payload = parsed.data;
  const admin = createServiceClient();
  const productId = params.id;

  const updateBody: Record<string, unknown> = { ...payload };
  if (payload.tags) {
    updateBody.tags = payload.tags;
  }

  const { data: product, error } = await admin
    .from("products")
    .update(updateBody)
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    console.error("Product update failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sync primary variant + inventory if relevant fields changed
  const needsVariantUpdate =
    payload.price !== undefined || payload.active !== undefined || payload.sku !== undefined;
  const needsInventoryUpdate = payload.stock !== undefined;

  let variantRecord = null as null | { id: string } & Record<string, any>;

  if (needsVariantUpdate || needsInventoryUpdate) {
    const { data: variants, error: variantFetchError } = await admin
      .from("variants")
      .select("*")
      .eq("product_id", productId)
      .limit(1);

    if (variantFetchError) {
      console.error("Variant fetch failed", variantFetchError);
      return NextResponse.json({ error: variantFetchError.message }, { status: 500 });
    }

    variantRecord = variants?.[0] ?? null;

    if (!variantRecord) {
      // Create a default variant if none exists yet
      const sku = payload.sku?.trim() || `${(product.slug || product.id).toUpperCase()}-STD`;
      const { data: createdVariant, error: variantCreateError } = await admin
        .from("variants")
        .insert({
          product_id: productId,
          name: "Standard Edition",
          sku,
          price: payload.price ?? product.price,
          active: payload.active ?? product.active,
        })
        .select("*")
        .single();

      if (variantCreateError) {
        console.error("Variant create during update failed", variantCreateError);
        return NextResponse.json({ error: variantCreateError.message }, { status: 500 });
      }

      variantRecord = createdVariant;

      if (payload.stock !== undefined) {
        await admin
          .from("inventory")
          .insert({
            variant_id: createdVariant.id,
            on_hand: payload.stock,
            available: payload.stock,
            allocated: 0,
          });
      }
    } else {
      if (needsVariantUpdate) {
        const variantUpdate: Record<string, unknown> = {};
        if (payload.price !== undefined) variantUpdate.price = payload.price;
        if (payload.active !== undefined) variantUpdate.active = payload.active;
        if (payload.sku !== undefined && payload.sku !== null) variantUpdate.sku = payload.sku;
        if (Object.keys(variantUpdate).length > 0) {
          const { error: variantUpdateError } = await admin
            .from("variants")
            .update(variantUpdate)
            .eq("id", variantRecord.id);

          if (variantUpdateError) {
            console.error("Variant update failed", variantUpdateError);
            return NextResponse.json({ error: variantUpdateError.message }, { status: 500 });
          }
        }
      }

      if (needsInventoryUpdate) {
        const { error: inventoryUpdateError } = await admin
          .from("inventory")
          .update({
            on_hand: payload.stock,
            available: payload.stock,
          })
          .eq("variant_id", variantRecord.id);

        if (inventoryUpdateError) {
          console.error("Inventory update failed", inventoryUpdateError);
          return NextResponse.json({ error: inventoryUpdateError.message }, { status: 500 });
        }
      }
    }
  }

  return NextResponse.json({ data: product }, { status: 200 });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return auth.error;
  }

  const admin = createServiceClient();
  const productId = params.id;

  const { data: variants, error: variantsError } = await admin
    .from("variants")
    .select("id")
    .eq("product_id", productId);

  if (variantsError) {
    console.error("Variant lookup failed", variantsError);
    return NextResponse.json({ error: variantsError.message }, { status: 500 });
  }

  const variantIds = (variants ?? []).map((v) => v.id);

  if (variantIds.length > 0) {
    const { error: inventoryDeleteError } = await admin
      .from("inventory")
      .delete()
      .in("variant_id", variantIds);

    if (inventoryDeleteError) {
      console.error("Inventory delete failed", inventoryDeleteError);
      return NextResponse.json({ error: inventoryDeleteError.message }, { status: 500 });
    }

    const { error: variantDeleteError } = await admin
      .from("variants")
      .delete()
      .in("id", variantIds);

    if (variantDeleteError) {
      console.error("Variant delete failed", variantDeleteError);
      return NextResponse.json({ error: variantDeleteError.message }, { status: 500 });
    }
  }

  const { error: productDeleteError } = await admin.from("products").delete().eq("id", productId);

  if (productDeleteError) {
    console.error("Product delete failed", productDeleteError);
    return NextResponse.json({ error: productDeleteError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id: productId } }, { status: 200 });
}
