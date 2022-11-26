import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

import { TradingRoutingModule } from './trading-routing.module';
import { TradeComponent } from './trade/trade.component';

@NgModule({
  declarations: [TradeComponent],
  imports: [CommonModule, SharedModule, TradingRoutingModule],
})
export class TradingModule {}
