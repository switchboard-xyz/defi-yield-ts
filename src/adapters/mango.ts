import { Config, IDS, MangoClient } from "@blockworks-foundation/mango-client";
import { Connection, PublicKey } from "@solana/web3.js";

import { AssetRate, ProtocolRates } from "../types";

export async function fetch(connection: Connection): Promise<ProtocolRates> {
  const cluster = "mainnet";
  const group = "mainnet.1";
  const config = new Config(IDS);
  const groupConfig = config.getGroup(cluster, group);
  if (!groupConfig) {
    throw new Error("unable to get mango group config");
  }
  const clusterData = IDS.groups.find((g) => {
    return g.name == group && g.cluster == cluster;
  });
  const mangoProgramIdPk = new PublicKey(clusterData!.mangoProgramId);
  const client = new MangoClient(connection, mangoProgramIdPk);
  const mangoGroup = await client.getMangoGroup(groupConfig.publicKey);
  await mangoGroup.loadRootBanks(connection);

  const rates: AssetRate[] = groupConfig.tokens.map((e) => {
    const tokenIndex = mangoGroup.getTokenIndex(e.mintKey);
    const borrowAmount = mangoGroup.getUiTotalBorrow(tokenIndex);
    const borrowRate = mangoGroup.getBorrowRate(tokenIndex);
    const depositAmount = mangoGroup.getUiTotalDeposit(tokenIndex);
    const depositRate = mangoGroup.getDepositRate(tokenIndex);
    return {
      asset: toAsset(e.symbol),
      mint: new PublicKey(e.mintKey),
      borrowAmount: borrowAmount.toNumber(),
      borrowRate: borrowRate.toNumber(),
      depositAmount: depositAmount.toNumber(),
      depositRate: depositRate.toNumber(),
    } as AssetRate;
  });

  return {
    protocol: "mango",
    rates,
  };
}

function toAsset(asset: string): string {
  switch (asset) {
    case "MSOL":
      return "mSOL";
    default:
      return asset;
  }
}
