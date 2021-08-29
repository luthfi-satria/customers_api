import { Injectable } from '@nestjs/common';
import { CustomersService } from 'src/customers/customers.service';
import { ProfileDocument } from 'src/database/entities/profile.entity';

@Injectable()
export class InternalService {
  constructor(private readonly customerService: CustomersService) {}

  async getCustomer(id: string): Promise<ProfileDocument> {
    return await this.customerService.findOneWithActiveAddresses(id);
  }
}
