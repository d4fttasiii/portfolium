import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OracleModule } from './oracle/oracle.module';
import { CoreModule } from './core/core.module';
import { FundyConfig } from './core/config/configuration';
import { IndexerModule } from './indexer/indexer.module';
import { SyntheticModule } from './synthetic/synthetic.module';
import { FundModule } from './fund/fund.module';

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      load: [FundyConfig],
      isGlobal: true,
    }),
    // OracleModule,
    SyntheticModule,
    FundModule,
    IndexerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
