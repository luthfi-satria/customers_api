
import {
  Body,
  Controller, Get, Logger, Param, Put, Query
} from '@nestjs/common';
import { ResponseService } from 'src/response/response.service';
import { CustomersService } from './customers.service';
import { QueryFilterDto } from './validation/customers.profile.validation';

@Controller('api/v1/customers/user-management')
export class CustomersUserManagementController { 
  constructor(
    private readonly responseService: ResponseService,
    private readonly customerService: CustomersService,
  ) {}

  @Get()
  async queryCustomerList(@Query() query: QueryFilterDto){ 
    try {
      const result = await this.customerService.queryCustomerProfile(query);
      
      return this.responseService.success(true, 'Succes Query Customer List', result);
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'GET Query Customer list')
      throw e;
    }
  }

  @Put(':id/addresses')
  async updateUserAddressInBulk(
    @Param('id') param: string,
    @Body() body: Record<string, any>
  ){
    try {
      return this.responseService.success(true, 'Succes Update Customer Addresses', []);
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'PUT Update Customer Addresses');
    }
  }

  @Put(':id/addresses/:address_id')
  async updateUserAddress(
    @Param('id') id: string,
    @Param('address_id') address_id: string,
    @Body() body: Record<string, any>
  ){
    try {
    return this.responseService.success(true, 'Succes Update Customer Address', {});
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'PUT Update Customer Addresses');
    }
  }

}

