import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

import { AddAssetDialog, AssetAllocationComponent } from './asset-allocation/asset-allocation.component';
import { ContractPropertiesComponent } from './contract-properties/contract-properties.component';
import { ManagerAccountsComponent } from './manager-accounts/manager-accounts.component';
import { ManagerRoutingModule } from './manager-routing.module';
import { ManagerComponent } from './manager/manager.component';
import { EditChainlinkAddressDialog, EditPriceOriginDialog, OracleComponent } from './oracle/oracle.component';
import { AddShareholderDialog, ShareHolderAccountsComponent } from './share-holder-accounts/share-holder-accounts.component';
import { ReserveComponent } from './reserve/reserve.component';
import { AddManagerDialog } from './shared/add-manager-dialog/add-manager-dialog.component';

@NgModule({
  declarations: [
    ManagerComponent,
    ContractPropertiesComponent,
    AssetAllocationComponent,
    ManagerAccountsComponent,
    ShareHolderAccountsComponent,
    AddAssetDialog,
    AddShareholderDialog,
    AddManagerDialog,
    OracleComponent,
    EditChainlinkAddressDialog,
    EditPriceOriginDialog,
    ReserveComponent,
  ],
  imports: [CommonModule, SharedModule, ManagerRoutingModule],
})
export class ManagerModule { }
