import { z } from 'zod'
import { TablesInsert } from '@/integrations/supabase/types'
import { createServiceClient } from '@/lib/supabase/server'
import { callOpenAIJson, JsonSchema } from '@/lib/assistant/openai'
import { AssistantAttachment } from '@/lib/assistant/types'
import { writeAuditLog } from '@/lib/audit-logger'

const ARTICLE_SCHEMA = z.object({
  title: z.string(),
  excerpt: z.string(),
  markdown: z.string(),
  tags: z.array(z.string()).default([]),
})

const ARTICLE_SCHEMA_DESCRIPTION = `{
  "title": string,
  "excerpt": string (one sentence teaser),
  "markdown": string (GitHub-flavoured markdown, include headings, paragraphs, and bullet lists),
  "tags": string array (max 6 entries)
}`

const ARTICLE_JSON_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'excerpt', 'markdown'],
  properties: {
    title: { type: 'string' },
    excerpt: { type: 'string' },
    markdown: { type: 'string' },
    tags: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 6,
      default: [],
    },
  },
}

const ARTICLE_SYSTEM_PROMPT =
  process.env.ASSISTANT_ARTICLE_SYSTEM_PROMPT ||
  [
    'You are the resident storyteller for Obsidian Rite Records. Write engaging journal posts that make underground metal feel approachable.',
    'Balance mood and clarity: paint a scene, share production notes, and explain why the release matters without assuming deep genre knowledge.',
    'Use headings and short paragraphs so the article is easy to skim.',
    'Wrap up with an inviting call-to-action that points readers toward the release or the label newsletter.'
  ].join(' ')

export interface DraftArticleInput {
  brief: string
  title?: string
  wordCount?: number
  publish?: boolean
  featured?: boolean
  tags?: string
  productSlug?: string
}

export interface DraftArticleResult {
  message: string
  articleId: string
  slug: string
  published: boolean
  undo: {
    action: 'delete_article'
    articleId: string
  }
}

export interface PublishArticleResult {
  message: string
  articleId: string
  slug: string
  undo: {
    action: 'restore_article_publish'
    articleId: string
    previousPublished: boolean
    previousPublishedAt: string | null
  } | null
}

export async function draftArticlePipeline(options: {
  input: DraftArticleInput
  attachments: AssistantAttachment[]
  userId?: string | null
}) : Promise<DraftArticleResult> {
  const { input, attachments } = options
  const supabase = createServiceClient()

  const wordCount = clampWordCount(input.wordCount ?? 400)
  const attachmentContext = attachments.map((item) => `${item.name} (${item.type || 'file'})`).join(', ')
  const imageInputs = attachments
    .filter((file) => file.type?.startsWith('image/'))
    .map((file) => ({
      type: 'input_image' as const,
      image_url: { url: file.url },
      detail: 'high' as const,
    }))

  const userPrompt = [
    `Brief: ${input.brief}`,
    input.productSlug ? `Target product slug: ${input.productSlug}` : null,
    `Word target: ${wordCount}`,
    attachmentContext ? `Attachments: ${attachmentContext}` : null,
    imageInputs.length ? 'When artwork is provided, weave its colours and imagery into the tone of the article.' : null,
    'Tone: black-metal journalistic, evocative, reverent but grounded.',
    'Include 2-3 headings and short paragraphs. Close with a call-to-action referencing the label.'
  ].filter(Boolean).join('\n')

  const article = await callOpenAIJson({
    systemPrompt: ARTICLE_SYSTEM_PROMPT,
    userPrompt,
    schema: ARTICLE_SCHEMA,
    schemaDescription: ARTICLE_SCHEMA_DESCRIPTION,
    jsonSchema: ARTICLE_JSON_SCHEMA,
    temperature: 0.5,
    attachments: imageInputs,
  })

  const title = (input.title ?? article.title).trim()
  if (!title) {
    throw new Error('Unable to determine article title from the brief.')
  }

  const baseSlug = slugify(title)
  const slug = await ensureUniqueArticleSlug(supabase, baseSlug)

  const coverImage = attachments.find((file) => file.type?.startsWith('image/'))?.url ?? attachments[0]?.url ?? null
  const published = Boolean(input.publish)

  const articleInsert: TablesInsert<'articles'> = {
    slug,
    title,
    excerpt: article.excerpt,
    content: article.markdown,
    author: 'Obsidian Rite Records',
    image_url: coverImage,
    published,
    published_at: published ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase
    .from('articles')
    .insert(articleInsert)
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create article: ${error.message}`)
  }

  await writeAuditLog({
    event_type: 'assistant.article.create',
    resource_type: 'article',
    resource_id: data.id as string,
    user_id: options.userId ?? undefined,
    metadata: {
      slug,
      published,
      word_count: wordCount,
    },
  })

  return {
    message: published ? `Published article “${title}”.` : `Drafted article “${title}”.`,
    articleId: data.id as string,
    slug,
    published,
    undo: {
      action: 'delete_article',
      articleId: data.id as string,
    },
  }
}

export async function publishArticlePipeline(options: {
  articleId?: string
  slug?: string
  featured?: boolean
  userId?: string | null
}): Promise<PublishArticleResult> {
  const supabase = createServiceClient()
  const identifier = options.articleId || options.slug
  if (!identifier) {
    throw new Error('Provide an articleId or slug to publish the article')
  }

  let fetchQuery = supabase
    .from('articles')
    .select('id, title, slug, published, published_at')

  if (options.articleId) {
    fetchQuery = fetchQuery.eq('id', options.articleId)
  } else if (options.slug) {
    fetchQuery = fetchQuery.eq('slug', options.slug)
  }

  const { data: existing, error: fetchError } = await fetchQuery.single()
  if (fetchError) {
    throw new Error(`Failed to locate article: ${fetchError.message}`)
  }

  if (existing.published) {
    return {
      message: `Article “${existing.title}” is already published.`,
      articleId: existing.id,
      slug: existing.slug,
      undo: null,
    }
  }

  const now = new Date().toISOString()

  let updateQuery = supabase
    .from('articles')
    .update({
      published: true,
      published_at: now,
    })

  if (options.articleId) {
    updateQuery = updateQuery.eq('id', options.articleId)
  } else if (options.slug) {
    updateQuery = updateQuery.eq('slug', options.slug)
  }

  const { data, error } = await updateQuery.select('id, title, slug').single()
  if (error) {
    throw new Error(`Failed to publish article: ${error.message}`)
  }

  await writeAuditLog({
    event_type: 'assistant.article.publish',
    resource_type: 'article',
    resource_id: data.id as string,
    user_id: options.userId ?? undefined,
    metadata: {
      slug: data.slug,
    },
  })

  return {
    message: `Published article “${data.title}”.`,
    articleId: data.id as string,
    slug: data.slug,
    undo: {
      action: 'restore_article_publish',
      articleId: data.id as string,
      previousPublished: existing.published,
      previousPublishedAt: existing.published_at,
    },
  }
}

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'article'
  )
}

async function ensureUniqueArticleSlug(supabase: ReturnType<typeof createServiceClient>, baseSlug: string) {
  let candidate = baseSlug
  let attempt = 1
  while (attempt <= 5) {
    const { data, error } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to verify article slug uniqueness: ${error.message}`)
    }
    if (!data) {
      return candidate
    }
    attempt += 1
    candidate = `${baseSlug}-${attempt}`
  }
  throw new Error('Unable to generate a unique article slug after multiple attempts')
}

function clampWordCount(wordCount: number) {
  if (Number.isNaN(wordCount)) return 400
  return Math.max(200, Math.min(1200, Math.round(wordCount)))
}
