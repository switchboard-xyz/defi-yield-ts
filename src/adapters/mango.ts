import { Config, IDS, MangoClient } from '@blockworks-foundation/mango-client';
import { Connection, PublicKey } from '@solana/web3.js';
import { AssetRate, ProtocolRates } from '../types';

export async function fetch(): Promise<ProtocolRates> {
  const cluster = 'mainnet';
  const group = 'mainnet.1';
  const config = new Config(IDS);
  const groupConfig = config.getGroup(cluster, group);
  if (!groupConfig) { throw new Error("unable to get mango group config"); }
  const clusterData = IDS.groups.find((g) => { return g.name == group && g.cluster == cluster; });
  const mangoProgramIdPk = new PublicKey(clusterData!.mangoProgramId);
  const clusterUrl = IDS.cluster_urls[cluster];
  const connection = new Connection(clusterUrl, 'singleGossip');
  const client = new MangoClient(connection, mangoProgramIdPk);
  const mangoGroup = await client.getMangoGroup(groupConfig.publicKey);
  const rootBanks = await mangoGroup.loadRootBanks(connection);

  const rates: AssetRate[] = groupConfig.tokens.map((e) => {
    const tokenIndex = mangoGroup.getTokenIndex(e.mintKey);
    const borrowRate = mangoGroup.getBorrowRate(tokenIndex);
    const depositRate = mangoGroup.getDepositRate(tokenIndex);
    return {
      asset: e.symbol,
      deposit: depositRate.toNumber(),
      borrow: borrowRate.toNumber(),
    } as AssetRate;
  }).filter((assetRate) => { return isSupportedAsset(assetRate.asset); });

  return {
    protocol: 'mango',
    rates,
  };
}

function isSupportedAsset(asset: string): boolean {
  switch (asset) {
    case 'BTC': return true;
    case 'ETH': return true;
    case 'SOL': return true;
    case 'USDC': return true;
    default: return false;
  }
}
