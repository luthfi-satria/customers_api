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
import { OtpPhoneValidateValidation } from './validation/otp.phone-validate.validation';

const defaultJsonHeader: Record<string, any> = {
  'Content-Type': 'application/json',
};

@Injectable()
export class PhoneConstraintService {
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

  async cekExistingPhone(args: Partial<OtpCreateValidation>): Promise<any> {
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
    if (!cekPhone) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.phone,
            property: 'phone',
            constraint: [this.messageService.get('customers.error.not_found')],
          },
          'Bad Request',
        ),
      );
    }
    args.user_type = 'customer';

    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-forget-password';
    return await this.commonService.postHttp(url, args, defaultJsonHeader);
  }

  async validateExistingPhone(
    args: Partial<OtpPhoneValidateValidation>,
  ): Promise<any> {
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
    if (!cekPhone) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.phone,
            property: 'phone',
            constraint: [this.messageService.get('customers.error.not_found')],
          },
          'Bad Request',
        ),
      );
    }
    args.user_type = 'customer';
    args.id = cekPhone.id_profile;

    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-validation';
    return await this.commonService.postHttp(url, args, defaultJsonHeader);
  }

  async updateNewPhone(
    args: Partial<OtpCreateValidation>,
    req: any,
  ): Promise<any> {
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
    if (cekPhone) {
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
    //Get Existing Customer
    const getPhone = await this.profileRepository
      .findOne({ id_profile: req.id })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: req.id,
              property: 'id',
              constraint: [
                this.messageService.get('customers.error.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (!getPhone) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: req.id,
            property: 'id',
            constraint: [this.messageService.get('customers.error.not_found')],
          },
          'Bad Request',
        ),
      );
    }

    //update hp
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-update-phone';
    const reqOtp = {
      phone: getPhone.phone,
      phone_new: args.phone,
    };
    const respOtp = await this.commonService.postHttp(
      url,
      reqOtp,
      defaultJsonHeader,
    );
    if (respOtp == null) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.phone,
            property: 'phone',
            constraint: [this.messageService.get('customers.profile.fail')],
          },
          'Bad Request',
        ),
      );
    }
    getPhone.phone = args.phone;
    return await this.profileRepository
      .save(getPhone)
      .then(() => {
        return respOtp;
      })
      .catch((err) => {
        console.error('catch error: ', err);
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: err.column,
              constraint: [err.message],
            },
            'Bad Request',
          ),
        );
      });
    // }
  }

  async validateNewPhone(args: Partial<OtpPhoneValidateValidation>) {
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
    if (!cekPhone) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.phone,
            property: 'phone',
            constraint: [this.messageService.get('customers.error.not_found')],
          },
          'Bad Request',
        ),
      );
    }
    args.user_type = 'customer';
    args.id = cekPhone.id_profile;
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-validation';
    args.user_type = 'customer';
    args.roles = ['customer'];

    return await this.commonService.postHttp(url, args);
  }
}
