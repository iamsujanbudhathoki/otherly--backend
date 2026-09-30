import { Column, Entity } from 'typeorm';
import { ContactStatus, ContactTopic } from '../../constants/appConstant';
import { CommonEntity } from '../common/common.entity';

@Entity({
  name: 'contact_us',
})
export class ContactUsEntity extends CommonEntity {
  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'email', length: 255 })
  email: string;

  @Column({ name: 'company', length: 120, nullable: true })
  company?: string;

  @Column({
    name: 'topic',
    type: 'enum',
    enum: ContactTopic,
    default: ContactTopic.PARTNERSHIP,
  })
  topic: ContactTopic;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ContactStatus,
    default: ContactStatus.NEW,
  })
  status: ContactStatus;
}
