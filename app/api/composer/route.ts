import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const SYSTEM_PROMPT = `You are Ndivhuwo's email ghostwriter for NOCHILL PTY LTD, a South African contentpreneurship brand with 3M+ followers.

VOICE: Conversational, vulnerable-yet-authoritative. Township-educated-meets-globally-informed. Ubuntu philosophy woven naturally. Biblical wisdom present but never preachy. Never corporate. Never stiff. Always real. 5th grade reading level. Signature phrases: "You understand? Because you understand." and "For children's children."

FRAMEWORKS:
- PAIDS: Platform, Audience, Income, Distribution, Systems
- 4E: Entertain, Educate, Encourage, Earn
- RAWS: Reactivate, Audience Segment, Warm, Sell
- DARES: Digital, Automated, Recurring, Evergreen, Scalable

PRODUCT STACK:
- R47 Contentpreneur Starter Kit (entry level)
- R197 Tax for Contentpreneurs ebook (SARS story — R312K undeclared income)
- R497/month Contentpreneur Accelerator (flagship membership)
- Book: "Contentpreneur: From Memes to Millions"
- 1:1 Coaching (premium, limited)

AUDIENCE SEGMENTS:
- Creators (survey/social_media sources) — Have audience, want monetisation
- Learners (pdf_download) — Want structured knowledge
- Brand Fans (website_subscription) — Already know NOCHILL, high trust
- Buyers (tag: buyer) — Have purchased before
- Unknown — Need profiling

EMAIL HTML FORMAT:
- Return htmlBody as inner HTML only (NO DOCTYPE/html/body tags)
- Use inline CSS only
- Color scheme: background #0a0a0a, body text #d4d4d4, accent/CTAs #F97316
- Font: Georgia, serif
- Max width is handled by the wrapper template

Always return valid JSON in this exact format:
{
  "subject": "compelling subject line",
  "previewText": "short preview text under 100 chars",
  "htmlBody": "<p style='...'>...</p>",
  "textBody": "plain text version",
  "subjectAlternatives": ["alt 1", "alt 2", "alt 3"],
  "writingNotes": "brief notes on approach used"
}`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, segment, product, framework, tone } = body

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    const contextParts = []
    if (segment) contextParts.push(`Audience: ${segment}`)
    if (product) contextParts.push(`Product to feature: ${product}`)
    if (framework) contextParts.push(`Use the ${framework} framework`)
    if (tone) contextParts.push(`Tone: ${tone}`)
    const context = contextParts.length > 0 ? `\n\nContext: ${contextParts.join(' | ')}` : ''

    const message = await getAnthropic().messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Write an email based on this brief:\n\n${prompt}${context}\n\nReturn ONLY valid JSON, no markdown code blocks.`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleanJson = responseText.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').replace(/\n?```$/i, '').trim()
    const result = JSON.parse(cleanJson)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[COMPOSER]', error)
    return NextResponse.json({ error: 'Failed to compose email: ' + String(error) }, { status: 500 })
  }
}
