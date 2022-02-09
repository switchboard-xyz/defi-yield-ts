import BigNumber from "bignumber.js";
import BN from "bn.js";
import { BIG_NUMBER_ONE, BIG_NUMBER_ZERO, eX } from "./helpers";
import {
  Reserve,
} from "./models";

/**
 * @param reserve
 */
//@ts-ignore
export function getMineRatio(reserve:Reserve):{lTokenMiningRatio:BigNumber,borrowMiningRatio:BigNumber}{
    if (reserve.isLP){
        return {lTokenMiningRatio:new BigNumber(1),borrowMiningRatio:new BigNumber(0)}
    }else {
        return {lTokenMiningRatio:new BigNumber(0.9),borrowMiningRatio:new BigNumber(0.1)}
    }
}

export const TEN = new BN(10);
export const WAD = TEN.pow(new BN(18));
export const BIG_NUMBER_WAD = new BigNumber(WAD.toString())

export function getUtilizationRate(reserve:Reserve):BigNumber{
    const borrowedAmount = new BigNumber(reserve.liquidity.borrowedAmountWads.toString())
        .div(BIG_NUMBER_WAD);
    const totalSupply = new BigNumber(reserve.liquidity.availableAmount.toString()).plus(borrowedAmount).minus(eX(reserve.liquidity.ownerUnclaimed.toString(),-18));
    if (totalSupply.eq(0)){
        return BIG_NUMBER_ZERO
    }
    if (reserve.liquidity.borrowedAmountWads.lt(WAD)){
        return BIG_NUMBER_ZERO
    }
    if (borrowedAmount.gt(totalSupply)){
        return BIG_NUMBER_ONE
    } else {
        return borrowedAmount.div(
            totalSupply
        )
    }

}
