import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { OracleAssetSettings } from '@core/models/oracle-asset-settings';
import { PriceOrigin } from '@core/models/price-origin';
import { Web3Service } from '@core/services/web3.service';

@Component({
  selector: 'app-oracle',
  templateUrl: './oracle.component.html',
  styleUrls: ['./oracle.component.scss']
})
export class OracleComponent implements OnChanges {
  @Input() oracleAssetSettings: OracleAssetSettings[];
  @Output() loadingChanged = new EventEmitter<boolean>();
  displayedColumns: string[] = [
    'name',
    'address',
    'priceOrigin',
    'chainlinkAddress',
    'actions',
  ];
  dataSource: MatTableDataSource<OracleAssetSettings> =
    new MatTableDataSource<OracleAssetSettings>();
  PriceOrigin = PriceOrigin;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private web3: Web3Service,
  ) { }

  ngOnChanges(): void {
    this.updateTable();
  }

  openEditPriceOriginDialog(address: string) {
    const dialogRef = this.dialog.open(EditPriceOriginDialog);
    dialogRef.afterClosed().subscribe(async (data) => {
      if (data) {
        await this.editPriceOrigin(address, data.priceOrigin);
      }
    });
  }

  openEditChainlinkAddressDialog(address: string) {
    const dialogRef = this.dialog.open(EditPriceOriginDialog);
    dialogRef.afterClosed().subscribe(async (data) => {
      if (data) {
        await this.editChainlinkAddress(address, data.address);
      }
    });
  }

  private updateTable() {
    this.dataSource.data = this.oracleAssetSettings;
  }

  private async editPriceOrigin(address: string, newPriceOrigin: PriceOrigin) {

    this.loadingChanged.emit(true);
    await this.web3.setPriceOrigin(address, newPriceOrigin);
    this.loadingChanged.emit(false);
    this.snackBar.open('Price origin updated!', 'OK', { duration: 1500 });
  }

  private async editChainlinkAddress(
    address: string,
    newChainlinkAddress: string,
  ) {
    this.loadingChanged.emit(true);
    await this.web3.setChainlinkPriceFeedAddress(address, newChainlinkAddress);
    this.loadingChanged.emit(false);
    this.snackBar.open('Chainlink address updated!', 'OK', { duration: 1500 });
  }

}


@Component({
  selector: 'edit-price-origin-dialog',
  templateUrl: 'edit-price-origin-dialog.html',
})
export class EditPriceOriginDialog {
  PriceOrigin = PriceOrigin;
  data: any;

  constructor(public dialogRef: MatDialogRef<EditPriceOriginDialog>) {
    this.data = {
      priceOrigin: PriceOrigin.Stored,
    };
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'edit-chainlink-address-dialog',
  templateUrl: 'edit-chainlink-address-dialog.html',
})
export class EditChainlinkAddressDialog {
  data: any;

  constructor(public dialogRef: MatDialogRef<EditChainlinkAddressDialog>) {
    this.data = {
      address: '',
    };
  }

  cancel(): void {
    this.dialogRef.close();
  }
}