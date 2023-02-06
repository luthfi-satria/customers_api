import { Controller, Get } from '@nestjs/common';
import { SsoService } from './sso.service';

@Controller('api/v1/customer/sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}
  @Get()
  async test() {
    return await this.ssoService.getCustomer();
  }
}
