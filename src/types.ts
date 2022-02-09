import { assert } from "console";

export type Protocol =
| 'apricot'
| 'francium'
| 'jet'
| 'larix'
| 'mango'
| 'port'
| 'solend'
| 'tulip';

export type ProtocolRates = {
  protocol: Protocol;
  rates: AssetRate[];
};

export type Asset =
| 'BTC'
| 'ETH'
| 'SOL'
| 'USDC'
| 'USDT';

export type AssetRate = {
  asset: Asset;
  deposit: number | undefined;
  borrow: number | undefined;
};

export function toRate(rate: string): number {
  assert(rate.endsWith('%'));
  return parseFloat(rate.substring(0, rate.length - 1)) * 0.01;
}
