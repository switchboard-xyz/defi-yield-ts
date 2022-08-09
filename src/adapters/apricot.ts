import { struct } from "buffer-layout";
import { Decimal } from "decimal.js";
import { publicKey, u64 as _u64, u128 } from "@project-serum/borsh";
import { OpenOrders } from "@project-serum/serum";
import { parsePriceData } from "@pythnetwork/client";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintLayout,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import {
  AccountInfo,
  AccountMeta,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import * as switchboard from "@switchboard-xyz/switchboard-api";
import invariant from "tiny-invariant";

import axios from "axios";
import * as rax from "retry-axios";

import TOKENS from "../tokens.json";
import { AssetRate, ProtocolRates } from "../types";

export async function fetch(connection: Connection): Promise<ProtocolRates> {
  const assetPoolLoader = await createAssetPoolLoader(connection);

  const rates: AssetRate[] = (
    await Promise.all([
      assetPoolLoader.getAssetPool(TokenID.APT),
      assetPoolLoader.getAssetPool(TokenID.BTC),
      assetPoolLoader.getAssetPool(TokenID.ETH),
      assetPoolLoader.getAssetPool(TokenID.FTT),
      assetPoolLoader.getAssetPool(TokenID.mSOL),
      assetPoolLoader.getAssetPool(TokenID.ORCA),
      assetPoolLoader.getAssetPool(TokenID.RAY),
      assetPoolLoader.getAssetPool(TokenID.SOL),
      assetPoolLoader.getAssetPool(TokenID.SRM),
      assetPoolLoader.getAssetPool(TokenID.USDC),
      assetPoolLoader.getAssetPool(TokenID.USDT),
      assetPoolLoader.getAssetPool(TokenID.USTv2),
    ])
  ).map((assetPool) => {
    const token = TOKENS.find((token) => {
      return token.mint === assetPool?.mintKey.toBase58();
    });
    return {
      asset: token!.symbol,
      mint: new PublicKey(token!.mint),
      borrowAmount: assetPool?.borrowAmount.toNumber(),
      borrowRate: assetPool?.borrowRate.toNumber(),
      depositAmount: assetPool?.depositAmount.toNumber(),
      depositRate: assetPool?.depositRate.toNumber(),
    } as AssetRate;
  });

  return {
    protocol: "apricot",
    rates,
  };
}

export const getAssociatedTokenPubkey = async (
  ownerPubkey: PublicKey,
  mintPubkey: PublicKey,
  allowOwnerOffCurve = false
) => {
  let address;
  if (allowOwnerOffCurve) {
    [address] = await PublicKey.findProgramAddress(
      [
        ownerPubkey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mintPubkey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  } else {
    address = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintPubkey,
      ownerPubkey,
      allowOwnerOffCurve
    );
  }
  return address;
};

export const CMD_REFRESH_USER = 0x0a;

export const CMD_ADD_USER_AND_DEPOSIT = 0x10;
export const CMD_DEPOSIT = 0x11;
export const CMD_WITHDRAW = 0x12;
export const CMD_BORROW = 0x13;
export const CMD_REPAY = 0x14;
export const CMD_EXTERN_LIQUIDATE = 0x15;
// DEPRECATED self-liquidate
export const CMD_UPDATE_USER_CONFIG = 0x17;
// export const CMD_MARGIN_SWAP = 0x18;
export const CMD_UPDATE_USER_ASSET_CONFIG = 0x19;
export const CMD_WITHDRAW_AND_REMOVE_USER = 0x1a;
// export const CMD_TOKEN_DEPOSIT = 0x1b;
// export const CMD_TOKEN_WITHDRAW = 0x1c;
export const CMD_LP_CREATE = 0x1d;
export const CMD_LP_REDEEM = 0x1e;
export const CMD_LP_OP_CHECK = 0x21;
export const CMD_LP_OP_ENDCHECK = 0x22;
export const CMD_LP_STAKE = 0x23;
export const CMD_LP_UNSTAKE = 0x24;
export const CMD_LP_STAKE_SECOND = 0x81;
export const CMD_LP_UNSTAKE_SECOND = 0x82;
// other trivia
// swap identifiers
export const SWAP_FAKE = 0x00;
export const SWAP_SERUM = 0x01;
export const SWAP_RAYDIUM = 0x02;
export const SWAP_SABER = 0x03;
export const SWAP_MERCURIAL = 0x04;
export const SWAP_ORCA = 0x05;

export const INVALID_PAGE = 65535;
export const AMOUNT_MULTIPLIER = 16777216;
export const MAX_ASSIST_ACTIONS = 6;
export const ASSIST_MODE_STABLE_ONLY = 2;

export enum TokenID {
  APT = "APT",
  BTC = "BTC",
  ETH = "ETH",
  USDT = "USDT",
  USDC = "USDC",
  UST = "UST",
  SOL = "SOL",
  SBR = "SBR",
  ORCA = "ORCA",
  RAY = "RAY",
  MERC = "MERC",
  MNDE = "MNDE",
  mSOL = "mSOL",
  USTv2 = "USTv2",
  FTT = "FTT",
  SRM = "SRM",
  stSOL = "stSOL",
  whETH = "whETH",
  USDT_USDC_SABER = "USDT_USDC_SABER",
  USTv2_USDC_SABER = "USTv2_USDC_SABER",
  UST_USDC_SABER = "UST_USDC_SABER",
  SOL_USDC_RAYDIUM = "SOL_USDC_RAYDIUM",
  RAY_USDC_RAYDIUM = "RAY_USDC_RAYDIUM",
  SOL_USDT_RAYDIUM = "SOL_USDT_RAYDIUM",
  mSOL_SOL_RAYDIUM = "mSOL_SOL_RAYDIUM",
  RAY_USDT_RAYDIUM = "RAY_USDT_RAYDIUM",
  RAY_ETH_RAYDIUM = "RAY_ETH_RAYDIUM",
  RAY_SOL_RAYDIUM = "RAY_SOL_RAYDIUM",
  SRM_USDC_RAYDIUM = "SRM_USDC_RAYDIUM",
  USDC_USDT_ORCA = "USDC_USDT_ORCA",
  SOL_USDC_ORCA = "SOL_USDC_ORCA",
  mSOL_SOL_ORCA = "mSOL_SOL_ORCA",
  ORCA_USDC_ORCA = "ORCA_USDC_ORCA",
  ORCA_SOL_ORCA = "ORCA_SOL_ORCA",
  ETH_USDC_ORCA = "ETH_USDC_ORCA",
  SOL_USDT_ORCA = "SOL_USDT_ORCA",
  ETH_SOL_ORCA = "ETH_SOL_ORCA",
  BTC_mSOL_ORCA = "BTC_mSOL_ORCA",
  mSOL_USDC_ORCA = "mSOL_USDC_ORCA",
  APT_USDC_ORCA = "APT_USDC_ORCA",
}

export type PoolId = number;

export enum TokenCategory {
  Volatile = "volatile",
  Stable = "stable",
  Lp = "lp",
}

export enum PoolFlag {
  AllowBorrow = 1,
  IsLp = 2,
  IsStable = 4,
}

export interface LpSwapKeyInfo {
  getLpDepositKeys: (ownerKey: PublicKey) => Promise<AccountMeta[]>;
  getLpWithdrawKeys: (ownerKey: PublicKey) => Promise<AccountMeta[]>;
  getLpStakeKeys: (ownerKey: PublicKey) => Promise<AccountMeta[]>;
  getLRVaults: () => [PublicKey, PublicKey];
}

export enum Dex {
  Serum,
  Raydium,
  Saber,
  Mercurial,
  Orca,
}

export class PoolConfig {
  constructor(
    public tokenId: TokenID,
    public poolId: PoolId,
    public ltv: number,
    public mint: PublicKey,
    public liquidationDiscount: number,
    public tokenCategory: TokenCategory,
    public lpLeftRightTokenId: [TokenID, TokenID] | null,
    public lpLeftRightPoolId: [PoolId, PoolId] | null,
    public lpDex: Dex | null,
    public lpTargetSwap: number | null,
    public lpSwapKeyInfo: LpSwapKeyInfo | null,
    public lpNeedSndStake: boolean | null,
    public interestRate: InterestRate | null,
    public reserveRatio: number
  ) {
    invariant(tokenId);
    invariant(poolId >= 0);
    invariant(ltv >= 0);
    invariant(mint);
    invariant(liquidationDiscount >= 0);
    invariant(reserveRatio >= 0);
    invariant(reserveRatio <= 0.2);
    if (tokenCategory === TokenCategory.Lp) {
      invariant(
        lpLeftRightTokenId !== null && lpLeftRightTokenId !== undefined
      );
      invariant(lpLeftRightPoolId !== null && lpLeftRightPoolId !== undefined);
      invariant(lpDex !== null && lpDex !== undefined);
      invariant(lpTargetSwap !== null && lpTargetSwap !== undefined);
      const [lTokId, rTokId] = lpLeftRightTokenId;
      const [lPoolId, rPoolId] = lpLeftRightPoolId;
      invariant(lTokId, `${tokenId} missing lTokId`);
      invariant(rTokId, `${tokenId} missing rTokId`);
      invariant(lPoolId >= 0, `${tokenId} missing lPoolId`);
      invariant(rPoolId >= 0, `${tokenId} missing rPoolId`);
      invariant(lpSwapKeyInfo, `${tokenId} is missing lpSwapKeyInfo`);
      invariant(
        lpNeedSndStake === true || lpNeedSndStake === false,
        `${tokenId} missing lpNeedSndStake`
      );
    } else {
      invariant(interestRate);
    }
  }

  isStable() {
    return this.tokenCategory === TokenCategory.Stable;
  }
  isLp() {
    return this.tokenCategory === TokenCategory.Lp;
  }
  isVolatile() {
    return this.tokenCategory === TokenCategory.Volatile;
  }
}

function getLpLRPoolIds(
  tokId: TokenID,
  lpToLR: { [key in TokenID]?: [TokenID, TokenID] | undefined },
  tokenIdToPoolId: { [key in TokenID]?: PoolId | undefined }
): [PoolId, PoolId] {
  const [leftTokId, rightTokId] = lpToLR[tokId]!;
  return [tokenIdToPoolId[leftTokId]!, tokenIdToPoolId[rightTokId]!];
}

export class AppConfig {
  poolConfigs: { [key in TokenID]?: PoolConfig };
  constructor(
    public programPubkey: PublicKey,
    public adminPubkey: PublicKey,
    public farmerPubkey: PublicKey,
    public assistKey: PublicKey,
    public refresherKey: PublicKey,
    public retroAptVault: PublicKey,
    public lmAptVault: PublicKey,
    // maps from TokenID to mint/decimalMult/poolId/ltv
    public mints: { [key in TokenID]: PublicKey },
    public decimalMults: { [key in TokenID]: number },
    public categories: { [key in TokenID]: TokenCategory },

    public tokenIdToPoolId: { [key in TokenID]?: PoolId | undefined },
    public discounts: { [key in TokenID]?: number | undefined },
    public ltvs: { [key in TokenID]?: number | undefined },
    public lpToLR: { [key in TokenID]?: [TokenID, TokenID] | undefined },
    public lpToDex: { [key in TokenID]?: Dex | undefined },
    public lpToTargetSwap: { [key in TokenID]?: number | undefined },
    public lpToNeedSndStake: { [key in TokenID]?: boolean },
    public switchboardPriceKeys: { [key in TokenID]?: PublicKey },
    public pythPriceKeys: { [key in TokenID]?: PublicKey },
    public interestRates: { [key in TokenID]?: InterestRate },
    public fees: { [key in TokenID]?: number },
    public lpSwapInfo: { [key in TokenID]?: LpSwapKeyInfo },
    public firebaseConfig: object
  ) {
    this.mints = mints;
    this.tokenIdToPoolId = tokenIdToPoolId;
    const poolIds = Object.values(tokenIdToPoolId);
    const idSet = new Set(poolIds);
    invariant(
      poolIds.length === idSet.size,
      `poolIds length: ${poolIds.length} != idSet.size: ${idSet.size}`
    );
    this.poolConfigs = {};
    for (const tokenId in tokenIdToPoolId) {
      const tokId = tokenId as TokenID;
      this.poolConfigs[tokId] = new PoolConfig(
        tokId,
        tokenIdToPoolId[tokId]!,
        ltvs[tokId]!,
        mints[tokId],
        discounts[tokId]!,
        categories[tokId],
        categories[tokId] === TokenCategory.Lp ? lpToLR[tokId]! : null,
        categories[tokId] === TokenCategory.Lp
          ? getLpLRPoolIds(tokId, lpToLR, tokenIdToPoolId)
          : null,
        categories[tokId] === TokenCategory.Lp ? lpToDex[tokId]! : null,
        categories[tokId] === TokenCategory.Lp ? lpToTargetSwap[tokId]! : null,
        lpSwapInfo[tokId]!,
        categories[tokId] === TokenCategory.Lp
          ? lpToNeedSndStake[tokId]!
          : null,
        categories[tokId] === TokenCategory.Lp ? null : interestRates[tokId]!,
        fees[tokId]!
      );
    }
  }
  mintKeyStrToPoolId(mint_key_str: string): number {
    for (const [tokenType, pubkey] of Object.entries(this.mints)) {
      if (pubkey.toString() === mint_key_str) {
        const result = this.tokenIdToPoolId[tokenType as TokenID];
        invariant(result !== undefined);
        return result;
      }
    }
    invariant(false);
  }
  getPoolIdList(): number[] {
    return Object.values(this.tokenIdToPoolId);
  }
  getTokenIdByPoolId(targetPoolId: number): TokenID {
    for (const [tokenId, poolId] of Object.entries(this.tokenIdToPoolId)) {
      if (poolId === targetPoolId) return tokenId as TokenID;
    }
    throw new Error(`poolId ${targetPoolId} not valid`);
  }
  getLtvByPoolId(poolId: number) {
    const tokenId = this.getTokenIdByPoolId(poolId);
    return this.ltvs[tokenId];
  }
  getDecimalMultByPoolId(poolId: number) {
    const tokenId = this.getTokenIdByPoolId(poolId);
    return this.decimalMults[tokenId];
  }
  getMintByPoolId(poolId: number) {
    const tokenId = this.getTokenIdByPoolId(poolId);
    return this.mints[tokenId];
  }
  getPoolConfigList(): PoolConfig[] {
    return Object.values(this.poolConfigs);
  }
  getPoolConfigByPoolId(poolId: number): PoolConfig {
    const tokenId = this.getTokenIdByPoolId(poolId);
    return this.poolConfigs[tokenId]!;
  }
}

export interface AssetPool {
  coin_name: string;

  mint_key: PublicKey;
  mint_decimal_mult: Decimal;
  pool_id: number;

  deposit_amount: Decimal;
  deposit_index: Decimal;

  borrow_amount: Decimal;
  borrow_index: Decimal;

  reserve_factor: Decimal;
  fee_amount: Decimal;
  fee_withdrawn_amt: Decimal;
  fee_rate: Decimal;

  last_update_time: Decimal;

  spl_key: PublicKey;
  atoken_mint_key: PublicKey;
  price_key: PublicKey;
  pyth_price_key: PublicKey;

  serum_next_cl_id: Decimal;
  ltv: Decimal;
  safe_factor: Decimal;
  flags: number;

  base_rate: Decimal;
  multiplier1: Decimal;
  multiplier2: Decimal;
  kink: Decimal;
  borrow_rate: Decimal;
  deposit_rate: Decimal;

  reward_multiplier: Decimal;
  reward_deposit_intra: Decimal;

  reward_per_year: Decimal;
  reward_per_year_deposit: Decimal;
  reward_per_year_borrow: Decimal;
  reward_per_year_per_d: Decimal;
  reward_per_year_per_b: Decimal;

  reward_deposit_index: Decimal;
  reward_borrow_index: Decimal;

  deposit_cap: Decimal;
  is_disabled: boolean;
  farm_yield: Decimal;
}

export interface AssetPrice {
  price_in_usd: Decimal;
}

export interface UserInfo {
  page_id: number;
  num_assets: number;
  user_asset_info: UserAssetInfo[];
  reward: unknown;
  last_vest_cutoff_time: Decimal;
  last_update_time: Decimal;
  assist: Assist;
}

export interface JsonUserInfo {
  page_id: number;
  num_assets: number;
  user_asset_info: JsonUserAssetInfo[];
  reward: unknown;
  last_vest_cutoff_time: number;
  last_update_time: number;
  assist: Assist;
}

export interface UserAssetInfo {
  pool_id: number;
  use_as_collateral: number;

  deposit_amount: Decimal;
  deposit_interests: Decimal;
  deposit_index: Decimal;
  reward_deposit_amount: Decimal;
  reward_deposit_index: Decimal;

  borrow_amount: Decimal;
  borrow_interests: Decimal;
  borrow_index: Decimal;
  reward_borrow_amount: Decimal;
  reward_borrow_index: Decimal;
}

export interface JsonUserAssetInfo {
  pool_id: number;
  use_as_collateral: number;

  deposit_amount: number;
  deposit_interests: number;
  deposit_index: number;
  reward_deposit_amount: number;
  reward_deposit_index: number;

  borrow_amount: number;
  borrow_interests: number;
  borrow_index: number;
  reward_borrow_amount: number;
  reward_borrow_index: number;
}

export interface Assist {
  assist_mode: number;
  self_deleverage_factor: number;
  post_deleverage_factor: number;
  sell_sequence: Uint8Array;
  buy_sequence: Uint8Array;
  // skip tprice triggered actions
  num_actions: number;
  num_executed: number;
  //actions: unknown[];
}

export interface ApiAssetPool {
  tokenName: string;
  mintKey: PublicKey;
  poolKey: PublicKey;
  allowBorrow: boolean;
  isLp: boolean;
  isStable: boolean;
  depositAmount: Decimal;
  depositValue?: Decimal;
  borrowAmount: Decimal;
  borrowValue?: Decimal;
  depositRate: Decimal;
  depositAptRewardTokenRate: Decimal;
  depositAptRewardRate?: Decimal;
  depositMndeRewardTokenRate?: Decimal;
  depositMndeRewardRate?: Decimal;
  borrowRate: Decimal;
  borrowAptRewardTokenRate: Decimal;
  borrowAptRewardRate?: Decimal;
  borrowMndeRewardTokenRate?: Decimal;
  borrowMndeRewardRate?: Decimal;
  farmYieldRate: Decimal;
  lastPoolUpdate: Date;
  lastPriceUpdate?: Date;
}

export interface ApiBorrowPowerInfo {
  totalDeposit: Decimal;
  totalCollateral: Decimal;
  maxBorrowAllowed: Decimal;
  totalBorrow: Decimal;
  collateralRatio: Decimal;
  safeLimit: Decimal;
  forceAssistLimit: Decimal;
  liquidationLimit: Decimal;
  assistTriggerLimit?: Decimal;
  assistTargetLimit?: Decimal;
}

export interface ApiUserAssetInfo {
  tokenId: TokenID;
  useAsCollateral: boolean;
  ltv: Decimal;
  depositAmount: Decimal;
  depositValue?: Decimal;
  borrowAmount: Decimal;
  borrowValue?: Decimal;
}

export interface ApiUserInfo {
  userWallet: string;
  userAssetInfo: ApiUserAssetInfo[];
  borrowPowerInfo?: ApiBorrowPowerInfo;
}

export interface AptUserRewardInfo {
  // TODO
}

export const FAKE_KEY = SystemProgram.programId;

export const LM_MNDE_MULTIPLIER: Decimal = new Decimal(0.195);
export const SAFE_LIMIT: Decimal = new Decimal(0.9);
export const FORCE_ASSIST_LIMIT: Decimal = new Decimal(1.0);
export const LIQUIDATION_LIMIT: Decimal = new Decimal(1.01);

export const MINTS: { [key in TokenID]: PublicKey } = {
  [TokenID.APT]: new PublicKey("APTtJyaRX5yGTsJU522N4VYWg3vCvSb65eam5GrPT5Rt"),
  [TokenID.BTC]: new PublicKey("9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E"),
  [TokenID.ETH]: new PublicKey("2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk"),
  [TokenID.SOL]: new PublicKey("So11111111111111111111111111111111111111112"),
  [TokenID.mSOL]: new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"),
  [TokenID.stSOL]: new PublicKey(
    "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj"
  ),
  [TokenID.whETH]: new PublicKey(
    "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"
  ),

  [TokenID.RAY]: new PublicKey("4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"),
  [TokenID.ORCA]: new PublicKey("orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE"),
  [TokenID.SBR]: new PublicKey("Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1"),
  [TokenID.MERC]: new PublicKey("MERt85fc5boKw3BW1eYdxonEuJNvXbiMbs6hvheau5K"),
  [TokenID.MNDE]: new PublicKey("MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey"),
  [TokenID.FTT]: new PublicKey("AGFEad2et2ZJif9jaGpdMixQqvW5i81aBdvKe7PHNfz3"),
  [TokenID.SRM]: new PublicKey("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"),

  [TokenID.USDT]: new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
  [TokenID.USDC]: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  [TokenID.UST]: new PublicKey("CXLBjMMcwkc17GfJtBos6rQCo1ypeH6eDbB82Kby4MRm"),
  [TokenID.USTv2]: new PublicKey(
    "9vMJfxuKxXBoEa7rM12mYLMwTacLMLDJqHozw96WQL8i"
  ),

  [TokenID.USDT_USDC_SABER]: new PublicKey(
    "2poo1w1DL6yd2WNTCnNTzDqkC6MBXq7axo77P16yrBuf"
  ),
  [TokenID.USDC_USDT_ORCA]: new PublicKey(
    "H2uzgruPvonVpCRhwwdukcpXK8TG17swFNzYFr2rtPxy"
  ),
  [TokenID.UST_USDC_SABER]: new PublicKey(
    "UST32f2JtPGocLzsL41B3VBBoJzTm1mK1j3rwyM3Wgc"
  ),
  [TokenID.SOL_USDC_RAYDIUM]: new PublicKey(
    "8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu"
  ),
  [TokenID.RAY_USDC_RAYDIUM]: new PublicKey(
    "FbC6K13MzHvN42bXrtGaWsvZY9fxrackRSZcBGfjPc7m"
  ),
  [TokenID.SOL_USDT_RAYDIUM]: new PublicKey(
    "Epm4KfTj4DMrvqn6Bwg2Tr2N8vhQuNbuK8bESFp4k33K"
  ),
  [TokenID.SOL_USDC_ORCA]: new PublicKey(
    "APDFRM3HMr8CAGXwKHiu2f5ePSpaiEJhaURwhsRrUUt9"
  ),
  [TokenID.mSOL_SOL_ORCA]: new PublicKey(
    "29cdoMgu6MS2VXpcMo1sqRdWEzdUR9tjvoh8fcK8Z87R"
  ),
  [TokenID.ORCA_USDC_ORCA]: new PublicKey(
    "n8Mpu28RjeYD7oUX3LG1tPxzhRZh3YYLRSHcHRdS3Zx"
  ),
  [TokenID.ORCA_SOL_ORCA]: new PublicKey(
    "2uVjAuRXavpM6h1scGQaxqb6HVaNRn6T2X7HHXTabz25"
  ),
  [TokenID.ETH_USDC_ORCA]: new PublicKey(
    "3e1W6Aqcbuk2DfHUwRiRcyzpyYRRjg6yhZZcyEARydUX"
  ),
  [TokenID.SOL_USDT_ORCA]: new PublicKey(
    "FZthQCuYHhcfiDma7QrX7buDHwrZEd7vL8SjS6LQa3Tx"
  ),
  [TokenID.mSOL_SOL_RAYDIUM]: new PublicKey(
    "5ijRoAHVgd5T5CNtK5KDRUBZ7Bffb69nktMj5n6ks6m4"
  ),
  [TokenID.ETH_SOL_ORCA]: new PublicKey(
    "71FymgN2ZUf7VvVTLE8jYEnjP3jSK1Frp2XT1nHs8Hob"
  ),
  [TokenID.BTC_mSOL_ORCA]: new PublicKey(
    "8nKJ4z9FSw6wrVZKASqBiS9DS1CiNsRnqwCCKVQjqdkB"
  ),
  [TokenID.mSOL_USDC_ORCA]: new PublicKey(
    "8PSfyiTVwPb6Rr2iZ8F3kNpbg65BCfJM9v8LfB916r44"
  ),
  [TokenID.USTv2_USDC_SABER]: new PublicKey(
    "USTCmQpbUGj5iTsXdnTYHZupY1QpftDZhLokSVk6UWi"
  ),
  [TokenID.APT_USDC_ORCA]: new PublicKey(
    "HNrYngS1eoqkjWro9D3Y5Z9sWBDzPNK2tX4rfV2Up177"
  ),
  [TokenID.RAY_USDT_RAYDIUM]: new PublicKey(
    "C3sT1R3nsw4AVdepvLTLKr5Gvszr7jufyBWUCvy4TUvT"
  ),
  [TokenID.RAY_ETH_RAYDIUM]: new PublicKey(
    "mjQH33MqZv5aKAbKHi8dG3g3qXeRQqq1GFcXceZkNSr"
  ),
  [TokenID.RAY_SOL_RAYDIUM]: new PublicKey(
    "89ZKE4aoyfLBe2RuV6jM3JGNhaV18Nxh8eNtjRcndBip"
  ),
  [TokenID.SRM_USDC_RAYDIUM]: new PublicKey(
    "9XnZd82j34KxNLgQfz29jGbYdxsYznTWRpvZE3SRE7JG"
  ),
};

export const DECIMAL_MULT: { [key in TokenID]: number } = {
  [TokenID.APT]: 1e6,
  [TokenID.BTC]: 1e6,
  [TokenID.ETH]: 1e6,
  [TokenID.SOL]: 1e9,
  [TokenID.mSOL]: 1e9,
  [TokenID.stSOL]: 1e9,
  [TokenID.whETH]: 1e8,

  [TokenID.RAY]: 1e6,
  [TokenID.ORCA]: 1e6,
  [TokenID.SBR]: 1e6,
  [TokenID.MERC]: 1e6,
  [TokenID.MNDE]: 1e9,
  [TokenID.FTT]: 1e6,
  [TokenID.SRM]: 1e6,

  [TokenID.USDT]: 1e6,
  [TokenID.USDC]: 1e6,
  [TokenID.UST]: 1e9,
  [TokenID.USTv2]: 1e6,

  [TokenID.USDT_USDC_SABER]: 1e6,
  [TokenID.USDC_USDT_ORCA]: 1e6,
  [TokenID.UST_USDC_SABER]: 1e9,
  [TokenID.SOL_USDC_RAYDIUM]: 1e9,
  [TokenID.RAY_USDC_RAYDIUM]: 1e6,
  [TokenID.SOL_USDT_RAYDIUM]: 1e9,
  [TokenID.SOL_USDC_ORCA]: 1e6,
  [TokenID.mSOL_SOL_ORCA]: 1e6,
  [TokenID.ORCA_USDC_ORCA]: 1e6,
  [TokenID.ORCA_SOL_ORCA]: 1e6,
  [TokenID.ETH_USDC_ORCA]: 1e6,
  [TokenID.SOL_USDT_ORCA]: 1e6,
  [TokenID.mSOL_SOL_RAYDIUM]: 1e9,
  [TokenID.ETH_SOL_ORCA]: 1e6,
  [TokenID.BTC_mSOL_ORCA]: 1e6,
  [TokenID.mSOL_USDC_ORCA]: 1e6,
  [TokenID.USTv2_USDC_SABER]: 1e6,
  [TokenID.APT_USDC_ORCA]: 1e6,
  [TokenID.RAY_USDT_RAYDIUM]: 1e6,
  [TokenID.RAY_ETH_RAYDIUM]: 1e6,
  [TokenID.RAY_SOL_RAYDIUM]: 1e6,
  [TokenID.SRM_USDC_RAYDIUM]: 1e6,
};

const POOL_IDS: { [key in TokenID]?: PoolId } = {
  [TokenID.BTC]: 0,
  [TokenID.ETH]: 1,
  [TokenID.USDT]: 2,
  [TokenID.USDC]: 3,
  [TokenID.SOL]: 4,
  [TokenID.USDT_USDC_SABER]: 5,
  [TokenID.UST]: 6,
  // pool 7 deprecated
  [TokenID.USDC_USDT_ORCA]: 8,
  [TokenID.SOL_USDC_RAYDIUM]: 9,
  [TokenID.RAY_USDC_RAYDIUM]: 10,
  [TokenID.RAY]: 11,
  [TokenID.mSOL]: 12,
  [TokenID.ORCA]: 13,
  [TokenID.SOL_USDT_RAYDIUM]: 14,
  [TokenID.SOL_USDC_ORCA]: 15,
  [TokenID.mSOL_SOL_ORCA]: 16,
  [TokenID.ORCA_USDC_ORCA]: 17,
  [TokenID.ORCA_SOL_ORCA]: 18,
  [TokenID.ETH_USDC_ORCA]: 19,
  [TokenID.SOL_USDT_ORCA]: 20,
  [TokenID.USTv2]: 21,
  [TokenID.mSOL_SOL_RAYDIUM]: 22,
  [TokenID.ETH_SOL_ORCA]: 23,
  [TokenID.BTC_mSOL_ORCA]: 24,
  [TokenID.mSOL_USDC_ORCA]: 25,
  [TokenID.USTv2_USDC_SABER]: 26,
  [TokenID.APT]: 27,
  [TokenID.APT_USDC_ORCA]: 28,
  [TokenID.FTT]: 29,
  [TokenID.SRM]: 30,
  [TokenID.RAY_USDT_RAYDIUM]: 31,
  [TokenID.RAY_ETH_RAYDIUM]: 32,
  [TokenID.RAY_SOL_RAYDIUM]: 33,
  [TokenID.SRM_USDC_RAYDIUM]: 34,
  [TokenID.stSOL]: 35,
  [TokenID.whETH]: 36,
};

const LTVS: { [key in TokenID]?: number } = {
  [TokenID.APT]: 0,
  [TokenID.BTC]: 0.85,
  [TokenID.ETH]: 0.85,
  [TokenID.mSOL]: 0.8,
  [TokenID.SOL]: 0.8,
  [TokenID.stSOL]: 0.8,
  [TokenID.whETH]: 0.85,

  [TokenID.RAY]: 0.8,
  [TokenID.ORCA]: 0.8,
  [TokenID.FTT]: 0.8,
  [TokenID.SRM]: 0.8,

  [TokenID.USDT]: 0.9,
  [TokenID.USDC]: 0.9,
  [TokenID.UST]: 0.8,
  [TokenID.USTv2]: 0.8,

  [TokenID.USDT_USDC_SABER]: 0.8,
  [TokenID.USDC_USDT_ORCA]: 0.8,
  [TokenID.SOL_USDC_RAYDIUM]: 0.8,
  [TokenID.RAY_USDC_RAYDIUM]: 0.8,
  [TokenID.SOL_USDT_RAYDIUM]: 0.8,
  [TokenID.SOL_USDC_ORCA]: 0.8,
  [TokenID.mSOL_SOL_ORCA]: 0.8,
  [TokenID.ORCA_USDC_ORCA]: 0.8,
  [TokenID.ORCA_SOL_ORCA]: 0.8,
  [TokenID.ETH_USDC_ORCA]: 0.8,
  [TokenID.SOL_USDT_ORCA]: 0.8,
  [TokenID.mSOL_SOL_RAYDIUM]: 0.8,
  [TokenID.ETH_SOL_ORCA]: 0.8,
  [TokenID.BTC_mSOL_ORCA]: 0.8,
  [TokenID.mSOL_USDC_ORCA]: 0.8,
  [TokenID.USTv2_USDC_SABER]: 0.8,
  [TokenID.APT_USDC_ORCA]: 0.4,
  [TokenID.RAY_USDT_RAYDIUM]: 0.8,
  [TokenID.RAY_ETH_RAYDIUM]: 0.8,
  [TokenID.RAY_SOL_RAYDIUM]: 0.8,
  [TokenID.SRM_USDC_RAYDIUM]: 0.8,
};

export class InterestRate {
  multiplier: number;
  jumpMultiplier: number;
  constructor(
    public baseRate: number,
    public kink: number,
    public kinkRate: number,
    public fullRate: number
  ) {
    invariant(baseRate >= 0);
    invariant(kink > 0);
    invariant(kink < 1);
    invariant(kinkRate > 0);
    invariant(fullRate > kinkRate);
    this.multiplier = (kinkRate - baseRate) / kink;
    this.jumpMultiplier = (fullRate - kinkRate) / (1 - kink);
  }
}

const INTEREST_RATES: { [key in TokenID]?: InterestRate } = {
  [TokenID.BTC]: new InterestRate(0.02, 0.85, 0.2, 2.0),
  [TokenID.ETH]: new InterestRate(0.02, 0.85, 0.2, 2.0),
  [TokenID.SOL]: new InterestRate(0.02, 0.85, 0.2, 2.0),
  [TokenID.mSOL]: new InterestRate(0.02, 0.85, 0.2, 2.0),
  [TokenID.stSOL]: new InterestRate(0.02, 0.85, 0.2, 2.0),
  [TokenID.whETH]: new InterestRate(0.02, 0.85, 0.2, 2.0),

  [TokenID.APT]: new InterestRate(0.02, 0.85, 0.2, 2.0),
  [TokenID.RAY]: new InterestRate(0.02, 0.85, 0.2, 2.0),
  [TokenID.ORCA]: new InterestRate(0.02, 0.85, 0.2, 2.0),
  [TokenID.SBR]: new InterestRate(0.02, 0.85, 0.2, 2.0),
  [TokenID.FTT]: new InterestRate(0.02, 0.85, 0.2, 2.0),
  [TokenID.SRM]: new InterestRate(0.02, 0.85, 0.2, 2.0),

  [TokenID.USDT]: new InterestRate(0.01, 0.85, 0.08, 1.0),
  [TokenID.USDC]: new InterestRate(0.01, 0.85, 0.08, 1.0),
  [TokenID.UST]: new InterestRate(0.01, 0.85, 0.08, 1.0),
  [TokenID.USTv2]: new InterestRate(0.01, 0.85, 0.08, 1.0),
};

const FEES: { [key in TokenID]?: number } = {
  [TokenID.BTC]: 0.2,
  [TokenID.ETH]: 0.2,
  [TokenID.mSOL]: 0.2,
  [TokenID.SOL]: 0.2,
  [TokenID.stSOL]: 0.2,
  [TokenID.whETH]: 0.2,

  [TokenID.APT]: 0.2,
  [TokenID.RAY]: 0.2,
  [TokenID.ORCA]: 0.2,
  [TokenID.FTT]: 0.2,
  [TokenID.SRM]: 0.2,

  [TokenID.USDT]: 0.2,
  [TokenID.USDC]: 0.2,
  [TokenID.UST]: 0.2,
  [TokenID.USTv2]: 0.2,

  [TokenID.USDT_USDC_SABER]: 0.0, // no farming
  [TokenID.USDC_USDT_ORCA]: 0.2,
  [TokenID.SOL_USDC_RAYDIUM]: 0.2,
  [TokenID.RAY_USDC_RAYDIUM]: 0.2,
  [TokenID.SOL_USDT_RAYDIUM]: 0.2,
  [TokenID.SOL_USDC_ORCA]: 0.2,
  [TokenID.mSOL_SOL_ORCA]: 0.2,
  [TokenID.ORCA_USDC_ORCA]: 0.2,
  [TokenID.ORCA_SOL_ORCA]: 0.2,
  [TokenID.ETH_USDC_ORCA]: 0.2,
  [TokenID.SOL_USDT_ORCA]: 0.2,
  [TokenID.mSOL_SOL_RAYDIUM]: 0.0, // no reward
  [TokenID.ETH_SOL_ORCA]: 0.2,
  [TokenID.BTC_mSOL_ORCA]: 0.2,
  [TokenID.mSOL_USDC_ORCA]: 0.2,
  [TokenID.USTv2_USDC_SABER]: 0.2,
  [TokenID.APT_USDC_ORCA]: 0.2,
  [TokenID.RAY_USDT_RAYDIUM]: 0.2,
  [TokenID.RAY_ETH_RAYDIUM]: 0.2,
  [TokenID.RAY_SOL_RAYDIUM]: 0.2,
  [TokenID.SRM_USDC_RAYDIUM]: 0.2,
};

export const CATEGORY: { [key in TokenID]: TokenCategory } = {
  [TokenID.BTC]: TokenCategory.Volatile,
  [TokenID.ETH]: TokenCategory.Volatile,
  [TokenID.SOL]: TokenCategory.Volatile,
  [TokenID.mSOL]: TokenCategory.Volatile,
  [TokenID.stSOL]: TokenCategory.Volatile,
  [TokenID.whETH]: TokenCategory.Volatile,

  [TokenID.APT]: TokenCategory.Volatile,
  [TokenID.RAY]: TokenCategory.Volatile,
  [TokenID.ORCA]: TokenCategory.Volatile,
  [TokenID.SBR]: TokenCategory.Volatile,
  [TokenID.MERC]: TokenCategory.Volatile,
  [TokenID.MNDE]: TokenCategory.Volatile,
  [TokenID.FTT]: TokenCategory.Volatile,
  [TokenID.SRM]: TokenCategory.Volatile,

  [TokenID.USDT]: TokenCategory.Stable,
  [TokenID.USDC]: TokenCategory.Stable,
  [TokenID.UST]: TokenCategory.Stable,
  [TokenID.USTv2]: TokenCategory.Stable,

  [TokenID.USDT_USDC_SABER]: TokenCategory.Lp,
  [TokenID.USDC_USDT_ORCA]: TokenCategory.Lp,
  [TokenID.UST_USDC_SABER]: TokenCategory.Lp,
  [TokenID.SOL_USDC_RAYDIUM]: TokenCategory.Lp,
  [TokenID.RAY_USDC_RAYDIUM]: TokenCategory.Lp,
  [TokenID.SOL_USDT_RAYDIUM]: TokenCategory.Lp,
  [TokenID.SOL_USDC_ORCA]: TokenCategory.Lp,
  [TokenID.mSOL_SOL_ORCA]: TokenCategory.Lp,
  [TokenID.ORCA_USDC_ORCA]: TokenCategory.Lp,
  [TokenID.ORCA_SOL_ORCA]: TokenCategory.Lp,
  [TokenID.ETH_USDC_ORCA]: TokenCategory.Lp,
  [TokenID.SOL_USDT_ORCA]: TokenCategory.Lp,
  [TokenID.mSOL_SOL_RAYDIUM]: TokenCategory.Lp,
  [TokenID.ETH_SOL_ORCA]: TokenCategory.Lp,
  [TokenID.BTC_mSOL_ORCA]: TokenCategory.Lp,
  [TokenID.mSOL_USDC_ORCA]: TokenCategory.Lp,
  [TokenID.USTv2_USDC_SABER]: TokenCategory.Lp,
  [TokenID.APT_USDC_ORCA]: TokenCategory.Lp,
  [TokenID.RAY_USDT_RAYDIUM]: TokenCategory.Lp,
  [TokenID.RAY_ETH_RAYDIUM]: TokenCategory.Lp,
  [TokenID.RAY_SOL_RAYDIUM]: TokenCategory.Lp,
  [TokenID.SRM_USDC_RAYDIUM]: TokenCategory.Lp,
};

export const LIQUIDATION_DISCOUNT: { [key in TokenID]?: number } = {
  [TokenID.BTC]: 0.04,
  [TokenID.ETH]: 0.04,
  [TokenID.SOL]: 0.04,
  [TokenID.mSOL]: 0.04,
  [TokenID.stSOL]: 0.04,
  [TokenID.whETH]: 0.04,

  [TokenID.RAY]: 0.04,
  [TokenID.APT]: 0,
  [TokenID.ORCA]: 0.04,
  [TokenID.FTT]: 0.04,
  [TokenID.SRM]: 0.04,

  [TokenID.USDT]: 0.04,
  [TokenID.USDC]: 0.04,
  [TokenID.UST]: 0.04,
  [TokenID.USTv2]: 0.04,

  [TokenID.USDT_USDC_SABER]: 0,
  [TokenID.USDC_USDT_ORCA]: 0,
  [TokenID.UST_USDC_SABER]: 0,
  [TokenID.SOL_USDC_RAYDIUM]: 0,
  [TokenID.RAY_USDC_RAYDIUM]: 0,
  [TokenID.SOL_USDT_RAYDIUM]: 0,
  [TokenID.SOL_USDC_ORCA]: 0,
  [TokenID.mSOL_SOL_ORCA]: 0,
  [TokenID.ORCA_USDC_ORCA]: 0,
  [TokenID.ORCA_SOL_ORCA]: 0,
  [TokenID.ETH_USDC_ORCA]: 0,
  [TokenID.SOL_USDT_ORCA]: 0,
  [TokenID.mSOL_SOL_RAYDIUM]: 0,
  [TokenID.ETH_SOL_ORCA]: 0,
  [TokenID.BTC_mSOL_ORCA]: 0,
  [TokenID.mSOL_USDC_ORCA]: 0,
  [TokenID.USTv2_USDC_SABER]: 0,
  [TokenID.APT_USDC_ORCA]: 0,
  [TokenID.RAY_USDT_RAYDIUM]: 0,
  [TokenID.RAY_ETH_RAYDIUM]: 0,
  [TokenID.RAY_SOL_RAYDIUM]: 0,
  [TokenID.SRM_USDC_RAYDIUM]: 0,
};

export const LP_TO_LR: { [key in TokenID]?: [TokenID, TokenID] } = {
  [TokenID.USDT_USDC_SABER]: [TokenID.USDT, TokenID.USDC],
  [TokenID.USDC_USDT_ORCA]: [TokenID.USDC, TokenID.USDT],
  [TokenID.UST_USDC_SABER]: [TokenID.UST, TokenID.USDC],
  [TokenID.SOL_USDC_RAYDIUM]: [TokenID.SOL, TokenID.USDC],
  [TokenID.RAY_USDC_RAYDIUM]: [TokenID.RAY, TokenID.USDC],
  [TokenID.SOL_USDT_RAYDIUM]: [TokenID.SOL, TokenID.USDT],
  [TokenID.SOL_USDC_ORCA]: [TokenID.SOL, TokenID.USDC],
  [TokenID.mSOL_SOL_ORCA]: [TokenID.mSOL, TokenID.SOL],
  [TokenID.ORCA_USDC_ORCA]: [TokenID.ORCA, TokenID.USDC],
  [TokenID.ORCA_SOL_ORCA]: [TokenID.ORCA, TokenID.SOL],
  [TokenID.ETH_USDC_ORCA]: [TokenID.ETH, TokenID.USDC],
  [TokenID.SOL_USDT_ORCA]: [TokenID.SOL, TokenID.USDT],
  [TokenID.mSOL_SOL_RAYDIUM]: [TokenID.mSOL, TokenID.SOL],
  [TokenID.ETH_SOL_ORCA]: [TokenID.ETH, TokenID.SOL],
  [TokenID.BTC_mSOL_ORCA]: [TokenID.BTC, TokenID.mSOL],
  [TokenID.mSOL_USDC_ORCA]: [TokenID.mSOL, TokenID.USDC],
  [TokenID.USTv2_USDC_SABER]: [TokenID.USTv2, TokenID.USDC],
  [TokenID.APT_USDC_ORCA]: [TokenID.APT, TokenID.USDC],
  [TokenID.RAY_USDT_RAYDIUM]: [TokenID.RAY, TokenID.USDT],
  [TokenID.RAY_ETH_RAYDIUM]: [TokenID.RAY, TokenID.ETH],
  [TokenID.RAY_SOL_RAYDIUM]: [TokenID.RAY, TokenID.SOL],
  [TokenID.SRM_USDC_RAYDIUM]: [TokenID.SRM, TokenID.USDC],
};

export const LP_TO_TARGET_SWAP: { [key in TokenID]?: number } = {
  [TokenID.USDT_USDC_SABER]: SWAP_SABER,
  [TokenID.USDC_USDT_ORCA]: SWAP_ORCA,
  [TokenID.UST_USDC_SABER]: SWAP_SABER,
  [TokenID.SOL_USDC_RAYDIUM]: SWAP_RAYDIUM,
  [TokenID.RAY_USDC_RAYDIUM]: SWAP_RAYDIUM,
  [TokenID.SOL_USDT_RAYDIUM]: SWAP_RAYDIUM,
  [TokenID.SOL_USDC_ORCA]: SWAP_ORCA,
  [TokenID.mSOL_SOL_ORCA]: SWAP_ORCA,
  [TokenID.ORCA_USDC_ORCA]: SWAP_ORCA,
  [TokenID.ORCA_SOL_ORCA]: SWAP_ORCA,
  [TokenID.ETH_USDC_ORCA]: SWAP_ORCA,
  [TokenID.SOL_USDT_ORCA]: SWAP_ORCA,
  [TokenID.mSOL_SOL_RAYDIUM]: SWAP_RAYDIUM,
  [TokenID.ETH_SOL_ORCA]: SWAP_ORCA,
  [TokenID.BTC_mSOL_ORCA]: SWAP_ORCA,
  [TokenID.mSOL_USDC_ORCA]: SWAP_ORCA,
  [TokenID.USTv2_USDC_SABER]: SWAP_SABER,
  [TokenID.APT_USDC_ORCA]: SWAP_ORCA,
  [TokenID.RAY_USDT_RAYDIUM]: SWAP_RAYDIUM,
  [TokenID.RAY_ETH_RAYDIUM]: SWAP_RAYDIUM,
  [TokenID.RAY_SOL_RAYDIUM]: SWAP_RAYDIUM,
  [TokenID.SRM_USDC_RAYDIUM]: SWAP_RAYDIUM,
};

export const LP_TO_DEX: { [key in TokenID]?: Dex } = {
  [TokenID.USDT_USDC_SABER]: Dex.Saber,
  [TokenID.USDC_USDT_ORCA]: Dex.Orca,
  [TokenID.UST_USDC_SABER]: Dex.Saber,
  [TokenID.SOL_USDC_RAYDIUM]: Dex.Raydium,
  [TokenID.RAY_USDC_RAYDIUM]: Dex.Raydium,
  [TokenID.SOL_USDT_RAYDIUM]: Dex.Raydium,
  [TokenID.SOL_USDC_ORCA]: Dex.Orca,
  [TokenID.mSOL_SOL_ORCA]: Dex.Orca,
  [TokenID.ORCA_USDC_ORCA]: Dex.Orca,
  [TokenID.ORCA_SOL_ORCA]: Dex.Orca,
  [TokenID.ETH_USDC_ORCA]: Dex.Orca,
  [TokenID.SOL_USDT_ORCA]: Dex.Orca,
  [TokenID.mSOL_SOL_RAYDIUM]: Dex.Raydium,
  [TokenID.ETH_SOL_ORCA]: Dex.Orca,
  [TokenID.BTC_mSOL_ORCA]: Dex.Orca,
  [TokenID.mSOL_USDC_ORCA]: Dex.Orca,
  [TokenID.USTv2_USDC_SABER]: Dex.Saber,
  [TokenID.APT_USDC_ORCA]: Dex.Orca,
  [TokenID.RAY_USDT_RAYDIUM]: Dex.Raydium,
  [TokenID.RAY_ETH_RAYDIUM]: Dex.Raydium,
  [TokenID.RAY_SOL_RAYDIUM]: Dex.Raydium,
  [TokenID.SRM_USDC_RAYDIUM]: Dex.Raydium,
};

export const LP_TO_NEED_2ND_STAKE: { [key in TokenID]?: boolean } = {
  [TokenID.USDT_USDC_SABER]: false,
  [TokenID.USDC_USDT_ORCA]: false,
  [TokenID.UST_USDC_SABER]: false,
  [TokenID.SOL_USDC_RAYDIUM]: true,
  [TokenID.RAY_USDC_RAYDIUM]: true,
  [TokenID.SOL_USDT_RAYDIUM]: true,
  [TokenID.SOL_USDC_ORCA]: false,
  [TokenID.mSOL_SOL_ORCA]: true,
  [TokenID.ORCA_USDC_ORCA]: false,
  [TokenID.ORCA_SOL_ORCA]: false,
  [TokenID.ETH_USDC_ORCA]: false,
  [TokenID.SOL_USDT_ORCA]: false,
  [TokenID.mSOL_SOL_RAYDIUM]: false,
  [TokenID.ETH_SOL_ORCA]: false,
  [TokenID.BTC_mSOL_ORCA]: true,
  [TokenID.mSOL_USDC_ORCA]: true,
  [TokenID.USTv2_USDC_SABER]: false,
  [TokenID.APT_USDC_ORCA]: false,
  [TokenID.RAY_USDT_RAYDIUM]: true,
  [TokenID.RAY_ETH_RAYDIUM]: true,
  [TokenID.RAY_SOL_RAYDIUM]: true,
  [TokenID.SRM_USDC_RAYDIUM]: true,
};

// meta-info used by Addresses to compute keys needed when interacting with various Solana swaps
// check out Addresses to see how they are used
export const SWAP_METAS = {
  [SWAP_SABER]: {
    stake_program: new PublicKey("QMNeHCGYnLVDn1icRAfQZpjPLBNkfGbSKRB83G5d8KB"),
    deposit_program: new PublicKey(
      "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ"
    ),
    redeem_program: new PublicKey(
      "RDM23yr8pr1kEAmhnFpaabPny6C9UVcEcok3Py5v86X"
    ),
  },
  [SWAP_ORCA]: {
    depositProgramPubkey: new PublicKey(
      "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP"
    ),
    farmProgramPubkey: new PublicKey(
      "82yxjeMsvaURa4MbZZ7WZZHfobirZYkH1zF8fmeGtyaQ"
    ),
  },
  [SWAP_RAYDIUM]: {
    depositProgramPubkey: new PublicKey(
      "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"
    ),
    stakeProgramPubkey: new PublicKey(
      "EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q"
    ),
    stakeProgramV5Pubkey: new PublicKey(
      "9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z"
    ),
  },
};

const isPublicOrAlpha = (ownerKey: PublicKey) => {
  const isPublic =
    ownerKey.toString() === "7Ne6h2w3LpTNTa7CNYcUs7UkjeJT3oW7jcrXWfVScTXW";
  const isAlpha =
    ownerKey.toString() === "GipxmFXdiJaSevu6StymY2aphKVxgYmAmf2dT3fTEASc";
  if (!isAlpha && !isPublic) {
    throw new Error(`Unknown ownerKey: ${ownerKey.toString()}`);
  }
  return { isPublic, isAlpha };
};

type SaberLpArgs = {
  swap: PublicKey;
  swapAuthority: PublicKey;
  tokenAVault: PublicKey;
  tokenBVault: PublicKey;
  tokenAfees: PublicKey;
  tokenBfees: PublicKey;

  // for stake/unstake
  quarry: PublicKey;
  rewarder: PublicKey;
  mint: PublicKey;
};

export class SaberLpSwapInfo implements LpSwapKeyInfo {
  swap: PublicKey;
  swapAuthority: PublicKey;
  tokenAVault: PublicKey;
  tokenBVault: PublicKey;
  tokenAfees: PublicKey;
  tokenBfees: PublicKey;

  // for stake/unstake
  quarry: PublicKey;
  rewarder: PublicKey;
  mint: PublicKey;
  constructor(args: SaberLpArgs) {
    this.swap = args.swap;
    this.swapAuthority = args.swapAuthority;
    this.tokenAVault = args.tokenAVault;
    this.tokenBVault = args.tokenBVault;
    this.tokenAfees = args.tokenAfees;
    this.tokenBfees = args.tokenBfees;
    //
    this.quarry = args.quarry;
    this.rewarder = args.rewarder;
    this.mint = args.mint;
  }
  async getMinerKey(ownerKey: PublicKey): Promise<[PublicKey, number]> {
    const [key, bump] = await PublicKey.findProgramAddress(
      [Buffer.from("Miner"), this.quarry.toBuffer(), ownerKey.toBuffer()],
      SWAP_METAS[SWAP_SABER].stake_program
    );
    return [key, bump];
  }

  async getMinerVault(ownerKey: PublicKey): Promise<PublicKey> {
    const [minerKey] = await this.getMinerKey(ownerKey);
    return await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      this.mint,
      minerKey,
      true
    );
  }

  async getLpDepositKeys(_ownerKey: PublicKey) {
    /*
    - saber_lp_program
    - swap
    - swap authority
    - swap_token_a_vault
    - swap_token_b_vault
    - pool_mint
    - clock
    */
    const smeta = SWAP_METAS[SWAP_SABER];
    return [
      { pubkey: smeta.deposit_program, isSigner: false, isWritable: false },

      { pubkey: this.swap, isSigner: false, isWritable: false },
      { pubkey: this.swapAuthority, isSigner: false, isWritable: false },

      { pubkey: this.tokenAVault, isSigner: false, isWritable: true },
      { pubkey: this.tokenBVault, isSigner: false, isWritable: true },

      { pubkey: this.mint, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ];
  }

  async getLpWithdrawKeys() {
    /*
    - saber_lp_program
    - swap
    - swap authority
    - lp_mint
    - swap_token_a_vault
    - swap_token_b_vault
    - swap_token_a_fees
    - swap_token_b_fees
    - clock
    */
    const smeta = SWAP_METAS[SWAP_SABER];
    return [
      { pubkey: smeta.deposit_program, isSigner: false, isWritable: false },

      { pubkey: this.swap, isSigner: false, isWritable: false },
      { pubkey: this.swapAuthority, isSigner: false, isWritable: false },

      { pubkey: this.mint, isSigner: false, isWritable: true },

      { pubkey: this.tokenAVault, isSigner: false, isWritable: true },
      { pubkey: this.tokenBVault, isSigner: false, isWritable: true },

      { pubkey: this.tokenAfees, isSigner: false, isWritable: true },
      { pubkey: this.tokenBfees, isSigner: false, isWritable: true },

      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ];
  }

  async getLpStakeKeys(ownerKey: PublicKey) {
    /*
    - saber_stake_program,
    - miner
    - quarry
    - miner_vault
    - token_program
    - rewarder
    - clock
      */
    const smeta = SWAP_METAS[SWAP_SABER];
    const [minerKey, _minerBump] = await this.getMinerKey(ownerKey);
    const minerVault = await this.getMinerVault(ownerKey);
    return [
      { pubkey: smeta.stake_program, isSigner: false, isWritable: false },
      { pubkey: minerKey, isSigner: false, isWritable: true },
      { pubkey: this.quarry, isSigner: false, isWritable: true },
      { pubkey: minerVault, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: this.rewarder, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ];
  }

  getLRVaults(): [PublicKey, PublicKey] {
    // only USDT_USDC_SABER has this inverted order
    const isUSDT_USDC =
      this.mint.toString() === MINTS.USDT_USDC_SABER.toString();
    if (isUSDT_USDC) {
      return [this.tokenBVault, this.tokenAVault];
    } else {
      return [this.tokenAVault, this.tokenBVault];
    }
  }
}

type OrcaLpArgs = {
  lpMintPubkey: PublicKey;

  swapPubkey: PublicKey;
  swapAuthority: PublicKey;

  swapTokenAAccount: PublicKey;
  swapTokenBAccount: PublicKey;

  globalLpVault: PublicKey;
  farmTokenMint: PublicKey;
  globalFarmState: PublicKey;
  globalRewardTokenVault: PublicKey;
  rewardTokenAuthority: PublicKey;
  feeAccount: PublicKey;
  publicRewardTokAcc: PublicKey;
  alphaRewardTokAcc: PublicKey;

  isDoubleDipSupported?: boolean;
  globalLp3Vault?: PublicKey;
  farmTokenLp3Mint?: PublicKey;
  globalDoubleDipFarmState?: PublicKey;
  globalDoubleDipRewardTokenVault?: PublicKey;
  doubleDipRewardTokenAuthority?: PublicKey;
  publicDoubleDipRewardAcc?: PublicKey;
  alphaDoubleDipRewardAcc?: PublicKey;
  doubleDipRewardMint?: PublicKey;
};

export class OrcaLpSwapInfo implements LpSwapKeyInfo {
  lpMintPubkey: PublicKey;

  swapPubkey: PublicKey;
  swapAuthority: PublicKey;

  swapTokenAAccount: PublicKey;
  swapTokenBAccount: PublicKey;

  globalLpVault: PublicKey;
  farmTokenMint: PublicKey;
  globalFarmState: PublicKey;
  globalRewardTokenVault: PublicKey;
  rewardTokenAuthority: PublicKey;
  feeAccount: PublicKey;
  publicRewardTokAcc: PublicKey;
  alphaRewardTokAcc: PublicKey;

  isDoubleDipSupported = false;
  globalLp3Vault?: PublicKey;
  farmTokenLp3Mint?: PublicKey;
  globalDoubleDipFarmState?: PublicKey;
  globalDoubleDipRewardTokenVault?: PublicKey;
  doubleDipRewardTokenAuthority?: PublicKey;
  publicDoubleDipRewardAcc?: PublicKey;
  alphaDoubleDipRewardAcc?: PublicKey;
  doubleDipRewardMint?: PublicKey;
  constructor(args: OrcaLpArgs) {
    this.lpMintPubkey = args.lpMintPubkey;
    this.swapPubkey = args.swapPubkey;
    this.swapAuthority = args.swapAuthority;
    this.swapTokenAAccount = args.swapTokenAAccount;
    this.swapTokenBAccount = args.swapTokenBAccount;
    this.globalLpVault = args.globalLpVault;
    this.farmTokenMint = args.farmTokenMint;
    this.globalFarmState = args.globalFarmState;
    this.globalRewardTokenVault = args.globalRewardTokenVault;
    this.rewardTokenAuthority = args.rewardTokenAuthority;
    this.feeAccount = args.feeAccount;
    this.publicRewardTokAcc = args.publicRewardTokAcc;
    this.alphaRewardTokAcc = args.alphaRewardTokAcc;

    this.isDoubleDipSupported = !!args.isDoubleDipSupported;
    this.globalLp3Vault = args.globalLp3Vault;
    this.farmTokenLp3Mint = args.farmTokenLp3Mint;
    this.globalDoubleDipFarmState = args.globalDoubleDipFarmState;
    this.globalDoubleDipRewardTokenVault = args.globalDoubleDipRewardTokenVault;
    this.doubleDipRewardTokenAuthority = args.doubleDipRewardTokenAuthority;
    this.publicDoubleDipRewardAcc = args.publicDoubleDipRewardAcc;
    this.alphaDoubleDipRewardAcc = args.alphaDoubleDipRewardAcc;
    this.doubleDipRewardMint = args.doubleDipRewardMint;
    if (this.isDoubleDipSupported) {
      invariant(
        this.globalLp3Vault &&
          this.farmTokenLp3Mint &&
          this.globalDoubleDipFarmState &&
          this.globalDoubleDipRewardTokenVault &&
          this.doubleDipRewardTokenAuthority &&
          this.publicDoubleDipRewardAcc &&
          this.alphaDoubleDipRewardAcc &&
          this.doubleDipRewardMint
      );
    }
  }

  async getPdaKeys(ownerKey: PublicKey) {
    const smeta = SWAP_METAS[SWAP_ORCA];
    let pdaRewardTokenAccount: PublicKey;
    const { isPublic } = isPublicOrAlpha(ownerKey);
    if (isPublic) {
      pdaRewardTokenAccount = this.publicRewardTokAcc;
    } else {
      pdaRewardTokenAccount = this.alphaRewardTokAcc;
    }

    const pdaFarmTokenAccount = await getAssociatedTokenPubkey(
      ownerKey,
      this.farmTokenMint,
      true
    );
    const pdaFarmState = (
      await PublicKey.findProgramAddress(
        [
          this.globalFarmState.toBuffer(),
          ownerKey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
        ],
        smeta.farmProgramPubkey
      )
    )[0];

    return {
      pdaFarmTokenAccount,
      pdaRewardTokenAccount,
      pdaFarmState,
    };
  }

  async getPdaDoubleDipKeys(ownerKey: PublicKey) {
    if (!this.isDoubleDipSupported) {
      throw new Error("Double dip not supported for getting pda keys");
    }
    const smeta = SWAP_METAS[SWAP_ORCA];
    let pdaDoubleDipRewardTokenAccount: PublicKey;
    const { isPublic } = isPublicOrAlpha(ownerKey);
    if (isPublic) {
      pdaDoubleDipRewardTokenAccount = this.publicDoubleDipRewardAcc!;
    } else {
      pdaDoubleDipRewardTokenAccount = this.alphaDoubleDipRewardAcc!;
    }

    const pdaDoubleDipFarmTokenAccount = await getAssociatedTokenPubkey(
      ownerKey,
      this.farmTokenLp3Mint!,
      true
    );
    const pdaDoubleDipFarmState = (
      await PublicKey.findProgramAddress(
        [
          this.globalDoubleDipFarmState!.toBuffer(),
          ownerKey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
        ],
        smeta.farmProgramPubkey
      )
    )[0];

    return {
      pdaDoubleDipFarmTokenAccount,
      pdaDoubleDipRewardTokenAccount,
      pdaDoubleDipFarmState,
    };
  }

  async getLpDepositKeys(_ownerKey: PublicKey) {
    const smeta = SWAP_METAS[SWAP_ORCA];
    return [
      {
        pubkey: smeta.depositProgramPubkey,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: this.swapPubkey, isSigner: false, isWritable: false },
      { pubkey: this.swapAuthority, isSigner: false, isWritable: false },
      { pubkey: this.swapTokenAAccount, isSigner: false, isWritable: true },
      { pubkey: this.swapTokenBAccount, isSigner: false, isWritable: true },
      { pubkey: this.lpMintPubkey, isSigner: false, isWritable: true },
    ];
  }

  async getLpWithdrawKeys(_ownerKey: PublicKey) {
    const smeta = SWAP_METAS[SWAP_ORCA];
    return [
      {
        pubkey: smeta.depositProgramPubkey,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: this.swapPubkey, isSigner: false, isWritable: false },
      { pubkey: this.swapAuthority, isSigner: false, isWritable: false },
      { pubkey: this.lpMintPubkey, isSigner: false, isWritable: true },
      { pubkey: this.swapTokenAAccount, isSigner: false, isWritable: true },
      { pubkey: this.swapTokenBAccount, isSigner: false, isWritable: true },
      { pubkey: this.feeAccount, isSigner: false, isWritable: true },
    ];
  }

  async getLpStakeKeys(ownerKey: PublicKey) {
    /*
    For double-dipped transactions, we have removed staking instruction out of the corresponding lp-create and lp-redeem
    transaction, and all into the second stake operation
    */
    if (this.isDoubleDipSupported) {
      return [];
    }
    return await this.getFirstStakeKeys(ownerKey);
  }

  async getFirstStakeKeys(ownerKey: PublicKey) {
    const smeta = SWAP_METAS[SWAP_ORCA];
    const pdaKeys = await this.getPdaKeys(ownerKey);
    return [
      { pubkey: smeta.farmProgramPubkey, isSigner: false, isWritable: false },
      { pubkey: this.globalLpVault, isSigner: false, isWritable: true },
      { pubkey: this.farmTokenMint, isSigner: false, isWritable: true },
      {
        pubkey: pdaKeys.pdaFarmTokenAccount,
        isSigner: false,
        isWritable: true,
      },
      { pubkey: this.globalFarmState, isSigner: false, isWritable: true },
      { pubkey: pdaKeys.pdaFarmState, isSigner: false, isWritable: true },
      {
        pubkey: this.globalRewardTokenVault,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: pdaKeys.pdaRewardTokenAccount,
        isSigner: false,
        isWritable: true,
      },
      { pubkey: this.rewardTokenAuthority, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
  }

  async getSecondStakeKeys(ownerKey: PublicKey) {
    const smeta = SWAP_METAS[SWAP_ORCA];
    const pdaKeys = await this.getPdaDoubleDipKeys(ownerKey);
    return [
      { pubkey: smeta.farmProgramPubkey, isSigner: false, isWritable: false },
      { pubkey: this.globalLp3Vault!, isSigner: false, isWritable: true },
      { pubkey: this.farmTokenLp3Mint!, isSigner: false, isWritable: true },
      {
        pubkey: pdaKeys.pdaDoubleDipFarmTokenAccount!,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: this.globalDoubleDipFarmState!,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: pdaKeys.pdaDoubleDipFarmState!,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: this.globalDoubleDipRewardTokenVault!,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: pdaKeys.pdaDoubleDipRewardTokenAccount!,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: this.doubleDipRewardTokenAuthority!,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
  }

  getLRVaults(): [PublicKey, PublicKey] {
    return [this.swapTokenAAccount, this.swapTokenBAccount];
  }
}

type RaydiumStakeKeys = {
  poolIdPubkey: PublicKey;
  poolAuthorityPubkey: PublicKey;

  poolLPVault: PublicKey;
};

type RaydiumRewardKeys = {
  rewardToken: TokenID;
  userRewardAlphaAccountPubkey: PublicKey;
  userRewardPublicAccountPubkey: PublicKey;
  rewardVault: PublicKey;
};

type RaydiumLpArgs = {
  lpMintPubkey: PublicKey;

  ammIdPubkey: PublicKey;
  ammAuthPubkey: PublicKey;
  ammOpenOrdersPubkey: PublicKey;
  ammTargetOrderPubkey: PublicKey;

  poolCoinTokenPubkey: PublicKey;
  poolPcTokenPubkey: PublicKey;
  poolWithdrawQueue: PublicKey;
  poolTempLpTokenAccount: PublicKey;

  serumProgramId: PublicKey;
  serumMarketPubkey: PublicKey;
  serumCoinVaultAccount: PublicKey;
  serumPcVaultAccount: PublicKey;
  serumVaultSigner: PublicKey;

  rewardAccounts?: RaydiumRewardKeys[];

  stakeKeys: RaydiumStakeKeys | null;
  stakeProgram?: PublicKey;
};

export class RaydiumLpSwapInfo implements LpSwapKeyInfo {
  lpMintPubkey: PublicKey;

  ammIdPubkey: PublicKey;
  ammAuthPubkey: PublicKey;
  ammOpenOrdersPubkey: PublicKey;
  ammTargetOrderPubkey: PublicKey;

  poolCoinTokenPubkey: PublicKey;
  poolPcTokenPubkey: PublicKey;
  poolWithdrawQueue: PublicKey;
  poolTempLpTokenAccount: PublicKey;

  serumProgramId: PublicKey;
  serumMarketPubkey: PublicKey;
  serumCoinVaultAccount: PublicKey;
  serumPcVaultAccount: PublicKey;
  serumVaultSigner: PublicKey;

  rewardAccounts?: RaydiumRewardKeys[];

  stakeKeys: RaydiumStakeKeys | null;
  stakeProgram: PublicKey;
  constructor(args: RaydiumLpArgs) {
    this.lpMintPubkey = args.lpMintPubkey;

    this.ammIdPubkey = args.ammIdPubkey;
    this.ammAuthPubkey = args.ammAuthPubkey;
    this.ammOpenOrdersPubkey = args.ammOpenOrdersPubkey;
    this.ammTargetOrderPubkey = args.ammTargetOrderPubkey;

    this.poolCoinTokenPubkey = args.poolCoinTokenPubkey;
    this.poolPcTokenPubkey = args.poolPcTokenPubkey;
    this.poolWithdrawQueue = args.poolWithdrawQueue;
    this.poolTempLpTokenAccount = args.poolTempLpTokenAccount;

    this.serumProgramId = args.serumProgramId;
    this.serumMarketPubkey = args.serumMarketPubkey;
    this.serumCoinVaultAccount = args.serumCoinVaultAccount;
    this.serumPcVaultAccount = args.serumPcVaultAccount;
    this.serumVaultSigner = args.serumVaultSigner;

    this.rewardAccounts = args.rewardAccounts;
    this.stakeKeys = args.stakeKeys;
    this.stakeProgram =
      args.stakeProgram || SWAP_METAS[SWAP_RAYDIUM].stakeProgramV5Pubkey;
  }
  async getLpDepositKeys(_ownerKey: PublicKey) {
    const smeta = SWAP_METAS[SWAP_RAYDIUM];
    return [
      {
        pubkey: smeta.depositProgramPubkey,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: this.ammIdPubkey, isSigner: false, isWritable: true },
      { pubkey: this.ammAuthPubkey, isSigner: false, isWritable: false },
      { pubkey: this.ammOpenOrdersPubkey, isSigner: false, isWritable: false },
      { pubkey: this.ammTargetOrderPubkey, isSigner: false, isWritable: true },
      { pubkey: this.lpMintPubkey, isSigner: false, isWritable: true },
      { pubkey: this.poolCoinTokenPubkey, isSigner: false, isWritable: true },
      { pubkey: this.poolPcTokenPubkey, isSigner: false, isWritable: true },
      { pubkey: this.serumMarketPubkey, isSigner: false, isWritable: false },
    ];
  }
  async getLpWithdrawKeys(_ownerKey: PublicKey) {
    const smeta = SWAP_METAS[SWAP_RAYDIUM];
    return [
      {
        pubkey: smeta.depositProgramPubkey,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: this.ammIdPubkey, isSigner: false, isWritable: true },
      { pubkey: this.ammAuthPubkey, isSigner: false, isWritable: false },
      { pubkey: this.ammOpenOrdersPubkey, isSigner: false, isWritable: false },
      { pubkey: this.ammTargetOrderPubkey, isSigner: false, isWritable: true },
      { pubkey: this.lpMintPubkey, isSigner: false, isWritable: true },
      { pubkey: this.poolCoinTokenPubkey, isSigner: false, isWritable: true },
      { pubkey: this.poolPcTokenPubkey, isSigner: false, isWritable: true },
      { pubkey: this.poolWithdrawQueue, isSigner: false, isWritable: true },
      {
        pubkey: this.poolTempLpTokenAccount,
        isSigner: false,
        isWritable: true,
      },

      { pubkey: this.serumProgramId, isSigner: false, isWritable: false },
      { pubkey: this.serumMarketPubkey, isSigner: false, isWritable: true },
      { pubkey: this.serumCoinVaultAccount, isSigner: false, isWritable: true },
      { pubkey: this.serumPcVaultAccount, isSigner: false, isWritable: true },
      { pubkey: this.serumVaultSigner, isSigner: false, isWritable: false },
    ];
  }
  async getLpStakeKeys(ownerKey: PublicKey) {
    if (!this.stakeKeys) {
      return [];
    } else {
      invariant(this.rewardAccounts);
      const stkeys = this.stakeKeys;
      const userLedger = await this.getAssociatedLedger(ownerKey);
      console.log(`user ledger: ${userLedger.toBase58()}`);

      const { isPublic } = isPublicOrAlpha(ownerKey);
      const userRewardFirstAccount = isPublic
        ? this.rewardAccounts![0].userRewardPublicAccountPubkey
        : this.rewardAccounts![0].userRewardAlphaAccountPubkey;

      const keys = [
        { pubkey: this.stakeProgram, isSigner: false, isWritable: false },
        { pubkey: stkeys.poolIdPubkey, isSigner: false, isWritable: true },
        {
          pubkey: stkeys.poolAuthorityPubkey,
          isSigner: false,
          isWritable: false,
        },
        { pubkey: userLedger, isSigner: false, isWritable: true },

        { pubkey: stkeys.poolLPVault, isSigner: false, isWritable: true },

        { pubkey: userRewardFirstAccount, isSigner: false, isWritable: true },
        {
          pubkey: this.rewardAccounts![0].rewardVault,
          isSigner: false,
          isWritable: true,
        },

        // Below account are not listed on solscan.io but explorer.solana.com, so you should better check both sites.
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ];
      if (this.rewardAccounts.length > 1) {
        for (let i = 1; i < this.rewardAccounts.length; i++) {
          const userRewardAccount = isPublic
            ? this.rewardAccounts![i].userRewardPublicAccountPubkey
            : this.rewardAccounts![i].userRewardAlphaAccountPubkey;
          keys.push(
            ...[
              { pubkey: userRewardAccount, isSigner: false, isWritable: true },
              {
                pubkey: this.rewardAccounts![i].rewardVault,
                isSigner: false,
                isWritable: true,
              },
            ]
          );
        }
      }

      return keys;
    }
  }
  async getUserRewardAccountsToClaim(ownerKey: PublicKey) {
    const { isPublic } = isPublicOrAlpha(ownerKey);
    return this.rewardAccounts!.reduce((pre, cur) => {
      pre[cur.rewardToken] = isPublic
        ? cur.userRewardPublicAccountPubkey
        : cur.userRewardAlphaAccountPubkey;
      return pre;
    }, {} as Record<TokenID, PublicKey>);
  }
  getLRVaults(): [PublicKey, PublicKey] {
    return [this.poolCoinTokenPubkey, this.poolPcTokenPubkey];
  }
  async getAssociatedLedger(owner: PublicKey) {
    const poolId = this.stakeKeys?.poolIdPubkey;
    invariant(poolId);
    const [publicKey] = await PublicKey.findProgramAddress(
      [
        poolId.toBuffer(),
        owner.toBuffer(),
        Buffer.from("staker_info_v2_associated_seed", "utf-8"),
      ],
      this.stakeProgram
    );
    return publicKey;
  }
}

export const SABER_LP_METAS: { [key in TokenID]?: SaberLpSwapInfo } = {
  [TokenID.USDT_USDC_SABER]: new SaberLpSwapInfo({
    swap: new PublicKey("YAkoNb6HKmSxQN9L8hiBE5tPJRsniSSMzND1boHmZxe"),
    swapAuthority: new PublicKey(
      "5C1k9yV7y4CjMnKv8eGYDgWND8P89Pdfj79Trk2qmfGo"
    ),
    tokenAVault: new PublicKey("CfWX7o2TswwbxusJ4hCaPobu2jLCb1hfXuXJQjVq3jQF"), // USDC
    tokenBVault: new PublicKey("EnTrdMMpdhugeH6Ban6gYZWXughWxKtVGfCwFn78ZmY3"), // USDT
    tokenAfees: new PublicKey("XZuQG7CQrAA6y6tHM9CLrDjDUWwuUU2SBoV7pLaGDQT"), // USDC
    tokenBfees: new PublicKey("63aJYYuZddSnCGyE8FNrCVQWnXhjh6CQSRwcDeSMhdVC"), // USDT

    // for stake/unstake
    quarry: new PublicKey("Hs1X5YtXwZACueUtS9azZyXFDWVxAMLvm3tttubpK7ph"),
    rewarder: new PublicKey("rXhAofQCT7NN9TUqigyEAUzV1uLL4boeD8CRkNBSkYk"),
    mint: new PublicKey(MINTS[TokenID.USDT_USDC_SABER]),
  }),
  [TokenID.USTv2_USDC_SABER]: new SaberLpSwapInfo({
    swap: new PublicKey("KwnjUuZhTMTSGAaavkLEmSyfobY16JNH4poL9oeeEvE"),
    swapAuthority: new PublicKey(
      "9osV5a7FXEjuMujxZJGBRXVAyQ5fJfBFNkyAf6fSz9kw"
    ),
    tokenAVault: new PublicKey("J63v6qEZmQpDqCD8bd4PXu2Pq5ZbyXrFcSa3Xt1HdAPQ"),
    tokenBVault: new PublicKey("BnKQtTdLw9qPCDgZkWX3sURkBAoKCUYL1yahh6Mw7mRK"),
    tokenAfees: new PublicKey("BYgyVxdrGa3XNj1cx1XHAVyRG8qYhBnv1DS59Bsvmg5h"),
    tokenBfees: new PublicKey("G9nt2GazsDj3Ey3KdA49Sfaq9K95Dc72Ejps4NKTP2SR"),

    // for stake/unstake
    quarry: new PublicKey("BYEUtsLjYAVHRiRR3Avjqnd2RQLRL8n933N52p9kSX2y"),
    rewarder: new PublicKey("rXhAofQCT7NN9TUqigyEAUzV1uLL4boeD8CRkNBSkYk"),
    mint: new PublicKey(MINTS[TokenID.USTv2_USDC_SABER]),
  }),
};

export const ORCA_LP_METAS: { [key in TokenID]?: OrcaLpSwapInfo } = {
  [TokenID.USDC_USDT_ORCA]: new OrcaLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.USDC_USDT_ORCA]),

    swapPubkey: new PublicKey("F13xvvx45jVGd84ynK3c8T89UejQVxjCLtmHfPmAXAHP"),
    swapAuthority: new PublicKey(
      "3cGHDS8uWhdxQj14vTmFtYHX3NMouPpE4o9MjQ43Bbf4"
    ),

    swapTokenAAccount: new PublicKey(
      "6uUn2okWk5v4x9Gc4n2LLGHtWoa9tmizHq1363dW7t9W"
    ), // usdc
    swapTokenBAccount: new PublicKey(
      "AiwmnLy7xPT28dqZpkRm6i1ZGwELUCzCsuN92v4JkSeU"
    ), // usdt

    globalLpVault: new PublicKey(
      "9hPRfmQmZYiL4ZtuvGBk5SjMzmFCQ2h9a4GKoM82BR84"
    ),
    farmTokenMint: new PublicKey(
      "GjpXgKwn4VW4J2pZdS3dovM58hiXWLJtopTfqG83zY2f"
    ),
    globalFarmState: new PublicKey(
      "5psKJrxWnPmoAbCxk3An2CGh7wHAX2cWddf5vZuYbbVw"
    ),
    globalRewardTokenVault: new PublicKey(
      "AYbtHmuJxXpo91m988UdyTtzC6J72WvMAW7XkXqFhAbz"
    ),
    rewardTokenAuthority: new PublicKey(
      "5YGvg6mfuvJtHdVWDXTs4sYy6GwQAUduK8qurDcL111S"
    ),
    feeAccount: new PublicKey("B4RNxMJGRzKFQyTq2Uwkmpyjtew13n7KtdqZy6qgENTu"),
    publicRewardTokAcc: new PublicKey(
      "FSQWYCVXiGXRfKd1NmchusEa9wADez9eQGt5RY5eDjiy"
    ),
    alphaRewardTokAcc: new PublicKey(
      "GUFm5nznu9B8Anfg3pZDxSofs8pUMjQZdVYnhbdvnkeV"
    ),
  }),
  [TokenID.SOL_USDC_ORCA]: new OrcaLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.SOL_USDC_ORCA]),

    swapPubkey: new PublicKey("EGZ7tiLeH62TPV1gL8WwbXGzEPa9zmcpVnnkPKKnrE2U"),
    swapAuthority: new PublicKey("JU8kmKzDHF9sXWsnoznaFDFezLsE5uomX2JkRMbmsQP"),

    swapTokenAAccount: new PublicKey(
      "ANP74VNsHwSrq9uUSjiSNyNWvf6ZPrKTmE4gHoNd13Lg"
    ),
    swapTokenBAccount: new PublicKey(
      "75HgnSvXbWKZBpZHveX68ZzAhDqMzNDS29X6BGLtxMo1"
    ),

    globalLpVault: new PublicKey(
      "7ipefo5V3QEJWeuT2PohFSEUaranZxMSeWQo2rcNigr3"
    ),
    farmTokenMint: new PublicKey(
      "FFdjrSvNALfdgxANNpt3x85WpeVMdQSH5SEP2poM8fcK"
    ),
    globalFarmState: new PublicKey(
      "85HrPbJtrN82aeB74WTwoFxcNgmf5aDNP2ENngbDpd5G"
    ),
    globalRewardTokenVault: new PublicKey(
      "kjjFC8RAF7GuBQ9iYgyTcPmvsRafJ2Ec2AmoS6DjakJ"
    ),
    rewardTokenAuthority: new PublicKey(
      "MDcWkwPqr5HrA91g4GGax7bVP1NDDetnR12nGhoAdYj"
    ),
    feeAccount: new PublicKey("8JnSiuvQq3BVuCU3n4DrSTw9chBSPvEMswrhtifVkr1o"),
    publicRewardTokAcc: new PublicKey(
      "Hr5yQGW35HBP8fJLKfranRbbKzfSPHrhKFf1ZP68LmVp"
    ),
    alphaRewardTokAcc: new PublicKey(
      "85hb3QUq7M8W3dMxCdxQ9vnezV7fRPBUGbq24XTEaLcg"
    ),
  }),
  [TokenID.mSOL_SOL_ORCA]: new OrcaLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.mSOL_SOL_ORCA]),

    swapPubkey: new PublicKey("9EQMEzJdE2LDAY1hw1RytpufdwAXzatYfQ3M2UuT9b88"),
    swapAuthority: new PublicKey(
      "6cwehd4xhKkJ2s7iGh4CaDb7KhMgqczSBnyNJieUYbHn"
    ),

    swapTokenAAccount: new PublicKey(
      "6xmki5RtGNHrfhTiHFfp9k3RQ9t8qgL1cYP2YCG2h179"
    ),
    swapTokenBAccount: new PublicKey(
      "Ew2coQtVGLeca31vqB2ssHntjzZgUy1ad9VuuAX8yw7p"
    ),

    globalLpVault: new PublicKey(
      "DuTZUmTRydVc3EN78brdYFUfskn6s93zH4WhY3Fo53AJ"
    ),
    farmTokenMint: new PublicKey(
      "3RTGL7gPF4V1ns1AeGFApT7cBEGVDfmJ77DqQi9AC6uG"
    ),
    globalFarmState: new PublicKey(
      "JADWjBW1Xs8WhW8kj3GTCRQn3LR4gwvbFTEMwv9ZNxQh"
    ),
    globalRewardTokenVault: new PublicKey(
      "7dpUACKvEiuq5kyoGtgiA131hYwdxfFhEeD5TMT4mnzG"
    ),
    rewardTokenAuthority: new PublicKey(
      "CtXKDXJ4wzgto48QQFANestEgtov5dJRrs9qpRw7BV1h"
    ),
    feeAccount: new PublicKey("6j2tt2UVYMQwqG3hRtyydW3odzBFwy3pN33tyB3xCKQ6"),
    publicRewardTokAcc: new PublicKey(
      "CA59mFikUhJYLesKAxx8j8unHrxTfXSEPjzoXFyrG9M1"
    ),
    alphaRewardTokAcc: new PublicKey(
      "3XNau9dqDSjAARS3cvTjzUv2nRU2FEzaGJd31f6NApUU"
    ),

    isDoubleDipSupported: LP_TO_NEED_2ND_STAKE[TokenID.mSOL_SOL_ORCA],
    globalLp3Vault: new PublicKey(
      "AEZpFdJ5hA7MwVS7AReBbS9pMhoYRhLXgDyc1GWbSoXc"
    ),
    farmTokenLp3Mint: new PublicKey(
      "576ABEdvLG1iFU3bLC8AMJ3mo5LhfgPPhMtTeVAGG6u7"
    ),
    globalDoubleDipFarmState: new PublicKey(
      "2SciNw7cEsKJc1PMRDzWCcEzvuScmEaUgmrJXCi9UFxY"
    ),
    globalDoubleDipRewardTokenVault: new PublicKey(
      "DCHpFt1bCk9mTudj6VsKbADvUPT3tAJvJ2rcBZQry8Wz"
    ),
    doubleDipRewardTokenAuthority: new PublicKey(
      "5uk8F4MaFSu1pF9Q7k8xcyWgqyo9q2dqr3Kb4Esvd1n3"
    ),
    publicDoubleDipRewardAcc: new PublicKey(
      "5U5uowAVYyggB6DvVZE12cLZE7EjxkdKGt8VpvbsNbAy"
    ),
    alphaDoubleDipRewardAcc: new PublicKey(
      "GfSzQknESVecnF5z9G1gpEtcaxZkcT742uUdbhJoU5Ap"
    ),
    doubleDipRewardMint: new PublicKey(
      "MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey"
    ),
  }),
  [TokenID.ORCA_USDC_ORCA]: new OrcaLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.ORCA_USDC_ORCA]),

    swapPubkey: new PublicKey("2p7nYbtPBgtmY69NsE8DAW6szpRJn7tQvDnqvoEWQvjY"),
    swapAuthority: new PublicKey(
      "3fr1AhdiAmWLeNrS24CMoAu9pPgbzVhwLtJ6QUPmw2ob"
    ),

    swapTokenAAccount: new PublicKey(
      "9vYWHBPz817wJdQpE8u3h8UoY3sZ16ZXdCcvLB7jY4Dj"
    ),
    swapTokenBAccount: new PublicKey(
      "6UczejMUv1tzdvUzKpULKHxrK9sqLm8edR1v9jinVWm9"
    ),

    globalLpVault: new PublicKey(
      "45BAAQCZYd2kP3Z3WvRwdtfUhvuW4FvpqVK4m8qrR5x1"
    ),
    farmTokenMint: new PublicKey(
      "Gc7W5U66iuHQcC1cQyeX9hxkPF2QUVJPTf1NWbW8fNrt"
    ),
    globalFarmState: new PublicKey(
      "9S1BsxbDNQXQccjFamVEGgxiYQHTeudvhEYwFr4oWeaf"
    ),
    globalRewardTokenVault: new PublicKey(
      "DEiqe2Ta9TRMRtWdBqiFV13dhVrqCeG8MMmVwywvXvJo"
    ),
    rewardTokenAuthority: new PublicKey(
      "66xaEjFoYfRcspc18oDj61mXDyznr9zam6tFNeqvs2jK"
    ),
    feeAccount: new PublicKey("7CXZED4jfRp3qdHB9Py3up6v1C4UhHofFvfT6RXbJLRN"),
    publicRewardTokAcc: new PublicKey(
      "G8cPgn6tiQQAQcTQupEi8fTBfo1RpqTii1hW65L4poTY"
    ),
    alphaRewardTokAcc: new PublicKey(
      "8fFHftEm6PJBahCQukV6J27b7xzDeVPFdedjV1f4T36x"
    ),
  }),
  [TokenID.ORCA_SOL_ORCA]: new OrcaLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.ORCA_SOL_ORCA]),

    swapPubkey: new PublicKey("2ZnVuidTHpi5WWKUwFXauYGhvdT9jRKYv5MDahtbwtYr"),
    swapAuthority: new PublicKey(
      "2PH1quJj9MHQXATCmNZ6qQ2gZqM8R236DpKaz99ggVpm"
    ),

    swapTokenAAccount: new PublicKey(
      "AioST8HKQJRqjE1mknk4Rydc8wVADhdQwRJmAAYX1T6Z"
    ),
    swapTokenBAccount: new PublicKey(
      "73zdy95DynZP4exdpuXTDsexcrWbDJX9TFi2E6CDzXh4"
    ),

    globalLpVault: new PublicKey(
      "7N7zxoDMMV1sCDiVEzinTyQxS2GoN388QprMCQX38BeT"
    ), // lp 1
    farmTokenMint: new PublicKey(
      "B5waaKnsmtqFawPspUwcuy1cRjAC7u2LrHSwxPSxK4sZ"
    ),
    globalFarmState: new PublicKey(
      "F6pi7SyXWx56fP96mYQ4Yfh4yZ7oGNtDjwSYHT5Mz7Ld"
    ),
    globalRewardTokenVault: new PublicKey(
      "CSbYA7Cd65Vis2oqX797zmnWmpgENmqrPdmPbTbRPykd"
    ),
    rewardTokenAuthority: new PublicKey(
      "98RAHBKRTTC87nNwug1GEAnLVgouk9nRaa3u14jrp6Zz"
    ),
    feeAccount: new PublicKey("4Zc4kQZhRQeGztihvcGSWezJE1k44kKEgPCAkdeBfras"),
    publicRewardTokAcc: new PublicKey(
      "2G7ZWG9z6WtKJ5k5B32RTmLFB7hLVEnC5RmYD7gvCpG3"
    ),
    alphaRewardTokAcc: new PublicKey(
      "8htfap3Gej5t4araQRHioggu2acsG3tQAc38PMtBhBhD"
    ),
  }),
  [TokenID.ETH_USDC_ORCA]: new OrcaLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.ETH_USDC_ORCA]),

    swapPubkey: new PublicKey("FgZut2qVQEyPBibaTJbbX2PxaMZvT1vjDebiVaDp5BWP"),
    swapAuthority: new PublicKey(
      "4dfCZR32xXhoTgMRhnViNaTFwiKP9A34TDjHCR3xM5rg"
    ),

    swapTokenAAccount: new PublicKey(
      "H9h5yTBfCHcb4eRP87fXczzXgNaMzKihr7bf1sjw7iuZ"
    ),
    swapTokenBAccount: new PublicKey(
      "JA98RXv2VdxQD8pRQq4dzJ1Bp4nH8nokCGmxvPWKJ3hx"
    ),

    globalLpVault: new PublicKey(
      "6zoYTvgLd4UAhKSPwirEU9VNNNkpezwq8AM4jXW1Qop9"
    ), // lp 1
    farmTokenMint: new PublicKey(
      "HDP2AYFmvLz6sWpoSuNS62JjvW4HjMKp7doXucqpWN56"
    ),
    globalFarmState: new PublicKey(
      "FpezTR76RRjgpBb9HhR6ap8BgQfkHyNMQSqJDcoXpjAb"
    ),
    globalRewardTokenVault: new PublicKey(
      "9MWJmWVAGQ9C9SxwWKidStAA8HjDHpnZ7KfKgVJdrNtj"
    ),
    rewardTokenAuthority: new PublicKey(
      "DFTLJrgsn7cLNX9hbqiUwM8C1y6f7AfyvEmbsFSkjQNR"
    ),
    feeAccount: new PublicKey("DLWewB12jzGn4wXJmFCddWDeof1Ma4cZYNRv9CP5hTvX"),
    publicRewardTokAcc: new PublicKey(
      "CtVJtQHSAcSQ3b4FD3A3Zk8vb2PaC4wn1oTnHtUMS8rf"
    ),
    alphaRewardTokAcc: new PublicKey(
      "BSpFLmCAzJp5XMSfVXC2rq4LjJ2NSs2jqFS8agcENAkH"
    ),
  }),
  [TokenID.SOL_USDT_ORCA]: new OrcaLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.SOL_USDT_ORCA]),

    swapPubkey: new PublicKey("Dqk7mHQBx2ZWExmyrR2S8X6UG75CrbbpK2FSBZsNYsw6"),
    swapAuthority: new PublicKey(
      "2sxKY7hxVFrY5oNE2DgaPAJFamMzsmFLM2DgVcjK5yTy"
    ),

    swapTokenAAccount: new PublicKey(
      "DTb8NKsfhEJGY1TrA7RXN6MBiTrjnkdMAfjPEjtmTT3M"
    ),
    swapTokenBAccount: new PublicKey(
      "E8erPjPEorykpPjFV9yUYMYigEWKQUxuGfL2rJKLJ3KU"
    ),

    globalLpVault: new PublicKey(
      "EXxH5tKDHLy68nWXS8w1BRUsiDEHMbKACLUmFWv8Q9tu"
    ), // lp 1
    farmTokenMint: new PublicKey(
      "71vZ7Jvu8fTyFzpX399dmoSovoz24rVbipLrRn2wBNzW"
    ),
    globalFarmState: new PublicKey(
      "4RRRJkscV2DmwJUxTQgRdYock75GfwYJn7LTxy9rGTmY"
    ),
    globalRewardTokenVault: new PublicKey(
      "H3ozvCeEwnsqnM2naCnXVxLLwH2XPC5kU8BH97XDpDwS"
    ),
    rewardTokenAuthority: new PublicKey(
      "EavNUagNtD7DEdV4atcm3dEBXafARKCNJyNkyfz426m6"
    ),
    feeAccount: new PublicKey("BBKgw75FivTYXj85D2AWyVdaTdTWuSuHVXRm1Xu7fipb"),
    publicRewardTokAcc: new PublicKey(
      "9AfsnfPwRrJLjcCAasUcaYeVunpmxgev6yCVa6HiLkp7"
    ),
    alphaRewardTokAcc: new PublicKey(
      "93xUo4bmSXdGxCNSDvk2xYH7YAY6KqDZ4mPMbwBuiyfm"
    ),
  }),
  [TokenID.ETH_SOL_ORCA]: new OrcaLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.ETH_SOL_ORCA]),

    swapPubkey: new PublicKey("EuK3xDa4rWuHeMQCBsHf1ETZNiEQb5C476oE9u9kp8Ji"),
    swapAuthority: new PublicKey(
      "DffrDbzPiswDJaiicBBo9CjqztKgFLrqXGwNJH4XQefZ"
    ),

    swapTokenAAccount: new PublicKey(
      "7F2cLdio3i6CCJaypj9VfNDPW2DwT3vkDmZJDEfmxu6A"
    ),
    swapTokenBAccount: new PublicKey(
      "5pUTGvN2AA2BEzBDU4CNDh3LHER15WS6J8oJf5XeZFD8"
    ),

    globalLpVault: new PublicKey(
      "6ckhPnn6tCr88aq9SxhWaAA5G7izuXNKhVk1Xa62zhFD"
    ), // lp 1
    farmTokenMint: new PublicKey(
      "CGFTRh4jKLPbS9r4hZtbDfaRuC7qcA8rZpbLnVTzJBer"
    ),
    globalFarmState: new PublicKey(
      "3ARgavt1NhqLmJWj3wAJy6XBarG6pJbEKRv1wzzRbbaN"
    ),
    globalRewardTokenVault: new PublicKey(
      "FYTTVMqWPzbnhTsukgiWmPiNJam4yLTxHM9mpzdan2zo"
    ),
    rewardTokenAuthority: new PublicKey(
      "HXY2Vvj2XyqiPNXV3PhM9YYKgfjqzXUX4tUFRnvqihdY"
    ),
    feeAccount: new PublicKey("unxKgWEc71ZiHwMqZs3VLqjcjmZhfTZEg94ZLGvjdMP"),

    publicRewardTokAcc: new PublicKey(
      "2NYnAKhCwCMoe5unHuaEQEYL1ugLypK8Hrx4Qp5ugSUf"
    ),
    alphaRewardTokAcc: new PublicKey(
      "6uupGx988A2yiPEhZEayNSewkp45owfbQVrJcbcKoiC6"
    ),
  }),
  [TokenID.BTC_mSOL_ORCA]: new OrcaLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.BTC_mSOL_ORCA]),

    swapPubkey: new PublicKey("8DRw5wQE1pyg6RB1UwypGNFgb2Pzp2hpyDDNwo76Lcc8"),
    swapAuthority: new PublicKey(
      "3X1aLdyvcQNc8TvBMPiucMsRCnGMBnGsjJHpZEyCf3pn"
    ),

    swapTokenAAccount: new PublicKey(
      "6D3sxC6yEe84FUnF5Kpbgx6gN57N9poJCKAtrCeCWdJo"
    ),
    swapTokenBAccount: new PublicKey(
      "EPoVJLhi9QtVPVo8n31M5k5Knvb48j8zbYyRrUbrHwC5"
    ),

    globalLpVault: new PublicKey(
      "75gpvckCXk49zTUwG8QrzUSP4NpWh3JXdyELBrnAhimL"
    ),
    farmTokenMint: new PublicKey(
      "DzpLz78wuwyFsQToin8iDv6YK6aBEymRqQq82swiFh7r"
    ),
    globalFarmState: new PublicKey(
      "GBrpFtiTabs14mc4Hi1RX9YiQY7res6JxrVfMTADfcQV"
    ),
    globalRewardTokenVault: new PublicKey(
      "CNe5S831UP4YkumU7UsusTkf7uxJnAVdmPe6jhF51k4y"
    ),
    rewardTokenAuthority: new PublicKey(
      "8sVCTztvytajkdczYEZVkSmuoRLjnMezwpT46L5w4RWR"
    ),
    feeAccount: new PublicKey("AqiLHbUAy4UWWKGVVgbHsaUVCMg1zemNkgsYBPSirT92"),

    publicRewardTokAcc: new PublicKey(
      "7Sfy525w1dpCQqXb2sEKuacV57333VCSCKGuubsxXvCc"
    ),
    alphaRewardTokAcc: new PublicKey(
      "Bag2RfLUzSXYbnsnVAFeYYzfG6M4EGseUJsmJnC64Vrn"
    ),

    isDoubleDipSupported: LP_TO_NEED_2ND_STAKE[TokenID.BTC_mSOL_ORCA],
    globalLp3Vault: new PublicKey(
      "DuyHVLzsqg6SZeFNbpUWfJf67kvAXPWUdUGJYWJK5vTu"
    ),
    farmTokenLp3Mint: new PublicKey(
      "6uA1ADUJbvwYJZpzUn9z9LuyKoRVngBKcQTKdXsSivA8"
    ),
    globalDoubleDipFarmState: new PublicKey(
      "Cn7QNyosNQ8DyKEeMDPmtg66R7vKMXigcQ561kTkFD8E"
    ),
    globalDoubleDipRewardTokenVault: new PublicKey(
      "Ea3FYh9RMJxwsyu3xS7BesLMtpX32DURohiEigG2iJCx"
    ),
    doubleDipRewardTokenAuthority: new PublicKey(
      "9Lg5wBjcYDgY8S2ZAEqjtXAQ4UdHuw65aP1WmmWss4QX"
    ),
    doubleDipRewardMint: new PublicKey(
      "MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey"
    ),

    alphaDoubleDipRewardAcc: new PublicKey(
      "J5cxhkPf25Ff4NT7WfWhLQzp58dksfhBT1vqprxBY7D3"
    ),
    publicDoubleDipRewardAcc: new PublicKey(
      "AoeNmMDdDBS7xyvXjtG79pCa8Duf4qFALs4KY49okdx2"
    ),
  }),
  [TokenID.mSOL_USDC_ORCA]: new OrcaLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.mSOL_USDC_ORCA]),

    swapPubkey: new PublicKey("Hme4Jnqhdz2jAPUMnS7jGE5zv6Y1ynqrUEhmUAWkXmzn"),
    swapAuthority: new PublicKey(
      "9Z7E42k46kxnBjAh8YGXDw3rRGwwxQUBYM7Ccrmwg6ZP"
    ),

    swapTokenAAccount: new PublicKey(
      "GBa7G5f1FqAXEgByuHXsqsEdpyMjRgT9SNxZwmmnEJAY"
    ),
    swapTokenBAccount: new PublicKey(
      "7hFgNawzzmpDM8TTVCKm8jykBrym8C3TQdb8TDAfAVkD"
    ),

    globalLpVault: new PublicKey(
      "8F6NCo1PiakW7m3eeEZvdxsjXF5bkLD3QZsTxaNg9jvv"
    ),
    farmTokenMint: new PublicKey(
      "5r3vDsNTGXXb9cGQfqyNuYD2bjhRPymGJBfDmKosR9Ev"
    ),
    globalFarmState: new PublicKey(
      "EvtMzreDMq1U8ytV5fEmfoWNfPhrjZ87za835GuRvZCc"
    ),
    globalRewardTokenVault: new PublicKey(
      "A1enLcj9XmuVeYCQScEruwnfAz7ksQhbuGFUgvgeS1a6"
    ),
    rewardTokenAuthority: new PublicKey(
      "9czgZkSxLFtxmvWSb1PEHmUyBuNpAUxj9XAcHKikYnzt"
    ),
    feeAccount: new PublicKey("3W3Skj2vQsNEMhGRQprFXQy3Q8ZbM6ojdgiDCokVPWno"),

    publicRewardTokAcc: new PublicKey(
      "B16JMAgpR84Dr6rucq4GYLZV7pdk1uPF533P9KVwNUq4"
    ),
    alphaRewardTokAcc: new PublicKey(
      "C7L8DS3ytgueAkcFojeshc2SEtePDPDXjv6gajyinGyL"
    ),

    isDoubleDipSupported: LP_TO_NEED_2ND_STAKE[TokenID.mSOL_USDC_ORCA],
    globalLp3Vault: new PublicKey(
      "CdbgqE5B9oADrSAWc51Mgw6c3B6nvYJ4c431rftpoVqZ"
    ),
    farmTokenLp3Mint: new PublicKey(
      "9y3QYM5mcaB8tU7oXRzAQnzHVa75P8riDuPievLp64cY"
    ),
    globalDoubleDipFarmState: new PublicKey(
      "5fhDMuGKRDPWVWXf7BBEwifRFrp6XwXctDQoG7UHGVt6"
    ),
    globalDoubleDipRewardTokenVault: new PublicKey(
      "XbkV9HZpLdv3CjMUfoq4t8nkxR6UguHb4oP8aAKBGV2"
    ),
    doubleDipRewardTokenAuthority: new PublicKey(
      "FvXa954NiCqE2jAthxV5oVcuuPAJCggwYtAihYDRhVUw"
    ),
    doubleDipRewardMint: new PublicKey(
      "MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey"
    ),

    alphaDoubleDipRewardAcc: new PublicKey(
      "H6pK9gb58SxvyCRZzgCj4kuX758sjYAcqPJpY1aBJzLv"
    ),
    publicDoubleDipRewardAcc: new PublicKey(
      "3QaNhP4vT6PG3eoQwg2DRbH9ecmy7pR2f1PBPWCwDBYd"
    ),
  }),
  [TokenID.APT_USDC_ORCA]: new OrcaLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.APT_USDC_ORCA]),

    swapPubkey: new PublicKey("Fg3UabVqnfycMtkiTVoaia9eNafehtT9Y4TicH2iBtvK"),
    swapAuthority: new PublicKey(
      "JDEYn1JsacdxoB4v4mbctFSVrSUPttacX3gxWphFHJKZ"
    ),

    swapTokenAAccount: new PublicKey(
      "636crNdZTf46gFUKuedaBCZDBMLahf7KGud2LyTMskU5"
    ),
    swapTokenBAccount: new PublicKey(
      "DGEYFkEHyiuHWtHeCGiQGn1JbkGHqYrNwaP44miRbgxu"
    ),

    globalLpVault: new PublicKey(
      "Ha7NSMkfjQt2pWF8JY5p89T38NpKdm5da4FR3sYednin"
    ), // lp 1
    farmTokenMint: new PublicKey(
      "Dx7DYSuaBufhXyQG7155ePkLmHyn6w7WeKKtQB9zscZV"
    ),
    globalFarmState: new PublicKey(
      "3YZ5GYL625vWibn7d8hMdrMBawy9HGUyeTe4AoXoME1Q"
    ),
    globalRewardTokenVault: new PublicKey(
      "HyCJbQkccvMwC5FHAYBMjQCKXEjDo9fbhBa5pj8sc2v5"
    ),
    rewardTokenAuthority: new PublicKey(
      "53y344S5Cv32ViwajrHxnsgcmam7Mw2nydcRgJEkqdGd"
    ),
    feeAccount: new PublicKey("41H5mWwsZKewJeV4wWiNjQ3U4VYBnwqCpzvAWt86baHd"),

    publicRewardTokAcc: new PublicKey(
      "EgFva9mEFCV31AkhoZb6rN6zvbNGE1xdaRYAkKTtdNjN"
    ),
    alphaRewardTokAcc: new PublicKey(
      "Cd5ijQFj1V7V5VwuoSkG6pEaPyeX2D9ZmqS7pE1RVdFX"
    ),
  }),
};

