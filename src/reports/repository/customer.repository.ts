import { BadRequestException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Brackets, EntityRepository, Repository } from 'typeorm';
import { ListReprotNewCustomerDTO } from '../dto/report.dto';

@EntityRepository(ProfileDocument)
export class CustomerRepositoryDocument extends Repository<ProfileDocument> {
  constructor(
    @InjectRepository(ProfileDocument)
    private readonly profileRepository: Repository<ProfileDocument>,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {
    super();
  }

  async repositoryCustomer(data: ListReprotNewCustomerDTO): Promise<{
    total_item: number;
    limit: number;
    current_page: number;
    items: any[];
  }> {
    const search = data.search || '';
    const currentPage = data.page || 1;
    const perPage = data.limit || 10;
    const indexPage = (Number(currentPage) - 1) * perPage;
    const dateStart = data.date_start || null;
    const dateEnd = data.date_end || null;

    let status;
    if (data.status == undefined) {
      status = [true, false];
    } else {
      switch (data.status.toLowerCase()) {
        case 'active':
          status = [true];
          break;
        case 'inactive':
          status = [false];
          break;
        default:
          status = [true, false];
      }
    }

    const queries = await this.profileRepository
      .createQueryBuilder('cp')
      .addSelect('cp.id')
      .leftJoinAndSelect(
        'cp.active_addresses',
        'address',
        'address.is_active = true',
      )
      .orderBy('cp.created_at', 'ASC');

    //** SEARCH BY DARE */
    if (dateStart && dateEnd) {
      queries.andWhere(
        new Brackets((qb) => {
          qb.where(
            new Brackets((iqb) => {
              iqb
                .where('cp.created_at >= :dateStart', {
                  dateStart,
                })
                .andWhere('cp.created_at <= :dateEnd', {
                  dateEnd,
                });
            }),
          );
        }),
      );
    }

    //** STATUS CUSTOMER */
    if (status && search) {
      queries.andWhere(
        `
        cp.is_active IN (:...status)
        ${search ? 'AND lower(cp.name) LIKE :name' : ''}
      `,
        {
          status: status,
          name: `%${search}%`,
        },
      );
    }

    const rawAll = await queries.getRawMany();
    const raw = rawAll.slice(indexPage, indexPage + perPage);
    const count = rawAll.length;

    raw.forEach((item) => {
      for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          const element = item[key];
          if (key.startsWith('di_')) {
            item[key.slice(3)] = element;
            delete item[key];
          }
        }
      }
    });

    //** EXECUTE QUERIES */
    try {
      return {
        total_item: count,
        limit: perPage,
        current_page: Number(currentPage),
        items: raw,
      };
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }
}
