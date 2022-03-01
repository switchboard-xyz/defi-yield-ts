import { Connection, PublicKey } from "@solana/web3.js";
import { createAssetPoolLoader, TokenID } from "@apricot-lend/sdk-ts";
import TOKENS from "../tokens.json";
import { AssetRate, ProtocolRates } from "../types";

export async function fetch(connection: Connection): Promise<ProtocolRates> {
  const assetPoolLoader = await createAssetPoolLoader(connection);

  const rates: AssetRate[] = (
    await Promise.all([
      assetPoolLoader.getAssetPool(TokenID.APT),
      assetPoolLoader.getAssetPool(TokenID.BTC),
      assetPoolLoader.getAssetPool(TokenID.ETH),
      assetPoolLoader.getAssetPool(TokenID.FTT),
      assetPoolLoader.getAssetPool(TokenID.mSOL),
      assetPoolLoader.getAssetPool(TokenID.ORCA),
      assetPoolLoader.getAssetPool(TokenID.RAY),
      assetPoolLoader.getAssetPool(TokenID.SOL),
      assetPoolLoader.getAssetPool(TokenID.SRM),
      assetPoolLoader.getAssetPool(TokenID.USDC),
      assetPoolLoader.getAssetPool(TokenID.USDT),
      assetPoolLoader.getAssetPool(TokenID.USTv2),
    ])
  ).map((assetPool) => {
    const token = TOKENS.find((token) => {
      return token.mint === assetPool?.mintKey.toBase58();
    });
    return {
      asset: token!.symbol,
      mint: new PublicKey(token!.mint),
      deposit: assetPool?.depositRate.toNumber(),
      borrow: assetPool?.borrowRate.toNumber(),
    } as AssetRate;
  });

  return {
    protocol: "apricot",
    rates,
  };
}
