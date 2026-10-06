import {
  escapeHtml,
  renderBaseEmailLayout,
  RenderedEmailTemplate,
} from './base.template';

export interface VerificationEmailPayload {
  name: string;
  verificationUrl: string;
  verificationCode?: string;
}

export function buildVerificationEmailTemplate(
  payload: VerificationEmailPayload,
): RenderedEmailTemplate {
  const { name, verificationUrl, verificationCode } = payload;
  const safeName = escapeHtml(name || 'there');

  const codeHtml = verificationCode
    ? `<div style="margin: 24px 0; padding: 16px; background-color: #f3e8ff; border: 1px dashed #7c3aed; border-radius: 12px; text-align: center;">
        <span style="font-size: 13px; color: #6b21a8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">Your Verification Code</span>
        <span style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #581c87;">${escapeHtml(verificationCode)}</span>
      </div>`
    : '';

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Hello ${safeName},</p>
    <p style="margin: 0 0 16px 0;">
      Thank you for joining our reverse-commerce marketplace. Please verify your email address to activate your account and start posting requests or submitting offers.
    </p>
    ${codeHtml}
    <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b;">
      This verification link will remain active for 24 hours. If you did not create an account, you can safely ignore this email.
    </p>
  `;

  const html = renderBaseEmailLayout({
    preheader:
      'Verify your email address to activate your marketplace account.',
    eyebrow: 'Account Verification',
    title: 'Verify Your Email Address',
    subtitle: 'One click away from accessing the reverse commerce marketplace.',
    bodyHtml,
    ctaLabel: 'Verify Email Address',
    ctaUrl: verificationUrl,
    footerNote:
      'If the button does not work, copy and paste this link into your browser: ' +
      verificationUrl,
  });

  const text = `
Hello ${name},

Thank you for joining our reverse-commerce marketplace. Please verify your email address by opening the following link in your browser:
${verificationUrl}

${verificationCode ? `Verification Code: ${verificationCode}\n` : ''}
This link will expire in 24 hours. If you did not request this, please ignore this email.
  `.trim();

  return {
    subject: 'Verify your email address',
    html,
    text,
  };
}
