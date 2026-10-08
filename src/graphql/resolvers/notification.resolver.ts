import { injectable } from 'tsyringe';
import {
  Arg,
  Authorized,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
} from 'type-graphql';
import { NotificationEntity } from '../../entities/notification/Notification.entity';
import { NotificationService } from '../../services/notification/notification.service';
import { GraphQLContext } from '../context';

@injectable()
@Resolver(() => NotificationEntity)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @Authorized()
  @Query(() => [NotificationEntity], {
    description: 'Retrieve user in-app notifications',
  })
  async myNotifications(
    @Ctx() { user }: GraphQLContext,
    @Arg('unreadOnly', () => Boolean, { nullable: true }) unreadOnly?: boolean,
    @Arg('page', () => Int, { nullable: true }) page?: number,
    @Arg('limit', () => Int, { nullable: true }) limit?: number,
  ): Promise<NotificationEntity[]> {
    const res = await this.notificationService.getUserNotifications(user!.sub, {
      unreadOnly,
      page,
      limit,
    });
    return res.data;
  }

  @Authorized()
  @Query(() => Int, {
    description: 'Get unread notification count for the authenticated user',
  })
  async unreadNotificationCount(
    @Ctx() { user }: GraphQLContext,
  ): Promise<number> {
    return await this.notificationService.getUnreadCount(user!.sub);
  }

  @Authorized()
  @Mutation(() => NotificationEntity, {
    description: 'Mark a specific notification as read',
  })
  async markNotificationAsRead(
    @Ctx() { user }: GraphQLContext,
    @Arg('id') id: string,
  ): Promise<NotificationEntity> {
    return await this.notificationService.markAsRead(user!.sub, id);
  }

  @Authorized()
  @Mutation(() => Boolean, {
    description: 'Mark all notifications as read for current user',
  })
  async markAllNotificationsAsRead(
    @Ctx() { user }: GraphQLContext,
  ): Promise<boolean> {
    await this.notificationService.markAllAsRead(user!.sub);
    return true;
  }

  @Authorized()
  @Mutation(() => Boolean, {
    description: 'Delete a notification',
  })
  async deleteNotification(
    @Ctx() { user }: GraphQLContext,
    @Arg('id') id: string,
  ): Promise<boolean> {
    await this.notificationService.delete(user!.sub, id);
    return true;
  }
}
