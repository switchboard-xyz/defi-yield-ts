import axios from "axios";
import BigNumber from 'bignumber.js';
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { AccountInfo, Cluster, clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

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
      borrowAmount: reserve.stats!.totalBorrowsWads.div(new BN(WAD)).div(new BN(10 ** reserve.config.decimals)).toNumber(),
      borrowRate: reserve.stats!.borrowInterestAPY,
      depositAmount: reserve.stats!.totalDepositsWads.div(new BN(WAD)).div(new BN(10 ** reserve.config.decimals)).toNumber(),
      depositRate: reserve.stats!.supplyInterestAPY,
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








export type ConfigType = {
  programID: string;
  assets: AssetType[];
  oracles: OraclesType;
  markets: MarketType[];
};

export type AssetType = {
  name: string;
  symbol: string;
  decimals: number;
  mintAddress: string;
};

export type OraclesType = {
  pythProgramID: string;
  switchboardProgramID: string;
  assets: OracleAssetType[];
};

export type OracleAssetType = {
  asset: string;
  priceAddress: string;
  switchboardFeedAddress: string;
};

export type MarketType = {
  name: string;
  address: string;
  authorityAddress: string;
  reserves: ReserveType[];
  isPrimary: boolean;
};

export type ReserveType = {
  asset: string;
  address: string;
  collateralMintAddress: string;
  collateralSupplyAddress: string;
  liquidityAddress: string;
  liquidityFeeReceiverAddress: string;
  userSupplyCap?: number;
};






/**
 * Layout for a public key
 */
export const Layout_publicKey = (property = "publicKey"): unknown => {
const publicKeyLayout = BufferLayout.blob(32, property);

const _decode = publicKeyLayout.decode.bind(publicKeyLayout);
const _encode = publicKeyLayout.encode.bind(publicKeyLayout);

publicKeyLayout.decode = (buffer: Buffer, offset: number) => {
  const data = _decode(buffer, offset);
  return new PublicKey(data);
};

publicKeyLayout.encode = (key: PublicKey, buffer: Buffer, offset: number) =>
  _encode(key.toBuffer(), buffer, offset);

return publicKeyLayout;
};

/**
 * Layout for a 64bit unsigned value
 */
export const Layout_uint64 = (property = "uint64"): unknown => {
  const layout = BufferLayout.blob(8, property);

  const _decode = layout.decode.bind(layout);
  const _encode = layout.encode.bind(layout);

  layout.decode = (buffer: Buffer, offset: number) => {
    const data = _decode(buffer, offset);
    return new BN(
      [...data]
        .reverse()
        .map((i) => `00${i.toString(16)}`.slice(-2))
        .join(""),
      16
    );
  };

  layout.encode = (num: BN, buffer: Buffer, offset: number) => {
    const a = num.toArray().reverse();
    let b = Buffer.from(a);
    if (b.length !== 8) {
      const zeroPad = Buffer.alloc(8);
      b.copy(zeroPad);
      b = zeroPad;
    }
    return _encode(b, buffer, offset);
  };

  return layout;
};

export const Layout_uint128 = (property = "uint128"): unknown => {
  const layout = BufferLayout.blob(16, property);

  const _decode = layout.decode.bind(layout);
  const _encode = layout.encode.bind(layout);

  layout.decode = (buffer: Buffer, offset: number) => {
    const data = _decode(buffer, offset);
    return new BN(
      [...data]
        .reverse()
        .map((i) => `00${i.toString(16)}`.slice(-2))
        .join(""),
      16
    );
  };

  layout.encode = (num: BN, buffer: Buffer, offset: number) => {
    const a = num.toArray().reverse();
    let b = Buffer.from(a);
    if (b.length !== 16) {
      const zeroPad = Buffer.alloc(16);
      b.copy(zeroPad);
      b = zeroPad;
    }

    return _encode(b, buffer, offset);
  };

  return layout;
};

/**
 * Layout for a Rust String type
 */
export const Layout_rustString = (property = "string"): unknown => {
  const rsl = BufferLayout.struct(
    [
      BufferLayout.u32("length"),
      BufferLayout.u32("lengthPadding"),
      BufferLayout.blob(BufferLayout.offset(BufferLayout.u32(), -8), "chars"),
    ],
    property
  );
  const _decode = rsl.decode.bind(rsl);
  const _encode = rsl.encode.bind(rsl);

  rsl.decode = (buffer: Buffer, offset: number) => {
    const data = _decode(buffer, offset);
    return data.chars.toString("utf8");
  };

  rsl.encode = (str: string, buffer: Buffer, offset: number) => {
    const data = {
      chars: Buffer.from(str, "utf8"),
    };
    return _encode(data, buffer, offset);
  };

  return rsl;
};




export const LastUpdateLayout: typeof BufferLayout.Structure =
  BufferLayout.struct(
    [Layout_uint64("slot"), BufferLayout.u8("stale")],
    "lastUpdate"
  );

export interface LastUpdate {
  slot: BN;
  stale: boolean;
}





export interface Obligation {
  version: number;
  lastUpdate: LastUpdate;
  lendingMarket: PublicKey;
  owner: PublicKey;
  // @FIXME: check usages
  deposits: ObligationCollateral[];
  // @FIXME: check usages
  borrows: ObligationLiquidity[];
  depositedValue: BN; // decimals
  borrowedValue: BN; // decimals
  allowedBorrowValue: BN; // decimals
  unhealthyBorrowValue: BN; // decimals
}

// BN defines toJSON property, which messes up serialization
// @ts-ignore
BN.prototype.toJSON = undefined;

export function obligationToString(obligation: Obligation) {
  return JSON.stringify(
    obligation,
    (key, value) => {
      // Skip padding
      if (key === "padding") {
        return null;
      }
      switch (value.constructor.name) {
        case "PublicKey":
          return value.toBase58();
        case "BN":
          return value.toString();
        default:
          return value;
      }
    },
    2
  );
}

export interface ObligationCollateral {
  depositReserve: PublicKey;
  depositedAmount: BN;
  marketValue: BN; // decimals
}

export interface ObligationLiquidity {
  borrowReserve: PublicKey;
  cumulativeBorrowRateWads: BN; // decimals
  borrowedAmountWads: BN; // decimals
  marketValue: BN; // decimals
}

export const ObligationLayout: typeof BufferLayout.Structure =
  BufferLayout.struct([
    BufferLayout.u8("version"),

    LastUpdateLayout,

    Layout_publicKey("lendingMarket"),
    Layout_publicKey("owner"),
    Layout_uint128("depositedValue"),
    Layout_uint128("borrowedValue"),
    Layout_uint128("allowedBorrowValue"),
    Layout_uint128("unhealthyBorrowValue"),
    BufferLayout.blob(64, "_padding"),

    BufferLayout.u8("depositsLen"),
    BufferLayout.u8("borrowsLen"),
    BufferLayout.blob(1096, "dataFlat"),
  ]);

export const ObligationCollateralLayout: typeof BufferLayout.Structure =
  BufferLayout.struct([
    Layout_publicKey("depositReserve"),
    Layout_uint64("depositedAmount"),
    Layout_uint128("marketValue"),
    BufferLayout.blob(32, "padding"),
  ]);

export const ObligationLiquidityLayout: typeof BufferLayout.Structure =
  BufferLayout.struct([
    Layout_publicKey("borrowReserve"),
    Layout_uint128("cumulativeBorrowRateWads"),
    Layout_uint128("borrowedAmountWads"),
    Layout_uint128("marketValue"),
    BufferLayout.blob(32, "padding"),
  ]);

export const OBLIGATION_SIZE = ObligationLayout.span;

export const isObligation = (info: AccountInfo<Buffer>) =>
  info.data.length === ObligationLayout.span;

export interface ProtoObligation {
  version: number;
  lastUpdate: LastUpdate;
  lendingMarket: PublicKey;
  owner: PublicKey;
  depositedValue: BN; // decimals
  borrowedValue: BN; // decimals
  allowedBorrowValue: BN; // decimals
  unhealthyBorrowValue: BN; // decimals
  depositsLen: number;
  borrowsLen: number;
  dataFlat: Buffer;
}

export const parseObligation = (
  pubkey: PublicKey,
  info: AccountInfo<Buffer>
) => {
  const { data } = info;
  const buffer = Buffer.from(data);
  const {
    version,
    lastUpdate,
    lendingMarket,
    owner,
    depositedValue,
    borrowedValue,
    allowedBorrowValue,
    unhealthyBorrowValue,
    depositsLen,
    borrowsLen,
    dataFlat,
  } = ObligationLayout.decode(buffer) as ProtoObligation;

  if (lastUpdate.slot.isZero()) {
    return null;
  }

  const depositsBuffer = dataFlat.slice(
    0,
    depositsLen * ObligationCollateralLayout.span
  );
  const deposits = BufferLayout.seq(
    ObligationCollateralLayout,
    depositsLen
  ).decode(depositsBuffer) as ObligationCollateral[];

  const borrowsBuffer = dataFlat.slice(
    depositsBuffer.length,
    depositsLen * ObligationCollateralLayout.span +
      borrowsLen * ObligationLiquidityLayout.span
  );
  const borrows = BufferLayout.seq(
    ObligationLiquidityLayout,
    borrowsLen
  ).decode(borrowsBuffer) as ObligationLiquidity[];

  const obligation = {
    version,
    lastUpdate,
    lendingMarket,
    owner,
    depositedValue,
    borrowedValue,
    allowedBorrowValue,
    unhealthyBorrowValue,
    deposits,
    borrows,
  } as Obligation;

  const details = {
    pubkey,
    account: {
      ...info,
    },
    info: obligation,
  };

  return details;
};





const SLOTS_PER_YEAR = 63072000;

export type RewardInfo = {
  rewardRate: string;
  rewardMint?: string;
  rewardSymbol: string;
  price: number;
};

export type RewardsData = {
  [key: string]: {
    supply: Array<RewardInfo>;
    borrow: Array<RewardInfo>;
  };
};

type RewardStatType = {
  rewardsPerShare: string;
  totalBalance: string;
  lastSlot: number;
  rewardRates: Array<{
    beginningSlot: number;
    rewardRate: string;
    name?: string;
  }>;
} | null;

type ExternalRewardStatType = RewardStatType & {
  rewardMint: string;
  rewardSymbol: string;
};
type RewardResponse = {
  supply: RewardStatType;
  borrow: RewardStatType;
};

type ExternalRewardResponse = {
  supply: ExternalRewardStatType;
  borrow: ExternalRewardStatType;
};

type FormattedMarketConfig = ReturnType<typeof formatReserveConfig>;

const API_ENDPOINT = "https://api.solend.fi";

function formatReserveConfig(config: ConfigType, marketAddress?: string) {
  const market = marketAddress
    ? config.markets.find((mar) => mar.address === marketAddress)
    : config.markets.find((mar) => mar.isPrimary) ?? config.markets[0];
  if (!market) {
    throw Error("No markets found.");
  }
  const hydratedReserves = market.reserves.map((res) => {
    const assetData = config.assets.find((asset) => asset.symbol === res.asset);
    if (!assetData) {
      throw new Error(`Could not find asset ${res.asset} in config`);
    }

    const oracleData = config.oracles.assets.find(
      (asset) => asset.asset === res.asset
    );
    if (!oracleData) {
      throw new Error(`Could not find oracle data for ${res.asset} in config`);
    }
    const { asset: _asset, ...trimmedoracleData } = oracleData;

    return {
      ...res,
      ...assetData,
      ...trimmedoracleData,
    };
  });
  return {
    ...market,
    pythProgramID: config.oracles.pythProgramID,
    switchboardProgramID: config.oracles.switchboardProgramID,
    programID: config.programID,
    reserves: hydratedReserves,
  };
}









export interface Reserve {
  version: number;
  lastUpdate: LastUpdate;
  lendingMarket: PublicKey;
  liquidity: ReserveLiquidity;
  collateral: ReserveCollateral;
  config: ReserveConfig;
}

export interface ReserveLiquidity {
  mintPubkey: PublicKey;
  mintDecimals: number;
  supplyPubkey: PublicKey;
  // @FIXME: oracle option
  oracleOption: number;
  pythOraclePubkey: PublicKey;
  switchboardOraclePubkey: PublicKey;
  availableAmount: BN;
  borrowedAmountWads: BN;
  cumulativeBorrowRateWads: BN;
  marketPrice: BN;
}

export interface ReserveCollateral {
  mintPubkey: PublicKey;
  mintTotalSupply: BN;
  supplyPubkey: PublicKey;
}

export interface ReserveConfig {
  optimalUtilizationRate: number;
  loanToValueRatio: number;
  liquidationBonus: number;
  liquidationThreshold: number;
  minBorrowRate: number;
  optimalBorrowRate: number;
  maxBorrowRate: number;
  fees: {
    borrowFeeWad: BN;
    flashLoanFeeWad: BN;
    hostFeePercentage: number;
  };
  depositLimit: BN;
  borrowLimit: BN;
}

export const ReserveConfigLayout = BufferLayout.struct(
  [
    BufferLayout.u8("optimalUtilizationRate"),
    BufferLayout.u8("loanToValueRatio"),
    BufferLayout.u8("liquidationBonus"),
    BufferLayout.u8("liquidationThreshold"),
    BufferLayout.u8("minBorrowRate"),
    BufferLayout.u8("optimalBorrowRate"),
    BufferLayout.u8("maxBorrowRate"),
    BufferLayout.struct(
      [
        Layout_uint64("borrowFeeWad"),
        Layout_uint64("flashLoanFeeWad"),
        BufferLayout.u8("hostFeePercentage"),
      ],
      "fees"
    ),
    Layout_uint64("depositLimit"),
    Layout_uint64("borrowLimit"),
    Layout_publicKey("feeReceiver"),
  ],
  "config"
);

export const ReserveLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8("version"),

    LastUpdateLayout,

    Layout_publicKey("lendingMarket"),

    BufferLayout.struct(
      [
        Layout_publicKey("mintPubkey"),
        BufferLayout.u8("mintDecimals"),
        Layout_publicKey("supplyPubkey"),
        // @FIXME: oracle option
        // TODO: replace u32 option with generic equivalent
        // BufferLayout.u32('oracleOption'),
        Layout_publicKey("pythOracle"),
        Layout_publicKey("switchboardOracle"),
        Layout_uint64("availableAmount"),
        Layout_uint128("borrowedAmountWads"),
        Layout_uint128("cumulativeBorrowRateWads"),
        Layout_uint128("marketPrice"),
      ],
      "liquidity"
    ),

    BufferLayout.struct(
      [
        Layout_publicKey("mintPubkey"),
        Layout_uint64("mintTotalSupply"),
        Layout_publicKey("supplyPubkey"),
      ],
      "collateral"
    ),
    ReserveConfigLayout,
    BufferLayout.blob(256, "padding"),
  ]
);

