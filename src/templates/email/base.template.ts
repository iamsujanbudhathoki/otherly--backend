export interface BaseEmailLayoutOptions {
  preheader: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}

export interface RenderedEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function escapeHtml(unsafe: string | undefined | null): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderBaseEmailLayout(options: BaseEmailLayoutOptions): string {
  const {
    preheader,
    eyebrow,
    title,
    subtitle,
    bodyHtml,
    ctaLabel,
    ctaUrl,
    footerNote,
  } = options;

  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(title)} — Stradmont Solutions</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f8f7fc; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e1b4b; -webkit-font-smoothing: antialiased;">
    <!-- Hidden preheader text -->
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; font-size: 1px; line-height: 1px; color: #f8f7fc;">
      ${escapeHtml(preheader)}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f7fc; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
            <!-- Brand Header -->
            <tr>
              <td style="padding: 0 8px 24px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" style="vertical-align: middle;">
                      <a href="https://stradmontsolutions.com" target="_blank" style="text-decoration: none; color: #1e1b4b; font-size: 16px; font-weight: 800; letter-spacing: -0.02em;">
                        STRADMONT <span style="color: #7c3aed; font-weight: 600;">SOLUTIONS</span>
                      </a>
                    </td>
                    <td align="right" style="vertical-align: middle; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">
                      Systems over chaos
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Main Card -->
            <tr>
              <td style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(30, 27, 75, 0.04);">
                <!-- Top Electric Violet Bar -->
                <div style="height: 5px; width: 100%; background: linear-gradient(90deg, #7c3aed 0%, #4f46e5 100%);"></div>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 36px 32px;">
                  <tr>
                    <td>
                      <!-- Eyebrow Pill -->
                      <div style="display: inline-block; background-color: #f3e8ff; color: #7c3aed; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 5px 12px; border-radius: 999px; margin-bottom: 16px;">
                        ${escapeHtml(eyebrow)}
                      </div>

                      <!-- Title -->
                      <h1 style="margin: 0 0 10px 0; font-size: 24px; line-height: 1.3; font-weight: 800; color: #1e1b4b; letter-spacing: -0.02em;">
                        ${escapeHtml(title)}
                      </h1>

                      ${
                        subtitle
                          ? `<p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                              ${escapeHtml(subtitle)}
                            </p>`
                          : ''
                      }

                      <!-- Body Content -->
                      <div style="font-size: 14px; line-height: 1.65; color: #334155;">
                        ${bodyHtml}
                      </div>

                      ${
                        ctaLabel && ctaUrl
                          ? `<!-- CTA Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 28px;">
                              <tr>
                                <td align="center" style="border-radius: 999px; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);">
                                  <a href="${escapeHtml(ctaUrl)}" target="_blank" style="display: inline-block; padding: 13px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 999px;">
                                    ${escapeHtml(ctaLabel)} &rarr;
                                  </a>
                                </td>
                              </tr>
                            </table>`
                          : ''
                      }

                      ${
                        footerNote
                          ? `<p style="margin: 28px 0 0 0; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; line-height: 1.6; color: #64748b;">
                              ${escapeHtml(footerNote)}
                            </p>`
                          : ''
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 28px 16px 8px 16px; font-size: 12px; line-height: 1.6; color: #64748b;">
                <p style="margin: 0 0 6px 0; font-weight: 600; color: #1e1b4b;">
                  Stradmont Solutions
                </p>
                <p style="margin: 0 0 12px 0;">
                  We find the chaos in technology and finance operations, and build the systems that end it.
                </p>
                <p style="margin: 0 0 12px 0;">
                  <a href="https://stradmontsolutions.com" style="color: #7c3aed; text-decoration: none; font-weight: 600;">stradmontsolutions.com</a>
                  &nbsp;&middot;&nbsp;
                  <a href="mailto:info@stradmontsolutions.com" style="color: #64748b; text-decoration: none;">info@stradmontsolutions.com</a>
                  &nbsp;&middot;&nbsp;
                  <span style="color: #64748b;">+1 (226) 975-1978</span>
                </p>
                <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                  &copy; ${currentYear} Stradmont Solutions. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
