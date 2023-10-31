import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { seeds1671015219018 } from './migrations/1671015219018-seeds';

export function getOrmConfig(): TypeOrmModuleOptions {
  const ormConfig: TypeOrmModuleOptions = {
    type: 'sqlite',
    database: ':memory:',
    logging: 'all',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [seeds1671015219018],
    migrationsRun: true,
    // synchronize: settings.synchronize || false,
    extra: {
      connectionLimit: 15,
    },
  };
  return ormConfig;
}