export const RESERVE_SIZE = ReserveLayout.span;

export const isReserve = (info: AccountInfo<Buffer>) =>
  info.data.length === ReserveLayout.span;

export const parseReserve = (pubkey: PublicKey, info: AccountInfo<Buffer>) => {
  const { data } = info;
  const buffer = Buffer.from(data);
  const reserve = ReserveLayout.decode(buffer) as Reserve;

  if (reserve.lastUpdate.slot.isZero()) {
    return null;
  }

  const details = {
    pubkey,
    account: {
      ...info,
    },
    info: reserve,
  };

  return details;
};

export function reserveToString(reserve: Reserve) {
  return JSON.stringify(
    reserve,
    (key, value) => {
      // Skip padding
      if (key === "padding") {
        return null;
      }
      switch (value.constructor.name) {
        case "PublicKey":
          return value.toBase58();
        case "BN":
          return value.toString();
        default:
          return value;
      }
    },
    2
  );
}







export const WAD = "1".concat(Array(18 + 1).join("0"));
export const WANG = "1".concat(Array(36 + 1).join("0"));
export const U64_MAX = "18446744073709551615";

export class SolendMarket {
  reserves: Array<SolendReserve>;

  rewardsData: RewardsData | null;

  config: FormattedMarketConfig | null;

