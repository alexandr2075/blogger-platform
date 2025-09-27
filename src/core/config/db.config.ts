import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export interface DatabaseConfig {
  database: TypeOrmModuleOptions;
}

export default (): DatabaseConfig => ({
  database: {
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT) || 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    autoLoadEntities: true,
    synchronize: false,
    migrations: process.env.NODE_ENV === 'testing' ? [] : ['dist/migrations/*.js'],
    migrationsRun: false,
  } as TypeOrmModuleOptions,
});