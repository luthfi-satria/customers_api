import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { SettingDocument } from 'src/database/entities/settings.entity';
import { SettingsService } from 'src/settings/settings.service';
import { SsoService } from './sso.service';
import { SsoController } from './sso.controller';
import { HttpModule, HttpModule as HttpModuleAxios } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileDocument, SettingDocument]),
    HttpModuleAxios,
    HttpModule,
    ScheduleModule.forRoot(),
  ],

  providers: [SettingsService, SsoService],

  controllers: [SsoController],
})
export class SsoModule {}
