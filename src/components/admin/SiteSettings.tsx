import { useState } from "react";
import { Save, Globe, Search, Mail, DollarSign, Truck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const SiteSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    general: {
      siteName: "Black Plague Records",
      tagline: "Dark Music for Dark Souls",
      description: "Australia's premier distributor of underground black metal since the darkness began.",
      contactEmail: "contact@blackplaguerecords.com",
      currency: "USD",
      timezone: "UTC"
    },
    seo: {
      metaTitle: "Black Plague Records - Dark Music for Dark Souls",
      metaDescription: "Discover the darkest depths of metal, black metal, and gothic music. Vinyl, CDs, cassettes, and rare releases from the underground's most sinister artists.",
      keywords: "black metal, death metal, gothic, vinyl records, underground music",
      ogImage: "/og-image.jpg",
      enableSitemap: true,
      enableRobots: true
    },
    features: {
      enableWishlist: true,
      enableReviews: true,
      enableNewsletter: true,
      enablePreorders: true,
      maintenanceMode: false
    },
    shipping: {
      freeShippingThreshold: 50,
      standardRate: 5.99,
      expressRate: 12.99,
      overnightRate: 24.99,
      internationalShipping: true,
      internationalRate: 15.99
    },
    payments: {
      enableStripe: true,
      enablePaypal: true,
      taxRate: 8.5,
      processingFee: 2.9
    }
  });

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const saveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your site configuration has been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Site Settings</h2>
        <Button onClick={saveSettings}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={settings.general.tagline}
                    onChange={(e) => updateSetting('general', 'tagline', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Site Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={settings.general.description}
                  onChange={(e) => updateSetting('general', 'description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={(e) => updateSetting('general', 'contactEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.general.currency} onValueChange={(value) => updateSetting('general', 'currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={settings.seo.metaTitle}
                  onChange={(e) => updateSetting('seo', 'metaTitle', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  rows={3}
                  value={settings.seo.metaDescription}
                  onChange={(e) => updateSetting('seo', 'metaDescription', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={settings.seo.keywords}
                  onChange={(e) => updateSetting('seo', 'keywords', e.target.value)}
                  placeholder="Separate keywords with commas"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Generate Sitemap</Label>
                    <p className="text-sm text-muted-foreground">Automatically generate XML sitemap</p>
                  </div>
                  <Switch
                    checked={settings.seo.enableSitemap}
                    onCheckedChange={(checked) => updateSetting('seo', 'enableSitemap', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Robots.txt</Label>
                    <p className="text-sm text-muted-foreground">Enable search engine crawling</p>
                  </div>
                  <Switch
                    checked={settings.seo.enableRobots}
                    onCheckedChange={(checked) => updateSetting('seo', 'enableRobots', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Wishlist</Label>
                    <p className="text-sm text-muted-foreground">Allow customers to save items for later</p>
                  </div>
                  <Switch
                    checked={settings.features.enableWishlist}
                    onCheckedChange={(checked) => updateSetting('features', 'enableWishlist', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Product Reviews</Label>
                    <p className="text-sm text-muted-foreground">Enable customer reviews and ratings</p>
                  </div>
                  <Switch
                    checked={settings.features.enableReviews}
                    onCheckedChange={(checked) => updateSetting('features', 'enableReviews', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Newsletter Signup</Label>
                    <p className="text-sm text-muted-foreground">Show newsletter subscription forms</p>
                  </div>
                  <Switch
                    checked={settings.features.enableNewsletter}
                    onCheckedChange={(checked) => updateSetting('features', 'enableNewsletter', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Pre-orders</Label>
                    <p className="text-sm text-muted-foreground">Allow customers to pre-order upcoming releases</p>
                  </div>
                  <Switch
                    checked={settings.features.enablePreorders}
                    onCheckedChange={(checked) => updateSetting('features', 'enablePreorders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Hide site from public while updating</p>
                  </div>
                  <Switch
                    checked={settings.features.maintenanceMode}
                    onCheckedChange={(checked) => updateSetting('features', 'maintenanceMode', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="freeShippingThreshold">Free Shipping Threshold ($)</Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  value={settings.shipping.freeShippingThreshold}
                  onChange={(e) => updateSetting('shipping', 'freeShippingThreshold', parseFloat(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="standardRate">Standard Rate ($)</Label>
                  <Input
                    id="standardRate"
                    type="number"
                    step="0.01"
                    value={settings.shipping.standardRate}
                    onChange={(e) => updateSetting('shipping', 'standardRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expressRate">Express Rate ($)</Label>
                  <Input
                    id="expressRate"
                    type="number"
                    step="0.01"
                    value={settings.shipping.expressRate}
                    onChange={(e) => updateSetting('shipping', 'expressRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overnightRate">Overnight Rate ($)</Label>
                  <Input
                    id="overnightRate"
                    type="number"
                    step="0.01"
                    value={settings.shipping.overnightRate}
                    onChange={(e) => updateSetting('shipping', 'overnightRate', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>International Shipping</Label>
                  <p className="text-sm text-muted-foreground">Enable shipping to international addresses</p>
                </div>
                <Switch
                  checked={settings.shipping.internationalShipping}
                  onCheckedChange={(checked) => updateSetting('shipping', 'internationalShipping', checked)}
                />
              </div>

              {settings.shipping.internationalShipping && (
                <div className="space-y-2">
                  <Label htmlFor="internationalRate">International Rate ($)</Label>
                  <Input
                    id="internationalRate"
                    type="number"
                    step="0.01"
                    value={settings.shipping.internationalRate}
                    onChange={(e) => updateSetting('shipping', 'internationalRate', parseFloat(e.target.value))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Stripe Payments</Label>
                    <p className="text-sm text-muted-foreground">Accept credit cards via Stripe</p>
                  </div>
                  <Switch
                    checked={settings.payments.enableStripe}
                    onCheckedChange={(checked) => updateSetting('payments', 'enableStripe', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>PayPal Payments</Label>
                    <p className="text-sm text-muted-foreground">Accept PayPal payments</p>
                  </div>
                  <Switch
                    checked={settings.payments.enablePaypal}
                    onCheckedChange={(checked) => updateSetting('payments', 'enablePaypal', checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    value={settings.payments.taxRate}
                    onChange={(e) => updateSetting('payments', 'taxRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="processingFee">Processing Fee (%)</Label>
                  <Input
                    id="processingFee"
                    type="number"
                    step="0.1"
                    value={settings.payments.processingFee}
                    onChange={(e) => updateSetting('payments', 'processingFee', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteSettings;