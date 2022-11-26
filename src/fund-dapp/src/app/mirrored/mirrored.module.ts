import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MirroredRoutingModule } from './mirrored-routing.module';
import { BuySellAssetDialog, ListComponent } from './list/list.component';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [ListComponent, BuySellAssetDialog],
  imports: [CommonModule, SharedModule, MirroredRoutingModule],
})
export class MirroredModule {}
