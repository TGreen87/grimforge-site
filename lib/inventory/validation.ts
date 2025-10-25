export interface InventoryOperationInput {
  quantity: number
  variantId: string | null | undefined
}

export function validateInventoryOperation({ quantity, variantId }: InventoryOperationInput): boolean {
  if (typeof quantity !== 'number' || Number.isNaN(quantity) || quantity <= 0) {
    return false
  }

  if (typeof variantId !== 'string') {
    return false
  }

  const trimmed = variantId.trim()
  return trimmed.length > 0
}
