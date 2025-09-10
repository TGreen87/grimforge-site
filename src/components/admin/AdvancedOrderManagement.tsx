import { useState } from "react";
import { Search, Package, Truck, CheckCircle, AlertCircle, Mail, Printer, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  title: string;
  artist: string;
  format: string;
  price: number;
  quantity: number;
}

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

interface Order {
  id: string;
  customer: string;
  email: string;
  total: number;
  status: OrderStatus;
  date: string;
  items: OrderItem[];
  shipping: {
    address: string;
    method: string;
    tracking: string | null;
  };
}

const mockOrders: Order[] = [
  { 
    id: "ORD-001", 
    customer: "Mortis Blackheart", 
    email: "mortis@darkmail.com",
    total: 89.98, 
    status: "processing", 
    date: "2024-01-15",
    items: [
      { title: "Eternal Darkness", artist: "Shadowmoon", format: "Vinyl", price: 34.99, quantity: 1 },
      { title: "Blood Moon Rising", artist: "Crimson Tide", format: "CD", price: 18.99, quantity: 2 }
    ],
    shipping: {
      address: "123 Example Ave, Sydney, NSW 2000",
      method: "Express",
      tracking: null
    }
  },
  { 
    id: "ORD-002", 
    customer: "Void Walker", 
    email: "user2@example.com",
    total: 156.47, 
    status: "shipped", 
    date: "2024-01-14",
    items: [
      { title: "Midnight Echoes", artist: "Death's Embrace", format: "Cassette", price: 24.99, quantity: 3 },
      { title: "Shadow's Call", artist: "Void Walker", format: "Vinyl", price: 39.99, quantity: 2 }
    ],
    shipping: {
      address: "456 Sample St, Melbourne, VIC 3000",
      method: "Standard",
      tracking: "1Z999AA1234567890"
    }
  },
  { 
    id: "ORD-003", 
    customer: "Shadow Priest", 
    email: "priest@shadow.org",
    total: 234.99, 
    status: "delivered", 
    date: "2024-01-13",
    items: [
      { title: "Dark Prophecy", artist: "Nightmare Lord", format: "Vinyl", price: 45.99, quantity: 4 },
      { title: "Eternal Darkness", artist: "Shadowmoon", format: "CD", price: 19.99, quantity: 2 }
    ],
    shipping: {
      address: "789 Example Ln, Brisbane, QLD 4000",
      method: "Overnight",
      tracking: "1Z999BB9876543210"
    }
  }
];

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: AlertCircle, color: "text-yellow-500" },
  processing: { label: "Processing", variant: "default" as const, icon: Package, color: "text-blue-500" },
  shipped: { label: "Shipped", variant: "outline" as const, icon: Truck, color: "text-orange-500" },
  delivered: { label: "Delivered", variant: "default" as const, icon: CheckCircle, color: "text-green-500" }
};

const AdvancedOrderManagement = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const filteredOrders = orders
    .filter(order => 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(order => statusFilter === "all" || order.status === statusFilter);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    toast({
      title: "Order Updated",
      description: `Order ${orderId} status changed to ${newStatus}`,
    });
  };

  const sendCustomerEmail = (order: Order, type: string) => {
    toast({
      title: "Email Sent",
      description: `${type} email sent to ${order.customer}`,
    });
  };

  const printDocument = (order: Order, type: string) => {
    toast({
      title: "Print Document",
      description: `${type} for order ${order.id} ready to print`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print All Labels
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Bulk Email
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value: 'all' | OrderStatus) => setStatusFilter(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground pt-2">
          Showing {filteredOrders.length} orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="p-4 text-left font-medium">Order ID</th>
                <th className="p-4 text-left font-medium">Customer</th>
                <th className="p-4 text-left font-medium">Date</th>
                <th className="p-4 text-left font-medium">Total</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusInfo = statusConfig[order.status];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <tr key={order.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-4 font-medium">{order.id}</td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{order.customer}</div>
                        <div className="text-sm text-muted-foreground">{order.email}</div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{order.date}</td>
                    <td className="p-4 font-medium">${order.total}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Order {order.id} Details</DialogTitle>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-6">
                                {/* Customer Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">Customer Information</h3>
                                    <p><strong>Name:</strong> {selectedOrder.customer}</p>
                                    <p><strong>Email:</strong> {selectedOrder.email}</p>
                                    <p><strong>Order Date:</strong> {selectedOrder.date}</p>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">Shipping Information</h3>
                                    <p><strong>Address:</strong> {selectedOrder.shipping.address}</p>
                                    <p><strong>Method:</strong> {selectedOrder.shipping.method}</p>
                                    {selectedOrder.shipping.tracking && (
                                      <p><strong>Tracking:</strong> {selectedOrder.shipping.tracking}</p>
                                    )}
                                  </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                  <h3 className="font-semibold mb-2">Order Items</h3>
                                  <div className="border border-border rounded-lg overflow-hidden">
                                    <table className="w-full">
                                      <thead className="bg-muted/50">
                                        <tr>
                                          <th className="p-3 text-left">Product</th>
                                          <th className="p-3 text-left">Format</th>
                                          <th className="p-3 text-left">Price</th>
                                          <th className="p-3 text-left">Qty</th>
                                          <th className="p-3 text-left">Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {selectedOrder.items.map((item, index: number) => (
                                          <tr key={index} className="border-t border-border">
                                            <td className="p-3">
                                              <div>
                                                <div className="font-medium">{item.title}</div>
                                                <div className="text-sm text-muted-foreground">{item.artist}</div>
                                              </div>
                                            </td>
                                            <td className="p-3">{item.format}</td>
                                            <td className="p-3">${item.price}</td>
                                            <td className="p-3">{item.quantity}</td>
                                            <td className="p-3">${(item.price * item.quantity).toFixed(2)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Status Update */}
                                <div>
                                  <h3 className="font-semibold mb-2">Update Status</h3>
                                  <div className="flex gap-2">
                                    <Select 
                                      value={selectedOrder.status} 
                                      onValueChange={(status: OrderStatus) => updateOrderStatus(selectedOrder.id, status)}
                                    >
                                      <SelectTrigger className="w-48">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="shipped">Shipped</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t border-border">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => sendCustomerEmail(selectedOrder, "Shipping Update")}
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Email Customer
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => printDocument(selectedOrder, "Shipping Label")}
                                  >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Label
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => printDocument(selectedOrder, "Invoice")}
                                  >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Invoice
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => sendCustomerEmail(order, "Order Confirmation")}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => printDocument(order, "Shipping Label")}>
                              <Printer className="h-4 w-4 mr-2" />
                              Print Label
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "processing")}>
                              <Package className="h-4 w-4 mr-2" />
                              Mark Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "shipped")}>
                              <Truck className="h-4 w-4 mr-2" />
                              Mark Shipped
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdvancedOrderManagement;
