import { Controller, Get } from '@nestjs/common';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { SsoService } from './sso.service';

@Controller('api/v1/customers/sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}
  @Get()
  @ResponseStatusCode()
  async getUpdatedUsers() {
    return await this.ssoService.getUpdatedUsers();
  }

  @Get('test_sso')
  @ResponseStatusCode()
  async testSso() {
    return await this.ssoService.testingSSO();
  }
}
