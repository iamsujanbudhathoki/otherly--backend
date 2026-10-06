import { injectable } from 'tsyringe';
import { Arg, Query, Resolver } from 'type-graphql';
import { Media } from '../../entities/media/media.entity';
import { MediaHelper } from '../../utils/media.util';

@injectable()
@Resolver(() => Media)
export class MediaResolver {
  @Query(() => Media, {
    nullable: true,
    description: 'Retrieve a centralized media asset record by unique ID',
  })
  async media(@Arg('id') id: string): Promise<Media | null> {
    const item = await MediaHelper.getMediaById(id);
    return item ?? null;
  }

  @Query(() => [Media], {
    description: 'Retrieve multiple centralized media assets by IDs',
  })
  async medias(@Arg('ids', () => [String]) ids: string[]): Promise<Media[]> {
    return await MediaHelper.getMediaByIds(ids);
  }
}
