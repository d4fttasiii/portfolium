import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import {
  SyntheticAsset,
  SyntheticAssetOrder,
} from '@core/models/synthetic-asset';
import { Web3Service } from '@core/services/web3.service';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
  title: string;
  isLoading = true;
  isLoadingMore = true;
  isSubmitting = false;
  synthetic: SyntheticAsset;
  take = 5;
  address: string;

  buyOrderDataSource = new MatTableDataSource<SyntheticAssetOrder>();
  sellOrderDataSource = new MatTableDataSource<SyntheticAssetOrder>();
  displayedColumns: string[] = ['position', 'amount', 'times', 'state'];
  currency: string;
  sellTo: number;
  buyTo: number;

  constructor(
    private web3: Web3Service,
    private activatedRoute: ActivatedRoute,
  ) {
    this.currency = environment.currency;
  }

  async ngOnInit() {
    const params = await firstValueFrom(this.activatedRoute.params);
    await this.getSyntheticDetails(params['address']);
    this.isLoading = false;
  }

  async getSyntheticDetails(address: string) {
    const syntheticBasics = await this.web3.getSyntheticAssetBasics(address);
    this.title = `Synthetic: ${syntheticBasics.name} (${syntheticBasics.symbol})`;

    const buyOrderCount = await this.web3.getBuyOrderCount(address);
    const sellOrderCount = await this.web3.getSellOrderCount(address);
    const balance = await this.web3.getNativeBalance(address);
    this.synthetic = {
      name: syntheticBasics.name,
      symbol: syntheticBasics.symbol,
      totalSupply: syntheticBasics.totalSupply,
      companyId: syntheticBasics.companyId,
      companyName: syntheticBasics.companyName,
      depotId: syntheticBasics.depotId,
      address: address,
      buyOrders: [],
      sellOrders: [],
      price: await this.web3.getAssetPrice(address),
      decimals: syntheticBasics.decimals,
      nativeBalance: this.web3.web3js.utils.fromWei(balance, 'ether'),
    };
    const maxBuyIndex = buyOrderCount - 1;
    const maxSellIndex = sellOrderCount - 1;
    this.buyTo = maxBuyIndex > this.take ? maxBuyIndex - this.take : 0;
    this.sellTo = maxSellIndex > this.take ? maxSellIndex - this.take : 0;

    this.synthetic.buyOrders = await this.getBuyOrders(
      address,
      maxBuyIndex,
      this.buyTo,
    );
    this.synthetic.sellOrders = await this.getSellOrders(
      address,
      maxSellIndex,
      this.sellTo,
    );

    this.buyOrderDataSource.data = this.synthetic.buyOrders;
    this.sellOrderDataSource.data = this.synthetic.sellOrders;
  }

  async loadMoreBuys() {
    this.isLoadingMore = true;
    const nextBuyTo = this.buyTo > this.take ? this.buyTo - this.take : 0;
    const orders = await this.getBuyOrders(
      this.synthetic.address,
      this.buyTo - 1,
      nextBuyTo,
    );
    this.synthetic.buyOrders.push(...orders);
    this.buyOrderDataSource.data = this.synthetic.buyOrders;
    this.buyTo = nextBuyTo;
    this.isLoadingMore = false;
  }

  async loadMoreSells() {
    this.isLoadingMore = true;
    const nextSellTo = this.buyTo > this.take ? this.sellTo - this.take : 0;
    const orders = await this.getSellOrders(
      this.synthetic.address,
      this.sellTo - 1,
      nextSellTo,
    );
    this.synthetic.sellOrders.push(...orders);
    this.sellOrderDataSource.data = this.synthetic.sellOrders;
    this.sellTo = nextSellTo;
    this.isLoadingMore = false;
  }

  private async getBuyOrders(
    address: string,
    from: number,
    to: number,
  ): Promise<SyntheticAssetOrder[]> {
    if (from < 0) {
      return [];
    }
    const orders: SyntheticAssetOrder[] = [];
    for (let i = from; i >= to; i--) {
      const order = await this.web3.getBuyOrder(address, i);
      orders.push(order);
    }

    return orders;
  }

  private async getSellOrders(
    address: string,
    from: number,
    to: number,
  ): Promise<SyntheticAssetOrder[]> {
    if (from < 0) {
      return [];
    }
    const orders: SyntheticAssetOrder[] = [];
    for (let i = to; i >= from; i--) {
      const order = await this.web3.getSellOrder(address, i);
      orders.push(order);
    }

    return orders;
  }
}
