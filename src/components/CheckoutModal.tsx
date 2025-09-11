'use client'

import { useState } from "react";
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
    shippingMethod: "standard"
  });

  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: user?.name || "",
    billingAddress: "",
    saveCard: false
  });

  const shippingOptions = [
    { value: "standard", label: "Standard delivery (5-7 days)", price: 9.95 },
    { value: "express", label: "Express delivery (2-3 days)", price: 19.95 },
    { value: "overnight", label: "Overnight (1 day)", price: 39.95 }
  ];

  const getShippingPrice = () => {
    const option = shippingOptions.find(opt => opt.value === shippingData.shippingMethod);
    return option?.price || 0;
  };

  const getTotalWithShipping = () => {
    return getTotalPrice() + getShippingPrice();
  };

  const handleProcessOrder = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock successful order
    const orderId = `BP${Date.now()}`;
    
    clearCart();
    setIsProcessing(false);
    setIsOpen(false);
    setCurrentStep(1);
    
    toast({
      title: "Order placed",
      description: `Order ${orderId} confirmed. You’ll receive a confirmation email shortly.`,
      duration: 5000,
    });
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
        <Label className="text-bone">Delivery Method</Label>
        {shippingOptions.map((option) => (
          <div
            key={option.value}
            className={`p-3 border rounded cursor-pointer transition-all ${
              shippingData.shippingMethod === option.value
                ? "border-accent bg-accent/10"
                : "border-border hover:border-frost"
            }`}
            onClick={() => setShippingData(prev => ({ ...prev, shippingMethod: option.value }))}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-bone font-medium">{option.label}</p>
              </div>
              <span className="text-accent font-bold">${option.price}</span>
            </div>
          </div>
        ))}
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
                    // Basic validation before continuing
                    const emailOk = /.+@.+\..+/.test(shippingData.email)
                    const phoneOk = (shippingData.phone || '').replace(/\D/g,'').length >= 6
                    const allOk = shippingData.fullName && emailOk && phoneOk && shippingData.address && shippingData.city && shippingData.state && shippingData.postalCode
                    if (!allOk) {
                      toast({ title: 'Missing details', description: 'Please complete all shipping fields (valid email/phone).' , variant: 'destructive'})
                      return
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
