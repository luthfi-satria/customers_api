import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { CustomersService } from './customers.service';
import { OtpCreateValidation } from './validation/otp.create.validation';
import { CommonService } from 'src/common/common.service';
import { EmailVerificationEmailVerifyValidation } from './validation/email-verification.email-verify.validation';
import { CustomerProfileValidation } from './validation/customers.profile.validation';
import { NotificationService } from 'src/common/notification/notification.service';

const defaultJsonHeader: Record<string, any> = {
  'Content-Type': 'application/json',
};

@Injectable()
export class CustomersUserManagementService {
  constructor(
    @InjectRepository(ProfileDocument)
    private readonly profileRepository: Repository<ProfileDocument>,
    private httpService: HttpService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    private readonly commonService: CommonService,
    private readonly notificationService: NotificationService,
  ) {}

  async updateCustomerPhone(args: CustomerProfileValidation): Promise<any> {
    console.log('#2');

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
    console.log('#3');

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
      args.phone,
      'Nomor ini dapat digunakai untuk login',
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

    await this.notificationService.sendEmail(
      args.email,
      'Notifikasi Update Email',
      'Email ini dapat digunakai untuk login',
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
