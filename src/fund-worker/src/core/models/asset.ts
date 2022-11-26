import BN from 'bn.js';

export enum AssetTypes {
  Native = 0,
  ERC20 = 1,
  ERC721 = 2,
  Synthetic = 3,
  Mirrored = 4,
}

export interface Asset {
  address: string;
  name?: string;
  symbol?: string;
  amountPerShare?: BN;
  assetType: AssetTypes;
  weight?: number;
  price?: number;
  decimals?: number;
}
