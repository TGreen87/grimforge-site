"use client";

import { useEffect, useCallback, useRef } from "react";
import { createBrowserClient } from "@/integrations/supabase/browser";
import { playNotificationSound, type Notification } from "../ui/NotificationDrawer";

interface RealtimeConfig {
  onNewOrder?: (order: any) => void;
  onOrderUpdate?: (order: any) => void;
  onPaymentReceived?: (order: any) => void;
  onLowStock?: (inventory: any) => void;
  onNotification?: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  enabled?: boolean;
}

/**
 * Hook to subscribe to Supabase Realtime changes for admin notifications
 *
 * Listens to:
 * - New orders (INSERT on orders table)
 * - Order status changes (UPDATE on orders table)
 * - Payment confirmations (payment_status change to 'paid')
 * - Low stock alerts (available <= 5 on inventory table)
 */
export function useRealtimeNotifications(config: RealtimeConfig = {}) {
  const {
    onNewOrder,
    onOrderUpdate,
    onPaymentReceived,
    onLowStock,
    onNotification,
    enabled = true,
  } = config;

  const supabaseRef = useRef(createBrowserClient());

  const handleOrderChange = useCallback(
    (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (eventType === "INSERT") {
        // New order placed
        onNewOrder?.(newRecord);
        onNotification?.({
          type: "order",
          title: "New Order Received",
          message: `Order ${newRecord.order_number || newRecord.id.slice(0, 8)} for $${newRecord.total?.toFixed(2) || "0.00"}`,
          severity: "info",
          actionUrl: `/admin/orders/show/${newRecord.id}`,
        });
        playNotificationSound("order");
      } else if (eventType === "UPDATE") {
        onOrderUpdate?.(newRecord);

        // Check for payment status change
        if (
          oldRecord?.payment_status !== "paid" &&
          newRecord.payment_status === "paid"
        ) {
          onPaymentReceived?.(newRecord);
          onNotification?.({
            type: "payment",
            title: "Payment Confirmed",
            message: `Order ${newRecord.order_number || newRecord.id.slice(0, 8)} payment of $${newRecord.total?.toFixed(2) || "0.00"} received`,
            severity: "success",
            actionUrl: `/admin/orders/show/${newRecord.id}`,
          });
          playNotificationSound("payment");
        }

        // Check for status changes that need attention
        if (oldRecord?.status !== newRecord.status) {
          const needsAttention = ["cancelled", "refunded"].includes(
            newRecord.status
          );
          if (needsAttention) {
            onNotification?.({
              type: "order",
              title: `Order ${newRecord.status.charAt(0).toUpperCase() + newRecord.status.slice(1)}`,
              message: `Order ${newRecord.order_number || newRecord.id.slice(0, 8)} has been ${newRecord.status}`,
              severity: "warning",
              actionUrl: `/admin/orders/show/${newRecord.id}`,
            });
          }
        }
      }
    },
    [onNewOrder, onOrderUpdate, onPaymentReceived, onNotification]
  );

  const handleInventoryChange = useCallback(
    (payload: any) => {
      const { new: newRecord } = payload;

      // Check for low stock
      if (newRecord.available !== null && newRecord.available <= 5) {
        onLowStock?.(newRecord);

        // Only notify if it just crossed the threshold
        if (newRecord.available <= 5 && newRecord.available >= 0) {
          onNotification?.({
            type: "inventory",
            title: "Low Stock Alert",
            message: `Variant ${newRecord.variant_id.slice(0, 8)} is low on stock (${newRecord.available} available)`,
            severity: "warning",
            actionUrl: `/admin/inventory?variant=${newRecord.variant_id}`,
          });
          playNotificationSound("inventory");
        }

        // Critical alert for out of stock
        if (newRecord.available <= 0) {
          onNotification?.({
            type: "inventory",
            title: "Out of Stock",
            message: `Variant ${newRecord.variant_id.slice(0, 8)} is now out of stock`,
            severity: "error",
            actionUrl: `/admin/inventory?variant=${newRecord.variant_id}`,
          });
        }
      }
    },
    [onLowStock, onNotification]
  );

  useEffect(() => {
    if (!enabled) return;

    const supabase = supabaseRef.current;

    // Subscribe to orders channel
    const ordersChannel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        handleOrderChange
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Subscribed to orders channel");
        }
      });

    // Subscribe to inventory channel
    const inventoryChannel = supabase
      .channel("admin-inventory-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "inventory",
        },
        handleInventoryChange
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Subscribed to inventory channel");
        }
      });

    // Cleanup
    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(inventoryChannel);
    };
  }, [enabled, handleOrderChange, handleInventoryChange]);
}

/**
 * Hook to trigger a test notification (for testing sounds)
 */
export function useTestNotification() {
  const triggerTest = useCallback((type: "order" | "payment" | "inventory" | "system" = "order") => {
    playNotificationSound(type);
  }, []);

  return { triggerTest };
}
