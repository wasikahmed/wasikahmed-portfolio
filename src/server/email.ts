import 'server-only';

import nodemailer from 'nodemailer';

/**
 * Notification email for a new lead, sent via Gmail SMTP with an app
 * password (not OAuth — simplest option for a single-recipient inbox).
 * No-ops (logs and returns) when GMAIL_USER/GMAIL_APP_PASSWORD aren't set
 * — true in local dev, never true in production, where the deploy
 * workflow's .env always sets them. Keeps `pnpm dev` working without every
 * contributor needing real Gmail credentials.
 */
export async function sendLeadNotification(
  lead: {
    intent: 'project' | 'role';
    name: string;
    email: string;
    company?: string;
    budget?: string;
    message: string;
  },
  to: string,
): Promise<void> {
  const user = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  if (!user || !appPassword) {
    console.log('[email] GMAIL_USER/GMAIL_APP_PASSWORD unset — skipping send', {
      name: lead.name,
      email: lead.email,
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass: appPassword },
  });

  await transporter.sendMail({
    from: user,
    to,
    replyTo: lead.email,
    subject: `New ${lead.intent === 'project' ? 'project inquiry' : 'role inquiry'} from ${lead.name}`,
    text: [
      `Name: ${lead.name}`,
      `Email: ${lead.email}`,
      lead.company ? `Company: ${lead.company}` : null,
      lead.budget ? `Budget: ${lead.budget}` : null,
      '',
      lead.message,
    ]
      .filter((line) => line !== null)
      .join('\n'),
  });
}
