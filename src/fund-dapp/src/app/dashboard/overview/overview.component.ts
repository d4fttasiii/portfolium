import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { AssetAllocation, AssetTypes } from '@core/models/asset-allocation';
import { Web3Service } from '@core/services/web3.service';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { DashboardDetails } from '../models/dashboard-details';
import { environment } from './../../../environments/environment';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit {
  isLoading = true;
  isContractLoading = true;
  isSubmitting = false;
  fundProperties: DashboardDetails;
  AssetTypes = AssetTypes;
  currency: string;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  // Pie
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        maxWidth: 400,
        title: {
          text: 'Index Allocation',
        },
      },
    },
  };
  public pieChartData: ChartData<'pie', number[], string | string[]>;

  // Bar
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {},
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: true,
      },
    },
  };
  public barChartData: ChartData<'bar'>;

  public displayedColumns: string[] = [
    'position',
    'name',
    'address',
    'perShareAmount',
    'assetType',
    'price',
    'weight',
  ];
  public dataSource: MatTableDataSource<AssetAllocation> =
    new MatTableDataSource<AssetAllocation>();

  constructor(private web3: Web3Service) {
    this.currency = environment.currency;
  }

  async ngOnInit() {
    this.isLoading = false;
    this.isContractLoading = true;
    this.fundProperties = await this.getDashboardDetails();
    // const allocationSum = this.fundProperties.assets.map(a => a.allocation).reduce((a,b) => a+b);
    this.pieChartData = {
      labels: this.fundProperties.assets.map((a) => `${a.name} (${a.symbol})`),
      datasets: [
        {
          data: this.fundProperties.assets.map((a) => a.weight),
          backgroundColor: [
            'rgba(255, 99, 132, 1.0)',
            'rgba(54, 162, 235, 1.0)',
            'rgba(75, 192, 192, 1.0)',
            'rgba(255, 205, 86, 1.0)',
            'rgba(255, 159, 64, 1.0)',
          ],
        },
      ],
    };
    this.barChartData = {
      labels: this.fundProperties.assets.map((a) => `${a.name} (${a.symbol})`),
      datasets: [
        {
          data: this.fundProperties.assets.map(
            (a) => (a.perShareAmount / Math.pow(10, a.decimals)) * a.price,
          ),
          backgroundColor: [
            'rgba(255, 99, 132, 1.0)',
            'rgba(54, 162, 235, 1.0)',
            'rgba(75, 192, 192, 1.0)',
            'rgba(255, 205, 86, 1.0)',
            'rgba(255, 159, 64, 1.0)',
          ],
        },
      ],
    };
    this.dataSource.data = this.fundProperties.assets.sort((a, b) =>
      a.weight > b.weight ? -1 : 1,
    );
    setTimeout(() => {
      this.isContractLoading = false;
    }, 1500);
  }

  async getDashboardDetails(): Promise<DashboardDetails> {
    const ownerAddress = await this.web3.getOwnerAddress();
    const treasuryAddress = await this.web3.getTreasuryAddress();
    const oracleAddress = await this.web3.getOracleAddress();
    const properties = await this.web3.getFundProperties();
    const shareholderCount = await this.web3.getShareholderCount();
    const assetCount = await this.web3.getAssetCount();
    const totalSupply = await this.web3.getTotalSupply();
    const sharePrice = await this.web3.getSharePrice();
    const reserveBalance = await this.web3.getNativeBalance(environment.contracts.reserve);

    const assets: AssetAllocation[] = [];
    for (let i = 0; i < assetCount; i++) {
      const address = await this.web3.getAssetAddress(i);
      const asset = await this.web3.getAsset(address);
      asset.price = await this.web3.getAssetPrice(address);

      assets.push(asset);
    }

    return {
      fundAddress: environment.contracts.fund,
      ownerAddress: ownerAddress,
      treasuryAddress: treasuryAddress,
      oracleAddress: oracleAddress,
      isLocked: properties.isLocked,
      totalSupply: totalSupply,
      numberOfAssets: assetCount,
      rebalancingTolerance: properties.rebalancingTolerance,
      numberOfShareholders: shareholderCount,
      assets: assets,
      sharePrice: parseFloat(sharePrice),
      reserveBalance: this.web3.web3js.utils.fromWei(reserveBalance, 'ether'),
    };
  }
}
