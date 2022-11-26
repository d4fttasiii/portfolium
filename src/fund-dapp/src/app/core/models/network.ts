export interface BlockchainNetwork {
  name: string;
  chainId: number;
  native: NativeCurrency;
  rpcUrl: string;
  blockExplorerUrl: string;
}

export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}
