import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import { NotificationType } from '../../constants/appConstant';
import { NotificationEntity } from '../../entities/notification/Notification.entity';
import { AppError } from '../../utils/appError.util';
import { paginateResponse, skipTakeMaker } from '../../utils/pageAndLimit';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  data?: Record<string, unknown>;
}

export interface NotificationQueryDto {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

@injectable()
export class NotificationService {
  private notificationRepo = AppDataSource.getRepository(NotificationEntity);

  async create(data: CreateNotificationDto): Promise<NotificationEntity> {
    const notification = this.notificationRepo.create({
      userId: data.userId,
      type: data.type,
      title: data.title.trim(),
      message: data.message.trim(),
      entityType: data.entityType,
      entityId: data.entityId,
      data: data.data,
      isRead: false,
    });

    return await this.notificationRepo.save(notification);
  }

  async getUserNotifications(userId: string, query: NotificationQueryDto = {}) {
    const { skip, take } = skipTakeMaker(query);
    const qb = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (query.unreadOnly) {
      qb.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    const result = await qb.getManyAndCount();
    return paginateResponse(result, query.limit, query.page);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepo.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw AppError.notFound('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepo.save(notification);
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<{ affected: number }> {
    const result = await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { affected: result.affected ?? 0 };
  }

  async delete(userId: string, notificationId: string): Promise<void> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw AppError.notFound('Notification not found');
    }

    await this.notificationRepo.softRemove(notification);
  }
}
