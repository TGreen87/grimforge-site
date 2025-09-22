export const assistantActionTypes = ['create_product_draft', 'receive_stock'] as const
export type AssistantActionType = (typeof assistantActionTypes)[number]

export interface AssistantActionParameter {
  name: string
  label: string
  description: string
  required: boolean
  type: 'string' | 'number' | 'boolean'
  example?: string | number
}

export interface AssistantActionDefinition {
  type: AssistantActionType
  label: string
  summary: string
  parameters: AssistantActionParameter[]
}

export const assistantActions: AssistantActionDefinition[] = [
  {
    type: 'create_product_draft',
    label: 'Create Product Draft',
    summary: 'Creates an inactive product draft with a default variant and inventory stub.',
    parameters: [
      { name: 'title', label: 'Title', description: 'Product title', required: true, type: 'string' },
      { name: 'artist', label: 'Artist', description: 'Artist or project name', required: true, type: 'string' },
      { name: 'format', label: 'Format', description: 'Format (e.g. Vinyl, Cassette)', required: true, type: 'string' },
      { name: 'price', label: 'Price (AUD)', description: 'Unit price in AUD', required: true, type: 'number' },
      { name: 'slug', label: 'Slug', description: 'URL-friendly identifier (auto-generated if omitted)', required: false, type: 'string' },
      { name: 'stock', label: 'Opening Stock', description: 'Initial on-hand quantity', required: false, type: 'number' },
      { name: 'description', label: 'Description', description: 'Product description', required: false, type: 'string' },
      { name: 'tags', label: 'Tags', description: 'Array of product tags', required: false, type: 'string' },
      { name: 'image', label: 'Hero Image', description: 'Image URL', required: false, type: 'string' },
    ],
  },
  {
    type: 'receive_stock',
    label: 'Receive Stock',
    summary: 'Receives additional units into inventory for an existing variant.',
    parameters: [
      { name: 'variant_id', label: 'Variant ID', description: 'UUID of the variant to receive stock for', required: true, type: 'string' },
      { name: 'quantity', label: 'Quantity', description: 'Units to receive (must be positive)', required: true, type: 'number' },
      { name: 'notes', label: 'Notes', description: 'Optional receiving note (supplier, batch, etc.)', required: false, type: 'string' },
    ],
  },
]

export const assistantActionMap = assistantActions.reduce<Record<AssistantActionType, AssistantActionDefinition>>(
  (acc, action) => {
    acc[action.type] = action
    return acc
  },
  {} as Record<AssistantActionType, AssistantActionDefinition>
)

export function buildActionsPrompt(): string {
  const lines: string[] = []
  lines.push('Available assistant actions:')
  assistantActions.forEach((action) => {
    lines.push(`- ${action.type}: ${action.summary}`)
    action.parameters.forEach((param) => {
      lines.push(`  • ${param.name} (${param.type})${param.required ? '' : ' [optional]'} – ${param.description}`)
    })
  })
  lines.push('When proposing an action, include every required parameter in the structured response. Use camelCase keys that match the parameter names.')
  return lines.join('\n')
}
