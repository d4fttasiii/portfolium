import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { AssetAllocation, AssetTypes } from '@core/models/asset-allocation';
import { Web3Service } from '@core/services/web3.service';

@Component({
  selector: 'app-asset-allocation',
  templateUrl: './asset-allocation.component.html',
  styleUrls: ['./asset-allocation.component.scss'],
})
export class AssetAllocationComponent implements OnChanges {
  @Input() allocation: AssetAllocation[];
  @Output() loadingChanged = new EventEmitter<boolean>();

  displayedColumns = [
    'position',
    'address',
    'name',
    'weight',
    'perShareAmount',
  ];
  dataSource: MatTableDataSource<AssetAllocation> =
    new MatTableDataSource<AssetAllocation>();

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private web3: Web3Service,
  ) {}

  ngOnChanges(): void {
    this.updateTable();
  }

  updateAssetWeight(event: any, allocation: AssetAllocation) {
    allocation.weight = event.value;
  }

  openDialog() {
    const dialogRef = this.dialog.open(AddAssetDialog);

    dialogRef.afterClosed().subscribe(async (result: AssetAllocation) => {
      if (result) {
        await this.addAsset(result);
      }
    });
  }

  async addAsset(newAsset: AssetAllocation) {
    this.loadingChanged.emit(true);
    await this.web3.addAsset(newAsset);
    this.allocation.push(newAsset);
    this.updateTable();
    this.loadingChanged.emit(false);
  }

  removeAsset(i: number) {
    this.allocation.splice(i, 1);
    this.updateTable();
  }

  async submitWeightChanges() {
    this.loadingChanged.emit(true);
    const weightSum = this.allocation
      .map((a) => a.weight)
      .reduce((a, b) => a + b);
    if (weightSum !== 10000) {
      this.snackBar.open('The sum of weights should be 100%', 'OK', {
        duration: 1000,
      });
      return;
    }
    await this.web3.updateWeights(this.allocation);
    this.snackBar.open('Weights updated!', 'OK', { duration: 1500 });
    this.loadingChanged.emit(false);
  }

  async submitAmountChanges() {
    // const orderedAllocations = this.allocation.sort((a, b) => a.)
    await this.web3.updateMultipleAllocations(this.allocation);
    this.snackBar.open('Per share amounts updated!', 'OK', { duration: 1500 });
  }

  private updateTable() {
    this.dataSource.data = this.allocation;
  }
}

@Component({
  selector: 'add-asset-dialog',
  templateUrl: 'add-asset-dialog.html',
})
export class AddAssetDialog {
  data: AssetAllocation;
  AssetTypes = AssetTypes;

  constructor(
    public dialogRef: MatDialogRef<AddAssetDialog>,
    private readonly web3: Web3Service,
  ) {
    this.data = {
      address: '',
      name: '',
      symbol: '',
      perShareAmount: 0,
      assetType: AssetTypes.Synthetic,
      weight: 0,
      decimals: 18,
    };
  }

  async loadAssetDetails() {
    if (!this.data.address) {
      return;
    }

    try {
      switch (this.data.assetType) {
        case AssetTypes.Synthetic:
          const synDetails = await this.web3.getSyntheticAssetBasics(
            this.data.address,
          );
          this.data.name = synDetails.name;
          this.data.symbol = synDetails.symbol;
          this.data.decimals = synDetails.decimals;
          break;
        case AssetTypes.Mirrored:
          const mirroredDetails = await this.web3.getMirroredAssetBasic(
            this.data.address,
          );
          this.data.name = mirroredDetails.name;
          this.data.symbol = mirroredDetails.symbol;
          this.data.decimals = mirroredDetails.decimals;
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(err);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
