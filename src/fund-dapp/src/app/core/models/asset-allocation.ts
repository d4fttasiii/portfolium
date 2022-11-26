export enum AssetTypes {
  Native = 0,
  ERC20 = 1,
  ERC721 = 2,
  Synthetic = 3,
  Mirrored = 4,
}

export interface AssetAllocation {
  address: string;
  name: string;
  symbol?: string;
  decimals?: number;
  perShareAmount?: number;
  assetType?: AssetTypes;
  weight?: number;
  price?: number;
  balance?: number;
}