  private connection: Connection;

  private constructor(connection: Connection) {
    this.connection = connection;
    this.reserves = [];
    this.rewardsData = null;
    this.config = null;
  }

  static async initialize(
    connection: Connection,
    environment: "production" | "devnet" = "production",
    marketAddress?: string
  ) {
    const market = new SolendMarket(connection);
    const rawConfig = (await (
      await axios.get(`${API_ENDPOINT}/v1/config?deployment=${environment}`)
    ).data) as ConfigType;
    market.config = formatReserveConfig(rawConfig, marketAddress);
    market.reserves = market.config.reserves.map(
      (res) => new SolendReserve(res, market, connection)
    );

    return market;
  }

  async fetchObligationByWallet(publicKey: PublicKey) {
    const { config, reserves } = this;
    if (!config) {
      throw Error(
        "Market must be initialized to call fetchObligationByWallet."
      );
    }
    const obligationAddress = await PublicKey.createWithSeed(
      publicKey,
      config.address.slice(0, 32),
      new PublicKey(config?.programID)
    );
    const rawObligationData = await this.connection.getAccountInfo(
      obligationAddress
    );

    if (!rawObligationData) {
      return null;
    }

    const parsedObligation = parseObligation(
      PublicKey.default,
      rawObligationData!
    );

    if (!parsedObligation) {
      throw Error("Could not parse obligation.");
    }

    if (!reserves.every((reserve) => reserve.stats)) {
      await this.loadReserves();
    }

    const obligationInfo = parsedObligation.info;

    return new SolendObligation(
      publicKey,
      obligationAddress,
      obligationInfo,
      reserves
    );
  }

