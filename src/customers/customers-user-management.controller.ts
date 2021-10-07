import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AddressService } from 'src/address/address.service';
import { UpdateAddressDto } from 'src/address/dto/update-address.dto';
import { UserRoleGuard } from 'src/auth/guard/user-role.guard';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { Address } from 'src/database/entities/address.entity';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { CustomersService } from './customers.service';
import { AdminCustomerProfileValidation } from './validation/admin.customers.profile.validation';
import { QueryFilterDto } from './validation/customers.profile.validation';

@Controller('api/v1/customers/user-management')
@UseGuards(UserRoleGuard)
export class CustomersUserManagementController {
  constructor(
    private readonly addressService: AddressService,
    private readonly responseService: ResponseService,
    private readonly customerService: CustomersService,
  ) {}

  @Get()
  @UserType('admin')
  async queryCustomerList(@Query() query: QueryFilterDto) {
    try {
      const result = await this.customerService.queryCustomerProfile(query);

      return this.responseService.success(
        true,
        'Success Query Customer List',
        result,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'GET Query Customer list');
      throw e;
    }
  }

  @Put('/:id_profile')
  @UserType('admin')
  @ResponseStatusCode()
  async userManagement(
    @Param('id_profile') id_profile: string,
    @Body() body: AdminCustomerProfileValidation,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    return this.customerService.updateCustomerManageProfile(
      token,
      id_profile,
      body,
    );
  }

  @Put(':id/addresses')
  @UserType('admin')
  async updateUserAddressInBulk(
    @Param('id') id: string,
    @Body() body: UpdateAddressDto[],
  ) {
    try {
      const inputIds = body.map((row) => row.id);

      const customerIsExist = await this.customerService.findOneCustomerById(
        id,
      );
      if (!customerIsExist) {
        throw new NotFoundException(
          this.responseService.error(HttpStatus.NOT_FOUND, {
            constraint: [`'customer_id' not found!`],
            property: 'customer_id',
            value: id,
          }),
        );
      }

      const address_ids =
        await this.addressService.findAddressByIdsWithCustomerId(inputIds, id);

      if (inputIds.length !== address_ids.length) {
        const existIds = address_ids.map((e) => e.id);
        const unknown_id = inputIds.filter((x) => !existIds.includes(x));

        throw new NotFoundException(
          this.responseService.error(HttpStatus.NOT_FOUND, {
            constraint: [`'address_id' not found!`],
            property: 'address_id',
            value: unknown_id[0],
          }),
        );
      }

      // parse existing with new value
      const parsedAddresses: Address[] = address_ids.map((row) => {
        const newValue = body.find((item) => item.id == row.id);
        return { ...row, ...newValue };
      });

      const result = await Promise.all(
        parsedAddresses.map(async (row) => {
          // check & validate postal code, if fail return bad exception
          const city_detail = await this.addressService
            .getCityId(row.postal_code)
            .catch((e) => {
              throw e;
            });
          row.city_id = city_detail;

          return this.addressService.updateByEntity(row.id, row);
        }),
      ).catch((e) => {
        throw e;
      });

      return this.responseService.success(
        true,
        'Success Update Customer Addresses',
        result,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'PUT Update Customer Addresses');
      throw e;
    }
  }

  @Put(':customer_id/addresses/:address_id')
  @UserType('admin')
  async updateUserAddress(
    @Param('customer_id') id: string,
    @Param('address_id') address_id: string,
    @Body() body: UpdateAddressDto,
  ) {
    try {
      const customerIsExist = await this.customerService.findOneCustomerById(
        id,
      );
      if (!customerIsExist) {
        throw new NotFoundException(
          this.responseService.error(HttpStatus.NOT_FOUND, {
            constraint: [`param 'id' not found!`],
            property: 'id',
            value: id,
          }),
        );
      }

      const addressIsExist = await this.addressService.findOne(address_id, id);
      if (!addressIsExist) {
        throw new NotFoundException(
          this.responseService.error(HttpStatus.NOT_FOUND, {
            constraint: [`param 'address_id' not found!`],
            property: 'address_id',
            value: address_id,
          }),
        );
      }

      // parse existing with new value
      const parsedAddresses = new Address({ ...addressIsExist, ...body });

      // validate postal code, if fail return bad exception
      const city_id = await this.addressService.getCityId(
        parsedAddresses.postal_code,
      );
      parsedAddresses.city_id = city_id;

      const result = await this.addressService.updateByEntity(
        parsedAddresses.id,
        parsedAddresses,
      );

      return this.responseService.success(
        true,
        'Succes Update Customer Address',
        result,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'PUT Update Custommer Addresses');
      throw e;
    }
  }
}
