// =============================================================================
// Copilot Configuration
// =============================================================================
// Centralized configuration for the AI Copilot including:
// - System prompts
// - Agent configurations
// - Function tool definitions
// =============================================================================

import { assistantActions } from './actions'

// Agent types
export type AgentType = 'product' | 'operations' | 'marketing' | 'general'

// Agent configurations
export const AGENT_CONFIGS: Record<AgentType, {
  defaultModel: string
  systemPromptAddition: string
  reasoningEffort?: 'low' | 'medium' | 'high'
}> = {
  product: {
    defaultModel: 'gpt-5.1',
    reasoningEffort: 'high',
    systemPromptAddition: `
You specialize in product management for a metal music import business (vinyls, CDs, cassettes).

CRITICAL: When shown a product image or asked about an album, ALWAYS use web search to:
1. Identify the band/artist and album title from the image
2. Look up the release on Discogs/Metal Archives for: tracklist, label, year, catalog number
3. Research current market pricing on Discogs, eBay for similar format
4. Find genre information and scene context

After researching, provide:
- Full product details (artist, title, format, label, year, catalog#)
- A compelling metal-scene-appropriate description
- Suggested AUD pricing based on market research
- Tags that describe the MUSIC (genre, subgenre, themes, mood, country) - NOT format info

Example tags: black metal, atmospheric, Norwegian, raw production, occult themes, melodic, second wave.`,
  },
  operations: {
    defaultModel: 'gpt-5.1',
    systemPromptAddition: `
You specialize in inventory and order operations for an Australian music import business.
Help with stock management, order processing, shipping estimates (AU focused).
Provide clear summaries, flag issues (low stock, delays), and suggest optimizations.`,
  },
  marketing: {
    defaultModel: 'gpt-5.1',
    reasoningEffort: 'high',
    systemPromptAddition: `
You specialize in marketing content for underground metal music.
Your voice: authentic to metal/underground scene, knowledgeable, passionate but professional.
Create social posts (Instagram, Facebook), articles, email campaigns, release announcements.
Use genre-appropriate language, relevant hashtags, mention local AU shipping/AUD pricing.`,
  },
  general: {
    defaultModel: 'gpt-5.1',
    systemPromptAddition: '',
  },
}

// Main system prompt
export const COPILOT_SYSTEM_PROMPT = `You are Obsidian Rite Records Copilot, a calm and encouraging operations helper for a busy label owner.

You have access to:
- Web search: USE IT to research bands, albums, discography, pricing (Discogs, eBay), release info
- Function tools: Execute actions like creating products, receiving stock, drafting articles

When the owner shows you a product image or asks about music, ALWAYS search the web first to gather accurate information.

Guidelines:
- Explain everything in friendly, everyday language - no technical jargon
- When you reference the admin panel, mention the exact screen or button to look for
- Offer clear next steps in short checklists
- Only call function tools when you have ALL required information. If something is missing, ask first.
- When calling a function tool, briefly explain what will happen before calling it

You are helping run Obsidian Rite Records, an Australian underground metal label selling vinyl, CDs, and cassettes.`

// =============================================================================
// Function Tool Definitions
// =============================================================================
// Following the OpenAI Responses API format:
// - type: "function"
// - strict: true (guarantees schema compliance)
// - additionalProperties: false on parameters
// - ALL properties must be in 'required' array (use nullable type for optional)
// =============================================================================

interface PropertyDef {
  type: string | string[]  // Can be ["string", "null"] for nullable
  description: string
  enum?: string[]
}

interface FunctionToolDefinition {
  type: 'function'
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, PropertyDef>
    required: string[]
    additionalProperties: false
  }
  strict: true
}

// Convert assistant actions to OpenAI function tool format
// IMPORTANT: OpenAI strict mode requires ALL properties in 'required' array
// Optional parameters use nullable types: ["string", "null"]
function buildFunctionTools(): FunctionToolDefinition[] {
  return assistantActions.map(action => {
    const properties: Record<string, PropertyDef> = {}
    const required: string[] = []

    for (const param of action.parameters) {
      // Map our types to JSON schema types
      const baseType = param.type === 'number' ? 'number' :
                       param.type === 'boolean' ? 'boolean' : 'string'

      // For optional params, use nullable type array ["type", "null"]
      // For required params, use just the type
      properties[param.name] = {
        type: param.required ? baseType : [baseType, 'null'],
        description: param.description + (param.required ? '' : ' (optional)'),
      }

      // ALL properties must be in required array for strict mode
      required.push(param.name)
    }

    return {
      type: 'function' as const,
      name: action.type,
      description: action.summary,
      parameters: {
        type: 'object' as const,
        properties,
        required,
        additionalProperties: false as const,
      },
      strict: true as const,
    }
  })
}

// Web search tool configuration
// Using web_search (current) - see https://github.com/openai/openai-node
const webSearchTool = {
  type: 'web_search' as const,
  search_context_size: 'medium' as const,
  user_location: {
    type: 'approximate' as const,
    country: 'AU',
  },
}

// Get all tools for the assistant (web search + functions)
export function getAssistantTools() {
  return [
    webSearchTool,
    ...buildFunctionTools(),
  ]
}

// Export function tools separately for reference
export const FUNCTION_TOOLS = buildFunctionTools()
