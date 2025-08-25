import { getSupabaseBrowserClient } from '@/integrations/supabase/browser'
import { type Database } from '@/lib/supabase/types'

type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'

type ResourceType = 
  | 'product'
  | 'variant'
  | 'order'
  | 'customer'
  | 'inventory'
  | 'user'
  | 'settings'

interface AuditLogEntry {
  action: AuditAction
  resourceType: ResourceType
  resourceId?: string
  metadata?: Record<string, unknown>
  userId?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
}

class AuditLogger {
  private get supabase() { return getSupabaseBrowserClient() }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('audit_logs')
        .insert({
          action: entry.action,
          resource_type: entry.resourceType,
          resource_id: entry.resourceId || null,
          metadata: entry.metadata || null,
          user_id: entry.userId || null,
          user_email: entry.userEmail || null,
          ip_address: entry.ipAddress || null,
          user_agent: entry.userAgent || null,
        })

      if (error) {
        console.error('Failed to create audit log:', error)
      }
    } catch (error) {
      console.error('Error in audit logger:', error)
    }
  }

  async logProductChange(
    action: AuditAction,
    productId: string,
    changes?: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    await this.log({
      action,
      resourceType: 'product',
      resourceId: productId,
      metadata: changes,
      userId,
    })
  }

  async logOrderChange(
    action: AuditAction,
    orderId: string,
    changes?: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    await this.log({
      action,
      resourceType: 'order',
      resourceId: orderId,
      metadata: changes,
      userId,
    })
  }

  async logInventoryChange(
    action: AuditAction,
    variantId: string,
    changes?: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    await this.log({
      action,
      resourceType: 'inventory',
      resourceId: variantId,
      metadata: changes,
      userId,
    })
  }

  async logCustomerChange(
    action: AuditAction,
    customerId: string,
    changes?: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    await this.log({
      action,
      resourceType: 'customer',
      resourceId: customerId,
      metadata: changes,
      userId,
    })
  }

  async logUserActivity(
    action: 'login' | 'logout',
    userId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      action,
      resourceType: 'user',
      resourceId: userId,
      metadata,
      userId,
    })
  }

  async getAuditLogs(
    filters?: {
      resourceType?: ResourceType
      resourceId?: string
      userId?: string
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ) {
    let query = this.supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.resourceType) {
      query = query.eq('resource_type', filters.resourceType)
    }

    if (filters?.resourceId) {
      query = query.eq('resource_id', filters.resourceId)
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString())
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch audit logs:', error)
      return []
    }

    return data || []
  }
}

export const auditLogger = new AuditLogger()
export type { AuditAction, ResourceType, AuditLogEntry }