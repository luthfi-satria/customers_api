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

const defaultJsonHeader: Record<string, any> = {
  'Content-Type': 'application/json',
};

@Injectable()
export class OtpVerificationService {
  constructor(
    @InjectRepository(ProfileDocument)
    private readonly profileRepository: Repository<ProfileDocument>,
    private httpService: HttpService,
    private readonly customerService: CustomersService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    @Hash() private readonly hashService: HashService,
    private readonly commonService: CommonService,
  ) {}

  async verifyNewPhone(args: Partial<OtpCreateValidation>): Promise<any> {
    const cekPhone = await this.profileRepository
      .findOne({
        phone: args.phone,
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.phone,
              property: 'phone',
              constraint: [
                this.messageService.get('customers.error.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (cekPhone && cekPhone.id != args.id) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.phone,
            property: 'phone',
            constraint: [this.messageService.get('customers.create.exist')],
          },
          'Bad Request',
        ),
      );
    }
    args.user_type = 'customer-verify-phone';
    const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/otp-phone`;
    const response: Record<string, any> = await this.commonService.postHttp(
      url,
      args,
      defaultJsonHeader,
    );
    if (response.statusCode) {
      throw response;
    }
    return response;
  }

  async validationNewPhone(args: Partial<OtpCreateValidation>): Promise<any> {
    const cekPhone = await this.profileRepository
      .findOne({
        phone: args.phone,
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.phone,
              property: 'phone',
              constraint: [
                this.messageService.get('customers.error.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (cekPhone && cekPhone.id != args.id) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.phone,
            property: 'phone',
            constraint: [this.messageService.get('customers.create.exist')],
          },
          'Bad Request',
        ),
      );
    }
    args.user_type = 'customer-verify-phone';

    const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/otp-phone-validation`;
    const response: Record<string, any> = await this.commonService.postHttp(
      url,
      args,
      defaultJsonHeader,
    );
    if (response.statusCode) {
      throw response;
    }
    if (response.success) {
      return { status: true };
    }
    return response;
  }

  async verifyNewEmail(args: Partial<OtpCreateValidation>): Promise<any> {
    const cekEmail = await this.profileRepository
      .findOne({
        email: args.email,
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.email,
              property: 'email',
              constraint: [
                this.messageService.get('customers.error.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (cekEmail && cekEmail.id != args.id) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.email,
            property: 'email',
            constraint: [this.messageService.get('customers.create.exist')],
          },
          'Bad Request',
        ),
      );
    }
    args.user_type = 'customer-verify-email';
    const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/otp-email`;
    const response: Record<string, any> = await this.commonService.postHttp(
      url,
      args,
      defaultJsonHeader,
    );
    if (response.statusCode) {
      throw response;
    }
    return response;
  }

  async validationNewEmail(args: Partial<OtpCreateValidation>): Promise<any> {
    const cekEmail = await this.profileRepository
      .findOne({
        email: args.email,
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.email,
              property: 'email',
              constraint: [
                this.messageService.get('customers.error.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (cekEmail && cekEmail.id != args.id) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.email,
            property: 'email',
            constraint: [this.messageService.get('customers.create.exist')],
          },
          'Bad Request',
        ),
      );
    }
    args.user_type = 'customer-verify-email';

    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-email-validation';
    const response: Record<string, any> = await this.commonService.postHttp(
      url,
      args,
      defaultJsonHeader,
    );
    if (response.statusCode) {
      throw response;
    }
    if (response.success) {
      return { status: true };
    }
    return response;
  }
}
