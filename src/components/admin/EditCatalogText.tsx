import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brand } from "@/config/brand";
interface ProductRow {
  id: string;
  title: string;
  artist: string;
  format: string | null;
  description: string | null;
  active: boolean;
  price: number;
  stock: number;
  sku: string | null;
  release_year: number | null;
  featured: boolean;
  limited: boolean;
  pre_order: boolean;
  image: string | null;
  tags: string[];
}

export default function EditCatalogText() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftDesc, setDraftDesc] = useState<string>("");
  const [draftTitle, setDraftTitle] = useState<string>("");
  const [draftArtist, setDraftArtist] = useState<string>("");
  const [draftFormat, setDraftFormat] = useState<"vinyl" | "cassette" | "cd" | "">("");
  const [draftPrice, setDraftPrice] = useState<string>("");
  const [draftStock, setDraftStock] = useState<string>("");
  const [draftSKU, setDraftSKU] = useState<string>("");
  const [draftActive, setDraftActive] = useState<boolean>(true);
  const [draftFeatured, setDraftFeatured] = useState<boolean>(false);
  const [draftLimited, setDraftLimited] = useState<boolean>(false);
  const [draftPreOrder, setDraftPreOrder] = useState<boolean>(false);
  const [draftReleaseYear, setDraftReleaseYear] = useState<string>("");
  const [draftTagsInput, setDraftTagsInput] = useState<string>("");
  const [draftImage, setDraftImage] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const generateSku = () => {
    const initials = (brand.name || "Store")
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 4);
    const yr = (draftReleaseYear || String(new Date().getFullYear())).replace(/[^0-9]/g, "");
    const fmtMap: Record<string, string> = { vinyl: "VNL", cassette: "CST", cd: "CD" };
    const fmt = fmtMap[(draftFormat || "vinyl").toLowerCase()] || "VNL";
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${initials}-${yr}-${fmt}-${rand}`;
  };

  const onImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    try {
      const ext = file.type.split("/")[1] || "jpg";
      const path = `images/${selected.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(path);
      if (publicUrlData?.publicUrl) {
        setDraftImage(publicUrlData.publicUrl);
        toast({ title: "Image uploaded", description: "Preview updated" });
      }
    } catch (err: any) {
      console.error("Image upload failed", err);
      toast({ title: "Image upload failed", description: err.message ?? "Try a different image", variant: "destructive" });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id,title,artist,format,description,active,price,stock,sku,release_year,featured,limited,pre_order,image,tags")
        .order("created_at", { ascending: false });
      if (!ignore) {
        if (error) {
          console.error("Failed to load products", error);
          toast({ title: "Failed to load", description: error.message, variant: "destructive" });
        } else {
          setProducts(data as ProductRow[]);
        }
        setLoading(false);
      }
    };
    load();
    return () => { ignore = true };
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter(p =>
      p.active && (
        p.title.toLowerCase().includes(q) ||
        p.artist.toLowerCase().includes(q)
      )
    );
  }, [products, query]);

  const selected = products.find(p => p.id === selectedId) || null;

  const onSelect = (p: ProductRow) => {
    setSelectedId(p.id);
    setDraftDesc(p.description || "");
    setDraftTitle(p.title || "");
    setDraftArtist(p.artist || "");
    setDraftFormat((p.format as any) || "vinyl");
    setDraftPrice(p.price != null ? String(p.price) : "");
    setDraftStock(p.stock != null ? String(p.stock) : "");
    setDraftSKU(p.sku || "");
    setDraftActive(!!p.active);
    setDraftFeatured(!!p.featured);
    setDraftLimited(!!p.limited);
    setDraftPreOrder(!!p.pre_order);
    setDraftReleaseYear(p.release_year != null ? String(p.release_year) : "");
    setDraftTagsInput(Array.isArray(p.tags) ? p.tags.join(", ") : "");
    setDraftImage(p.image || "");
  };

  const onSave = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const tagsArray = (draftTagsInput || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = {
        title: draftTitle,
        artist: draftArtist,
        description: draftDesc,
        format: draftFormat || null,
        price: Number(draftPrice || 0),
        stock: parseInt(draftStock || "0", 10),
        sku: draftSKU || null,
        active: draftActive,
        featured: draftFeatured,
        limited: draftLimited,
        pre_order: draftPreOrder,
        release_year: draftReleaseYear ? parseInt(draftReleaseYear, 10) : null,
        image: draftImage || null,
        tags: tagsArray,
      } as Partial<ProductRow> & { [k: string]: any };

      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", selected.id);
      if (error) throw error;

      setProducts((prev) =>
        prev.map((pr) =>
          pr.id === selected.id
            ? {
                ...pr,
                ...payload,
              }
            : pr
        )
      );
      toast({ title: "Saved", description: "Listing updated" });
    } catch (e: any) {
      console.error("Save failed", e);
      toast({ title: "Save failed", description: e.message ?? "Please try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onRevert = () => {
    if (!selected) return;
    setDraftDesc(selected.description || "");
    setDraftTitle(selected.title || "");
    setDraftArtist(selected.artist || "");
    setDraftFormat((selected.format as any) || "vinyl");
    setDraftPrice(selected.price != null ? String(selected.price) : "");
    setDraftStock(selected.stock != null ? String(selected.stock) : "");
    setDraftSKU(selected.sku || "");
    setDraftActive(!!selected.active);
    setDraftFeatured(!!selected.featured);
    setDraftLimited(!!selected.limited);
    setDraftPreOrder(!!selected.pre_order);
    setDraftReleaseYear(selected.release_year != null ? String(selected.release_year) : "");
    setDraftTagsInput(Array.isArray(selected.tags) ? selected.tags.join(", ") : "");
    setDraftImage(selected.image || "");
  };

  const handleRegenerateDescription = async () => {
    if (!draftTitle || !draftArtist) {
      toast({ title: "Missing details", description: "Provide title and artist first.", variant: "destructive" });
      return;
    }
    try {
      setRegenLoading(true);
      const tags = (draftTagsInput || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const { data, error } = await supabase.functions.invoke("regenerate-description", {
        body: {
          title: draftTitle,
          artist: draftArtist,
          format: draftFormat || "vinyl",
          tags,
          existing: draftDesc,
        },
      });
      if (error) throw error;
      const next = (data as any)?.description || "";
      if (next) {
        setDraftDesc(next);
        toast({ title: "Description updated" });
      } else {
        toast({ title: "No description returned", variant: "destructive" });
      }
    } catch (e: any) {
      console.error("Regenerate description failed", e);
      toast({ title: "Failed to regenerate description", description: e.message ?? "Try again later", variant: "destructive" });
    } finally {
      setRegenLoading(false);
    }
  };

  const handleRecommendPrice = async () => {
    if (!draftTitle || !draftArtist) {
      toast({ title: "Missing details", description: "Provide title and artist first.", variant: "destructive" });
      return;
    }
    try {
      setPriceLoading(true);
      const { data, error } = await supabase.functions.invoke("price-research-au", {
        body: {
          title: draftTitle,
          artist: draftArtist,
          format: draftFormat || "vinyl",
          cost: draftPrice ? Number(draftPrice) : null,
        },
      });
      if (error) throw error;
      const suggested = (data as any)?.suggested_price;
      if (typeof suggested === "number" && !Number.isNaN(suggested)) {
        setDraftPrice(String(Number(suggested.toFixed(2))));
        toast({ title: "Price suggestion applied", description: `AUD ${suggested.toFixed(2)}` });
      } else {
        toast({ title: "No price suggestion returned", variant: "destructive" });
      }
    } catch (e: any) {
      console.error("Get recommended price failed", e);
      toast({ title: "Failed to get price", description: e.message ?? "Try again later", variant: "destructive" });
    } finally {
      setPriceLoading(false);
    }
  };

  const handleGenerateSku = () => {
    const sku = generateSku();
    setDraftSKU(sku);
    toast({ title: "SKU generated", description: sku });
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    try {
      setDeleting(true);
      const { error } = await supabase.from("products").delete().eq("id", selected.id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== selected.id));
      setSelectedId(null);
      toast({ title: "Listing deleted" });
    } catch (e: any) {
      console.error("Delete failed", e);
      toast({ title: "Delete failed", description: e.message ?? "Try again later", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Listing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-3">
              <Input
                placeholder="Search by title or artist"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search products"
              />
              <div className="max-h-[420px] overflow-auto rounded border border-border divide-y">
                {loading && (
                  <div className="p-3 text-sm text-muted-foreground">Loading…</div>
                )}
                {!loading && filtered.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">No products</div>
                )}
                {!loading && filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSelect(p)}
                    className={`w-full text-left p-3 hover:bg-muted/50 ${selectedId===p.id ? 'bg-muted' : ''}`}
                    aria-label={`Select ${p.artist} - ${p.title}`}
                  >
                    <div className="font-medium line-clamp-1">{p.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{p.artist}</span>
                      {p.format && <Badge variant="outline" className="uppercase">{p.format}</Badge>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              {selected ? (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">Editing</div>
                    <div className="font-semibold">{selected.artist} – {selected.title}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={draftTitle}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          placeholder="Title"
                          aria-label="Title"
                        />
                        <Input
                          value={draftArtist}
                          onChange={(e) => setDraftArtist(e.target.value)}
                          placeholder="Artist"
                          aria-label="Artist"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Select value={draftFormat || undefined} onValueChange={(v: any) => setDraftFormat(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vinyl">Vinyl</SelectItem>
                            <SelectItem value="cassette">Cassette</SelectItem>
                            <SelectItem value="cd">CD</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="Price (e.g. 24.99)"
                          aria-label="Price"
                          value={draftPrice}
                          onChange={(e) => setDraftPrice(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          type="number"
                          placeholder="Stock"
                          aria-label="Stock"
                          value={draftStock}
                          onChange={(e) => setDraftStock(e.target.value)}
                        />
                        <Input
                          placeholder="SKU"
                          aria-label="SKU"
                          value={draftSKU}
                          onChange={(e) => setDraftSKU(e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Release Year"
                          aria-label="Release Year"
                          value={draftReleaseYear}
                          onChange={(e) => setDraftReleaseYear(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={handleRecommendPrice} disabled={priceLoading}>
                          {priceLoading ? "Getting price…" : "Get Recommended Price (AUD)"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleGenerateSku}>
                          Generate SKU
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Pricing is in AUD; considers AU retailers, Discogs AU, and typical indie margins.</p>

                      <Input
                        placeholder="Tags (comma separated)"
                        aria-label="Tags"
                        value={draftTagsInput}
                        onChange={(e) => setDraftTagsInput(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Add 5–10 concise music tags (e.g., black metal, raw, demo, US).</p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={draftActive} onChange={(e) => setDraftActive(e.target.checked)} /> Active</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={draftFeatured} onChange={(e) => setDraftFeatured(e.target.checked)} /> Featured</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={draftLimited} onChange={(e) => setDraftLimited(e.target.checked)} /> Limited</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={draftPreOrder} onChange={(e) => setDraftPreOrder(e.target.checked)} /> Pre-Order</label>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center">
                        <Button type="button" variant="outline" onClick={handleRegenerateDescription} disabled={regenLoading}>
                          {regenLoading ? "Regenerating…" : "Regenerate Description"}
                        </Button>
                        <p className="text-xs text-muted-foreground">Music-focused, 120–220 chars. Avoid artwork terms.</p>
                      </div>

                      <Textarea
                        rows={10}
                        value={draftDesc}
                        onChange={(e) => setDraftDesc(e.target.value)}
                        aria-label="Catalog description"
                        placeholder="Enter the catalog listing text (description)"
                      />

                      <div className="flex gap-2">
                        <Button onClick={onSave} disabled={saving}>Save</Button>
                        <Button variant="outline" onClick={onRevert} disabled={saving}>Revert</Button>
                        <Button variant="outline" onClick={handleDelete} disabled={deleting}>Delete</Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="aspect-square rounded-md overflow-hidden border border-border bg-muted flex items-center justify-center">
                        {draftImage ? (
                          <img src={draftImage} alt="Product image" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-muted-foreground text-sm p-4">No image</div>
                        )}
                      </div>
                      <Input
                        placeholder="Image URL (optional)"
                        aria-label="Image URL"
                        value={draftImage}
                        onChange={(e) => setDraftImage(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImageFile} />
                        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>Upload Image</Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground p-6 border border-dashed rounded-md">
                  Select a product on the left to edit its catalog text.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
