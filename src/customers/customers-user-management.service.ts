import { HttpService } from '@nestjs/axios';
import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { NotificationService } from 'src/common/notification/notification.service';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { generateMessageChangeActiveEmail } from 'src/utils/general-utils';
import { Repository } from 'typeorm';
import { CustomerProfileValidation } from './validation/customers.profile.validation';
import { wordingNotifFormatForSms } from './wordings/wording-notif-format-for-sms';

// const defaultJsonHeader: Record<string, any> = {
//   'Content-Type': 'application/json',
// };

@Injectable()
export class CustomersUserManagementService {
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

    await this.notificationService.sendSms(
      checkPhone.phone,
      wordingNotifFormatForSms(checkPhone.name),
    );
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
}
