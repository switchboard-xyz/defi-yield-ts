import BigNumber from "bignumber.js";

export const BIG_NUMBER_ONE = new BigNumber(1)
export const BIG_NUMBER_ZERO = new BigNumber(0);
export const eX = (value: string | number, x: string | number) => {
    if (value===0||value==='0'){
        return new BigNumber(0)
    }
    return new BigNumber(`${value}e${x}`);
};
