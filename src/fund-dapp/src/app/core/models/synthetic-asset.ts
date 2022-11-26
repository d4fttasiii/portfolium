import { ERC20Asset } from './erc20-asset';

export interface SyntheticAssetBasic extends ERC20Asset {
  companyName: string;
  companyId: string;
  depotId: string;
}

export interface SyntheticAsset extends SyntheticAssetBasic {
  address: string;
  price?: number;
  buyOrders?: SyntheticAssetOrder[];
  sellOrders?: SyntheticAssetOrder[];
  nativeBalance?: string;
}

export interface SyntheticAssetOrder {
  amount: number;
  state: OrderStates;
  createdAt: Date;
  completedAt?: Date;
}

export enum OrderStates {
  Open = 'OPEN',
  Completed = 'COMPLETED',
}
