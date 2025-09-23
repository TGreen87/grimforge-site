export const assistantActionTypes = [
  'create_product_draft',
  'receive_stock',
  'summarize_analytics',
  'lookup_order_status',
  'create_product_full',
  'draft_article',
  'publish_article',
  'update_campaign',
] as const
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
  {
    type: 'summarize_analytics',
    label: 'Summarize Analytics',
    summary: 'Pulls traffic and event highlights for the selected time range.',
    parameters: [
      { name: 'range', label: 'Range', description: 'Time window (24h, 7d, 30d). Defaults to 7d.', required: false, type: 'string', example: '7d' },
      { name: 'pathname', label: 'Path Filter', description: 'Optional pathname to scope analytics to (e.g. /products).', required: false, type: 'string' },
    ],
  },
  {
    type: 'lookup_order_status',
    label: 'Lookup Order Status',
    summary: 'Finds the latest order details using an order number or customer email.',
    parameters: [
      { name: 'order_number', label: 'Order Number', description: 'Exact order number (e.g. ORR-123456).', required: false, type: 'string' },
      { name: 'email', label: 'Customer Email', description: 'Customer email address.', required: false, type: 'string' },
    ],
  },
  {
    type: 'create_product_full',
    label: 'Create & Publish Product',
    summary: 'Generates copy, uploads media, and publishes a full product (with optional hero update).',
    parameters: [
      { name: 'brief', label: 'Brief', description: 'Short description or notes about the release.', required: false, type: 'string' },
      { name: 'title', label: 'Title', description: 'Product title if already known.', required: false, type: 'string' },
      { name: 'artist', label: 'Artist', description: 'Artist or project name.', required: false, type: 'string' },
      { name: 'format', label: 'Format', description: 'Product format (Vinyl, Cassette, etc.).', required: false, type: 'string' },
      { name: 'price', label: 'Price (AUD)', description: 'Final retail price in AUD.', required: false, type: 'number' },
      { name: 'stock', label: 'Initial Stock', description: 'Initial on-hand quantity to allocate.', required: false, type: 'number' },
      { name: 'publish', label: 'Publish Immediately', description: 'Set true to make the product active after creation.', required: false, type: 'boolean' },
      { name: 'featureOnHero', label: 'Feature on Hero', description: 'Set true to update the storefront hero campaign.', required: false, type: 'boolean' },
      { name: 'heroLayout', label: 'Hero Layout', description: 'Hero layout to use (classic, split, minimal).', required: false, type: 'string' },
      { name: 'heroSubtitle', label: 'Hero Subtitle', description: 'Optional hero subtitle copy.', required: false, type: 'string' },
      { name: 'heroBadge', label: 'Hero Badge', description: 'Optional badge text for the hero.', required: false, type: 'string' },
      { name: 'heroHighlights', label: 'Hero Highlights', description: 'Comma-separated hero highlight bullets.', required: false, type: 'string' },
      { name: 'tags', label: 'Tags', description: 'Comma-separated product tags.', required: false, type: 'string' },
    ],
  },
  {
    type: 'draft_article',
    label: 'Draft Article',
    summary: 'Creates a new Journal article draft with generated copy and optional cover art.',
    parameters: [
      { name: 'brief', label: 'Brief', description: 'Summary of the article and key talking points.', required: true, type: 'string' },
      { name: 'title', label: 'Title', description: 'Preferred title (overridden if blank).', required: false, type: 'string' },
      { name: 'wordCount', label: 'Word Count', description: 'Approximate word target (default 400).', required: false, type: 'number' },
      { name: 'publish', label: 'Publish Immediately', description: 'Set true to publish after drafting.', required: false, type: 'boolean' },
      { name: 'featured', label: 'Mark as Featured', description: 'Set true to promote to the featured slot.', required: false, type: 'boolean' },
      { name: 'tags', label: 'Suggested Tags', description: 'Comma-separated themes or topics.', required: false, type: 'string' },
      { name: 'productSlug', label: 'Associated Product Slug', description: 'Product slug to reference within the article.', required: false, type: 'string' },
    ],
  },
  {
    type: 'publish_article',
    label: 'Publish Article',
    summary: 'Publishes an existing draft article and optionally promotes it.',
    parameters: [
      { name: 'articleId', label: 'Article ID', description: 'UUID of the article to publish.', required: false, type: 'string' },
      { name: 'slug', label: 'Article Slug', description: 'Slug of the article to publish.', required: false, type: 'string' },
      { name: 'featured', label: 'Mark as Featured', description: 'Set true to promote to the featured slot.', required: false, type: 'boolean' },
    ],
  },
  {
    type: 'update_campaign',
    label: 'Update Storefront Hero',
    summary: 'Updates the storefront campaign hero with new copy, media, and links.',
    parameters: [
      { name: 'slug', label: 'Campaign Slug', description: 'Slug for the campaign (existing or new).', required: true, type: 'string' },
      { name: 'title', label: 'Title', description: 'Hero headline text.', required: true, type: 'string' },
      { name: 'subtitle', label: 'Subtitle', description: 'Secondary line under the title.', required: false, type: 'string' },
      { name: 'description', label: 'Description', description: 'Long-form hero description.', required: false, type: 'string' },
      { name: 'layout', label: 'Layout', description: 'Hero layout (classic, split, minimal).', required: false, type: 'string' },
      { name: 'badgeText', label: 'Badge Text', description: 'Optional badge displayed above the title.', required: false, type: 'string' },
      { name: 'highlightBullets', label: 'Highlight Bullets', description: 'Comma-separated highlight bullets.', required: false, type: 'string' },
      { name: 'ctaPrimaryLabel', label: 'Primary CTA Label', description: 'Text for the primary CTA button.', required: false, type: 'string' },
      { name: 'ctaPrimaryHref', label: 'Primary CTA Link', description: 'URL for the primary CTA button.', required: false, type: 'string' },
      { name: 'ctaSecondaryLabel', label: 'Secondary CTA Label', description: 'Text for the secondary CTA button.', required: false, type: 'string' },
      { name: 'ctaSecondaryHref', label: 'Secondary CTA Link', description: 'URL for the secondary CTA button.', required: false, type: 'string' },
      { name: 'activate', label: 'Activate Campaign', description: 'Set true to make this campaign live immediately.', required: false, type: 'boolean' },
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