export const RAYDIUM_LP_METAS: { [key in TokenID]?: RaydiumLpSwapInfo } = {
  [TokenID.SOL_USDC_RAYDIUM]: new RaydiumLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.SOL_USDC_RAYDIUM]),

    ammIdPubkey: new PublicKey("58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2"),
    ammAuthPubkey: new PublicKey(
      "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
    ),
    ammOpenOrdersPubkey: new PublicKey(
      "HRk9CMrpq7Jn9sh7mzxE8CChHG8dneX9p475QKz4Fsfc"
    ),
    ammTargetOrderPubkey: new PublicKey(
      "CZza3Ej4Mc58MnxWA385itCC9jCo3L1D7zc3LKy1bZMR"
    ),

    poolCoinTokenPubkey: new PublicKey(
      "DQyrAcCrDXQ7NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz"
    ),
    poolPcTokenPubkey: new PublicKey(
      "HLmqeL62xR1QoZ1HKKbXRrdN1p3phKpxRMb2VVopvBBz"
    ),
    poolWithdrawQueue: new PublicKey(
      "G7xeGGLevkRwB5f44QNgQtrPKBdMfkT6ZZwpS9xcC97n"
    ),
    poolTempLpTokenAccount: new PublicKey(
      "Awpt6N7ZYPBa4vG4BQNFhFxDj4sxExAA9rpBAoBw2uok"
    ),

    serumProgramId: new PublicKey(
      "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
    ),
    serumMarketPubkey: new PublicKey(
      "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT"
    ),
    serumCoinVaultAccount: new PublicKey(
      "36c6YqAwyGKQG66XEp2dJc5JqjaBNv7sVghEtJv4c7u6"
    ),
    serumPcVaultAccount: new PublicKey(
      "8CFo8bL8mZQK8abbFyypFMwEDd8tVJjHTTojMLgQTUSZ"
    ),
    serumVaultSigner: new PublicKey(
      "F8Vyqk3unwxkXukZFQeYyGmFfTG3CAX4v24iyrjEYBJV"
    ),

    rewardAccounts: [
      {
        rewardToken: TokenID.RAY,
        userRewardAlphaAccountPubkey: new PublicKey(
          "3ycsskwZL584nSTikjMR9DhVKRHFpYUbbx4m93kn6Djx"
        ),
        userRewardPublicAccountPubkey: new PublicKey(
          "44tSF4Sisrsy7YXmtSYnFLzQnZeVvwgd5PTMzRvAqtq4"
        ),
        rewardVault: new PublicKey(
          "38YS2N7VUb856QDsXHS1h8zv5556YgEy9zKbbL2mefjf"
        ), // ray
      },
      {
        rewardToken: TokenID.SRM,
        userRewardAlphaAccountPubkey: new PublicKey(
          "21rySZr2pQCaoGjdJy6gPx31vi5igVsKFAMRtqhgPgVX"
        ),
        userRewardPublicAccountPubkey: new PublicKey(
          "BzqrcDc7wpciqtsSj7MsDajDdjHuS7XBdqaprSm8GaiB"
        ),
        rewardVault: new PublicKey(
          "ANDJUfDryy3jY6DngwGRXVyxCJBT5JfojLDXwZYSpnEL"
        ), // srm
      },
    ],

    stakeKeys: {
      poolIdPubkey: new PublicKey(
        "GUzaohfNuFbBqQTnPgPSNciv3aUvriXYjQduRE3ZkqFw"
      ),
      poolAuthorityPubkey: new PublicKey(
        "DgbCWnbXg43nmeiAveMCkUUPEpAr3rZo3iop3TyP6S63"
      ),

      poolLPVault: new PublicKey(
        "J6ECnRDZEXcxuruvErXDWsPZn9czowKynUr9eDSQ4QeN"
      ),
    },
  }),
  [TokenID.RAY_USDC_RAYDIUM]: new RaydiumLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.RAY_USDC_RAYDIUM]),

    ammIdPubkey: new PublicKey("6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg"),
    ammAuthPubkey: new PublicKey(
      "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
    ),
    ammOpenOrdersPubkey: new PublicKey(
      "J8u8nTHYtvudyqwLrXZboziN95LpaHFHpd97Jm5vtbkW"
    ),
    ammTargetOrderPubkey: new PublicKey(
      "3cji8XW5uhtsA757vELVFAeJpskyHwbnTSceMFY5GjVT"
    ),

    poolCoinTokenPubkey: new PublicKey(
      "FdmKUE4UMiJYFK5ogCngHzShuVKrFXBamPWcewDr31th"
    ),
    poolPcTokenPubkey: new PublicKey(
      "Eqrhxd7bDUCH3MepKmdVkgwazXRzY6iHhEoBpY7yAohk"
    ),
    poolWithdrawQueue: new PublicKey(
      "ERiPLHrxvjsoMuaWDWSTLdCMzRkQSo8SkLBLYEmSokyr"
    ),
    poolTempLpTokenAccount: new PublicKey(
      "D1V5GMf3N26owUFcbz2qR5N4G81qPKQvS2Vc4SM73XGB"
    ),

    serumProgramId: new PublicKey(
      "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
    ),
    serumMarketPubkey: new PublicKey(
      "2xiv8A5xrJ7RnGdxXB42uFEkYHJjszEhaJyKKt4WaLep"
    ),
    serumCoinVaultAccount: new PublicKey(
      "GGcdamvNDYFhAXr93DWyJ8QmwawUHLCyRqWL3KngtLRa"
    ),
    serumPcVaultAccount: new PublicKey(
      "22jHt5WmosAykp3LPGSAKgY45p7VGh4DFWSwp21SWBVe"
    ),
    serumVaultSigner: new PublicKey(
      "FmhXe9uG6zun49p222xt3nG1rBAkWvzVz7dxERQ6ouGw"
    ),

    rewardAccounts: [
      {
        rewardToken: TokenID.RAY,
        userRewardAlphaAccountPubkey: new PublicKey(
          "496NG3Ym9UAmDoYe1YdJMnEhAGJhfrY4Wz2Poc85VcMZ"
        ),
        userRewardPublicAccountPubkey: new PublicKey(
          "49i8NSa6z2DcWxBnnsZjyxKvLxEqXGZ833B4jUDNmxnT"
        ),
        rewardVault: new PublicKey(
          "DpRueBHHhrQNvrjZX7CwGitJDJ8eZc3AHcyFMG4LqCQR"
        ), // ray
      },
    ],

    stakeKeys: {
      poolIdPubkey: new PublicKey(
        "CHYrUBX2RKX8iBg7gYTkccoGNBzP44LdaazMHCLcdEgS"
      ),
      poolAuthorityPubkey: new PublicKey(
        "5KQFnDd33J5NaMC9hQ64P5XzaaSz8Pt7NBCkZFYn1po"
      ),

      poolLPVault: new PublicKey(
        "BNnXLFGva3K8ACruAc1gaP49NCbLkyE6xWhGV4G2HLrs"
      ),
    },
    stakeProgram: SWAP_METAS[SWAP_RAYDIUM].stakeProgramPubkey,
  }),
  [TokenID.SOL_USDT_RAYDIUM]: new RaydiumLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.SOL_USDT_RAYDIUM]),

    ammIdPubkey: new PublicKey("7XawhbbxtsRcQA8KTkHT9f9nc6d69UwqCDh6U5EEbEmX"),
    ammAuthPubkey: new PublicKey(
      "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
    ),
    ammOpenOrdersPubkey: new PublicKey(
      "4NJVwEAoudfSvU5kdxKm5DsQe4AAqG6XxpZcNdQVinS4"
    ),
    ammTargetOrderPubkey: new PublicKey(
      "9x4knb3nuNAzxsV7YFuGLgnYqKArGemY54r2vFExM1dp"
    ),

    poolCoinTokenPubkey: new PublicKey(
      "876Z9waBygfzUrwwKFfnRcc7cfY4EQf6Kz1w7GRgbVYW"
    ),
    poolPcTokenPubkey: new PublicKey(
      "CB86HtaqpXbNWbq67L18y5x2RhqoJ6smb7xHUcyWdQAQ"
    ),
    poolWithdrawQueue: new PublicKey(
      "52AfgxYPTGruUA9XyE8eF46hdR6gMQiA6ShVoMMsC6jQ"
    ),
    poolTempLpTokenAccount: new PublicKey(
      "2JKZRQc92TaH3fgTcUZyxfD7k7V7BMqhF24eussPtkwh"
    ),

    serumProgramId: new PublicKey(
      "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
    ),
    serumMarketPubkey: new PublicKey(
      "HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1"
    ),
    serumCoinVaultAccount: new PublicKey(
      "29cTsXahEoEBwbHwVc59jToybFpagbBMV6Lh45pWEmiK"
    ),
    serumPcVaultAccount: new PublicKey(
      "EJwyNJJPbHH4pboWQf1NxegoypuY48umbfkhyfPew4E"
    ),
    serumVaultSigner: new PublicKey(
      "CzZAjoEqA6sjqtaiZiPqDkmxG6UuZWxwRWCenbBMc8Xz"
    ),

    rewardAccounts: [
      {
        rewardToken: TokenID.RAY,
        userRewardAlphaAccountPubkey: new PublicKey(
          "BrDvLLjYtTPyaBN2kDxRCSDzoNPdYiozPfggcgEJt3Pd"
        ),
        userRewardPublicAccountPubkey: new PublicKey(
          "4aryP8pemzEuJjMteEPHFbM1SJdgoahx4AG1ZpdCvJZQ"
        ),
        rewardVault: new PublicKey(
          "Bgj3meVYds8ficJc9xntbjmMBPVUuyn6CvDUm1AD39yq"
        ), // ray
      },
      {
        rewardToken: TokenID.SRM,
        userRewardAlphaAccountPubkey: new PublicKey(
          "6Cp9hLDQpbmiXZopk9oJMqGj8nSUbQpGLqm9VxYmZbFB"
        ),
        userRewardPublicAccountPubkey: new PublicKey(
          "HBrRwtFzrL7CyngExF4N3LrKzSEf1ViFRLHJcVEwmphw"
        ),
        rewardVault: new PublicKey(
          "DJifNDjNt7iHbkNHs9V6Wm5pdiuddtF9w3o4WEiraKrP"
        ), // srm
      },
    ],

    stakeKeys: {
      poolIdPubkey: new PublicKey(
        "5r878BSWPtoXgnqaeFJi7BCycKZ5CodBB2vS9SeiV8q"
      ),
      poolAuthorityPubkey: new PublicKey(
        "DimG1WK9N7NdbhddweGTDDBRaBdCmcbPtoWZJ4Fi4rn4"
      ),

      poolLPVault: new PublicKey("jfhZy3B6sqeu95z71GukkxpkDtfHXJiFAMULM6STWxb"),
    },
  }),
  [TokenID.mSOL_SOL_RAYDIUM]: new RaydiumLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.mSOL_SOL_RAYDIUM]),

    ammIdPubkey: new PublicKey("EGyhb2uLAsRUbRx9dNFBjMVYnFaASWMvD6RE1aEf2LxL"),
    ammAuthPubkey: new PublicKey(
      "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
    ),
    ammOpenOrdersPubkey: new PublicKey(
      "6c1u1cNEELKPmuH352WPNNEPdfTyVPHsei39DUPemC42"
    ),
    ammTargetOrderPubkey: new PublicKey(
      "CLuMpSesLPqdxewQTxfiLdifQfDfRsxkFhPgiChmdGfk"
    ),

    poolCoinTokenPubkey: new PublicKey(
      "85SxT7AdDQvJg6pZLoDf7vPiuXLj5UYZLVVNWD1NjnFK"
    ),
    poolPcTokenPubkey: new PublicKey(
      "BtGUR6y7uwJ6UGXNMcY3gCLm7dM3WaBdmgtKVgGnE1TJ"
    ),
    poolWithdrawQueue: new PublicKey(
      "7vvoHxA6di9EvzJKL6bmojbZnH3YaRXu2LitufrQhM21"
    ),
    poolTempLpTokenAccount: new PublicKey(
      "ACn8TZ27fQ85kgdPKUfkETB4dS5JPFoq53z7uCgtHDai"
    ),

    serumProgramId: new PublicKey(
      "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
    ),
    serumMarketPubkey: new PublicKey(
      "5cLrMai1DsLRYc1Nio9qMTicsWtvzjzZfJPXyAoF4t1Z"
    ),
    serumCoinVaultAccount: new PublicKey(
      "2qmHPJn3URkrboLiJkQ5tBB4bmYWdb6MyhQzZ6ms7wf9"
    ),
    serumPcVaultAccount: new PublicKey(
      "A6eEM36Vpyti2PoHK8h8Dqk5zu7YTaSRTQb7XXL8tcrV"
    ),
    serumVaultSigner: new PublicKey(
      "EHMK3DdPiPBd9aBjeRU4aZjD7z568rmwHCSAAxRooPq6"
    ),

    stakeKeys: null,
  }),
  [TokenID.RAY_USDT_RAYDIUM]: new RaydiumLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.RAY_USDT_RAYDIUM]),

    ammIdPubkey: new PublicKey("DVa7Qmb5ct9RCpaU7UTpSaf3GVMYz17vNVU67XpdCRut"),
    ammAuthPubkey: new PublicKey(
      "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
    ),
    ammOpenOrdersPubkey: new PublicKey(
      "7UF3m8hDGZ6bNnHzaT2YHrhp7A7n9qFfBj6QEpHPv5S8"
    ),
    ammTargetOrderPubkey: new PublicKey(
      "3K2uLkKwVVPvZuMhcQAPLF8hw95somMeNwJS7vgWYrsJ"
    ),

    poolCoinTokenPubkey: new PublicKey(
      "3wqhzSB9avepM9xMteiZnbJw75zmTBDVmPFLTQAGcSMN"
    ),
    poolPcTokenPubkey: new PublicKey(
      "5GtSbKJEPaoumrDzNj4kGkgZtfDyUceKaHrPziazALC1"
    ),
    poolWithdrawQueue: new PublicKey(
      "8VuvrSWfQP8vdbuMAP9AkfgLxU9hbRR6BmTJ8Gfas9aK"
    ),
    poolTempLpTokenAccount: new PublicKey(
      "FBzqDD1cBgkZ1h6tiZNFpkh4sZyg6AG8K5P9DSuJoS5F"
    ),

    serumProgramId: new PublicKey(
      "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
    ),
    serumMarketPubkey: new PublicKey(
      "teE55QrL4a4QSfydR9dnHF97jgCfptpuigbb53Lo95g"
    ),
    serumCoinVaultAccount: new PublicKey(
      "2kVNVEgHicvfwiyhT2T51YiQGMPFWLMSp8qXc1hHzkpU"
    ),
    serumPcVaultAccount: new PublicKey(
      "5AXZV7XfR7Ctr6yjQ9m9dbgycKeUXWnWqHwBTZT6mqC7"
    ),
    serumVaultSigner: new PublicKey(
      "HzWpBN6ucpsA9wcfmhLAFYqEUmHjE9n2cGHwunG5avpL"
    ),

    rewardAccounts: [
      {
        rewardToken: TokenID.RAY,
        userRewardAlphaAccountPubkey: new PublicKey(
          "Bq2M2YHcMVB9RDBjJsra4nP81qvJaAapY6fdCFoDNY61"
        ),
        userRewardPublicAccountPubkey: new PublicKey(
          "3YUuGZJSF5Jdy3mXBXgWh86t2msj4d2WvNGawSsDZbHC"
        ),
        rewardVault: new PublicKey(
          "HCHNuGzkqSnw9TbwpPv1gTnoqnqYepcojHw9DAToBrUj"
        ), // ray
      },
    ],

    stakeKeys: {
      poolIdPubkey: new PublicKey(
        "AvbVWpBi2e4C9HPmZgShGdPoNydG4Yw8GJvG9HUcLgce"
      ),
      poolAuthorityPubkey: new PublicKey(
        "8JYVFy3pYsPSpPRsqf43KSJFnJzn83nnRLQgG88XKB8q"
      ),

      poolLPVault: new PublicKey(
        "4u4AnMBHXehdpP5tbD6qzB5Q4iZmvKKR5aUr2gavG7aw"
      ),
    },
    stakeProgram: SWAP_METAS[SWAP_RAYDIUM].stakeProgramPubkey,
  }),
  [TokenID.RAY_ETH_RAYDIUM]: new RaydiumLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.RAY_ETH_RAYDIUM]),

    ammIdPubkey: new PublicKey("8iQFhWyceGREsWnLM8NkG9GC8DvZunGZyMzuyUScgkMK"),
    ammAuthPubkey: new PublicKey(
      "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
    ),
    ammOpenOrdersPubkey: new PublicKey(
      "7iztHknuo7FAXVrrpAjsHBEEjRTaNH4b3hecVApQnSwN"
    ),
    ammTargetOrderPubkey: new PublicKey(
      "JChSqhn6yyEWqD95t8UR5DaZZtEZ1RGGjdwgMc8S6UUt"
    ),

    poolCoinTokenPubkey: new PublicKey(
      "G3Szi8fUqxfZjZoNx17kQbxeMTyXt2ieRvju4f3eJt9j"
    ),
    poolPcTokenPubkey: new PublicKey(
      "7MgaPPNa7ySdu5XV7ik29Xoav4qcDk4wznXZ2Muq9MnT"
    ),
    poolWithdrawQueue: new PublicKey(
      "C9aijsE3tLbVyYaXXHi45qneDL5jfyN8befuJh8zzpou"
    ),
    poolTempLpTokenAccount: new PublicKey(
      "3CDnyBsNnexdvfvo6ASde5Q4e72jzMQFHRRkSQr49vEG"
    ),

    serumProgramId: new PublicKey(
      "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
    ),
    serumMarketPubkey: new PublicKey(
      "6jx6aoNFbmorwyncVP5V5ESKfuFc9oUYebob1iF6tgN4"
    ),
    serumCoinVaultAccount: new PublicKey(
      "EVVtYo4AeCbmn2dYS1UnhtfjpzCXCcN26G1HmuHwMo7w"
    ),
    serumPcVaultAccount: new PublicKey(
      "6ZT6KwvjLnJLpFdVfiRD9ifVUo4gv4MUie7VvPTuk69v"
    ),
    serumVaultSigner: new PublicKey(
      "HXbRDLcX2FyqWJY95apnsTgBoRHyp7SWYXcMYod6EBrQ"
    ),

    rewardAccounts: [
      {
        rewardToken: TokenID.RAY,
        userRewardAlphaAccountPubkey: new PublicKey(
          "B2LykyWkPGVcqwRgozr4WRst5x9s5pCHhT9CA4NLwtui"
        ),
        userRewardPublicAccountPubkey: new PublicKey(
          "5PzDUuUYWmkymdNznZmvWAj5nn89xwFbD844rMJveHY3"
        ),
        rewardVault: new PublicKey(
          "7YfTgYQFGEJ4kb8jCF8cBrrUwEFskLin3EbvE1crqiQh"
        ), // ray
      },
    ],

    stakeKeys: {
      poolIdPubkey: new PublicKey(
        "B6fbnZZ7sbKHR18ffEDD5Nncgp54iKN1GbCgjTRdqhS1"
      ),
      poolAuthorityPubkey: new PublicKey(
        "6amoZ7YBbsz3uUUbkeEH4vDTNwjvgjxTiu6nGi9z1JGe"
      ),

      poolLPVault: new PublicKey(
        "BjAfXpHTHz2kipraNddS6WwQvGGtbvyobn7MxLEEYfrH"
      ),
    },
    stakeProgram: SWAP_METAS[SWAP_RAYDIUM].stakeProgramPubkey,
  }),
  [TokenID.RAY_SOL_RAYDIUM]: new RaydiumLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.RAY_SOL_RAYDIUM]),

    ammIdPubkey: new PublicKey("AVs9TA4nWDzfPJE9gGVNJMVhcQy3V9PGazuz33BfG2RA"),
    ammAuthPubkey: new PublicKey(
      "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
    ),
    ammOpenOrdersPubkey: new PublicKey(
      "6Su6Ea97dBxecd5W92KcVvv6SzCurE2BXGgFe9LNGMpE"
    ),
    ammTargetOrderPubkey: new PublicKey(
      "5hATcCfvhVwAjNExvrg8rRkXmYyksHhVajWLa46iRsmE"
    ),

    poolCoinTokenPubkey: new PublicKey(
      "Em6rHi68trYgBFyJ5261A2nhwuQWfLcirgzZZYoRcrkX"
    ),
    poolPcTokenPubkey: new PublicKey(
      "3mEFzHsJyu2Cpjrz6zPmTzP7uoLFj9SbbecGVzzkL1mJ"
    ),
    poolWithdrawQueue: new PublicKey(
      "FSHqX232PHE4ev9Dpdzrg9h2Tn1byChnX4tuoPUyjjdV"
    ),
    poolTempLpTokenAccount: new PublicKey(
      "87CCkBfthmyqwPuCDwFmyqKWJfjYqPFhm5btkNyoALYZ"
    ),

    serumProgramId: new PublicKey(
      "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
    ),
    serumMarketPubkey: new PublicKey(
      "C6tp2RVZnxBPFbnAsfTjis8BN9tycESAT4SgDQgbbrsA"
    ),
    serumCoinVaultAccount: new PublicKey(
      "6U6U59zmFWrPSzm9sLX7kVkaK78Kz7XJYkrhP1DjF3uF"
    ),
    serumPcVaultAccount: new PublicKey(
      "4YEx21yeUAZxUL9Fs7YU9Gm3u45GWoPFs8vcJiHga2eQ"
    ),
    serumVaultSigner: new PublicKey(
      "7SdieGqwPJo5rMmSQM9JmntSEMoimM4dQn7NkGbNFcrd"
    ),

    rewardAccounts: [
      {
        rewardToken: TokenID.RAY,
        userRewardAlphaAccountPubkey: new PublicKey(
          "B7ewVyAG7YMDemDGKQNBxyGAuoN94w4J5K8NZa72A4BM"
        ),
        userRewardPublicAccountPubkey: new PublicKey(
          "ChJUMQNtVNznGWaFUeNAqKD95hd1gmz9CRHobw3aMRbm"
        ),
        rewardVault: new PublicKey(
          "6zA5RAQYgazm4dniS8AigjGFtRi4xneqjL7ehrSqCmhr"
        ), // ray
      },
    ],

    stakeKeys: {
      poolIdPubkey: new PublicKey(
        "HUDr9BDaAGqi37xbQHzxCyXvfMCKPTPNF8g9c9bPu1Fu"
      ),
      poolAuthorityPubkey: new PublicKey(
        "9VbmvaaPeNAke2MAL3h2Fw82VubH1tBCzwBzaWybGKiG"
      ),

      poolLPVault: new PublicKey(
        "A4xQv2BQPB1WxsjiCC7tcMH7zUq255uCBkevFj8qSCyJ"
      ),
    },
    stakeProgram: SWAP_METAS[SWAP_RAYDIUM].stakeProgramPubkey,
  }),
  [TokenID.SRM_USDC_RAYDIUM]: new RaydiumLpSwapInfo({
    lpMintPubkey: new PublicKey(MINTS[TokenID.SRM_USDC_RAYDIUM]),

    ammIdPubkey: new PublicKey("8tzS7SkUZyHPQY7gLqsMCXZ5EDCgjESUHcB17tiR1h3Z"),
    ammAuthPubkey: new PublicKey(
      "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
    ),
    ammOpenOrdersPubkey: new PublicKey(
      "GJwrRrNeeQKY2eGzuXGc3KBrBftYbidCYhmA6AZj2Zur"
    ),
    ammTargetOrderPubkey: new PublicKey(
      "26LLpo8rscCpMxyAnJsqhqESPnzjMGiFdmXA4eF2Jrk5"
    ),

    poolCoinTokenPubkey: new PublicKey(
      "zuLDJ5SEe76L3bpFp2Sm9qTTe5vpJL3gdQFT5At5xXG"
    ),
    poolPcTokenPubkey: new PublicKey(
      "4usvfgPDwXBX2ySX11ubTvJ3pvJHbGEW2ytpDGCSv5cw"
    ),
    poolWithdrawQueue: new PublicKey(
      "7c1VbXTB7Xqx5eQQeUxAu5o6GHPq3P1ByhDsnRRUWYxB"
    ),
    poolTempLpTokenAccount: new PublicKey(
      "2sozAi6zXDUCCkpgG3usphzeCDm4e2jTFngbm5atSdC9"
    ),

    serumProgramId: new PublicKey(
      "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
    ),
    serumMarketPubkey: new PublicKey(
      "ByRys5tuUWDgL73G8JBAEfkdFf8JWBzPBDHsBVQ5vbQA"
    ),
    serumCoinVaultAccount: new PublicKey(
      "Ecfy8et9Mft9Dkavnuh4mzHMa2KWYUbBTA5oDZNoWu84"
    ),
    serumPcVaultAccount: new PublicKey(
      "hUgoKy5wjeFbZrXDW4ecr42T4F5Z1Tos31g68s5EHbP"
    ),
    serumVaultSigner: new PublicKey(
      "GVV4ZT9pccwy9d17STafFDuiSqFbXuRTdvKQ1zJX6ttX"
    ),

    rewardAccounts: [
      {
        rewardToken: TokenID.RAY,
        userRewardAlphaAccountPubkey: new PublicKey(
          "4jnfVscrBTf77bjkR2JSHQT6q7N7BWFyufG6YdZCR8re"
        ),
        userRewardPublicAccountPubkey: new PublicKey(
          "2qgtUtNopD3ZCrQCbVsvYd1BrPeWxn4TcrXjwvTzLCYi"
        ),
        rewardVault: new PublicKey(
          "9gs6XnKs3RMMSSQAZm3VCbRpoNmPMrGaQQGMmRKjPeSU"
        ), // ray
      },
      {
        rewardToken: TokenID.SRM,
        userRewardAlphaAccountPubkey: new PublicKey(
          "6E4seHTUoufVwALGE8XBYEMh5n7t4irwYXD6jtqgqzeM"
        ),
        userRewardPublicAccountPubkey: new PublicKey(
          "2iy54EuEMgUVFMaRzxusiMSawgcHUgR34SZWaKkMosMc"
        ),
        rewardVault: new PublicKey(
          "BsuQ3XCCapopam8byEzHzazyxcRn5dCT3UX9kUzozhw"
        ), // srm
      },
    ],

    stakeKeys: {
      poolIdPubkey: new PublicKey(
        "27bysJaX5eu5Urb5kftR66otiVc6DKK7TnifKwnpNzYu"
      ),
      poolAuthorityPubkey: new PublicKey(
        "HAWwtFc4MFNSXFyQbUZd2GefSwZLntCiumt1D6XM8jfk"
      ),

      poolLPVault: new PublicKey(
        "HVEm5BG4jMHtwgrUtuiC9K17bjp9CjFpgqmzVABmzLxr"
      ),
    },
  }),
};

