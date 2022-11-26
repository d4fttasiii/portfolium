import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { AssetTypes } from '@core/models/asset-allocation';
import {
  MirroredAsset,
  MirroredAssetBasics,
} from '@core/models/mirrored-asset';
import { Web3Service } from '@core/services/web3.service';
import { interval, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

interface BuySellDialogModel {
  address: string;
  commission: number;
  amount?: number;
  isBuy?: boolean;
}

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
    'price',
    'balance',
    'actions',
  ];
  currency = environment.currency;

  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();

  constructor(private web3: Web3Service, private dialog: MatDialog) {}

  async ngOnInit() {
    this.isLoading = true;
    await this.reloadData();
    this.isLoading = false;
  }

  openDialog(asset: MirroredAsset) {
    const dialogRef = this.dialog.open(BuySellAssetDialog, {
      data: { address: asset.address, commission: asset.commission },
    });

    dialogRef.afterClosed().subscribe(async (result: BuySellDialogModel) => {
      if (result.isBuy) {
        await this.buy(asset.address, asset.decimals, result.amount);
      } else {
        await this.sell(asset.address, asset.decimals, result.amount);
      }
      await this.reloadData();
    });
  }

  private async buy(address: string, decimals: number, amount: number) {
    this.isSubmitting = true;
    await this.web3.buyMirroredAsset(address, amount * Math.pow(10, decimals));
    this.isSubmitting = false;
  }

  private async sell(address: string, decimals: number, amount: number) {
    this.isSubmitting = true;
    await this.web3.sellMirroredAsset(address, amount * Math.pow(10, decimals));
    this.isSubmitting = false;
  }

  private async reloadData() {
    this.dataSource.data = await this.getMirroredAssets();
  }

  private async getMirroredAssets(): Promise<MirroredAssetBasics[]> {
    const assetCount = await this.web3.getAssetCount();
    const mirrored: MirroredAsset[] = [];

    for (let i = 1; i < assetCount; i++) {
      const address = await this.web3.getAssetAddress(i);
      const asset = await this.web3.getAsset(address);
      if (asset.assetType !== AssetTypes.Mirrored) {
        continue;
      }

      const basics = (await this.web3.getMirroredAssetBasic(
        address,
      )) as MirroredAsset;
      basics.price = await this.web3.getAssetPrice(address);
      basics.userBalance =
        parseFloat(await this.web3.getMirroredAssetBalance(address)) /
        Math.pow(10, basics.decimals);

      mirrored.push(basics);
    }

    return mirrored;
  }
}

@Component({
  selector: 'buy-sell-asset-dialog',
  templateUrl: 'buy-sell-asset-dialog.html',
})
export class BuySellAssetDialog implements OnInit, OnDestroy {
  private pollingSub: Subscription;
  priceLoading: boolean;
  currency = environment.currency;
  commission: string;
  price: number;

  constructor(
    public dialogRef: MatDialogRef<BuySellAssetDialog>,
    @Inject(MAT_DIALOG_DATA) public data: BuySellDialogModel,
    private readonly web3: Web3Service,
  ) {}

  async ngOnInit() {
    await this.getPrice();
    this.pollingSub = interval(15000)
      .pipe()
      .subscribe(async () => await this.getPrice());
  }

  async getPrice() {
    this.priceLoading = true;
    this.price = await this.web3.getAssetPrice(this.data.address);
    this.priceLoading = false;
  }

  buy() {
    this.data.isBuy = true;
    this.dialogRef.close(this.data);
  }

  sell() {
    this.data.isBuy = false;
    this.dialogRef.close(this.data);
  }

  cancel() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }
}
