import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { AssetAllocation, AssetTypes } from '@core/models/asset-allocation';
import { Web3Service } from '@core/services/web3.service';

import { environment } from './../../../environments/environment';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  isLoading = true;
  isSubmitting = false;
  AssetTypes = AssetTypes;
  currency: string;

  displayedColumns: string[] = ['name', 'address', 'type', 'balance'];
  dataSource: MatTableDataSource<AssetAllocation> =
    new MatTableDataSource<AssetAllocation>();

  constructor(private web3: Web3Service) {
    this.currency = environment.currency;
  }

  async ngOnInit() {
    const data = await this.getTreasuryDetails();
    this.dataSource.data = data;
    this.isLoading = false;
  }

  async getTreasuryDetails(): Promise<AssetAllocation[]> {
    const assetCount = await this.web3.getAssetCount();
    const assets: AssetAllocation[] = [];
    for (let i = 0; i < assetCount; i++) {
      const address = await this.web3.getAssetAddress(i);
      const asset = await this.web3.getAsset(address);
      const balance = await this.web3.getTreasuryBalance(address);
      asset.balance =
        asset[5] == 0
          ? parseFloat(this.web3.web3js.utils.fromWei(balance, 'ether'))
          : parseInt(balance, 10) / Math.pow(10, asset.decimals);

      assets.push(asset);
    }

    return assets;
  }
}
