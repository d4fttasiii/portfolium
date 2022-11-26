import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { CoreModule } from '@core/core.module';
import { OracleTaskService } from './services/oracle-task.service';

@Module({
  imports: [CoreModule, ScheduleModule.forRoot()],
  providers: [OracleTaskService],
})
export class OracleModule {}
