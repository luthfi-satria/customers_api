import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';
import { CustomersModule } from './customers/customers.module';
import { AddressModule } from './address/address.module';
import { CommonModule } from './common/common.module';
import { InternalModule } from './internal/internal.module';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from './auth/auth.module';
import { ReportsModule } from './reports/reports.module';
// import { SsoModule } from './sso/sso.module';
// import { SeederModule } from './database/seeders/seeder.module';
// import { SettingModule } from './settings/setting.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    // SeederModule,
    CustomersModule,
    HttpModule,
    // SettingModule,
    AddressModule,
    CommonModule,
    InternalModule,
    AuthModule,
    ReportsModule,
    // SsoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
