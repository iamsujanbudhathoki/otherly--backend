import { autoInjectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import { LetterKind } from '../../constants/appConstant';
import messages from '../../constants/messages.constants';
import { LetterEntity } from '../../entities/letter/Letter.entity';
import { SearchQuery } from '../../interfaces/queryInterface';
import {
  CreateLetterSchema,
  UpdateLetterSchema,
} from '../../schemas/letter.schema';
import { AppError } from '../../utils/appError.util';
import { paginateResponse, skipTakeMaker } from '../../utils/pageAndLimit';

export interface LetterFilterQuery extends SearchQuery {
  kind?: LetterKind;
  publishedOnly?: boolean;
}

@autoInjectable()
export class LetterService {
  private letterRepo = AppDataSource.getRepository(LetterEntity);

  async create(data: CreateLetterSchema): Promise<LetterEntity> {
    const existing = await this.letterRepo.findOne({
      where: { slug: data.slug.trim() },
    });
    if (existing) {
      throw AppError.conflict(messages.letterAlreadyExists);
    }

    const letter = this.letterRepo.create({
      ...data,
      slug: data.slug.trim(),
      isPublished: data.isPublished ?? true,
    });
    return await this.letterRepo.save(letter);
  }

  async getAll(query: LetterFilterQuery) {
    const { skip, take } = skipTakeMaker(query);
    const qb = this.letterRepo
      .createQueryBuilder('letter')
      .orderBy('letter.number', 'ASC')
      .skip(skip)
      .take(take);

    if (query.publishedOnly !== false) {
      qb.andWhere('letter.isPublished = :isPublished', { isPublished: true });
    }

    if (query.kind) {
      qb.andWhere('letter.kind = :kind', { kind: query.kind });
    }

    if (query.search) {
      qb.andWhere(
        '(letter.title ILIKE :search OR letter.body ILIKE :search OR letter.author ILIKE :search)',
        { search: `%${query.search.trim()}%` },
      );
    }

    const result = await qb.getManyAndCount();
    return paginateResponse(result, query.limit, query.page);
  }

  async getBySlug(slug: string): Promise<LetterEntity> {
    const letter = await this.letterRepo.findOne({ where: { slug } });
    if (!letter) {
      throw AppError.notFound(messages.letterNotFound);
    }
    return letter;
  }

  async update(slug: string, data: UpdateLetterSchema): Promise<LetterEntity> {
    const letter = await this.getBySlug(slug);
    Object.assign(letter, data);
    return await this.letterRepo.save(letter);
  }

  async delete(slug: string): Promise<void> {
    const letter = await this.getBySlug(slug);
    await this.letterRepo.softRemove(letter);
  }
}
