import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Plus, Trash2, Save, Link as LinkIcon, FileDown } from "lucide-react";
import { storageKeys, getJSON, setJSON } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export type RecordItem = {
  id: string;
  title: string;
  artist: string;
  format: "vinyl" | "cassette" | "cd";
  price: number;
  sku?: string;
  stock: number;
  active: boolean;
  image?: string;
  external?: {
    bandcamp?: string;
    discogs?: string;
    spotify?: string;
  };
};

const defaultRecord: RecordItem = {
  id: "",
  title: "",
  artist: "",
  format: "vinyl",
  price: 0,
  sku: "",
  stock: 0,
  active: true,
  image: "/assets/album-1.jpg",
  external: {}
};

function csvToRecords(csv: string): RecordItem[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);
  return lines.slice(1).map((line, i) => {
    const cols = line.split(",");
    const title = cols[idx("title")]?.trim() || `Untitled ${i+1}`;
    const artist = cols[idx("artist")]?.trim() || "Unknown";
    const formatStr = (cols[idx("format")]?.trim().toLowerCase() || "vinyl") as RecordItem["format"];
    const price = parseFloat(cols[idx("price")] || "0");
    const sku = cols[idx("sku")]?.trim();
    const stock = parseInt(cols[idx("stock")] || "0", 10);
    const bandcamp = cols[idx("bandcamp")]?.trim();
    const discogs = cols[idx("discogs")]?.trim();
    const spotify = cols[idx("spotify")]?.trim();
    return {
      id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${i}`,
      title,
      artist,
      format: ["vinyl","cassette","cd"].includes(formatStr) ? formatStr : "vinyl",
      price: isNaN(price) ? 0 : price,
      sku,
      stock: isNaN(stock) ? 0 : stock,
      active: true,
      image: "/assets/album-2.jpg",
      external: { bandcamp, discogs, spotify }
    } as RecordItem;
  });
}

const RecordsManager = () => {
  const { toast } = useToast();
  const [records, setRecords] = useState<RecordItem[]>(() => getJSON(storageKeys.records, [] as RecordItem[]));
  const [form, setForm] = useState<RecordItem>({ ...defaultRecord });
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setJSON(storageKeys.records, records);
  }, [records]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return records.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.artist.toLowerCase().includes(q) ||
      r.sku?.toLowerCase().includes(q)
    );
  }, [records, query]);

  const addRecord = () => {
    if (!form.title || !form.artist) {
      toast({ title: "Missing info", description: "Title and artist are required", variant: "destructive" });
      return;
    }
    const toAdd = { ...form, id: `${form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}` };
    setRecords(prev => [toAdd, ...prev]);
    setForm({ ...defaultRecord });
    toast({ title: "Record added", description: `${toAdd.artist} - ${toAdd.title}` });
  };

  const removeRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    toast({ title: "Record removed" });
  };

  const exportCSV = () => {
    const headers = ["title","artist","format","price","sku","stock","bandcamp","discogs","spotify"]; 
    const rows = records.map(r => [r.title, r.artist, r.format, r.price, r.sku || "", r.stock, r.external?.bandcamp || "", r.external?.discogs || "", r.external?.spotify || ""].join(","));
    const blob = new Blob([[headers.join(",")].concat(rows).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "records.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const imported = csvToRecords(text);
      setRecords(prev => [...imported, ...prev]);
      toast({ title: "Imported", description: `${imported.length} records imported` });
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Records Manager</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add / Edit Record</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <Input placeholder="Title" aria-label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="md:col-span-2" />
            <Input placeholder="Artist" aria-label="Artist" value={form.artist} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))} className="md:col-span-2" />
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
            <Input type="number" step="0.01" placeholder="Price" aria-label="Price" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
            <Input placeholder="SKU" aria-label="SKU" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
            <Input type="number" placeholder="Stock" aria-label="Stock" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value || "0", 10) }))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Bandcamp URL" aria-label="Bandcamp URL" value={form.external?.bandcamp || ""} onChange={e => setForm(f => ({ ...f, external: { ...f.external, bandcamp: e.target.value } }))} />
            <Input placeholder="Discogs URL" aria-label="Discogs URL" value={form.external?.discogs || ""} onChange={e => setForm(f => ({ ...f, external: { ...f.external, discogs: e.target.value } }))} />
            <Input placeholder="Spotify URL" aria-label="Spotify URL" value={form.external?.spotify || ""} onChange={e => setForm(f => ({ ...f, external: { ...f.external, spotify: e.target.value } }))} />
          </div>
          <div className="flex gap-2">
            <Button onClick={addRecord}>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
            <Button variant="outline" onClick={() => setForm({ ...defaultRecord })}>
              <Save className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Input placeholder="Search records..." aria-label="Search records" value={query} onChange={e => setQuery(e.target.value)} className="max-w-sm" />
        <div className="text-sm text-muted-foreground">{filtered.length} of {records.length} records</div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Links</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.sku}</div>
                  </TableCell>
                  <TableCell>{r.artist}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase">{r.format}</Badge>
                  </TableCell>
                  <TableCell>${r.price.toFixed(2)}</TableCell>
                  <TableCell>{r.stock}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {r.external?.bandcamp && (
                        <a href={r.external.bandcamp} target="_blank" rel="noopener" aria-label="Bandcamp" className="text-accent hover:underline inline-flex items-center gap-1"><LinkIcon className="h-3 w-3" />BC</a>
                      )}
                      {r.external?.discogs && (
                        <a href={r.external.discogs} target="_blank" rel="noopener" aria-label="Discogs" className="text-accent hover:underline inline-flex items-center gap-1"><LinkIcon className="h-3 w-3" />DG</a>
                      )}
                      {r.external?.spotify && (
                        <a href={r.external.spotify} target="_blank" rel="noopener" aria-label="Spotify" className="text-accent hover:underline inline-flex items-center gap-1"><LinkIcon className="h-3 w-3" />SP</a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="sm" aria-label={`Delete ${r.artist} - ${r.title}`} onClick={() => removeRecord(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">No records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default RecordsManager;
