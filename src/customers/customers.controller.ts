import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpStatus,
  Logger,
  Post,
  Put,
} from '@nestjs/common';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CreateRandomNumber } from 'src/utils/general-utils';
import { OtpDocument } from '../database/entities/otp.entity';
import { CustomersService } from './customers.service';
import { RequestValidationPipe } from './validation/request-validation.pipe';
import { Response } from 'src/response/response.decorator';
import { RMessage } from 'src/response/response.interface';
import { OtpValidateValidation } from './validation/otp.validate.validation';
import { AuthJwtGuard } from 'src/hash/auth.decorators';
import { OtpCreateValidation } from './validation/otp.create.validation';
import { CustomerProfileValidation } from './validation/customers.profile.validation';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { ReqUpdataProfile } from './customers.interface';

@Controller('api/v1/customers')
export class CustomersController {
  constructor(
    private readonly customerService: CustomersService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Post('otp')
  async createotp(
    @Body(RequestValidationPipe(OtpCreateValidation))
    data: OtpCreateValidation,
  ): Promise<any> {
    const logger = new Logger();
    const otpcode: string = CreateRandomNumber(4);
    logger.log(
      'Create OTP for ' + data.phone + ' :' + otpcode,
      'CtrlCreateOTP ',
    );

    const existphone: OtpDocument =
      await this.customerService.findOneOtpByPhone(data.phone);

    if (existphone) {
      const errors: RMessage = {
        value: data.phone,
        property: 'phone',
        constraint: [this.messageService.get('customers.create.exist')],
      };

      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    } else {
      data.otp_code = otpcode;

      try {
        await this.customerService.createOtp(data);
        return { status: true };
      } catch (err: any) {
        logger.error(err, 'create try catch');
        const errors: RMessage = {
          value: data.phone,
          property: 'phone',
          constraint: [this.messageService.get('customers.create.invalid')],
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
  }

  @Post('otp-validation')
  async validateeotp(
    @Body(RequestValidationPipe(OtpValidateValidation))
    data: OtpValidateValidation,
  ): Promise<any> {
    const existphone: OtpDocument =
      await this.customerService.findOneOtpByPhone(data.phone);

    if (existphone) {
      if (existphone.otp_code !== data.otp_code) {
        const errors: RMessage = {
          value: data.otp_code,
          property: 'otp_code',
          constraint: [
            this.messageService.get('customers.validate.invalid_otp'),
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

      if (existphone.validated == true) {
        const errors: RMessage = {
          value: data.otp_code,
          property: 'otp_code',
          constraint: [this.messageService.get('customers.validate.validated')],
        };

        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      }

      try {
        existphone.validated = true;
        this.customerService.updateFullOtp(existphone);

        //Create Token
        const idotp: number = existphone.id_otp;
        const phone = data.phone;
        const accessToken: string =
          await this.customerService.createAccessToken({
            idotp,
            phone,
          });
        const rdata: Record<string, string> = { token: accessToken };

        return this.responseService.success(
          true,
          this.messageService.get('customers.validate.success'),
          rdata,
        );
      } catch (err: any) {
        const errors: RMessage = {
          value: data.otp_code,
          property: 'otp_code',
          constraint: [
            this.messageService.get('customers.validate.invalid_otp'),
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
    }
    const errors: RMessage = {
      value: data.phone,
      property: 'phone',
      constraint: [this.messageService.get('customers.create.invalid')],
    };

    throw new BadRequestException(
      this.responseService.error(HttpStatus.BAD_REQUEST, errors, 'Bad Request'),
    );
  }

  @Post('login')
  async login(
    @Body()
    data: Record<string, any>,
  ): Promise<any> {
    const logger = new Logger();
    let existcust: ProfileDocument;
    let data_value: string;
    let data_property: string;

    if (
      typeof data.email !== 'undefined' &&
      typeof data.phone == 'undefined' &&
      data.email !== ''
    ) {
      const err: string = await this.customerService.validateLoginEmail(data);
      logger.log('Validasi Login by Email: ' + err, 'troubleshoot');

      if (err) {
        const errors: RMessage = {
          value: '',
          property: 'request',
          constraint: [
            this.messageService.get('customers.login.invalid_email'),
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

      existcust = await this.customerService.findOneCustomerByEmail(data.email);
      data_value = data.email;
      data_property = 'email';
    } else if (
      typeof data.phone !== 'undefined' &&
      typeof data.email == 'undefined' &&
      data.phone !== ''
    ) {
      const err: string = await this.customerService.validateLoginPhone(data);
      logger.log('Validasi Login by Phone: ' + err, 'troubleshoot');

      if (err) {
        const errors: RMessage = {
          value: '',
          property: 'request',
          constraint: [
            this.messageService.get('customers.login.invalid_phone'),
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

      existcust = await this.customerService.findOneCustomerByPhone(data.phone);
      data_value = data.phone;
      data_property = 'phone';
    } else if (
      typeof data.email == 'undefined' &&
      typeof data.phone == 'undefined'
    ) {
      const errors: RMessage = {
        value: '',
        property: 'request',
        constraint: [this.messageService.get('customers.login.invalid')],
      };

      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    if (!existcust) {
      const errors: RMessage = {
        value: data_value,
        property: data_property,
        constraint: [
          this.messageService.get('customers.login.invalid_' + data_property),
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

    const validate: boolean = await this.customerService.validateCustomer(
      data.password,
      existcust.password,
    );

    if (!validate) {
      const errors: RMessage = {
        value: data.password,
        property: 'password',
        constraint: [
          this.messageService.get('customers.login.invalid_' + data_property),
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

    const { id_profile, phone, password, email, name, dob } = existcust;
    const accessToken: string = await this.customerService.createAccessToken({
      id_profile,
      phone,
      password,
      email,
      name,
      dob,
    });
    const rdata: Record<string, string> = { token: accessToken };
    return this.responseService.success(
      true,
      this.messageService.get('customers.login.success'),
      rdata,
    );
  }

  @AuthJwtGuard()
  @Put('profile')
  async profile(
    @Body(RequestValidationPipe(CustomerProfileValidation))
    data: CustomerProfileValidation,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    const logger = new Logger();
    token = token.replace('Bearer ', '');

    logger.log(token, 'UpdProfilToken');

    const payload: Record<string, any> =
      await this.customerService.validateAccessToken(token);
    const profile: ProfileDocument =
      await this.customerService.findOneCustomerByPhone(payload.phone);

    if (profile) {
      const errors: RMessage = {
        value: payload.phone,
        property: 'phone',
        constraint: [
          this.messageService.get('customers.profile.invalid_phone'),
        ],
      };

      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    } else {
      try {
        const profiledata: ReqUpdataProfile = {
          phone: payload.phone,
          name: data.name,
          email: data.email,
          password: data.password,
          dob: data.dob,
        };
        await this.customerService.createCustomerProfile(profiledata);
        return this.responseService.success(
          true,
          this.messageService.get('customers.profile.success'),
        );
      } catch (err: any) {
        const errors: RMessage = {
          value: '',
          property: 'request',
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
    }
  }
}