  async loadAll() {
    const promises = [this.loadReserves(), this.loadRewards()];

    await Promise.all(promises);
  }

  private async loadLMRewardData() {
    const data = (
      await axios.get(`${API_ENDPOINT}/liquidity-mining/reward-stats`)
    ).data as Promise<{
      [key: string]: RewardResponse;
    }>;

    return data;
  }

  private async loadExternalRewardData() {
    const data = (
      await axios.get(`${API_ENDPOINT}/liquidity-mining/external-reward-stats`)
    ).data as Promise<{
      [key: string]: ExternalRewardResponse;
    }>;

    return data;
  }

  private async loadPriceData(symbols: Array<string>) {
    const data = (await (
      await axios.get(`${API_ENDPOINT}/v1/prices/?symbols=${symbols.join(",")}`)
    ).data) as {
      results: Array<{
        identifier: string;
        price: string;
        source: string;
      }>;
    };

    return data.results.reduce(
      (acc, price) => ({
        ...acc,
        [price.identifier]: Number(price.price),
      }),
      {} as { [key: string]: number }
    );
  }

  private getLatestRewardRate(
    rewardRates: Array<{
      beginningSlot: number;
      rewardRate: string;
      name?: string;
    }>,
    slot: number
  ) {
    return rewardRates
      .filter((rr) => slot >= rr.beginningSlot)
      .reduce((v1, v2) => (v1.beginningSlot > v2.beginningSlot ? v1 : v2), {
        beginningSlot: 0,
        rewardRate: "0",
      });
  }

