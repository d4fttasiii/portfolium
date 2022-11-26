import { SharedModule } from '@shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SyntheticRoutingModule } from './synthetic-routing.module';
import { OrdersComponent } from './orders/orders.component';
import { SyntheticCardComponent } from './synthetic-card/synthetic-card.component';
import { DetailsComponent } from './details/details.component';
import { ListComponent } from './list/list.component';

@NgModule({
  declarations: [
    OrdersComponent,
    SyntheticCardComponent,
    DetailsComponent,
    ListComponent,
  ],
  imports: [SharedModule, CommonModule, SyntheticRoutingModule],
})
export class SyntheticModule {}
