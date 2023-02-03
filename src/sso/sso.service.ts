import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom, map } from 'rxjs';
import { AdminsDocument } from 'src/database/entities/admins.entity';
import { SettingsService } from 'src/settings/settings.service';
import { generateDatabaseDateTime } from 'src/utils/general-utils';
import { Brackets, Repository } from 'typeorm';
@Injectable()
export class SsoService {
  constructor(
    private readonly settingRepo: SettingsService,
    @InjectRepository(AdminsDocument)
    private readonly adminRepository: Repository<AdminsDocument>,
    private readonly httpService: HttpService,
  ) {}
  cronConfigs = {
    // enable or disabled process
    sso_process: 0,
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
          this.logger.log('SSO -> ADMINS CONFIGS');
          await this.getAdminsConfig();
        }
        this.cronConfigs.iteration++;
        if (this.cronConfigs.sso_process) {
          this.logger.log('SSO -> SYNC IS STARTED');
          const syncAdmin = await this.getAdmins();
          if (
            this.cronConfigs.total_data > 0 &&
            this.cronConfigs.offset >= this.cronConfigs.total_data
          ) {
            this.logger.log('ELASTIC -> UPDATE CONFIGS');
            await this.updateSettings();
          }
          const callback = {
            syncAdmins: syncAdmin,
          };
          // console.log(callback, '<= Sync status');
          return callback;
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
  async getAdminsConfig() {
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

  async getAdmins() {
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
        '<= ELASTIC - CONFIG PROCESS',
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
    const queryData = this.adminRepository.createQueryBuilder('admins_profile');

    // .leftJoinAndSelect('merchant_store.menus', 'menus');
    if (this.cronConfigs.sso_lastupdate) {
      queryData.where(
        new Brackets((qb) => {
          qb.where('admins_profile.updated_at > :lastUpdate', {
            lastUpdate: this.cronConfigs.sso_lastupdate,
          });
          qb.orWhere('admins_profile.created_at > :lastUpdate', {
            lastUpdate: this.cronConfigs.sso_lastupdate,
          });
          qb.orWhere('admins_profile.deleted_at > :lastUpdate', {
            lastUpdate: this.cronConfigs.sso_lastupdate,
          });
        }),
      );
      queryData.orWhere('sso_id.admins_profile is null');
    }
    return queryData;
  }
  async getToken(): Promise<string> {
    const url = `${process.env.SSO_BASEURL}api/token/get`;
    const body = {
      name: process.env.SSO_CLIENT_NAME,
      secret_key: process.env.SSO_CLIENT_SECRET,
      device_id: 'adminservice',
      device_name: 'ADMINS_SERVICE',
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
}