  async loadRewards() {
    const promises = [
      this.loadLMRewardData(),
      this.loadExternalRewardData(),
      this.connection.getSlot("finalized"),
    ] as const;

    const [lmRewards, externalRewards, currentSlot] = await Promise.all(
      promises
    );

    const querySymbols = Object.values(externalRewards)
      .flatMap((reward) => [
        reward.supply?.rewardSymbol,
        reward.borrow?.rewardSymbol,
      ])
      .filter((x) => x);

    const priceData = await this.loadPriceData(querySymbols.concat("SLND"));

    this.rewardsData = this.reserves.reduce((acc, reserve) => {
      const {
        config: { mintAddress },
      } = reserve;
      const lmReward = lmRewards[mintAddress];
      const externalReward = externalRewards[mintAddress];

      const supply = [
        lmReward?.supply
          ? {
              rewardRate: this.getLatestRewardRate(
                lmReward.supply.rewardRates,
                currentSlot
              ).rewardRate,
              rewardMint: "SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp",
              rewardSymbol: "SLND",
              price: new BigNumber(priceData.SLND).toNumber(),
            }
          : null,
        externalReward?.supply
          ? {
              rewardRate: this.getLatestRewardRate(
                externalReward.supply.rewardRates,
                currentSlot
              ).rewardRate,
              rewardMint: externalReward.supply.rewardMint,
              rewardSymbol: externalReward.supply.rewardSymbol,
              price: priceData[externalReward.supply.rewardSymbol],
            }
          : null,
      ].filter((x) => x);

      const borrow = [
        lmReward?.borrow
          ? {
              rewardRate: this.getLatestRewardRate(
                lmReward.borrow.rewardRates,
                currentSlot
              ).rewardRate,
              rewardMint: "SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp",
              rewardSymbol: "SLND",
              price: new BigNumber(priceData.SLND).toNumber(),
            }
          : null,
        externalReward?.borrow
          ? {
              rewardRate: this.getLatestRewardRate(
                externalReward.borrow.rewardRates,
                currentSlot
              ).rewardRate,
              rewardMint: externalReward.borrow.rewardMint,
              rewardSymbol: externalReward.borrow.rewardSymbol,
              price: priceData[externalReward.borrow.rewardSymbol],
            }
          : null,
      ].filter((x) => x);

      return {
        ...acc,
        [reserve.config.mintAddress]: {
          supply,
          borrow,
        },
      };
    }, {});

    const refreshReserves = this.reserves.map((reserve) => {
      return reserve.load();
    });

    await Promise.all(refreshReserves);
  }

  async loadReserves() {
    const addresses = this.reserves.map(
      (reserve) => new PublicKey(reserve.config.address)
    );
    const reserveAccounts = await this.connection.getMultipleAccountsInfo(
      addresses,
      "processed"
    );

    const loadReserves = this.reserves.map((reserve, index) => {
      reserve.setBuffer(reserveAccounts[index] as AccountInfo<Buffer> | null);
      return reserve.load();
    });

    await Promise.all(loadReserves);
  }

  async refreshAll() {
    const promises = [
      this.reserves.every((reserve) => reserve.stats)
        ? this.loadReserves()
        : null,
      this.rewardsData ? this.loadRewards() : null,
    ].filter((x) => x);

    await Promise.all(promises);
  }
}

