import { Column, Entity } from 'typeorm';
import { EmailDeliveryStatus, MailType } from '../../constants/appConstant';
import { CommonEntity } from '../common/common.entity';

@Entity({
  name: 'email_logs',
})
export class EmailLogEntity extends CommonEntity {
  @Column({ name: 'recipient', length: 255 })
  recipient: string;

  @Column({ name: 'reply_to', length: 255, nullable: true })
  replyTo?: string;

  @Column({ name: 'subject', length: 500 })
  subject: string;

  @Column({
    name: 'mail_type',
    type: 'enum',
    enum: MailType,
  })
  mailType: MailType;

  @Column({ name: 'html_body', type: 'text' })
  htmlBody: string;

  @Column({ name: 'text_body', type: 'text' })
  textBody: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EmailDeliveryStatus,
    default: EmailDeliveryStatus.PENDING,
  })
  status: EmailDeliveryStatus;

  @Column({ name: 'message_id', length: 255, nullable: true })
  messageId?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt?: Date;
}
