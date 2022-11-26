import { environment } from './../../../environments/environment';
import { Component, Input, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { SyntheticAssetOrder } from '@core/models/synthetic-asset';

enum Order {
  Buy,
  Sell,
}

@Component({
  selector: 'app-synthetic-card',
  templateUrl: './synthetic-card.component.html',
  styleUrls: ['./synthetic-card.component.scss'],
})
export class SyntheticCardComponent implements OnInit {
  @Input() name: string;
  @Input() symbol: string;
  @Input() address: string;
  @Input() price: number;
  @Input() nativeBalance: string;
  @Input() buyOrders?: SyntheticAssetOrder[];
  @Input() sellOrders?: SyntheticAssetOrder[];

  displayedColumns: string[] = ['position', 'amount', 'times', 'state'];
  dataSource = new MatTableDataSource<SyntheticAssetOrder>();
  currency: string;

  constructor() {
    this.currency = environment.currency;
  }

  ngOnInit(): void {
    this.loadOrders(0);
  }

  loadOrders(order: Order) {
    this.dataSource.data =
      order === Order.Buy ? this.buyOrders : this.sellOrders;
  }
}
