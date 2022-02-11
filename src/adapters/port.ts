import { Connection } from "@solana/web3.js";
import { Port, ReserveInfo } from "@port.finance/port-sdk";
import TOKENS from '../tokens.json';
import { AssetRate, ProtocolRates } from '../types';

export async function fetch(): Promise<ProtocolRates> {
  const connection = new Connection('https://port-finance.rpcpool.com');
  const port = Port.forMainNet({ connection });
  const context = await port.getReserveContext();
  const reserves: ReserveInfo[] = context.getAllReserves()

  const rates: AssetRate[] = reserves
    .filter((reserve) => { return TOKENS.find((token) => { return token.mint === reserve.getAssetMintId().toBase58(); }); })
    .map((reserve) => {
      const token = TOKENS.find((token) => { return token.mint === reserve.getAssetMintId().toBase58(); });
      return {
        asset: token!.symbol,
        deposit: reserve.getSupplyApy().getUnchecked().toNumber(),
        borrow: reserve.getBorrowApy().getUnchecked().toNumber()
      } as AssetRate;
  });

  return {
    protocol: 'port',
    rates,
  };
}
