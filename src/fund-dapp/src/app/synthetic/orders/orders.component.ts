import { Component, OnInit } from '@angular/core';
import { AssetTypes } from '@core/models/asset-allocation';
import { SyntheticAsset } from '@core/models/synthetic-asset';
import { Web3Service } from '@core/services/web3.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit {
  isLoading = true;
  isSubmitting = false;
  data: SyntheticAsset[] = [];
  private orderLimit = 4;

  constructor(private web3: Web3Service) {}

  async ngOnInit() {
    this.data = await this.getSyntheticDetails();
    this.isLoading = false;
  }

  async getSyntheticDetails(): Promise<SyntheticAsset[]> {
    const assetCount = await this.web3.getAssetCount();
    const syntheticDetails: SyntheticAsset[] = [];

    for (let i = 0; i < assetCount; i++) {
      const address = await this.web3.getAssetAddress(i);
      const asset = await this.web3.getAsset(address);
      if (asset.assetType !== AssetTypes.Synthetic) {
        continue;
      }

      const syntheticBasics = await this.web3.getSyntheticAssetBasics(address);
      const balance = await this.web3.getNativeBalance(address);
      const synthetic: SyntheticAsset = {
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

      const buyOrderCount = await this.web3.getBuyOrderCount(address);
      const maxBuyIndex = buyOrderCount - 1;
      for (
        let j = maxBuyIndex;
        j >=
        (maxBuyIndex > this.orderLimit ? maxBuyIndex - this.orderLimit : 0);
        j--
      ) {
        const buyOrder = await this.web3.getBuyOrder(address, j);
        synthetic.buyOrders.push(buyOrder);
      }

      const sellOrderCount = await this.web3.getSellOrderCount(address);
      const maxSellIndex = sellOrderCount - 1;
      for (
        let j = maxSellIndex;
        j >=
        (maxSellIndex > this.orderLimit ? maxSellIndex - this.orderLimit : 0);
        j--
      ) {
        const sellOrder = await this.web3.getSellOrder(address, j);
        synthetic.sellOrders.push(sellOrder);
      }

      syntheticDetails.push(synthetic);
    }

    return syntheticDetails;
  }
}
