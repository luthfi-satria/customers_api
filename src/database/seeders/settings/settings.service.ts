import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingDocument } from 'src/database/entities/settings.entity';
import { Repository } from 'typeorm';
import { settings } from './settings.data';

@Injectable()
export class SettingsSeederService {
  constructor(
    @InjectRepository(SettingDocument)
    private readonly settingsRepository: Repository<SettingDocument>,
  ) {}
  async create(): Promise<Array<Promise<SettingDocument>>> {
    return Promise.all(
      settings.map(async (setting) => {
        const foundSetting = await this.settingsRepository.findOne({
          where: { name: setting.name },
        });
        if (foundSetting) {
          return null;
        }
        try {
          await this.settingsRepository.save(setting);
        } catch (error) {
          Logger.error(error);
        }
      }),
    );
  }
}
