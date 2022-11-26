import { AssetAllocation } from '../../core/models/asset-allocation';

export interface DashboardDetails {
  isLocked: boolean;
  totalSupply: number;
  rebalancingTolerance: number;
  numberOfShareholders: number;
  numberOfAssets: number;
  assets: AssetAllocation[];
  fundAddress: string;
  ownerAddress: string;
  treasuryAddress: string;
  oracleAddress: string;
  sharePrice: number;
  reserveBalance: string;
}