export const LP_SWAP_METAS: { [key in TokenID]?: LpSwapKeyInfo } = {};

for (const key in ORCA_LP_METAS) {
  const tokId = key as TokenID;
  invariant(tokId in TokenID, `Invalid tokId: ${key}`);
  invariant(!(tokId in LP_SWAP_METAS), `${tokId} is duplicated`);
  const value = ORCA_LP_METAS[tokId]!;
  invariant(value);
  LP_SWAP_METAS[tokId] = value;
}

for (const key in SABER_LP_METAS) {
  const tokId = key as TokenID;
  invariant(tokId in TokenID, `Invalid tokId: ${key}`);
  invariant(!(tokId in LP_SWAP_METAS), `${tokId} is duplicated`);
  const value = SABER_LP_METAS[tokId]!;
  invariant(value);
  LP_SWAP_METAS[tokId] = value;
}

for (const key in RAYDIUM_LP_METAS) {
  const tokId = key as TokenID;
  invariant(tokId in TokenID, `Invalid tokId: ${key}`);
  invariant(!(tokId in LP_SWAP_METAS), `${tokId} is duplicated`);
  const value = RAYDIUM_LP_METAS[tokId]!;
  invariant(value);
  LP_SWAP_METAS[tokId] = value;
}

export const SWITCHBOARD_PRICE: { [key in TokenID]?: PublicKey } = {
  [TokenID.BTC]: new PublicKey("74YzQPGUT9VnjrBz8MuyDLKgKpbDqGot5xZJvTtMi6Ng"),
  [TokenID.ETH]: new PublicKey("QJc2HgGhdtW4e7zjvLB1TGRuwEpTre2agU5Lap2UqYz"),
  [TokenID.SOL]: new PublicKey("AdtRGGhmqvom3Jemp5YNrxd9q9unX36BZk1pujkkXijL"),
  [TokenID.mSOL]: new PublicKey("CEPVH2t11KS4CaL3w4YxT9tRiijoGA4VEbnQ97cEpDmQ"),
  [TokenID.stSOL]: new PublicKey(
    "9r2p6vyF8Wp5YB2DASK95yuXEakQth6wmUmV2DpH91WX"
  ),
  [TokenID.whETH]: new PublicKey("QJc2HgGhdtW4e7zjvLB1TGRuwEpTre2agU5Lap2UqYz"),

  [TokenID.APT]: new PublicKey("CvLZbNUPLkbMuVK9YPqhvLu4UkXmrJbF98odXtPL6VRu"),
  [TokenID.RAY]: new PublicKey("CppyF6264uKZkGua1brTUa2fSVdMFSCszwzDs76HCuzU"),
  [TokenID.ORCA]: new PublicKey("EHwSRkm2ErRjWxCxrTxrmC7sT2kGb5jJcsiindUHAX7W"),
  [TokenID.SBR]: new PublicKey("Lp3VNoRQi699VZe6u59TV8J38ELEUzxkaisoWsDuJgB"),
  // [TokenID.MERC]: new PublicKey(""), // MERC not on sb
  [TokenID.FTT]: new PublicKey("6SqRewrr5f4ycWy7NvLmNgpXJbhwXrtTc1erL9aq2gP3"),
  [TokenID.SRM]: new PublicKey("BAoygKcKN7wk8yKzLD6sxzUQUqLvhBV1rjMA4UJqfZuH"),

  [TokenID.USDT]: new PublicKey("5mp8kbkTYwWWCsKSte8rURjTuyinsqBpJ9xAQsewPDD"),
  [TokenID.USDC]: new PublicKey("CZx29wKMUxaJDq6aLVQTdViPL754tTR64NAgQBUGxxHb"),
  [TokenID.UST]: new PublicKey("8o8gN6VnW45R8pPfQzUJUwJi2adFmsWwfGcFNmicWt61"),
  [TokenID.USTv2]: new PublicKey(
    "8o8gN6VnW45R8pPfQzUJUwJi2adFmsWwfGcFNmicWt61"
  ),
};

