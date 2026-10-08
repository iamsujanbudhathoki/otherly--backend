import { injectable } from 'tsyringe';
import { Arg, Authorized, Int, Mutation, Query, Resolver } from 'type-graphql';
import { ContactStatus, Role } from '../../constants/appConstant';
import { ContactUsEntity } from '../../entities/contact-us/ContactUs.entity';
import { ContactService } from '../../services/contact/contact.service';
import {
  ContactFilterInput,
  CreateContactInput,
} from '../inputs/contact.input';
import { PaginatedContactsType } from '../types/contact.type';

@injectable()
@Resolver(() => ContactUsEntity)
export class ContactResolver {
  constructor(private readonly contactService: ContactService) {}

  @Mutation(() => ContactUsEntity, {
    description: 'Submit a new contact inquiry to Otherly support',
  })
  async submitContact(
    @Arg('input') input: CreateContactInput,
  ): Promise<ContactUsEntity> {
    return await this.contactService.create(input as any);
  }

  @Authorized([Role.ADMIN])
  @Query(() => PaginatedContactsType, {
    description: 'Retrieve paginated contact inquiries (Admin only)',
  })
  async contacts(
    @Arg('filter', { nullable: true }) filter?: ContactFilterInput,
    @Arg('page', () => Int, { nullable: true, defaultValue: 1 }) page?: number,
    @Arg('limit', () => Int, { nullable: true, defaultValue: 20 })
    limit?: number,
  ): Promise<PaginatedContactsType> {
    const result = await this.contactService.getAll({
      page,
      limit,
      topic: filter?.topic,
      status: filter?.status,
      search: filter?.search,
    });
    return result as unknown as PaginatedContactsType;
  }

  @Authorized([Role.ADMIN])
  @Query(() => ContactUsEntity, {
    nullable: true,
    description: 'Retrieve contact inquiry by ID (Admin only)',
  })
  async contact(@Arg('id') id: string): Promise<ContactUsEntity | null> {
    try {
      return await this.contactService.getById(id);
    } catch {
      return null;
    }
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => ContactUsEntity, {
    description: 'Update the status of a contact inquiry (Admin only)',
  })
  async updateContactStatus(
    @Arg('id') id: string,
    @Arg('status', () => ContactStatus) status: ContactStatus,
  ): Promise<ContactUsEntity> {
    return await this.contactService.updateStatus(id, { status });
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => Boolean, {
    description: 'Delete a contact inquiry (Admin only)',
  })
  async deleteContact(@Arg('id') id: string): Promise<boolean> {
    await this.contactService.delete(id);
    return true;
  }
}
