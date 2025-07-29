import { useState } from "react";
import { Plus, Edit, Trash2, Package, Users, ShoppingBag, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

// Mock data for admin dashboard
const mockStats = {
  totalProducts: 147,
  totalOrders: 342,
  totalCustomers: 1205,
  revenue: 45620.50
};

const mockOrders = [
  { id: "ORD-001", customer: "Mortis Blackheart", total: 89.98, status: "Shipped", date: "2024-01-15" },
  { id: "ORD-002", customer: "Void Walker", total: 156.47, status: "Processing", date: "2024-01-14" },
  { id: "ORD-003", customer: "Shadow Priest", total: 234.99, status: "Completed", date: "2024-01-13" },
];

const mockProducts = [
  { id: "1", title: "Eternal Darkness", artist: "Shadowmoon", format: "Vinyl", price: 34.99, stock: 15, status: "Active" },
  { id: "2", title: "Blood Moon Rising", artist: "Crimson Tide", format: "CD", price: 18.99, stock: 0, status: "Out of Stock" },
  { id: "3", title: "Necromantic Ritual", artist: "Death's Embrace", format: "Cassette", price: 24.99, stock: 8, status: "Active" },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleProductAction = (action: string, product?: any) => {
    if (action === 'edit' && product) {
      setSelectedProduct(product);
      setIsEditingProduct(true);
    } else if (action === 'delete' && product) {
      toast({
        title: "Product Deleted",
        description: `${product.title} has been removed from the catalog.`,
      });
    } else if (action === 'add') {
      setSelectedProduct(null);
      setIsEditingProduct(true);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'Active': 'default',
      'Out of Stock': 'destructive',
      'Shipped': 'default',
      'Processing': 'secondary',
      'Completed': 'outline'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="gothic-heading text-4xl mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your dark empire from the shadows</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">+12 from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">+23 from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">+89 from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${mockStats.revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+18% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Product Management</h2>
              <Button onClick={() => handleProductAction('add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Product Catalog</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{product.title}</h3>
                        <p className="text-sm text-muted-foreground">by {product.artist}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm">{product.format}</span>
                          <span className="text-sm font-medium">${product.price}</span>
                          <span className="text-sm">Stock: {product.stock}</span>
                          {getStatusBadge(product.status)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleProductAction('edit', product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleProductAction('delete', product)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-bold">Order Management</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{order.id}</h3>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium">${order.total}</span>
                          <span className="text-sm">{order.date}</span>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <h2 className="text-2xl font-bold">Customer Management</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Customer Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Customer management features will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Product Edit Modal Placeholder */}
        {isEditingProduct && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" defaultValue={selectedProduct?.title} />
                  </div>
                  <div>
                    <Label htmlFor="artist">Artist</Label>
                    <Input id="artist" defaultValue={selectedProduct?.artist} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select defaultValue={selectedProduct?.format}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vinyl">Vinyl</SelectItem>
                        <SelectItem value="CD">CD</SelectItem>
                        <SelectItem value="Cassette">Cassette</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" type="number" defaultValue={selectedProduct?.price} />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Input id="stock" type="number" defaultValue={selectedProduct?.stock} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditingProduct(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    setIsEditingProduct(false);
                    toast({
                      title: "Product Saved",
                      description: "Product has been successfully saved to the catalog.",
                    });
                  }}>
                    Save Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;