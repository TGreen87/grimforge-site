import { test, expect } from '@playwright/test'

declare global {
  interface Window {
    __SHOPIFY_ENABLED__?: boolean
    __SHOPIFY_LAST_CHECKOUT__?: string | null
  }
}

test.describe('Shopify checkout button', () => {
  test('adds a line and redirects to checkout', async ({ page }) => {
    await page.addInitScript(() => {
      window.__SHOPIFY_ENABLED__ = true
      window.__SHOPIFY_LAST_CHECKOUT__ = null
      window.location.assign = (url: string) => {
        window.__SHOPIFY_LAST_CHECKOUT__ = url
      }
    })

    await page.route('**/api/shopify/cart', async (route) => {
      const request = route.request()
      expect(request.method()).toBe('POST')
      const body = request.postDataJSON() ?? {}
      expect(body).toEqual({})

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cartId: 'gid://shopify/Cart/123',
          checkoutUrl: 'https://shopify.example/checkout',
          totalQuantity: 1,
          correlationId: 'test-correlation',
        }),
      })
    })

    await page.goto('/products')

    const button = page.getByTestId('checkout-button')
    await expect(button).toBeEnabled()

    await button.click()

    await expect.poll(async () => {
      return page.evaluate(() => window.__SHOPIFY_LAST_CHECKOUT__)
    }).toBe('https://shopify.example/checkout')
  })
})
