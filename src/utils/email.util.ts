import nodemailer, { Transporter } from 'nodemailer';
import { AppDataSource } from '../config/database.config';
import { DotenvConfig } from '../config/env.config';
import { logger } from '../config/logger.config';
import { EmailDeliveryStatus, MailType } from '../constants/appConstant';
import { EmailLogEntity } from '../entities/email/EmailLog.entity';
import { PaginatedInput } from '../interfaces/queryInterface';
import {
  buildContactAdminNotificationTemplate,
  buildContactUserAcknowledgementTemplate,
  buildPasswordResetEmailTemplate,
  buildVerificationEmailTemplate,
  ContactEmailTemplatePayload,
  PasswordResetEmailPayload,
  RenderedEmailTemplate,
  VerificationEmailPayload,
} from '../templates/email';
import { AppError } from './appError.util';
import { paginateResponse, skipTakeMaker } from './pageAndLimit';

export { MailType };

export interface EmailLogFilterQuery extends PaginatedInput {
  status?: EmailDeliveryStatus;
  mailType?: MailType;
}

interface DispatchEmailOptions {
  to: string;
  replyTo?: string;
  mailType: MailType;
  template: RenderedEmailTemplate;
  metadata?: Record<string, any>;
}

class EmailUtil {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      pool: true,
      host: DotenvConfig.MAIL_HOST,
      port: DotenvConfig.MAIL_PORT,
      secure: DotenvConfig.MAIL_PORT === 465,
      auth: {
        user: DotenvConfig.MAIL_USER,
        pass: DotenvConfig.MAIL_PASSWORD,
      },
    });
  }

  private isConfigured(): boolean {
    return Boolean(
      DotenvConfig.MAIL_HOST &&
      DotenvConfig.MAIL_USER &&
      DotenvConfig.MAIL_PASSWORD,
    );
  }

  /**
   * Persists the rendered email to `email_logs` and dispatches via SMTP if configured.
   */
  private async dispatchAndPersist(
    options: DispatchEmailOptions,
  ): Promise<EmailLogEntity | null> {
    const { to, replyTo, mailType, template, metadata } = options;
    let emailLog: EmailLogEntity | null = null;

    if (AppDataSource.isInitialized) {
      try {
        const repo = AppDataSource.getRepository(EmailLogEntity);
        emailLog = repo.create({
          recipient: to,
          replyTo,
          subject: template.subject,
          mailType,
          htmlBody: template.html,
          textBody: template.text,
          status: this.isConfigured()
            ? EmailDeliveryStatus.PENDING
            : EmailDeliveryStatus.SKIPPED,
          metadata,
        });
        emailLog = await repo.save(emailLog);
      } catch (dbErr: any) {
        logger.error(`Failed to persist email log: ${dbErr?.message}`);
      }
    }

    if (!this.isConfigured()) {
      logger.info(
        `Email persisted with status SKIPPED (${mailType} -> ${to}): SMTP credentials not configured`,
      );
      return emailLog;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Stradmont Solutions" <${DotenvConfig.MAIL_FROM}>`,
        to,
        replyTo: replyTo || DotenvConfig.MAIL_FROM,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      if (emailLog && AppDataSource.isInitialized) {
        const repo = AppDataSource.getRepository(EmailLogEntity);
        emailLog.status = EmailDeliveryStatus.SENT;
        emailLog.messageId = info.messageId;
        emailLog.sentAt = new Date();
        await repo.save(emailLog);
      }

      logger.info(`Email sent successfully (${mailType} -> ${to})`);
      return emailLog;
    } catch (error: any) {
      logger.error(
        `Failed to send email (${mailType} -> ${to}): ${error?.message}`,
      );

      if (emailLog && AppDataSource.isInitialized) {
        try {
          const repo = AppDataSource.getRepository(EmailLogEntity);
          emailLog.status = EmailDeliveryStatus.FAILED;
          emailLog.errorMessage = error?.message || 'Unknown SMTP error';
          await repo.save(emailLog);
        } catch (saveErr: any) {
          logger.error(
            `Failed to update email log failure status: ${saveErr?.message}`,
          );
        }
      }
      return emailLog;
    }
  }

  /**
   * Sends both the internal admin alert and the sender acknowledgement email for a contact enquiry.
   */
  async sendContactEmails(payload: ContactEmailTemplatePayload): Promise<void> {
    const adminTemplate = buildContactAdminNotificationTemplate(payload);
    const acknowledgementTemplate =
      buildContactUserAcknowledgementTemplate(payload);

    await Promise.allSettled([
      this.dispatchAndPersist({
        to: DotenvConfig.ADMIN_NOTIFICATION_EMAIL,
        replyTo: payload.email,
        mailType: MailType.CONTACT_ADMIN_NOTIFICATION,
        template: adminTemplate,
        metadata: {
          contactId: payload.id,
          topic: payload.topic,
          senderEmail: payload.email,
        },
      }),
      this.dispatchAndPersist({
        to: payload.email,
        replyTo: DotenvConfig.ADMIN_NOTIFICATION_EMAIL,
        mailType: MailType.CONTACT_USER_ACKNOWLEDGEMENT,
        template: acknowledgementTemplate,
        metadata: {
          contactId: payload.id,
          topic: payload.topic,
        },
      }),
    ]);
  }

  async sendVerificationEmail(
    to: string,
    payload: VerificationEmailPayload,
  ): Promise<void> {
    const template = buildVerificationEmailTemplate(payload);
    await this.dispatchAndPersist({
      to,
      mailType: MailType.EMAIL_VERIFICATION,
      template,
      metadata: {
        recipientEmail: to,
      },
    });
  }

  async sendPasswordResetEmail(
    to: string,
    payload: PasswordResetEmailPayload,
  ): Promise<void> {
    const template = buildPasswordResetEmailTemplate(payload);
    await this.dispatchAndPersist({
      to,
      mailType: MailType.PASSWORD_RESET,
      template,
      metadata: {
        recipientEmail: to,
      },
    });
  }

  async getEmailLogs(query: EmailLogFilterQuery) {
    const repo = AppDataSource.getRepository(EmailLogEntity);
    const { skip, take } = skipTakeMaker(query);
    const qb = repo
      .createQueryBuilder('email_log')
      .orderBy('email_log.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (query.status) {
      qb.andWhere('email_log.status = :status', { status: query.status });
    }
    if (query.mailType) {
      qb.andWhere('email_log.mailType = :mailType', {
        mailType: query.mailType,
      });
    }

    const result = await qb.getManyAndCount();
    return paginateResponse(result, query.limit, query.page);
  }

  async retryEmailById(id: string): Promise<EmailLogEntity> {
    const repo = AppDataSource.getRepository(EmailLogEntity);
    const emailLog = await repo.findOne({ where: { id } });
    if (!emailLog) {
      throw AppError.notFound('Email log record not found');
    }

    if (!this.isConfigured()) {
      throw AppError.badRequest(
        'SMTP credentials are not configured in environment variables',
      );
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Stradmont Solutions" <${DotenvConfig.MAIL_FROM}>`,
        to: emailLog.recipient,
        replyTo: emailLog.replyTo || DotenvConfig.MAIL_FROM,
        subject: emailLog.subject,
        text: emailLog.textBody,
        html: emailLog.htmlBody,
      });

      emailLog.status = EmailDeliveryStatus.SENT;
      emailLog.messageId = info.messageId;
      emailLog.errorMessage = undefined;
      emailLog.sentAt = new Date();
      return await repo.save(emailLog);
    } catch (error: any) {
      emailLog.status = EmailDeliveryStatus.FAILED;
      emailLog.errorMessage = error?.message || 'Unknown SMTP error';
      await repo.save(emailLog);
      throw AppError.internalServerError(
        `Failed to resend email: ${emailLog.errorMessage}`,
      );
    }
  }
}

export default new EmailUtil();