export const PYTH_PRICE: { [key in TokenID]?: PublicKey } = {
  [TokenID.BTC]: new PublicKey("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU"),
  [TokenID.ETH]: new PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB"),
  [TokenID.SOL]: new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"),
  [TokenID.mSOL]: new PublicKey("E4v1BBgoso9s64TQvmyownAVJbhbEPGyzA3qn4n46qj9"),
  [TokenID.stSOL]: new PublicKey(
    "Bt1hEbY62aMriY1SyQqbeZbm8VmSbQVGBFzSzMuVNWzN"
  ),
  [TokenID.whETH]: new PublicKey(
    "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB"
  ),

  //[TokenID.APT]: new PublicKey(""),
  [TokenID.RAY]: new PublicKey("AnLf8tVYCM816gmBjiy8n53eXKKEDydT5piYjjQDPgTB"),
  // [TokenID.ORCA]: new PublicKey(""),
  [TokenID.SBR]: new PublicKey("8Td9VML1nHxQK6M8VVyzsHo32D7VBk72jSpa9U861z2A"),
  [TokenID.FTT]: new PublicKey("8JPJJkmDScpcNmBRKGZuPuG2GYAveQgP3t5gFuMymwvF"),
  [TokenID.SRM]: new PublicKey("3NBReDRTLKMQEKiLD5tGcx4kXbTf88b7f2xLS9UuGjym"),

  [TokenID.USDT]: new PublicKey("3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqEEefL"),
  [TokenID.USDC]: new PublicKey("Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD"),
  [TokenID.UST]: new PublicKey("H8DvrfSaRfUyP1Ytse1exGf7VSinLWtmKNNaBhA4as9P"),
  [TokenID.USTv2]: new PublicKey(
    "H8DvrfSaRfUyP1Ytse1exGf7VSinLWtmKNNaBhA4as9P"
  ),
};

