export async function sendSlackMessage(webhookUrl: string, payload: { text: string }) {
  if (!webhookUrl) {
    throw new Error('Missing Slack webhook URL')
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error')
    throw new Error(`Slack webhook responded with ${response.status}: ${text}`)
  }
}
