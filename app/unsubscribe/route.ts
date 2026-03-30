import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts, emailEvents } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const email = searchParams.get('email') || ''

  if (!email) {
    return new NextResponse(unsubscribePage('Invalid unsubscribe link.', false), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const decodedEmail = decodeURIComponent(email).toLowerCase().trim()

  try {
    const contact = await db.select({ id: contacts.id, status: contacts.status })
      .from(contacts)
      .where(eq(contacts.email, decodedEmail))
      .limit(1)

    if (!contact.length) {
      return new NextResponse(unsubscribePage('Email not found in our system.', false), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    if (contact[0].status === 'unsubscribed') {
      return new NextResponse(unsubscribePage('You are already unsubscribed.', true), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    await db.update(contacts)
      .set({
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contacts.email, decodedEmail))

    await db.insert(emailEvents).values({
      contactId: contact[0].id,
      email: decodedEmail,
      eventType: 'unsubscribed',
    })

    return new NextResponse(unsubscribePage(`${decodedEmail} has been unsubscribed successfully.`, true), {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (err) {
    console.error('[UNSUBSCRIBE]', err)
    return new NextResponse(unsubscribePage('Something went wrong. Please try again.', false), {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

function unsubscribePage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Unsubscribe — NOCHILL</title>
<style>
  body { background: #080808; color: #f0f0f0; font-family: Georgia, serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .card { background: #111; border: 1px solid #222; border-radius: 12px; padding: 48px; max-width: 480px; text-align: center; }
  .logo { font-size: 28px; font-weight: 900; letter-spacing: 3px; color: #F97316; margin-bottom: 24px; }
  .icon { font-size: 48px; margin-bottom: 16px; }
  h1 { font-size: 22px; margin-bottom: 16px; }
  p { color: #999; line-height: 1.7; margin-bottom: 24px; }
  a { color: #F97316; text-decoration: none; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">NO CHILL</div>
  <div class="icon">${success ? '✓' : '⚠️'}</div>
  <h1>${success ? 'Done.' : 'Hmm.'}</h1>
  <p>${message}</p>
  <p style="font-size: 13px;">
    Changed your mind? You can always <a href="https://contentpreneurhub.online">subscribe again</a>.
  </p>
  <p style="font-size: 12px; color: #444;">NOCHILL PTY LTD · South Africa · POPIA Compliant</p>
</div>
</body>
</html>`
}
