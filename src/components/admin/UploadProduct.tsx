import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { Upload, Tag, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NewProductForm {
  title: string;
  artist: string;
  description: string;
  format: "vinyl" | "cassette" | "cd";
  price: number;
  cost?: number; // optional cost basis for pricing assist
  sku?: string;
  stock: number;
  featured: boolean;
  limited: boolean;
  preOrder: boolean;
  image?: string; // primary image (data URL)
  images: string[]; // all selected images for context
  referenceUrlsInput: string; // optional URLs (one per line or comma-separated)
  tagsInput: string; // comma separated
}

const defaultForm: NewProductForm = {
  title: "",
  artist: "",
  description: "",
  format: "vinyl",
  price: 0,
  sku: "",
  stock: 0,
  featured: false,
  limited: false,
  preOrder: false,
  image: undefined,
  images: [],
  referenceUrlsInput: "",
  tagsInput: "",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function simpleTagSuggest(text: string) {
  const stop = new Set(["the","and","of","a","to","in","on","for","with","by","from","at","as","is","it","this","that","be","or","an","are"]);
  const words = (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w.replace(/^./, (c) => c.toUpperCase()));
}

export default function UploadProduct() {
  const { toast } = useToast();
  const [form, setForm] = useState<NewProductForm>({ ...defaultForm });
  const fileRef = useRef<HTMLInputElement>(null);
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);

  const tags = useMemo(() =>
    form.tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    [form.tagsInput]
  );

  const canPublish = form.title.trim() && form.artist.trim() && form.price >= 0;

const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  // Read up to 5 images as data URLs for context
  Promise.all(
    files.slice(0, 5).map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        })
    )
  ).then((dataUrls) => {
    setForm((f) => ({ ...f, image: dataUrls[0], images: dataUrls }));
    if (fileRef.current) fileRef.current.value = "";
    void runAutofill(dataUrls);
  });
};

  const generateTags = async () => {
    const baseText = `${form.title} ${form.artist} ${form.description}`.trim();
    if (!baseText) {
      toast({ title: "Add details first", description: "Enter title/artist/description to suggest tags" });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("generate-tags", {
        body: { text: baseText },
      });

      if (error) throw error;

      const aiTags: string[] = Array.isArray(data?.tags) ? data.tags : [];
      const merged = Array.from(new Set([...tags, ...aiTags]));
      setForm((f) => ({ ...f, tagsInput: merged.join(", ") }));
      toast({ title: "AI tags added", description: `Added ${aiTags.length} tags` });
    } catch (err) {
      const guess = simpleTagSuggest(baseText);
      const merged = Array.from(new Set([...tags, ...guess]));
      setForm((f) => ({ ...f, tagsInput: merged.join(", ") }));
      toast({ title: "Fallback tags added", description: "AI unavailable, used local suggestion", variant: "default" });
    }
  };

