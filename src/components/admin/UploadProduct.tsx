import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { storageKeys, getJSON, setJSON } from "@/lib/storage";
import { Upload, Tag, Wand2 } from "lucide-react";

interface NewProductForm {
  title: string;
  artist: string;
  description: string;
  format: "vinyl" | "cassette" | "cd";
  price: number;
  sku?: string;
  stock: number;
  featured: boolean;
  limited: boolean;
  preOrder: boolean;
  image?: string; // data URL
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

  const tags = useMemo(() =>
    form.tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    [form.tagsInput]
  );

  const canPublish = form.title.trim() && form.artist.trim() && form.price >= 0;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, image: String(reader.result) }));
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const generateTags = () => {
    const guess = simpleTagSuggest(`${form.title} ${form.artist} ${form.description}`);
    const merged = Array.from(new Set([...
      tags,
      ...guess,
    ]));
    setForm((f) => ({ ...f, tagsInput: merged.join(", ") }));
    toast({ title: "Tags suggested", description: `Added ${guess.length} tags` });
  };

  const publish = () => {
    if (!canPublish) {
      toast({ title: "Missing fields", description: "Title, artist and price are required", variant: "destructive" });
      return;
    }
    const id = `${slugify(`${form.artist}-${form.title}`)}-upl-${Date.now()}`;
    const record = {
      id,
      title: form.title,
      artist: form.artist,
      format: form.format,
      price: Number(form.price || 0),
      sku: form.sku,
      stock: Number(form.stock || 0),
      active: true,
      image: form.image || "/assets/album-1.jpg",
      description: form.description,
      tags,
      featured: form.featured,
      limited: form.limited,
      preOrder: form.preOrder,
      releaseYear: new Date().getFullYear(),
    };

    const existing = getJSON<any[]>(storageKeys.records, []);
    setJSON(storageKeys.records, [record, ...existing]);
    toast({ title: "Published", description: `${form.artist} - ${form.title} is now in the catalog` });
    setForm({ ...defaultForm });
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
                <Input type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} aria-label="Price" />
                <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))} aria-label="SKU" />
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
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} aria-label="Upload image">
                <Upload className="h-4 w-4 mr-2" /> Upload Image
              </Button>
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