export type ReserveData = {
  optimalUtilizationRate: number;
  loanToValueRatio: number;
  liquidationBonus: number;
  liquidationThreshold: number;
  minBorrowRate: number;
  optimalBorrowRate: number;
  maxBorrowRate: number;
  borrowFeePercentage: number;
  hostFeePercentage: number;
  depositLimit: BN;
  reserveBorrowLimit: BN;
  name: string;
  symbol: string;
  decimals: number;
  mintAddress: string;
  totalDepositsWads: BN;
  totalBorrowsWads: BN;
  totalLiquidityWads: BN;
  supplyInterestAPY: number;
  borrowInterestAPY: number;
  assetPriceUSD: number;
  userDepositLimit?: number;
  cumulativeBorrowRateWads: BN;
  cTokenExchangeRate: number;
};

type ParsedReserve = NonNullable<ReturnType<typeof parseReserve>>["info"];
type FormattedReserveConfig = FormattedMarketConfig["reserves"][0];

export class SolendReserve {
  config: FormattedReserveConfig;

  private market: SolendMarket;

  private buffer: AccountInfo<Buffer> | null;

  stats: ReserveData | null;

  private connection: Connection;

  constructor(
    reserveConfig: FormattedReserveConfig,
    market: SolendMarket,
    connection: Connection
  ) {
    this.config = reserveConfig;
    this.market = market;
    this.buffer = null;
    this.stats = null;
    this.connection = connection;
  }

  private calculateSupplyAPY = (reserve: ParsedReserve) => {
    const apr = this.calculateSupplyAPR(reserve);
    const apy =
      new BigNumber(1)
        .plus(new BigNumber(apr).dividedBy(SLOTS_PER_YEAR))
        .toNumber() **
        SLOTS_PER_YEAR -
      1;
    return apy;
  };

  private calculateBorrowAPY = (reserve: ParsedReserve) => {
    const apr = this.calculateBorrowAPR(reserve);
    const apy =
      new BigNumber(1)
        .plus(new BigNumber(apr).dividedBy(SLOTS_PER_YEAR))
        .toNumber() **
        SLOTS_PER_YEAR -
      1;
    return apy;
  };

  private calculateSupplyAPR(reserve: ParsedReserve) {
    const currentUtilization = this.calculateUtilizationRatio(reserve);

    const borrowAPY = this.calculateBorrowAPR(reserve);
    return currentUtilization * borrowAPY;
  }

  private calculateUtilizationRatio(reserve: ParsedReserve) {
    const totalBorrowsWads = new BigNumber(
      reserve.liquidity.borrowedAmountWads.toString()
    )
      .div(WAD)
      .toNumber();
    const currentUtilization =
      totalBorrowsWads /
      (reserve.liquidity.availableAmount.toNumber() + totalBorrowsWads);

    return currentUtilization;
  }

  private calculateBorrowAPR(reserve: ParsedReserve) {
    const currentUtilization = this.calculateUtilizationRatio(reserve);
    const optimalUtilization = reserve.config.optimalUtilizationRate / 100;

    let borrowAPR;
    if (optimalUtilization === 1.0 || currentUtilization < optimalUtilization) {
      const normalizedFactor = currentUtilization / optimalUtilization;
      const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
      const minBorrowRate = reserve.config.minBorrowRate / 100;
      borrowAPR =
        normalizedFactor * (optimalBorrowRate - minBorrowRate) + minBorrowRate;
    } else {
      const normalizedFactor =
        (currentUtilization - optimalUtilization) / (1 - optimalUtilization);
      const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
      const maxBorrowRate = reserve.config.maxBorrowRate / 100;
      borrowAPR =
        normalizedFactor * (maxBorrowRate - optimalBorrowRate) +
        optimalBorrowRate;
    }

    return borrowAPR;
  }

  setBuffer(buffer: AccountInfo<Buffer> | null) {
    this.buffer = buffer;
  }

  async load() {
    if (!this.buffer) {
      this.buffer = await this.connection.getAccountInfo(
        new PublicKey(this.config.address),
        "processed"
      );
    }

    if (!this.buffer) {
      throw Error(`Error requesting account info for ${this.config.name}`);
    }

    const parsedData = parseReserve(
      new PublicKey(this.config.address),
      this.buffer
    )?.info;
    if (!parsedData) {
      throw Error(`Unable to parse data of reserve ${this.config.name}`);
    }

    this.stats = await this.formatReserveData(parsedData);
  }

