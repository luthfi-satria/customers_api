import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { compare, genSalt, hash } from 'bcrypt';
import { randomUUID } from 'crypto';
// import { Hash } from 'src/hash/hash.decorator';
import moment from 'moment';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NotificationService } from 'src/common/notification/notification.service';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { HashService } from 'src/hash/hash.service';
import { MessageService } from 'src/message/message.service';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { generateMessageUrlVerification } from 'src/utils/general-utils';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import { ListResponse } from '../response/response.interface';
import { AdminCustomerProfileValidation } from './validation/admin.customers.profile.validation';
import { CustomerChangeEmailValidation } from './validation/customers.change-email.validation';
import { QueryFilterDto } from './validation/customers.profile.validation';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(ProfileDocument)
    private readonly profileRepository: Repository<ProfileDocument>,
    private httpService: HttpService,
    // @Hash()
    private readonly hashService: HashService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly notificationService: NotificationService,
    private readonly storage: CommonStorageService,
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
    if (profile.photo) {
      const fileName =
        profile.photo.split('/')[profile.photo.split('/').length - 1];
      profile.photo =
        process.env.BASEURL_API +
        '/api/v1/customers/' +
        profile.id +
        '/image/' +
        fileName;
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
    if (profile.photo) {
      const fileName =
        profile.photo.split('/')[profile.photo.split('/').length - 1];
      profile.photo =
        process.env.BASEURL_API +
        '/api/v1/customers/' +
        profile.id +
        '/image/' +
        fileName;
    }
    return profile;
  }

  async getBulkCustomers(ids: string[]): Promise<any> {
    try {
      return await this.profileRepository.findByIds(ids);
    } catch (error) {
      console.error(error);
      throw error;
    }
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
    const create_profile: Partial<ProfileDocument> = {
      phone: data.phone,
      name: data.name,
      email: data.email,
    };
    if (data.dob) {
      create_profile.dob = moment(data.dob, 'DD/MM/YYYY', true).toDate();
    }
    if (data.gender) {
      create_profile.gender = data.gender;
    }
    if (flg_update) {
      create_profile.id = data.id;
      if (data.phone_verified_at)
        create_profile.phone_verified_at = data.phone_verified_at;
    }
    if (data.email) {
      create_profile.verification_token = randomUUID();
    }
    for (const key in create_profile) {
      if (!create_profile[key]) {
        delete create_profile[key];
      }
    }

    await this.profileRepository.update(create_profile.id, create_profile);

    return this.profileRepository.findOne(create_profile.id);
  }

  async createCustomerProfileOTP(
    data: Record<string, any>,
  ): Promise<ProfileDocument> {
    const create_profile: Partial<ProfileDocument> = {
      phone: data.phone,
      name: data.name,
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
        .orWhere(
          `
          profile.is_active IN (:...status)
          ${search ? 'AND lower(profile.phone) LIKE :phone' : ''}
        `,
          {
            status: status,
            phone: `%${search}%`,
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
    const updatedProfile = await this.profileRepository.save(data);
    if (updatedProfile && updatedProfile.photo) {
      const fileName =
        updatedProfile.photo.split('/')[
          updatedProfile.photo.split('/').length - 1
        ];
      updatedProfile.photo =
        process.env.BASEURL_API +
        '/api/v1/customers/' +
        updatedProfile.id +
        '/image/' +
        fileName;
    }

    return updatedProfile;
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
        constraint: [this.messageService.get('customers.profile.exist_email')],
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

      if (updated_profile.photo) {
        const fileName =
          updated_profile.photo.split('/')[
            updated_profile.photo.split('/').length - 1
          ];
        updated_profile.photo =
          process.env.BASEURL_API +
          '/api/v1/customers/' +
          updated_profile.id +
          '/image/' +
          fileName;
      }

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

  async sendVerificationEmail(user: ProfileDocument) {
    const url = `${process.env.BASEURL_ZEUS}/verification/email?t=${user.verification_token}`;
    const messageUrlVerifivation = await generateMessageUrlVerification(
      user.name,
      url,
    );

    this.notificationService.sendEmail(
      user.email,
      'Verifikasi email',
      '',
      messageUrlVerifivation,
    );
  }

  async changeEmail(
    body: CustomerChangeEmailValidation,
    user: any,
    token: string,
  ): Promise<any> {
    const profile: ProfileDocument = await this.profileRepository.findOne({
      id: user.id,
    });

    if (!profile) {
      const errors = {
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

    const existProfile: ProfileDocument = await this.profileRepository.findOne({
      email: body.email,
    });

    if (existProfile) {
      const errors = {
        value: body.email,
        property: 'email',
        constraint: [this.messageService.get('customers.profile.exist_email')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    profile.email = body.email;
    profile.email_verified_at = null;
    profile.verification_token = randomUUID();

    const updatedProfile = await this.profileRepository.save(profile);

    const url = `${process.env.BASEURL_ZEUS}/verification/email?t=${profile.verification_token}`;
    const messageUrlVerifivation = await generateMessageUrlVerification(
      profile.name,
      url,
    );
    await this.notificationService.sendEmail(
      updatedProfile.email,
      'Verifikasi email',
      '',
      messageUrlVerifivation,
    );

    this.responseService.success(
      true,
      this.messageService.get('customers.change_email.success'),
    );

    return {
      status: true,
    };
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

  async getExt(data) {
    let ext = null;
    let type = null;
    const resultCustomer = await this.profileRepository
      .findOne(data.id)
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: data.id,
              property: 'customer_id',
              constraint: [
                this.messageService.get('general.general.dataNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      });

    if (resultCustomer) {
      ext =
        resultCustomer.photo.split('.')[
          resultCustomer.photo.split('.').length - 1
        ];
      if (ext == 'png' || ext == 'jpg' || ext == 'jpeg' || ext == 'gif') {
        type = 'image';
      }
    }

    return { ext, type };
  }

  async getBufferS3(data: any) {
    let url = null;

    try {
      const customer = await this.profileRepository.findOne({
        id: data.id,
      });
      url = customer.photo;

      if (!customer) {
        const errors: RMessage = {
          value: data.id,
          property: 'id',
          constraint: [this.messageService.get('general.general.dataNotFound')],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      }
    } catch (error) {
      Logger.log(error);
    }
    const bufferurl = await this.storage.getBuff(url);

    return bufferurl;
  }

  async getReadableStream(buffer: Buffer) {
    const stream = new Readable();

    // stream._read = () => {};;;
    stream.push(buffer);
    stream.push(null);

    return stream;
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
