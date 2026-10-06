import { injectable } from 'tsyringe';
import {
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import { RequestStatus, Role } from '../../constants/appConstant';
import { Media } from '../../entities/media/media.entity';
import { RequestEntity } from '../../entities/request/Request.entity';
import { RequestService } from '../../services/request/request.service';
import { MediaHelper } from '../../utils/media.util';
import { GraphQLContext } from '../context';
import {
  CreateRequestInput,
  RequestFilterInput,
  UpdateRequestInput,
} from '../inputs/request.input';

@injectable()
@Resolver(() => RequestEntity)
export class RequestResolver {
  constructor(private readonly requestService: RequestService) {}

  @FieldResolver(() => [String], {
    nullable: true,
    description: 'Centralized public URLs of request attachments',
  })
  async attachmentUrls(@Root() request: RequestEntity): Promise<string[]> {
    if (request.attachmentMediaIds && request.attachmentMediaIds.length > 0) {
      return await MediaHelper.getMediaUrlsByIds(request.attachmentMediaIds);
    }
    return [];
  }

  @FieldResolver(() => [Media], {
    nullable: true,
    description: 'Centralized Media asset objects for request attachments',
  })
  async attachments(@Root() request: RequestEntity): Promise<Media[]> {
    if (request.attachmentMediaIds && request.attachmentMediaIds.length > 0) {
      return await MediaHelper.getMediaByIds(request.attachmentMediaIds);
    }
    return [];
  }

  @Query(() => [RequestEntity], {
    description:
      'Browse open customer project/product requests (for vendors and buyers)',
  })
  async requests(
    @Arg('filter', { nullable: true }) filter?: RequestFilterInput,
  ): Promise<RequestEntity[]> {
    return await this.requestService.getAll(filter || {});
  }

  @Query(() => RequestEntity, {
    nullable: true,
    description: 'Retrieve a customer request by ID',
  })
  async request(@Arg('id') id: string): Promise<RequestEntity | null> {
    try {
      return await this.requestService.getById(id);
    } catch {
      return null;
    }
  }

  @Authorized([Role.CUSTOMER])
  @Query(() => [RequestEntity], {
    description: 'Retrieve all requests posted by the authenticated customer',
  })
  async myCustomerRequests(
    @Ctx() { user }: GraphQLContext,
    @Arg('status', () => RequestStatus, { nullable: true })
    status?: RequestStatus,
  ): Promise<RequestEntity[]> {
    return await this.requestService.getCustomerRequests(user!.sub, status);
  }

  @Authorized([Role.CUSTOMER])
  @Mutation(() => RequestEntity, {
    description:
      'Post a new product/project request in the reverse marketplace (Customers only)',
  })
  async createRequest(
    @Ctx() { user }: GraphQLContext,
    @Arg('input') input: CreateRequestInput,
  ): Promise<RequestEntity> {
    return await this.requestService.create(user!.sub, input);
  }

  @Authorized([Role.CUSTOMER])
  @Mutation(() => RequestEntity, {
    description: 'Update an existing product request (Customers only)',
  })
  async updateRequest(
    @Ctx() { user }: GraphQLContext,
    @Arg('id') id: string,
    @Arg('input') input: UpdateRequestInput,
  ): Promise<RequestEntity> {
    return await this.requestService.update(user!.sub, id, input);
  }

  @Authorized([Role.CUSTOMER])
  @Mutation(() => RequestEntity, {
    description: 'Cancel an existing product request (Customers only)',
  })
  async cancelRequest(
    @Ctx() { user }: GraphQLContext,
    @Arg('id') id: string,
  ): Promise<RequestEntity> {
    return await this.requestService.cancel(user!.sub, id);
  }
}
