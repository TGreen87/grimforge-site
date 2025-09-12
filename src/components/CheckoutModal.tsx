'use client'

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Truck, Shield, MapPin, Mail, Phone } from "lucide-react";

interface CheckoutModalProps {
  children: React.ReactNode;
}

const CheckoutModal = ({ children }: CheckoutModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { items, getTotalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [shippingData, setShippingData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Australia",
  });

  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: user?.name || "",
    billingAddress: "",
    saveCard: false
  });
  
  // Shipping options via API (AusPost when configured; Stripe static fallback otherwise)
  type StripeRateData = {
    type: 'fixed_amount'
    fixed_amount: { amount: number; currency: string }
    display_name: string
    delivery_estimate?: {
      minimum?: { unit: string; value: number }
      maximum?: { unit: string; value: number }
    }
  }
  type StripeStaticOption = { provider: 'stripe_static'; shipping_rate_data: StripeRateData }
  type AusPostOption = { carrier: 'AUSPOST'; service_code: string; display_name: string; amount_cents: number; currency: 'AUD'; eta_min_days?: number; eta_max_days?: number }
  type AnyOption = (StripeStaticOption | AusPostOption)

  const [shipLoading, setShipLoading] = useState(false)
  const [shipError, setShipError] = useState<string | null>(null)
  const [shipConfigured, setShipConfigured] = useState<boolean>(false)
  const [shipOptions, setShipOptions] = useState<AnyOption[]>([])
  const [selectedShip, setSelectedShip] = useState<AnyOption | null>(null)

  const getCountryCode = (label: string) => {
    switch (label) {
      case 'Australia': return 'AU'
      case 'New Zealand': return 'NZ'
      case 'United States': return 'US'
      case 'United Kingdom': return 'GB'
      case 'Norway': return 'NO'
      default: return 'AU'
    }
  }

  const isAddressValid = useMemo(() => {
    const emailOk = /.+@.+\..+/.test(shippingData.email)
    const phoneOk = (shippingData.phone || '').replace(/\D/g,'').length >= 6
    return Boolean(shippingData.fullName && emailOk && phoneOk && shippingData.address && shippingData.city && shippingData.state && shippingData.postalCode)
  }, [shippingData])

  const fetchShippingOptions = async () => {
    try {
      setShipLoading(true); setShipError(null)
      const destination = {
        country: getCountryCode(shippingData.country),
        postcode: shippingData.postalCode,
        state: shippingData.state,
        suburb: shippingData.city,
      }
      // Default package per item: 250g, 31x22x3 cm
      const itemsForQuote = items.map(it => ({ weight_g: 250, length_cm: 31, width_cm: 22, height_cm: 3, quantity: it.quantity }))
      const res = await fetch('/api/shipping/quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, items: itemsForQuote })
      })
      if (!res.ok) throw new Error('Failed to fetch shipping options')
      const data = await res.json() as { configured: boolean; options: AnyOption[] }
      setShipConfigured(Boolean(data.configured))
      setShipOptions(Array.isArray(data.options) ? data.options : [])
      setSelectedShip((prev) => prev && data.options.find(o => 'provider' in o ? ('provider' in (prev as any)) : ('carrier' in (prev as any))) ? prev : (data.options[0] || null))
    } catch (e:any) {
      console.error(e)
      setShipError(e?.message || 'Unable to load shipping options')
      setShipOptions([])
      setSelectedShip(null)
    } finally {
      setShipLoading(false)
    }
  }

  // Optionally auto-fetch when address becomes valid
  useEffect(() => {
    if (isAddressValid) {
      fetchShippingOptions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddressValid, shippingData.country, shippingData.postalCode])

  const getShippingPrice = () => {
    if (!selectedShip) return 0
    if ('shipping_rate_data' in selectedShip) {
      return (selectedShip.shipping_rate_data.fixed_amount.amount || 0) / 100
    }
    return (selectedShip.amount_cents || 0) / 100
  }

  const getTotalWithShipping = () => {
    return getTotalPrice() + getShippingPrice();
  };

  const handleProcessOrder = async () => {
    setIsProcessing(true);
    try {
      const payloadItems = items
        .filter((it) => it.variantId && it.quantity > 0)
        .map((it) => ({ variant_id: it.variantId as string, quantity: it.quantity }))

      if (payloadItems.length === 0) {
        // Fallback to mock if variant ids are missing
        await new Promise((r) => setTimeout(r, 1500))
        toast({ title: 'Cart not ready for checkout', description: 'Please add items from the product page (ensures stock unit is selected).', variant: 'destructive' })
        setIsProcessing(false)
        return
      }

      // Build shipping selection payload
      let shippingPayload: any = {}
      if (selectedShip) {
        if ('shipping_rate_data' in selectedShip) {
          shippingPayload.shipping_rate_data = selectedShip.shipping_rate_data
        } else {
          shippingPayload.shipping = {
            display_name: selectedShip.display_name,
            amount_cents: selectedShip.amount_cents,
            currency: selectedShip.currency,
            eta_min_days: selectedShip.eta_min_days,
            eta_max_days: selectedShip.eta_max_days,
          }
        }
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems, ...shippingPayload }),
      })
      if (!res.ok) throw new Error('Checkout failed')
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl as string
        return
      }
      throw new Error('No checkout URL returned')
    } catch (e) {
      console.error(e)
      toast({ title: 'Unable to start checkout', description: 'Please try again.', variant: 'destructive' })
      setIsProcessing(false)
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Truck className="h-5 w-5 text-accent" />
        <h3 className="gothic-heading text-lg text-bone">Shipping address</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-bone">Full Name</Label>
          <Input
            id="fullName"
            value={shippingData.fullName}
            onChange={(e) => setShippingData(prev => ({ ...prev, fullName: e.target.value }))}
            className="bg-secondary/50 border-border"
            placeholder="Dark Lord Supreme"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-bone">Email</Label>
          <Input
            id="email"
            type="email"
            value={shippingData.email}
            onChange={(e) => setShippingData(prev => ({ ...prev, email: e.target.value }))}
            className="bg-secondary/50 border-border"
            placeholder="arg@obsidianriterecords.com"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-bone">Phone</Label>
          <Input
            id="phone"
            value={shippingData.phone}
            onChange={(e) => setShippingData(prev => ({ ...prev, phone: e.target.value }))}
            className="bg-secondary/50 border-border"
            placeholder="+61 xxx xxx xxx"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="country" className="text-bone">Country</Label>
          <Select value={shippingData.country} onValueChange={(value) => setShippingData(prev => ({ ...prev, country: value }))}>
            <SelectTrigger className="bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Australia">Australia</SelectItem>
              <SelectItem value="New Zealand">New Zealand</SelectItem>
              <SelectItem value="United States">United States</SelectItem>
              <SelectItem value="United Kingdom">United Kingdom</SelectItem>
              <SelectItem value="Norway">Norway</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-bone">Address</Label>
          <Textarea
          id="address"
          value={shippingData.address}
          onChange={(e) => setShippingData(prev => ({ ...prev, address: e.target.value }))}
          className="bg-secondary/50 border-border"
          placeholder="123 Darkthrone Street, Blackmetal Suburb"
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-bone">City</Label>
          <Input
            id="city"
            value={shippingData.city}
            onChange={(e) => setShippingData(prev => ({ ...prev, city: e.target.value }))}
            className="bg-secondary/50 border-border"
            placeholder="Melbourne"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state" className="text-bone">State</Label>
          <Input
            id="state"
            value={shippingData.state}
            onChange={(e) => setShippingData(prev => ({ ...prev, state: e.target.value }))}
            className="bg-secondary/50 border-border"
            placeholder="VIC"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="postalCode" className="text-bone">Postal Code</Label>
          <Input
            id="postalCode"
            value={shippingData.postalCode}
            onChange={(e) => setShippingData(prev => ({ ...prev, postalCode: e.target.value }))}
            className="bg-secondary/50 border-border"
            placeholder="3000"
            required
          />
        </div>
      </div>

      {/* Shipping Methods */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-bone">Delivery method</Label>
          <Button type="button" variant="outline" size="sm" onClick={fetchShippingOptions} disabled={!isAddressValid || shipLoading}
            className="border-frost text-frost hover:bg-frost hover:text-background">
            {shipLoading ? 'Fetching…' : 'Refresh rates'}
          </Button>
        </div>

        {!isAddressValid && (
          <p className="text-xs text-muted-foreground">Enter a valid email, phone, and address to fetch shipping rates.</p>
        )}
        {shipError && (
          <p className="text-xs text-destructive">{shipError}</p>
        )}
        {shipOptions.length === 0 && isAddressValid && !shipLoading && (
          <p className="text-xs text-muted-foreground">No live rates available. A standard shipping option will be shown at payment.</p>
        )}
        {shipOptions.map((option, idx) => {
          const key = 'shipping_rate_data' in option ? option.shipping_rate_data.display_name + idx : option.display_name + idx
          const label = 'shipping_rate_data' in option ? option.shipping_rate_data.display_name : option.display_name
          const amount = 'shipping_rate_data' in option ? (option.shipping_rate_data.fixed_amount.amount/100) : (option.amount_cents/100)
          const selected = selectedShip === option
          return (
            <div
              key={key}
              className={`p-3 border rounded cursor-pointer transition-all ${selected ? 'border-accent bg-accent/10' : 'border-border hover:border-frost'}`}
              onClick={() => setSelectedShip(option)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-bone font-medium">{label}</p>
                  {'shipping_rate_data' in option && option.shipping_rate_data.delivery_estimate && (
                    <p className="text-xs text-muted-foreground">
                      {option.shipping_rate_data.delivery_estimate.minimum?.value && `${option.shipping_rate_data.delivery_estimate.minimum.value}-${option.shipping_rate_data.delivery_estimate.maximum?.value ?? option.shipping_rate_data.delivery_estimate.minimum.value} business days`}
                    </p>
                  )}
                </div>
                <span className="text-accent font-bold">${amount.toFixed(2)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <CreditCard className="h-5 w-5 text-accent" />
        <h3 className="gothic-heading text-lg text-bone">Payment</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cardNumber" className="text-bone">Card Number</Label>
          <Input
            id="cardNumber"
            value={paymentData.cardNumber}
            onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: e.target.value }))}
            className="bg-secondary/50 border-border"
            placeholder="1234 5678 9012 3456"
            maxLength={19}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryDate" className="text-bone">Expiry Date</Label>
            <Input
              id="expiryDate"
              value={paymentData.expiryDate}
              onChange={(e) => setPaymentData(prev => ({ ...prev, expiryDate: e.target.value }))}
              className="bg-secondary/50 border-border"
              placeholder="MM/YY"
              maxLength={5}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cvv" className="text-bone">CVV</Label>
            <Input
              id="cvv"
              value={paymentData.cvv}
              onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value }))}
              className="bg-secondary/50 border-border"
              placeholder="123"
              maxLength={4}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cardholderName" className="text-bone">Cardholder Name</Label>
          <Input
            id="cardholderName"
            value={paymentData.cardholderName}
            onChange={(e) => setPaymentData(prev => ({ ...prev, cardholderName: e.target.value }))}
            className="bg-secondary/50 border-border"
            placeholder="Dark Lord Supreme"
          />
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-4 bg-secondary/20 rounded border border-border">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-4 w-4 text-frost" />
          <span className="text-sm text-bone">Payment secured</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your payment information is protected. 
          We never store your card details.
        </p>
      </div>
    </div>
  );

  const renderOrderSummary = () => (
    <div className="bg-secondary/20 p-4 rounded border border-border">
      <h4 className="gothic-heading text-bone mb-4">Order summary</h4>
      
      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-sm text-bone">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.artist} • {item.format.toUpperCase()}</p>
              <p className="text-xs text-frost">Qty: {item.quantity}</p>
            </div>
            <span className="text-sm text-accent">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      <Separator className="bg-border mb-4" />
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="text-bone">${getTotalPrice().toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping:</span>
          <span className="text-bone">${getShippingPrice().toFixed(2)}</span>
        </div>
        <Separator className="bg-border" />
        <div className="flex justify-between font-bold">
          <span className="text-bone">Total:</span>
          <span className="text-accent">${getTotalWithShipping().toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="bg-background border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="blackletter text-2xl text-bone text-center">
            Checkout
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-accent' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 1 ? 'border-accent bg-accent text-background' : 'border-muted-foreground'
                  }`}>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="hidden sm:inline text-sm">Shipping</span>
                </div>
                
                <div className="w-8 h-px bg-border"></div>
                
                <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-accent' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 2 ? 'border-accent bg-accent text-background' : 'border-muted-foreground'
                  }`}>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <span className="hidden sm:inline text-sm">Payment</span>
                </div>
              </div>
            </div>

            {/* Step Content */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 ? (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="border-frost text-frost hover:bg-frost hover:text-background"
                >
                  Back
                </Button>
              ) : (
                <div></div>
              )}
              
              {currentStep === 1 ? (
                <Button 
                  onClick={() => {
                    if (!isAddressValid) {
                      toast({ title: 'Missing details', description: 'Please complete all shipping fields (valid email/phone).' , variant: 'destructive'})
                      return
                    }
                    // If rates loaded and not selected, pick first for convenience
                    if (shipOptions.length > 0 && !selectedShip) {
                      setSelectedShip(shipOptions[0])
                    }
                    setCurrentStep(2)
                  }}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground gothic-heading"
                >
                  Continue
                </Button>
              ) : (
                <Button 
                  onClick={handleProcessOrder}
                  disabled={isProcessing}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground gothic-heading"
                >
                  {isProcessing ? "Processing..." : "Place order"}
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            {renderOrderSummary()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
