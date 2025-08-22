import { vi } from 'vitest'

// Mock environment variables for testing
process.env.STRIPE_SECRET_KEY_1 = 'sk_test_mock'
process.env.STRIPE_WEBHOOK_SECRET_1 = 'whsec_test_mock'
process.env.SITE_URL_STAGING = 'http://localhost:3000'
process.env.SUPABASE_URL_STAGING = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY_1 = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_1 = 'test-service-role-key'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
}