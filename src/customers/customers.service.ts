import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { catchError, map } from 'rxjs/operators';
import { compare, genSalt, hash } from 'bcrypt';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import * as moment from 'moment';
import { AdminCustomerProfileValidation } from './validation/admin.customers.profile.validation';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { Response } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.decorator';
import { QueryFilterDto } from './validation/customers.profile.validation';
import { ListResponse } from '../response/response.interface';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(ProfileDocument)
    private readonly profileRepository: Repository<ProfileDocument>,
    private httpService: HttpService,
    @Hash() private readonly hashService: HashService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  async findOne(id: string) {
    let profile = null;
    try {
      profile = await this.profileRepository.findOne({
        relations: ['addresses'],
        where: {
          id,
        },
      });
    } catch (error) {
      Logger.error(error);
      const errors: RMessage = {
        value: id,
        property: 'user_id',
        constraint: [this.messageService.get('customers.select.fail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    if (!profile) {
      const errors: RMessage = {
        value: id,
        property: 'user_id',
        constraint: [this.messageService.get('customers.error.not_found')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    return profile;
  }

  async findOneWithActiveAddresses(id: string) {
    const profile = await this.profileRepository
      .createQueryBuilder('customers_profile')
      .leftJoinAndSelect(
        'customers_profile.active_addresses',
        'address',
        'address.is_active = true',
      )
      .where('customers_profile.id = :id', { id })
      .getOne();
    return profile;
  }

  findOneCustomerByPhone(id: string): Promise<ProfileDocument> {
    return this.profileRepository.findOne({ where: { phone: id } });
  }

  findOneCustomerByEmail(email: string): Promise<ProfileDocument> {
    return this.profileRepository.findOne({ where: { email } });
  }

  async findOneCustomerByEmailExceptId(
    email: string,
    id: string,
  ): Promise<ProfileDocument> {
    try {
      const profile = await this.profileRepository
        .createQueryBuilder()
        .where('email = :email', { email: email })
        .andWhere('id != :id', { id: id })
        .getOne();
      return profile;
    } catch (error: any) {
      return null;
    }
  }

  findOneCustomerById(id: string): Promise<ProfileDocument> {
    return this.profileRepository.findOne({ where: { id: id } });
  }

  async createCustomerProfile(
    data: Record<string, any>,
    flg_update: boolean,
  ): Promise<ProfileDocument> {
    // const salt: string = await this.hashService.randomSalt();
    // const passwordHash = await this.hashService.hashPassword(
    //   data.password,
    //   salt,
    // );
    const create_profile: Partial<ProfileDocument> = {
      phone: data.phone,
      name: data.name,
      email: data.email,
      // gender: data.gender,
      // password: passwordHash,
    };
    if (data.dob) {
      create_profile.dob = moment(data.dob, 'DD/MM/YYYY', true).toDate();
    }
    if (data.gender) {
      create_profile.gender = data.gender;
    }
    if (flg_update) {
      create_profile.id = data.id;
    }
    return this.profileRepository.save(create_profile);
  }

  async createCustomerProfileOTP(
    data: Record<string, any>,
  ): Promise<ProfileDocument> {
    const create_profile: Partial<ProfileDocument> = {
      phone: data.phone,
    };
    return this.profileRepository.save(create_profile);
  }

  async queryCustomerProfile(filter: QueryFilterDto): Promise<ListResponse> {
    try {
      const search = filter.search ? filter.search.toLowerCase() : '';
      const curPage = filter.page || 1;
      const perPage = filter.limit || 10;
      let skip = (curPage - 1) * perPage;
      skip = skip < 0 ? 0 : skip; //prevent negative on skip()

      let status;
      if (filter.status == undefined) {
        status = [true, false];
      } else {
        switch (filter.status.toLowerCase()) {
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

      const [rows, totalCount] = await this.profileRepository
        .createQueryBuilder('profile')
        .select([
          'profile.id',
          'profile.name',
          'profile.phone',
          'profile.email',
          'profile.email_verified_at',
          'profile.is_active',
        ])
        .where(
          `
          profile.is_active IN (:...status)
          ${search ? 'AND lower(profile.name) LIKE :name' : ''}
        `,
          {
            status: status,
            name: `%${search}%`,
          },
        )
        .skip(skip)
        .take(perPage)
        .getManyAndCount()
        .catch((e) => {
          throw e;
        });

      const listItems: ListResponse = {
        current_page: curPage,
        total_item: totalCount,
        limit: perPage,
        items: rows,
      };

      return listItems;
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'Query Customer List');
      throw e;
    }
  }

  async updateCustomerProfile(
    data: Record<string, any>,
  ): Promise<ProfileDocument> {
    return this.profileRepository.save(data);
  }

  async updateCustomerProfileById(
    id: string,
    data: Partial<ProfileDocument>,
  ): Promise<ProfileDocument> {
    const update = await this.profileRepository.update(id, data);
    if (!update) {
      return null;
    }
    return await this.profileRepository.findOne(id);
  }

  async updateCustomerManageProfile(
    token: string,
    id_profile: string,
    body: AdminCustomerProfileValidation,
  ): Promise<RSuccessMessage> {
    const cekemail: ProfileDocument = await this.findOneCustomerByEmailExceptId(
      body.email,
      id_profile,
    );
    if (cekemail) {
      const errors: RMessage = {
        value: body.email,
        property: 'email',
        constraint: [this.messageService.get('customers.profile.existemail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    const profile: ProfileDocument = await this.findOneCustomerById(id_profile);
    if (!profile) {
      const errors: RMessage = {
        value: token.replace('Bearer ', ''),
        property: 'token',
        constraint: [this.messageService.get('customers.profile.invalid')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    if (typeof body.name != 'undefined' && body.name != '' && body.name != null)
      profile.name = body.name;
    if (
      typeof body.email != 'undefined' &&
      body.email != '' &&
      body.email != null
    )
      profile.email = body.email;
    if (body.dob) {
      profile.dob = moment(body.dob, 'DD/MM/YYYY', true).toDate();
    }
    if (body.gender) {
      profile.gender = body.gender;
    }

    if (body.is_active == true) {
      profile.is_active = true;
    } else {
      profile.is_active = false;
    }
    try {
      const updated_profile: Record<string, any> =
        await this.profileRepository.save(profile);
      if (updated_profile.dob)
        updated_profile.dob = moment(updated_profile.dob).format('DD/MM/YYYY');

      return this.responseService.success(
        true,
        this.messageService.get('customers.profile.success'),
        updated_profile,
      );
    } catch (err: any) {
      const errors: RMessage = {
        value: '',
        property: err.column,
        constraint: [err.message], // [this.messageService.get('customers.profile.invalid')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
  }

  //--------------------------------------------------------------

  // bcrypt
  async hashPassword(passwordString: string, salt: string): Promise<string> {
    return hash(passwordString, salt);
  }

  async randomSalt(): Promise<string> {
    // Env Variable
    const defaultPasswordSaltLength = Number(
      process.env.HASH_PASSWORDSALTLENGTH,
    );

    return genSalt(defaultPasswordSaltLength);
  }

  async bcryptComparePassword(
    passwordString: string,
    passwordHashed: string,
  ): Promise<boolean> {
    return compare(passwordString, passwordHashed);
  }

  async postHttp(
    url: string,
    body: Record<string, any>,
    headers: Record<string, any>,
  ): Promise<Observable<AxiosResponse<any>>> {
    return this.httpService.post(url, body, { headers: headers }).pipe(
      map((response) => response.data),
      catchError((err) => {
        throw err;
      }),
    );
  }

  async putHttp(
    url: string,
    body: Record<string, any>,
    headers: Record<string, any>,
  ): Promise<Observable<AxiosResponse<any>>> {
    return this.httpService.put(url, body, { headers: headers }).pipe(
      map((response) => response.data),
      catchError((err) => {
        throw err;
      }),
    );
  }
}
