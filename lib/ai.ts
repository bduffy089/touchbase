import type { ContactWithStatus, Interaction, MessageChannel } from '@/types'

export function buildSuggestMessagePrompt(
  contact: ContactWithStatus,
  interactions: Interaction[],
  channel: MessageChannel,
): { system: string; user: string } {
  const channelGuide: Record<MessageChannel, string> = {
    linkedin:
      'Write a LinkedIn message. Keep it short and casual — 2-4 sentences. No subject line.',
    email:
      'Write an email. Start with a subject line on its own line prefixed with "Subject: ", then a blank line, then the body. Slightly more formal than a text, but still warm.',
    text:
      'Write a text message. Brief and informal — 1-2 sentences max. No greeting or sign-off.',
  }

  const system = `You write warm, authentic messages to reconnect with people you know personally. Never salesy, never stiff. Match the tone to the channel and the relationship. Output ONLY the message — no preamble, no explanation, no quotes around it.

${channelGuide[channel]}`

  const tagList = contact.tags.map((t) => t.name).join(', ')
  const interactionHistory = interactions
    .slice(0, 3)
    .map((i) => `- ${i.type} on ${i.date}: ${i.note ?? '(no note)'}`)
    .join('\n')

  const user = `Contact: ${contact.name}
Company: ${contact.company ?? 'N/A'}
Tags: ${tagList || 'none'}
How we met: ${contact.how_met ?? 'N/A'}
Notes: ${contact.notes ?? 'N/A'}
Check-in cadence: every ${contact.cadence_days} days
Days overdue: ${Math.round(contact.days_overdue)}
Last 3 interactions:
${interactionHistory || '(no interactions logged)'}

Write a ${channel} message to reconnect with ${contact.name}.`

  return { system, user }
}

export function buildInsightsPrompt(
  contact: ContactWithStatus,
  interactions: Interaction[],
): { system: string; user: string } {
  const system = `You provide brief relationship insights for a personal CRM. Return 2-4 bullet points as plain text, one per line, each starting with "• ". Include:
1. How long since last contact (use the days_since number provided)
2. Key topics or themes from recent interaction notes (if any)
3. 1-2 suggested conversation openers based on the relationship context

Be warm, concise, and specific. No preamble, no headers — just the bullet points.`

  const tagList = contact.tags.map((t) => t.name).join(', ')
  const interactionHistory = interactions
    .slice(0, 5)
    .map((i) => `- ${i.type} on ${i.date}: ${i.note ?? '(no note)'}`)
    .join('\n')

  const user = `Contact: ${contact.name}
Company: ${contact.company ?? 'N/A'}
Tags: ${tagList || 'none'}
How we met: ${contact.how_met ?? 'N/A'}
Notes: ${contact.notes ?? 'N/A'}
Check-in cadence: every ${contact.cadence_days} days
Days since last contact: ${Math.round(contact.days_since)}
Days overdue: ${Math.round(contact.days_overdue)}
Last 5 interactions:
${interactionHistory || '(no interactions logged)'}

Provide relationship insights for ${contact.name}.`

  return { system, user }
}

export function buildSuggestCadencePrompt(
  contactName: string,
  currentCadence: number,
  actualAvgDays: number,
): { system: string; user: string } {
  const system = `You write a brief, friendly one-sentence explanation of why someone's check-in cadence should change. Output ONLY the sentence — no preamble, no explanation, no quotes.`

  const user = `Contact: ${contactName}
Current cadence setting: every ${currentCadence} days
Actual average contact frequency: every ${Math.round(actualAvgDays)} days

Write one sentence suggesting they update their cadence to match reality.`

  return { system, user }
}

export function buildParseLinkedInPrompt(text: string): { system: string; user: string } {
  const system = `You extract contact information from LinkedIn profile text. Return a JSON object with a "contacts" array. Each contact object has these fields:

- name (string, required): Full name
- company (string or null): Current company
- notes (string or null): A brief summary (2-3 sentences) of the most useful CRM context — role, previous companies, education, notable skills or interests. Write in third person.

If you can identify multiple distinct profiles in the text, return each as a separate entry. If the text doesn't contain any identifiable profile, return an empty contacts array.

Return ONLY valid JSON, no markdown fences, no explanation.`

  const user = `Extract contacts from this LinkedIn profile text:\n\n${text}`

  return { system, user }
}
