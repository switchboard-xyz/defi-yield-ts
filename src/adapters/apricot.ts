import { Connection } from "@solana/web3.js";
import { createAssetPoolLoader, TokenID } from "@apricot-lend/sdk-ts";
import { AssetRate, ProtocolRates } from '../types';

export async function fetch(): Promise<ProtocolRates> {
  const connection = new Connection("https://api.mainnet-beta.solana.com", "processed");
  const assetPoolLoader = await createAssetPoolLoader(connection);

  const rates: AssetRate[] = (await Promise.all([
    assetPoolLoader.getAssetPool(TokenID.BTC),
    assetPoolLoader.getAssetPool(TokenID.ETH),
    assetPoolLoader.getAssetPool(TokenID.SOL),
    assetPoolLoader.getAssetPool(TokenID.USDC),
  ])).map((assetPool) => {
    return {
      asset: assetPool?.tokenName,
      deposit: assetPool?.depositRate,
      borrow: assetPool?.borrowRate,
    } as AssetRate;
  });

  return {
    protocol: 'apricot',
    rates,
  };
}
