import { Resend } from 'resend'
import { SESClient, SendEmailCommand, SendBulkTemplatedEmailCommand } from '@aws-sdk/client-ses'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export function wrapEmailTemplate(params: {
  htmlBody: string
  contactEmail: string
  contactId?: number
  campaignId?: number
  sequenceEmailId?: number
  trackingType?: 'campaign' | 'sequence'
}): string {
  const { htmlBody, contactEmail, contactId, campaignId, sequenceEmailId, trackingType } = params
  const baseUrl = process.env.TRACKING_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
  const encodedEmail = encodeURIComponent(contactEmail)
  const id = campaignId || sequenceEmailId || 0
  const type = trackingType || 'campaign'

  const trackingPixel = `<img src="${baseUrl}/api/track/open?email=${encodedEmail}&id=${id}&type=${type}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;" />`
  const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodedEmail}`

  // Rewrite links for click tracking
  const trackedHtml = htmlBody.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (match, url) => {
      if (url.includes('/unsubscribe') || url.includes('/track/')) return match
      const encodedUrl = encodeURIComponent(url)
      return `href="${baseUrl}/api/track/click?url=${encodedUrl}&email=${encodedEmail}&id=${id}&type=${type}"`
    }
  )

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>NOCHILL Email</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="padding:0 0 24px 0;">
            <span style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;letter-spacing:2px;color:#F97316;">NO CHILL</span>
          </td>
        </tr>
        <tr>
          <td style="background:#111111;border-radius:8px;padding:40px;color:#f0f0f0;font-size:16px;line-height:1.7;">
            ${trackedHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 0 0 0;font-family:Arial,sans-serif;font-size:12px;color:#666666;line-height:1.6;">
            <p style="margin:0 0 8px 0;">You're receiving this because you opted in to NOCHILL updates.</p>
            <p style="margin:0;">
              <a href="${unsubscribeUrl}" style="color:#F97316;text-decoration:underline;">Unsubscribe</a>
              &nbsp;|&nbsp; NOCHILL PTY LTD, South Africa
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
${trackingPixel}
</body>
</html>`
}

export async function sendViaResend(params: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  const { to, subject, html, text } = params
  return resend.emails.send({
    from: `${process.env.RESEND_FROM_NAME || 'Ndivhuwo | NO CHILL'} <${process.env.RESEND_FROM_EMAIL || 'hello@nochill.co.za'}>`,
    to,
    subject,
    html,
    text: text || '',
  })
}

export async function sendViaSES(params: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  const { to, subject, html, text } = params
  const command = new SendEmailCommand({
    Source: `${process.env.RESEND_FROM_NAME || 'Ndivhuwo | NO CHILL'} <${process.env.AWS_SES_FROM_EMAIL || 'hello@nochill.co.za'}>`,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: html, Charset: 'UTF-8' },
        Text: { Data: text || '', Charset: 'UTF-8' },
      },
    },
  })
  return sesClient.send(command)
}
