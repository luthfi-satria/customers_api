import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { genSaltSync, hash } from 'bcrypt';
import { lastValueFrom, map } from 'rxjs';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { SettingsService } from 'src/settings/settings.service';
import { Brackets, Repository } from 'typeorm';
import { ssoDto } from './dto/sso.dto';
import { AxiosResponse } from 'axios';
import { SsoAuthDocument } from './dto/sso-auth.dto';
import { RMessage } from 'src/response/response.interface';
import { generateDatabaseDateTime } from 'src/utils/general-utils';

@Injectable()
export class SsoService {
  cronConfigs = {
    // enable or disabled process
    sso_process: 0,
    // time range of sync execution
    sso_timespan: 20,
    // last update of sync process
    sso_lastupdate: null,
    // limit data execution
    sso_data_limit: 10,
    sso_refresh_config: 60,
    // skip of data index
    offset: 0,
    // total sync data found
    total_data: 0,
    // iteration counter
    iteration: 1,
  };
  constructor(
    private readonly settingRepo: SettingsService,
    @InjectRepository(ProfileDocument)
    private readonly customerRepository: Repository<ProfileDocument>,
    private readonly httpService: HttpService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  logger = new Logger(SsoService.name);

  @Cron('* * * * * *')
  async syncUsers() {
    try {
      // Iterate base on timespan
      if (this.cronConfigs.iteration % this.cronConfigs.sso_timespan == 0) {
        if (
          // if iteration time same with refresh time then update cron settings
          this.cronConfigs.iteration % this.cronConfigs.sso_refresh_config ==
          0
        ) {
          this.cronConfigs.iteration = 1;
          this.logger.log('SSO -> SSO CONFIGS');
          // reinitialize cron setting
          await this.getCustomersConfig();
          // if cron process is enable
          if (this.cronConfigs.sso_process) {
            this.logger.log('SSO -> SYNCHRONIZING');
            // get updated users data
            const syncUsersData = await this.getUpdatedUsers();
            // if none data can be sync, then update configuration
            if (
              this.cronConfigs.total_data > 0 &&
              this.cronConfigs.offset >= this.cronConfigs.total_data
            ) {
              this.logger.log('SSO -> UPDATE CONFIGS');
              await this.updateSettings();
            } else {
              // REGISTER OR UPDATE TO SSO
              // fetch result into callback return
              const syncProcess = await this.registerBulk(syncUsersData);

              // UPDATING CUSTOMERS DATA
              if (syncProcess.data.length > 0) {
                const updateData = [];
                syncProcess.data.forEach((rows) => {
                  updateData.push({
                    id: rows.ext_id,
                    sso_id: rows.sso_id,
                  });
                });

                // UPDATE TO DATABASE
                if (updateData.length > 0) {
                  await this.customerRepository.save(updateData);
                }
              }
              const callback = {
                syncUsers: syncProcess,
              };
              console.log(callback, '<= SSO SYNC PROCESS');
              return callback;
            }
          }
        }
      }
      this.cronConfigs.iteration++;
    } catch (error) {
      console.log(error);
      this.cronConfigs.iteration++;
      throw error;
    }
  }

  /**
   * ##################################################################################
   * CUSTOMER SERVICE SETTINGS
   * ##################################################################################
   */
  async getCustomersConfig() {
    const settings = await this.settingRepo.getSettingsByNamePattern('sso');
    settings.forEach((element) => {
      if (element.name == 'sso_lastupdate') {
        this.cronConfigs[element.name] = element.value;
      } else {
        this.cronConfigs[element.name] = parseInt(element.value);
      }
    });
  }

  /**
   * ##################################################################################
   * DATABASE HANDLER -> GET UPDATED CUSTOMERS USERS
   * ##################################################################################
   * @returns
   */
  async getUpdatedUsers() {
    if (this.cronConfigs.offset == 0) {
      const queryCount = this.queryStatement();
      this.cronConfigs.total_data = await queryCount.getCount();
    }

    if (this.cronConfigs.total_data > 0) {
      console.log(
        {
          configs: this.cronConfigs,
          cond: this.cronConfigs.offset < this.cronConfigs.total_data,
        },
        '<= SSO - CONFIG PROCESS',
      );
    }

    if (this.cronConfigs.offset < this.cronConfigs.total_data) {
      const queryData = this.queryStatement();
      const queryResult = await queryData
        .skip(this.cronConfigs.offset)
        .take(this.cronConfigs.sso_data_limit)
        .getMany();

      const requestData = [];
      if (queryResult) {
        for (const rows in queryResult) {
          const ssoPayload: Partial<ssoDto> = {
            ext_id: queryResult[rows].id,
            sso_id: queryResult[rows].sso_id,
            email: queryResult[rows].email ? queryResult[rows].email : '',
            fullname: queryResult[rows].name,
            phone_number: queryResult[rows].phone,
            recovery_phone: queryResult[rows].phone,
            type: queryResult[rows].email
              ? 'email'
              : queryResult[rows].phone
              ? 'phone'
              : 'email',
            gender: queryResult[rows].gender
              ? queryResult[rows].gender == 'MALE'
                ? 'Pria'
                : 'Wanita'
              : 'Pria',
            skip_email: true,
            skip_phone: true,
            business: [],
            address: [],
          };

          if (!ssoPayload.sso_id) {
            let password = queryResult[rows].phone
              ? '0' + queryResult[rows].phone.substring(2)
              : '123456';

            password = await this.generateHashPassword(password);

            ssoPayload.password = password;
          }
          requestData.push(ssoPayload);
        }
      }
      this.cronConfigs.offset += this.cronConfigs.sso_data_limit;
      return requestData;
    }
    this.cronConfigs.offset = 0;
    return {};
  }

  /**
   * QUERY STATEMENT FOR GETTING CUSTOMERS DATA
   * @returns
   */
  queryStatement() {
    const queryData =
      this.customerRepository.createQueryBuilder('customers_profile');
    // IF SSO LAST UPDATE IS NOT EMPTY
    if (this.cronConfigs.sso_lastupdate) {
      queryData.where(
        new Brackets((qb) => {
          qb.where('customers_profile.updated_at > :lastUpdate', {
            lastUpdate: this.cronConfigs.sso_lastupdate,
          });
          qb.orWhere('customers_profile.created_at > :lastUpdate', {
            lastUpdate: this.cronConfigs.sso_lastupdate,
          });
        }),
      );
      queryData.orWhere('customers_profile.sso_id is null');
    }
    return queryData;
  }

  /**
   * UPDATE CUSTOMERS SETTINGS
   * @returns
   */
  async updateSettings() {
    // UPDATING SSO SETTINGS BY NAME
    const updateSettings = await this.settingRepo.updateSettingByName(
      'sso_lastupdate',
      generateDatabaseDateTime(new Date(), '+0700'),
    );
    return updateSettings;
  }

  /**
   * ##################################################################################
   * SSO PROCESS
   * @param UsersData
   * @returns
   * ##################################################################################
   */
  async registerBulk(UsersData) {
    // sso authentication process
    const loginSSO = await this.ssoAuthentication();
    if (loginSSO && loginSSO.data.token) {
      // set sso-token from authentication process into registration header process
      const headerRequest = {
        'Content-Type': 'application/json',
        'sso-token': loginSSO.data.token.token_code,
      };
      // console.log(UsersData);
      // bulk registration process
      const syncUsers = await this.httpSsoRequests(
        UsersData,
        'api/user/register_personal_business_bulk',
        headerRequest,
      );

      const updateData = [];
      if (syncUsers && syncUsers.data.length > 0) {
        console.log(syncUsers);
        syncUsers.data.forEach((rows) => {
          if (rows.sso_id != 0) {
            const bulkUpdate: Partial<ProfileDocument> = {
              id: rows.ext_id,
              sso_id: rows.sso_id,
            };
            updateData.push(bulkUpdate);
          }
        });
      }

      let updateStatus = [];
      if (updateData.length > 0) {
        // console.log(updateData);
        updateStatus = await this.customerRepository.save(updateData);
      }

      console.log(
        {
          syncStatus: syncUsers,
          updateStatus: updateStatus,
        },
        '<= SYNC USER SSO',
      );
      return syncUsers;
    }

    // IF THERE IS NO token IN SSO RESPONSE THEN RETURNING UNAUTHORIZED ERROR
    const errors: RMessage = {
      value: '',
      property: 'SSO Service',
      constraint: [loginSSO],
    };
    return this.responseService.error(
      HttpStatus.UNAUTHORIZED,
      errors,
      'UNAUTHORIZED',
    );
  }

  /**
   * SSO AUTHENTICATION PROCESS
   * @returns
   */
  async ssoAuthentication() {
    const headerRequest = {
      'Content-Type': 'application/json',
    };
    const authData: SsoAuthDocument = {
      name: process.env.SSO_NAME,
      secret_key: process.env.SSO_SECRET_KEY,
      device_id: process.env.SSO_DEVICE_ID,
      device_type: process.env.SSO_DEVICE_TYPE,
    };
    const authenticate = await this.httpSsoRequests(
      authData,
      `api/token/get`,
      headerRequest,
    );
    return authenticate;
  }

  /**
   * GENERAL HTTP SSO REQUEST
   * @param payload
   * @param urlPath
   * @param headerRequest
   * @returns
   */
  async httpSsoRequests(payload: any, urlPath: string, headerRequest) {
    try {
      // SSO URL
      const url = `${process.env.SSO_HOST}/${urlPath}`;

      // SSO POST REQUEST
      const post_request = this.httpService
        .post(url, payload, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
        );

      // GETTING RESPONSE FROM SSO
      const response = await lastValueFrom(post_request);
      return response;
    } catch (error) {
      console.log(error.response.data);
      return error.response.data;
    }
  }

  /**
   * ##################################################################################
   * THIS FUNCTION ONLY FOR TESTING
   * ##################################################################################   *
   * @returns
   */
  async testingSSO() {
    try {
      const updatedCustomers = await this.getUpdatedUsers();
      const synchronize = await this.registerBulk(updatedCustomers);

      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        synchronize,
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /**
   * ##################################################################################
   * GENERATE DEFAULT PASSWORD
   * ##################################################################################
   * @param password
   * @returns
   */
  generateHashPassword(password: string): Promise<string> {
    const defaultSalt: number =
      Number(process.env.HASH_PASSWORDSALTLENGTH) || 10;
    const salt = genSaltSync(defaultSalt);

    return hash(password, salt);
  }
}
