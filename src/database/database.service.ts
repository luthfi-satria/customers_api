import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      name: 'default',
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: Boolean(process.env.DB_SYNC),
      dropSchema: Boolean(process.env.DB_DROP_SCHEMA),
      logging: Boolean(process.env.DB_LOGGING),
      autoLoadEntities: Boolean(process.env.DB_AUTOLOAD_ENTITIES),
      entities: ['dist/**/*.entity.ts', 'dist/**/**/*.entity.ts'],
    };
  }
}
