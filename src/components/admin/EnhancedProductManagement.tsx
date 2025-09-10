import { useState } from "react";
import { Search, Filter, Download, Upload, Plus, Edit, Trash2, Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const mockProducts = [
  { id: "1", title: "Eternal Darkness", artist: "Shadowmoon", format: "Vinyl", price: 34.99, stock: 15, status: "Active", genre: "Black Metal", sales: 145 },
  { id: "2", title: "Blood Moon Rising", artist: "Crimson Tide", format: "CD", price: 18.99, stock: 0, status: "Out of Stock", genre: "Death Metal", sales: 132 },
  { id: "3", title: "Midnight Echoes", artist: "Death's Embrace", format: "Cassette", price: 24.99, stock: 8, status: "Active", genre: "Black Metal", sales: 98 },
  { id: "4", title: "Shadow's Call", artist: "Void Walker", format: "Vinyl", price: 39.99, stock: 25, status: "Active", genre: "Doom Metal", sales: 87 },
  { id: "5", title: "Dark Prophecy", artist: "Nightmare Lord", format: "CD", price: 21.99, stock: 12, status: "Active", genre: "Gothic Metal", sales: 76 },
];

const EnhancedProductManagement = () => {
  const [products, setProducts] = useState(mockProducts);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("sales");
  const { toast } = useToast();

  const filteredProducts = products
    .filter(product => 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.genre.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(product => formatFilter === "all" || product.format === formatFilter)
    .filter(product => statusFilter === "all" || product.status === statusFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case "sales": return b.sales - a.sales;
        case "price": return b.price - a.price;
        case "stock": return b.stock - a.stock;
        case "title": return a.title.localeCompare(b.title);
        default: return 0;
      }
    });

  const handleSelectAll = (checked: boolean) => {
    setSelectedProducts(checked ? filteredProducts.map(p => p.id) : []);
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts(prev => 
      checked 
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    );
  };

  const handleBulkAction = (action: string) => {
    toast({
      title: "Bulk Action",
      description: `${action} applied to ${selectedProducts.length} products`,
    });
    setSelectedProducts([]);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'Active': 'default',
      'Out of Stock': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return "text-destructive";
    if (stock < 10) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            <SelectItem value="Vinyl">Vinyl</SelectItem>
            <SelectItem value="CD">CD</SelectItem>
            <SelectItem value="Cassette">Cassette</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="stock">Stock</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedProducts.length} product(s) selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleBulkAction("Update Price")}>
              Update Price
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction("Update Stock")}>
              Update Stock
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBulkAction("Delete")}>
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="p-4 text-left">
                  <Checkbox
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 text-left font-medium">Product</th>
                <th className="p-4 text-left font-medium">Format</th>
                <th className="p-4 text-left font-medium">Price</th>
                <th className="p-4 text-left font-medium">Stock</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Sales</th>
                <th className="p-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-border hover:bg-muted/30">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{product.title}</div>
                      <div className="text-sm text-muted-foreground">{product.artist}</div>
                      <div className="text-xs text-muted-foreground">{product.genre}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{product.format}</Badge>
                  </td>
                  <td className="p-4 font-medium">${product.price}</td>
                  <td className="p-4">
                    <span className={getStockColor(product.stock)}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(product.status)}
                  </td>
                  <td className="p-4 font-medium">{product.sales}</td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>Showing {filteredProducts.length} of {products.length} products</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProductManagement;