const FIREBASE_READER_CONFIG = {
  alpha: {
    apiKey: "AIzaSyDWBTlo8oeJGnpV0CnQEBpeloMbHgN6xY8",
    authDomain: "apricot-website-96904.firebaseapp.com",
    projectId: "apricot-website-96904",
    storageBucket: "apricot-website-96904.appspot.com",
    messagingSenderId: "181748660172",
    appId: "1:181748660172:web:fea7b301ef6a09c3d60f69",
    measurementId: "G-W2RX0BF87Q",
  },
  public: {
    apiKey: "AIzaSyAGpQxt6PUaLf1vhfhxL5hzWcP1QDIeOSc",
    authDomain: "apricot-public.firebaseapp.com",
    projectId: "apricot-public",
    storageBucket: "apricot-public.appspot.com",
    messagingSenderId: "735163506624",
    appId: "1:735163506624:web:e6406687d889d993e93225",
    measurementId: "G-VBTE0406R3",
  },
};

// alpha mainnet is where we deploy tests
export const ALPHA_CONFIG = new AppConfig(
  new PublicKey("5dtKmAzoJu4qDxMjjK7gWY2pPe6NWAX6HWQk5QUHaKQZ"),
  new PublicKey("EFo9V7mFQgxz7xPMrJ6qLyrjfGXPgsEFEfGEtVQx2xKt"),
  new PublicKey("3cWR2VDrVhQ43VX8B43MwTazfx66naioXurUh8vrkidt"),
  new PublicKey("4DUvqxvab2BiJEYR7YHi3nM5tfyLNXFBQbJuExQPK9rf"),
  new PublicKey("Ff9WeFriS8DoJkiZPEZRpmiFu5jzYx3xZzoGNpwWMp5J"),
  new PublicKey("EQWujCg9fTnj2wi2oVWWkWsJmtRU2tpEUMhhiVSMtHCH"),
  new PublicKey("Cuf4Hbuv9RDZ1vzuUE833MKzjeX7odsBeewEjhmVwVRk"),
  MINTS,
  DECIMAL_MULT,
  CATEGORY,
  POOL_IDS,
  LIQUIDATION_DISCOUNT,
  LTVS,
  LP_TO_LR,
  LP_TO_DEX,
  LP_TO_TARGET_SWAP,
  LP_TO_NEED_2ND_STAKE,
  SWITCHBOARD_PRICE,
  PYTH_PRICE,
  INTEREST_RATES,
  FEES,
  LP_SWAP_METAS,
  FIREBASE_READER_CONFIG.alpha
);

// public mainnet is where the real thing is
export const PUBLIC_CONFIG = new AppConfig(
  // not added yet
  new PublicKey("6UeJYTLU1adaoHWeApWsoj1xNEDbWA2RhM2DLc8CrDDi"),
  new PublicKey("6L2QoTpr8WUd76eLAGnvow8i3WQzRP36C1qdUna9iwMn"),
  new PublicKey("F5m8gNjC6pjynywcbw9kK1miSNJMw1nQGeviWykfCCXd"),
  new PublicKey("FsSq4dqugLgZbsyLNt7bngtBkDApXaHUFXVQ6od5TeQ3"),
  new PublicKey("GttyqdmooMEcgWqZPrb8FcdwjgaTLweLzuvVpnCMq5q1"),
  new PublicKey("4aWV85p4o115qVo5p9sgbAGqYXmh34838xFpwuN1nxEP"),
  new PublicKey("C1k4CehboSgUkmL3BJfw32Xj9HPs9NKTzhT5WXsYwWh4"),
  MINTS,
  DECIMAL_MULT,
  CATEGORY,
  POOL_IDS,
  LIQUIDATION_DISCOUNT,
  LTVS,
  LP_TO_LR,
  LP_TO_DEX,
  LP_TO_TARGET_SWAP,
  LP_TO_NEED_2ND_STAKE,
  SWITCHBOARD_PRICE,
  PYTH_PRICE,
  INTEREST_RATES,
  FEES,
  LP_SWAP_METAS,
  FIREBASE_READER_CONFIG.public
);

type RaydiumEntry = {
  lp_mint: string;
  lp_price: number;
  token_amount_coin: number;
  token_amount_pc: number;
  token_amount_lp: number;
};

const checkIsValidNumber = (n: number) =>
  invariant(
    typeof n === "number" &&
      !(isNaN(n) || n === Infinity || n === -Infinity) &&
      Number.isFinite(n),
    "Invalid number"
  );

const bufferToHexStr = (buffer: Buffer) => u64.fromBuffer(buffer).toString();
export class PriceInfo {
  cachedRaydiumContent: RaydiumEntry[] | null;
  raydiumCacheTime: number;
  constructor(public config: AppConfig) {
    this.cachedRaydiumContent = null;
    this.raydiumCacheTime = 0;
  }

  async fetchPrice(
    tokId: TokenID,
    connection: Connection,
    isForcePriceByChain = false
  ): Promise<number> {
    if (tokId in this.config.switchboardPriceKeys) {
      return this.fetchViaSwitchboard(tokId, connection);
    } else {
      invariant(tokId in this.config.poolConfigs);
      const poolConfig = this.config.poolConfigs[tokId]!;
      invariant(
        poolConfig.isLp(),
        "volatile/stable tokens should be priced through switchboard"
      );
      // read directly from raydium endpoint if it's raydium LP

      if (isForcePriceByChain)
        return await this.computeLpPriceOnChain(tokId, poolConfig, connection);

      if (poolConfig.lpDex === Dex.Raydium) {
        return this.getRaydiumLpPrice(poolConfig, connection);
      } else {
        return this.computeLpPrice(tokId, poolConfig, connection);
      }
    }
  }

  async fetchViaSwitchboard(
    tokId: TokenID,
    connection: Connection
  ): Promise<number> {
    const key = this.config.switchboardPriceKeys[tokId]!;
    invariant(key, `${tokId} not available through switchboard`);
    const data = await switchboard.parseAggregatorAccountData(connection, key);
    let price = data.currentRoundResult?.result;
    if (!price) {
      price = data.lastRoundResult?.result;
    }
    invariant(price);
    return price;
  }

  async fetchViaPyth(tokId: TokenID, connection: Connection): Promise<number> {
    const key = this.config.pythPriceKeys[tokId]!;
    invariant(key, `${tokId} not available through pyth`);
    const accountInfo = await connection.getAccountInfo(key, "confirmed");
    invariant(accountInfo, `${tokId} PriceData not available through pyth`);
    const parsedData = parsePriceData(accountInfo.data);
    invariant(parsedData.price, `${tokId} returned invalid price from pyth`);
    return parsedData.price;
  }

  async checkRaydiumCache(requestTimeout = 8000, retries = 0) {
    /*
    const now = Date.now();
    // update cache if cached more than 30s
    if(now - this.raydiumCacheTime > 30 * 1000) {
      try {
        const response = await axios.get("https://api.raydium.io/pairs", {
          timeout: requestTimeout,
          raxConfig: {
            retry: retries,
            noResponseRetries: retries,
            backoffType: 'exponential',
            statusCodesToRetry: [[100, 199], [400, 429], [500, 599]],
            onRetryAttempt: err => {
              const cfg = rax.getConfig(err);
              console.log(`Raydium pairs request retry attempt #${cfg?.currentRetryAttempt}`);
            }
          }
        });
        const content = response.data as RaydiumEntry[];
        this.cachedRaydiumContent = content;
        this.raydiumCacheTime = Date.now();
      } catch (error) {
        if (axios.isAxiosError(error))  {
          console.log(`Request raydium failed: ${error.message}`);
        } else {
          console.log(error);
        }
        throw error;
      }
    }
    invariant(this.cachedRaydiumContent);
    return this.cachedRaydiumContent;
    */
    throw new Error("Not supported.");
  }

  async getRaydiumLpPrice(
    poolConfig: PoolConfig,
    connection: Connection
  ): Promise<number> {
    /*
    const [leftTokId, rightTokId] = poolConfig.lpLeftRightTokenId!;
    const leftPrice = await this.fetchPrice(leftTokId, connection);
    const rightPrice = await this.fetchPrice(rightTokId, connection);
    const mintStr = poolConfig.mint.toString();
    const raydiumContent = await this.checkRaydiumCache();
    const filtered = raydiumContent.filter(entry => entry.lp_mint === mintStr);
    const entry = filtered[0];
    const price = (leftPrice * entry.token_amount_coin + rightPrice * entry.token_amount_pc) / entry.token_amount_lp;
    checkIsValidNumber(price);
    return price;
    */
    throw new Error("Not supported.");
  }

  async computeLpPriceOnChain(
    lpTokId: TokenID,
    poolConfig: PoolConfig,
    connection: Connection
  ): Promise<number> {
    invariant(poolConfig.isLp());
    invariant(poolConfig.tokenId === lpTokId);
    const lpMint = poolConfig.mint;
    const [leftTokId, rightTokId] = poolConfig.lpLeftRightTokenId!;
    invariant(lpMint);
    invariant(leftTokId);
    invariant(rightTokId);
    invariant(lpTokId in LP_SWAP_METAS);
    const [leftVault, rightVault] = LP_SWAP_METAS[lpTokId]?.getLRVaults()!;

    const accountKeys = [leftVault, rightVault, lpMint];
    if (poolConfig.lpDex === Dex.Raydium) {
      const raydiumPoolMeta = RAYDIUM_LP_METAS[lpTokId]!;
      invariant(raydiumPoolMeta);
      accountKeys.push(
        raydiumPoolMeta.ammOpenOrdersPubkey,
        raydiumPoolMeta.ammIdPubkey
      );
    }

    let leftAmount = new Decimal(0);
    let rightAmount = new Decimal(0);
    let lpAmount = new Decimal(0);

    // console.log(`keys: `, accountKeys.map(k => k.toBase58()));
    console.log(`Is calculating price via getMultipleAccountsInfo ...`);
    let infosRaw = await connection.getMultipleAccountsInfo(
      accountKeys,
      "confirmed"
    );
    const infos = infosRaw as AccountInfo<Buffer>[];
    infos.forEach((info, i) => {
      invariant(info, `Fetch multiple account info failed at ${i}`);
      if (i <= 1) {
        invariant(
          info.data.length === AccountLayout.span,
          "Invalid token account info data length"
        );
        const account = AccountLayout.decode(info.data);
        if (i === 0)
          leftAmount = leftAmount.plus(bufferToHexStr(account.amount));
        if (i === 1)
          rightAmount = rightAmount.plus(bufferToHexStr(account.amount));
      } else if (i === 2) {
        invariant(
          info.data.length === MintLayout.span,
          "Invalid mint account info data length"
        );
        const account = MintLayout.decode(info.data);
        lpAmount = lpAmount.plus(bufferToHexStr(account.supply));
      } else if (poolConfig.lpDex === Dex.Raydium) {
        if (i === 3) {
          const raydiumPoolMeta = RAYDIUM_LP_METAS[lpTokId];
          invariant(raydiumPoolMeta);
          const LAYOUT = OpenOrders.getLayout(raydiumPoolMeta.serumProgramId);
          invariant(
            info.data.length === LAYOUT.span,
            "Invalid raydium open orders account info data length"
          );
          const parsedOpenOrders = LAYOUT.decode(info.data);
          const { baseTokenTotal, quoteTokenTotal } = parsedOpenOrders;
          leftAmount = leftAmount.plus(baseTokenTotal.toString()); // BN
          rightAmount = rightAmount.plus(quoteTokenTotal.toString()); // BN
        } else if (i === 4) {
          invariant(
            info.data.length === AMM_INFO_LAYOUT_V4.span,
            "invalid raydium amm ID account data length"
          );
          const { needTakePnlCoin, needTakePnlPc } = AMM_INFO_LAYOUT_V4.decode(
            info.data
          );
          leftAmount = leftAmount.minus(needTakePnlCoin.toString());
          rightAmount = rightAmount.minus(needTakePnlPc.toString());
        } else {
          throw new Error("Invalid multiple accounts info index");
        }
      } else {
        throw new Error("Invalid multiple accounts info index");
      }
      // console.log(`l:r:lp`, leftAmount.toString(), rightAmount.toString(), lpAmount.toString());
    });

    const leftPrice = await this.fetchPrice(leftTokId, connection);
    const rightPrice = await this.fetchPrice(rightTokId, connection);

    const price = leftAmount
      .div(DECIMAL_MULT[leftTokId])
      .mul(leftPrice)
      .plus(rightAmount.div(DECIMAL_MULT[rightTokId]).mul(rightPrice))
      .div(lpAmount.div(DECIMAL_MULT[lpTokId]));

    const priNum = price.toNumber();
    checkIsValidNumber(priNum);
    return priNum;
  }

