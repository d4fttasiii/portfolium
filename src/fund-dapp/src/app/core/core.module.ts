import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Web3Service } from './services/web3.service';
import { CachingService } from './services/caching.service';

@NgModule({
  providers: [Web3Service, CachingService],
  imports: [CommonModule],
})
export class CoreModule {}
