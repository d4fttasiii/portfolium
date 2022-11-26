import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  Output,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ShareHolderAccount } from '@core/models/share-holder-account';
import { Web3Service } from '@core/services/web3.service';

@Component({
  selector: 'app-share-holder-accounts',
  templateUrl: './share-holder-accounts.component.html',
  styleUrls: ['./share-holder-accounts.component.scss'],
})
export class ShareHolderAccountsComponent implements OnChanges {
  @Input() shareholders: ShareHolderAccount[];
  @Input() totalShareCount: number;
  @Output() loadingChanged = new EventEmitter<boolean>();

  displayedColumns = ['position', 'address', 'shares', 'percentage', 'action'];
  public dataSource: MatTableDataSource<ShareHolderAccount> =
    new MatTableDataSource<ShareHolderAccount>();

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private web3Service: Web3Service,
  ) {}

  ngOnChanges(): void {
    this.updateTable();
  }

  openDialog() {
    const dialogRef = this.dialog.open(AddShareholderDialog);

    dialogRef.afterClosed().subscribe(async (result: ShareHolderAccount) => {
      if (result) {
        this.addShareholder(result);
      }
    });
  }

  async addShareholder(newShareholder: ShareHolderAccount) {
    this.loadingChanged.emit(true);
    await this.web3Service.addShareholder(newShareholder.address);
    this.shareholders.push(newShareholder);
    this.updateTable();
    this.loadingChanged.emit(false);
    this.snackBar.open('Shareholder added!', 'OK', { duration: 1500 });
  }

  toggleLock(shareholder: ShareHolderAccount) {
    shareholder.isLocked = !shareholder.isLocked;
  }

  private updateTable() {
    this.dataSource.data = this.shareholders;
  }
}

@Component({
  selector: 'add-shareholder-dialog',
  templateUrl: 'add-shareholder-dialog.html',
})
export class AddShareholderDialog {
  data: ShareHolderAccount;

  constructor(public dialogRef: MatDialogRef<AddShareholderDialog>) {
    this.data = { address: '', shares: 0 };
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
