import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { ListReprotNewCustomerDTO } from './dto/report.dto';
import { ReportsService } from './reports.service';

@Controller('api/v1/customers')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  //** LIST NEW CUSTOMER */
  @Get('reports')
  @UserTypeAndLevel('admin.*', 'merchant.*')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getNewCustomer(@Query() data: ListReprotNewCustomerDTO): Promise<any> {
    try {
      const findAllCustomer = await this.reportsService.findAll(data);
      return this.responseService.success(
        true,
        this.messageService.get('customers.success'),
        findAllCustomer,
      );
    } catch (error) {
      throw error;
    }
  }

  //** GENERATE LIST NEW CUSTOMER */
  @Get('reports/generate')
  @UserTypeAndLevel('admin.*', 'merchant.*')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async generateXLSX(
    @Query() data: ListReprotNewCustomerDTO,
    @Res() res: Response,
  ): Promise<any> {
    try {
      const generateCustomers = await this.reportsService.generateXLSXCustomers(
        data,
        res,
      );
      return this.responseService.success(
        true,
        this.messageService.get('customers.success'),
        generateCustomers,
      );
    } catch (error) {
      throw error;
    }
  }
}