  calculateRewardAPY(
    rewardRate: string,
    poolSize: string,
    rewardPrice: number,
    tokenPrice: number,
    decimals: number
  ) {
    const poolValueUSD = new BigNumber(poolSize)
      .times(tokenPrice)
      .dividedBy("1".concat(Array(decimals + 1).join("0")))
      .dividedBy(WAD);

    return new BigNumber(rewardRate)
      .multipliedBy(rewardPrice)
      .dividedBy(poolValueUSD)
      .dividedBy(WANG);
  }

  totalSupplyAPY() {
    const { stats } = this;
    if (!this.market.rewardsData || !stats) {
      throw Error(
        "SolendMarket must be initialized with the withRewardData flag as true and load must be called on the reserve."
      );
    }

    const rewards = this.market.config?.isPrimary
      ? this.market.rewardsData[this.config.mintAddress].supply.map(
          (reward) => ({
            rewardMint: reward.rewardMint,
            rewardSymbol: reward.rewardSymbol,
            apy: this.calculateRewardAPY(
              reward.rewardRate,
              stats.totalDepositsWads.toString(),
              reward.price,
              stats.assetPriceUSD,
              this.config.decimals
            ).toNumber(),
            price: reward.price,
          })
        )
      : [];

    const totalAPY = new BigNumber(stats.supplyInterestAPY)
      .plus(
        rewards.reduce((acc, reward) => acc.plus(reward.apy), new BigNumber(0))
      )
      .toNumber();

    return {
      interestAPY: stats.supplyInterestAPY,
      totalAPY,
      rewards,
    };
  }

  totalBorrowAPY() {
    const { stats } = this;
    if (!this.market.rewardsData || !stats) {
      throw Error(
        "SolendMarket must be initialized with the withRewardData flag as true and load must be called on the reserve."
      );
    }

    const rewards = this.market.config?.isPrimary
      ? this.market.rewardsData[this.config.mintAddress].borrow.map(
          (reward) => ({
            rewardMint: reward.rewardMint,
            rewardSymbol: reward.rewardSymbol,
            apy: this.calculateRewardAPY(
              reward.rewardRate,
              stats.totalBorrowsWads.toString(),
              reward.price,
              stats.assetPriceUSD,
              this.config.decimals
            ).toNumber(),
            price: reward.price,
          })
        )
      : [];
    const totalAPY = new BigNumber(stats.borrowInterestAPY)
      .minus(
        rewards.reduce((acc, reward) => acc.plus(reward.apy), new BigNumber(0))
      )
      .toNumber();

    return {
      interestAPY: stats.borrowInterestAPY,
      totalAPY,
      rewards,
    };
  }

  private formatReserveData(
    parsedData: NonNullable<ReturnType<typeof parseReserve>>["info"]
  ): ReserveData {
    const totalBorrowsWads = parsedData.liquidity.borrowedAmountWads;
    const totalLiquidityWads = parsedData.liquidity.availableAmount.mul(
      new BN(WAD)
    );
    const totalDepositsWads = totalBorrowsWads.add(totalLiquidityWads);
    const cTokenExchangeRate = new BigNumber(totalDepositsWads.toString())
      .div(parsedData.collateral.mintTotalSupply.toString())
      .div(WAD)
      .toNumber();

    return {
      // Reserve config
      optimalUtilizationRate: parsedData.config.optimalUtilizationRate / 100,
      loanToValueRatio: parsedData.config.loanToValueRatio / 100,
      liquidationBonus: parsedData.config.liquidationBonus / 100,
      liquidationThreshold: parsedData.config.liquidationThreshold / 100,
      minBorrowRate: parsedData.config.minBorrowRate / 100,
      optimalBorrowRate: parsedData.config.optimalBorrowRate / 100,
      maxBorrowRate: parsedData.config.maxBorrowRate / 100,
      borrowFeePercentage: new BigNumber(
        parsedData.config.fees.borrowFeeWad.toString()
      )
        .dividedBy(WAD)
        .toNumber(),
      hostFeePercentage: parsedData.config.fees.hostFeePercentage / 100,
      depositLimit: parsedData.config.depositLimit,
      reserveBorrowLimit: parsedData.config.borrowLimit,

      // Reserve info
      name: this.config.name,
      symbol: this.config.symbol,
      decimals: this.config.decimals,
      mintAddress: this.config.mintAddress,
      totalDepositsWads,
      totalBorrowsWads,
      totalLiquidityWads,
      supplyInterestAPY: this.calculateSupplyAPY(parsedData),
      borrowInterestAPY: this.calculateBorrowAPY(parsedData),
      assetPriceUSD: new BigNumber(parsedData.liquidity.marketPrice.toString())
        .div(WAD)
        .toNumber(),
      userDepositLimit: this.config.userSupplyCap,
      cumulativeBorrowRateWads: parsedData.liquidity.cumulativeBorrowRateWads,
      cTokenExchangeRate,
    };
  }
}

