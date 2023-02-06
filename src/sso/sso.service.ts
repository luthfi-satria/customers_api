import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom, map } from 'rxjs';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { SettingsService } from 'src/settings/settings.service';
import { generateDatabaseDateTime } from 'src/utils/general-utils';
import { Brackets, Repository } from 'typeorm';
@Injectable()
export class SsoService {
  constructor(
    private readonly settingRepo: SettingsService,
    @InjectRepository(ProfileDocument)
    private readonly CustomerRepository: Repository<ProfileDocument>,
    private readonly httpService: HttpService,
  ) {}
  cronConfigs = {
    // enable or disabled process
    sso_process: 1,
    // time range of sync execution
    sso_timespan: 60,
    // last update of sync process
    sso_lastupdate: null,
    // limit data execution
    sso_data_limit: 10,
    sso_refresh_config: 60,
    // skip of data index
    offset: 0,
    // total sync data found
    total_data: 3,
    // iteration counter
    iteration: 1,
  };
  logger = new Logger(SsoService.name);

  @Cron('* * * * * *')
  async syncAll() {
    try {
      if (this.cronConfigs.iteration % this.cronConfigs.sso_timespan == 0) {
        if (
          this.cronConfigs.iteration % this.cronConfigs.sso_refresh_config ==
          0
        ) {
          this.logger.log('SSO -> CUSTOMERS CONFIGS');
          // await this.getCustomersConfig();
        }
        this.cronConfigs.iteration++;
        if (this.cronConfigs.sso_process) {
          this.logger.log('SSO -> SYNC IS STARTED');
          const res = await this.CustomerRepository.find();
          console.log(res);
          // const syncCustomer = await this.getCustomers();
          if (
            this.cronConfigs.total_data > 0 &&
            this.cronConfigs.offset >= this.cronConfigs.total_data
          ) {
            this.logger.log('SSO -> UPDATE CONFIGS');
            await this.updateSettings();
          }
          // const callback = {
          //   syncCustomers: syncCustomer,
          // };
          // console.log(syncCustomer);
          // console.log(callback, '<= Sync status');
          // return callback;
        }
        return {
          code: 400,
          message: 'Process unable to start, please check system configuration',
        };
      }

      const maxIteration =
        this.cronConfigs.sso_refresh_config > this.cronConfigs.sso_timespan
          ? this.cronConfigs.sso_refresh_config
          : this.cronConfigs.sso_timespan;
      if (this.cronConfigs.iteration >= maxIteration) {
        this.cronConfigs.iteration = 1;
      } else {
        this.cronConfigs.iteration++;
      }
    } catch (error) {
      console.log(error);
      this.cronConfigs.iteration++;
      throw error;
    }
  }
  async getCustomersConfig() {
    const settings = await this.settingRepo.getSettingsByNamePattern('sso');
    settings.forEach((element) => {
      if (element.name == 'sso_lastupdate') {
        this.cronConfigs[element.name] = element.value;
      } else {
        this.cronConfigs[element.name] = Number(element.value);
      }
    });
  }
  async updateSettings() {
    const updateSettings = await this.settingRepo.updateSettingByName(
      'sso_lastupdate',
      generateDatabaseDateTime(new Date(), '+0700'),
    );
    return updateSettings;
  }

  async getCustomers() {
    // console.log(this.cronConfigs.offset, '<= initial offset');
    if (this.cronConfigs.offset == 0) {
      const queryCount = this.queryStatement();
      this.cronConfigs.total_data = await queryCount.getCount();
    }

    // const currTime = DateTimeUtils.DateTimeToUTC(new Date());
    // const weekOfDay = DateTimeUtils.getDayOfWeekInWIB();

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
        .withDeleted()
        .skip(this.cronConfigs.offset)
        .take(this.cronConfigs.sso_data_limit)
        .getMany();

      this.cronConfigs.offset += this.cronConfigs.sso_data_limit;
      //   const elData = await this.createElasticIndex('stores', queryResult);
      return queryResult;
    }
    this.cronConfigs.offset = 0;
    return {};
  }
  queryStatement() {
    const queryData =
      this.CustomerRepository.createQueryBuilder('customers_profile');

    // .leftJoinAndSelect('merchant_store.menus', 'menus');
    if (this.cronConfigs.sso_lastupdate) {
      queryData.where(
        new Brackets((qb) => {
          qb.where('customers_profile.updated_at > :lastUpdate', {
            lastUpdate: this.cronConfigs.sso_lastupdate,
          });
          qb.orWhere('customers_profile.created_at > :lastUpdate', {
            lastUpdate: this.cronConfigs.sso_lastupdate,
          });
          qb.orWhere('customers_profile.deleted_at > :lastUpdate', {
            lastUpdate: this.cronConfigs.sso_lastupdate,
          });
        }),
      );
      queryData.orWhere('customers_profile.sso_id is null');
    }
    return queryData;
  }
  async getToken(): Promise<string> {
    const url = `${process.env.SSO_BASEURL}api/token/get`;
    const body = {
      name: process.env.SSO_CLIENT_NAME,
      secret_key: process.env.SSO_CLIENT_SECRET,
      device_id: 'customerservice',
      device_name: 'CUSTOMERS_SERVICE',
    };
    try {
      return await firstValueFrom(
        this.httpService.post(url, body).pipe(map((resp) => resp.data)),
      );
    } catch (error) {
      console.log('SSO ERROR', error);
      throw error;
    }
  }
  async getCustomer(): Promise<any> {
    const result = await this.CustomerRepository.findOne(
      'f364f4cc-6934-4c83-a156-f00b8bcd3ba6',
    );
    console.log(result);
  }
}
