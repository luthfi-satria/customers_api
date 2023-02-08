import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { DatabaseService } from '../database.service';
import { SettingDocument } from '../entities/settings.entity';
import { Seeder } from './seeder';
import { SettingsSeederModule } from './settings/settings.module';
import { SettingsSeederService } from './settings/settings.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([SettingDocument]),
    // TypeOrmModule.forRootAsync({
    //   useClass: DatabaseService,
    // }),
    SettingsSeederModule,
  ],
  providers: [Logger, Seeder, SettingsSeederService],
})
export class SeederModule {}