import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { NotificationService } from 'src/common/notification/notification.service';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { MessageService } from 'src/message/message.service';
import { ListResponse, RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { generateMessageChangeActiveEmail } from 'src/utils/general-utils';
import { Brackets, Repository } from 'typeorm';
import { generateSmsChangeActiveNoHp } from './../utils/general-utils';
import {
  CustomerListProfileValidation,
  CustomerProfileValidation,
} from './validation/customers.profile.validation';

// const defaultJsonHeader: Record<string, any> = {
//   'Content-Type': 'application/json',
// };

@Injectable()
export class CustomersUserManagementService {
  private readonly logger = new Logger(CustomersUserManagementService.name);

  constructor(
    @InjectRepository(ProfileDocument)
    private readonly profileRepository: Repository<ProfileDocument>,
    private httpService: HttpService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly commonService: CommonService,
    private readonly notificationService: NotificationService,
  ) {}

  async updateCustomerPhone(args: CustomerProfileValidation): Promise<any> {
    if (!args.phone || !args.id) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: !args.phone ? args.phone : args.id,
            property: !args.phone ? 'phone' : 'customer_id',
            constraint: [this.messageService.get('customers.error.invalid')],
          },
          'Bad Request',
        ),
      );
    }

    const checkPhone = await this.profileRepository.findOne({
      phone: args.phone,
    });

    if (checkPhone) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.phone,
            property: 'phone',
            constraint: [
              this.messageService.get(
                'customers.customer_management.phone_exist',
              ),
            ],
          },
          'Bad Request',
        ),
      );
    }

    const findCustomer = await this.profileRepository
      .findOne({
        relations: ['addresses'],
        where: {
          id: args.id,
        },
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.id,
              property: 'customer_id',
              constraint: [
                this.messageService.get('customers.error.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });

    if (!findCustomer) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.id,
            property: 'customer_id',
            constraint: [this.messageService.get('customers.error.not_found')],
          },
          'Bad Request',
        ),
      );
    }

    findCustomer.phone = args.phone;
    await this.profileRepository.save(findCustomer);

    const smsMessage = generateSmsChangeActiveNoHp(findCustomer.name);

    await this.notificationService.sendSms(args.phone, smsMessage);
    const response: Record<string, any> = this.responseService.success(
      true,
      this.messageService.get('customers.customer_management.phone_success'),
      findCustomer,
    );
    if (response.statusCode) {
      throw response;
    }
    return response;
  }

  async updateCustomerEmail(
    args: Partial<CustomerProfileValidation>,
  ): Promise<any> {
    if (!args.email || !args.id) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: !args.email ? args.email : args.id,
            property: !args.email ? 'email' : 'customer_id',
            constraint: [this.messageService.get('customers.error.invalid')],
          },
          'Bad Request',
        ),
      );
    }

    const checkEmail = await this.profileRepository.findOne({
      email: args.email,
    });

    if (checkEmail) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.email,
            property: 'email',
            constraint: [
              this.messageService.get(
                'customers.customer_management.email_exist',
              ),
            ],
          },
          'Bad Request',
        ),
      );
    }

    const findCustomer = await this.profileRepository
      .findOne({
        relations: ['addresses'],
        where: {
          id: args.id,
        },
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.id,
              property: 'customer_id',
              constraint: [
                this.messageService.get('customers.error.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });

    if (!findCustomer) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.id,
            property: 'customer_id',
            constraint: [this.messageService.get('customers.error.not_found')],
          },
          'Bad Request',
        ),
      );
    }

    findCustomer.email = args.email;
    await this.profileRepository.save(findCustomer);
    const messageChangeActiveEmail = await generateMessageChangeActiveEmail(
      findCustomer.name,
    );

    await this.notificationService.sendEmail(
      args.email,
      'Notifikasi Update Email',
      '',
      messageChangeActiveEmail,
    );

    const response: Record<string, any> = this.responseService.success(
      true,
      this.messageService.get('customers.customer_management.email_success'),
      findCustomer,
    );
    if (response.statusCode) {
      throw response;
    }
    return response;
  }

  async listCustomerWithRangeDate(
    data: Partial<CustomerListProfileValidation>,
  ): Promise<ListResponse> {
    const currentPage = data.page || 1;
    const perPage = data.limit || 10;
    const dateStart = data.date_start || null;
    const dateEnd = data.date_end || null;

    if ((dateStart && !dateEnd) || (dateEnd && !dateStart)) {
      this.errorGenerator('', 'date', 'profile.error.dateFilterMissing');
    }

    try {
      const query = this.profileRepository.createQueryBuilder('profile');
      if (dateStart && dateEnd) {
        query.where(
          new Brackets((qb) => {
            qb.where(
              new Brackets((iqb) => {
                iqb
                  .where('profile.phone_verified_at >= :dateStart', {
                    dateStart,
                  })
                  .andWhere('profile.phone_verified_at <= :dateEnd', {
                    dateEnd,
                  });
              }),
            );
          }),
        );
      }
      query.skip((currentPage - 1) * perPage).take(perPage);
      const result = await query.getManyAndCount();
      const response: ListResponse = {
        total_item: result[1],
        limit: perPage,
        current_page: currentPage,
        items: result[0].map((profileCustomer) => {
          const profile: Partial<ProfileDocument> = {
            name: profileCustomer.name,
            phone: profileCustomer.phone,
            phone_verified_at: profileCustomer.phone_verified_at,
          };
          return profile;
        }),
      };
      return response;
    } catch (error) {
      this.errorReport(error, 'profile.error.list_failed');
    }
  }

  private errorReport(error: any, message: string) {
    this.logger.error(error);
    if (error.message == 'Bad Request Exception') {
      throw error;
    } else {
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [this.messageService.get(message), error.message],
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

  private errorGenerator(
    value: string,
    property: string,
    constraint: string | any[],
  ) {
    if (typeof constraint == 'string') {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value,
            property,
            constraint: [this.messageService.get(constraint)],
          },
          'Bad Request',
        ),
      );
    } else {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value,
            property,
            constraint: constraint,
          },
          'Bad Request',
        ),
      );
    }
  }
}
