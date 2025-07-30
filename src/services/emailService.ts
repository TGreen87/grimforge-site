// Email notification service (mocked for demo)
interface EmailTemplate {
  type: "order_confirmation" | "shipping_update" | "restock_alert" | "promotional" | "wishlist_reminder";
  subject: string;
  content: string;
}

interface EmailData {
  to: string;
  customerName: string;
  orderId?: string;
  trackingNumber?: string;
  productName?: string;
  orderItems?: Array<{
    title: string;
    artist: string;
    price: number;
    quantity: number;
  }>;
  total?: number;
  shippingAddress?: string;
  estimatedDelivery?: string;
}

class EmailNotificationService {
  private templates: Record<string, EmailTemplate> = {
    order_confirmation: {
      type: "order_confirmation",
      subject: "Your Dark Order Has Been Summoned - Order #{orderId}",
      content: `
        <div style="background: #1a1a1a; color: #f5f5f5; font-family: 'Cinzel', serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; font-size: 32px; margin: 0;">⚔️ Black Ritual Records</h1>
              <p style="color: #9ca3af; margin: 10px 0;">Your Order Has Been Summoned from the Depths</p>
            </div>
            
            <div style="background: #262626; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin-top: 0;">Greetings, {customerName}</h2>
              <p>Your dark desires have been fulfilled. Order <strong>#{orderId}</strong> has been successfully placed and is now being prepared in our unholy chambers.</p>
            </div>

            <div style="background: #262626; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #dc2626;">Items in Your Dark Collection:</h3>
              {orderItems}
              <div style="border-top: 1px solid #4b5563; padding-top: 15px; margin-top: 15px;">
                <p style="font-size: 18px; font-weight: bold;">Total: {total}</p>
              </div>
            </div>

            <div style="background: #262626; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #dc2626;">Shipping Details:</h3>
              <p><strong>Address:</strong> {shippingAddress}</p>
              <p><strong>Estimated Delivery:</strong> {estimatedDelivery}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 14px;">May the darkness guide your musical journey.</p>
              <p style="color: #9ca3af; font-size: 14px;">— The Black Ritual Records Cult</p>
            </div>
          </div>
        </div>
      `
    },

    shipping_update: {
      type: "shipping_update",
      subject: "Your Dark Treasures Are En Route - Tracking #{trackingNumber}",
      content: `
        <div style="background: #1a1a1a; color: #f5f5f5; font-family: 'Cinzel', serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; font-size: 32px; margin: 0;">🚚 Black Ritual Records</h1>
              <p style="color: #9ca3af; margin: 10px 0;">Your Order Is Traveling Through the Shadows</p>
            </div>
            
            <div style="background: #262626; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin-top: 0;">Dark Greetings, {customerName}</h2>
              <p>Your order <strong>#{orderId}</strong> has left our crypts and is now journeying through the mortal realm to reach you.</p>
              <p><strong>Tracking Number:</strong> {trackingNumber}</p>
              <p><strong>Expected Arrival:</strong> {estimatedDelivery}</p>
            </div>

            <div style="text-align: center; background: #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <a href="#" style="color: white; text-decoration: none; font-weight: bold;">Track Your Dark Package</a>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 14px;">The shadows will deliver your treasures soon.</p>
            </div>
          </div>
        </div>
      `
    },

    restock_alert: {
      type: "restock_alert",
      subject: "🔥 Back from the Abyss: {productName} Restocked!",
      content: `
        <div style="background: #1a1a1a; color: #f5f5f5; font-family: 'Cinzel', serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; font-size: 32px; margin: 0;">🔥 Black Ritual Records</h1>
              <p style="color: #9ca3af; margin: 10px 0;">The Item You Desired Has Returned</p>
            </div>
            
            <div style="background: #262626; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin-top: 0;">Rejoice, {customerName}!</h2>
              <p><strong>{productName}</strong> has emerged from the depths and is once again available for summoning.</p>
              <p>This dark treasure that captured your interest is now back in stock, but shadows move quickly in our realm.</p>
            </div>

            <div style="text-align: center; background: #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <a href="#" style="color: white; text-decoration: none; font-weight: bold;">Claim Your Dark Prize Now</a>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 14px;">Act swiftly, for darkness waits for no one.</p>
            </div>
          </div>
        </div>
      `
    },

    wishlist_reminder: {
      type: "wishlist_reminder",
      subject: "💀 Your Dark Desires Await Your Return",
      content: `
        <div style="background: #1a1a1a; color: #f5f5f5; font-family: 'Cinzel', serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; font-size: 32px; margin: 0;">💀 Black Ritual Records</h1>
              <p style="color: #9ca3af; margin: 10px 0;">Your Wishlist Calls from the Shadows</p>
            </div>
            
            <div style="background: #262626; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin-top: 0;">The Darkness Remembers, {customerName}</h2>
              <p>Your wishlist holds treasures that yearn to join your collection. These dark artifacts have been patiently waiting in the shadows.</p>
              <p>Perhaps it's time to let them fulfill their destiny in your realm?</p>
            </div>

            <div style="text-align: center; background: #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <a href="#" style="color: white; text-decoration: none; font-weight: bold;">Review Your Dark Desires</a>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 14px;">Some call it shopping. We call it summoning.</p>
            </div>
          </div>
        </div>
      `
    }
  };

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // In a real application, this would integrate with services like:
      // - SendGrid, Mailgun, AWS SES, etc.
      // For demo purposes, we'll simulate the email sending
      
