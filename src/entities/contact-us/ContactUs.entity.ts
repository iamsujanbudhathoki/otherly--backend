import { Field, ObjectType } from 'type-graphql';
import { Column, Entity } from 'typeorm';
import { ContactStatus, ContactTopic } from '../../constants/appConstant';
import { CommonEntity } from '../common/common.entity';

@ObjectType({ description: 'Contact inquiry submitted by a visitor' })
@Entity({
  name: 'contact_us',
})
export class ContactUsEntity extends CommonEntity {
  @Field()
  @Column({ name: 'name', length: 100 })
  name: string;

  @Field()
  @Column({ name: 'email', length: 255 })
  email: string;

  @Field({ nullable: true })
  @Column({ name: 'company', length: 120, nullable: true })
  company?: string;

  @Field(() => ContactTopic)
  @Column({
    name: 'topic',
    type: 'enum',
    enum: ContactTopic,
    default: ContactTopic.PARTNERSHIP,
  })
  topic: ContactTopic;

  @Field()
  @Column({ name: 'message', type: 'text' })
  message: string;

  @Field(() => ContactStatus)
  @Column({
    name: 'status',
    type: 'enum',
    enum: ContactStatus,
    default: ContactStatus.NEW,
  })
  status: ContactStatus;
}
