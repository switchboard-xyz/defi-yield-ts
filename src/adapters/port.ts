import { Connection, PublicKey } from "@solana/web3.js";
import { Port, ReserveInfo } from "@port.finance/port-sdk";
import TOKENS from "../tokens.json";
import { AssetRate, ProtocolRates } from "../types";
import { token } from "@project-serum/anchor/dist/cjs/utils";

export async function fetch(connection: Connection): Promise<ProtocolRates> {
  const port = Port.forMainNet({ connection });
  const context = await port.getReserveContext();
  const reserves: ReserveInfo[] = context.getAllReserves();

  const rates: AssetRate[] = reserves
    .map((reserve) => {
      const token = TOKENS.find((token) => {
        return token.mint === reserve.getAssetMintId().toBase58();
      });
      if (token) {
        return {
          asset: token!.symbol,
          mint: new PublicKey(token!.mint),
          deposit: reserve.getSupplyApy().getUnchecked().toNumber(),
          borrow: reserve.getBorrowApy().getUnchecked().toNumber(),
        } as AssetRate;
      }
      return undefined;
    })
    .filter((token) => {
      return token != undefined;
    })
    .map((token) => {
      return token as AssetRate;
    });

  return {
    protocol: "port",
    rates,
  };
}
