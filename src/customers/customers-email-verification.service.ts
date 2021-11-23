import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { HashService } from 'src/hash/hash.service';
// import { Hash } from 'src/hash/hash.decorator';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { CustomersService } from './customers.service';
import { CommonService } from 'src/common/common.service';
import { EmailVerificationEmailVerifyValidation } from './validation/email-verification.email-verify.validation';
import { HttpService } from '@nestjs/axios';

// const defaultJsonHeader: Record<string, any> = {
//   'Content-Type': 'application/json',
// };

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(ProfileDocument)
    private readonly profileRepository: Repository<ProfileDocument>,
    private httpService: HttpService,
    private readonly customerService: CustomersService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    // @Hash()
    private readonly hashService: HashService,
    private readonly commonService: CommonService,
  ) {}

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

    if (findCustomer.email_verified_at) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: findCustomer.email_verified_at.toDateString(),
            property: 'email_verified_at',
            constraint: [
              this.messageService.get(
                'customers.email_verification.already_verified',
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
