import {
  escapeHtml,
  renderBaseEmailLayout,
  RenderedEmailTemplate,
} from './base.template';

export interface PasswordResetEmailPayload {
  name: string;
  resetUrl: string;
}

export function buildPasswordResetEmailTemplate(
  payload: PasswordResetEmailPayload,
): RenderedEmailTemplate {
  const { name, resetUrl } = payload;
  const safeName = escapeHtml(name || 'there');

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Hello ${safeName},</p>
    <p style="margin: 0 0 16px 0;">
      We received a request to reset the password for your marketplace account. Click the button below to choose a new password:
    </p>
    <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b;">
      For security reasons, this password reset link will expire in 1 hour. If you did not make this request, you can safely ignore this email and your password will remain unchanged.
    </p>
  `;

  const html = renderBaseEmailLayout({
    preheader: 'Reset your marketplace account password.',
    eyebrow: 'Security Notice',
    title: 'Reset Your Password',
    subtitle: 'Instructions to securely choose a new password.',
    bodyHtml,
    ctaLabel: 'Reset Password',
    ctaUrl: resetUrl,
    footerNote:
      'If the button does not work, copy and paste this link into your browser: ' +
      resetUrl,
  });

  const text = `
Hello ${name},

We received a request to reset your password. Use the link below to set a new password:
${resetUrl}

This link will expire in 1 hour. If you did not request this, please ignore this email.
  `.trim();

  return {
    subject: 'Reset your password',
    html,
    text,
  };
}
