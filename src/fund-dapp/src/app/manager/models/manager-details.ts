import { AssetAllocation } from '@core/models/asset-allocation';
import { ManagerAccount } from '@core/models/manager-account';
import { OracleAssetSettings } from '@core/models/oracle-asset-settings';
import { ShareHolderAccount } from '@core/models/share-holder-account';

export interface ManagerDetails {
  assets: AssetAllocation[];
  managers: ManagerAccount[];
  shareholders: ShareHolderAccount[];
  oracleAssetSettings: OracleAssetSettings[];
  totalSupply: number;
  reserveAccessingAccounts: ManagerAccount[];
}
