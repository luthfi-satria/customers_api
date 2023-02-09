import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { Repository, Like } from 'typeorm';
import {
  UpdateContactDto,
  UpdateLimitCreateOrderTicketDto,
  UpdatePrivacyPolicyDto,
  UpdateTosDto,
} from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingDocument)
    private readonly settingRepository: Repository<SettingDocument>,
  ) {}

  async findByName(name: string): Promise<SettingDocument> {
    return this.settingRepository.findOne({ name: name });
  }

  async getSettings(): Promise<SettingDocument[]> {
    return this.settingRepository.find();
  }

  async getSettingsByNamePattern(pattern: string): Promise<SettingDocument[]> {
    return this.settingRepository.find({
      where: {
        name: Like('%' + pattern + '%'),
      },
    });
  }

  async updateSettings(data: SettingDocument[]): Promise<SettingDocument[]> {
    try {
      return await this.settingRepository.save(data);
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'Update Settings');
      throw e;
    }
  }

  async updateSettingByName(id: string, data: any): Promise<SettingDocument> {
    const setting = await this.settingRepository.findOne({
      where: { name: id },
    });
    setting.value = data;
    return this.settingRepository.save(setting);
  }

  async updateSettingByNames(
    data:
      | UpdateContactDto
      | UpdatePrivacyPolicyDto
      | UpdateTosDto
      | UpdateLimitCreateOrderTicketDto,
  ): Promise<SettingDocument[]> {
    const listResult = [];

    for (const key in data) {
      const setting = await this.settingRepository.findOne({
        where: { name: key },
      });
      setting.value = data[key];
      const resultSetting = await this.settingRepository.save(setting);
      listResult.push(resultSetting);
    }
    return listResult;
  }
}
