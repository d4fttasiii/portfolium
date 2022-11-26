import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ManagerAccount } from '@core/models/manager-account';
import { Web3Service } from '@core/services/web3.service';
import { AddManagerDialog } from '@manager/shared/add-manager-dialog/add-manager-dialog.component';

@Component({
  selector: 'app-manager-accounts',
  templateUrl: './manager-accounts.component.html',
  styleUrls: ['./manager-accounts.component.scss'],
})
export class ManagerAccountsComponent implements OnChanges {
  @Input() managerAccounts: ManagerAccount[];
  @Output() loadingChanged = new EventEmitter<boolean>();

  displayedColumns = ['position', 'address', 'action'];
  public dataSource: MatTableDataSource<ManagerAccount> =
    new MatTableDataSource<ManagerAccount>();

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private web3Service: Web3Service,
  ) {}

  ngOnChanges(): void {
    this.updateTable();
  }

  openDialog() {
    const dialogRef = this.dialog.open(AddManagerDialog);

    dialogRef.afterClosed().subscribe(async (result: string) => {
      if (result) {
        await this.addManager(result);
      }
    });
  }

  async addManager(address: string) {
    this.loadingChanged.emit(true);
    const manager = {
      address: address,
      isActive: true,
    };
    this.managerAccounts.push(manager);
    await this.web3Service.addManager(manager);
    this.updateTable();
    this.loadingChanged.emit(false);
    this.snackBar.open('Manager added!', 'OK', { duration: 1500 });
  }

  toggleActive(manager: ManagerAccount) {
    manager.isActive = !manager.isActive;
  }
  
  private updateTable() {
    this.dataSource.data = this.managerAccounts;
  }
}
