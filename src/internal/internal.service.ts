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
      return await this.customerService.getBulkCustomers(ids);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAllCustomers(): Promise<any> {
    try {
      return await this.customerService.findAll();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
