import { Field, ObjectType } from 'type-graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { NotificationType } from '../../constants/appConstant';
import { CommonEntity } from '../common/common.entity';
import { User } from '../user/User.entity';

@ObjectType({
  description: 'In-app notification for users across marketplace events',
})
@Entity('notifications')
export class NotificationEntity extends CommonEntity {
  @Field()
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Field(() => NotificationType)
  @Index()
  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.GENERAL,
  })
  type: NotificationType;

  @Field()
  @Column({ length: 200 })
  title: string;

  @Field()
  @Column({ type: 'text' })
  message: string;

  @Field({ nullable: true })
  @Column({ name: 'entity_type', nullable: true, length: 50 })
  entityType?: string;

  @Field({ nullable: true })
  @Column({ name: 'entity_id', nullable: true, type: 'uuid' })
  entityId?: string;

  @Field()
  @Index()
  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Field({ nullable: true })
  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, unknown>;
}
