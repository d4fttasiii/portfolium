import { Component, OnInit } from '@angular/core';
import { AssetAllocation } from '@core/models/asset-allocation';
import { ManagerAccount } from '@core/models/manager-account';
import { OracleAssetSettings } from '@core/models/oracle-asset-settings';
import { ShareHolderAccount } from '@core/models/share-holder-account';
import { Web3Service } from '@core/services/web3.service';
import { ManagerDetails } from '@manager/models/manager-details';

@Component({
  selector: 'app-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss'],
})
export class ManagerComponent implements OnInit {
  isLoading = true;
  isSubmitting = false;
  fundProperties: ManagerDetails;

  constructor(private web3: Web3Service) { }

  async ngOnInit() {
    await this.loadContractData();
  }

  async loadContractData() {
    this.fundProperties = await this.getManagerDetails();
    this.isLoading = false;
  }

  setIsSubmitting(state: boolean) {
    this.isSubmitting = state;
  }

  async getManagerDetails(): Promise<ManagerDetails> {
    const shareholderCount = await this.web3.getShareholderCount();
    const assetCount = await this.web3.getAssetCount();
    const managerCount = await this.web3.getManagerCount();
    const totalSupply = await this.web3.getTotalSupply();
    const accessingAccountCount = await this.web3.getAccessingAccountCount();

    const oracleAssetSettings: OracleAssetSettings[] = [];
    const assets: AssetAllocation[] = [];
    for (let i = 0; i < assetCount; i++) {
      const address = await this.web3.getAssetAddress(i);
      const asset = await this.web3.getAsset(address);
      assets.push(asset);

      const settings = await this.web3.getOracleAssetSettings(address);
      settings.name = asset.name;
      settings.symbol = asset.symbol;
      oracleAssetSettings.push(settings);
    }

    const managers: ManagerAccount[] = [];
    for (let i = 0; i < managerCount; i++) {
      const manager = await this.web3.getManager(i);
      managers.push(manager);
    }

    const shareholders: ShareHolderAccount[] = [];
    for (let i = 0; i < shareholderCount; i++) {
      const shareholder = await this.web3.getShareholder(i);
      shareholders.push(shareholder);
    }

    const accessingAccounts: ManagerAccount[] = [];
    for (let i = 0; i < accessingAccountCount; i++) {
      const accessingAccount = await this.web3.getAccessingAccount(i);
      accessingAccounts.push(accessingAccount);
    }

    return {
      assets: assets,
      managers: managers,
      shareholders: shareholders,
      totalSupply: totalSupply,
      oracleAssetSettings: oracleAssetSettings,
      reserveAccessingAccounts: accessingAccounts,
    };
  }
}
