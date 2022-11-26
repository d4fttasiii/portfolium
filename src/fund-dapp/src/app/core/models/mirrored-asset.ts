export interface MirroredAssetBasics {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  totalSupply?: number;
  commission?: number;
}

export interface MirroredAsset extends MirroredAssetBasics {
  price?: number;
  userBalance?: number;
}
