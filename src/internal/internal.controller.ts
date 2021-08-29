import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { InternalService } from './internal.service';

@Controller('api/v1/internal')
export class InternalController {
  constructor(private readonly internalService: InternalService) {}

  logger: Logger = new Logger();

  @Get('customers/:id')
  async getCustomer(@Param('id') id: string): Promise<ProfileDocument> {
    return this.internalService.getCustomer(id);
  }
}
