import BN from 'bn.js';
import { Cluster, clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { ReserveParser } from '../solend/reserve';
import { AssetRate, ProtocolRates } from '../types';

export async function fetch(): Promise<ProtocolRates> {
  const cluster: Cluster = 'mainnet-beta';
  const connection = new Connection(clusterApiUrl(cluster));

  const rates: AssetRate[] = (await Promise.all([
    { address: "GYzjMCXTDue12eUGKKWAqtF5jcBYNmewr6Db6LaguEaX", symbol: "BTC" },
    { address: "3PArRsZQ6SLkr1WERZWyC6AqsajtALMq4C66ZMYz4dKQ", symbol: "ETH" },
    { address: "8PbodeaosQP19SjYFx855UMqWxH2HynZLdBXmsrbac36", symbol: "SOL" },
    { address: "BgxfHJDzm44T7XG68MYKx7YisTjZu73tVovyZSjJMpmw", symbol: "USDC" },
  ].map(async (e) => {
      const reserveAccount = await connection.getAccountInfo(new PublicKey(e.address));
      const reserve = ReserveParser(new PublicKey(e.address), reserveAccount);
      const utilizationRatio = calculateUtilizationRatio(reserve!.info);
      const borrowAPY = calculateBorrowAPY(reserve!.info);
      const depositAPY = calculateSupplyAPY(reserve!.info);
      return {
          asset: e.symbol,
          deposit: depositAPY,
          borrow: borrowAPY,
      } as AssetRate;
  }))).filter((assetRate) => { return isSupportedAsset(assetRate.asset); });

  return {
    protocol: 'solend',
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

export const calculateSupplyAPY = (reserve) => {
  const currentUtilization = calculateUtilizationRatio(reserve);
  const borrowAPY = calculateBorrowAPY(reserve);
  return currentUtilization * borrowAPY;
};

export const calculateUtilizationRatio = (reserve) => {
  const borrowedAmount = reserve.liquidity.borrowedAmountWads
    .div(new BN(`1${''.padEnd(18, '0')}`))
    .toNumber();
  const availableAmount = reserve.liquidity.availableAmount.toNumber();
  const currentUtilization =
    borrowedAmount / (availableAmount + borrowedAmount);
  return currentUtilization;
};

export const calculateBorrowAPY = (reserve) => {
  const currentUtilization = calculateUtilizationRatio(reserve);
  const optimalUtilization = reserve.config.optimalUtilizationRate / 100;
  let borrowAPY;
  if (optimalUtilization === 1.0 || currentUtilization < optimalUtilization) {
    const normalizedFactor = currentUtilization / optimalUtilization;
    const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
    const minBorrowRate = reserve.config.minBorrowRate / 100;
    borrowAPY =
      normalizedFactor * (optimalBorrowRate - minBorrowRate) + minBorrowRate;
  } else {
    const normalizedFactor =
      (currentUtilization - optimalUtilization) / (1 - optimalUtilization);
    const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
    const maxBorrowRate = reserve.config.maxBorrowRate / 100;
    borrowAPY =
      normalizedFactor * (maxBorrowRate - optimalBorrowRate) +
      optimalBorrowRate;
  }
  return borrowAPY;
};
