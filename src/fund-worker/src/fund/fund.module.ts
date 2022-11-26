import { CoreModule } from '@core/core.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RebalancingTaskService } from './services/rebalancing-task.service';

@Module({
  imports: [CoreModule, ScheduleModule.forRoot()],
  providers: [RebalancingTaskService],
})
export class FundModule {}
