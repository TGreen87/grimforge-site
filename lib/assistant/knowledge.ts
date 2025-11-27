import fs from 'fs/promises'
import path from 'path'
import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small'
const KNOWLEDGE_SOURCES = [
  { id: 'admin-workflows', file: 'docs/ADMIN-WORKFLOWS.md', title: 'Admin Workflows Guide' },
  { id: 'owner-handbook', file: 'docs/OWNER-HANDBOOK.md', title: 'Owner Handbook' },
  { id: 'implementation-plan', file: 'docs/IMPLEMENTATION-PLAN.md', title: 'Implementation Plan' },
  { id: 'next-steps', file: 'docs/NEXT-STEPS.md', title: 'Next Steps' },
  { id: 'qa-checklist', file: 'docs/QA-CHECKLIST.md', title: 'QA Checklist' },
  { id: 'admin-rfc', file: 'docs/ADMIN-VISUALS-RFC.md', title: 'Admin Visuals RFC' },
  { id: 'agent-pipelines', file: 'docs/AGENT-PIPELINES.md', title: 'Assistant Pipelines Spec' },
]

interface KnowledgeChunk {
  content: string
  chunkIndex: number
  tokenCount: number
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[#>*_~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function chunkText(text: string, maxChars = 1200): KnowledgeChunk[] {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks: KnowledgeChunk[] = []
  let buffer = ''
  let index = 0

  for (const sentence of sentences) {
    const candidate = buffer ? `${buffer} ${sentence}`.trim() : sentence.trim()
    if (candidate.length > maxChars && buffer) {
      chunks.push({ content: buffer, chunkIndex: index++, tokenCount: Math.ceil(buffer.length / 4) })
      buffer = sentence.trim()
      continue
    }
    if (candidate.length >= maxChars) {
      chunks.push({ content: candidate.slice(0, maxChars), chunkIndex: index++, tokenCount: Math.ceil(maxChars / 4) })
      buffer = candidate.slice(maxChars)
      continue
    }
    buffer = candidate
  }

  if (buffer) {
    chunks.push({ content: buffer, chunkIndex: chunks.length, tokenCount: Math.ceil(buffer.length / 4) })
  }

  return chunks
}

async function embedTexts(texts: string[]) {
  if (!texts.length) return []
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model: OPENAI_EMBEDDING_MODEL,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI embeddings failed: ${response.status} ${error}`)
  }

  const json = (await response.json()) as { data: Array<{ embedding: number[] }> }
  return json.data.map((item) => item.embedding)
}

async function loadFile(sourceFile: string) {
  const absolute = path.join(process.cwd(), sourceFile)
  try {
    const file = await fs.readFile(absolute, 'utf8')
    const checksum = createHash('sha1').update(file).digest('hex')
    const stripped = stripMarkdown(file)
    const chunks = chunkText(stripped)
    return { checksum, chunks }
  } catch (error) {
    // File might not exist in serverless function environment
    console.warn(`Knowledge file not found: ${sourceFile}`)
    return null
  }
}

declare global {
  var __assistantKnowledgePromise: Promise<void> | undefined
}

async function buildKnowledgePromise() {
  const supabase = createServiceClient()

  for (const source of KNOWLEDGE_SOURCES) {
    const loadResult = await loadFile(source.file)

    // Skip if file doesn't exist (e.g., in serverless environment)
    if (!loadResult) {
      continue
    }

    const { checksum, chunks } = loadResult

    const { data: existing } = await supabase
      .from('assistant_documents')
      .select('metadata')
      .eq('source_path', source.file)
      .limit(1)

    const currentChecksum = existing?.[0]?.metadata?.checksum

    if (currentChecksum === checksum) {
      continue
    }

    await supabase.from('assistant_documents').delete().eq('source_path', source.file)

    const embeddings = await embedTexts(chunks.map((chunk) => chunk.content))

    const rows = chunks.map((chunk, index) => ({
      source_path: source.file,
      chunk_index: index,
      title: source.title,
      content: chunk.content,
      metadata: {
        checksum,
        sourceId: source.id,
        title: source.title,
      },
      embedding: embeddings[index],
      token_count: chunk.tokenCount,
    }))

    if (rows.length) {
      await supabase.from('assistant_documents').upsert(rows, {
        onConflict: 'source_path,chunk_index',
      })
    }
  }
}

export async function ensureAssistantKnowledge(options?: { force?: boolean }) {
  if (!options?.force && globalThis.__assistantKnowledgePromise) {
    return globalThis.__assistantKnowledgePromise
  }

  if (options?.force) {
    await buildKnowledgePromise()
    return
  }

  globalThis.__assistantKnowledgePromise = buildKnowledgePromise()

  return globalThis.__assistantKnowledgePromise
}

export async function searchAssistantKnowledge(query: string, options?: { matchCount?: number; threshold?: number }) {
  await ensureAssistantKnowledge()

  const [embedding] = await embedTexts([query])
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('match_assistant_documents', {
    query_embedding: embedding,
    match_count: options?.matchCount ?? 6,
    match_threshold: options?.threshold ?? 0.25,
  })

  if (error) {
    throw new Error(`match_assistant_documents failed: ${error.message}`)
  }

  return data as Array<{
    id: string
    source_path: string
    chunk_index: number
    title: string | null
    content: string
    metadata: Record<string, unknown> | null
    similarity: number
  }>
}
