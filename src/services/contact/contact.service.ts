import { autoInjectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import { ContactStatus, ContactTopic } from '../../constants/appConstant';
import messages from '../../constants/messages.constants';
import { ContactUsEntity } from '../../entities/contact-us/ContactUs.entity';
import { SearchQuery } from '../../interfaces/queryInterface';
import {
  CreateContactSchema,
  UpdateContactStatusSchema,
} from '../../schemas/contact.schema';
import { AppError } from '../../utils/appError.util';
import emailUtil from '../../utils/email.util';
import { paginateResponse, skipTakeMaker } from '../../utils/pageAndLimit';
import { TurnstileUtil } from '../../utils/turnstile.util';

export interface ContactFilterQuery extends SearchQuery {
  topic?: ContactTopic;
  status?: ContactStatus;
}

@autoInjectable()
export class ContactService {
  private contactRepo = AppDataSource.getRepository(ContactUsEntity);

  async create(
    data: CreateContactSchema,
    remoteIp?: string,
  ): Promise<ContactUsEntity> {
    await TurnstileUtil.verifyToken(data.turnstileToken, remoteIp);

    const contact = this.contactRepo.create({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      company: data.company?.trim() || undefined,
      topic: data.topic,
      message: data.message.trim(),
      status: ContactStatus.NEW,
    });

    const saved = await this.contactRepo.save(contact);

    // Dispatch and persist both Admin Notification & User Acknowledgement emails asynchronously
    emailUtil
      .sendContactEmails({
        id: saved.id,
        name: saved.name,
        email: saved.email,
        company: saved.company,
        topic: saved.topic,
        message: saved.message,
        submittedAt: saved.createdAt,
      })
      .catch(() => {});

    return saved;
  }

  async getAll(query: ContactFilterQuery) {
    const { skip, take } = skipTakeMaker(query);
    const qb = this.contactRepo
      .createQueryBuilder('contact')
      .orderBy('contact.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (query.topic) {
      qb.andWhere('contact.topic = :topic', { topic: query.topic });
    }

    if (query.status) {
      qb.andWhere('contact.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere(
        '(contact.name ILIKE :search OR contact.email ILIKE :search OR contact.company ILIKE :search OR contact.message ILIKE :search)',
        { search: `%${query.search.trim()}%` },
      );
    }

    const result = await qb.getManyAndCount();
    return paginateResponse(result, query.limit, query.page);
  }

  async getById(id: string): Promise<ContactUsEntity> {
    const contact = await this.contactRepo.findOne({ where: { id } });
    if (!contact) {
      throw AppError.notFound(messages.contactNotFound);
    }
    return contact;
  }

  async updateStatus(
    id: string,
    body: UpdateContactStatusSchema,
  ): Promise<ContactUsEntity> {
    const contact = await this.getById(id);
    contact.status = body.status;
    return await this.contactRepo.save(contact);
  }

  async delete(id: string): Promise<void> {
    const contact = await this.getById(id);
    await this.contactRepo.softRemove(contact);
  }
}
