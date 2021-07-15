import {
  BadRequestException,
  Body,
  Controller,
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
// import { OtpCreateValidation } from './validation/otp.create.validation';
import { RequestValidationPipe } from './validation/request-validation.pipe';
import { Response } from 'src/response/response.decorator';
import { RMessage } from 'src/response/response.interface';
import { OtpValidateValidation } from './validation/otp.validate.validation';
import { AuthJwtGuard } from 'src/hash/auth.decorators';
import { OtpCreateValidation } from './validation/otp.create.validation';
import util from 'util';
import { CustomerProfileValidation } from './validation/customers.profile.validation';
import { request } from 'express';

@Controller('customers')
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // const expiredIn: string = process.env.AUTH_JWTEXPIRATIONTIME;
        const phone = data.phone;
        const accessToken: string =
          await this.customerService.createAccessToken({
            idotp,
            phone,
          });
        const rdata: Record<string, string>[] = [{ token: accessToken }];

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
    } else {
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

  @AuthJwtGuard()
  @Put('profile')
  async profile(
    @Body(RequestValidationPipe(CustomerProfileValidation))
    data: CustomerProfileValidation,
  ): Promise<any> {
    const token = request.headers.authorization.replace('Bearer ', '');
    // const verif: boolean | Record<string, any> =
    //   await this.customerService.validateAccessToken(token, false);
    console.log('token: ' + util.inspect(token));
    // console.log('verify: ' + util.inspect(verif));

    // const existphone: OtpDocument =
    //   await this.customerService.findOneOtpByPhone(data.phone);

    // if (existphone) {
    //   if (existphone.otp_code !== data.otp_code) {
    //     const errors: RMessage = {
    //       value: data.otp_code,
    //       property: 'otp_code',
    //       constraint: [
    //         this.messageService.get('customers.validate.invalid_otp'),
    //       ],
    //     };

    //     throw new BadRequestException(
    //       this.responseService.error(
    //         HttpStatus.BAD_REQUEST,
    //         errors,
    //         'Bad Request',
    //       ),
    //     );
    //   }

    //   if (existphone) {
    //     if (existphone.validated == true) {
    //       const errors: RMessage = {
    //         value: data.otp_code,
    //         property: 'otp_code',
    //         constraint: [
    //           this.messageService.get('customers.validate.validated'),
    //         ],
    //       };

    //       throw new BadRequestException(
    //         this.responseService.error(
    //           HttpStatus.BAD_REQUEST,
    //           errors,
    //           'Bad Request',
    //         ),
    //       );
    //     }

    //     try {
    //       existphone.validated = true;
    //       this.customerService.updateFullOtp(existphone);

    //       //Create Token
    //       const idotp: number = existphone.id_otp;
    //       // const expiredIn: string = process.env.AUTH_JWTEXPIRATIONTIME;
    //       const phone = data.phone;
    //       const accessToken: string =
    //         await this.customerService.createAccessToken({
    //           idotp,
    //           phone,
    //         });
    //       const rdata: Record<string, string>[] = [{ token: accessToken }];

    //       return this.responseService.success(
    //         true,
    //         this.messageService.get('customers.validate.success'),
    //         rdata,
    //       );
    //     } catch (err: any) {
    //       const errors: RMessage = {
    //         value: data.otp_code,
    //         property: 'otp_code',
    //         constraint: [
    //           this.messageService.get('customers.validate.invalid_otp'),
    //         ],
    //       };

    //       throw new BadRequestException(
    //         this.responseService.error(
    //           HttpStatus.BAD_REQUEST,
    //           errors,
    //           'Bad Request',
    //         ),
    //       );
    //     }
    //   } else {
    //     const errors: RMessage = {
    //       value: data.phone,
    //       property: 'phone',
    //       constraint: [this.messageService.get('customers.create.invalid')],
    //     };

    //     throw new BadRequestException(
    //       this.responseService.error(
    //         HttpStatus.BAD_REQUEST,
    //         errors,
    //         'Bad Request',
    //       ),
    //     );
    //   }
    // }
  }
}
