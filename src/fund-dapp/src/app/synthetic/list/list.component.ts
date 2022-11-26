import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AssetTypes } from '@core/models/asset-allocation';
import { SyntheticAsset } from '@core/models/synthetic-asset';
import { Web3Service } from '@core/services/web3.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  isLoading = true;
  isSubmitting = false;
  displayedColumns: string[] = [
    'name',
    'address',
    'totalSupply',
    'decimals',
    'actions',
  ];
  dataSource: MatTableDataSource<SyntheticAsset> =
    new MatTableDataSource<SyntheticAsset>();

  constructor(private web3: Web3Service, private router: Router) {}

  async ngOnInit() {
    this.dataSource.data = await this.getSynthetics();
    this.isLoading = false;
  }

  showDetails(address: string) {
    this.router.navigate(['synthetic', address]);
  }

  async getSynthetics(): Promise<SyntheticAsset[]> {
    const assetCount = await this.web3.getAssetCount();
    const synthetics: SyntheticAsset[] = [];

    for (let i = 1; i < assetCount; i++) {
      const address = await this.web3.getAssetAddress(i);
      const asset = await this.web3.getAsset(address);
      if (asset.assetType !== AssetTypes.Synthetic) {
        continue;
      }

      const syntheticBasics = await this.web3.getSyntheticAssetBasics(address);
      const synthetic: SyntheticAsset = {
        name: syntheticBasics.name,
        symbol: syntheticBasics.symbol,
        totalSupply: syntheticBasics.totalSupply,
        companyId: syntheticBasics.companyId,
        companyName: syntheticBasics.companyName,
        depotId: syntheticBasics.depotId,
        address: address,
        decimals: syntheticBasics.decimals,
      };
      synthetics.push(synthetic);
    }

    return synthetics;
  }
}
