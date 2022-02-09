import BigNumber from "bignumber.js";
import BN from "bn.js";
import { AccountInfo, Connection } from "@solana/web3.js";
import {
  ALL_IDS,
  RESERVE_IDS,
  RESERVE_LARIX_ORACLES,
  RESERVE_NAMES,
  RESERVE_FULLNAMES,
  LP_RESERVE_IDS,
  LP_CONFIG_LENGTH,
} from "./config";
import { BIG_NUMBER_ONE, BIG_NUMBER_ZERO, eX } from "./helpers";
import {
    Reserve,
    ReserveParser,
    Detail,
    TokenAccountParser,
} from "./models";
import { getMineRatio, getUtilizationRate } from "./calculateAllMine";
//import { BIG_NUMBER_WAD, ZERO } from "../constants/math";
//import { SLOTS_PER_YEAR,REAL_SLOTS_PER_YEAR } from "../constants/math";
//import { LP_REWARD_TOKEN } from "../constants/config"
import { MarketPrice, PriceParser } from "./models/state/marketPrice";
import { Amm, AmmParser } from "./models/state/lp-price/amm";
import { MintParser } from "./models/state/mint";
import { AmmOpenOrders, AmmOpenOrdersLayoutParser } from "./models/state/lp-price/ammOpenOrders";
import { FarmPoolParser, STAKE_INFO_LAYOUT, STAKE_INFO_LAYOUT_V4 } from "./models/state/lp-price/farmPool";
//import { MintInfo } from "@solana/spl-token";

export const TEN = new BN(10);
export const WAD = TEN.pow(new BN(18));
export const ZERO = new BN(0);
export const BIG_NUMBER_WAD = new BigNumber(WAD.toString())
export const SLOTS_PER_YEAR = 1000 / 400 * 60 * 60 * 24 * 365
export const REAL_SLOTS_TIME = 500
export const REAL_SLOTS_PER_YEAR = 1000 / REAL_SLOTS_TIME  * 60 * 60 * 24 * 365

