import { HttpService } from '@nestjs/axios';
import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isDefined } from 'class-validator';
import { CommonService } from 'src/common/common.service';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { HashService } from 'src/hash/hash.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { CustomersService } from './customers.service';
import { OtpCreateValidation } from './validation/otp.create.validation';
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
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    // @Hash()
    private readonly hashService: HashService,
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
    if (cekPhone.email == null) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: null,
            property: 'email',
            constraint: [
              this.messageService.get('customers.general.emailNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    args.user_type = 'phone-problem';
    args.name = cekPhone.name;
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-phone-problem';
    const response: Record<string, any> = await this.commonService
      .postHttp(url, args, defaultJsonHeader)
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.phone,
              property: 'phone',
              constraint: [
                this.messageService.get('customers.general.failToProcess'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (response.statusCode) {
      throw response;
    } else if (response == null) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.phone,
            property: 'phone',
            constraint: [
              this.messageService.get('customers.general.failToProcess'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    let email = '';
    const frontEmail = cekPhone.email.split('@')[0];
    const lenFrontEmail = frontEmail.length;

    if (lenFrontEmail <= 3) {
      email = cekPhone.email;
    } else {
      const maskEmail = frontEmail.substring(3).replace(/./g, '*');
      email = `${frontEmail.substring(0, 3)}${maskEmail}@${
        cekPhone.email.split('@')[1]
      }`;
    }
    response.email = email;
    return response;
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
    args.user_type = 'phone-problem';
    args.id = cekPhone.id;

    const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/otp-phone-problem-validation`;
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
    if (cekPhone && cekPhone.is_active) {
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
      .findOne({ id: req.id })
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
    const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/otp-phone-problem-phonenew`;
    const reqOtp = {
      phone: getPhone.phone,
      phone_new: args.phone,
    };
    const respOtp: Record<string, any> = await this.commonService.postHttp(
      url,
      reqOtp,
      // defaultJsonHeader,
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
    } else if (respOtp.statusCode) {
      throw respOtp;
    }
    // getPhone.phone = args.phone;
    return this.profileRepository
      .save(getPhone)
      .then(() => {
        return respOtp;
      })
      .catch((err) => {
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
  }

  async validateNewPhone(args: Partial<OtpPhoneValidateValidation>, req: any) {
    //Get Existing Customer
    const getPhone = await this.profileRepository
      .findOne({ id: req.id })
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

    if (isDefined(cekPhone)) {
      if (cekPhone.is_active) {
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
    }
    args.id = getPhone.id;
    const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/otp-phone-problem-phonenew-validation`;
    const reqOtp = {
      phone: getPhone.phone,
      phone_new: args.phone,
      otp_code: args.otp_code,
      id: getPhone.id,
    };

    const response: Record<string, any> = await this.commonService
      .postHttp(url, reqOtp)
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.phone,
              property: 'phone',
              constraint: [
                this.messageService.get('customers.general.failToProcess'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (response.statusCode) {
      throw response;
    }

    getPhone.phone_verified_at = new Date();
    getPhone.phone = args.phone;
    await this.profileRepository.save(getPhone);

    return response;
  }
}
