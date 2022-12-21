import { HttpService } from '@nestjs/axios';
import moment from 'moment';
import ExcelJS from 'exceljs';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ListReprotNewCustomerDTO } from './dto/report.dto';
import { CustomerRepositoryDocument } from './repository/customer.repository';
import { Response } from 'express';
import { RMessage } from 'src/response/response.interface';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class ReportsService {
  constructor(
    private httpService: HttpService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly customerRepository: CustomerRepositoryDocument,
    private readonly commonService: CommonService,
  ) {}

  logger = new Logger(ReportsService.name);

  async processListNewMerchants(data: ListReprotNewCustomerDTO): Promise<any> {
    try {
      //** GET DATA FROM DATABASE */
      const raw = await this.customerRepository.repositoryCustomer(data);

      // //** CREATE OBJECT DATA */
      const cityIObj = {};

      // Data Cities
      raw.items.forEach((cp) => {
        if (cp.address_city_id) {
          cityIObj[cp.address_city_id] = null;
        }
      });

      const promises = [];
      let cities = null;

      raw.items.forEach((cp) => {
        cities = this.getCityId(cp.address_city_id);
        promises.push(cities);
      });

      await Promise.all(promises);

      if (cities) {
        cities = await cities;
        cities?.items?.forEach((city: any) => {
          cityIObj[city.id] = city;
        });
      }

      //** RESULT NEW MERCHANTS STORES */
      raw.items.forEach((cp) => {
        cp.address_city_id = cities ? cities : cityIObj[cp.address_city_id];
      });

      return raw;
    } catch (error) {
      throw error;
    }
  }

  //** LIST DATA CUSTOMER */
  async findAll(data: ListReprotNewCustomerDTO): Promise<any> {
    try {
      const raw = await this.processListNewMerchants(data);
      return raw;
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [this.messageService.get('customers.error.not_found')],
          },
          'Bad Request',
        ),
      );
    }
  }

  //** GENERATE XLSX REPORT CUSTOMER */
  async generateXLSXCustomers(
    data: ListReprotNewCustomerDTO,
    res: Response<any, Record<string, any>>,
  ): Promise<any> {
    try {
      //** CREATE COLUMN EXCEL */
      const columns = data.columns?.length
        ? data.columns
        : ['name', 'gender', 'address', 'city', 'phone', 'email', 'created'];

      //** GET DATA FROM DATABASE */
      const raw = await this.customerRepository.repositoryCustomer(data);

      //** CREATE WORKBOOK */
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Efood';

      //** CREATE SHEETSEFOOD */
      let sheetEfood: ExcelJS.Worksheet;

      if (data.sheet_name && data.sheet_name !== '') {
        sheetEfood = workbook.addWorksheet('Data New Customers', {
          properties: { defaultColWidth: 20 },
        });
      } else {
        sheetEfood = workbook.addWorksheet('Data New Customers', {
          properties: { defaultColWidth: 20 },
        });
      }

      //** EFOOD COLUMN NAME */
      const sheetEfoodColumns: any[] = [];
      sheetEfoodColumns.push({
        header: 'No.',
        key: 'no',
        width: 15,
      });

      //** EFOOD COLUMN NAME */
      for (let key of columns) {
        const splitString = key.split('|');
        key = splitString[0];

        const column = {
          header: key.toUpperCase(),
          key: key,
          width: key.substring(key.length - 3, key.length) == '_id' ? 30 : 25,
        };

        switch (key) {
          case 'name':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'NAME';
            }
            break;
          case 'gender':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'GENDER';
            }
            break;
          case 'address':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'ADDRESS';
            }
            break;
          case 'city':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'CITY';
            }
            break;
          case 'phone':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'PHONE';
            }
            break;
          case 'email':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'EMAIL';
            }
            break;
          case 'created':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'JOIN DATE';
            }
            break;
        }
        sheetEfoodColumns.push(column);
      }

      sheetEfood.columns = sheetEfoodColumns;
      sheetEfood.getRow(1).font = { bold: true };
      sheetEfood.getRow(1).alignment = { horizontal: 'center', wrapText: true };
      if (raw.items.length > 0) {
        for (const [idx, obj] of raw.items.entries()) {
          const row = [];
          row.push(idx + 1);

          for (let key of columns) {
            const splitString = key.split('|');
            key = splitString[0];

            switch (key) {
              case 'name':
                const nameN = obj.cp_name ? obj.cp_name : '-';
                row.push(nameN);
                break;
              case 'gender':
                const nameG = obj.cp_gender ? obj.cp_gender : '-';
                row.push(nameG);
                break;
              case 'address':
                const nameA = obj.address_address ? obj.address_address : '-';
                row.push(nameA);
                break;
              case 'city':
                const city = obj.address_city_id;
                const getCities = await this.getCityId(city);
                const nameCi = getCities ? getCities : '-';
                row.push(nameCi);
                break;
              case 'phone':
                const nameP = obj.cp_phone ? obj.cp_phone : '-';
                row.push(nameP);
                break;
              case 'email':
                const nameE = obj.cp_email ? obj.cp_email : '-';
                row.push(nameE);
                break;
              case 'created':
                const dateCr = new Date(obj.cp_created_at);
                const yearCr = dateCr.toLocaleString('default', {
                  year: 'numeric',
                });
                const monthCr = dateCr.toLocaleString('default', {
                  month: '2-digit',
                });
                const dayCr = dateCr.toLocaleString('default', {
                  day: '2-digit',
                });
                const formatDateCr = dayCr + '-' + monthCr + '-' + yearCr;
                const nameC = formatDateCr ? formatDateCr : '-';
                row.push(nameC);
                break;
            }
          }
          sheetEfood.addRow(row);
        }
      }

      const dateTitle = moment().format('YYMMDDHHmmss');
      let fileName: string;
      if (data.sheet_name && data.sheet_name !== '') {
        fileName = `Laporan_${data.sheet_name
          .split(' ')
          .join('_')
          .toLowerCase()}_${dateTitle}.xlsx`;
      } else {
        fileName = `Laporan_customer_baru_${dateTitle}.xlsx`;
      }

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${fileName}`,
      });
      await workbook.xlsx.write(res);

      res.end();
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [this.messageService.get('customers.error.not_found')],
          },
          'Bad Request',
        ),
      );
    }
  }

  async getCityId(city_id: string) {
    if (!city_id) {
      return null;
    }
    const url: string =
      process.env.BASEURL_ADMINS_SERVICE +
      '/api/v1/admins/internal/cities/' +
      city_id;
    const response_postal_code = await this.commonService.postHttp(url);
    if (!response_postal_code) {
      const errors: RMessage = {
        value: city_id,
        property: 'city_id',
        constraint: [this.messageService.get('address.city.not_found')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    return response_postal_code.data.name;
  }
}
