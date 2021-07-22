import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpService,
  HttpStatus,
  Logger,
  Post,
  Put,
} from '@nestjs/common';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CustomersService } from './customers.service';
import { RequestValidationPipe } from './validation/request-validation.pipe';
import { Response } from 'src/response/response.decorator';
import { RMessage } from 'src/response/response.interface';
import { OtpCreateValidation } from './validation/otp.create.validation';
import { catchError, map } from 'rxjs/operators';
import { OtpValidateValidation } from './validation/otp.validate.validation';
import { CustomerProfileValidation } from './validation/customers.profile.validation';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { ReqUpdataProfile } from './customers.interface';
import { CustomerResetPasswordValidation } from './validation/customers.resetpass.validation';
import { CustomerLoginEmailValidation } from './validation/customers.loginemail.validation';
import { CustomerLoginPhoneValidation } from './validation/customers.loginphone.validation';

@Controller('api/v1/customers')
export class CustomersController {
  constructor(
    private readonly customerService: CustomersService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    private httpService: HttpService,
  ) {}

  @Post('otp')
  async createotp(
    @Body(RequestValidationPipe(OtpCreateValidation))
    data: OtpCreateValidation,
  ): Promise<any> {
    const logger = new Logger();
    const url: string = process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp';
    const messageHandler: Record<string, any> = {
      property: 'otp_code',
      map: 'customers.create.fail',
    };
    const headersRequest = {
      'Content-Type': 'application/json',
    };
    data.user_type = 'customer';
    return (
      await this.customerService.postHttp(
        url,
        data,
        messageHandler,
        headersRequest,
      )
    ).pipe(
      map(async (response) => response),
      catchError((err) => {
        logger.debug(err, 'catch error');
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
      }),
    );
  }

