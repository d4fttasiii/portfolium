import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TestRoutingModule } from './test-routing.module';
import { TestComponent } from './test/test.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [TestComponent],
  imports: [CommonModule, SharedModule, TestRoutingModule],
})
export class TestModule {}
