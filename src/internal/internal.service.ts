import { Injectable } from '@nestjs/common';
import { CustomersService } from 'src/customers/customers.service';
import { ProfileDocument } from 'src/database/entities/profile.entity';

@Injectable()
export class InternalService {
  constructor(private readonly customerService: CustomersService) {}

  async getCustomer(id: string): Promise<ProfileDocument> {
    return this.customerService.findOneWithActiveAddresses(id);
  }

  async getCustomersBulk(ids: any): Promise<any> {
    try {
      return this.customerService.getBulkCustomers(ids);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
