import { useState } from "react";
import { BarChart3, TrendingUp, Settings, Users as UsersIcon, Package, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import EnhancedProductManagement from "@/components/admin/EnhancedProductManagement";
import AdvancedOrderManagement from "@/components/admin/AdvancedOrderManagement";
import CustomerManagement from "@/components/admin/CustomerManagement";
import SiteSettings from "@/components/admin/SiteSettings";

// Mock data for admin dashboard
const mockStats = {
  totalProducts: 147,
  totalOrders: 342,
  totalCustomers: 1205,
  revenue: 45620.50,
  monthlyGrowth: {
    products: 12,
    orders: 23,
    customers: 89,
    revenue: 18
  }
};

const AdminDashboard = () => {
  const { user, isLoading } = useAuth();

  // Debug logging
  console.log("AdminDashboard: Current user:", user);
  console.log("AdminDashboard: User role:", user?.role);
  console.log("AdminDashboard: isLoading:", isLoading);

  // Show loading while auth is being determined
  if (isLoading) {
    console.log("AdminDashboard: Still loading user data");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    console.log("AdminDashboard: Redirecting to home - not admin");
    return <Navigate to="/" replace />;
  }

  console.log("AdminDashboard: Rendering admin dashboard");

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
              <p className="text-xs text-muted-foreground">+{mockStats.monthlyGrowth.products} from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">+{mockStats.monthlyGrowth.orders} from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">+{mockStats.monthlyGrowth.customers} from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${mockStats.revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+{mockStats.monthlyGrowth.revenue}% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="products">
            <EnhancedProductManagement />
          </TabsContent>

          <TabsContent value="orders">
            <AdvancedOrderManagement />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="settings">
            <SiteSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;