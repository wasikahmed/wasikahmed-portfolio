import 'server-only';

import nodemailer from 'nodemailer';

/** Shared Gmail SMTP transporter, or null when credentials aren't configured. */
function getTransporter() {
  const user = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  if (!user || !appPassword) return null;
  return {
    user,
    transporter: nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: appPassword },
    }),
  };
}

/**
 * Notification email for a new lead, sent via Gmail SMTP with an app
 * password (not OAuth — simplest option for a single-recipient inbox).
 * No-ops (logs and returns) when GMAIL_USER/GMAIL_APP_PASSWORD aren't set
 * — true in local dev, never true in production, where the deploy
 * workflow's .env always sets them. Keeps `pnpm dev` working without every
 * contributor needing real Gmail credentials.
 *
 * `replyTo` is the visitor, so answering is just Reply in Gmail.
 */
export async function sendLeadNotification(
  lead: {
    name: string;
    email: string;
    company?: string;
    budget?: string;
    message: string;
  },
  to: string,
): Promise<void> {
  const smtp = getTransporter();
  if (!smtp) {
    console.log('[email] GMAIL_USER/GMAIL_APP_PASSWORD unset — skipping send', {
      name: lead.name,
      email: lead.email,
    });
    return;
  }

  await smtp.transporter.sendMail({
    from: smtp.user,
    to,
    replyTo: lead.email,
    subject: `New message from ${lead.name}${lead.company ? ` (${lead.company})` : ''}`,
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

/**
 * The "your message arrived" receipt sent back to whoever used the contact
 * form. Returns whether it was actually sent, so the form only promises a
 * confirmation email when one is on its way.
 *
 * Deliberately carries nothing the visitor typed — not their message, not
 * even their name. The form is public and the address is unverified, so
 * anyone can aim this at a stranger's inbox; echoing submitted text would
 * let them choose what your Gmail account says to that stranger. Fixed
 * text makes that worthless (Turnstile and the per-IP rate limit cap the
 * volume). No reply-time promise either, on purpose: the contact page
 * already states one, editable in Settings.
 *
 * `replyTo` is the owner's public address, so a reply to the receipt lands
 * in the same thread of work as the original lead.
 */
export async function sendLeadReceipt(
  to: string,
  owner: { name: string; role: string; email: string },
): Promise<boolean> {
  const smtp = getTransporter();
  if (!smtp) {
    console.log('[email] GMAIL_USER/GMAIL_APP_PASSWORD unset — skipping receipt');
    return false;
  }

  await smtp.transporter.sendMail({
    from: { name: owner.name, address: smtp.user },
    to,
    replyTo: owner.email,
    subject: 'Thanks for getting in touch',
    text: [
      'Hi,',
      '',
      'Thanks for reaching out. Your message came through, and I read every one myself.',
      '',
      "If there's anything you'd like to add, just reply to this email.",
      '',
      `— ${owner.name}`,
      owner.role,
      '',
      "You're receiving this because this address was entered in the contact form on my site. If that wasn't you, you can ignore it — nothing else will be sent.",
    ].join('\n'),
  });
  return true;
}

/**
 * Password-reset OTP for the single admin account. Same Gmail transporter
 * and no-op-if-unset guard as sendLeadNotification — see its comment.
 * The code itself is never logged; only the fact that a send was skipped.
 */
export async function sendPasswordResetOtp(to: string, code: string): Promise<void> {
  const smtp = getTransporter();
  if (!smtp) {
    console.log('[email] GMAIL_USER/GMAIL_APP_PASSWORD unset — skipping password reset send');
    return;
  }

  await smtp.transporter.sendMail({
    from: smtp.user,
    to,
    subject: 'Your password reset code',
    text: [
      `Your password reset code is: ${code}`,
      '',
      'This code expires in 10 minutes. If you did not request a password reset, you can ignore this email.',
    ].join('\n'),
  });
}

/**
 * Invitation link for a new admin user (PLAN.md W11). Same transporter
 * and no-op-if-unset guard as the two functions above — in local dev
 * without real Gmail credentials, the invite still gets created and the
 * link still works, it just has to be copied from the server log instead
 * of an inbox (logged here at info level, deliberately, since there's no
 * other way to complete the flow locally without real credentials).
 */
export async function sendInviteEmail(to: string, acceptUrl: string, role: string): Promise<void> {
  const smtp = getTransporter();
  if (!smtp) {
    console.log(
      `[email] GMAIL_USER/GMAIL_APP_PASSWORD unset — invite link for ${to}: ${acceptUrl}`,
    );
    return;
  }

  await smtp.transporter.sendMail({
    from: smtp.user,
    to,
    subject: "You've been invited to the admin dashboard",
    text: [
      `You've been invited to join as ${role}.`,
      '',
      `Accept the invite: ${acceptUrl}`,
      '',
      'This link expires in 7 days. If you weren’t expecting this, you can ignore it.',
    ].join('\n'),
  });
}