export function refreshExchangeRate(allReserve:Detail<Reserve>[]) {
    allReserve.map((reserve)=> {
        const info = reserve.info
        const decimals = info.liquidity.mintDecimals
        let totalBorrowedAmount = eX(info.liquidity.borrowedAmountWads.toString(), -18)
        if (new BigNumber(totalBorrowedAmount).lt(BIG_NUMBER_ONE)) {
            totalBorrowedAmount = BIG_NUMBER_ZERO
        } else {
            totalBorrowedAmount = totalBorrowedAmount.div(10**decimals)
        }
        const totalLiquidityAmount = new BigNumber(eX(info.liquidity.availableAmount.toString(), -decimals)).plus(totalBorrowedAmount).minus(eX(info.liquidity.ownerUnclaimed.toString(), -18 - decimals))
        info.liquidity.liquidityPrice = eX(info.liquidity.marketPrice.toString() || "0", -18)
        const mintTotalSupply = eX(info.collateral.mintTotalSupply.toString(), -1 * Number(decimals))
        if (mintTotalSupply.isZero() || totalLiquidityAmount.isZero()) {
            info.liquidity.exchangeRate = BIG_NUMBER_ONE
        } else {
            info.liquidity.exchangeRate = mintTotalSupply.div(totalLiquidityAmount)
        }
    })
}
export async function getAllLendingReserve(connection:Connection,reserveArrayInner:Array<Detail<Reserve>>){
    const res = await Promise.all(
        [
            connection.getMultipleAccountsInfo(ALL_IDS.slice(0,100)),
            connection.getMultipleAccountsInfo(ALL_IDS.slice(100,ALL_IDS.length))
        ]
    )
    const accounts = res[0].concat(res[1])
    const reserveAccounts = accounts.slice(0,RESERVE_IDS.length)
    const marketPriceAccounts = accounts.slice(RESERVE_IDS.length,RESERVE_IDS.length * 2)
    const lpReserves = accounts.slice(RESERVE_IDS.length * 2, ALL_IDS.length)
    for (let i=0;i<reserveAccounts.length;i++){
        const reserveAccountInfo = reserveAccounts[i]
        const marketPriceAccountInfo = marketPriceAccounts[i]
        if (reserveAccountInfo!==null && marketPriceAccountInfo!==null){
            const reserve = ReserveParser(RESERVE_IDS[i], reserveAccountInfo as AccountInfo<Buffer>)
            reserve.info.liquidity.name = RESERVE_NAMES[i]
            reserve.info.liquidity.fullName = RESERVE_FULLNAMES[i]
            reserveArrayInner.push(reserve)
        }
    }
    for (let i=0;i<LP_RESERVE_IDS.length;i+=1){
        const lpConfig = LP_RESERVE_IDS[i]
        const reserve = ReserveParser(lpConfig.reserveID, lpReserves[i * LP_CONFIG_LENGTH] as AccountInfo<Buffer>)
        //const amm = AmmParser(lpConfig.ammID,lpReserves[i*LP_CONFIG_LENGTH+1])
        //const lpMint = MintParser(lpConfig.lpMint,lpReserves[i*LP_CONFIG_LENGTH+2])
        //const coinMintPrice = PriceParser(lpConfig.coinMintPrice,lpReserves[i*LP_CONFIG_LENGTH+3])
        //const pcMintPrice = PriceParser(lpConfig.pcMintPrice,lpReserves[i*LP_CONFIG_LENGTH+4])
        //const ammOpenOrders = AmmOpenOrdersLayoutParser(lpConfig.ammOpenOrders,lpReserves[i*LP_CONFIG_LENGTH+5])
        //const ammCoinMint = TokenAccountParser(lpConfig.ammCoinMintSupply,lpReserves[i*LP_CONFIG_LENGTH+6])
        //const ammPcMint = TokenAccountParser(lpConfig.ammPcMintSupply,lpReserves[i*LP_CONFIG_LENGTH+7])
        //const poolInfo = FarmPoolParser(lpConfig.farmPoolID,lpReserves[i*LP_CONFIG_LENGTH+8])
        //const farmPoolLpToken =  TokenAccountParser(lpConfig.farmPoolLpSupply,lpReserves[i*LP_CONFIG_LENGTH+9])

        reserve.info.liquidity.name = lpConfig.name
        reserve.info.liquidity.fullName = lpConfig.fullName

        //const lpPrice = getLpPrice(amm, ammOpenOrders,ammCoinMint,ammPcMint,coinMintPrice,pcMintPrice,lpMint)
        //reserve.info.liquidity.marketPrice = new BN(eX(lpPrice,18).toFixed())

        //reserve.info.lpInfo = getLpInfo(reserve,lpConfig,poolInfo,lpMint,farmPoolLpToken)

        reserveArrayInner.push(reserve)
    }

    // reserveArrayInner.map(reserve => {
    //     console.log(reserve.info.liquidity.marketPrice)
    // })
    return 0
}

export function refreshIndex(allReserve:Detail<Reserve>[],currentSlot:BN){
    allReserve.map((reserve)=>{
        const slotDiff = currentSlot.sub(reserve.info.lastUpdate.slot)
        const {lTokenMiningRatio,borrowMiningRatio} = getMineRatio(reserve.info)
        const slotDiffTotalMining = new BigNumber(reserve.info.bonus.totalMiningSpeed.toString()).times(new BigNumber(slotDiff.toString()))
        if (!lTokenMiningRatio.eq(0)){
            if (reserve.info.collateral.mintTotalSupply.cmp(ZERO)!==0){
                const plus = slotDiffTotalMining.times(lTokenMiningRatio).div(new BigNumber(reserve.info.collateral.mintTotalSupply.toString())).times(BIG_NUMBER_WAD)
                const newIndex = new BigNumber(reserve.info.bonus.lTokenMiningIndex.toString()).plus(
                    plus
                ).toString()

                // console.log('refreshIndex newIndex = ',newIndex.toString())
                reserve.info.bonus.lTokenMiningIndex = new BN(newIndex.split(".")[0])
            }

        }
        if (!borrowMiningRatio.eq(0)){
            if (reserve.info.liquidity.borrowedAmountWads.cmp(ZERO)!==0){
                const newIndex = new BigNumber(reserve.info.bonus.borrowMiningIndex.toString()).plus(
                    slotDiffTotalMining.times(borrowMiningRatio).div(new BigNumber(reserve.info.liquidity.borrowedAmountWads.toString()).div(BIG_NUMBER_WAD)).times(BIG_NUMBER_WAD)
                )
                reserve.info.bonus.borrowMiningIndex = new BN(newIndex.toFixed(0))
            }
        }
    })
}