      console.log("📧 Sending email notification:", {
        to: emailData.to,
        type: this.determineEmailType(emailData),
        timestamp: new Date().toISOString()
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful delivery
      return true;
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      return false;
    }
  }

  async sendOrderConfirmation(emailData: EmailData): Promise<boolean> {
    const template = this.templates.order_confirmation;
    const processedContent = this.processTemplate(template.content, emailData);
    
    return this.sendEmail({
      ...emailData,
      type: "order_confirmation"
    } as any);
  }

  async sendShippingUpdate(emailData: EmailData): Promise<boolean> {
    const template = this.templates.shipping_update;
    const processedContent = this.processTemplate(template.content, emailData);
    
    return this.sendEmail({
      ...emailData,
      type: "shipping_update"
    } as any);
  }

  async sendRestockAlert(emailData: EmailData): Promise<boolean> {
    const template = this.templates.restock_alert;
    const processedContent = this.processTemplate(template.content, emailData);
    
    return this.sendEmail({
      ...emailData,
      type: "restock_alert"
    } as any);
  }

  async sendWishlistReminder(emailData: EmailData): Promise<boolean> {
    const template = this.templates.wishlist_reminder;
    const processedContent = this.processTemplate(template.content, emailData);
    
    return this.sendEmail({
      ...emailData,
      type: "wishlist_reminder"
    } as any);
  }

  private processTemplate(template: string, data: EmailData): string {
    let processed = template;
    
    // Replace placeholders with actual data
    processed = processed.replace(/{customerName}/g, data.customerName || "Dark Soul");
    processed = processed.replace(/{orderId}/g, data.orderId || "");
    processed = processed.replace(/{trackingNumber}/g, data.trackingNumber || "");
    processed = processed.replace(/{productName}/g, data.productName || "");
    processed = processed.replace(/{total}/g, data.total?.toFixed(2) || "0.00");
    processed = processed.replace(/{shippingAddress}/g, data.shippingAddress || "");
    processed = processed.replace(/{estimatedDelivery}/g, data.estimatedDelivery || "");
    
    // Process order items
    if (data.orderItems) {
      const itemsHtml = data.orderItems.map(item => `
        <div style="border-bottom: 1px solid #4b5563; padding: 10px 0;">
          <p style="margin: 5px 0;"><strong>${item.title}</strong> by ${item.artist}</p>
          <p style="margin: 5px 0; color: #9ca3af;">Quantity: ${item.quantity} × $${item.price.toFixed(2)}</p>
        </div>
      `).join("");
      processed = processed.replace(/{orderItems}/g, itemsHtml);
    }
    
    return processed;
  }

  private determineEmailType(emailData: EmailData): string {
    if (emailData.orderId && emailData.trackingNumber) return "shipping_update";
    if (emailData.orderId) return "order_confirmation";
    if (emailData.productName) return "restock_alert";
    return "promotional";
  }
}

// Export singleton instance
export const emailService = new EmailNotificationService();

// Helper functions for common email scenarios
export const sendOrderConfirmationEmail = async (orderData: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  items: Array<{ title: string; artist: string; price: number; quantity: number }>;
  total: number;
  shippingAddress: string;
}) => {
  return emailService.sendOrderConfirmation({
    to: orderData.customerEmail,
    customerName: orderData.customerName,
    orderId: orderData.orderId,
    orderItems: orderData.items,
    total: orderData.total,
    shippingAddress: orderData.shippingAddress,
    estimatedDelivery: "3-5 business days"
  });
};

export const sendShippingNotificationEmail = async (shippingData: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  trackingNumber: string;
}) => {
  return emailService.sendShippingUpdate({
    to: shippingData.customerEmail,
    customerName: shippingData.customerName,
    orderId: shippingData.orderId,
    trackingNumber: shippingData.trackingNumber,
    estimatedDelivery: "2-3 business days"
  });
};

export const sendRestockNotificationEmail = async (restockData: {
  customerEmail: string;
  customerName: string;
  productName: string;
}) => {
  return emailService.sendRestockAlert({
    to: restockData.customerEmail,
    customerName: restockData.customerName,
    productName: restockData.productName
  });
};

export const sendWishlistReminderEmail = async (wishlistData: {
  customerEmail: string;
  customerName: string;
}) => {
  return emailService.sendWishlistReminder({
    to: wishlistData.customerEmail,
    customerName: wishlistData.customerName
  });
};