import {
  escapeHtml,
  renderBaseEmailLayout,
  RenderedEmailTemplate,
} from './base.template';

export interface ContactEmailTemplatePayload {
  id?: string;
  name: string;
  email: string;
  company?: string;
  topic: string;
  message: string;
  submittedAt?: Date;
}

export function buildContactAdminNotificationTemplate(
  payload: ContactEmailTemplatePayload,
): RenderedEmailTemplate {
  const timestamp = (payload.submittedAt || new Date()).toUTCString();
  const referenceId = payload.id ? payload.id.slice(0, 8).toUpperCase() : 'NEW';
  const subject = `[${payload.topic}] New Enquiry from ${payload.name} (#${referenceId})`;

  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 14px; padding: 18px 20px; margin-bottom: 22px;">
      <tr>
        <td style="padding-bottom: 10px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b21a8;">Sender Details</span>
        </td>
      </tr>
      <tr>
        <td style="font-size: 13px; line-height: 1.75; color: #1e1b4b;">
          <div><strong>Reference ID:</strong> <code style="background: #f3e8ff; padding: 2px 6px; border-radius: 4px; font-size: 12px;">#${escapeHtml(referenceId)}</code></div>
          <div><strong>Name:</strong> ${escapeHtml(payload.name)}</div>
          <div><strong>Email:</strong> <a href="mailto:${escapeHtml(payload.email)}" style="color: #7c3aed; text-decoration: none; font-weight: 600;">${escapeHtml(payload.email)}</a></div>
          ${payload.company ? `<div><strong>Company:</strong> ${escapeHtml(payload.company)}</div>` : ''}
          <div><strong>Topic:</strong> ${escapeHtml(payload.topic)}</div>
          <div><strong>Received:</strong> ${escapeHtml(timestamp)}</div>
        </td>
      </tr>
    </table>

    <div style="margin-bottom: 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #475569;">
      Enquiry Message
    </div>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; font-size: 14px; line-height: 1.7; color: #1e293b; white-space: pre-wrap;">${escapeHtml(payload.message)}</div>
  `;

  const replySubject = encodeURIComponent(
    `Re: [${payload.topic}] Your enquiry with Stradmont Solutions`,
  );

  const html = renderBaseEmailLayout({
    preheader: `New ${payload.topic} enquiry from ${payload.name} (${payload.email})`,
    eyebrow: `Contact Enquiry · ${payload.topic}`,
    title: `New enquiry from ${payload.name}`,
    subtitle:
      'A new contact enquiry has been submitted on stradmontsolutions.com and persisted to the database.',
    bodyHtml,
    ctaLabel: `Reply to ${payload.name}`,
    ctaUrl: `mailto:${payload.email}?subject=${replySubject}`,
    footerNote:
      'You can reply directly to this email to respond to the sender.',
  });

  const text = [
    `STRADMONT SOLUTIONS — NEW CONTACT ENQUIRY (#${referenceId})`,
    `------------------------------------------------------------`,
    `Topic:    ${payload.topic}`,
    `Name:     ${payload.name}`,
    `Email:    ${payload.email}`,
    payload.company ? `Company:  ${payload.company}` : null,
    `Received: ${timestamp}`,
    ``,
    `Message:`,
    payload.message,
  ]
    .filter((line) => line !== null)
    .join('\n');

  return { subject, html, text };
}