  async computeLpPrice(
    lpTokId: TokenID,
    poolConfig: PoolConfig,
    connection: Connection
  ): Promise<number> {
    invariant(poolConfig.isLp());
    invariant(poolConfig.tokenId === lpTokId);
    const lpMint = poolConfig.mint;
    const [leftTokId, rightTokId] = poolConfig.lpLeftRightTokenId!;
    invariant(lpMint);
    invariant(leftTokId);
    invariant(rightTokId);
    invariant(lpTokId in LP_SWAP_METAS);
    const [leftVault, rightVault] = LP_SWAP_METAS[lpTokId]?.getLRVaults()!;
    let leftBalance = (await connection.getTokenAccountBalance(leftVault)).value
      .uiAmount!;
    let rightBalance = (await connection.getTokenAccountBalance(rightVault))
      .value.uiAmount!;
    const lpMintData = (await connection.getParsedAccountInfo(lpMint)).value
      ?.data as any;
    const lpBalanceStr = lpMintData.parsed?.info.supply;
    const decimalMult = DECIMAL_MULT[lpTokId];
    const lpBalance = new Decimal(lpBalanceStr).div(decimalMult).toNumber();

    // raydium has extra balance floating on serum
    if (poolConfig.lpDex === Dex.Raydium) {
      const [additionalLeftNative, additionalRightNative] =
        await this.getRaydiumAdditionalBalance(lpTokId, connection);
      const additionalLeftBalance =
        additionalLeftNative / DECIMAL_MULT[leftTokId];
      const additionalRightBalance =
        additionalRightNative / DECIMAL_MULT[rightTokId];
      leftBalance += additionalLeftBalance;
      rightBalance += additionalRightBalance;
    }

    const leftPrice = await this.fetchPrice(leftTokId, connection);
    const rightPrice = await this.fetchPrice(rightTokId, connection);

    const price =
      (leftPrice * leftBalance + rightPrice * rightBalance) / lpBalance;
    checkIsValidNumber(price);
    return price;
  }

  async fetchLRStats(
    lpTokId: TokenID,
    connection: Connection,
    isValue: boolean
  ): Promise<[number, number]> {
    const [leftBalance, rightBalance] = await this.fetchLRLpAmounts(
      lpTokId,
      connection
    );
    if (!isValue) {
      return [leftBalance, rightBalance];
    }

    const poolConfig = this.config.poolConfigs[lpTokId]!;
    invariant(poolConfig.isLp());
    invariant(poolConfig.tokenId === lpTokId);
    const [leftTokId, rightTokId] = poolConfig.lpLeftRightTokenId!;
    invariant(leftTokId);
    invariant(rightTokId);
    const leftPrice = await this.fetchPrice(leftTokId, connection);
    const rightPrice = await this.fetchPrice(rightTokId, connection);
    return [leftBalance * leftPrice, rightBalance * rightPrice];
  }

  async fetchLRAmounts(
    lpTokId: TokenID,
    connection: Connection
  ): Promise<[number, number]> {
    return this.fetchLRStats(lpTokId, connection, false);
  }

  async fetchLRValuets(
    lpTokId: TokenID,
    connection: Connection
  ): Promise<[number, number]> {
    return this.fetchLRStats(lpTokId, connection, true);
  }

  async fetchLRLpAmounts(
    lpTokId: TokenID,
    connection: Connection
  ): Promise<[number, number, number]> {
    const poolConfig = this.config.poolConfigs[lpTokId]!;
    invariant(poolConfig.isLp());
    invariant(poolConfig.tokenId === lpTokId);
    const lpMint = poolConfig.mint;
    const [leftTokId, rightTokId] = poolConfig.lpLeftRightTokenId!;
    invariant(lpMint);
    invariant(leftTokId);
    invariant(rightTokId);
    invariant(lpTokId in LP_SWAP_METAS);
    const [leftVault, rightVault] = LP_SWAP_METAS[lpTokId]?.getLRVaults()!;

    const accountKeys = [leftVault, rightVault, lpMint];
    if (poolConfig.lpDex === Dex.Raydium) {
      const raydiumPoolMeta = RAYDIUM_LP_METAS[lpTokId]!;
      invariant(raydiumPoolMeta);
      accountKeys.push(
        raydiumPoolMeta.ammOpenOrdersPubkey,
        raydiumPoolMeta.ammIdPubkey
      );
    }

    let leftAmount = new Decimal(0);
    let rightAmount = new Decimal(0);
    let lpAmount = new Decimal(0);

    let infosRaw = await connection.getMultipleAccountsInfo(
      accountKeys,
      "confirmed"
    );
    const infos = infosRaw as AccountInfo<Buffer>[];
    infos.forEach((info, i) => {
      invariant(info, `Fetch multiple account info failed at ${i}`);
      if (i <= 1) {
        invariant(
          info.data.length === AccountLayout.span,
          "Invalid token account info data length"
        );
        const account = AccountLayout.decode(info.data);
        if (i === 0)
          leftAmount = leftAmount.plus(bufferToHexStr(account.amount));
        if (i === 1)
          rightAmount = rightAmount.plus(bufferToHexStr(account.amount));
      } else if (i === 2) {
        invariant(
          info.data.length === MintLayout.span,
          "Invalid mint account info data length"
        );
        const account = MintLayout.decode(info.data);
        lpAmount = lpAmount.plus(bufferToHexStr(account.supply));
      } else if (poolConfig.lpDex === Dex.Raydium) {
        if (i === 3) {
          const raydiumPoolMeta = RAYDIUM_LP_METAS[lpTokId];
          invariant(raydiumPoolMeta);
          const LAYOUT = OpenOrders.getLayout(raydiumPoolMeta.serumProgramId);
          invariant(
            info.data.length === LAYOUT.span,
            "Invalid raydium open orders account info data length"
          );
          const parsedOpenOrders = LAYOUT.decode(info.data);
          const { baseTokenTotal, quoteTokenTotal } = parsedOpenOrders;
          leftAmount = leftAmount.plus(baseTokenTotal.toString()); // BN
          rightAmount = rightAmount.plus(quoteTokenTotal.toString()); // BN
        } else if (i === 4) {
          invariant(
            info.data.length === AMM_INFO_LAYOUT_V4.span,
            "invalid raydium amm ID account data length"
          );
          const { needTakePnlCoin, needTakePnlPc } = AMM_INFO_LAYOUT_V4.decode(
            info.data
          );
          leftAmount = leftAmount.minus(needTakePnlCoin.toString());
          rightAmount = rightAmount.minus(needTakePnlPc.toString());
        } else {
          throw new Error("Invalid multiple accounts info index");
        }
      } else {
        throw new Error("Invalid multiple accounts info index");
      }
    });

    const leftAmt = leftAmount.div(DECIMAL_MULT[leftTokId]).toNumber();
    checkIsValidNumber(leftAmt);
    const rightAmt = rightAmount.div(DECIMAL_MULT[rightTokId]).toNumber();
    checkIsValidNumber(rightAmt);
    const lpAmt = lpAmount.div(DECIMAL_MULT[lpTokId]).toNumber();
    checkIsValidNumber(lpAmt);

    return [leftAmt, rightAmt, lpAmt];
  }

  async getRaydiumAdditionalBalance(
    lpTokId: TokenID,
    connection: Connection
  ): Promise<[number, number]> {
    const raydiumPoolMeta = RAYDIUM_LP_METAS[lpTokId]!;
    invariant(raydiumPoolMeta);
    const response = (await connection.getAccountInfo(
      raydiumPoolMeta.ammOpenOrdersPubkey
    ))!;
    invariant(response, `failed to fetch ammOpenOrders for ${lpTokId}`);
    const responseDataBuffer = Buffer.from(response.data);
    const LAYOUT = OpenOrders.getLayout(raydiumPoolMeta.serumProgramId);
    const parsedOpenOrders = LAYOUT.decode(responseDataBuffer);
    const { baseTokenTotal, quoteTokenTotal } = parsedOpenOrders;
    return [baseTokenTotal, quoteTokenTotal];
  }

  async fetchRaydiumPrice(
    tokenId: TokenID,
    timeout = 3000,
    retries = 3
  ): Promise<number> {
    try {
      const response = await axios.get("https://api.raydium.io/coin/price", {
        timeout: timeout,
        raxConfig: {
          retry: retries,
          noResponseRetries: retries,
          backoffType: "exponential",
          statusCodesToRetry: [
            [100, 199],
            [400, 429],
            [500, 599],
          ],
          onRetryAttempt: (err) => {
            const cfg = rax.getConfig(err);
            console.log(
              `Raydium price request retry attempt #${cfg?.currentRetryAttempt}`
            );
          },
        },
      });

      if (tokenId in response.data) {
        return response.data[tokenId];
      }
      throw new Error(`${tokenId} Price is not available at Raydium`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(`Request raydium price failed: ${error.message}`);
      } else {
        console.log(error);
      }
      throw error;
    }
  }
}

export async function createAssetPoolLoader(
  connection: Connection,
  fetchPrice?: (token: TokenID) => Promise<number | undefined>,
  config: AppConfig = PUBLIC_CONFIG
): Promise<AssetPoolLoader> {
  if (fetchPrice === undefined) {
    const priceInfo = new PriceInfo(config);
    fetchPrice = async (tokenId) => {
      try {
        if (tokenId === TokenID.MNDE) {
          return await priceInfo.fetchRaydiumPrice(tokenId);
        } else {
          return await priceInfo.fetchPrice(tokenId, connection);
        }
      } catch (error) {
        console.error(error);
        return undefined;
      }
    };
  }
  let poolLoader = new AssetPoolLoader(connection, config, fetchPrice);
  return poolLoader;
}

export class AccountParser {
  static getOffsets(widths: number[]) {
    const offsets: number[] = [];
    const ends: number[] = [];
    let offset = 0;
    for (const w of widths) {
      offsets.push(offset);
      offset += w;
      ends.push(offset);
    }
    return [offsets, ends];
  }

  static parseString(buffer: Uint8Array) {
    const decoded = new TextDecoder().decode(buffer);
    const len = decoded.indexOf("\u0000");
    return len === -1 ? decoded : decoded.substr(0, len);
  }

  static parseUint16(buffer: ArrayBufferLike, offset: number): number {
    const view = new DataView(buffer);
    return view.getUint16(offset, true);
  }

  static parseUint32(buffer: ArrayBufferLike, offset: number): Decimal {
    const view = new DataView(buffer);
    return new Decimal(view.getUint32(offset, true));
  }

  static parseInt32(buffer: ArrayBufferLike, offset: number): Decimal {
    const view = new DataView(buffer);
    return new Decimal(view.getInt32(offset, true));
  }

  static parseBigUint64(buffer: ArrayBufferLike, offset: number): Decimal {
    const view = new DataView(buffer);
    const lower = new Decimal(view.getUint32(offset, true));
    const higher = new Decimal(view.getUint32(offset + 4, true));
    return higher.mul(new Decimal(4294967296)).add(lower);
  }

  static parseFloat64(buffer: ArrayBufferLike, offset: number): Decimal {
    const view = new DataView(buffer);
    return new Decimal(view.getFloat64(offset, true));
  }

  static setUint8(buffer: ArrayBufferLike, offset: number, value: number) {
    const view = new DataView(buffer);
    view.setUint8(offset, value);
  }

  static setBigUint64(
    buffer: ArrayBufferLike,
    offset: number,
    value: Decimal | number
  ) {
    value = new Decimal(value);
    const view = new DataView(buffer);
    const high = value.divToInt(4294967296);
    const low = value.mod(4294967296);
    view.setUint32(offset, low.toNumber(), true);
    view.setUint32(offset + 4, high.toNumber(), true);
  }

  static parseBigInt128(buffer: ArrayBufferLike, offset: number): Decimal {
    const lower = AccountParser.parseBigUint64(buffer, offset);
    const higher = AccountParser.parseBigUint64(buffer, offset + 8);
    return higher.mul(new Decimal("18446744073709551616")).add(lower);
  }

  static setFloat64(buffer: ArrayBufferLike, offset: number, value: number) {
    const view = new DataView(buffer);
    view.setFloat64(offset, value, true);
  }

  static parsePoolList(poolListData: Uint8Array) {
    const count = new DataView(poolListData.buffer).getUint16(0, true);
    const result = new Array(count);
    for (let i = 0; i < count; i++) {
      const offset = 8 + i * 32;
      const end = offset + 32;
      result[i] = new PublicKey(
        new Uint8Array(poolListData.slice(offset, end))
      );
    }
    return result;
  }

  static parseAssetPool(data: Uint8Array): AssetPool {
    const widths = [
      32, 32, 8, 1, 16, 8, 16, 8, 8, 16, 8, 8, 8, 32, 32, 32, 32, 8, 8, 8, 1, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 1, 8,
    ];
    const [offsets, ends] = AccountParser.getOffsets(widths);
    return {
      coin_name: AccountParser.parseString(data.slice(offsets[0], ends[0])),

      mint_key: new PublicKey(data.slice(offsets[1], ends[1])),
      mint_decimal_mult: AccountParser.parseBigUint64(data.buffer, offsets[2]),
      pool_id: data[offsets[3]],

      deposit_amount: AccountParser.parseBigInt128(data.buffer, offsets[4]).div(
        new Decimal(AMOUNT_MULTIPLIER)
      ),
      deposit_index: AccountParser.parseFloat64(data.buffer, offsets[5]),

      borrow_amount: AccountParser.parseBigInt128(data.buffer, offsets[6]).div(
        new Decimal(AMOUNT_MULTIPLIER)
      ),
      borrow_index: AccountParser.parseFloat64(data.buffer, offsets[7]),

      reserve_factor: AccountParser.parseFloat64(data.buffer, offsets[8]),
      fee_amount: AccountParser.parseBigInt128(data.buffer, offsets[9]).div(
        new Decimal(AMOUNT_MULTIPLIER)
      ),
      fee_withdrawn_amt: AccountParser.parseBigUint64(data.buffer, offsets[10]),
      fee_rate: AccountParser.parseFloat64(data.buffer, offsets[11]),

      last_update_time: AccountParser.parseBigUint64(data.buffer, offsets[12]),

      spl_key: new PublicKey(data.slice(offsets[13], ends[13])),
      atoken_mint_key: new PublicKey(data.slice(offsets[14], ends[14])),
      price_key: new PublicKey(data.slice(offsets[15], ends[15])),
      pyth_price_key: new PublicKey(data.slice(offsets[16], ends[16])),

      serum_next_cl_id: AccountParser.parseBigUint64(data.buffer, offsets[17]),
      ltv: AccountParser.parseFloat64(data.buffer, offsets[18]),
      safe_factor: AccountParser.parseFloat64(data.buffer, offsets[19]),
      flags: data[offsets[20]],

      base_rate: AccountParser.parseFloat64(data.buffer, offsets[21]),
      multiplier1: AccountParser.parseFloat64(data.buffer, offsets[22]),
      multiplier2: AccountParser.parseFloat64(data.buffer, offsets[23]),
      kink: AccountParser.parseFloat64(data.buffer, offsets[24]),
      borrow_rate: AccountParser.parseFloat64(data.buffer, offsets[25]),
      deposit_rate: AccountParser.parseFloat64(data.buffer, offsets[26]),

      reward_multiplier: AccountParser.parseFloat64(data.buffer, offsets[27]),
      reward_deposit_intra: AccountParser.parseFloat64(
        data.buffer,
        offsets[28]
      ),

      reward_per_year: AccountParser.parseBigUint64(data.buffer, offsets[29]),
      reward_per_year_deposit: AccountParser.parseBigUint64(
        data.buffer,
        offsets[30]
      ),
      reward_per_year_borrow: AccountParser.parseBigUint64(
        data.buffer,
        offsets[31]
      ),
      reward_per_year_per_d: AccountParser.parseFloat64(
        data.buffer,
        offsets[32]
      ),
      reward_per_year_per_b: AccountParser.parseFloat64(
        data.buffer,
        offsets[33]
      ),

      reward_deposit_index: AccountParser.parseFloat64(
        data.buffer,
        offsets[34]
      ),
      reward_borrow_index: AccountParser.parseFloat64(data.buffer, offsets[35]),

      deposit_cap: AccountParser.parseBigUint64(data.buffer, offsets[36]),
      is_disabled: data[offsets[37]] > 0,
      farm_yield: AccountParser.parseFloat64(data.buffer, offsets[38]),
    };
  }

  static parseAssetPrice(data: Uint8Array): AssetPrice {
    return {
      price_in_usd: AccountParser.parseBigUint64(data.buffer, 0),
    };
  }

  static parsePriceSummaries(data: Uint8Array) {
    const result: Decimal[] = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const offset = i * 8;
      result[i] = AccountParser.parseBigUint64(data.buffer, offset);
    }
    return result;
  }

  static parseUserPagesStats(data: Uint8Array) {
    const result: number[] = [];
    const view = new DataView(data.buffer);
    for (let offset = 0; offset < data.length; offset += 2) {
      result.push(view.getUint16(offset, true));
    }
    return result;
  }

  static parseUsersPage(data: Uint8Array) {
    const result: PublicKey[] = [];
    const count = data.length / 32;
    for (let i = 0; i < count; i++) {
      const offset = i * 32;
      const end = offset + 32;
      result[i] = new PublicKey(new Uint8Array(data.slice(offset, end)));
    }
    return result;
  }

  static parseUserInfo(data: Uint8Array): UserInfo {
    // page_id and num_assets
    const widths = [2, 1];
    const [offsets, ends] = AccountParser.getOffsets(widths);
    const page_id = new DataView(
      data.buffer.slice(offsets[0], ends[0])
    ).getUint16(0, true);
    const num_assets = data[offsets[1]];
    const user_asset_info: UserAssetInfo[] = [];

    // UserAssetInfo
    const uai_base = ends[1];
    const uai_size = 1 + 1 + 16 + 8 + 8 + 8 + 8 + 16 + 8 + 8 + 8 + 8;
    for (let i = 0; i < num_assets; i++) {
      const uai_offset = uai_base + i * uai_size;
      user_asset_info.push(AccountParser.parseUserAssetInfo(data, uai_offset));
    }

    // reward

    const reward_vesting: Decimal[] = [];
    const reward_base = uai_base + uai_size * 16;
    for (let i = 0; i < 4; i++) {
      const r_offset = reward_base + i * 8;
      reward_vesting.push(AccountParser.parseFloat64(data.buffer, r_offset));
    }
    const reward = {
      vesting: reward_vesting,
      prev_week_apt: AccountParser.parseFloat64(
        data.buffer,
        reward_base + 8 * 4
      ),
      vesting_apt: AccountParser.parseFloat64(data.buffer, reward_base + 8 * 7),
      available_apt: AccountParser.parseFloat64(
        data.buffer,
        reward_base + 8 * 8
      ),
      available_mnde: AccountParser.parseFloat64(
        data.buffer,
        reward_base + 8 * 9
      ),
    };

    // pad
    const pad_base = reward_base + 8 * 10;

    // last_vest_cutoff_time
    const last_vest_cutoff_base = pad_base + 32;
    const last_vest_cutoff_time = AccountParser.parseBigUint64(
      data.buffer,
      last_vest_cutoff_base
    );

    // last_update_time
    const last_update_base = last_vest_cutoff_base + 8;
    const last_update_time = AccountParser.parseBigUint64(
      data.buffer,
      last_update_base
    );

    // assist
    const assist_base = last_update_base + 8;
    const assist = AccountParser.parseAssist(data, assist_base);
    return {
      page_id: page_id,
      num_assets: num_assets,
      reward: reward,
      last_vest_cutoff_time: last_vest_cutoff_time,
      last_update_time: last_update_time,
      user_asset_info: user_asset_info,
      assist: assist,
    };
  }

  static parseUserAssetInfo(data: Uint8Array, offset: number): UserAssetInfo {
    const widths = [1, 1, 16, 8, 8, 8, 8, 16, 8, 8, 8, 8];
    const [offsets] = AccountParser.getOffsets(widths);
    return {
      pool_id: data[offset + offsets[0]],
      use_as_collateral: data[offset + offsets[1]],

      deposit_amount: AccountParser.parseBigInt128(
        data.buffer,
        offset + offsets[2]
      ).div(new Decimal(AMOUNT_MULTIPLIER)),
      deposit_interests: AccountParser.parseBigUint64(
        data.buffer,
        offset + offsets[3]
      ),
      deposit_index: AccountParser.parseFloat64(
        data.buffer,
        offset + offsets[4]
      ),
      reward_deposit_amount: AccountParser.parseFloat64(
        data.buffer,
        offset + offsets[5]
      ),
      reward_deposit_index: AccountParser.parseFloat64(
        data.buffer,
        offset + offsets[6]
      ),

      borrow_amount: AccountParser.parseBigInt128(
        data.buffer,
        offset + offsets[7]
      ).div(new Decimal(AMOUNT_MULTIPLIER)),
      borrow_interests: AccountParser.parseBigUint64(
        data.buffer,
        offset + offsets[8]
      ),
      borrow_index: AccountParser.parseFloat64(
        data.buffer,
        offset + offsets[9]
      ),
      reward_borrow_amount: AccountParser.parseFloat64(
        data.buffer,
        offset + offsets[10]
      ),
      reward_borrow_index: AccountParser.parseFloat64(
        data.buffer,
        offset + offsets[11]
      ),
    };
  }

  static parseAssist(data: Uint8Array, offset: number) {
    const sizePriceTrigAction = (10 + 30) * 8;
    const widths = [1, 8, 8, 8, 8, sizePriceTrigAction, 1, 1];
    const [offsets, ends] = AccountParser.getOffsets(widths);
    return {
      assist_mode: data[offset + offsets[0]],
      self_deleverage_factor: AccountParser.parseFloat64(
        data.buffer,
        offset + offsets[1]
      ).toNumber(),
      post_deleverage_factor: AccountParser.parseFloat64(
        data.buffer,
        offset + offsets[2]
      ).toNumber(),
      sell_sequence: data.slice(offset + offsets[3], offset + ends[3]),
      buy_sequence: data.slice(offset + offsets[4], offset + ends[4]),
      // skip tprice triggered actions
      num_actions: data[offset + offsets[6]],
      num_executed: data[offset + offsets[7]],
    };
  }
}

const sysvarInstructionsKey = new PublicKey(
  "Sysvar1nstructions1111111111111111111111111"
);

export class TransactionBuilder {
  constructor(public addresses: Addresses) {}

  mintKeyStrToPoolIdArray(mintKeyStr: string): number[] {
    return [this.addresses.mintKeyStrToPoolId(mintKeyStr)];
  }

  mintKeyStrToPoolId(mintKeyStr: string): number {
    return this.addresses.mintKeyStrToPoolId(mintKeyStr);
  }

