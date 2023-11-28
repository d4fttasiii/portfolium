import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HighchartsChartModule } from 'highcharts-angular';

import { SharedModule } from '../shared/shared.module';
import { AllocationComponent } from './allocation/allocation.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { MainComponent } from './main/main.component';
import { EventsComponent } from './events/events.component';

@NgModule({
  declarations: [AllocationComponent, MainComponent, EventsComponent],
  imports: [CommonModule, HighchartsChartModule, SharedModule, DashboardRoutingModule],
})
export class DashboardModule {}
