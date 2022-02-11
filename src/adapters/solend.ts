import { Cluster, clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { SolendMarket } from '@solendprotocol/solend-sdk';
import { AssetRate, ProtocolRates } from '../types';

export async function fetch(): Promise<ProtocolRates> {
  const cluster: Cluster = 'mainnet-beta';
  const connection = new Connection(clusterApiUrl(cluster));
  const market = await SolendMarket.initialize(connection);
  await market.loadReserves();

  const rates: AssetRate[] = market.reserves.map((reserve) => {
    return {
      asset: toAsset(reserve.config.name),
      mint: new PublicKey(reserve.config.mintAddress),
      deposit: reserve.stats!.supplyInterestAPY,
      borrow: reserve.stats!.borrowInterestAPY,
    } as AssetRate;
  });

  return {
    protocol: 'solend',
    rates,
  };
}

function toAsset(asset: string): string {
  switch (asset) {
    case 'Marinade staked SOL (mSOL)': return 'mSOL';
    case 'Mercurial': return 'MER';
    case 'Orca': return 'ORCA';
    case 'Raydium': return 'RAY';
    case 'Serum': return 'SRM';
    case 'USD Coin': return 'USDC';
    case 'Wrapped SOL': return 'SOL';
    default: return asset;
  }
}