  async refreshUser(userWalletKey: PublicKey): Promise<Transaction> {
    const userInfoKey = await this.addresses.getUserInfoKey(userWalletKey);
    const poolSummariesKey = await this.addresses.getPoolSummariesKey();
    const inst = new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: [
        { pubkey: userWalletKey, isSigner: false, isWritable: false }, // wallet
        { pubkey: userInfoKey, isSigner: false, isWritable: true }, // UserInfo
        { pubkey: poolSummariesKey, isSigner: false, isWritable: false }, // PoolSummaries
      ],
      data: Buffer.from([CMD_REFRESH_USER]),
    });
    return new Transaction().add(inst);
  }

  async updateUserConfig(
    walletAccount: Keypair,
    assistMode: number,
    selfDeleverageFactor: number,
    postDeleverageFactor: number
  ): Promise<Transaction> {
    const walletKey = walletAccount.publicKey;
    const userInfoKey = await this.addresses.getUserInfoKey(walletKey);

    const buffer = new ArrayBuffer(16);
    AccountParser.setFloat64(buffer, 0, selfDeleverageFactor);
    AccountParser.setFloat64(buffer, 8, postDeleverageFactor);
    const payload = Array.from(new Uint8Array(buffer));
    const data = [CMD_UPDATE_USER_CONFIG, assistMode].concat(payload);

    const inst = new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: [
        { pubkey: walletKey, isSigner: true, isWritable: false }, // wallet
        { pubkey: userInfoKey, isSigner: false, isWritable: true }, // userInfo
      ],
      data: Buffer.from(data),
    });
    return new Transaction().add(inst);
  }

  async addUserAndDeposit(
    pageId: number,
    walletAccount: Keypair,
    userSplKey: PublicKey,
    mintKeyStr: string,
    amount: number
  ): Promise<Transaction> {
    const [basePda] = await this.addresses.getBasePda();
    const walletKey = walletAccount.publicKey;
    const userPagesStatsKey = await this.addresses.getUserPagesStatsKey();
    const usersPageKey = await this.addresses.getUsersPageKey(basePda, pageId);
    const userInfoKey = await this.addresses.getUserInfoKey(walletKey);
    const assetPoolKey = await this.addresses.getAssetPoolKey(
      basePda,
      mintKeyStr
    );
    const assetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      basePda,
      mintKeyStr
    );
    const poolSummariesKey = await this.addresses.getPoolSummariesKey();
    const priceSummariesKey = await this.addresses.getPriceSummariesKey(
      basePda
    );
    const buffer = new ArrayBuffer(10);
    const view = new DataView(buffer);
    view.setUint16(0, pageId, true);
    AccountParser.setBigUint64(buffer, 2, amount);
    const payload = Array.from(new Uint8Array(buffer));
    const poolIdArray = this.mintKeyStrToPoolIdArray(mintKeyStr);

    const inst = new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: [
        { pubkey: walletKey, isSigner: true, isWritable: true }, // user wallet
        { pubkey: userSplKey, isSigner: false, isWritable: true }, // account for PoolList
        { pubkey: userPagesStatsKey, isSigner: false, isWritable: true }, // UserPagesStats
        { pubkey: usersPageKey, isSigner: false, isWritable: true }, // UsersPage
        { pubkey: userInfoKey, isSigner: false, isWritable: true }, // UserInfo
        { pubkey: assetPoolKey, isSigner: false, isWritable: true }, // AssetPool
        { pubkey: assetPoolSplKey, isSigner: false, isWritable: true }, // AssetPool's spl account
        { pubkey: poolSummariesKey, isSigner: false, isWritable: true }, // PoolSummaries
        { pubkey: priceSummariesKey, isSigner: false, isWritable: false }, // PriceSummaries
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program account
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // spl-token program account
      ],
      data: Buffer.from(
        [CMD_ADD_USER_AND_DEPOSIT].concat(payload).concat(poolIdArray)
      ),
    });
    // signer: walletAccount
    return new Transaction().add(inst);
  }

  async deposit(
    walletAccount: Keypair,
    userSplKey: PublicKey,
    mintKeyStr: string,
    amount: number
  ): Promise<Transaction> {
    const [basePda] = await this.addresses.getBasePda();
    const userWalletKey = walletAccount.publicKey;
    const userInfoKey = await this.addresses.getUserInfoKey(userWalletKey);
    const assetPoolKey = await this.addresses.getAssetPoolKey(
      basePda,
      mintKeyStr
    );
    const assetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      basePda,
      mintKeyStr
    );
    const poolSummariesKey = await this.addresses.getPoolSummariesKey();
    const priceSummariesKey = await this.addresses.getPriceSummariesKey(
      basePda
    );
    const buffer = new ArrayBuffer(8);
    AccountParser.setBigUint64(buffer, 0, amount);
    const payload = Array.from(new Uint8Array(buffer));
    const poolIdArray = this.mintKeyStrToPoolIdArray(mintKeyStr);

    const inst = new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: [
        { pubkey: userWalletKey, isSigner: true, isWritable: true }, // user wallet
        { pubkey: userSplKey, isSigner: false, isWritable: true }, // account for PoolList
        { pubkey: userInfoKey, isSigner: false, isWritable: true }, // UserInfo
        { pubkey: assetPoolKey, isSigner: false, isWritable: true }, // AssetPool
        { pubkey: assetPoolSplKey, isSigner: false, isWritable: true }, // AssetPool's spl account
        { pubkey: poolSummariesKey, isSigner: false, isWritable: true }, // PoolSummaries
        { pubkey: priceSummariesKey, isSigner: false, isWritable: false }, // PriceSummaries
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // spl-token program account
      ],
      data: Buffer.from([CMD_DEPOSIT].concat(payload).concat(poolIdArray)),
    });
    // signer: walletAccount
    return new Transaction().add(inst);
  }

  async withdrawAndRemoveUser(
    walletAccount: Keypair,
    userSplKey: PublicKey,
    mintKeyStr: string,
    withdrawAll: boolean,
    amount: number,
    userInfo: UserInfo
  ): Promise<Transaction | null> {
    const pageId = userInfo.page_id;
    if (pageId > 10000) {
      console.log("User not added to backend yet.");
      return null;
    }
    const [basePda] = await this.addresses.getBasePda();
    const userWalletKey = walletAccount.publicKey;
    const userPagesStatsKey = await this.addresses.getUserPagesStatsKey();
    const usersPageKey = await this.addresses.getUsersPageKey(basePda, pageId);
    const userInfoKey = await this.addresses.getUserInfoKey(userWalletKey);
    const assetPoolKey = await this.addresses.getAssetPoolKey(
      basePda,
      mintKeyStr
    );
    const assetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      basePda,
      mintKeyStr
    );
    const poolSummariesKey = await this.addresses.getPoolSummariesKey();
    const priceSummariesKey = await this.addresses.getPriceSummariesKey(
      basePda
    );
    const keys = [
      { pubkey: userWalletKey, isSigner: true, isWritable: true }, // user wallet
      { pubkey: userSplKey, isSigner: false, isWritable: true }, // account for PoolList
      { pubkey: userPagesStatsKey, isSigner: false, isWritable: true }, // UserPagesStats
      { pubkey: usersPageKey, isSigner: false, isWritable: true }, // UsersPage
      { pubkey: userInfoKey, isSigner: false, isWritable: true }, // UserInfo
      { pubkey: assetPoolKey, isSigner: false, isWritable: true }, // AssetPool
      { pubkey: assetPoolSplKey, isSigner: false, isWritable: true }, // AssetPool's spl account
      { pubkey: poolSummariesKey, isSigner: false, isWritable: true }, // PoolSummaries
      { pubkey: priceSummariesKey, isSigner: false, isWritable: false }, // PriceSummaries
      { pubkey: basePda, isSigner: false, isWritable: false }, // basePda
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // spl-token program account
    ];
    const buffer = new ArrayBuffer(9);
    AccountParser.setUint8(buffer, 0, withdrawAll ? 1 : 0);
    AccountParser.setBigUint64(buffer, 1, amount);
    const payload = Array.from(new Uint8Array(buffer));
    const poolIdArray = this.mintKeyStrToPoolIdArray(mintKeyStr);
    const data = [CMD_WITHDRAW_AND_REMOVE_USER]
      .concat(payload)
      .concat(poolIdArray);

    const inst = new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from(data),
    });
    // signer: walletAccount
    return new Transaction().add(inst);
  }

  async withdraw(
    walletAccount: Keypair,
    userSplKey: PublicKey,
    mintKeyStr: string,
    withdraw_all: boolean,
    amount: number
  ): Promise<Transaction> {
    const [basePda] = await this.addresses.getBasePda();
    const userWalletKey = walletAccount.publicKey;
    const userInfoKey = await this.addresses.getUserInfoKey(userWalletKey);
    const assetPoolKey = await this.addresses.getAssetPoolKey(
      basePda,
      mintKeyStr
    );
    const assetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      basePda,
      mintKeyStr
    );
    const poolSummariesKey = await this.addresses.getPoolSummariesKey();
    const priceSummariesKey = await this.addresses.getPriceSummariesKey(
      basePda
    );
    const keys = [
      { pubkey: userWalletKey, isSigner: true, isWritable: true }, // user wallet
      { pubkey: userSplKey, isSigner: false, isWritable: true }, // account for PoolList
      { pubkey: userInfoKey, isSigner: false, isWritable: true }, // UserInfo
      { pubkey: assetPoolKey, isSigner: false, isWritable: true }, // AssetPool
      { pubkey: assetPoolSplKey, isSigner: false, isWritable: true }, // AssetPool's spl account
      { pubkey: poolSummariesKey, isSigner: false, isWritable: true }, // PoolSummaries
      { pubkey: priceSummariesKey, isSigner: false, isWritable: false }, // PriceSummaries
      { pubkey: basePda, isSigner: false, isWritable: false }, // basePda
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // spl-token program account
    ];
    const buffer = new ArrayBuffer(9);
    AccountParser.setUint8(buffer, 0, withdraw_all ? 1 : 0);
    AccountParser.setBigUint64(buffer, 1, amount);
    const payload = Array.from(new Uint8Array(buffer));
    const poolIdArray = this.mintKeyStrToPoolIdArray(mintKeyStr);
    const data = [CMD_WITHDRAW].concat(payload).concat(poolIdArray);

    const inst = new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from(data),
    });
    // signer: walletAccount
    return new Transaction().add(inst);
  }

  async borrow(
    walletAccount: Keypair,
    userSplKey: PublicKey,
    mintKeyStr: string,
    amount: number
  ): Promise<Transaction> {
    const [basePda] = await this.addresses.getBasePda();
    const userWalletKey = walletAccount.publicKey;
    const userInfoKey = await this.addresses.getUserInfoKey(userWalletKey);
    const assetPoolKey = await this.addresses.getAssetPoolKey(
      basePda,
      mintKeyStr
    );
    const assetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      basePda,
      mintKeyStr
    );
    const poolSummariesKey = await this.addresses.getPoolSummariesKey();
    const priceSummariesKey = await this.addresses.getPriceSummariesKey(
      basePda
    );
    const keys = [
      { pubkey: userWalletKey, isSigner: true, isWritable: true }, // user wallet
      { pubkey: userSplKey, isSigner: false, isWritable: true }, // account for PoolList
      { pubkey: userInfoKey, isSigner: false, isWritable: true }, // UserInfo
      { pubkey: assetPoolKey, isSigner: false, isWritable: true }, // AssetPool
      { pubkey: assetPoolSplKey, isSigner: false, isWritable: true }, // AssetPool's spl account
      { pubkey: poolSummariesKey, isSigner: false, isWritable: true }, // PoolSummaries
      { pubkey: priceSummariesKey, isSigner: false, isWritable: false }, // PriceSummaries
      { pubkey: basePda, isSigner: false, isWritable: false }, // basePda
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // spl-token program account
    ];

    const buffer = new ArrayBuffer(8);
    AccountParser.setBigUint64(buffer, 0, amount);
    const payload = Array.from(new Uint8Array(buffer));
    const poolIdArray = this.mintKeyStrToPoolIdArray(mintKeyStr);
    const data = [CMD_BORROW].concat(payload).concat(poolIdArray);

    const inst = new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from(data),
    });
    // signer: walletAccount
    return new Transaction().add(inst);
  }

  async repay(
    walletAccount: Keypair,
    userSplKey: PublicKey,
    mintKeyStr: string,
    repay_all: boolean,
    amount: number
  ): Promise<Transaction> {
    const [basePda] = await this.addresses.getBasePda();
    const userWalletKey = walletAccount.publicKey;
    const userInfoKey = await this.addresses.getUserInfoKey(userWalletKey);
    const assetPoolKey = await this.addresses.getAssetPoolKey(
      basePda,
      mintKeyStr
    );
    const assetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      basePda,
      mintKeyStr
    );
    const poolSummariesKey = await this.addresses.getPoolSummariesKey();
    const keys = [
      { pubkey: userWalletKey, isSigner: true, isWritable: true }, // user wallet
      { pubkey: userSplKey, isSigner: false, isWritable: true }, // account for PoolList
      { pubkey: userInfoKey, isSigner: false, isWritable: true }, // UserInfo
      { pubkey: assetPoolKey, isSigner: false, isWritable: true }, // AssetPool
      { pubkey: assetPoolSplKey, isSigner: false, isWritable: true }, // AssetPool's spl account
      { pubkey: poolSummariesKey, isSigner: false, isWritable: true }, // PoolSummaries
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // spl-token program account
    ];
    const buffer = new ArrayBuffer(9);
    AccountParser.setUint8(buffer, 0, repay_all ? 1 : 0);
    AccountParser.setBigUint64(buffer, 1, amount);
    const payload = Array.from(new Uint8Array(buffer));
    const poolIdArray = this.mintKeyStrToPoolIdArray(mintKeyStr);
    const inst = new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from([CMD_REPAY].concat(payload).concat(poolIdArray)),
    });
    // signer: walletAccount
    return new Transaction().add(inst);
  }

  async externalLiquidate(
    liquidatorWalletAccount: Keypair,
    liquidatedWalletKey: PublicKey,
    liquidatorCollateralSpl: PublicKey,
    liquidatorBorrowedSpl: PublicKey,
    collateralMintStr: string,
    borrowedMintStr: string,
    minCollateralAmount: number,
    repaidBorrowAmount: number
  ): Promise<Transaction> {
    const [basePda] = await this.addresses.getBasePda();
    const liquidatorWalletKey = liquidatorWalletAccount.publicKey;
    const userInfoKey = await this.addresses.getUserInfoKey(
      liquidatedWalletKey
    );

    const collateralPoolKey = await this.addresses.getAssetPoolKey(
      basePda,
      collateralMintStr
    );
    const collateralPoolSpl = await this.addresses.getAssetPoolSplKey(
      basePda,
      collateralMintStr
    );

    const borrowedPoolKey = await this.addresses.getAssetPoolKey(
      basePda,
      borrowedMintStr
    );
    const borrowedPoolSpl = await this.addresses.getAssetPoolSplKey(
      basePda,
      borrowedMintStr
    );

    const poolSummariesKey = await this.addresses.getPoolSummariesKey();
    const priceSummariesKey = await this.addresses.getPriceSummariesKey(
      basePda
    );

    const keys = [
      { pubkey: liquidatedWalletKey, isSigner: false, isWritable: false },
      { pubkey: liquidatorWalletKey, isSigner: true, isWritable: false },
      { pubkey: userInfoKey, isSigner: false, isWritable: true },
      { pubkey: basePda, isSigner: false, isWritable: false },

      { pubkey: liquidatorCollateralSpl, isSigner: false, isWritable: true },
      { pubkey: liquidatorBorrowedSpl, isSigner: false, isWritable: true },

      { pubkey: collateralPoolKey, isSigner: false, isWritable: true },
      { pubkey: collateralPoolSpl, isSigner: false, isWritable: true },

      { pubkey: borrowedPoolKey, isSigner: false, isWritable: true },
      { pubkey: borrowedPoolSpl, isSigner: false, isWritable: true },

      { pubkey: poolSummariesKey, isSigner: false, isWritable: true }, // PoolSummaries
      { pubkey: priceSummariesKey, isSigner: false, isWritable: false }, // PriceSummaries

      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // spl-token program account
    ];

    const buffer = new ArrayBuffer(8 + 8);
    AccountParser.setBigUint64(buffer, 0, minCollateralAmount);
    AccountParser.setBigUint64(buffer, 8, repaidBorrowAmount);
    const payload = Array.from(new Uint8Array(buffer));
    const collateralPoolIdArray =
      this.mintKeyStrToPoolIdArray(collateralMintStr);
    const borrowedPoolIdArray = this.mintKeyStrToPoolIdArray(borrowedMintStr);
    const data = [CMD_EXTERN_LIQUIDATE]
      .concat(payload)
      .concat(collateralPoolIdArray)
      .concat(borrowedPoolIdArray);

    const inst = new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from(data),
    });
    // signer: liquidator_wallet_account
    return new Transaction().add(inst);
  }

  async buildLpOpCheckIx(
    userWalletKey: PublicKey,

    leftMintStr: string,
    leftAmount: number,

    rightMintStr: string,
    rightAmount: number,

    lpMintStr: string,
    minLpAmount: number,

    targetSwap: number,
    isCreate: boolean,
    isSigned: boolean
  ): Promise<TransactionInstruction> {
    const [base_pda] = await this.addresses.getBasePda();
    const userInfoKey = await this.addresses.getUserInfoKey(userWalletKey);
    const leftAssetPoolKey = await this.addresses.getAssetPoolKey(
      base_pda,
      leftMintStr
    );
    const leftAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      leftMintStr
    );
    const rightAssetPoolKey = await this.addresses.getAssetPoolKey(
      base_pda,
      rightMintStr
    );
    const rightAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      rightMintStr
    );
    const lpAssetPoolKey = await this.addresses.getAssetPoolKey(
      base_pda,
      lpMintStr
    );
    const poolSummariesKey = await this.addresses.getPoolSummariesKey();
    const priceSummariesKey = await this.addresses.getPriceSummariesKey(
      base_pda
    );

    const keys = [
      { pubkey: userWalletKey, isSigner: isSigned, isWritable: false },
      { pubkey: userInfoKey, isSigner: false, isWritable: true },
      { pubkey: leftAssetPoolKey, isSigner: false, isWritable: true },
      { pubkey: leftAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: rightAssetPoolKey, isSigner: false, isWritable: true },
      { pubkey: rightAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: lpAssetPoolKey, isSigner: false, isWritable: true },
      { pubkey: poolSummariesKey, isSigner: false, isWritable: true },
      { pubkey: priceSummariesKey, isSigner: false, isWritable: false },
      { pubkey: sysvarInstructionsKey, isSigner: false, isWritable: false },
    ];

    const buffer = new ArrayBuffer(29);
    AccountParser.setBigUint64(buffer, 0, leftAmount);
    AccountParser.setBigUint64(buffer, 8, rightAmount);
    AccountParser.setBigUint64(buffer, 16, minLpAmount);
    const leftPoolId = this.mintKeyStrToPoolId(leftMintStr);
    AccountParser.setUint8(buffer, 24, leftPoolId);
    const rightPoolId = this.mintKeyStrToPoolId(rightMintStr);
    AccountParser.setUint8(buffer, 25, rightPoolId);
    const lpPoolId = this.mintKeyStrToPoolId(lpMintStr);
    AccountParser.setUint8(buffer, 26, lpPoolId);
    AccountParser.setUint8(buffer, 27, targetSwap);
    AccountParser.setUint8(buffer, 28, isCreate ? 1 : 0);
    const payload = Array.from(new Uint8Array(buffer));

    const data = [CMD_LP_OP_CHECK].concat(payload);

    return new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from(data),
    });
  }

  async buildLpOpEndcheckIx(
    _userWalletKey: PublicKey
  ): Promise<TransactionInstruction> {
    const poolSummariesKey = await this.addresses.getPoolSummariesKey();

    const keys = [
      { pubkey: poolSummariesKey, isSigner: false, isWritable: true }, // PoolSummaries
    ];

    return new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from([CMD_LP_OP_ENDCHECK]),
    });
  }

  async marginLpCreate(
    walletAccount: Keypair,
    leftMintStr: string,
    leftAmount: number,
    rightMintStr: string,
    rightAmount: number,
    lpMintStr: string,
    min_lpAmount: number,
    targetSwap: number,
    swap_account_keys: AccountMeta[],
    stakeKeys: AccountMeta[]
  ): Promise<Transaction> {
    const [base_pda] = await this.addresses.getBasePda();
    const user_wallet_key = walletAccount.publicKey;
    const userInfoKey = await this.addresses.getUserInfoKey(user_wallet_key);
    const leftAssetPoolKey = await this.addresses.getAssetPoolKey(
      base_pda,
      leftMintStr
    );
    const leftAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      leftMintStr
    );
    const rightAssetPoolKey = await this.addresses.getAssetPoolKey(
      base_pda,
      rightMintStr
    );
    const rightAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      rightMintStr
    );
    const lpAssetPoolKey = await this.addresses.getAssetPoolKey(
      base_pda,
      lpMintStr
    );
    const lpAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      lpMintStr
    );
    const poolSummariesKey = await this.addresses.getPoolSummariesKey();
    const priceSummariesKey = await this.addresses.getPriceSummariesKey(
      base_pda
    );

    const keys = [
      { pubkey: user_wallet_key, isSigner: true, isWritable: false },
      { pubkey: userInfoKey, isSigner: false, isWritable: true },
      { pubkey: base_pda, isSigner: false, isWritable: false },
      { pubkey: leftAssetPoolKey, isSigner: false, isWritable: true },
      { pubkey: leftAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: rightAssetPoolKey, isSigner: false, isWritable: true },
      { pubkey: rightAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: lpAssetPoolKey, isSigner: false, isWritable: true },
      { pubkey: lpAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: poolSummariesKey, isSigner: false, isWritable: true },
      { pubkey: priceSummariesKey, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ].concat(swap_account_keys);

    const lpPoolId = this.mintKeyStrToPoolId(lpMintStr);

    // if this one involves stakeTable, add stakeTableKey
    const poolConfig = this.addresses.config.getPoolConfigByPoolId(lpPoolId);
    invariant(poolConfig);
    if (poolConfig.lpNeedSndStake) {
      const stakeTableKey = await this.addresses.getAssetPoolStakeTableKey(
        poolConfig.mint.toString()
      );
      keys.push({ pubkey: stakeTableKey, isSigner: false, isWritable: true });
    }

    const buffer = new ArrayBuffer(28);
    AccountParser.setBigUint64(buffer, 0, leftAmount);
    AccountParser.setBigUint64(buffer, 8, rightAmount);
    AccountParser.setBigUint64(buffer, 16, min_lpAmount);
    const leftPoolId = this.mintKeyStrToPoolId(leftMintStr);
    AccountParser.setUint8(buffer, 24, leftPoolId);
    const rightPoolId = this.mintKeyStrToPoolId(rightMintStr);
    AccountParser.setUint8(buffer, 25, rightPoolId);
    AccountParser.setUint8(buffer, 26, lpPoolId);
    AccountParser.setUint8(buffer, 27, targetSwap);
    const payload = Array.from(new Uint8Array(buffer));

    const data = [CMD_LP_CREATE].concat(payload);

    const inst = new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from(data),
    });

    const tx = new Transaction()
      .add(
        await this.buildLpOpCheckIx(
          walletAccount.publicKey,
          leftMintStr,
          leftAmount,
          rightMintStr,
          rightAmount,
          lpMintStr,
          min_lpAmount,
          targetSwap,
          true,
          true
        )
      )
      .add(inst);

    if (stakeKeys.length > 0) {
      const stake_ix = await this.buildLpStakeIx(
        lpMintStr,
        targetSwap,
        stakeKeys
      );
      tx.add(stake_ix);
    }

    return tx.add(await this.buildLpOpEndcheckIx(walletAccount.publicKey));
  }

  buildMarginLpRedeemParam(
    leftMintStr: string,
    minLeftAmount: number,
    rightMintStr: string,
    min_rightAmount: number,
    lpMintStr: string,
    lpAmount: number,
    targetSwap: number
  ): number[] {
    const buffer = new ArrayBuffer(28);
    AccountParser.setBigUint64(buffer, 0, minLeftAmount);
    AccountParser.setBigUint64(buffer, 8, min_rightAmount);
    AccountParser.setBigUint64(buffer, 16, lpAmount);
    const leftPoolId = this.mintKeyStrToPoolId(leftMintStr);
    AccountParser.setUint8(buffer, 24, leftPoolId);
    const rightPoolId = this.mintKeyStrToPoolId(rightMintStr);
    AccountParser.setUint8(buffer, 25, rightPoolId);
    const lpPoolId = this.mintKeyStrToPoolId(lpMintStr);
    AccountParser.setUint8(buffer, 26, lpPoolId);
    AccountParser.setUint8(buffer, 27, targetSwap);
    const payload = Array.from(new Uint8Array(buffer));

    return [CMD_LP_REDEEM].concat(payload);
  }

  async marginLpRedeem(
    walletKey: PublicKey,
    leftMintStr: string,
    minLeftAmount: number,
    rightMintStr: string,
    min_rightAmount: number,
    lpMintStr: string,
    lpAmount: number,
    targetSwap: number,
    swap_account_keys: AccountMeta[],
    unstakeKeys: AccountMeta[],
    is_signed = true
  ): Promise<Transaction> {
    const [base_pda] = await this.addresses.getBasePda();
    const userInfoKey = await this.addresses.getUserInfoKey(walletKey);
    const leftAssetPoolKey = await this.addresses.getAssetPoolKey(
      base_pda,
      leftMintStr
    );
    const leftAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      leftMintStr
    );
    const rightAssetPoolKey = await this.addresses.getAssetPoolKey(
      base_pda,
      rightMintStr
    );
    const rightAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      rightMintStr
    );
    const lpAssetPoolKey = await this.addresses.getAssetPoolKey(
      base_pda,
      lpMintStr
    );
    const lpAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      lpMintStr
    );
    const poolSummariesKey = await this.addresses.getPoolSummariesKey();
    const priceSummariesKey = await this.addresses.getPriceSummariesKey(
      base_pda
    );

    const keys = [
      { pubkey: walletKey, isSigner: is_signed, isWritable: true },
      { pubkey: userInfoKey, isSigner: false, isWritable: true },
      { pubkey: base_pda, isSigner: false, isWritable: false },
      { pubkey: leftAssetPoolKey, isSigner: false, isWritable: true },
      { pubkey: leftAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: rightAssetPoolKey, isSigner: false, isWritable: true },
      { pubkey: rightAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: lpAssetPoolKey, isSigner: false, isWritable: true },
      { pubkey: lpAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: poolSummariesKey, isSigner: false, isWritable: true },
      { pubkey: priceSummariesKey, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ].concat(swap_account_keys);

    const poolId = this.mintKeyStrToPoolId(lpMintStr);

    const poolConfig = this.addresses.config.getPoolConfigByPoolId(poolId);
    if (poolConfig.lpNeedSndStake) {
      const stakeTableKey = await this.addresses.getAssetPoolStakeTableKey(
        poolConfig.mint.toString()
      );
      keys.push({ pubkey: stakeTableKey, isSigner: false, isWritable: true });
    }

    const data = this.buildMarginLpRedeemParam(
      leftMintStr,
      minLeftAmount,
      rightMintStr,
      min_rightAmount,
      lpMintStr,
      lpAmount,
      targetSwap
    );

    const inst = new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from(data),
    });

    const tx = new Transaction().add(
      await this.buildLpOpCheckIx(
        walletKey,
        leftMintStr,
        minLeftAmount,
        rightMintStr,
        min_rightAmount,
        lpMintStr,
        lpAmount,
        targetSwap,
        false,
        is_signed
      )
    );

    if (unstakeKeys.length > 0) {
      const unstake_ix = await this.buildLpUnstakeIx(
        lpMintStr,
        targetSwap,
        lpAmount,
        unstakeKeys
      );
      tx.add(unstake_ix);
    }

    tx.add(inst);

    return tx.add(await this.buildLpOpEndcheckIx(walletKey));
  }

  async buildLpStakeIx(
    lpMintStr: string,
    targetSwap: number,
    stakeKeys: AccountMeta[]
  ): Promise<TransactionInstruction> {
    const [base_pda] = await this.addresses.getBasePda();
    const poolSummariesKey = await this.addresses.getPoolSummariesKey();
    const lpAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      lpMintStr
    );

    const keys = [
      { pubkey: poolSummariesKey, isSigner: false, isWritable: false },
      { pubkey: lpAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: base_pda, isSigner: false, isWritable: false },
    ].concat(stakeKeys);

    const buffer = new ArrayBuffer(8);
    AccountParser.setBigUint64(buffer, 0, 0);
    const payload = Array.from(new Uint8Array(buffer));

    const data = [CMD_LP_STAKE]
      .concat(payload)
      .concat([targetSwap])
      .concat(this.mintKeyStrToPoolIdArray(lpMintStr));

    return new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from(data),
    });
  }

  async buildLpStake2ndStepIxForOrca(
    lpMintStr: string,
    stakeTableKey: PublicKey,
    floatingLpSplKey: PublicKey,
    firstStakeKeys: AccountMeta[],
    secondStakeKeys: AccountMeta[]
  ) {
    const [base_pda] = await this.addresses.getBasePda();
    // const userInfoKey = await this.addresses.getUserInfoKey(userWalletKey);
    const adminPubkey = this.addresses.config.refresherKey;
    const lpAssetPoolKey = await this.addresses.getAssetPoolKey(
      base_pda,
      lpMintStr
    );
    const lpAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      lpMintStr
    );

    const keys = [
      { pubkey: adminPubkey, isSigner: true, isWritable: false },
      { pubkey: lpAssetPoolKey, isSigner: false, isWritable: true },
      { pubkey: lpAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: stakeTableKey, isSigner: false, isWritable: true },
      { pubkey: floatingLpSplKey, isSigner: false, isWritable: true },
      { pubkey: base_pda, isSigner: false, isWritable: false },
    ]
      .concat(firstStakeKeys)
      .concat(secondStakeKeys);

    const data = [CMD_LP_STAKE_SECOND];
    return new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from(data),
    });
  }

  async buildLpStake2ndStepIxForRaydium(
    lpMintStr: string,
    stakeTableKey: PublicKey,
    stakeKeys: AccountMeta[]
  ) {
    const [base_pda] = await this.addresses.getBasePda();
    const lpAssetPoolKey = await this.addresses.getAssetPoolKey(
      base_pda,
      lpMintStr
    );
    const lpAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      lpMintStr
    );

    const keys = [
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false }, // placeholder
      { pubkey: lpAssetPoolKey, isSigner: false, isWritable: true },
      { pubkey: lpAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: stakeTableKey, isSigner: false, isWritable: true },
      { pubkey: base_pda, isSigner: false, isWritable: false },
    ].concat(stakeKeys);

    const data = [CMD_LP_STAKE_SECOND];
    return new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from(data),
    });
  }

  async buildLpUnstake2ndStepIxForOrca(
    unstakeIdentity: PublicKey,
    userWalletKey: PublicKey,
    lpMintStr: string,
    stakeTableKey: PublicKey,
    floatingLpSplKey: PublicKey,
    firstStakeKeys: AccountMeta[],
    secondStakeKeys: AccountMeta[],
    amount: number
  ) {
    const [base_pda] = await this.addresses.getBasePda();
    const userInfoKey = await this.addresses.getUserInfoKey(userWalletKey);
    const lpAssetPoolKey = await this.addresses.getAssetPoolKey(
      base_pda,
      lpMintStr
    );
    const lpAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      lpMintStr
    );

    const keys = [
      { pubkey: unstakeIdentity, isSigner: true, isWritable: false },
      { pubkey: userWalletKey, isSigner: false, isWritable: false },
      { pubkey: userInfoKey, isSigner: false, isWritable: false },
      { pubkey: lpAssetPoolKey, isSigner: false, isWritable: true },
      { pubkey: lpAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: stakeTableKey, isSigner: false, isWritable: true },
      { pubkey: floatingLpSplKey, isSigner: false, isWritable: true },
      { pubkey: base_pda, isSigner: false, isWritable: false },
    ]
      .concat(secondStakeKeys)
      .concat(firstStakeKeys);

    const buffer = new ArrayBuffer(8);
    AccountParser.setBigUint64(buffer, 0, amount);
    const payload = Array.from(new Uint8Array(buffer));

    const data = [CMD_LP_UNSTAKE_SECOND].concat(payload);

    return new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from(data),
    });
  }

  async buildLpUnstake2ndStepIxForRaydium(
    unstakeIdentity: PublicKey,
    userWalletKey: PublicKey,
    lpMintStr: string,
    stakeTableKey: PublicKey,
    stakeKeys: AccountMeta[],
    amount: number
  ) {
    const [base_pda] = await this.addresses.getBasePda();
    const userInfoKey = await this.addresses.getUserInfoKey(userWalletKey);
    const lpAssetPoolKey = await this.addresses.getAssetPoolKey(
      base_pda,
      lpMintStr
    );
    const lpAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      lpMintStr
    );

    const keys = [
      { pubkey: unstakeIdentity, isSigner: true, isWritable: false },
      { pubkey: userWalletKey, isSigner: false, isWritable: false },
      { pubkey: userInfoKey, isSigner: false, isWritable: false },
      { pubkey: lpAssetPoolKey, isSigner: false, isWritable: true },
      { pubkey: lpAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: stakeTableKey, isSigner: false, isWritable: true },
      { pubkey: base_pda, isSigner: false, isWritable: false },
    ].concat(stakeKeys);

    const buffer = new ArrayBuffer(8);
    AccountParser.setBigUint64(buffer, 0, amount);
    const payload = Array.from(new Uint8Array(buffer));

    const data = [CMD_LP_UNSTAKE_SECOND].concat(payload);

    return new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from(data),
    });
  }

  async buildLpUnstakeIx(
    lpMintStr: string,
    targetSwap: number,
    amount: number,
    stakeKeys: AccountMeta[]
  ): Promise<TransactionInstruction> {
    const [base_pda] = await this.addresses.getBasePda();
    const poolSummariesKey = await this.addresses.getPoolSummariesKey();
    const lpAssetPoolSplKey = await this.addresses.getAssetPoolSplKey(
      base_pda,
      lpMintStr
    );

    const keys = [
      { pubkey: poolSummariesKey, isSigner: false, isWritable: false },
      { pubkey: lpAssetPoolSplKey, isSigner: false, isWritable: true },
      { pubkey: base_pda, isSigner: false, isWritable: false },
    ].concat(stakeKeys);

    const buffer = new ArrayBuffer(8);
    AccountParser.setBigUint64(buffer, 0, amount);
    const payload = Array.from(new Uint8Array(buffer));

    const data = [CMD_LP_UNSTAKE]
      .concat(payload)
      .concat([targetSwap])
      .concat(this.mintKeyStrToPoolIdArray(lpMintStr));

    return new TransactionInstruction({
      programId: this.addresses.getProgramKey(),
      keys: keys,
      data: Buffer.from(data),
    });
  }

  // simplified interface for marginLpCreate and marginLpRedeem
  async simpleLpCreate(
    walletAccount: Keypair,
    lpTokenId: TokenID,
    leftAmount: number,
    rightAmount: number,
    minLpAmount: number
  ): Promise<Transaction> {
    const lr = LP_TO_LR[lpTokenId];
    invariant(lr);
    const [leftId, rightId] = lr;
    const lpMint = MINTS[lpTokenId];
    const leftMint = MINTS[leftId];
    const rightMint = MINTS[rightId];

    const poolConfig = this.addresses.config.poolConfigs[lpTokenId];
    invariant(poolConfig, "invalid lp token id for pool config");
    // if second stake is needed, all the staking ops are performed in the second-stake tx so no staking keys is needed
    let stakeKeys = poolConfig.lpNeedSndStake
      ? []
      : await this.addresses.getLpStakeKeys(lpTokenId);

    const tx = await this.marginLpCreate(
      walletAccount,
      leftMint.toString(),
      leftAmount,
      rightMint.toString(),
      rightAmount,
      lpMint.toString(),
      minLpAmount,
      this.addresses.getLpTargetSwap(lpTokenId),
      await this.addresses.getLpDepositKeys(lpTokenId),
      stakeKeys
    );
    return tx;
  }

  async lpStake2nd(lpTokenId: TokenID) {
    const tx = new Transaction();
    const lpMint = MINTS[lpTokenId];
    const stakeTableKey = await this.addresses.getAssetPoolStakeTableKey(
      lpMint.toString()
    );
    const targetSwap = this.addresses.getLpTargetSwap(lpTokenId);

    if (targetSwap === SWAP_ORCA) {
      const floatingLpSplKey = await this.addresses.getFloatingLpTokenAccount(
        lpTokenId
      );

      const ix = await this.buildLpStake2ndStepIxForOrca(
        lpMint.toString(),
        stakeTableKey,
        floatingLpSplKey,
        // orca needs to stake both LP1 and LP2
        await this.addresses.getLpFirstStakeKeys(lpTokenId),
        await this.addresses.getLpSecondStakeKeys(lpTokenId)
      );
      tx.add(ix);
    } else if (targetSwap === SWAP_RAYDIUM) {
      const ix = await this.buildLpStake2ndStepIxForRaydium(
        lpMint.toString(),
        stakeTableKey,
        await this.addresses.getLpStakeKeys(lpTokenId)
      );
      tx.add(ix);
    } else {
      throw new Error(`invalid target swap for lp stake 2nd`);
    }
    return tx;
  }

  async lpUnstake2nd(
    unstakeIdentity: PublicKey,
    walletKey: PublicKey,
    lpTokenId: TokenID,
    lpAmount: number
  ) {
    const tx = new Transaction();
    const lpMint = MINTS[lpTokenId];
    const stakeTableKey = await this.addresses.getAssetPoolStakeTableKey(
      lpMint.toString()
    );
    const targetSwap = this.addresses.getLpTargetSwap(lpTokenId);

    if (targetSwap === SWAP_ORCA) {
      const floatingLpSplKey = await this.addresses.getFloatingLpTokenAccount(
        lpTokenId
      );
      const ix = await this.buildLpUnstake2ndStepIxForOrca(
        unstakeIdentity,
        walletKey,
        lpMint.toString(),
        stakeTableKey,
        floatingLpSplKey,
        // orca needs to unstake both LP2 and LP3
        await this.addresses.getLpFirstStakeKeys(lpTokenId),
        await this.addresses.getLpSecondStakeKeys(lpTokenId),
        lpAmount
      );
      tx.add(ix);
    } else if (targetSwap === SWAP_RAYDIUM) {
      const ix = await this.buildLpUnstake2ndStepIxForRaydium(
        unstakeIdentity,
        walletKey,
        lpMint.toString(),
        stakeTableKey,
        await this.addresses.getLpStakeKeys(lpTokenId),
        lpAmount
      );
      tx.add(ix);
    } else {
      throw new Error(`invalid target swap for lp unstake 2nd`);
    }
    return tx;
  }

  async simpleLpRedeem(
    walletKey: PublicKey,
    lpTokenId: TokenID,
    minLeftAmount: number,
    minRightAmount: number,
    lpAmount: number,
    isSigned: boolean
  ): Promise<Transaction> {
    const lr = LP_TO_LR[lpTokenId];
    invariant(lr);
    const [leftId, rightId] = lr;
    const lpMint = MINTS[lpTokenId];
    const leftMint = MINTS[leftId];
    const rightMint = MINTS[rightId];

    const poolConfig = this.addresses.config.poolConfigs[lpTokenId];
    invariant(poolConfig, "invalid lp token id for pool config");
    // When second staking is needed, all the staking/unstaking is performed in the second-staking/unstaking transaction
    // so this redemption tx itself does not need staking keys
    let stakeKeys = poolConfig.lpNeedSndStake
      ? []
      : await this.addresses.getLpStakeKeys(lpTokenId);

    const tx = await this.marginLpRedeem(
      walletKey,
      leftMint.toString(),
      minLeftAmount,
      rightMint.toString(),
      minRightAmount,
      lpMint.toString(),
      lpAmount,
      this.addresses.getLpTargetSwap(lpTokenId),
      await this.addresses.getLpWithdrawKeys(lpTokenId),
      stakeKeys,
      isSigned
    );
    return tx;
  }
}

