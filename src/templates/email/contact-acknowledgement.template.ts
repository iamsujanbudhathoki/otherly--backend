import {
  escapeHtml,
  renderBaseEmailLayout,
  RenderedEmailTemplate,
} from './base.template';
import { ContactEmailTemplatePayload } from './contact-admin.template';

export function buildContactUserAcknowledgementTemplate(
  payload: ContactEmailTemplatePayload,
): RenderedEmailTemplate {
  const referenceId = payload.id ? payload.id.slice(0, 8).toUpperCase() : 'NEW';
  const subject = `We received your enquiry — Stradmont Solutions (#${referenceId})`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">
      Hello <strong>${escapeHtml(payload.name)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0;">
      Thank you for reaching out to <strong>Stradmont Solutions</strong> regarding <strong>${escapeHtml(payload.topic)}</strong>. Every enquiry is read by a person on our team, and we will respond to you shortly.
    </p>

    <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b21a8; margin-bottom: 8px;">
        Summary of Your Enquiry (#${escapeHtml(referenceId)})
      </div>
      <div style="font-size: 13px; color: #475569; margin-bottom: 10px;">
        <strong>Topic:</strong> ${escapeHtml(payload.topic)}
        ${payload.company ? `&nbsp;&middot;&nbsp;<strong>Organization:</strong> ${escapeHtml(payload.company)}` : ''}
      </div>
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; font-size: 13px; line-height: 1.65; color: #334155; white-space: pre-wrap;">${escapeHtml(payload.message)}</div>
    </div>

    <p style="margin: 0;">
      If you have additional context or documents to share in the meantime, simply reply directly to this email.
    </p>
  `;

  const html = renderBaseEmailLayout({
    preheader: `Thank you for contacting Stradmont Solutions. Reference #${referenceId}.`,
    eyebrow: 'Enquiry Received',
    title: `Thank you, ${payload.name}.`,
    subtitle: 'Your message is with the Stradmont team.',
    bodyHtml,
    ctaLabel: 'Read Stradmont Letters',
    ctaUrl: 'https://stradmontsolutions.com/letters',
    footerNote: `Reference ID: #${referenceId} · Sent to ${payload.email}`,
  });

  const text = [
    `Hello ${payload.name},`,
    ``,
    `Thank you for reaching out to Stradmont Solutions regarding "${payload.topic}".`,
    `Every enquiry is read by a person on our team, and we will get back to you shortly.`,
    ``,
    `Reference ID: #${referenceId}`,
    `Topic: ${payload.topic}`,
    payload.company ? `Organization: ${payload.company}` : null,
    ``,
    `Your Message:`,
    payload.message,
    ``,
    `—`,
    `Stradmont Solutions | Systems over chaos`,
    `https://stradmontsolutions.com`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  return { subject, html, text };
}
