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
        const flg_update = false;
        const cekemail: ProfileDocument =
          await this.customerService.findOneCustomerByEmail(data.email);
        if (cekemail) {
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
        const profile: ProfileDocument =
          await this.customerService.findOneCustomerByPhone(
            response.data.payload.phone,
          );

        // if (profile) {
        //   flg_update = true;
        // }

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

  @Post('login')
  async login(
    @Body()
    data: Record<string, any>,
  ): Promise<any> {
    let existcust: ProfileDocument;
    let data_value: string;
    let data_property: string;

    if (
      typeof data.email != 'undefined' &&
      typeof data.phone == 'undefined' &&
      data.email != ''
    ) {
      const err: string = await this.customerService.validateLoginEmail(data);
      if (typeof err != 'undefined') {
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
      if (existcust) {
        data_value = data.email;
        data_property = 'email';
      }
    } else if (
      typeof data.phone != 'undefined' &&
      typeof data.email == 'undefined' &&
      data.phone !== ''
    ) {
      const err: string = await this.customerService.validateLoginPhone(data);
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
      if (existcust) {
        data_value = data.phone;
        data_property = 'phone';
      }
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

    const validate: boolean = await this.customerService.validatePassword(
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
    const http_req: Record<string, any> = {
      id_profile: id_profile,
      phone: phone,
      password: password,
      email: email,
      name: name,
      dob: dob,
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
      map: 'customers.profile.fail',
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
          this.messageService.get('customers.profile.success'),
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