export class ActionWrapper {
  addresses: Addresses;
  builder: TransactionBuilder;
  config: AppConfig;
  constructor(
    public connection: Connection,
    config: AppConfig | undefined = undefined
  ) {
    this.config = config || PUBLIC_CONFIG;
    this.addresses = new Addresses(this.config);
    this.builder = new TransactionBuilder(this.addresses);
  }

  async getParsedAssetPool(mint: PublicKey) {
    const [base_pda, _] = await this.addresses.getBasePda();
    const poolAccountKey = await this.addresses.getAssetPoolKey(
      base_pda,
      mint.toString()
    );
    const response = await this.connection.getAccountInfo(
      poolAccountKey,
      "confirmed"
    );
    if (response === null) {
      return null;
    }
    const data = new Uint8Array(response.data);
    return AccountParser.parseAssetPool(data);
  }

  async getParsedAssetPrice(mint: PublicKey) {
    const [price_pda, _] = await this.addresses.getPricePda();
    const assetPriceKey = await this.addresses.getAssetPriceKey(
      price_pda,
      mint.toString()
    );
    const response = await this.connection.getAccountInfo(
      assetPriceKey,
      "confirmed"
    );
    if (response === null) {
      return null;
    }
    return AccountParser.parseAssetPrice(new Uint8Array(response.data));
  }

  async getParsedUserInfo(wallet_key: PublicKey) {
    const userInfoKey = await this.addresses.getUserInfoKey(wallet_key);
    const response = await this.connection.getAccountInfo(
      userInfoKey,
      "confirmed"
    );
    if (response === null) {
      return null;
    }
    return AccountParser.parseUserInfo(new Uint8Array(response.data));
  }

  // administrative methods:
  async getParsedUserPagesStats() {
    const statsAccountKey = await this.addresses.getUserPagesStatsKey();
    const response = await this.connection.getAccountInfo(
      statsAccountKey,
      "confirmed"
    );
    if (response === null) {
      return null;
    }
    return AccountParser.parseUserPagesStats(new Uint8Array(response.data));
  }

  async getParsedUsersPage(page_id: number) {
    const [base_pda, _] = await this.addresses.getBasePda();
    const usersPageKey = await this.addresses.getUsersPageKey(
      base_pda,
      page_id
    );
    const response = await this.connection.getAccountInfo(
      usersPageKey,
      "confirmed"
    );
    if (response === null) {
      return null;
    }
    return AccountParser.parseUsersPage(new Uint8Array(response.data));
  }

  // transaction sending

  async addUserAndDeposit(
    walletAccount: Keypair,
    userSplKey: PublicKey,
    mintKeyStr: string,
    amount: number
  ) {
    const freeSlots = await this.getParsedUserPagesStats()!;
    invariant(freeSlots);
    let maxNumFree = 0;
    let pageId = -1;
    freeSlots?.map((value, idx) => {
      if (value > maxNumFree) {
        pageId = idx;
        maxNumFree = value;
      }
    });
    invariant(pageId >= 0, `No more free user slots available.`);
    const tx = await this.builder.addUserAndDeposit(
      pageId,
      walletAccount,
      userSplKey,
      mintKeyStr,
      amount
    );
    return this.connection.sendTransaction(tx, [walletAccount]);
  }

  async deposit(
    walletAccount: Keypair,
    userSplKey: PublicKey,
    mintKeyStr: string,
    amount: number
  ) {
    const tx = await this.builder.deposit(
      walletAccount,
      userSplKey,
      mintKeyStr,
      amount
    );
    return this.connection.sendTransaction(tx, [walletAccount]);
  }

  async withdraw(
    walletAccount: Keypair,
    userSplKey: PublicKey,
    mintKeyStr: string,
    withdrawAll: boolean,
    amount: number
  ) {
    const tx = await this.builder.withdraw(
      walletAccount,
      userSplKey,
      mintKeyStr,
      withdrawAll,
      amount
    );
    return this.connection.sendTransaction(tx, [walletAccount]);
  }

  async borrow(
    walletAccount: Keypair,
    userSplKey: PublicKey,
    mintKeyStr: string,
    amount: number
  ) {
    const tx = await this.builder.borrow(
      walletAccount,
      userSplKey,
      mintKeyStr,
      amount
    );
    return this.connection.sendTransaction(tx, [walletAccount]);
  }

  async repay(
    walletAccount: Keypair,
    userSplKey: PublicKey,
    mintKeyStr: string,
    repayAll: boolean,
    amount: number
  ) {
    const tx = await this.builder.repay(
      walletAccount,
      userSplKey,
      mintKeyStr,
      repayAll,
      amount
    );
    return this.connection.sendTransaction(tx, [walletAccount]);
  }

  async lpCreate(
    walletAccount: Keypair,
    lpTokenId: TokenID,
    leftAmount: number,
    rightAmount: number,
    minLpAmount: number
  ) {
    const tx = await this.builder.simpleLpCreate(
      walletAccount,
      lpTokenId,
      leftAmount,
      rightAmount,
      minLpAmount
    );
    return this.connection.sendTransaction(tx, [walletAccount]);
  }

  async lpStake2ndStep(adminAccount: Keypair, lpTokenId: TokenID) {
    const tx = await this.builder.lpStake2nd(lpTokenId);
    return this.connection.sendTransaction(tx, [adminAccount], {
      skipPreflight: false,
    });
  }

  async lpUnstake2ndStep(
    walletAccount: Keypair,
    lpTokenId: TokenID,
    lpAmount: number
  ) {
    const tx = await this.builder.lpUnstake2nd(
      walletAccount.publicKey,
      walletAccount.publicKey,
      lpTokenId,
      lpAmount
    );
    return this.connection.sendTransaction(tx, [walletAccount]);
  }

  async lpRedeem(
    walletAccount: Keypair,
    lpTokenId: TokenID,
    minLeftAmount: number,
    minRightAmount: number,
    lpAmount: number
  ) {
    const tx = await this.builder.simpleLpRedeem(
      walletAccount.publicKey,
      lpTokenId,
      minLeftAmount,
      minRightAmount,
      lpAmount,
      true
    );
    return this.connection.sendTransaction(tx, [walletAccount]);
  }
}

export class AssetPoolLoader {
  private readonly actionWrapper: ActionWrapper;
  private readonly addresses: Addresses;

  constructor(
    private readonly connection: Connection,
    private readonly config: AppConfig,
    private fetchPrice: (token: TokenID) => Promise<number | undefined>
  ) {
    this.actionWrapper = new ActionWrapper(this.connection, this.config);
    this.addresses = new Addresses(this.config);
  }

  async getAssetPool(tokenId: TokenID): Promise<ApiAssetPool | undefined> {
    const mintKey = MINTS[tokenId];
    let assetPoolRaw = await this.actionWrapper.getParsedAssetPool(mintKey);
    if (assetPoolRaw === null) {
      return undefined;
    }

    return normalizePool(
      tokenId,
      mintKey,
      assetPoolRaw,
      this.addresses,
      this.fetchPrice
    );
  }
}

// mostly computes addresses
export class Addresses {
  config: AppConfig;
  constructor(config: AppConfig) {
    this.config = config;
  }

  getProgramKey() {
    return this.config.programPubkey;
  }

  getAdminKey() {
    return this.config.adminPubkey;
  }

  mintKeyStrToPoolId(mintKeyStr: string): number {
    return this.config.mintKeyStrToPoolId(mintKeyStr);
  }

  getBasePda() {
    return PublicKey.findProgramAddress(
      [Buffer.from("2")],
      this.config.programPubkey
    );
  }
  getPricePda() {
    return PublicKey.findProgramAddress(
      [Buffer.from("PRICE")],
      this.config.programPubkey
    );
  }
  getPoolListKey(basePda: PublicKey) {
    return PublicKey.createWithSeed(
      basePda,
      "PoolList",
      this.config.programPubkey
    );
  }
  POOL_SUMMARIES_SEED = "PoolSummaries";
  getPoolSummariesKey() {
    return PublicKey.createWithSeed(
      this.config.adminPubkey,
      this.POOL_SUMMARIES_SEED,
      this.config.programPubkey
    );
  }

  getPriceSummariesKey(basePda: PublicKey) {
    return PublicKey.createWithSeed(
      basePda,
      "PriceSummaries",
      this.config.programPubkey
    );
  }
  static USER_STATS_SEED = "UserPagesStats";
  getUserPagesStatsKey() {
    return PublicKey.createWithSeed(
      this.config.adminPubkey,
      Addresses.USER_STATS_SEED,
      this.config.programPubkey
    );
  }
  getUsersPageKey(basePda: PublicKey, page_id: number) {
    return PublicKey.createWithSeed(
      basePda,
      "UsersPage_" + page_id,
      this.config.programPubkey
    );
  }

  getAssetPoolKey(basePda: PublicKey, mintKeyStr: string) {
    const poolSeedStr = this.mintKeyStrToPoolSeedStr(mintKeyStr);
    return PublicKey.createWithSeed(
      basePda,
      poolSeedStr,
      this.config.programPubkey
    );
  }
  getAssetPriceKey(pricePda: PublicKey, mintKeyStr: string) {
    const poolSeedStr = this.mintKeyStrToPoolSeedStr(mintKeyStr);
    return PublicKey.createWithSeed(
      pricePda,
      poolSeedStr,
      this.config.programPubkey
    );
  }
  getAssetPoolSplKey(basePda: PublicKey, mintKeyStr: string) {
    const poolSeedStr = this.mintKeyStrToPoolSeedStr(mintKeyStr);
    return PublicKey.createWithSeed(basePda, poolSeedStr, TOKEN_PROGRAM_ID);
  }
  async getAssetPoolStakeTableKey(mintKeyStr: string) {
    const [basePda] = await this.getBasePda();
    const stakeSeedStr = this.mintKeyStrToStakeTableSeedStr(mintKeyStr);
    return PublicKey.createWithSeed(
      basePda,
      stakeSeedStr,
      this.config.programPubkey
    );
  }
  getUserInfoKey(walletKey: PublicKey) {
    return PublicKey.createWithSeed(
      walletKey,
      "UserInfo",
      this.config.programPubkey
    );
  }
  poolIdToSeedStr(pool_id: number) {
    const char1 = String.fromCharCode(pool_id / 16 + "a".charCodeAt(0));
    const char2 = String.fromCharCode((pool_id % 16) + "a".charCodeAt(0));
    return "POOL__" + char1 + char2;
  }
  poolIdToStakeTableSeedStr(pool_id: number) {
    const char1 = String.fromCharCode(pool_id / 16 + "a".charCodeAt(0));
    const char2 = String.fromCharCode((pool_id % 16) + "a".charCodeAt(0));
    return "STAK__" + char1 + char2;
  }

  mintKeyStrToPoolSeedStr(mintKeyStr: string) {
    const poolId = this.config.mintKeyStrToPoolId(mintKeyStr);
    return this.poolIdToSeedStr(poolId);
  }

  mintKeyStrToStakeTableSeedStr(mintKeyStr: string) {
    const poolId = this.config.mintKeyStrToPoolId(mintKeyStr);
    return this.poolIdToStakeTableSeedStr(poolId);
  }

  getLpTargetSwap(tokenId: TokenID): number {
    return LP_TO_TARGET_SWAP[tokenId]!;
  }

  async getLpDepositKeys(tokenId: TokenID): Promise<AccountMeta[]> {
    const [ownerKey, _bump] = await this.getBasePda();
    const lpSwapInfo = LP_SWAP_METAS[tokenId]!;
    invariant(lpSwapInfo);
    return await lpSwapInfo.getLpDepositKeys(ownerKey);
  }

  async getLpWithdrawKeys(tokenId: TokenID): Promise<AccountMeta[]> {
    const [ownerKey, _bump] = await this.getBasePda();
    const lpSwapInfo = LP_SWAP_METAS[tokenId]!;
    invariant(lpSwapInfo);
    return await lpSwapInfo.getLpWithdrawKeys(ownerKey);
  }

  async getLpStakeKeys(tokenId: TokenID): Promise<AccountMeta[]> {
    const [ownerKey, _bump] = await this.getBasePda();
    const lpSwapInfo = LP_SWAP_METAS[tokenId]!;
    invariant(lpSwapInfo);
    const keys = await lpSwapInfo.getLpStakeKeys(ownerKey);
    return keys;
  }

  async getLpFirstStakeKeys(tokenId: TokenID): Promise<AccountMeta[]> {
    const [ownerKey, _bump] = await this.getBasePda();
    const lpSwapInfo = LP_SWAP_METAS[tokenId]! as OrcaLpSwapInfo;
    invariant(lpSwapInfo);
    invariant(lpSwapInfo.isDoubleDipSupported);
    return await lpSwapInfo.getFirstStakeKeys(ownerKey);
  }

  async getLpSecondStakeKeys(tokenId: TokenID): Promise<AccountMeta[]> {
    const [ownerKey, _bump] = await this.getBasePda();
    const lpSwapInfo = LP_SWAP_METAS[tokenId]! as OrcaLpSwapInfo;
    invariant(lpSwapInfo);
    invariant(lpSwapInfo.isDoubleDipSupported);
    return await lpSwapInfo.getSecondStakeKeys(ownerKey);
  }

  async getFloatingLpTokenAccount(tokenId: TokenID) {
    const lpSwapInfo = LP_SWAP_METAS[tokenId] as OrcaLpSwapInfo;
    invariant(lpSwapInfo instanceof OrcaLpSwapInfo);
    const [ownerKey] = await this.getBasePda();
    const { pdaFarmTokenAccount: floatingLpSplKey } =
      await lpSwapInfo.getPdaKeys(ownerKey);
    return floatingLpSplKey;
  }
}

export async function normalizePool(
  tokenId: TokenID,
  mintKey: PublicKey,
  assetPoolRaw: AssetPool,
  addresses: Addresses,
  fetchPrice: (token: TokenID) => Promise<number | undefined>
): Promise<ApiAssetPool | undefined> {
  const [base_pda, _] = await addresses.getBasePda();
  let depositAptRewardNativeRate = currentPerPastRateToCurrentPerCurrentRate(
    assetPoolRaw.reward_per_year_per_d,
    assetPoolRaw.deposit_index
  );
  let borrowAptRewardNativeRate = currentPerPastRateToCurrentPerCurrentRate(
    assetPoolRaw.reward_per_year_per_b,
    assetPoolRaw.borrow_index
  );
  let tokenPrice = await fetchPrice(tokenId);
  let aptPrice = await fetchPrice(TokenID.APT);
  let mndePrice = hasMndeReward(tokenId)
    ? await fetchPrice(TokenID.MNDE)
    : undefined;
  let lastPriceUpdate = new Date();
  let mndeAptMultiplierNative = tokenRateToNativeRate(
    LM_MNDE_MULTIPLIER,
    TokenID.MNDE,
    TokenID.APT
  );

  return {
    tokenName: assetPoolRaw.coin_name,
    mintKey: mintKey,
    poolKey: await addresses.getAssetPoolKey(base_pda, mintKey.toString()),
    allowBorrow: flagsToBool(assetPoolRaw.flags, PoolFlag.AllowBorrow),
    isLp: flagsToBool(assetPoolRaw.flags, PoolFlag.IsLp),
    isStable: flagsToBool(assetPoolRaw.flags, PoolFlag.IsStable),
    depositAmount: nativeAmountToTokenAmount(
      tokenId,
      assetPoolRaw.deposit_amount
    ),
    depositValue:
      tokenPrice === undefined
        ? undefined
        : nativeAmountToValue(tokenId, assetPoolRaw.deposit_amount, tokenPrice),
    borrowAmount: nativeAmountToTokenAmount(
      tokenId,
      assetPoolRaw.borrow_amount
    ),
    borrowValue:
      tokenPrice === undefined
        ? undefined
        : nativeAmountToValue(tokenId, assetPoolRaw.borrow_amount, tokenPrice),
    depositRate: assetPoolRaw.deposit_rate,
    depositAptRewardTokenRate: nativeRateToTokenRate(
      depositAptRewardNativeRate,
      TokenID.APT,
      tokenId
    ),
    depositAptRewardRate:
      aptPrice === undefined || tokenPrice === undefined
        ? undefined
        : nativeRateToValueRate(
            depositAptRewardNativeRate,
            TokenID.APT,
            tokenId,
            aptPrice,
            tokenPrice
          ),
    depositMndeRewardTokenRate: hasMndeReward(tokenId)
      ? nativeRateToTokenRate(
          depositAptRewardNativeRate.mul(mndeAptMultiplierNative),
          TokenID.MNDE,
          tokenId
        )
      : undefined,
    depositMndeRewardRate:
      !hasMndeReward(tokenId) ||
      mndePrice === undefined ||
      tokenPrice === undefined
        ? undefined
        : nativeRateToValueRate(
            depositAptRewardNativeRate.mul(mndeAptMultiplierNative),
            TokenID.MNDE,
            tokenId,
            mndePrice,
            tokenPrice
          ),
    borrowRate: assetPoolRaw.borrow_rate,
    borrowAptRewardTokenRate: nativeRateToTokenRate(
      borrowAptRewardNativeRate.mul(mndeAptMultiplierNative),
      TokenID.APT,
      tokenId
    ),
    borrowAptRewardRate:
      aptPrice === undefined || tokenPrice === undefined
        ? undefined
        : nativeRateToValueRate(
            borrowAptRewardNativeRate.mul(mndeAptMultiplierNative),
            TokenID.APT,
            tokenId,
            aptPrice,
            tokenPrice
          ),
    borrowMndeRewardTokenRate: hasMndeReward(tokenId)
      ? nativeRateToTokenRate(
          borrowAptRewardNativeRate.mul(mndeAptMultiplierNative),
          TokenID.MNDE,
          tokenId
        )
      : undefined,
    borrowMndeRewardRate:
      !hasMndeReward(tokenId) ||
      mndePrice === undefined ||
      tokenPrice === undefined
        ? undefined
        : nativeRateToValueRate(
            borrowAptRewardNativeRate.mul(mndeAptMultiplierNative),
            TokenID.MNDE,
            tokenId,
            mndePrice,
            tokenPrice
          ),
    farmYieldRate: assetPoolRaw.farm_yield,
    lastPoolUpdate: epochToDate(assetPoolRaw.last_update_time),
    lastPriceUpdate: lastPriceUpdate,
  };
}

export function hasMndeReward(tokenId: TokenID) {
  return tokenId === TokenID.mSOL;
}

export function epochToDate(time: Decimal) {
  return new Date(time.toNumber() * 1000);
}

export function flagsToBool(flags: number, targetFlag: PoolFlag): boolean {
  return Boolean(flags & targetFlag);
}

export function nativeAmountToTokenAmount(
  tokenId: TokenID,
  amount: Decimal
): Decimal {
  return amount.div(DECIMAL_MULT[tokenId]);
}

export function tokenAmountToNativeAmount(
  tokenId: TokenID,
  amount: Decimal
): Decimal {
  return amount.mul(DECIMAL_MULT[tokenId]);
}

export function nativeRateToTokenRate(
  rate: Decimal,
  nTokenId: TokenID,
  dTokenId: TokenID
): Decimal {
  return nativeAmountToTokenAmount(nTokenId, rate).div(
    nativeAmountToTokenAmount(dTokenId, Decimal.abs(1))
  );
}

export function tokenRateToNativeRate(
  rate: Decimal,
  nTokenId: TokenID,
  dTokenId: TokenID
): Decimal {
  return tokenAmountToNativeAmount(nTokenId, rate).div(
    tokenAmountToNativeAmount(dTokenId, Decimal.abs(1))
  );
}
export function nativeAmountToValue(
  tokenId: TokenID,
  amount: Decimal,
  price: Decimal.Value
): Decimal {
  return nativeAmountToTokenAmount(tokenId, amount).mul(price);
}

export function tokenRateToValueRate(
  rate: Decimal,
  nTokenPrice: Decimal.Value,
  dTokenPrice: Decimal.Value
) {
  if (Decimal.abs(dTokenPrice).isZero()) {
    throw new Error(`Token price to be divided can't be zero.`);
  }

  return rate.mul(nTokenPrice).div(dTokenPrice);
}

export function nativeRateToValueRate(
  rate: Decimal,
  nTokenId: TokenID,
  dTokenId: TokenID,
  nTokenPrice: Decimal.Value,
  dTokenPrice: Decimal.Value
): Decimal {
  return tokenRateToValueRate(
    nativeRateToTokenRate(rate, nTokenId, dTokenId),
    nTokenPrice,
    dTokenPrice
  );
}

export function rewindAmount(amount: Decimal, index: Decimal) {
  invariant(
    index.greaterThanOrEqualTo(1),
    `Invalid index: ${index}. Index must >= 1`
  );
  return amount.div(index);
}

export function fastForwardAmount(amount: Decimal, index: Decimal) {
  invariant(
    index.greaterThanOrEqualTo(1),
    `Invalid index: ${index}. Index must >= 1`
  );
  return amount.mul(index);
}

export function currentPerPastRateToCurrentPerCurrentRate(
  rate: Decimal,
  index: Decimal
) {
  return rate.div(fastForwardAmount(Decimal.abs(1), index));
}

export const AMM_INFO_LAYOUT_V4 = struct([
  _u64("status"),
  _u64("nonce"),
  _u64("orderNum"),
  _u64("depth"),
  _u64("coinDecimals"),
  _u64("pcDecimals"),
  _u64("state"),
  _u64("resetFlag"),
  _u64("minSize"),
  _u64("volMaxCutRatio"),
  _u64("amountWaveRatio"),
  _u64("coinLotSize"),
  _u64("pcLotSize"),
  _u64("minPriceMultiplier"),
  _u64("maxPriceMultiplier"),
  _u64("systemDecimalsValue"),
  // Fees
  _u64("minSeparateNumerator"),
  _u64("minSeparateDenominator"),
  _u64("tradeFeeNumerator"),
  _u64("tradeFeeDenominator"),
  _u64("pnlNumerator"),
  _u64("pnlDenominator"),
  _u64("swapFeeNumerator"),
  _u64("swapFeeDenominator"),
  // OutPutData
  _u64("needTakePnlCoin"),
  _u64("needTakePnlPc"),
  _u64("totalPnlPc"),
  _u64("totalPnlCoin"),

  _u64("poolOpenTime"),
  _u64("punishPcAmount"),
  _u64("punishCoinAmount"),
  _u64("orderbookToInitTime"),

  u128("swapCoinInAmount"),
  u128("swapPcOutAmount"),
  _u64("swapCoin2PcFee"),
  u128("swapPcInAmount"),
  u128("swapCoinOutAmount"),
  _u64("swapPc2CoinFee"),

  publicKey("poolCoinTokenAccount"),
  publicKey("poolPcTokenAccount"),
  publicKey("coinMintAddress"),
  publicKey("pcMintAddress"),
  publicKey("lpMintAddress"),
  publicKey("ammOpenOrders"),
  publicKey("serumMarket"),
  publicKey("serumProgramId"),
  publicKey("ammTargetOrders"),
  publicKey("poolWithdrawQueue"),
  publicKey("poolTempLpTokenAccount"),
  publicKey("ammOwner"),
  publicKey("pnlOwner"),
]);
