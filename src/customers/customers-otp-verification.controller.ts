import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { OtpVerificationService } from './customers-otp-verification.service';
import { OtpCreateValidation } from './validation/otp.create.validation';

@Controller('api/v1/customers/profile')
export class OtpVerificationController {
  constructor(
    private readonly otpVerificationService: OtpVerificationService,
  ) {}

  @Post('verify-phone')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async verifyNewPhone(
    @Req() req: any,
    @Body()
    args: OtpCreateValidation,
  ): Promise<any> {
    console.log(args.phone);
    args.id = req.user.id;
    return this.otpVerificationService.verifyNewPhone(args);
  }

  @Post('verify-phone-validation')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async validationNewPhone(
    @Req() req: any,
    @Body()
    args: Partial<OtpCreateValidation>,
  ): Promise<any> {
    args.id = req.user.id;
    return this.otpVerificationService.validationNewPhone(args);
  }

  @Post('verify-email')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async verifyNewEmail(
    @Req() req: any,
    @Body()
    args: Partial<OtpCreateValidation>,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    args.id = req.user.id;
    args.token = token;
    return this.otpVerificationService.verifyNewEmail(args);
  }

  @Post('verify-email/resend')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async verifyNewEmailResend(
    @Req() req: any,
    @Body()
    args: Partial<OtpCreateValidation>,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    args.id = req.user.id;
    args.token = token;
    return await this.otpVerificationService.verifyNewEmailResend(args);
  }

  @Post('verify-email-validation')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async validationNewEmail(
    @Req() req: any,
    @Body()
    args: Partial<OtpCreateValidation>,
  ): Promise<any> {
    args.id = req.user.id;
    return await this.otpVerificationService.validationNewEmail(args);
  }
}
