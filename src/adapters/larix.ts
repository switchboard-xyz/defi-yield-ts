import BigNumber from 'bignumber.js';
import BN from "bn.js";
import { Connection } from "@solana/web3.js"
import { accrueInterest, getAllLendingReserve, refreshExchangeRate, refreshIndex } from "../larix/lendingReserveProvider";
import { Detail, Reserve } from '../larix/models';
import { AssetRate, ProtocolRates } from '../types';

BigNumber.config({EXPONENTIAL_AT: 1e9});

export async function fetch(): Promise<ProtocolRates> {
  const reserves = await getLendingReserve();
  const rates: AssetRate[] = reserves.filter((reserve) => { return !reserve.info.isLP; }).map((reserve) => {
    return {
      asset: toAsset(reserve.info.liquidity.name),
      mint: reserve.info.liquidity.mintPubkey,
      deposit: reserve.info.config.supplyYearCompoundedInterestRate.toNumber(),
      borrow: reserve.info.config.borrowYearCompoundedInterestRate.toNumber(),
    } as AssetRate;
  });
  return {
    protocol: 'larix',
    rates,
  };
}

function toAsset(asset: string): string {
  switch (asset) {
    case 'stSOL': return 'Lido Staked SOL';
    case 'weWETH': return 'Ether (Wormhole)';
    default: return asset;
  }
}

export async function getLendingReserve(){
  const connection = new Connection("https://api.mainnet-beta.solana.com", "processed");
  const reserveArrayInner = new Array<Detail<Reserve>>();
  // @ts-ignore
  const result = await Promise.all([
    await connection.getSlot("finalized"),
    getAllLendingReserve(connection, reserveArrayInner),
  ]);
  const currentSlot = new BN(result[0]);
  accrueInterest(reserveArrayInner, currentSlot);
  refreshIndex(reserveArrayInner, currentSlot);
  refreshExchangeRate(reserveArrayInner);
  return reserveArrayInner
}
