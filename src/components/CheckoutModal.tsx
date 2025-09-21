'use client'

import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Truck, Shield, Wallet, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutModalProps {
  children: React.ReactNode;
}

const steps = [
  { id: 1, label: 'Shipping', icon: Truck },
  { id: 2, label: 'Payment', icon: CreditCard },
  { id: 3, label: 'Review', icon: Shield },
]

const CheckoutModal = ({ children }: CheckoutModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { items, getTotalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

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
  const [marketingOptIn, setMarketingOptIn] = useState(false)

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

      const trimmedName = shippingData.fullName.trim()
      const [firstName, ...restName] = trimmedName ? trimmedName.split(' ') : ['']
      const lastName = restName.join(' ') || null
      const shippingAddressPayload = {
        line1: shippingData.address,
        city: shippingData.city,
        state: shippingData.state,
        postal_code: shippingData.postalCode,
        country: getCountryCode(shippingData.country),
      }

      const checkoutPayload = {
        items: payloadItems,
        email: shippingData.email,
        customer: {
          email: shippingData.email,
          first_name: firstName || null,
          last_name: lastName,
          phone: shippingData.phone || null,
          shipping_address: shippingAddressPayload,
          marketing_opt_in: marketingOptIn,
        },
        shipping_address: shippingAddressPayload,
        ...shippingPayload,
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
      })
      if (!res.ok) throw new Error('Checkout failed')
      const data = await res.json()
      if (data.checkoutUrl) {
        clearCart()
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
            placeholder="you@example.com"
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

        <div className="flex items-center gap-2 pt-2">
          <Switch id="marketing-opt-in" checked={marketingOptIn} onCheckedChange={setMarketingOptIn} />
          <Label htmlFor="marketing-opt-in" className="text-xs text-muted-foreground cursor-pointer">
            Email me about new releases and restocks.
          </Label>
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
        <h3 className="gothic-heading text-lg text-bone">Payment & wallets</h3>
      </div>

      <div className="rounded-xl border border-border bg-background/40 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Wallets</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={!stripePublishableKey}
            className="h-11 min-w-[140px] justify-center gap-2 border-border text-bone hover:bg-background/80"
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
            Apple Pay
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={!stripePublishableKey}
            className="h-11 min-w-[140px] justify-center gap-2 border-border text-bone hover:bg-background/80"
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
            Google Pay
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled
            className="h-11 min-w-[140px] justify-center gap-2 border-dashed border-border/60 text-muted-foreground"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Link coming soon
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {stripePublishableKey
            ? 'Wallet buttons appear on Stripe after you confirm shipping.'
            : 'Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable Apple Pay and Google Pay on Stripe.'}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-frost" />
          <span className="text-sm text-bone">You’ll enter card details on Stripe</span>
        </div>
        <p className="text-xs text-muted-foreground">
          We redirect you to Stripe’s secure checkout to complete payment. Cards saved in your browser or wallets will auto-fill there. No card data is stored on Obsidian Rite Records.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background/40 p-4 space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Billing contact</p>
        <p className="text-sm text-bone">{shippingData.fullName || 'Name to be provided on Stripe'}</p>
        <p className="text-xs text-muted-foreground">{shippingData.email || 'Email captured above'}</p>
      </div>
    </div>
  );

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value)

  const renderOrderSummary = () => (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background/40 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Items</p>
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-bone">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.artist} • {item.format.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground/80">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm text-accent">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <Separator className="my-3 bg-border/60" />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="text-bone">{formatCurrency(getTotalPrice())}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span className="text-bone">{formatCurrency(getShippingPrice())}</span>
          </div>
          <Separator className="my-2 bg-border/60" />
          <div className="flex justify-between font-semibold text-bone">
            <span>Total</span>
            <span className="text-accent">{formatCurrency(getTotalWithShipping())}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Shipping to</p>
        <p className="mt-2 text-bone">{shippingData.fullName || '—'}</p>
        <p>{shippingData.address}</p>
        <p>{shippingData.city}, {shippingData.state} {shippingData.postalCode}</p>
        <p>{shippingData.country}</p>
        <p className="mt-2">{shippingData.email}</p>
        <p>{shippingData.phone}</p>
        {selectedShip ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Delivery via {'shipping_rate_data' in selectedShip ? selectedShip.shipping_rate_data.display_name : selectedShip.display_name} ({formatCurrency(getShippingPrice())})
          </p>
        ) : null}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="h-5 w-5 text-accent" />
        <h3 className="gothic-heading text-lg text-bone">Review & confirm</h3>
      </div>
      {renderOrderSummary()}
    </div>
  )

  const handleNext = () => {
    if (currentStep === 1) {
      if (!isAddressValid) {
        toast({ title: 'Missing details', description: 'Please complete shipping details with a valid email and phone.', variant: 'destructive' })
        return
      }
      if (shipOptions.length > 0 && !selectedShip) {
        setSelectedShip(shipOptions[0])
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const canContinue = currentStep === 1 ? isAddressValid : true

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setCurrentStep(1)
          setIsProcessing(false)
        }
      }}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden bg-background/95 px-0 sm:w-[480px]">
        <div className="px-6 pb-4 pt-6">
          <SheetHeader className="space-y-4 text-left">
            <SheetTitle className="blackletter text-2xl text-bone">Checkout</SheetTitle>
            <ol className="grid grid-cols-3 gap-2 text-xs">
              {steps.map((step) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isComplete = currentStep > step.id
                return (
                  <li key={step.id} className="flex items-center gap-2">
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                        isComplete ? 'border-accent bg-accent text-background' : isActive ? 'border-accent text-accent' : 'border-border text-muted-foreground'
                      )}
                    >
                      <Icon className={cn('h-4 w-4', isComplete ? 'text-background' : isActive ? 'text-accent' : 'text-muted-foreground')} />
                    </span>
                    <span className={cn('hidden text-sm sm:block', isActive || isComplete ? 'text-bone' : 'text-muted-foreground')}>{step.label}</span>
                  </li>
                )
              })}
            </ol>
          </SheetHeader>
        </div>

        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border bg-background/90 px-6 py-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || isProcessing}
            >
              Back
            </Button>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="hidden sm:block">Total {formatCurrency(getTotalWithShipping())}</span>
              {currentStep === steps.length ? (
                <Button
                  onClick={handleProcessOrder}
                  disabled={isProcessing || items.length === 0}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isProcessing ? 'Processing…' : 'Complete order'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canContinue}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Continue
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
};

export default CheckoutModal;