const runAutofill = async (input?: string | string[]) => {
  const imagesToSend: string[] = Array.isArray(input)
    ? input
    : typeof input === "string"
    ? [input]
    : (form.images?.length ? form.images : (form.image ? [form.image] : []));
  if (!imagesToSend.length && !form.referenceUrlsInput.trim()) return;
  try {
    setAutofillLoading(true);
    const referenceUrls = (form.referenceUrlsInput || "")
      .split(/\r?\n|,|;|\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const { data, error } = await supabase.functions.invoke("product-autofill-from-image", {
      body: {
        imageBase64: imagesToSend[0] || null,
        imageBase64List: imagesToSend,
        referenceUrls,
        hints: { title: form.title, artist: form.artist, format: form.format },
      },
    });
    if (error) throw error;
    const ai = data as any;
    setForm((f) => {
      const currentTags = (f.tagsInput || "").split(",").map(t => t.trim()).filter(Boolean);
      const newTags = Array.isArray(ai?.tags) ? ai.tags : [];
      const mergedTags = Array.from(new Set([...currentTags, ...newTags]));
      return {
        ...f,
        title: f.title || ai?.title || "",
        artist: f.artist || ai?.artist || "",
        description: f.description || ai?.description || "",
        format: f.format || (ai?.format as any) || "vinyl",
        tagsInput: mergedTags.join(", "),
      };
    });
    const filled = ["title","artist","format","description","tags"].filter(k => !!(data as any)?.[k]).length;
    toast({ title: "Auto-filled from context", description: `Populated ${filled} fields` });
  } catch (e: any) {
    console.error("Autofill failed", e);
    toast({ title: "Autofill failed", description: e.message ?? "Unable to extract details", variant: "destructive" });
  } finally {
    setAutofillLoading(false);
  }
};

  const suggestPrice = async () => {
    if (!form.title || !form.artist) {
      toast({ title: "Add title & artist first", description: "We use them to research comps" });
      return;
    }
    try {
      setPriceLoading(true);
      const { data, error } = await supabase.functions.invoke("price-research-au", {
        body: { title: form.title, artist: form.artist, format: form.format, cost: form.cost ?? null },
      });
      if (error) throw error;
      const res = data as any;
      if (typeof res?.suggested_price === "number") {
        setForm(f => ({ ...f, price: Number(res.suggested_price) }));
        const reason = (res?.reasoning || "Suggested retail for AU market").toString();
        toast({ title: `Suggested: $${Number(res.suggested_price).toFixed(2)} AUD`, description: reason });
      } else {
        toast({ title: "No price suggestion", description: "Try again with more details" });
      }
    } catch (e: any) {
      console.error("Price research failed", e);
      toast({ title: "Price research failed", description: e.message ?? "Please try again", variant: "destructive" });
    } finally {
      setPriceLoading(false);
    }
  };

  const publish = async () => {
    if (!canPublish) {
      toast({ title: "Missing fields", description: "Title, artist and price are required", variant: "destructive" });
      return;
    }
    const id = `${slugify(`${form.artist}-${form.title}`)}-upl-${Date.now()}`;

    try {
      let imageUrl = "/assets/album-1.jpg";

      if (form.image && form.image.startsWith("data:")) {
        // Convert data URL to Blob
        const arr = form.image.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        const blob = new Blob([u8arr], { type: mime });

        const ext = mime.split("/")[1] || "jpg";
        const filePath = `images/${id}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, blob, { contentType: mime });

        if (uploadError) {
          console.error("Image upload failed", uploadError);
          toast({ title: "Image upload failed", description: "Continuing without image upload", variant: "destructive" });
        } else {
          const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(filePath);
          if (publicUrlData?.publicUrl) {
            imageUrl = publicUrlData.publicUrl;
          }
        }
      } else if (typeof form.image === "string" && form.image) {
        imageUrl = form.image;
      }

      const { error: insertError } = await supabase
        .from("products")
        .insert({
          id,
          title: form.title,
          artist: form.artist,
          format: form.format,
          price: Number(form.price || 0),
          sku: form.sku || null,
          stock: Number(form.stock || 0),
          active: true,
          image: imageUrl,
          description: form.description,
          tags,
          featured: form.featured,
          limited: form.limited,
          pre_order: form.preOrder,
          release_year: new Date().getFullYear(),
        });

      if (insertError) {
        throw insertError;
      }

      toast({ title: "Published", description: `${form.artist} - ${form.title} is now in the catalog` });
      setForm({ ...defaultForm });
    } catch (e: any) {
      console.error("Publish failed", e);
      toast({ title: "Publish failed", description: e.message ?? "Please try again", variant: "destructive" });
    }
  };

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload New Release</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} aria-label="Title" />
                <Input placeholder="Artist" value={form.artist} onChange={(e) => setForm(f => ({ ...f, artist: e.target.value }))} aria-label="Artist" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
                <Select value={form.format} onValueChange={(v: any) => setForm(f => ({ ...f, format: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vinyl">Vinyl</SelectItem>
                    <SelectItem value="cassette">Cassette</SelectItem>
                    <SelectItem value="cd">CD</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input type="number" step="0.01" placeholder="Price (AUD)" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} aria-label="Price" />
                  <Button type="button" variant="secondary" onClick={suggestPrice} disabled={priceLoading} aria-label="Suggest price">
                    <Wand2 className="h-4 w-4 mr-2" /> Suggest
                  </Button>
                </div>
                <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))} aria-label="SKU" />
                <Input type="number" step="0.01" placeholder="Cost (optional)" value={form.cost ?? ""} onChange={(e) => setForm(f => ({ ...f, cost: e.target.value === "" ? undefined : parseFloat(e.target.value) || 0 }))} aria-label="Cost" />
                <Input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm(f => ({ ...f, stock: parseInt(e.target.value || "0", 10) }))} aria-label="Stock" />
              </div>
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} aria-label="Description" rows={5} />
              <div className="flex items-center gap-2">
                <Input placeholder="Tags (comma separated)" value={form.tagsInput} onChange={(e) => setForm(f => ({ ...f, tagsInput: e.target.value }))} aria-label="Tags" />
                <Button type="button" variant="secondary" onClick={generateTags} aria-label="Suggest tags">
                  <Wand2 className="h-4 w-4 mr-2" /> Suggest
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <Badge key={t} variant="outline" className="uppercase"><Tag className="h-3 w-3 mr-1" />{t}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="aspect-square rounded-md overflow-hidden border border-border bg-muted flex items-center justify-center">
                {form.image ? (
                  <img src={form.image} alt="Upload preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground text-sm p-4">
                    No image selected
                  </div>
                )}
              </div>
              {form.images?.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {form.images.slice(0,5).map((img, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setForm(f => ({ ...f, image: img }))}
                      className={`aspect-square overflow-hidden rounded border ${form.image===img ? 'ring-2 ring-primary' : ''}`}
                      aria-label={`Select image ${idx+1} as primary`}
                    >
                      <img src={img} alt={`Additional image ${idx+1}`} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} aria-label="Upload images">
                  <Upload className="h-4 w-4 mr-2" /> Upload Images
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => runAutofill()}
                  disabled={
                    autofillLoading || (!form.image && (form.images?.length ?? 0) === 0 && !form.referenceUrlsInput.trim())
                  }
                  aria-label="Auto-fill using images/URLs"
                >
                  <Wand2 className="h-4 w-4 mr-2" /> Auto-fill
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reference URLs (optional)</label>
                <Textarea
                  placeholder="One per line: Discogs, Bandcamp, label, retailer URLs"
                  value={form.referenceUrlsInput}
                  onChange={(e) => setForm(f => ({ ...f, referenceUrlsInput: e.target.value }))}
                  rows={3}
                  aria-label="Reference URLs"
                />
                <p className="text-xs text-muted-foreground">These help the AI verify details and avoid describing artwork.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm(f => ({ ...f, featured: e.target.checked }))} /> Featured</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.limited} onChange={(e) => setForm(f => ({ ...f, limited: e.target.checked }))} /> Limited</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.preOrder} onChange={(e) => setForm(f => ({ ...f, preOrder: e.target.checked }))} /> Pre-Order</label>
              </div>
              <Button type="button" onClick={publish} disabled={!canPublish}>Publish to Catalog</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Use high-quality square images for best results in the catalog.</p>
          <p>• Add a descriptive summary to help with auto-tagging and SEO.</p>
        </CardContent>
      </Card>
    </section>
  );
}
