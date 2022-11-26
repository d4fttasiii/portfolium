import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Web3Service } from '@core/services/web3.service';
import { interval, Subscription } from 'rxjs';

import { environment } from './../../../environments/environment';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss'],
})
export class TradeComponent implements OnInit, OnDestroy {
  isLoading = true;
  isSubmitting = false;
  priceLoading = false;
  shareCount: number;
  sharePrice: string;
  currency: string;
  private pollingSub: Subscription;

  constructor(private web3: Web3Service, private snackBar: MatSnackBar) {
    this.currency = environment.currency;
  }

  async ngOnInit() {
    await this.getSharePrice();
    this.isLoading = false;
    this.pollingSub = interval(15000)
      .pipe()
      .subscribe(async () => await this.getSharePrice());
  }

  ngOnDestroy(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }

  async getSharePrice() {
    this.priceLoading = true;
    this.sharePrice = await this.web3.getSharePrice();
    this.priceLoading = false;
  }

  async buyShares() {
    this.isSubmitting = true;
    await this.web3.buyShares(this.shareCount);
    this.isSubmitting = false;
    this.snackBar.open('Shares purchased!', 'OK', { duration: 2500 });
  }

  async sellShares() {
    this.isSubmitting = true;
    await this.web3.sellShares(this.shareCount);
    this.isSubmitting = false;
    this.snackBar.open('Shares sold!', 'OK', { duration: 2500 });
  }
}
