import { useState } from "react";
import { Search, Users, Mail, Crown, Package, Heart, MoreHorizontal, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  email: string;
  role: "customer" | "wholesale" | "admin";
  joinedAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  status: "active" | "inactive";
  favoriteGenres: string[];
  wishlist: number;
}

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Mortis Blackheart",
    email: "mortis@darkmail.com",
    role: "customer",
    joinedAt: "2023-10-15",
    totalOrders: 15,
    totalSpent: 456.78,
    lastOrder: "2024-01-15",
    status: "active",
    favoriteGenres: ["Black Metal", "Death Metal"],
    wishlist: 8
  },
  {
    id: "2",
    name: "Void Walker",
    email: "void@abyss.net",
    role: "wholesale",
    joinedAt: "2023-08-22",
    totalOrders: 45,
    totalSpent: 2340.55,
    lastOrder: "2024-01-14",
    status: "active",
    favoriteGenres: ["Doom Metal", "Black Metal"],
    wishlist: 23
  },
  {
    id: "3",
    name: "Shadow Priest",
    email: "priest@shadow.org",
    role: "customer",
    joinedAt: "2024-01-01",
    totalOrders: 3,
    totalSpent: 89.97,
    lastOrder: "2024-01-13",
    status: "active",
    favoriteGenres: ["Gothic Metal"],
    wishlist: 5
  },
  {
    id: "4",
    name: "Dark Lord Nightmare",
    email: "nightmare@void.com",
    role: "admin",
    joinedAt: "2022-05-10",
    totalOrders: 2,
    totalSpent: 67.98,
    lastOrder: "2023-12-20",
    status: "active",
    favoriteGenres: ["Black Metal", "Death Metal", "Doom Metal"],
    wishlist: 15
  },
  {
    id: "5",
    name: "Crimson Witch",
    email: "witch@crimson.dark",
    role: "customer",
    joinedAt: "2023-12-05",
    totalOrders: 8,
    totalSpent: 234.50,
    lastOrder: "2024-01-10",
    status: "inactive",
    favoriteGenres: ["Black Metal"],
    wishlist: 12
  }
];

const CustomerManagement = () => {
  const [customers, setCustomers] = useState(mockCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const filteredCustomers = customers
    .filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(customer => roleFilter === "all" || customer.role === roleFilter)
    .filter(customer => statusFilter === "all" || customer.status === statusFilter);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Crown className="h-4 w-4 text-accent" />;
      case "wholesale": return <Users className="h-4 w-4 text-blue-500" />;
      default: return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      'admin': { variant: 'destructive', label: 'Dark Lord' },
      'wholesale': { variant: 'default', label: 'Distributor' },
      'customer': { variant: 'outline', label: 'Cultist' }
    };
    const config = variants[role] || variants.customer;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status === 'active' ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const getCustomerValue = (customer: Customer) => {
    if (customer.totalSpent > 1000) return { label: "High Value", color: "text-green-500" };
    if (customer.totalSpent > 200) return { label: "Medium Value", color: "text-blue-500" };
    return { label: "New Customer", color: "text-muted-foreground" };
  };

  const sendEmail = (customer: Customer, type: string) => {
    toast({
      title: "Email Sent",
      description: `${type} email sent to ${customer.name}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customer Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Newsletter
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="customer">Customers</SelectItem>
            <SelectItem value="wholesale">Wholesale</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground pt-2">
          {filteredCustomers.length} customers
        </div>
      </div>

      {/* Customers Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="p-4 text-left font-medium">Customer</th>
                <th className="p-4 text-left font-medium">Role</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Orders</th>
                <th className="p-4 text-left font-medium">Total Spent</th>
                <th className="p-4 text-left font-medium">Last Order</th>
                <th className="p-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const customerValue = getCustomerValue(customer);
                
                return (
                  <tr key={customer.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(customer.role)}
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                          <div className={`text-xs ${customerValue.color}`}>{customerValue.label}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getRoleBadge(customer.role)}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(customer.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{customer.totalOrders}</span>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </td>
                    <td className="p-4 font-medium">${customer.totalSpent.toFixed(2)}</td>
                    <td className="p-4 text-muted-foreground">{customer.lastOrder}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(customer)}>
                              View Profile
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>{customer.name} - Customer Profile</DialogTitle>
                            </DialogHeader>
                            {selectedCustomer && (
                              <div className="space-y-6">
                                {/* Customer Overview */}
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <h3 className="font-semibold mb-3">Customer Information</h3>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span>{selectedCustomer.email}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Role:</span>
                                        <span>{getRoleBadge(selectedCustomer.role)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Joined:</span>
                                        <span>{selectedCustomer.joinedAt}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        <span>{getStatusBadge(selectedCustomer.status)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold mb-3">Purchase History</h3>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Orders:</span>
                                        <span className="font-medium">{selectedCustomer.totalOrders}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Spent:</span>
                                        <span className="font-medium">${selectedCustomer.totalSpent.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Last Order:</span>
                                        <span>{selectedCustomer.lastOrder}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Wishlist Items:</span>
                                        <span className="flex items-center gap-1">
                                          <Heart className="h-3 w-3" />
                                          {selectedCustomer.wishlist}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Favorite Genres */}
                                <div>
                                  <h3 className="font-semibold mb-3">Favorite Genres</h3>
                                  <div className="flex gap-2">
                                    {selectedCustomer.favoriteGenres.map((genre: string) => (
                                      <Badge key={genre} variant="outline">{genre}</Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Customer Actions */}
                                <div className="flex gap-2 pt-4 border-t border-border">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => sendEmail(selectedCustomer, "Promotional")}
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Promotion
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => sendEmail(selectedCustomer, "Wishlist")}
                                  >
                                    <Heart className="h-4 w-4 mr-2" />
                                    Wishlist Alert
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => sendEmail(selectedCustomer, "Reactivation")}
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    Re-engage
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
                            <DropdownMenuItem onClick={() => sendEmail(customer, "Welcome")}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Package className="h-4 w-4 mr-2" />
                              View Orders
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Heart className="h-4 w-4 mr-2" />
                              View Wishlist
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

export default CustomerManagement;