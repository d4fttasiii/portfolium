import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

import { ListComponent } from './list/list.component';
import { TreasuryRoutingModule } from './treasury-routing.module';

@NgModule({
  declarations: [ListComponent],
  imports: [CommonModule, SharedModule, TreasuryRoutingModule],
})
export class TreasuryModule {}
