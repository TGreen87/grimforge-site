import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProductRow {
  id: string;
  title: string;
  artist: string;
  format: string | null;
  description: string | null;
  active: boolean;
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

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id,title,artist,format,description,active")
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
  };

  const onSave = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("products")
        .update({ description: draftDesc, title: draftTitle, artist: draftArtist })
        .eq("id", selected.id);
      if (error) throw error;
      setProducts(prev => prev.map(pr => pr.id === selected.id ? { ...pr, description: draftDesc, title: draftTitle, artist: draftArtist } : pr));
      toast({ title: "Saved", description: "Catalog text updated" });
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
  };

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Catalog Listing Text</CardTitle>
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
                  <Textarea
                    rows={12}
                    value={draftDesc}
                    onChange={(e) => setDraftDesc(e.target.value)}
                    aria-label="Catalog description"
                    placeholder="Enter the catalog listing text (description)"
                  />
                  <div className="flex gap-2">
                    <Button onClick={onSave} disabled={saving}>
                      Save
                    </Button>
                    <Button variant="outline" onClick={onRevert} disabled={saving}>
                      Revert
                    </Button>
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