export function accrueInterest(allReserve:Detail<Reserve>[],currentSlot:BN){
    allReserve.map((reserve)=>{
        const slotDiff = currentSlot.sub(reserve.info.lastUpdate.slot)
        const utilizationRate = getUtilizationRate(reserve.info)
        const currentBorrowRate = getCurrentBorrowRate(reserve.info ,utilizationRate)
        const slotInterestRate = currentBorrowRate.div(SLOTS_PER_YEAR)
        const compoundedInterestRate = new BigNumber(slotInterestRate.plus(1).toNumber()**slotDiff.toNumber())
        if (reserve.info.isLP) {
            reserve.info.config.borrowYearCompoundedInterestRate = new BigNumber(0)
            reserve.info.config.supplyYearCompoundedInterestRate = new BigNumber(0)
        }else {
            reserve.info.config.borrowYearCompoundedInterestRate = new BigNumber(slotInterestRate.plus(1).toNumber()**REAL_SLOTS_PER_YEAR).minus(1)
            reserve.info.config.supplyYearCompoundedInterestRate = reserve.info.config.borrowYearCompoundedInterestRate.times(0.8).times(utilizationRate)
        }
        reserve.info.liquidity.cumulativeBorrowRateWads =
            new BN(new BigNumber(reserve.info.liquidity.cumulativeBorrowRateWads.toString()).times(compoundedInterestRate).toFixed(0))
        const newUnclaimed =
            new BN(
                new BigNumber(reserve.info.liquidity.borrowedAmountWads.toString())
                    .times(compoundedInterestRate.minus(1))
                    .times(
                        new BigNumber(reserve.info.config.fees.borrowInterestFeeWad.toString()).div(BIG_NUMBER_WAD))
                    .toFixed(0)
            )

        reserve.info.liquidity.ownerUnclaimed = reserve.info.liquidity.ownerUnclaimed.add(newUnclaimed)
        reserve.info.liquidity.borrowedAmountWads =
            new BN(new BigNumber(reserve.info.liquidity.borrowedAmountWads.toString()).times(compoundedInterestRate).toFixed(0))
    })
}

export function getCurrentBorrowRate(reserve:Reserve,utilizationRate:BigNumber):BigNumber{

    const optimalUtilizationRate = new BigNumber(reserve.config.optimalUtilizationRate).div(100)
    const lowUtilization = utilizationRate.lt(optimalUtilizationRate)
    if (lowUtilization || optimalUtilizationRate.eq(1)){
        const normalizedRate = utilizationRate.div(optimalUtilizationRate)
        const minRate = new BigNumber(reserve.config.minBorrowRate).div(100)
        const rateRange = new BigNumber(reserve.config.optimalBorrowRate-reserve.config.minBorrowRate).div(100)
        return normalizedRate.times(rateRange).plus(minRate)
    } else {
        const normalizedRate = utilizationRate.minus(optimalUtilizationRate).div(new BigNumber(1).minus(optimalUtilizationRate))
        const minRate = reserve.config.optimalBorrowRate/100
        const rateRange = new BigNumber(reserve.config.maxBorrowRate-reserve.config.optimalBorrowRate).div(100)
        return normalizedRate.times(rateRange).plus(minRate)
    }
}