  @Post('otp-validation')
  async validateeotp(
    @Body(RequestValidationPipe(OtpValidateValidation))
    data: OtpValidateValidation,
  ): Promise<any> {
    const logger = new Logger();
    //Create Document
    const create_profile = await this.customerService.createCustomerProfileOTP(
      data,
    );
    if (!create_profile) {
      const errors: RMessage = {
        value: '',
        property: 'otp_code',
        constraint: [this.messageService.get('customers.validate.fail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    data.id_profile = create_profile.id_profile;
    data.user_type = 'customer';
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-validation';
    const headersRequest = {
      'Content-Type': 'application/json',
    };
    const messageHandler: Record<string, any> = {
      property: 'otp_code',
      map: 'customers.validate.fail',
    };
    data.user_type = 'customer';
    return (
      await this.customerService.postHttp(
        url,
        data,
        messageHandler,
        headersRequest,
      )
    ).pipe(
      map(async (response) => response),
      catchError((erro) => {
        logger.log(erro, 'catch error');
        const errors: RMessage = {
          value: '',
          property: 'otp_code',
          constraint: [this.messageService.get('customers.validate.fail')],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      }),
    );
  }

  @Put('profile')
  async profile(
    @Body(RequestValidationPipe(CustomerProfileValidation))
    data: CustomerProfileValidation,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/profile';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };
    const messageHandler: Record<string, any> = {
      property: 'token',
      map: 'customers.profile.fail',
    };
    data.user_type = 'customer';
    return (
      await this.customerService.putHttp(
        url,
        data,
        messageHandler,
        headersRequest,
      )
    ).pipe(
      map(async (response) => {
        let flg_update = false;
        const cekemail: ProfileDocument =
          await this.customerService.findOneCustomerByEmail(data.email);
        // const logger = new Logger();
        if (cekemail) {
          if (cekemail.phone == response.data.payload.phone) {
            flg_update = true;
          } else {
            const errors: RMessage = {
              value: data.email,
              property: 'email',
              constraint: [
                this.messageService.get('customers.profile.existemail'),
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
        const profile: ProfileDocument =
          await this.customerService.findOneCustomerByPhone(
            response.data.payload.phone,
          );
        if (profile) {
          flg_update = true;
        }
        try {
          const profiledata: ReqUpdataProfile = {
            phone: response.data.payload.phone,
            name: data.name,
            email: data.email,
            password: data.password,
            dob: data.dob,
          };
          if (flg_update) {
            profiledata.id_profile = profile.id_profile;
          }
          await this.customerService.createCustomerProfile(
            profiledata,
            flg_update,
          );
          delete response.data.payload;
          return this.responseService.success(
            true,
            this.messageService.get('customers.profile.success'),
            response.data,
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
      }),
    );
  }

  @Post('login/email')
  async loginByEmail(
    @Body(RequestValidationPipe(CustomerLoginEmailValidation))
    data: CustomerLoginEmailValidation,
  ): Promise<any> {
    const existcust = await this.customerService.findOneCustomerByEmail(
      data.email,
    );
    if (!existcust) {
      const errors: RMessage = {
        value: data.email,
        property: 'email',
        constraint: [this.messageService.get('customers.login.invalid_email')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    const validate: boolean = await this.customerService.validatePassword(
      data.password,
      existcust.password,
    );
    if (!validate) {
      const errors: RMessage = {
        value: data.password,
        property: 'password',
        constraint: [this.messageService.get('customers.login.invalid_email')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    const { id_profile, phone } = existcust;
    const http_req: Record<string, any> = {
      id_profile: id_profile,
      phone: phone,
      user_type: 'customer',
    };
    const url: string = process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/login';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
    };
    const messageHandler: Record<string, any> = {
      property: 'token',
      map: 'customers.login.fail',
    };
    return (
      await this.customerService.postHttp(
        url,
        http_req,
        messageHandler,
        headersRequest,
      )
    ).pipe(
      map(async (response) => {
        delete response.data.payload;
        return this.responseService.success(
          true,
          this.messageService.get('customers.login.success'),
          response.data,
        );
      }),
      catchError(() => {
        const errors = {
          value: '',
          property: 'login',
          constraint: [this.messageService.get('customers.login.fail')],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      }),
    );
  }

  @Post('login/phone')
  async loginByPhone(
    @Body(RequestValidationPipe(CustomerLoginPhoneValidation))
    data: CustomerLoginPhoneValidation,
  ): Promise<any> {
    const existcust = await this.customerService.findOneCustomerByPhone(
      data.phone,
    );
    if (!existcust) {
      const errors: RMessage = {
        value: data.phone,
        property: 'phone',
        constraint: [this.messageService.get('customers.login.invalid_phone')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    const logger = new Logger();
    logger.debug(data.password, 'args.password');
    logger.debug(existcust.password, 'db.password');
    if (existcust.password == null) {
      const errors: RMessage = {
        value: data.password,
        property: 'password',
        constraint: [this.messageService.get('customers.login.password_null')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    const validate: boolean = await this.customerService.validatePassword(
      data.password,
      existcust.password,
    );
    if (!validate) {
      const errors: RMessage = {
        value: data.password,
        property: 'password',
        constraint: [this.messageService.get('customers.login.invalid_phone')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    const { id_profile, phone } = existcust;
    const http_req: Record<string, any> = {
      id_profile: id_profile,
      phone: phone,
      user_type: 'customer',
    };
    const url: string = process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/login';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
    };
    const messageHandler: Record<string, any> = {
      property: 'token',
      map: 'customers.login.fail',
    };
    return (
      await this.customerService.postHttp(
        url,
        http_req,
        messageHandler,
        headersRequest,
      )
    ).pipe(
      map(async (response) => {
        delete response.data.payload;
        return this.responseService.success(
          true,
          this.messageService.get('customers.login.success'),
          response.data,
        );
      }),
      catchError((erro) => {
        let errors: RMessage;
        if (erro.status == 400) {
          errors = erro.response.error.message[0];
        } else {
          errors = {
            value: '',
            property: 'login',
            constraint: [this.messageService.get('customers.login.fail')],
          };
        }
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      }),
    );
  }

  @Post('refresh-token')
  async refreshToken(@Headers('Authorization') token: string): Promise<any> {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/refresh-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };
    const messageHandler: Record<string, any> = {
      property: 'token',
      map: 'customers.refresh_token.fail',
    };
    const http_req: Record<string, any> = {
      user_type: 'customer',
    };
    return (
      await this.customerService.postHttp(
        url,
        http_req,
        messageHandler,
        headersRequest,
      )
    ).pipe(
      map(async (response) => {
        return this.responseService.success(
          true,
          this.messageService.get('customers.refresh_token.success'),
          response.data,
        );
      }),
    );
  }

  @Put('reset-password')
  async resetPassword(
    @Body(RequestValidationPipe(CustomerResetPasswordValidation))
    data: CustomerResetPasswordValidation,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/reset-password';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };
    const messageHandler: Record<string, any> = {
      property: 'token',
      map: 'customers.reset_password.fail',
    };
    const http_req: Record<string, any> = {
      user_type: 'customer',
    };
    return (
      await this.customerService.putHttp(
        url,
        http_req,
        messageHandler,
        headersRequest,
      )
    ).pipe(
      map(async (response) => {
        const salt = await this.customerService.randomSalt();
        const passwordHash = await this.customerService.hashPassword(
          data.password,
          salt,
        );
        data.password = passwordHash;
        const profile: ProfileDocument =
          await this.customerService.findOneCustomerByPhone(
            response.data.payload.phone,
          );
        if (!profile) {
          const errors = {
            value: '',
            property: 'reset-password',
            constraint: [
              this.messageService.get('customers.reset_password.fail'),
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
        profile.password = passwordHash;
        try {
          await this.customerService.updateCustomerProfile(profile);
          return this.responseService.success(
            true,
            this.messageService.get('customers.reset_password.success'),
          );
        } catch (err) {
          const errors = {
            value: '',
            property: 'login',
            constraint: [
              this.messageService.get('customers.reset_password.fail'),
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
      }),
    );
  }
}
