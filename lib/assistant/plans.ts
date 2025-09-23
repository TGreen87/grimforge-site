import { AssistantActionType } from '@/lib/assistant/actions'

export interface ActionPlanStep {
  title: string
  detail: string
}

export interface ActionPlanSummary {
  steps: ActionPlanStep[]
  riskLevel: 'low' | 'medium' | 'high'
  riskNote?: string
  undoAvailable: boolean
}

export function buildActionPlan(type: AssistantActionType, parameters: Record<string, unknown> = {}): ActionPlanSummary | null {
  switch (type) {
    case 'create_product_full': {
      const publish = Boolean(parameters.publish)
      const featureOnHero = Boolean(parameters.featureOnHero)
      const steps: ActionPlanStep[] = [
        { title: 'Validate inputs', detail: 'Confirm price, stock targets, and required media are present before starting.' },
        { title: 'Enrich release details', detail: 'Fill any missing title, artist, tags, or description via the enrichment model.' },
        { title: 'Create product records', detail: 'Insert product, variant, and inventory rows with the generated metadata.' },
      ]
      if (publish) {
        steps.push({ title: 'Activate release', detail: 'Mark the product and variant active so it appears on the storefront.' })
      }
      if (featureOnHero) {
        steps.push({ title: 'Refresh campaign hero', detail: 'Update the hero campaign with copy and media for this release.' })
      }
      steps.push({ title: 'Audit & summary', detail: 'Log the action and post links back to the admin and storefront for review.' })
      return {
        steps,
        riskLevel: publish ? 'medium' : 'low',
        riskNote: publish
          ? 'Publishing immediately will surface the release live. Undo removes the generated product entirely.'
          : 'Product stays in draft; you can publish later from the admin.',
        undoAvailable: true,
      }
    }
    case 'draft_article': {
      const publish = Boolean(parameters.publish)
      const steps: ActionPlanStep[] = [
        { title: 'Gather context', detail: 'Use the brief, optional product slug, and attachments to steer copy.' },
        { title: 'Generate article copy', detail: 'Call the writing model for title, excerpt, markdown, and tag suggestions.' },
        { title: 'Persist draft', detail: 'Insert article with markdown and optional cover image into Supabase.' },
      ]
      if (publish) {
        steps.push({ title: 'Publish article', detail: 'Flip the published flag and timestamp so it appears on the Journal page.' })
      }
      steps.push({ title: 'Log outcome', detail: 'Record the action in audit + session logs and surface links for review.' })
      return {
        steps,
        riskLevel: publish ? 'medium' : 'low',
        riskNote: publish ? 'Publishing immediately will surface the article live; undo will delete it.' : undefined,
        undoAvailable: true,
      }
    }
    case 'publish_article': {
      return {
        steps: [
          { title: 'Fetch article', detail: 'Load the targeted article to confirm it is ready for publish.' },
          { title: 'Publish & timestamp', detail: 'Set published=true and stamp published_at so it appears publicly.' },
          { title: 'Log confirmation', detail: 'Record the publish action in audit + session streams.' },
        ],
        riskLevel: 'medium',
        riskNote: 'Undo will revert the published flag to its previous state.',
        undoAvailable: true,
      }
    }
    case 'update_campaign': {
      const activate = Boolean(parameters.activate)
      return {
        steps: [
          { title: 'Load current campaign', detail: 'Capture the existing hero state in case rollback is required.' },
          { title: 'Apply new content', detail: 'Upsert copy, layout, media, and CTAs for the supplied slug.' },
          activate
            ? { title: 'Activate hero', detail: 'Make the updated campaign live on the storefront hero immediately.' }
            : { title: 'Leave inactive', detail: 'Save changes but keep the hero inactive until you manually enable it.' },
          { title: 'Record update', detail: 'Write audit + session events with the new campaign metadata.' },
        ],
        riskLevel: activate ? 'medium' : 'low',
        riskNote: activate ? 'Undo restores the previous hero or deletes the new campaign entry.' : undefined,
        undoAvailable: true,
      }
    }
    default:
      return null
  }
}
