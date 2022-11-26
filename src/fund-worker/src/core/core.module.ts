import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { FundyConfig } from './config/configuration';
import { RedisService } from './services/redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [FundyConfig],
      isGlobal: false,
    }),
    // MongooseModule.forRootAsync({
    //   useFactory: (cfgService: ConfigService) => {
    //     const cfg = cfgService.get<MongoDbConfig>('mongoDb');

    //     return {
    //       uri: cfg.endpoint,
    //       useNewUrlParser: true,
    //       autoCreate: true,
    //       ssl: cfg.ssl,
    //       dbName: cfg.dbName,
    //     };
    //   },
    //   inject: [ConfigService],
    // }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class CoreModule {}
