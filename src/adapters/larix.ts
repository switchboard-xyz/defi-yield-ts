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
      asset: reserve.info.liquidity.name,
      deposit: reserve.info.config.supplyYearCompoundedInterestRate.toNumber(),
      borrow: reserve.info.config.borrowYearCompoundedInterestRate.toNumber(),
    } as AssetRate;
  });
  return {
    protocol: 'larix',
    rates,
  };
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
