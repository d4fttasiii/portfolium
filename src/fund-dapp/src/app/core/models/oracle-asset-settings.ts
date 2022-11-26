import { PriceOrigin } from './price-origin';

export interface OracleAssetSettings {
  address: string;
  priceOrigin: PriceOrigin;
  chainlinkAddress?: string;
  name?: string;
  symbol?: string;
}
