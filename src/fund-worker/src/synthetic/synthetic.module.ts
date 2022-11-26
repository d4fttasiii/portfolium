import { CoreModule } from './../core/core.module';
import { Module, OnModuleInit } from '@nestjs/common';
import { OrderTaskService } from './services/order-task.service';

@Module({
  imports: [CoreModule],
  providers: [OrderTaskService],
})
export class SyntheticModule implements OnModuleInit {
  constructor(private orderTask: OrderTaskService) {}

  async onModuleInit() {
    this.orderTask.startOrderEventMonitoring();
  }
}
