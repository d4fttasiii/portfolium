import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ManagerAccount } from '@core/models/manager-account';
import { Web3Service } from '@core/services/web3.service';

import { AddManagerDialog } from '../shared/add-manager-dialog/add-manager-dialog.component';

@Component({
  selector: 'app-reserve',
  templateUrl: './reserve.component.html',
  styleUrls: ['./reserve.component.scss']
})
export class ReserveComponent implements OnChanges {

  @Input() accessingAccounts: ManagerAccount[];
  @Output() loadingChanged = new EventEmitter<boolean>();

  displayedColumns = ['position', 'address', 'action'];
  public dataSource: MatTableDataSource<ManagerAccount> =
    new MatTableDataSource<ManagerAccount>();

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private web3Service: Web3Service,) { }

  ngOnChanges(): void {
    this.updateTable();
  }


  openDialog() {
    const dialogRef = this.dialog.open(AddManagerDialog);

    dialogRef.afterClosed().subscribe(async (result: string) => {
      if (result) {
        await this.addAccessingAccount(result);
      }
    });
  }

  toggleActive(account: ManagerAccount) { }

  async addAccessingAccount(address: string) {
    this.loadingChanged.emit(true);
    const account = {
      address: address,
      isActive: true,
    };
    this.accessingAccounts.push(account);
    await this.web3Service.addManager(account);
    this.updateTable();
    this.loadingChanged.emit(false);
    this.snackBar.open('Accessing account added!', 'OK', { duration: 1500 });
  }

  private updateTable() {
    this.dataSource.data = this.accessingAccounts;
  }

}