export type Position = {
  mintAddress: string;
  amount: BN;
};

export type ObligationStats = {
  liquidationThreshold: number;
  userTotalDeposit: number;
  userTotalBorrow: number;
  borrowLimit: number;
  borrowUtilization: number;
  netAccountValue: number;
  positions: number;
};

export class SolendObligation {
  walletAddress: PublicKey;

  obligationAddress: PublicKey;

  deposits: Array<Position>;

  borrows: Array<Position>;

  obligationStats: ObligationStats;

  constructor(
    walletAddress: PublicKey,
    obligationAddress: PublicKey,
    obligation: Obligation,
    reserves: Array<SolendReserve>
  ) {
    this.walletAddress = walletAddress;
    this.obligationAddress = obligationAddress;

    const positionDetails = this.calculatePositions(obligation, reserves);

    this.deposits = positionDetails.deposits;
    this.borrows = positionDetails.borrows;
    this.obligationStats = positionDetails.stats;
  }

  private calculatePositions(
    obligation: Obligation,
    reserves: Array<SolendReserve>
  ) {
    let userTotalDeposit = new BigNumber(0);
    let borrowLimit = new BigNumber(0);
    let liquidationThreshold = new BigNumber(0);
    let positions = 0;

    const deposits = obligation.deposits.map((deposit) => {
      const reserve = reserves.find(
        (reserve) =>
          reserve.config.address === deposit.depositReserve.toBase58()
      );
      const loanToValue = reserve!.stats!.loanToValueRatio;
      const liqThreshold = reserve!.stats!.liquidationThreshold;

      const supplyAmount = new BN(
        Math.floor(
          new BigNumber(deposit.depositedAmount.toString())
            .multipliedBy(reserve!.stats!.cTokenExchangeRate)
            .toNumber()
        )
      );
      const supplyAmountUSD = new BigNumber(supplyAmount.toString())
        .multipliedBy(reserve!.stats!.assetPriceUSD)
        .dividedBy("1".concat(Array(reserve!.stats!.decimals + 1).join("0")));

      userTotalDeposit = userTotalDeposit.plus(supplyAmountUSD);

      borrowLimit = borrowLimit.plus(supplyAmountUSD.multipliedBy(loanToValue));

      liquidationThreshold = liquidationThreshold.plus(
        supplyAmountUSD.multipliedBy(liqThreshold)
      );

      if (!supplyAmount.eq(new BN("0"))) {
        positions += 1;
      }

      return {
        mintAddress: reserve!.config.mintAddress,
        amount: supplyAmount,
      };
    });

    let userTotalBorrow = new BigNumber(0);

    const borrows = obligation.borrows.map((borrow) => {
      const reserve = reserves.find(
        (reserve) => reserve.config.address === borrow.borrowReserve.toBase58()
      );

      const borrowAmount = new BN(
        Math.floor(
          new BigNumber(borrow.borrowedAmountWads.toString())
            .multipliedBy(reserve!.stats!.cumulativeBorrowRateWads.toString())
            .dividedBy(borrow.cumulativeBorrowRateWads.toString())
            .dividedBy(WAD)
            .toNumber()
        ).toString()
      );

      const borrowAmountUSD = new BigNumber(borrowAmount.toString())
        .multipliedBy(reserve!.stats!.assetPriceUSD)
        .dividedBy("1".concat(Array(reserve!.stats!.decimals + 1).join("0")));

      if (!borrowAmount.eq(new BN("0"))) {
        positions += 1;
      }

      userTotalBorrow = userTotalBorrow.plus(borrowAmountUSD);

      return {
        mintAddress: reserve!.config.mintAddress,
        amount: borrowAmount,
      };
    });

    return {
      deposits,
      borrows,
      stats: {
        liquidationThreshold: liquidationThreshold.toNumber(),
        userTotalDeposit: userTotalDeposit.toNumber(),
        userTotalBorrow: userTotalBorrow.toNumber(),
        borrowLimit: borrowLimit.toNumber(),
        borrowUtilization: userTotalBorrow.dividedBy(borrowLimit).toNumber(),
        netAccountValue: userTotalDeposit.minus(userTotalBorrow).toNumber(),
        positions,
      },
    };
  }
}
