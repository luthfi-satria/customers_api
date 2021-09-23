import { Body, Controller, Post, Req } from '@nestjs/common';

import { ResponseStatusCode } from 'src/response/response.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { OtpCreateValidation } from './validation/otp.create.validation';
import { PhoneConstraintService } from './customers-phone-constraint.service';
import { OtpPhoneValidateValidation } from './validation/otp.phone-validate.validation';

@Controller('api/v1/customers')
export class PhoneConstraintController {
  constructor(
    private readonly phoneConstraintService: PhoneConstraintService,
  ) {}

  @Post('otp-phone-problem')
  @ResponseStatusCode()
  async checkOldPhone(
    @Body()
    args: Partial<OtpCreateValidation>,
  ): Promise<any> {
    return this.phoneConstraintService.cekExistingPhone(args);
  }

  @Post('otp-phone-problem-validation')
  @ResponseStatusCode()
  async validateOtpOldPhone(
    @Body()
    args: Partial<OtpPhoneValidateValidation>,
  ): Promise<any> {
    return await this.phoneConstraintService.validateExistingPhone(args);
  }

  @Post('otp-phone-problem-new')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateNewPhone(
    @Req() req: any,
    @Body()
    args: Partial<OtpCreateValidation>,
  ): Promise<any> {
    return await this.phoneConstraintService.updateNewPhone(args, req.user);
  }

  @Post('otp-phone-problem-validation-new')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async validateNewPhone(
    @Req() req: any,
    @Body()
    args: Partial<OtpPhoneValidateValidation>,
  ): Promise<any> {
    return await this.phoneConstraintService.validateNewPhone(args);
  }
}
