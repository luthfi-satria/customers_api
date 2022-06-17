import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ExcelJS from 'exceljs';
import { Response } from 'express';
import moment from 'moment';
import { CommonService } from 'src/common/common.service';
import { NotificationService } from 'src/common/notification/notification.service';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { MessageService } from 'src/message/message.service';
import { ListResponse, RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { generateMessageChangeActiveEmail } from 'src/utils/general-utils';
import { Brackets, Repository } from 'typeorm';
import { generateSmsChangeActiveNoHp } from './../utils/general-utils';
import {
  CustomerListProfileDownloadValidation,
  CustomerListProfileValidation,
  CustomerProfileValidation,
} from './validation/customers.profile.validation';

// const defaultJsonHeader: Record<string, any> = {
//   'Content-Type': 'application/json',
// };

@Injectable()
export class CustomersUserManagementService {
  private readonly logger = new Logger(CustomersUserManagementService.name);

  constructor(
    @InjectRepository(ProfileDocument)
    private readonly profileRepository: Repository<ProfileDocument>,
    private httpService: HttpService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly commonService: CommonService,
    private readonly notificationService: NotificationService,
  ) {}

  async updateCustomerPhone(args: CustomerProfileValidation): Promise<any> {
    if (!args.phone || !args.id) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: !args.phone ? args.phone : args.id,
            property: !args.phone ? 'phone' : 'customer_id',
            constraint: [this.messageService.get('customers.error.invalid')],
          },
          'Bad Request',
        ),
      );
    }

    const checkPhone = await this.profileRepository.findOne({
      phone: args.phone,
    });

    if (checkPhone) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.phone,
            property: 'phone',
            constraint: [
              this.messageService.get(
                'customers.customer_management.phone_exist',
              ),
            ],
          },
          'Bad Request',
        ),
      );
    }

    const findCustomer = await this.profileRepository
      .findOne({
        relations: ['addresses'],
        where: {
          id: args.id,
        },
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.id,
              property: 'customer_id',
              constraint: [
                this.messageService.get('customers.error.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });

    if (!findCustomer) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.id,
            property: 'customer_id',
            constraint: [this.messageService.get('customers.error.not_found')],
          },
          'Bad Request',
        ),
      );
    }

    findCustomer.phone = args.phone;
    await this.profileRepository.save(findCustomer);

    const smsMessage = generateSmsChangeActiveNoHp(findCustomer.name);

    await this.notificationService.sendSms(args.phone, smsMessage);
    const response: Record<string, any> = this.responseService.success(
      true,
      this.messageService.get('customers.customer_management.phone_success'),
      findCustomer,
    );
    if (response.statusCode) {
      throw response;
    }
    return response;
  }

  async updateCustomerEmail(
    args: Partial<CustomerProfileValidation>,
  ): Promise<any> {
    if (!args.email || !args.id) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: !args.email ? args.email : args.id,
            property: !args.email ? 'email' : 'customer_id',
            constraint: [this.messageService.get('customers.error.invalid')],
          },
          'Bad Request',
        ),
      );
    }

    const checkEmail = await this.profileRepository.findOne({
      email: args.email,
    });

    if (checkEmail) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.email,
            property: 'email',
            constraint: [
              this.messageService.get(
                'customers.customer_management.email_exist',
              ),
            ],
          },
          'Bad Request',
        ),
      );
    }

    const findCustomer = await this.profileRepository
      .findOne({
        relations: ['addresses'],
        where: {
          id: args.id,
        },
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.id,
              property: 'customer_id',
              constraint: [
                this.messageService.get('customers.error.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });

    if (!findCustomer) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.id,
            property: 'customer_id',
            constraint: [this.messageService.get('customers.error.not_found')],
          },
          'Bad Request',
        ),
      );
    }

    findCustomer.email = args.email;
    await this.profileRepository.save(findCustomer);
    const messageChangeActiveEmail = await generateMessageChangeActiveEmail(
      findCustomer.name,
    );

    await this.notificationService.sendEmail(
      args.email,
      'Notifikasi Update Email',
      '',
      messageChangeActiveEmail,
    );

    const response: Record<string, any> = this.responseService.success(
      true,
      this.messageService.get('customers.customer_management.email_success'),
      findCustomer,
    );
    if (response.statusCode) {
      throw response;
    }
    return response;
  }

  async listCustomerWithRangeDate(
    data: Partial<CustomerListProfileValidation>,
  ): Promise<ListResponse> {
    const currentPage = data.page || 1;
    const perPage = data.limit || 10;
    const dateStart = data.date_start || null;
    const dateEnd = data.date_end ? new Date(data.date_end + +`Z23:59`) : null;

    if ((dateStart && !dateEnd) || (dateEnd && !dateStart)) {
      this.errorGenerator('', 'date', 'profile.error.dateFilterMissing');
    }

    try {
      const query = this.profileRepository.createQueryBuilder('profile');
      if (dateStart && dateEnd) {
        query.where(
          new Brackets((qb) => {
            qb.where(
              new Brackets((iqb) => {
                iqb
                  .where('profile.created_at >= :dateStart', {
                    dateStart,
                  })
                  .andWhere('profile.created_at <= :dateEnd', {
                    dateEnd,
                  });
              }),
            );
          }),
        );
      }
      query.skip((currentPage - 1) * perPage).take(perPage);
      const result = await query.getManyAndCount();
      const response: ListResponse = {
        total_item: result[1],
        limit: perPage,
        current_page: currentPage,
        items: result[0].map((profileCustomer) => {
          const profile: Partial<ProfileDocument> = {
            name: profileCustomer.name,
            phone: profileCustomer.phone,
            created_at: profileCustomer.created_at,
          };
          return profile;
        }),
      };
      return response;
    } catch (error) {
      this.errorReport(error, 'profile.error.list_failed');
    }
  }

  async listCustomerWithRangeDateDownload(
    data: Partial<CustomerListProfileDownloadValidation>,
    res: Response<any, Record<string, any>>,
  ): Promise<any> {
    const dateStart = data.date_start || null;
    const dateEnd = data.date_end ? new Date(data.date_end + +`Z23:59`) : null;

    if ((dateStart && !dateEnd) || (dateEnd && !dateStart)) {
      this.errorGenerator('', 'date', 'profile.error.dateFilterMissing');
    }

    try {
      const query = this.profileRepository.createQueryBuilder('profile');
      if (dateStart && dateEnd) {
        query.where(
          new Brackets((qb) => {
            qb.where(
              new Brackets((iqb) => {
                iqb
                  .where('profile.created_at >= :dateStart', {
                    dateStart,
                  })
                  .andWhere('profile.created_at <= :dateEnd', {
                    dateEnd,
                  });
              }),
            );
          }),
        );
      }
      const result = await query.getManyAndCount();
      const response: {
        total_item: number;
        items: Partial<ProfileDocument>[];
      } = {
        total_item: result[1],
        items: result[0].map((profileCustomer) => {
          const profile: Partial<ProfileDocument> = {
            name: profileCustomer.name,
            phone: profileCustomer.phone,
            created_at: profileCustomer.created_at,
          };
          return profile;
        }),
      };

      const columns = ['phone', 'name', 'created_at'];

      //=> create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Efood';

      //=> create sheetEfood
      const sheetEfood = workbook.addWorksheet('List New Customers', {
        properties: { defaultColWidth: 20 },
      });

      const sheetEfoodColumns: any[] = [];
      sheetEfoodColumns.push({
        header: 'No.',
        key: 'no',
        width: 15,
      });

      for (const key of columns) {
        const column = {
          header: key.toUpperCase(),
          key: key,
          width: key.substring(key.length - 3, key.length) == '_id' ? 30 : 25,
        };

        switch (key) {
          case 'phone':
            column.header = 'No. Handphone';
            break;
          case 'name':
            column.header = 'Nama';
            break;
          case 'created_at':
            column.header = 'Tanggal Join';
            break;
        }
        sheetEfoodColumns.push(column);
      }
      sheetEfood.columns = sheetEfoodColumns;
      sheetEfood.getRow(1).font = { bold: true };
      sheetEfood.getRow(1).alignment = { horizontal: 'center', wrapText: true };
      if (response.items.length > 0) {
        for (const [idx, obj] of response.items.entries()) {
          const row = [];
          row.push(idx + 1);
          for (const key of columns) {
            switch (key) {
              case 'phone':
                const phoneNumber = obj.phone ? obj.phone : '-';
                row.push(phoneNumber);
                break;
              case 'name':
                const name = obj.name ? obj.name : '-';
                row.push(name);
                break;
              case 'created_at':
                const joinDate = obj.created_at
                  ? moment(obj.created_at).format('DD/MM/YYYY')
                  : '-';
                row.push(joinDate);
                break;
            }
          }
          sheetEfood.addRow(row);
        }
      }
      for (let rowIndex = 2; rowIndex <= sheetEfood.rowCount; rowIndex++) {
        sheetEfood.getRow(rowIndex).alignment = {
          horizontal: 'center',
          wrapText: true,
        };
      }

      const dateTitle = moment().format('YYMMDDHHmmss');
      const fileName = `List_Customer_Baru_${dateTitle}.xlsx`;

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${fileName}`,
      });
      await workbook.xlsx.write(res);

      res.end();
    } catch (error) {
      this.errorReport(error, 'profile.error.list_failed');
    }
  }

  private errorReport(error: any, message: string) {
    this.logger.error(error);
    if (error.message == 'Bad Request Exception') {
      throw error;
    } else {
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [this.messageService.get(message), error.message],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
  }

  private errorGenerator(
    value: string,
    property: string,
    constraint: string | any[],
  ) {
    if (typeof constraint == 'string') {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value,
            property,
            constraint: [this.messageService.get(constraint)],
          },
          'Bad Request',
        ),
      );
    } else {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value,
            property,
            constraint: constraint,
          },
          'Bad Request',
        ),
      );
    }
  }
}
