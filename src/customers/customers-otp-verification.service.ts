import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { HashService } from 'src/hash/hash.service';
// import { Hash } from 'src/hash/hash.decorator';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { CustomersService } from './customers.service';
import { OtpCreateValidation } from './validation/otp.create.validation';
import { CommonService } from 'src/common/common.service';
import { randomUUID } from 'crypto';
import { NotificationService } from 'src/common/notification/notification.service';
import { HttpService } from '@nestjs/axios';

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
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    // @Hash()
    private readonly hashService: HashService,
    private readonly notificationService: NotificationService,
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
    if (cekEmail) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.email,
            property: 'email',
            constraint: [
              this.messageService.get('customers.profile.exist_email'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    const profile: ProfileDocument = await this.profileRepository.findOne({
      id: args.id,
    });

    if (!profile) {
      const errors = {
        value: args.token ? args.token.replace('Bearer ', '') : null,
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

    profile.email = args.email;
    profile.email_verified_at = null;
    profile.verification_token = randomUUID();

    const updatedProfile = await this.profileRepository.save(profile);

    const url = `${process.env.BASEURL_API}/verification/email?t=${profile.verification_token}`;
    await this.notificationService.sendEmail(
      updatedProfile.email,
      'Verifikasi email',
      '',
      `
    <p>Silahkan klik link berikut untuk memverifikasi email anda</p>
    <a href="${url}">${url}</a>
    `,
    );

    this.responseService.success(
      true,
      this.messageService.get('customers.change_email.success'),
    );

    return {
      status: true,
    };
  }

  async verifyNewEmailResend(args: Partial<OtpCreateValidation>): Promise<any> {
    const profile: ProfileDocument = await this.profileRepository.findOne({
      id: args.id,
    });

    if (!profile) {
      const errors = {
        value: args.token ? args.token.replace('Bearer ', '') : null,
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

    if (profile.email_verified_at) {
      const errors = {
        value: profile.email_verified_at.toDateString(),
        property: 'email_verified_at',
        constraint: [
          this.messageService.get(
            'customers.email_verification.already_verified',
          ),
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    profile.verification_token = randomUUID();

    const updatedProfile = await this.profileRepository.save(profile);

    const url = `${process.env.BASEURL_API}/verification/email?t=${profile.verification_token}`;
    await this.notificationService.sendEmail(
      updatedProfile.email,
      'Verifikasi email',
      '',
      `
    <p>Silahkan klik link berikut untuk memverifikasi email anda</p>
    <a href="${url}">${url}</a>
    `,
    );

    this.responseService.success(
      true,
      this.messageService.get('customers.change_email.success'),
    );

    return {
      status: true,
    };
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
