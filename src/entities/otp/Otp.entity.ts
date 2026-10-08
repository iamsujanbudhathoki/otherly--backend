import { Column, Entity, Index } from 'typeorm';
import { CommonEntity } from '../common/common.entity';

@Entity('otp_verifications')
export class OtpVerification extends CommonEntity {
  @Index()
  @Column({ length: 30 })
  phoneNumber: string;

  @Column({ length: 10 })
  otp: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp' })
  cooldownUntil: Date;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ type: 'int', default: 0 })
  attempts: number;
}
