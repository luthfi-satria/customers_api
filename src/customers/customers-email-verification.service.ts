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

const defaultJsonHeader: Record<string, any> = {
  'Content-Type': 'application/json',
};

@Injectable()
export class EmailVerificationService {
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

  //   async verifyNewEmail(args: Partial<OtpCreateValidation>): Promise<any> {
  //     const cekEmail = await this.profileRepository
  //       .findOne({
  //         email: args.email,
  //       })
  //       .catch(() => {
  //         throw new BadRequestException(
  //           this.responseService.error(
  //             HttpStatus.BAD_REQUEST,
  //             {
  //               value: args.email,
  //               property: 'email',
  //               constraint: [
  //                 this.messageService.get('customers.error.not_found'),
  //               ],
  //             },
  //             'Bad Request',
  //           ),
  //         );
  //       });
  //     if (cekEmail && cekEmail.id != args.id) {
  //       throw new BadRequestException(
  //         this.responseService.error(
  //           HttpStatus.BAD_REQUEST,
  //           {
  //             value: args.email,
  //             property: 'email',
  //             constraint: [this.messageService.get('customers.create.exist')],
  //           },
  //           'Bad Request',
  //         ),
  //       );
  //     }
  //     args.user_type = 'customer-verify-email';
  //     const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/otp-email`;
  //     const response: Record<string, any> = await this.commonService.postHttp(
  //       url,
  //       args,
  //       defaultJsonHeader,
  //     );
  //     if (response.statusCode) {
  //       throw response;
  //     }
  //     return response;
  //   }

  async verifyNewEmail(
    args: Partial<EmailVerificationEmailVerifyValidation>,
  ): Promise<any> {
    const findCustomer = await this.profileRepository
      .findOne({
        verification_token: args.token,
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.token,
              property: 'token',
              constraint: [
                this.messageService.get(
                  'customers.email_verification.invalid_token',
                ),
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
            value: args.token,
            property: 'token',
            constraint: [
              this.messageService.get(
                'customers.email_verification.invalid_token',
              ),
            ],
          },
          'Bad Request',
        ),
      );
    }

    findCustomer.email_verified_at = new Date();
    await this.profileRepository.save(findCustomer);

    const response: Record<string, any> = this.responseService.success(
      true,
      this.messageService.get('customers.email_verification.success'),
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
