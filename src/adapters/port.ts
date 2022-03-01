import assert from "assert";
import Big, { BigSource, Comparison } from "big.js";
import BN from "bn.js";
import { Provider } from "@project-serum/anchor"
import * as BufferLayout from "@solana/buffer-layout";
import { AccountLayout, NATIVE_MINT, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { ENV, TokenInfo } from "@solana/spl-token-registry";
import { AccountInfo, AccountMeta, Connection, Keypair, MAX_SEED_LENGTH, PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, TransactionInstruction } from "@solana/web3.js"

import TOKENS from '../tokens.json';
import { AssetRate, ProtocolRates } from '../types';

export async function fetch(): Promise<ProtocolRates> {
  const connection = new Connection('https://port-finance.rpcpool.com');
  const port = Port.forMainNet({ connection });
  const context = await port.getReserveContext();
  const reserves: ReserveInfo[] = context.getAllReserves()

  const rates: AssetRate[] = reserves
    .map((reserve) => {
      const token = TOKENS.find((token) => { return token.mint === reserve.getAssetMintId().toBase58(); });
      if (token) {
        return {
          asset: token!.symbol,
          mint: new PublicKey(token!.mint),
          borrowAmount: reserve.getBorrowedAsset().getRaw().toNumber(),
          borrowRate: reserve.getBorrowApy().getUnchecked().toNumber(),
          depositAmount: reserve.getTotalAsset().getRaw().toNumber(),
          depositRate: reserve.getSupplyApy().getUnchecked().toNumber(),
        } as AssetRate;
      }
  }).filter((token) => { return token != undefined; }).map((token) => { return token as AssetRate; });

  return {
    protocol: 'port',
    rates,
  };
}










export const PORT_LENDING = new PublicKey(
  "Port7uDYB3wk6GJAw4KT1WpTeMtSu9bTcChBHkX2LfR"
);
export const PORT_STAKING = new PublicKey(
  "stkarvwmSzv2BygN5e2LeTwimTczLWHCKPKGC2zVLiq"
);
export const DEFAULT_PORT_LENDING_MARKET = new PublicKey(
  "6T4XxKerq744sSuj3jaoV6QiZ8acirf4TrPwQzHAoSy5"
);

//export const PORT_QUANTITY_CONTEXT = QuantityContext.fromDecimals(6);

export const MARKET_MAP: Record<string, string> = {
  H27Quk3DSbu55T4dCr1NddTTSAezXwHU67FPCZVKLhSW: "dev market",
  "6T4XxKerq744sSuj3jaoV6QiZ8acirf4TrPwQzHAoSy5": "prod market",
};

export abstract class Field<T> extends BufferLayout.Layout {
  public abstract decode(b: Uint8Array, offset?: number): T;
}

export abstract class BlobField<T> extends Field<T> {
  private readonly delegate: BufferLayout.Blob;

  protected constructor(span: number, property?: string) {
    super(span, property);
    this.delegate = new BufferLayout.Blob(span, property);
  }

  public decode(b: Uint8Array, offset?: number): T {
    const blob = this.delegate.decode(b, offset);
    return this.fromBuffer(blob);
  }

  protected abstract fromBuffer(buffer: Buffer): T;
}

export class UintField extends BlobField<BN> {
  public constructor(bytes: number, property?: string) {
    super(bytes, property);
  }

  protected fromBuffer(buffer: Buffer): BN {
    return new BN(
      [...buffer]
        .reverse()
        .map((i) => `00${i.toString(16)}`.slice(-2))
        .join(""),
      16
    );
  }
}

export class BigType {
  private static readonly WAD = new Big(10).pow(18);

  public static readonly U8 = new BigType(1);
  public static readonly U16 = new BigType(2);
  public static readonly U32 = new BigType(4);
  public static readonly U64 = new BigType(8);
  public static readonly U128 = new BigType(16);
  public static readonly D64 = new BigType(8, BigType.WAD);
  public static readonly D128 = new BigType(16, BigType.WAD);

  private readonly bytes: number;
  private readonly multiplier?: Big;

  private constructor(bytes: number, multiplier?: Big) {
    this.bytes = bytes;
    this.multiplier = multiplier;
  }

  public getLayout(): BufferLayout.Layout {
    if (this.bytes === 1) {
      return BufferLayout.u8();
    }
    if (this.bytes === 2) {
      return BufferLayout.u16();
    }
    if (this.bytes === 3) {
      return BufferLayout.u24();
    }
    if (this.bytes === 4) {
      return BufferLayout.u32();
    }
    return new UintField(this.bytes);
  }

  public getBytes(): number {
    return this.bytes;
  }

  public getMultiplier(): Big | undefined {
    return this.multiplier;
  }
}

export abstract class Comparable<C extends Comparable<C>> {
  public eq(that?: C): boolean {
    if (!that) {
      return false;
    }
    return this.checkAndCompare(that) === 0;
  }

  public lt(that?: C): boolean {
    if (!that) {
      return false;
    }
    return this.checkAndCompare(that) < 0;
  }

  public lte(that?: C): boolean {
    if (!that) {
      return false;
    }
    return this.checkAndCompare(that) <= 0;
  }

  public gt(that?: C): boolean {
    if (!that) {
      return false;
    }
    return this.checkAndCompare(that) > 0;
  }

  public gte(that?: C): boolean {
    if (!that) {
      return false;
    }
    return this.checkAndCompare(that) >= 0;
  }

  protected abstract compare(that: C): Comparison;

  protected abstract isCompatibleWith(that: C): boolean;

  protected checkCompatible(that: C): void {
    assert(this.isCompatibleWith(that));
  }

  private checkAndCompare(that: C): Comparison {
    this.checkCompatible(that);
    return this.compare(that);
  }
}

export abstract class Numerical<N extends Numerical<N>> extends Comparable<N> {
  private static readonly BIG_ZERO = new Big(0);

  protected constructor() {
    super();
  }

  public static sum<D extends Numerical<D>>(a: D, b: D): D {
    return a.add(b);
  }

  public min(that: N): N {
    this.checkCompatible(that);
    if (this.getRaw().lte(that.getRaw())) {
      return this.replaceWithValue(this.getRaw());
    }
    return this.replaceWithValue(that.getRaw());
  }

  public max(that: N): N {
    this.checkCompatible(that);
    if (this.getRaw().gte(that.getRaw())) {
      return this.replaceWithValue(this.getRaw());
    }
    return this.replaceWithValue(that.getRaw());
  }

  public add(that: N): N {
    this.checkCompatible(that);
    return this.replaceWithValue(this.getRaw().add(that.getRaw()));
  }

  public subtract(that: N): N {
    this.checkCompatible(that);
    return this.replaceWithValue(this.getRaw().sub(that.getRaw()));
  }

  public multiply(pct: BigSource): N {
    return this.replaceWithValue(this.getRaw().mul(pct));
  }

  public divide(pct: BigSource): N {
    return this.replaceWithValue(this.getRaw().div(pct));
  }

  public compare(that: N): Comparison {
    return this.compareRaw(that.getRaw());
  }

  public isZero(): boolean {
    return this.getSignum() === 0;
  }

  public isPositive(): boolean {
    return this.getSignum() > 0;
  }

  public isNegative(): boolean {
    return this.getSignum() < 0;
  }

  public getSignum(): number {
    return this.compareRaw(Numerical.BIG_ZERO);
  }

  public abstract getRaw(): Big;

  public abstract replaceWithValue(value: BigSource): N;

  private compareRaw(raw: BigSource): Comparison {
    return this.getRaw().cmp(raw);
  }
}

export abstract class Decimal<D extends Decimal<D>> extends Numerical<D> {
  protected readonly raw: Big;

  protected constructor(raw: BigSource) {
    super();
    this.raw = new Big(raw);
  }

  public getRaw(): Big {
    return this.raw;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected isCompatibleWith(that: D): boolean {
    return true;
  }
}

export class BigField extends Field<Big> {
  private readonly type: BigType;

  private constructor(type: BigType, property: string) {
    super(type.getBytes(), property);
    this.type = type;
  }

  public static forType(type: BigType, property: string): BigField {
    return new BigField(type, property);
  }

  public decode(b: Uint8Array, offset?: number): Big {
    const bn = this.type.getLayout().decode(b, offset);
    const big = new Big(bn.toString());
    const multiplier = this.type.getMultiplier();
    if (!multiplier) {
      return big;
    }
    return big.div(multiplier);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class DecimalField<T extends Decimal<any>> extends Field<T> {
  private readonly delegate: BigField;

  protected constructor(type: BigType, property: string) {
    super(type.getBytes(), property);
    this.delegate = BigField.forType(type, property);
  }

  public decode(b: Uint8Array, offset?: number): T {
    return this.fromBig(this.delegate.decode(b, offset));
  }

  protected abstract fromBig(big: Big): T;
}

export class Percentage extends Decimal<Percentage> {
  private static PCT_BIP = new Percentage(0.0001);
  private static PCT_ZERO = new Percentage(0);
  private static PCT_HUNDRED = new Percentage(1);
  private static PCT_THOUSAND = new Percentage(10);

  private constructor(value: BigSource) {
    super(value);
  }

  public static zero(): Percentage {
    return Percentage.PCT_ZERO;
  }

  public static hundred(): Percentage {
    return Percentage.PCT_HUNDRED;
  }

  public static fromOneBased(oneBased: BigSource): Percentage {
    return Percentage.fromRaw(oneBased, false);
  }

  public static fromHundredBased(hundredBased: BigSource): Percentage {
    return Percentage.fromRaw(hundredBased, true);
  }

  public static fromRaw(raw: BigSource, isHundredBased: boolean): Percentage {
    const big = new Big(raw);
    if (!isHundredBased) {
      return new Percentage(big);
    }
    return new Percentage(big.div(100));
  }

  public static field(property: string): Field<Percentage> {
    return new PercentageField(true, property);
  }

  public isTrivial(): boolean {
    return this.lt(Percentage.PCT_BIP);
  }

  public isHundredPct(): boolean {
    return this.eq(Percentage.PCT_HUNDRED);
  }

  public toOneBasedNumber(dp: number): number {
    return this.raw.round(dp).toNumber();
  }

  public toHundredBasedNumber(dp: number): number {
    return this.raw.mul(100).round(dp, 0).toNumber();
  }

  public print(): string {
    if (this.gt(Percentage.PCT_THOUSAND)) {
      return this.raw.round(1, 1).toString() + "x"; // RoundHalfUp
    }
    return this.raw.mul(100).round(2, 1).toString() + "%"; // RoundHalfUp
  }

  public replaceWithValue(value: BigSource): Percentage {
    return new Percentage(value);
  }
}

class PercentageField extends DecimalField<Percentage> {
  private readonly isHundredBased: boolean;

  public constructor(isHundredBased: boolean, property: string) {
    super(BigType.U8, property);
    this.isHundredBased = isHundredBased;
  }

  protected fromBig(big: Big): Percentage {
    return Percentage.fromRaw(big, this.isHundredBased);
  }
}

export abstract class Ratio<R extends Ratio<R>> extends Comparable<R> {
  private readonly pct?: Percentage;

  protected constructor(pct?: Percentage) {
    super();
    this.pct = pct;
  }

  public isTrivial(): boolean {
    const pct = this.getPct();
    return !pct || pct.isTrivial();
  }

  public isPresent(): boolean {
    return !!this.pct;
  }

  public isPositive(): boolean {
    return !!this.getPct()?.isPositive();
  }

  public isNegative(): boolean {
    return !!this.getPct()?.isNegative();
  }

  public getUnchecked(): Big {
    if (!this.pct) {
      throw new Error("No value available");
    }

    return this.pct.getRaw();
  }

  public getPct(): Percentage | undefined {
    return this.pct;
  }

  public print(): string {
    return !this.pct ? "--" : this.pct.print();
  }

  public compare(that: R): Comparison {
    const thisPct = this.getPct();
    const thatPct = that.getPct();
    if (!thisPct || !thatPct) {
      return 0;
    }

    return thisPct.compare(thatPct);
  }

  public toString(): string {
    return this.print();
  }
}

export class ReserveUtilizationRatio extends Ratio<ReserveUtilizationRatio> {
  private readonly mintId: MintId;

  constructor(mintId: MintId, pct?: Percentage) {
    super(pct);
    this.mintId = mintId;
  }

  public static na(mintId: MintId): ReserveUtilizationRatio {
    return new ReserveUtilizationRatio(mintId);
  }

  public getMintId(): MintId {
    return this.mintId;
  }

  protected isCompatibleWith(that: ReserveUtilizationRatio): boolean {
    return this.mintId.equals(that.mintId);
  }
}

export abstract class Id extends PublicKey {
  public getAccess(type: AccessType): AccountMeta {
    return getAccess(this, type);
  }
}

export abstract class PublicKeyField<T extends PublicKey> extends BlobField<T> {
  protected constructor(property?: string) {
    super(MAX_SEED_LENGTH, property);
  }

  protected fromBuffer(buffer: Buffer): T {
    return this.fromPublicKey(new PublicKey(buffer));
  }

  protected abstract fromPublicKey(pubKey: PublicKey): T;
}

export class MintId extends Id {
  private constructor(key: PublicKey) {
    super(key);
  }

  public static native(): MintId {
    return MintId.of(NATIVE_MINT);
  }

  public static fromBase58(base58: string): MintId {
    return MintId.of(new PublicKey(base58));
  }

  public static of(key: PublicKey): MintId {
    return new MintId(key);
  }

  public static field(property: string): Field<MintId> {
    return new MintIdField(property);
  }

  public isNative(): boolean {
    return this.equals(NATIVE_MINT);
  }
}

class MintIdField extends PublicKeyField<MintId> {
  public constructor(property: string) {
    super(property);
  }

  protected fromPublicKey(pubKey: PublicKey): MintId {
    return MintId.of(pubKey);
  }
}




export class ReserveBorrowRate extends Ratio<ReserveBorrowRate> {
  private readonly mintId: MintId;

  constructor(mintId: MintId, pct?: Percentage) {
    super(pct);
    this.mintId = mintId;
  }

  static na(mintId: MintId): ReserveBorrowRate {
    return new ReserveBorrowRate(mintId);
  }

  public getMintId(): MintId {
    return this.mintId;
  }

  protected isCompatibleWith(that: ReserveBorrowRate): boolean {
    return this.mintId.equals(that.mintId);
  }
}

export class AssetPrice extends Decimal<AssetPrice> {
  private readonly mintId: MintId;

  private constructor(mintId: MintId, value: BigSource) {
    super(value);
    this.mintId = mintId;
  }

  public static of(mintId: MintId, value: BigSource): AssetPrice {
    return new AssetPrice(mintId, value);
  }

  public getMintId(): MintId {
    return this.mintId;
  }

  public addFee(pct: Percentage): AssetPrice {
    return this.multiply(new Big(1).add(pct.getRaw()));
  }

  public print(config: AssetConfig): string {
    const decimals = config.getPriceDecimals();
    return "$" + this.raw.round(decimals, 1).toFixed(decimals); // RoundHalfUp
  }

  public replaceWithValue(value: BigSource): AssetPrice {
    return new AssetPrice(this.getMintId(), value);
  }

  protected isCompatibleWith(that: AssetPrice): boolean {
    return this.getMintId().equals(that.getMintId());
  }
}

export class QuantityContext {
  readonly decimals: number;
  readonly multiplier: Big;

  private constructor(decimals: number, increment: Big) {
    this.decimals = decimals;
    this.multiplier = increment;
  }

  public static fromDecimals(decimals: number): QuantityContext {
    assert(Number.isInteger(decimals));
    assert(decimals >= 0);
    return new QuantityContext(decimals, new Big(10).pow(decimals));
  }
}

export abstract class WrappedDecimal<
  D extends Decimal<D>,
  W extends WrappedDecimal<D, W>
> extends Numerical<W> {
  private readonly wrapped: D;

  protected constructor(wrapped: D) {
    super();
    this.wrapped = wrapped;
  }

  public getRaw(): Big {
    return this.getWrapped().getRaw();
  }

  public getWrapped(): D {
    return this.wrapped;
  }

  public replaceWithValue(value: BigSource): W {
    return this.wrap(this.getWrapped().replaceWithValue(value));
  }

  protected abstract wrap(value: D): W;
}

export class Lamport extends Decimal<Lamport> {
  protected static readonly ZERO = new Lamport(0);
  protected static readonly ONE = new Lamport(1);
  protected static readonly MAX = new Lamport("18446744073709551615");

  private constructor(raw: BigSource) {
    super(raw);
  }

  public static zero(): Lamport {
    return Lamport.ZERO;
  }

  public static max(): Lamport {
    return Lamport.MAX;
  }

  public static of(raw: BigSource): Lamport {
    return new Lamport(raw);
  }

  public static field(type: BigType, property: string): Field<Lamport> {
    return new LamportField(type, property);
  }

  public isTrivial(): boolean {
    return this.lt(Lamport.ONE);
  }

  public isMax(): boolean {
    return this.eq(Lamport.MAX);
  }

  public toU64(): u64 {
    // eslint-disable-next-line new-cap
    return new u64(this.raw.toFixed(0, 0)); // RoundDown
  }

  public replaceWithValue(value: BigSource): Lamport {
    return Lamport.of(value);
  }
}

class LamportField extends DecimalField<Lamport> {
  public constructor(type: BigType, property: string) {
    super(type, property);
  }

  protected fromBig(big: Big): Lamport {
    return Lamport.of(big);
  }
}

export abstract class WrappedLamport<
  T extends WrappedLamport<T>
> extends WrappedDecimal<Lamport, T> {
  public isMax(): boolean {
    return this.getWrapped().isMax();
  }

  public toU64(): u64 {
    return this.getAmount().toU64();
  }

  public getAmount(): Lamport {
    return this.getWrapped();
  }
}

export abstract class Token<T extends Token<T>> extends WrappedLamport<T> {
  private readonly mintId: MintId;

  protected constructor(mintId: MintId, lamport: Lamport) {
    super(lamport);
    this.mintId = mintId;
  }

  public isNative(): boolean {
    return this.getMintId().isNative();
  }

  public getMintId(): MintId {
    return this.mintId;
  }

  protected isCompatibleWith(that: T): boolean {
    return this.mintId.equals(that.mintId);
  }
}

export class Apy extends Ratio<Apy> {
  private static APY_NA = new Apy();

  private constructor(pct?: Percentage) {
    super(pct);
  }

  public static na(): Apy {
    return Apy.APY_NA;
  }

  public static of(raw: BigSource): Apy {
    return new Apy(Percentage.fromOneBased(raw));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected isCompatibleWith(that: Apy): boolean {
    return true;
  }
}

export class AssetExchangeRate extends Ratio<AssetExchangeRate> {
  private readonly shareMintId: MintId;
  private readonly assetMintId: MintId;

  constructor(shareMintId: MintId, assetMintId: MintId, pct?: Percentage) {
    super(pct);
    this.shareMintId = shareMintId;
    this.assetMintId = assetMintId;
  }

  public getShareMintId(): MintId {
    return this.shareMintId;
  }

  public getAssetMintId(): MintId {
    return this.assetMintId;
  }

  protected isCompatibleWith(that: AssetExchangeRate): boolean {
    return (
      this.shareMintId.equals(that.shareMintId) &&
      this.assetMintId.equals(that.assetMintId)
    );
  }
}

export class Share extends Token<Share> {
  private constructor(mintId: MintId, lamport: Lamport) {
    super(mintId, lamport);
  }

  public static zero(mintId: MintId): Share {
    return Share.of(mintId, Lamport.zero());
  }

  public static max(mintId: MintId): Share {
    return Share.of(mintId, Lamport.max());
  }

  public static fromTokenAccount(account: TokenAccount): Share {
    return Share.of(account.getMintId(), account.getAmount());
  }

  public static of(mintId: MintId, lamport: Lamport): Share {
    return new Share(mintId, lamport);
  }

  public toAsset(exchangeRatio: AssetExchangeRate): Asset {
    assert(this.getMintId().equals(exchangeRatio.getShareMintId()));

    if (!exchangeRatio.isPresent()) {
      return Asset.zero(exchangeRatio.getAssetMintId());
    }

    const pct = exchangeRatio.getUnchecked();
    const lamport = Lamport.of(this.getRaw().div(pct).round(0));
    return Asset.of(exchangeRatio.getAssetMintId(), lamport);
  }

  protected wrap(value: Lamport): Share {
    return Share.of(this.getMintId(), value);
  }
}

export class Asset extends Token<Asset> {
  public static readonly MIN_NATIVE_LAMPORT = Asset.native(
    Lamport.of(5_000_000)
  );

  private static SIGNIFICANT_DIGITS = 6;
  private static LARGE_THRESHOLD = new Big(10).pow(6).toNumber();
  private static FORMATTER_NORMAL = new Intl.NumberFormat("en-US", {
    style: "decimal",
    maximumSignificantDigits: Asset.SIGNIFICANT_DIGITS,
  });
  private static FORMATTER_LARGE = new Intl.NumberFormat("en-US", {
    style: "decimal",
    maximumFractionDigits: 0,
  });

  private constructor(mintId: MintId, lamport: Lamport) {
    super(mintId, lamport);
  }

  public static fromString(
    str: string,
    mintId: MintId,
    context: QuantityContext
  ): Asset {
    const increment = context.multiplier;
    const lamport = Lamport.of(new Big(str).mul(increment).round(0, 0));
    return new Asset(mintId, lamport);
  }

  public static zero(mintId: MintId): Asset {
    return Asset.of(mintId);
  }

  public static max(mintId: MintId): Asset {
    return Asset.of(mintId, Lamport.max());
  }

  public static native(lamport: Lamport): Asset {
    return Asset.of(MintId.native(), lamport);
  }

  public static fromTokenAccount(account: TokenAccount): Asset {
    return Asset.of(account.getMintId(), account.getAmount());
  }

  public static of(mintId: MintId, lamport?: Lamport): Asset {
    return new Asset(mintId, lamport || Lamport.zero());
  }

  public isNative(): boolean {
    return this.getMintId().isNative();
  }

  public toValue(
    price: AssetPrice,
    quantityContext: QuantityContext
  ): QuoteValue {
    assert(
      this.getMintId().equals(price.getMintId()),
      `asset id: ${this.getMintId()} price id: ${price.getMintId()}`
    );
    if (!price) {
      return QuoteValue.zero();
    }

    const increment = quantityContext.multiplier;
    const value = this.getRaw().div(increment).mul(price.getRaw());
    return QuoteValue.of(value);
  }

  public toInterest(supplyApy: Apy): Asset {
    if (!supplyApy.isPresent()) {
      return Asset.zero(this.getMintId());
    }

    const lamport = Lamport.of(this.getRaw().mul(supplyApy.getUnchecked()));
    return Asset.of(this.getMintId(), lamport);
  }

  public toShare(exchangeRatio: AssetExchangeRate): Share {
    assert(this.getMintId().equals(exchangeRatio.getAssetMintId()));

    if (!exchangeRatio.isPresent()) {
      return Share.zero(exchangeRatio.getShareMintId());
    }

    const lamport = Lamport.of(
      this.getRaw().mul(exchangeRatio.getUnchecked()).round(0)
    );
    return Share.of(exchangeRatio.getShareMintId(), lamport);
  }

  public addFee(pct: Percentage): Asset {
    return this.multiply(new Big(1).add(pct.getRaw()));
  }

  public toNumber(context: QuantityContext): number {
    const multiplier = context.multiplier;
    const decimals = context.decimals;
    return this.getRaw().div(multiplier).round(decimals, 0).toNumber();
  }

  public plain(context: QuantityContext): string {
    return this.toLimitRoundNumber(context).toString();
  }

  public toLimitRoundNumber(context: QuantityContext): number {
    const multiplier = context.multiplier;
    const decimals = context.decimals;
    return this.getRaw()
      .div(multiplier)
      .round(Math.min(decimals, 6), 0)
      .toNumber();
  }

  public print(context: QuantityContext | undefined, symbol?: string): string {
    if (!context) {
      return "--";
    }

    const num = this.toLimitRoundNumber(context);
    const formatted =
      num > Asset.LARGE_THRESHOLD
        ? Asset.FORMATTER_LARGE.format(num)
        : Asset.FORMATTER_NORMAL.format(num);
    if (!symbol) {
      return formatted;
    }
    return formatted + " " + symbol;
  }

  protected wrap(value: Lamport): Asset {
    return Asset.of(this.getMintId(), value);
  }
}

export abstract class Value<V extends Value<V>> extends Decimal<V> {
  // eslint-disable-next-line new-cap
  private static FORMATTER = Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  protected constructor(raw: BigSource) {
    super(raw);
  }

  public toAsset(price: AssetPrice, context: QuantityContext): Asset {
    const lamport = Lamport.of(
      this.raw.div(price.getRaw()).mul(context.multiplier)
    );
    return Asset.of(price.getMintId(), lamport);
  }

  public toNumber(): number {
    return this.raw.round(2, 0).toNumber();
  }

  public print(): string {
    return Value.FORMATTER.format(this.toNumber());
  }

  public toString(): string {
    return this.print();
  }
}

export class MarginRatio extends Ratio<MarginRatio> {
  private static MARGIN_RATIO_NA = new MarginRatio();

  private constructor(pct?: Percentage) {
    super(pct);
  }

  public static of(pct?: Percentage): MarginRatio {
    if (!pct) {
      return MarginRatio.na();
    }
    return new MarginRatio(pct);
  }

  public static na(): MarginRatio {
    return MarginRatio.MARGIN_RATIO_NA;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected isCompatibleWith(that: MarginRatio): boolean {
    return true;
  }
}

export class Margin extends Value<Margin> {
  private static MARGIN_ZERO = new Margin(0);

  private constructor(value: BigSource) {
    super(value);
  }

  public static of(raw: Big): Margin {
    return new Margin(raw);
  }

  public static zero(): Margin {
    return Margin.MARGIN_ZERO;
  }

  public static field(property: string): Field<Margin> {
    return new MarginField(property);
  }

  public toCollateralValue(loanToValue: Percentage): QuoteValue {
    return QuoteValue.of(this.getRaw().div(loanToValue.getRaw()));
  }

  public toRatioAgainst(threshold: Margin): MarginRatio {
    if (threshold.isZero()) {
      return MarginRatio.na();
    }

    return MarginRatio.of(
      Percentage.fromOneBased(this.getRaw().div(threshold.raw))
    );
  }

  public replaceWithValue(value: BigSource): Margin {
    return new Margin(value);
  }
}

class MarginField extends DecimalField<Margin> {
  public constructor(property: string) {
    super(BigType.D128, property);
  }

  protected fromBig(big: Big): Margin {
    return Margin.of(big);
  }
}

export class ValueRatio extends Ratio<ValueRatio> {
  private static VALUE_RATIO_NA = new ValueRatio();

  private constructor(pct?: Percentage) {
    super(pct);
  }

  public static of(pct?: Percentage): ValueRatio {
    if (!pct) {
      return ValueRatio.na();
    }
    return new ValueRatio(pct);
  }

  public static na(): ValueRatio {
    return ValueRatio.VALUE_RATIO_NA;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected isCompatibleWith(that: ValueRatio): boolean {
    return true;
  }
}

export class QuoteValue extends Value<QuoteValue> {
  private static readonly QUOTE_VALUE_ZERO = new QuoteValue(0);

  private constructor(raw: BigSource) {
    super(raw);
  }

  public static of(raw: BigSource): QuoteValue {
    const result = new QuoteValue(raw);
    if (result.isZero()) {
      return QuoteValue.zero();
    }

    return result;
  }

  public static zero(): QuoteValue {
    return QuoteValue.QUOTE_VALUE_ZERO;
  }

  public static field(property: string): Field<QuoteValue> {
    return new QuoteValueField(property);
  }

  public toCollateralMargin(loanToValue: Percentage): Margin {
    return Margin.of(this.getRaw().mul(loanToValue.getRaw()));
  }

  public toLoanMargin(): Margin {
    return Margin.of(this.getRaw());
  }

  public toRatioAgainst(threshold: QuoteValue): ValueRatio {
    if (threshold.isZero()) {
      return ValueRatio.na();
    }
    const pct = Percentage.fromOneBased(this.getRaw().div(threshold.raw));
    return ValueRatio.of(pct);
  }

  public replaceWithValue(value: BigSource): QuoteValue {
    return new QuoteValue(value);
  }
}

class QuoteValueField extends DecimalField<QuoteValue> {
  public constructor(property: string) {
    super(BigType.D128, property);
  }

  protected fromBig(big: Big): QuoteValue {
    return QuoteValue.of(big);
  }
}



export class WalletId extends Id {
  private constructor(key: PublicKey) {
    super(key);
  }

  public static fromBase58(base58: string): WalletId {
    return WalletId.of(new PublicKey(base58));
  }

  public static of(key: PublicKey): WalletId {
    return new WalletId(key);
  }

  public static field(property: string): Field<WalletId> {
    return new WalletIdField(property);
  }
}

class WalletIdField extends PublicKeyField<WalletId> {
  public constructor(property: string) {
    super(property);
  }

  protected fromPublicKey(pubKey: PublicKey): WalletId {
    return WalletId.of(pubKey);
  }
}



export class TokenAccountId extends Id {
  private constructor(key: PublicKey) {
    super(key);
  }

  public static native(walletId: WalletId): TokenAccountId {
    return TokenAccountId.of(walletId);
  }

  public static of(pubKey: PublicKey): TokenAccountId {
    return new TokenAccountId(pubKey);
  }

  public static field(property: string): Field<TokenAccountId> {
    return new SplAccountIdField(property);
  }
}

class SplAccountIdField extends PublicKeyField<TokenAccountId> {
  public constructor(property: string) {
    super(property);
  }

  protected fromPublicKey(pubKey: PublicKey): TokenAccountId {
    return TokenAccountId.of(pubKey);
  }
}

export interface Parsed<I extends Id> {
  getId: () => I;
}

export type RawData = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
};

export class TokenAccount implements Parsed<TokenAccountId> {
  private readonly splAccountId: TokenAccountId;
  private readonly walletId: WalletId;
  private readonly mintId: MintId;
  private readonly amount: Lamport;

  public constructor(
    balanceId: TokenAccountId,
    walletId: WalletId,
    mintId: MintId,
    amount: Lamport
  ) {
    this.splAccountId = balanceId;
    this.walletId = walletId;
    this.mintId = mintId;
    this.amount = amount;
  }

  public static forNative(raw: RawData): TokenAccount {
    return new TokenAccount(
      TokenAccountId.of(raw.pubkey),
      WalletId.of(raw.pubkey),
      MintId.native(),
      Lamport.of(raw.account.lamports)
    );
  }

  public static fromRaw(raw: RawData): TokenAccount {
    const buffer = Buffer.from(raw.account.data);
    const accountInfo = AccountLayout.decode(buffer);

    accountInfo.mint = new PublicKey(accountInfo.mint);
    accountInfo.owner = new PublicKey(accountInfo.owner);
    accountInfo.amount = u64.fromBuffer(accountInfo.amount);

    return new TokenAccount(
      TokenAccountId.of(raw.pubkey),
      WalletId.of(accountInfo.owner),
      MintId.of(accountInfo.mint),
      Lamport.of(accountInfo.amount)
    );
  }

  public getId(): TokenAccountId {
    return this.getSplAccountId();
  }

  public getSplAccountId(): TokenAccountId {
    return this.splAccountId;
  }

  public getWalletId(): WalletId {
    return this.walletId;
  }

  public isNative(): boolean {
    return this.getMintId().isNative();
  }

  public getMintId(): MintId {
    return this.mintId;
  }

  public isPositive(): boolean {
    return this.amount.isPositive();
  }

  public getAmount(): Lamport {
    return this.amount;
  }
}



export class PortProfileId extends Id {
  private constructor(key: PublicKey) {
    super(key);
  }

  public static of(pubKey: PublicKey): PortProfileId {
    return new PortProfileId(pubKey);
  }

  public static fromBase58(base58: string): PortProfileId {
    return PortProfileId.of(new PublicKey(base58));
  }

  public static field(property: string): Field<PortProfileId> {
    return new PortProfileIdField(property);
  }
}

class PortProfileIdField extends PublicKeyField<PortProfileId> {
  public constructor(property: string) {
    super(property);
  }

  protected fromPublicKey(pubKey: PublicKey): PortProfileId {
    return PortProfileId.of(pubKey);
  }
}

export class ReserveId extends Id {
  private constructor(key: PublicKey) {
    super(key);
  }

  public static fromBase58(base58: string): ReserveId {
    return ReserveId.of(new PublicKey(base58));
  }

  public static of(pubKey: PublicKey): ReserveId {
    return new ReserveId(pubKey);
  }

  public static field(property: string): Field<ReserveId> {
    return new ReserveIdField(property);
  }
}

class ReserveIdField extends PublicKeyField<ReserveId> {
  public constructor(property: string) {
    super(property);
  }

  protected fromPublicKey(pubKey: PublicKey): ReserveId {
    return ReserveId.of(pubKey);
  }
}

export abstract class ProfileEntry<
  T extends ProfileEntry<T>
> extends WrappedLamport<T> {
  private readonly reserveId: ReserveId;

  protected constructor(reserveId: ReserveId, amount: Lamport) {
    super(amount);
    this.reserveId = reserveId;
  }

  public getReserveId(): ReserveId {
    return this.reserveId;
  }

  protected isCompatibleWith(that: T): boolean {
    return this.getReserveId().equals(that.getReserveId());
  }
}

export class Collateral extends ProfileEntry<Collateral> {
  public constructor(reserveId: ReserveId, amount: Lamport) {
    super(reserveId, amount);
  }

  public static zero(reserveId: ReserveId): Collateral {
    return new Collateral(reserveId, Lamport.zero());
  }

  protected wrap(value: Lamport): Collateral {
    return new Collateral(this.getReserveId(), value);
  }
}

export class ExchangeRate extends Decimal<ExchangeRate> {
  private static ZERO = ExchangeRate.of(0);

  private constructor(value: BigSource) {
    super(value);
  }

  public static zero(): ExchangeRate {
    return ExchangeRate.ZERO;
  }

  public static of(raw: BigSource): ExchangeRate {
    return new ExchangeRate(raw);
  }

  public static field(type: BigType, property: string): Field<ExchangeRate> {
    return new ExchangeRateField(type, property);
  }

  public replaceWithValue(value: BigSource): ExchangeRate {
    return ExchangeRate.of(value);
  }
}

class ExchangeRateField extends DecimalField<ExchangeRate> {
  public constructor(type: BigType, property: string) {
    super(type, property);
  }

  protected fromBig(big: Big): ExchangeRate {
    return ExchangeRate.of(big);
  }
}

export class Loan extends ProfileEntry<Loan> {
  private readonly cumulativeBorrowRate: ExchangeRate;

  public constructor(
    reserveId: ReserveId,
    amount: Lamport,
    cumulativeBorrowRate: ExchangeRate
  ) {
    super(reserveId, amount);
    this.cumulativeBorrowRate = cumulativeBorrowRate;
  }

  public static zero(reserve: ReserveInfo): Loan {
    return new Loan(
      reserve.getReserveId(),
      Lamport.zero(),
      reserve.asset.getCumulativeBorrowRate()
    );
  }

  public accrueInterest(newCumulativeBorrowRate: ExchangeRate): Loan {
    const compoundedInterestRate = newCumulativeBorrowRate.divide(
      this.cumulativeBorrowRate.getRaw()
    );
    const newAmount = this.getAmount().multiply(
      compoundedInterestRate.getRaw()
    );
    return new Loan(this.getReserveId(), newAmount, newCumulativeBorrowRate);
  }

  public getCumulativeBorrowRate(): ExchangeRate {
    return this.cumulativeBorrowRate;
  }

  protected wrap(value: Lamport): Loan {
    return new Loan(this.getReserveId(), value, this.cumulativeBorrowRate);
  }
}

export class PortProfile implements Parsed<PortProfileId> {
  private readonly profileId: PortProfileId;
  private readonly collaterals: Collateral[];
  private readonly loans: Loan[];
  private readonly loanMargin: Margin;
  private readonly initialMargin: Margin;
  private readonly maintenanceMargin: Margin;

  // use in api-server
  private readonly owner: PublicKey | undefined;
  private readonly depositedValue: QuoteValue | undefined;

  private constructor(
    profileId: PortProfileId,
    collaterals: Collateral[],
    loans: Loan[],
    loanMargin: Margin,
    initialMargin: Margin,
    maintenanceMargin: Margin,
    owner?: PublicKey,
    depositedValue?: QuoteValue
  ) {
    this.profileId = profileId;
    this.collaterals = collaterals;
    this.loans = loans;
    this.loanMargin = loanMargin;
    this.initialMargin = initialMargin;
    this.maintenanceMargin = maintenanceMargin;
    this.owner = owner;
    this.depositedValue = depositedValue;
  }

  public static newAccount(profileId: PortProfileId): PortProfile {
    return new PortProfile(
      profileId,
      [],
      [],
      Margin.zero(),
      Margin.zero(),
      Margin.zero()
    );
  }

  public static fromRaw(raw: RawData): PortProfile {
    const profileId = PortProfileId.of(raw.pubkey);
    // eslint-disable-next-line new-cap
    const proto = PortProfileParser(raw.account.data);

    const collaterals = proto.deposits.map(
      (c) => new Collateral(ReserveId.of(c.depositReserve), c.depositedAmount)
    );
    const loans = proto.borrows.map(
      (l) =>
        new Loan(
          l.borrowReserve,
          l.borrowedAmountWads,
          l.cumulativeBorrowRateWads
        )
    );
    const loanMargin = proto.borrowedValue;
    const initialMargin = proto.allowedBorrowValue;
    const maintenanceMargin = proto.unhealthyBorrowValue;
    const depositedValue = proto.depositedValue;
    const owner = proto.owner;
    return new PortProfile(
      profileId,
      collaterals,
      loans,
      loanMargin,
      initialMargin,
      maintenanceMargin,
      owner,
      depositedValue
    );
  }

  public getDepositedValue(): QuoteValue | undefined {
    return this.depositedValue;
  }

  public getOwner(): PublicKey | undefined {
    return this.owner;
  }

  public getId(): PortProfileId {
    return this.getProfileId();
  }

  public getProfileId(): PortProfileId {
    return this.profileId;
  }

  public getCollateral(reserveId: ReserveId): Collateral | undefined {
    return this.getCollaterals().find((c) =>
      c.getReserveId().equals(reserveId)
    );
  }

  public getCollateralReserveIds(): ReserveId[] {
    return this.getCollaterals().map((c) => c.getReserveId());
  }

  public getCollaterals(): Collateral[] {
    return this.collaterals;
  }

  public getLoan(reserveId: ReserveId): Loan | undefined {
    return this.getLoans().find((l) => l.getReserveId().equals(reserveId));
  }

  public getLoanReserveIds(): ReserveId[] {
    return this.getLoans().map((l) => l.getReserveId());
  }

  public getLoans(): Loan[] {
    return this.loans;
  }

  public getLoanMargin(): Margin {
    return this.loanMargin;
  }

  public getInitialMargin(): Margin {
    return this.initialMargin;
  }

  public getMaintenanceMargin(): Margin {
    return this.maintenanceMargin;
  }

  public getRiskFactor(): MarginRatio {
    return this.getLoanMargin().toRatioAgainst(this.getMaintenanceMargin());
  }

  public getLoanToValue(): MarginRatio {
    return this.getLoanMargin().toRatioAgainst(this.getInitialMargin());
  }
}

export const Layout_publicKey = (property: string): BufferLayout.Layout => {
  const publicKeyLayout = BufferLayout.blob(
    32,
    property
  ) as BufferLayout.Layout;

  const _decode = publicKeyLayout.decode.bind(publicKeyLayout);
  const _encode = publicKeyLayout.encode.bind(publicKeyLayout);

  publicKeyLayout.decode = (buffer: Buffer, offset: number) => {
    const data = _decode(buffer, offset);
    return new PublicKey(data);
  };

  publicKeyLayout.encode = (key: PublicKey, buffer: Buffer, offset: number) => {
    return _encode(key.toBuffer(), buffer, offset);
  };

  return publicKeyLayout;
};

export const Layout_uint64 = (property = "uint64"): BufferLayout.Layout => {
  return Layout__uint(8, property);
};

export const Layout_uint128 = (property = "uint128"): BufferLayout.Layout => {
  return Layout__uint(16, property);
};

const Layout__uint = (length: number, property: string): BufferLayout.Layout => {
  const layout = BufferLayout.blob(length, property) as BufferLayout.Layout;

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
    if (b.length !== length) {
      const zeroPad = Buffer.alloc(length);
      b.copy(zeroPad);
      b = zeroPad;
    }

    return _encode(b, buffer, offset);
  };

  return layout;
};

export const SlotInfoLayout = (property: string): BufferLayout.Structure =>
  BufferLayout.struct(
    [Layout_uint64("slot"), BufferLayout.u8("stale")],
    property
  );

export interface SlotInfo {
  slot: BN;
  stale: boolean;
}

export const ObligationLayout = BufferLayout.struct([
  BufferLayout.u8("version"),
  // eslint-disable-next-line new-cap
  SlotInfoLayout("lastUpdate"),
  Layout_publicKey("lendingMarket"),
  WalletId.field("owner"),
  QuoteValue.field("depositedValue"),
  Margin.field("borrowedValue"),
  Margin.field("allowedBorrowValue"),
  Margin.field("unhealthyBorrowValue"),

  BufferLayout.u8("depositsLen"),
  BufferLayout.u8("borrowsLen"),
  BufferLayout.blob(776, "dataFlat"),
]);

export const ObligationCollateralLayout = BufferLayout.struct([
  ReserveId.field("depositReserve"),
  Lamport.field(BigType.U64, "depositedAmount"),
  QuoteValue.field("marketValue"),
]);

export const ObligationLiquidityLayout = BufferLayout.struct([
  ReserveId.field("borrowReserve"),
  ExchangeRate.field(BigType.D128, "cumulativeBorrowRateWads"),
  Lamport.field(BigType.D128, "borrowedAmountWads"),
  QuoteValue.field("marketValue"),
]);

export interface ProtoObligation {
  version: number;
  lastUpdate: SlotInfo;
  lendingMarket: PublicKey;
  owner: WalletId;
  depositedValue: QuoteValue;
  borrowedValue: Margin;
  allowedBorrowValue: Margin;
  unhealthyBorrowValue: Margin;
  depositsLen: number;
  borrowsLen: number;
  dataFlat: Buffer;
}

export interface PortProfileData {
  version: number;
  lastUpdate: SlotInfo;
  lendingMarket: PublicKey;
  owner: PublicKey;
  deposits: PortProfileCollateralData[];
  borrows: PortProfileLoanData[];
  depositedValue: QuoteValue;
  borrowedValue: Margin;
  allowedBorrowValue: Margin;
  unhealthyBorrowValue: Margin;
}

export interface PortProfileCollateralData {
  depositReserve: ReserveId;
  depositedAmount: Lamport;
  marketValue: QuoteValue;
}

export interface PortProfileLoanData {
  borrowReserve: ReserveId;
  cumulativeBorrowRateWads: ExchangeRate;
  borrowedAmountWads: Lamport;
  marketValue: QuoteValue;
}

export const PORT_PROFILE_DATA_SIZE = ObligationLayout.span;

const PortProfileParser = (buffer: Buffer) => {
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

  const depositsBuffer = dataFlat.slice(
    0,
    depositsLen * ObligationCollateralLayout.span
  );
  const deposits = BufferLayout.seq(
    ObligationCollateralLayout,
    depositsLen
  ).decode(depositsBuffer) as PortProfileCollateralData[];

  const borrowsBuffer = dataFlat.slice(
    depositsBuffer.length,
    depositsBuffer.length + borrowsLen * ObligationLiquidityLayout.span
  );
  const borrows = BufferLayout.seq(
    ObligationLiquidityLayout,
    borrowsLen
  ).decode(borrowsBuffer) as PortProfileLoanData[];

  return {
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
  } as PortProfileData;
};

export interface ReserveData {
  version: number;
  lastUpdate: SlotInfo;
  lendingMarket: PublicKey;
  liquidity: ReserveLiquidity;
  collateral: ReserveCollateral;
  config: ReserveConfig;
}

export interface ReserveLiquidity {
  mintPubkey: MintId;
  mintDecimals: number;
  supplyPubkey: TokenAccountId;
  feeReceiver: TokenAccountId;
  oracleOption: number;
  oraclePubkey: PublicKey;
  availableAmount: Lamport;
  borrowedAmountWads: Lamport;
  cumulativeBorrowRateWads: ExchangeRate;
  marketPrice: Big;
}

export interface ReserveCollateral {
  mintPubkey: MintId;
  mintTotalSupply: Lamport;
  supplyPubkey: TokenAccountId;
}

// only use in create-reserve instruction.
export interface ReserveConfigProto {
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
  stakingPoolOption: number;
  stakingPool: PublicKey;
}

// only use in create-reserve instruction.
export const ReserveConfigProtoLayout = (
  property: string
): BufferLayout.Structure =>
  BufferLayout.struct(
    [
      BufferLayout.u8("optimalUtilizationRate"),
      BufferLayout.u8("loanToValueRatio"),
      BufferLayout.u8("liquidationBonus"),
      BufferLayout.u8("liquidationThreshold"),
      BufferLayout.u8("minBorrowRate"),
      BufferLayout.u8("optimalBorrowRate"),
      BufferLayout.u8("maxBorrowRate"),
      ReserveFeesProtoLayout("fees"),
      BufferLayout.u8("stakingPoolOption"),
      Layout_publicKey("stakingPool"),
    ],
    property
  );

// only use in create-reserve instruction.
const ReserveFeesProtoLayout = (property: string): BufferLayout.Structure =>
  BufferLayout.struct(
    [
      Layout_uint64("borrowFeeWad"),
      Layout_uint64("flashLoanFeeWad"),
      BufferLayout.u8("hostFeePercentage"),
    ],
    property
  );

export class StakingPoolId extends Id {
  private constructor(key: PublicKey) {
    super(key);
  }

  public static fromBase58(base58: string): StakingPoolId {
    return StakingPoolId.of(new PublicKey(base58));
  }

  public static of(key: PublicKey): StakingPoolId {
    return new StakingPoolId(key);
  }

  public static field(property: string): Field<StakingPoolId> {
    return new StakingPoolIdField(property);
  }
}

class StakingPoolIdField extends PublicKeyField<StakingPoolId> {
  public constructor(property: string) {
    super(property);
  }

  protected fromPublicKey(pubKey: PublicKey): StakingPoolId {
    return StakingPoolId.of(pubKey);
  }
}


export interface ReserveConfig {
  optimalUtilizationRate: Percentage;
  loanToValueRatio: Percentage;
  liquidationBonus: Percentage;
  liquidationThreshold: Percentage;
  minBorrowRate: Percentage;
  optimalBorrowRate: Percentage;
  maxBorrowRate: Percentage;
  fees: {
    borrowFeeWad: Big;
    flashLoanFeeWad: Big;
    hostFeePercentage: number;
  };
  stakingPoolId: StakingPoolId | undefined;
}

export const ReserveLiquidityLayout = (
  property: string
): BufferLayout.Structure =>
  BufferLayout.struct(
    [
      MintId.field("mintPubkey"),
      BufferLayout.u8("mintDecimals"),
      TokenAccountId.field("supplyPubkey"),
      TokenAccountId.field("feeReceiver"),
      BufferLayout.u32("oracleOption"),
      Layout_publicKey("oraclePubkey"),
      Lamport.field(BigType.U64, "availableAmount"),
      Lamport.field(BigType.D128, "borrowedAmountWads"),
      ExchangeRate.field(BigType.D128, "cumulativeBorrowRateWads"),
      BigField.forType(BigType.D128, "marketPrice"),
    ],
    property
  );

export const ReserveCollateralLayout = (
  property: string
): BufferLayout.Structure =>
  BufferLayout.struct(
    [
      MintId.field("mintPubkey"),
      Lamport.field(BigType.U64, "mintTotalSupply"),
      TokenAccountId.field("supplyPubkey"),
    ],
    property
  );

export const ReserveFeesLayout = (property: string): BufferLayout.Structure =>
  BufferLayout.struct(
    [
      BigField.forType(BigType.D64, "borrowFeeWad"),
      BigField.forType(BigType.D64, "flashLoanFeeWad"),
      BufferLayout.u8("hostFeePercentage"),
    ],
    property
  );

export class Optional<T> extends Field<T | undefined> {
  private readonly delegate: Field<T>;

  private constructor(field: Field<T>) {
    super(field.span + 1, field.property);
    this.delegate = field;
  }

  public static of<T>(field: Field<T>): Optional<T> {
    return new Optional(field);
  }

  public decode(b: Uint8Array, offset?: number): T | undefined {
    const flag = BufferLayout.u8().decode(b, offset);
    if (!flag) {
      return undefined;
    }

    return this.delegate.decode(b, (offset || 0) + 1);
  }
}

export const ReserveConfigLayout = (property: string): BufferLayout.Structure =>
  BufferLayout.struct(
    [
      Percentage.field("optimalUtilizationRate"),
      Percentage.field("loanToValueRatio"),
      Percentage.field("liquidationBonus"),
      Percentage.field("liquidationThreshold"),
      Percentage.field("minBorrowRate"),
      Percentage.field("optimalBorrowRate"),
      Percentage.field("maxBorrowRate"),
      ReserveFeesLayout("fees"),
      Optional.of(StakingPoolId.field("stakingPoolId")),
    ],
    property
  );

export const ReserveLayout = BufferLayout.struct([
  BufferLayout.u8("version"),
  SlotInfoLayout("lastUpdate"),
  Layout_publicKey("lendingMarket"),
  ReserveLiquidityLayout("liquidity"),
  ReserveCollateralLayout("collateral"),
  ReserveConfigLayout("config"),
  BufferLayout.blob(215, "padding2"),
]);

export const isReserve = (info: AccountInfo<Buffer>): boolean => {
  return info.data.length === ReserveLayout.span;
};

export const RESERVE_DATA_SIZE = ReserveLayout.span;

const SLOT_PER_SECOND = 2;
const SLOT_PER_YEAR = SLOT_PER_SECOND * 3600 * 24 * 365;

export class Slot extends Decimal<Slot> {
  private static SLOT_ZERO = Slot.of(0);

  private constructor(value: BigSource) {
    super(value);
  }

  public static zero(): Slot {
    return Slot.SLOT_ZERO;
  }

  public static of(raw: BigSource): Slot {
    return new Slot(raw);
  }

  public static field(property: string): Field<Slot> {
    return new SlotField(property);
  }

  public replaceWithValue(value: BigSource): Slot {
    return Slot.of(value);
  }
}

class SlotField extends DecimalField<Slot> {
  public constructor(property: string) {
    super(BigType.U64, property);
  }

  protected fromBig(big: Big): Slot {
    return Slot.of(big);
  }
}

export class AuthorityId extends Id {
  private constructor(pubKey: PublicKey) {
    super(pubKey);
  }

  public static fromBase58(base58: string): AuthorityId {
    return AuthorityId.of(new PublicKey(base58));
  }

  public static of(pubKey: PublicKey): AuthorityId {
    return new AuthorityId(pubKey);
  }

  public static field(property: string): Field<AuthorityId> {
    return new AuthorityIdField(property);
  }
}

class AuthorityIdField extends PublicKeyField<AuthorityId> {
  public constructor(property: string) {
    super(property);
  }

  protected fromPublicKey(pubKey: PublicKey): AuthorityId {
    return AuthorityId.of(pubKey);
  }
}

export const StakingPoolLayout = BufferLayout.struct([
  BufferLayout.u8("version"),
  AuthorityId.field("ownerAuthority"),
  AuthorityId.field("adminAuthority"),
  TokenAccountId.field("rewardTokenPool"),
  Slot.field("lastUpdate"),
  Slot.field("endTime"),
  Slot.field("duration"),
  Slot.field("earliestRewardClaimTime"),
  ExchangeRate.field(BigType.D128, "ratePerSlot"),
  ExchangeRate.field(BigType.D128, "cumulativeRate"),
  Lamport.field(BigType.U64, "poolSize"),
  BufferLayout.u8("bumpSeedStakingProgram"),
  BufferLayout.u8("subRewardTokenPoolOption"),
  TokenAccountId.field("subRewardTokenPool"),
  BufferLayout.u8("subRatePerSlotOption"),
  ExchangeRate.field(BigType.D128, "subRatePerSlot"),
  BufferLayout.u8("subCumulativeRateOption"),
  ExchangeRate.field(BigType.D128, "subCumulativeRate"),
  BufferLayout.blob(32, "reserveField3"),
  BufferLayout.blob(29, "reserveField4"),
]);

export interface StakingPoolProto {
  version: number;
  ownerAuthority: AuthorityId;
  adminAuthority: AuthorityId;
  rewardTokenPool: TokenAccountId;
  lastUpdate: Slot;
  endTime: Slot;
  earliestRewardClaimTime: Slot;
  duration: Slot;
  ratePerSlot: ExchangeRate;
  cumulativeRate: ExchangeRate;
  poolSize: Lamport;
  bumpSeedStakingProgram: number;
  subRewardTokenPoolOption: number;
  subRewardTokenPool: TokenAccountId;
  subRatePerSlotOption: number;
  subRatePerSlot: ExchangeRate;
  subCumulativeRateOption: number;
  subCumulativeRate: ExchangeRate;
}

export const STAKING_POOL_DATA_SIZE = StakingPoolLayout.span;

export class StakingPool implements Parsed<StakingPoolId> {
  private readonly stakingPoolId: StakingPoolId;
  private readonly rewardTokenPool: TokenAccountId;
  private readonly subRewardTokenPool?: TokenAccountId;
  private readonly lastUpdate: Slot;
  private readonly endTime: Slot;
  private readonly earliestRewardClaimTime: Slot;
  private readonly duration: Slot;
  private readonly ratePerSlot: ExchangeRate;
  private readonly subRatePerSlot?: ExchangeRate;
  private readonly cumulativeRate: ExchangeRate;
  private readonly subCumulativeRate?: ExchangeRate;
  private readonly poolSize: Lamport;

  // use in api-server
  private readonly ownerAuthority: AuthorityId;
  private readonly adminAuthority: AuthorityId;

  private constructor(
    stakingPoolId: StakingPoolId,
    rewardTokenPool: TokenAccountId,
    lastUpdate: Slot,
    endTime: Slot,
    earliestRewardClaimTime: Slot,
    duration: Slot,
    ratePerSlot: ExchangeRate,
    cumulativeRate: ExchangeRate,
    poolSize: Lamport,
    ownerAuthority: AuthorityId,
    adminAuthority: AuthorityId,
    subRewardTokenPool?: TokenAccountId,
    subRatePerSlot?: ExchangeRate,
    subCumulativeRate?: ExchangeRate
  ) {
    this.stakingPoolId = stakingPoolId;
    this.rewardTokenPool = rewardTokenPool;
    this.lastUpdate = lastUpdate;
    this.endTime = endTime;
    this.earliestRewardClaimTime = earliestRewardClaimTime;
    this.duration = duration;
    this.ratePerSlot = ratePerSlot;
    this.cumulativeRate = cumulativeRate;
    this.poolSize = poolSize;
    this.ownerAuthority = ownerAuthority;
    this.adminAuthority = adminAuthority;
    this.subRewardTokenPool = subRewardTokenPool;
    this.subRatePerSlot = subRatePerSlot;
    this.subCumulativeRate = subCumulativeRate;
  }

  public static fromRaw(raw: RawData): StakingPool {
    const buffer = Buffer.from(raw.account.data);
    const info = StakingPoolLayout.decode(buffer) as StakingPoolProto;

    return new StakingPool(
      StakingPoolId.of(raw.pubkey),
      info.rewardTokenPool,
      info.lastUpdate,
      info.endTime,
      info.earliestRewardClaimTime,
      info.duration,
      info.ratePerSlot,
      info.cumulativeRate,
      info.poolSize,
      info.ownerAuthority,
      info.adminAuthority,
      info.subRewardTokenPoolOption === 1 ? info.subRewardTokenPool : undefined,
      info.subRatePerSlotOption === 1 ? info.subRatePerSlot : undefined,
      info.subCumulativeRateOption === 1 ? info.subCumulativeRate : undefined
    );
  }

  public getOwnerAuthorityId(): AuthorityId {
    return this.ownerAuthority;
  }

  public getAdminAuthorityId(): AuthorityId {
    return this.adminAuthority;
  }

  public getId(): StakingPoolId {
    return this.getStakingPoolId();
  }

  public getStakingPoolId(): StakingPoolId {
    return this.stakingPoolId;
  }

  public getRewardTokenPool(): TokenAccountId {
    return this.rewardTokenPool;
  }

  public getSubRewardTokenPool(): TokenAccountId | undefined {
    return this.subRewardTokenPool;
  }

  public getLastUpdate(): Slot {
    return this.lastUpdate;
  }

  public getEndTime(): Slot {
    return this.endTime;
  }

  public getEarliestRewardClaimTime(): Slot {
    return this.earliestRewardClaimTime;
  }

  public getDuration(): Slot {
    return this.duration;
  }

  public getRatePerSlot(): ExchangeRate {
    return this.ratePerSlot;
  }

  public getSubRatePerSlot(): ExchangeRate | undefined {
    return this.subRatePerSlot;
  }

  public getCumulativeRate(): ExchangeRate {
    return this.cumulativeRate;
  }

  public getSubCumulativeRate(): ExchangeRate | undefined {
    return this.cumulativeRate;
  }

  public getPoolSize(): Lamport {
    return this.poolSize;
  }

  public isPoolEnd(currentSlot: Slot): boolean {
    return this.getEndTime().lt(currentSlot);
  }

  public getEstimatedRate(currentSlot: Slot): ExchangeRate {
    const poolSize = this.getPoolSize();
    if (poolSize.isZero()) {
      return ExchangeRate.zero();
    }

    currentSlot = currentSlot.min(this.getEndTime());
    const slotDiff = currentSlot.subtract(this.getLastUpdate());
    if (slotDiff.isNegative()) {
      throw new Error("Slot older than last update");
    }

    const rateDiff = this.getRatePerSlot()
      .multiply(slotDiff.getRaw())
      .divide(poolSize.getRaw());
    return this.getCumulativeRate().add(rateDiff);
  }

  public getRewardApy(
    reserve: ReserveInfo,
    price: AssetPrice,
    tokenInfo: TokenInfo
  ): Apy {
    return this.getRewardApyInner(
      reserve,
      tokenInfo,
      price.getRaw(),
      this.getRatePerSlot()
    );
  }

  public getSubRewardApy(
    reserve: ReserveInfo,
    price: AssetPrice | Big,
    tokenInfo: TokenInfo
  ): Apy {
    const subRatePerSlot = this.getSubRatePerSlot();
    if (!subRatePerSlot) {
      return Apy.na();
    } else if (price instanceof AssetPrice) {
      return this.getRewardApyInner(
        reserve,
        tokenInfo,
        price.getRaw(),
        subRatePerSlot
      );
    } else {
      return this.getRewardApyInner(reserve, tokenInfo, price, subRatePerSlot);
    }
  }

  private getRewardApyInner(
    reserve: ReserveInfo,
    tokenInfo: TokenInfo,
    price: Big,
    ratePerSlot: ExchangeRate
  ): Apy {
    const poolSize = this.getPoolSize();
    if (!poolSize.isPositive()) {
      return Apy.na();
    }

    const share = Share.of(reserve.getShareMintId(), poolSize);
    const asset = share.toAsset(reserve.getExchangeRatio());
    const tvl = asset.toValue(
      reserve.getMarkPrice(),
      reserve.getQuantityContext()
    );

    const qtyContext = QuantityContext.fromDecimals(tokenInfo.decimals);

    const raw = ratePerSlot
      .getRaw()
      .mul(SLOT_PER_YEAR)
      .mul(price)
      .div(qtyContext.multiplier)
      .div(tvl.getRaw());
    return Apy.of(raw);
  }
}

export class StakingPoolContext {
  private static readonly STAKING_POOL_CONTEXT_EMPTY = new StakingPoolContext(
    [],
    new Map()
  );

  private readonly pools: StakingPool[];
  private readonly byStakingPoolId: Map<string, StakingPool>;

  private constructor(
    pools: StakingPool[],
    byStakingPoolId: Map<string, StakingPool>
  ) {
    this.pools = pools;
    this.byStakingPoolId = byStakingPoolId;
  }

  public static empty(): StakingPoolContext {
    return StakingPoolContext.STAKING_POOL_CONTEXT_EMPTY;
  }

  public static index(accounts: StakingPool[]): StakingPoolContext {
    if (!accounts.length) {
      return StakingPoolContext.empty();
    }

    const byStakingPoolId = new Map<string, StakingPool>();
    accounts.forEach((a) =>
      byStakingPoolId.set(a.getStakingPoolId().toString(), a)
    );
    return new StakingPoolContext(accounts, byStakingPoolId);
  }

  public getAllStakingPools(): StakingPool[] {
    return this.pools;
  }

  public getStakingPool(stakingPoolId: StakingPoolId): StakingPool {
    const result = this.findStakingPool(stakingPoolId);
    if (!result) {
      throw new Error(`No staking pool for ${stakingPoolId}`);
    }

    return result;
  }

  public findStakingPool(
    stakingPoolId: StakingPoolId
  ): StakingPool | undefined {
    const key = stakingPoolId.toString();
    return this.byStakingPoolId.get(key);
  }
}

export const LENDING_MARKET_LEN = 258;

export class Port {
  public readonly environment: Environment;
  public lendingMarket: PublicKey;
  public connection: Connection;
  public reserveContext?: ReserveContext;

  constructor(
    connection: Connection,
    environment: Environment,
    lendingMarket: PublicKey
  ) {
    this.connection = connection;
    this.environment = environment;
    this.lendingMarket = lendingMarket;
  }

  public setConnection(connection: Connection): void {
    this.connection = connection;
  }

  public setLendingMarket(lendingMarket: PublicKey): void {
    this.lendingMarket = lendingMarket;
  }

  public static forMainNet({
    connection = new Connection("https://port-finance.rpcpool.com"),
    profile = Environment.forMainNet(),
    lendingMarket = DEFAULT_PORT_LENDING_MARKET,
  }: {
    connection?: Connection;
    profile?: Environment;
    lendingMarket?: PublicKey;
  }): Port {
    return new Port(connection, profile, lendingMarket);
  }

  public getEnvironment(): Environment {
    return this.environment;
  }

  public async load(): Promise<void> {
    this.reserveContext = await this.getReserveContext();
  }

  public async getTotalMarketCap(): Promise<QuoteValue> {
    const context = await this.getReserveContext();
    return context
      .getAllReserves()
      .map((r) => r.getMarketCap())
      .map((c) => c.getValue())
      .reduce(QuoteValue.sum, QuoteValue.zero());
  }

  public async getShareAccount(
    walletId: WalletId,
    context: ReserveContext
  ): Promise<TokenAccount[]> {
    const shareMintPks = context
      .getAllReserves()
      .map((r) => r.getShareMintId())
      .map((s) => s.getAccess(AccessType.READ).pubkey);
    const programId = this.environment.getTokenProgramPk();
    const result = await this.connection.getTokenAccountsByOwner(
      walletId.getAccess(AccessType.READ).pubkey,
      {
        programId,
      }
    );
    const raw = result.value;
    return raw
      .map((a) => TokenAccount.fromRaw(a))
      .filter(
        (p) =>
          p &&
          shareMintPks.find((k) =>
            k.equals(p.getMintId().getAccess(AccessType.READ).pubkey)
          )
      );
  }

  public async getPortProfile(
    walletId: WalletId
  ): Promise<PortProfile | undefined> {
    const raw = await this.connection.getProgramAccounts(
      this.environment.getLendingProgramPk(),
      {
        filters: [
          {
            memcmp: {
              // eslint-disable-next-line
              offset: ObligationLayout.offsetOf("owner")!,
              bytes: walletId.toBase58(),
            },
          },
          {
            dataSize: PORT_PROFILE_DATA_SIZE,
          },
        ],
      }
    );
    const parsed = raw.map((a) => PortProfile.fromRaw(a)).filter((p) => !!p);
    return parsed.length > 0 ? parsed[0] : undefined;
  }

  public async getReserveContext(): Promise<ReserveContext> {
    const raw = await this.connection.getProgramAccounts(
      this.environment.getLendingProgramPk(),
      {
        filters: [
          {
            dataSize: RESERVE_DATA_SIZE,
          },
          {
            memcmp: {
              // eslint-disable-next-line
              offset: ReserveLayout.offsetOf("lendingMarket")!,
              bytes: this.lendingMarket.toBase58(),
            },
          },
        ],
      }
    );
    const parsed = raw.map((a) => ReserveInfo.fromRaw(a)).filter((p) => !!p);
    return ReserveContext.index(parsed);
  }

  public async getStakingPoolContext(): Promise<StakingPoolContext> {
    if (this.environment.getStakingProgramPk() === undefined) {
      Promise.resolve();
    }

    const raw = await this.connection.getProgramAccounts(
      // eslint-disable-next-line
      this.environment.getStakingProgramPk()!,
      {
        filters: [
          {
            dataSize: STAKING_POOL_DATA_SIZE,
          },
        ],
      }
    );
    const parsed = raw.map((a) => StakingPool.fromRaw(a)).filter((p) => !!p);
    return StakingPoolContext.index(parsed);
  }

  public async getAllPortProfiles(): Promise<PortProfile[]> {
    const raw = await this.connection.getProgramAccounts(
      this.environment.getLendingProgramPk(),
      {
        filters: [
          {
            dataSize: PORT_PROFILE_DATA_SIZE,
          },
        ],
      }
    );
    const parsed = raw.map((p) => PortProfile.fromRaw(p)).filter((p) => !!p);
    return parsed;
  }

  public async getStakingPool(stakingPoolKey: PublicKey): Promise<StakingPool> {
    const raw = await this.connection.getAccountInfo(stakingPoolKey);
    if (!raw) {
      return Promise.reject(new Error("no reserve found"));
    }
    return StakingPool.fromRaw({
      pubkey: stakingPoolKey,
      account: raw,
    });
  }

  public async getReserve(reserveKey: PublicKey): Promise<ReserveInfo> {
    const raw = await this.connection.getAccountInfo(reserveKey);
    if (!raw) {
      return Promise.reject(new Error("no reserve found"));
    }
    return ReserveInfo.fromRaw({
      pubkey: reserveKey,
      account: raw,
    });
  }

  /*
  public async createLendingMarket({
    provider,
    owner = provider.wallet.publicKey,
  }: {
    provider: Provider;
    owner?: PublicKey;
  }): Promise<[TransactionEnvelope, PublicKey]> {
    let tx = new TransactionEnvelope(provider, []);
    const [createTx, lendingMarketPubkey] = await this.createAccount({
      provider,
      space: LENDING_MARKET_LEN,
      owner: PORT_LENDING,
    });
    const createLendingMarketIx = initLendingMarketInstruction(
      owner,
      Buffer.from(
        "USD\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0",
        "ascii"
      ),
      lendingMarketPubkey
    );
    tx = tx.combine(createTx);
    tx.addInstructions(createLendingMarketIx);
    return [tx, lendingMarketPubkey];
  }

  public async createReserve({
    provider,
    reserveConfig,
    transferAuthority,
    sourceTokenWallet,
    initialLiquidity,
    oracle,
    price,
  }: {
    provider: Provider;
    reserveConfig: ReserveConfigProto;
    transferAuthority: PublicKey;
    sourceTokenWallet: PublicKey;
    initialLiquidity: number | BN;
    oracle?: PublicKey;
    price?: BN;
  }): Promise<[TransactionEnvelope[], PublicKey]> {
    invariant(!!oracle !== !!price, "Oracle and price can't both be present");

    const [createReserveAccountIx, reservePubKey] = await this.createAccount({
      provider,
      space: ReserveLayout.span,
      owner: PORT_LENDING,
    });
    const [collateralMintIx, collateralMintPubKey] = await this.createAccount({
      provider,
      space: MintLayout.span,
      owner: TOKEN_PROGRAM_ID,
    });
    const [liquiditySupplyIx, liquiditySupplyPubKey] = await this.createAccount(
      {
        provider,
        space: AccountLayout.span,
        owner: TOKEN_PROGRAM_ID,
      }
    );
    const [collateralSupplyIx, collateralSupplyPubKey] =
      await this.createAccount({
        provider,
        space: AccountLayout.span,
        owner: TOKEN_PROGRAM_ID,
      });
    const [userCollateralIx, userCollateralPubKey] = await this.createAccount({
      provider,
      space: AccountLayout.span,
      owner: TOKEN_PROGRAM_ID,
    });
    const [feeReceiverIx, feeReceiverPubkey] = await this.createAccount({
      provider,
      space: AccountLayout.span,
      owner: TOKEN_PROGRAM_ID,
    });

    const tokenAccount = await getTokenAccount(provider, sourceTokenWallet);

    const initReserveIx = initReserveInstruction(
      initialLiquidity,
      oracle ? 0 : 1, // price Option
      price ?? new BN(1),
      reserveConfig,
      sourceTokenWallet,
      collateralSupplyPubKey,
      reservePubKey,
      tokenAccount.mint,
      liquiditySupplyPubKey,
      feeReceiverPubkey,
      oracle ?? Keypair.generate().publicKey,
      collateralMintPubKey,
      userCollateralPubKey,
      this.lendingMarket,
      (await this.getLendingMarketAuthority())[0],
      provider.wallet.publicKey,
      transferAuthority
    );

    let tx1 = new TransactionEnvelope(provider, []);
    tx1 = tx1.combine(createReserveAccountIx);
    tx1 = tx1.combine(collateralMintIx);
    tx1 = tx1.combine(liquiditySupplyIx);
    tx1 = tx1.combine(collateralSupplyIx);
    tx1 = tx1.combine(userCollateralIx);

    let tx2 = new TransactionEnvelope(provider, []);
    tx2 = tx2.combine(feeReceiverIx);
    tx2 = tx2.addInstructions(initReserveIx);

    return [[tx1, tx2], reservePubKey];
  }
  */

  public async getLendingMarketAuthority(): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddress(
      [this.lendingMarket.toBuffer()],
      PORT_LENDING
    );
  }

  /*
  private async createAccount({
    provider,
    space,
    owner,
  }: {
    provider: Provider;
    space: number;
    owner: PublicKey;
  }): Promise<[TransactionEnvelope, PublicKey]> {
    const newAccount = Keypair.generate();
    const tx = new TransactionEnvelope(
      provider,
      [
        SystemProgram.createAccount({
          fromPubkey: provider.wallet.publicKey,
          newAccountPubkey: newAccount.publicKey,
          programId: owner,
          lamports: await provider.connection.getMinimumBalanceForRentExemption(
            space
          ),
          space,
        }),
      ],
      [newAccount]
    );
    return [tx, newAccount.publicKey];
  }
  */

}






export enum AccessType {
  UNKNOWN = 0,
  READ = 1,
  WRITE = 2,
  SIGNER = 3,
}

export function getAccess(key: PublicKey, type: AccessType): AccountMeta {
  switch (type) {
    case AccessType.READ:
      return { pubkey: key, isSigner: false, isWritable: false };
    case AccessType.WRITE:
      return { pubkey: key, isSigner: false, isWritable: true };
    case AccessType.SIGNER:
      return { pubkey: key, isSigner: true, isWritable: false };
    default:
      throw new Error(`Unknown access type ${type}`);
  }
}

export class AssetDisplayConfig {
  private readonly name: string;
  private readonly symbol: string;
  // private readonly icon: string;
  private readonly color?: string;

  constructor(name: string, symbol: string, color?: string) {
    this.name = name;
    this.symbol = symbol;
    // this.icon = icon;
    this.color = color;
  }

  public getName(): string {
    return this.name;
  }

  public getSymbol(): string {
    return this.symbol;
  }

  // public getIcon(): string {
  //   return this.icon;
  // }

  public getColor(): string | undefined {
    return this.color;
  }
}

export class AssetPriceConfig {
  private readonly decimals: number;
  private readonly increment: Big;

  private constructor(decimals: number, increment: Big) {
    this.decimals = decimals;
    this.increment = increment;
  }

  public static fromDecimals(decimals: number): AssetPriceConfig {
    assert(Number.isInteger(decimals));
    assert(decimals >= 0);
    return new AssetPriceConfig(decimals, new Big(10).pow(decimals));
  }

  public getDecimals(): number {
    return this.decimals;
  }

  public getIncrement(): Big {
    return this.increment;
  }
}

export class AssetDepositConfig {
  private readonly reserveId: ReserveId;
  private readonly min?: Big;
  private readonly max?: Big;
  private readonly remain?: Big;

  constructor(
    reserveId: ReserveId,
    args?: { min?: BigSource; max?: BigSource; remain?: BigSource }
  ) {
    this.reserveId = reserveId;
    this.min = args?.min ? new Big(args.min) : undefined;
    this.max = args?.max ? new Big(args.max) : undefined;
    this.remain = args?.remain ? new Big(args.remain) : undefined;
  }

  public getReserveId(): ReserveId {
    return this.reserveId;
  }

  public getMin(): Big | undefined {
    return this.min;
  }

  public getMax(): Big | undefined {
    return this.max;
  }

  public getRemain(): Big | undefined {
    return this.remain;
  }
}

export class AssetConfig {
  private readonly mintId: MintId;
  private readonly display: AssetDisplayConfig;
  private readonly price: AssetPriceConfig;
  private readonly deposit: AssetDepositConfig | undefined;
  private readonly isDefault: boolean;

  constructor(
    mintId: MintId,
    display: AssetDisplayConfig,
    price: AssetPriceConfig,
    deposit?: AssetDepositConfig,
    isDefault?: boolean
  ) {
    this.mintId = mintId;
    this.display = display;
    this.price = price;
    this.deposit = deposit;
    this.isDefault = isDefault ?? false;
  }

  public checkIsDefault(): boolean {
    return this.isDefault;
  }

  public getMintId(): MintId {
    return this.mintId;
  }

  public getName(): string {
    return this.getDisplayConfig().getName();
  }

  public getSymbol(): string {
    return this.getDisplayConfig().getSymbol();
  }

  public getColor(): string | undefined {
    return this.getDisplayConfig().getColor();
  }

  public getDisplayConfig(): AssetDisplayConfig {
    return this.display;
  }

  public getPriceDecimals(): number {
    return this.getPriceConfig().getDecimals();
  }

  public getPriceConfig(): AssetPriceConfig {
    return this.price;
  }

  public getReserveId(): ReserveId | undefined {
    return this.getDepositConfig()?.getReserveId();
  }

  public getMaxDeposit(): Asset | undefined {
    const raw = this.getDepositConfig()?.getMax();
    return raw ? Asset.of(this.mintId, Lamport.of(raw)) : undefined;
  }

  public getMinDeposit(): Asset | undefined {
    const raw = this.getDepositConfig()?.getMin();
    return raw ? Asset.of(this.mintId, Lamport.of(raw)) : undefined;
  }

  public getRemainAsset(): Asset | undefined {
    const raw = this.getDepositConfig()?.getRemain();
    return raw ? Asset.of(this.mintId, Lamport.of(raw)) : undefined;
  }

  public getDepositConfig(): AssetDepositConfig | undefined {
    return this.deposit;
  }
}

export const DEFAULT_ASSET_CONFIG = new AssetConfig(
  MintId.fromBase58("So11111111111111111111111111111111111111112"),
  new AssetDisplayConfig("Default Token", "Default"),
  AssetPriceConfig.fromDecimals(3)
);

export class AssetContext {
  private readonly cache: Map<string, AssetConfig>;
  private readonly bySymbol: Map<string, AssetConfig>;
  private readonly byReserveId: Map<string, AssetConfig>;

  private constructor(
    cache: Map<string, AssetConfig>,
    bySymbol: Map<string, AssetConfig>,
    byReserveId: Map<string, AssetConfig>
  ) {
    this.cache = cache;
    this.bySymbol = bySymbol;
    this.byReserveId = byReserveId;
  }

  public static index(configs: AssetConfig[]): AssetContext {
    const cache = new Map<string, AssetConfig>();
    configs.forEach((config) =>
      cache.set(config.getMintId().toString(), config)
    );
    const bySymbol = new Map<string, AssetConfig>();
    configs.forEach((config) => bySymbol.set(config.getSymbol(), config));
    const byReserveId = new Map<string, AssetConfig>();
    for (const config of configs) {
      const reserveId = config.getReserveId();
      if (reserveId) {
        byReserveId.set(reserveId.toBase58(), config);
      }
    }
    return new AssetContext(cache, bySymbol, byReserveId);
  }

  public getAllConfigs(): AssetConfig[] {
    return Array.from(this.cache.values());
  }

  public findConfig(mintId: MintId): AssetConfig {
    const key = mintId.toString();
    return this.cache.get(key) ?? DEFAULT_ASSET_CONFIG;
  }

  public findConfigBySymbol(symbol: string): AssetConfig {
    return this.bySymbol.get(symbol) ?? DEFAULT_ASSET_CONFIG;
  }

  public findConfigByReserveId(reserveId: ReserveId): AssetConfig {
    return this.byReserveId.get(reserveId.toBase58()) ?? DEFAULT_ASSET_CONFIG;
  }
}

export const MAINNET_SOL: AssetConfig = new AssetConfig(
  MintId.fromBase58("So11111111111111111111111111111111111111112"),
  new AssetDisplayConfig("Solana", "SOL", "#BC57C4"),
  AssetPriceConfig.fromDecimals(4),
  new AssetDepositConfig(
    ReserveId.fromBase58("X9ByyhmtQH3Wjku9N5obPy54DbVjZV7Z99TPJZ2rwcs"),
    {
      min: 100_000_000, // min 0.1 SOL
      remain: 20_000_000, // remain 0.02 SOL
    }
  )
);

export const MAINNET_USDC: AssetConfig = new AssetConfig(
  MintId.fromBase58("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  new AssetDisplayConfig("USD Coin", "USDC", "#3C84D4"),
  AssetPriceConfig.fromDecimals(5),
  new AssetDepositConfig(
    ReserveId.fromBase58("DcENuKuYd6BWGhKfGr7eARxodqG12Bz1sN5WA8NwvLRx"),
    {
      min: 10_000, // min 0.01 USDC
    }
  )
);

export const MAINNET_USDT: AssetConfig = new AssetConfig(
  MintId.fromBase58("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
  new AssetDisplayConfig("Tether", "USDT", "#19664E"),
  AssetPriceConfig.fromDecimals(5),
  new AssetDepositConfig(
    ReserveId.fromBase58("4tqY9Hv7e8YhNQXuH75WKrZ7tTckbv2GfFVxmVcScW5s"),
    {
      min: 10_000, // min 0.01 USDT
    }
  )
);

export const MAINNET_PAI: AssetConfig = new AssetConfig(
  MintId.fromBase58("Ea5SjE2Y6yvCeW5dYTn7PYMuW5ikXkvbGdcmSnXeaLjS"),
  new AssetDisplayConfig("Parrot PAI", "PAI", "#C9D7FB"),
  AssetPriceConfig.fromDecimals(5),
  new AssetDepositConfig(
    ReserveId.fromBase58("DSw99gXoGzvc4N7cNGU7TJ9bCWFq96NU2Cczi1TabDx2"),
    {
      min: 10_000, // min 0.01 PAI
    }
  )
);

export const MAINNET_SRM: AssetConfig = new AssetConfig(
  MintId.fromBase58("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"),
  new AssetDisplayConfig("Serum", "SRM", "#30C0D5"),
  AssetPriceConfig.fromDecimals(5),
  new AssetDepositConfig(
    ReserveId.fromBase58("ZgS3sv1tJAor2rbGMFLeJwxsEGDiHkcrR2ZaNHZUpyF"),
    {
      min: 10_000, // min 0.01 PAI
    }
  )
);

export const MAINNET_BTC: AssetConfig = new AssetConfig(
  MintId.fromBase58("9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E"),
  new AssetDisplayConfig("Bitcoin", "BTC", "#FCAC44"),
  AssetPriceConfig.fromDecimals(1),
  new AssetDepositConfig(
    ReserveId.fromBase58("DSST29PMCVkxo8cf5ht9LxrPoMc8jAZt98t6nuJywz8p"),
    {
      min: 1, // min 1 * 10 ^ (-6) BTC
    }
  )
);

export const MAINNET_MER: AssetConfig = new AssetConfig(
  MintId.fromBase58("MERt85fc5boKw3BW1eYdxonEuJNvXbiMbs6hvheau5K"),
  new AssetDisplayConfig("Mercurial", "MER", "#34C5A7"),
  AssetPriceConfig.fromDecimals(4),
  new AssetDepositConfig(
    ReserveId.fromBase58("BnhsmYVvNjXK3TGDHLj1Yr1jBGCmD1gZMkAyCwoXsHwt"),
    {
      min: 10_000, // min 0.01 MER
    }
  )
);

export const MAINNET_MSOL: AssetConfig = new AssetConfig(
  MintId.fromBase58("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"),
  new AssetDisplayConfig("Marinade Staked SOL", "mSOL", "#4B4592"),
  AssetPriceConfig.fromDecimals(4),
  new AssetDepositConfig(
    ReserveId.fromBase58("9gDF5W94RowoDugxT8cM29cX8pKKQitTp2uYVrarBSQ7"),
    {
      min: 1_000, // min 0.001 mSOL
    }
  )
);

export const MAINNET_PORT: AssetConfig = new AssetConfig(
  MintId.fromBase58("PoRTjZMPXb9T7dyU7tpLEZRQj7e6ssfAE62j2oQuc6y"),
  new AssetDisplayConfig("Port", "PORT", "#796CFC"),
  AssetPriceConfig.fromDecimals(4),
  new AssetDepositConfig(
    ReserveId.fromBase58("4GXmyhMB9uUGjv4pfGfTRY1zJxoUY1CFXYvuFp7Maj1L")
  )
);

export const MAINNET_PSOL: AssetConfig = new AssetConfig(
  MintId.fromBase58("9EaLkQrbjmbbuZG9Wdpo8qfNUEjHATJFSycEmw6f1rGX"),
  new AssetDisplayConfig("Parrot Staked SOL", "pSOL", "#7E4592"),
  AssetPriceConfig.fromDecimals(4),
  new AssetDepositConfig(
    ReserveId.fromBase58("GRJyCEezbZQibAEfBKCRAg5YoTPP2UcRSTC7RfzoMypy"),
    {
      min: 1_000, // min 0.001 pSOL
    }
  )
);

export const MAINNET_SBR: AssetConfig = new AssetConfig(
  MintId.fromBase58("Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1"),
  new AssetDisplayConfig("Saber Protocol Token", "SBR", "#7E4591"),
  AssetPriceConfig.fromDecimals(6),
  new AssetDepositConfig(
    ReserveId.fromBase58("7dXHPrJtwBjQqU1pLKfkHbq9TjQAK9jTms3rnj1i3G77"),
    {
      min: 1_000_000, // min 1 SBR
    }
  )
);

export const MAINNET_MNDE: AssetConfig = new AssetConfig(
  MintId.fromBase58("MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey"),
  new AssetDisplayConfig("Marinade Governace Token", "MNDE", "#7E4591"),
  AssetPriceConfig.fromDecimals(6)
);

export const MAINNET_SLP: AssetConfig = new AssetConfig(
  MintId.fromBase58("2poo1w1DL6yd2WNTCnNTzDqkC6MBXq7axo77P16yrBuf"),
  new AssetDisplayConfig("Saber USDC - USDT LP", "SLP", "#34C5A7"),
  AssetPriceConfig.fromDecimals(5),
  new AssetDepositConfig(
    ReserveId.fromBase58("BXt3EhK5Tj81aKaVSBD27rLFd5w8A6wmGKDh47JWohEu")
  )
);

export const MAINNET_UST: AssetConfig = new AssetConfig(
  MintId.fromBase58("9vMJfxuKxXBoEa7rM12mYLMwTacLMLDJqHozw96WQL8i"),
  new AssetDisplayConfig("UST", "UST", "#34C5A7"),
  AssetPriceConfig.fromDecimals(5),
  new AssetDepositConfig(
    ReserveId.fromBase58("4HVSvzUfQ3aP5wEDkCQRqgYMhNatenVRKPdbXUv8VvBa")
  )
);

export const MAINNET_WHETH: AssetConfig = new AssetConfig(
  MintId.fromBase58("7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"),
  new AssetDisplayConfig("Wormhole Ethereum", "whETH", "#34C5A7"),
  AssetPriceConfig.fromDecimals(5),
  new AssetDepositConfig(
    ReserveId.fromBase58("AtooWNBQRrg94ZeNdx9nk5HMSzHyXVbVvsdPXtbcMG1J")
  )
);

export const MAINNET_FIDA: AssetConfig = new AssetConfig(
  MintId.fromBase58("EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp"),
  new AssetDisplayConfig("Bonfida", "FIDA", "#34C5A7"),
  AssetPriceConfig.fromDecimals(5),
  new AssetDepositConfig(
    ReserveId.fromBase58("Bten75q82AMWmrRp77DgsphtSbUjHYhL7Mx5bx6SR4iA")
  )
);

export const MAINNET_PPUSDC: AssetConfig = new AssetConfig(
  MintId.fromBase58("6cKnRJskSTonD6kZiWt2Fy3NB6ZND6CbgA3vHiZ1kHEU"),
  new AssetDisplayConfig(
    "Port Finance 2022 March Principle USDC",
    "ppUSDC",
    "#34C5A7"
  ),
  AssetPriceConfig.fromDecimals(5)
);

export const MAINNET_PYUSDC: AssetConfig = new AssetConfig(
  MintId.fromBase58("B64haiHLQoWdrvcJqufRG5dEMms96rDpwuaTjYTihQEo"),
  new AssetDisplayConfig(
    "Port Finance 2022 March Yield USDC",
    "pyUSDC",
    "#34C5A7"
  ),
  AssetPriceConfig.fromDecimals(5)
);

export const MAINNET_ASSETS: AssetConfig[] = [
  MAINNET_SOL,
  MAINNET_USDC,
  MAINNET_USDT,
  MAINNET_PAI,
  MAINNET_SRM,
  MAINNET_BTC,
  MAINNET_MER,
  MAINNET_MSOL,
  MAINNET_PORT,
  MAINNET_PSOL,
  MAINNET_SBR,
  MAINNET_MNDE,
  MAINNET_SLP,
  MAINNET_UST,
  MAINNET_WHETH,
  MAINNET_FIDA,
  MAINNET_PPUSDC,
  MAINNET_PYUSDC,
];

export class Environment {
  private readonly env: ENV;
  private readonly lendingProgramPk: PublicKey;
  private readonly stakingProgramPk: PublicKey | undefined;
  private readonly tokenProgramPk: PublicKey;
  private readonly assetContext: AssetContext;

  constructor(
    env: ENV,
    lendingProgramPk: PublicKey,
    stakingProgramPk: PublicKey | undefined,
    tokenProgramPk: PublicKey,
    assetConfigs: AssetConfig[]
  ) {
    this.env = env;
    this.lendingProgramPk = lendingProgramPk;
    this.stakingProgramPk = stakingProgramPk;
    this.tokenProgramPk = tokenProgramPk;
    this.assetContext = AssetContext.index(assetConfigs);
  }

  public static forMainNet(): Environment {
    return new Environment(
      ENV.MainnetBeta,
      PORT_LENDING,
      PORT_STAKING,
      new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      MAINNET_ASSETS
    );
  }

  public getEnv(): ENV {
    return this.env;
  }

  public getLendingProgramPk(): PublicKey {
    return this.lendingProgramPk;
  }

  public getStakingProgramPk(): PublicKey | undefined {
    return this.stakingProgramPk;
  }

  public getTokenProgramPk(): PublicKey {
    return this.tokenProgramPk;
  }

  public getAssetContext(): AssetContext {
    return this.assetContext;
  }
}






export class OracleId extends Id {
  static fromBase58(base58: string): OracleId {
    return new OracleId(new PublicKey(base58));
  }
}

export class ReserveContext {
  private static readonly RESERVE_CONTEXT_EMPTY = new ReserveContext(
    [],
    new Map(),
    new Map(),
    new Map(),
    new Map()
  );

  private readonly reserves: ReserveInfo[];
  private readonly byReserveId: Map<string, ReserveInfo>;
  private readonly byAssetMintId: Map<string, ReserveInfo>;
  private readonly byShareMintId: Map<string, ReserveInfo>;
  private readonly byStakingPoolId: Map<string, ReserveInfo>;

  private constructor(
    reserves: ReserveInfo[],
    byReserveId: Map<string, ReserveInfo>,
    byAssetMintId: Map<string, ReserveInfo>,
    byShareMintId: Map<string, ReserveInfo>,
    byStakingPoolId: Map<string, ReserveInfo>
  ) {
    this.reserves = reserves;
    this.byReserveId = byReserveId;
    this.byAssetMintId = byAssetMintId;
    this.byShareMintId = byShareMintId;
    this.byStakingPoolId = byStakingPoolId;
  }

  public static empty(): ReserveContext {
    return ReserveContext.RESERVE_CONTEXT_EMPTY;
  }

  public static index(
    reserves: ReserveInfo[],
    tokenMap?: Map<string, TokenInfo>
  ): ReserveContext {
    if (!reserves.length) {
      return ReserveContext.empty();
    }

    const readyToSortReserves = tokenMap
      ? reserves.filter((r) => {
          return tokenMap.has(r.getAssetMintId().toString());
        })
      : reserves;

    const sorted = readyToSortReserves.sort(
      (a, b) =>
        -a.getMarketCap().getValue().compare(b.getMarketCap().getValue())
    );

    const byReserveId = new Map<string, ReserveInfo>();
    const byAssetMintId = new Map<string, ReserveInfo>();
    const byShareMintId = new Map<string, ReserveInfo>();
    const byStakingPoolId = new Map<string, ReserveInfo>();
    sorted.forEach((reserve) =>
      byReserveId.set(reserve.getReserveId().toString(), reserve)
    );
    sorted.forEach((reserve) =>
      byAssetMintId.set(reserve.getAssetMintId().toString(), reserve)
    );
    sorted.forEach((reserve) =>
      byShareMintId.set(reserve.getShareMintId().toString(), reserve)
    );
    sorted.forEach((reserve) => {
      const stakingPoolId = reserve.getStakingPoolId();
      if (stakingPoolId) {
        byStakingPoolId.set(stakingPoolId.toString(), reserve);
      }
    });
    return new ReserveContext(
      sorted,
      byReserveId,
      byAssetMintId,
      byShareMintId,
      byStakingPoolId
    );
  }

  public isReady(): boolean {
    return this.reserves.length > 0;
  }

  public getAllReserves(): ReserveInfo[] {
    return this.reserves;
  }

  public getAllReservesPricePubKey(): (OracleId | null)[] {
    return this.reserves.map((r) => r.getOracleId());
  }

  public getReserve(reserveId: ReserveId): ReserveInfo {
    const result = this.findReserve(reserveId);
    if (!result) {
      throw new Error(`No reserve for ${reserveId}`);
    }

    return result;
  }

  public getByAssetMintId(mintId: MintId): ReserveInfo {
    const result = this.findByAssetMintId(mintId);
    if (!result) {
      throw new Error(`No reserve for asset mint ${mintId}`);
    }

    return result;
  }

  public getByShareMintId(mintId: MintId): ReserveInfo {
    const result = this.findByShareMintId(mintId);
    if (!result) {
      throw new Error(`No reserve for share mint ${mintId}`);
    }

    return result;
  }

  public findReserve(reserveId: ReserveId): ReserveInfo | undefined {
    const key = reserveId.toString();
    return this.byReserveId.get(key);
  }

  public findByAssetMintId(mintId: MintId): ReserveInfo | undefined {
    const key = mintId.toString();
    return this.byAssetMintId.get(key);
  }

  public findByShareMintId(mintId: MintId): ReserveInfo | undefined {
    const key = mintId.toString();
    return this.byShareMintId.get(key);
  }

  public findByStakingPoolId(
    stakingPoolId: StakingPoolId
  ): ReserveInfo | undefined {
    if (!stakingPoolId) {
      return undefined;
    }

    const key = stakingPoolId.toString();
    return this.byStakingPoolId.get(key);
  }
}





export class MarketId extends Id {
  private constructor(key: PublicKey) {
    super(key);
  }

  public static fromBase58(base58: string): MarketId {
    return MarketId.of(new PublicKey(base58));
  }

  public static of(key: PublicKey): MarketId {
    return new MarketId(key);
  }

  public static field(property: string): Field<MarketId> {
    return new MarketIdField(property);
  }

  public getName(): string {
    return MARKET_MAP[this.toBase58()] ?? "unknown";
  }
}

class MarketIdField extends PublicKeyField<MarketId> {
  public constructor(property: string) {
    super(property);
  }

  protected fromPublicKey(pubKey: PublicKey): MarketId {
    return MarketId.of(pubKey);
  }
}

export class AssetValue {
  private readonly asset: Asset;
  private readonly value: QuoteValue;

  constructor(asset: Asset, value: QuoteValue) {
    this.asset = asset;
    this.value = value;
  }

  public static zero(mintId: MintId): AssetValue {
    return new AssetValue(Asset.zero(mintId), QuoteValue.zero());
  }

  public getMintId(): MintId {
    return this.getAsset().getMintId();
  }

  public getAsset(): Asset {
    return this.asset;
  }

  public getValue(): QuoteValue {
    return this.value;
  }
}

/* eslint-disable no-unused-vars */
/** @internal */
export enum LendingInstruction {
  InitLendingMarket = 0,
  SetLendingMarketOwner = 1,
  InitReserve = 2,
  RefreshReserve = 3,
  DepositReserveLiquidity = 4,
  RedeemReserveCollateral = 5,
  InitObligation = 6,
  RefreshObligation = 7,
  DepositObligationCollateral = 8,
  WithdrawObligationCollateral = 9,
  BorrowObligationLiquidity = 10,
  RepayObligationLiquidity = 11,
  LiquidateObligation = 12,
  FlashLoan = 13,
  DepositReserveLiquidityAndAddCollateral = 14,
  UpdateReserve = 16,
  WithdrawFee = 17,
}

// Redeem collateral from a reserve in exchange for liquidity.
//
// Accounts expected by this instruction:
//
//   0. `[writable]` Source collateral token account.
//                     $authority can transfer $collateral_amount.
//   1. `[writable]` Destination liquidity token account.
//   2. `[writable]` Reserve account.
//   3. `[writable]` Reserve collateral SPL Token mint.
//   4. `[writable]` Reserve liquidity supply SPL Token account.
//   5. `[]` Lending market account.
//   6. `[]` Derived lending market authority.
//   7. `[signer]` User transfer authority ($authority).
//   8. `[]` Clock sysvar.
//   9. `[]` Token program id.
export const redeemReserveCollateralInstruction = (
  collateralAmount: number | BN,
  sourceCollateral: PublicKey,
  destinationLiquidity: PublicKey,
  reserve: PublicKey,
  reserveCollateralMint: PublicKey,
  reserveLiquiditySupply: PublicKey,
  lendingMarket: PublicKey,
  lendingMarketAuthority: PublicKey,
  transferAuthority: PublicKey,
  lendingProgramId: PublicKey = PORT_LENDING
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout_uint64("collateralAmount"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.RedeemReserveCollateral,
      collateralAmount: new BN(collateralAmount),
    },
    data
  );

  const keys = [
    getAccess(sourceCollateral, AccessType.WRITE),
    getAccess(destinationLiquidity, AccessType.WRITE),
    getAccess(reserve, AccessType.WRITE),
    getAccess(reserveCollateralMint, AccessType.WRITE),
    getAccess(reserveLiquiditySupply, AccessType.WRITE),
    getAccess(lendingMarket, AccessType.READ),
    getAccess(lendingMarketAuthority, AccessType.READ),
    getAccess(transferAuthority, AccessType.SIGNER),
    getAccess(SYSVAR_CLOCK_PUBKEY, AccessType.READ),
    getAccess(TOKEN_PROGRAM_ID, AccessType.READ),
  ];

  return new TransactionInstruction({
    keys,
    programId: lendingProgramId,
    data,
  });
};

const DataLayout = BufferLayout.struct([BufferLayout.u8("instruction")]);

// Accrue interest and update market price of liquidity on a reserve.
//
// Accounts expected by this instruction:
//
//   0. `[writable]` Reserve account.
//   1. `[]` Clock sysvar.
//   2. `[]` Reserve liquidity oracle account.
//             Must be the Pyth price account specified at InitReserve.
export const refreshReserveInstruction = (
  reserve: PublicKey,
  oracle: PublicKey | null,
  lendingProgramId: PublicKey = PORT_LENDING
): TransactionInstruction => {
  const data = Buffer.alloc(DataLayout.span);
  DataLayout.encode({ instruction: LendingInstruction.RefreshReserve }, data);

  const keys = [
    getAccess(reserve, AccessType.WRITE),
    getAccess(SYSVAR_CLOCK_PUBKEY, AccessType.READ),
  ];

  if (oracle) {
    keys.push(getAccess(oracle, AccessType.READ));
  }

  return new TransactionInstruction({
    keys,
    programId: lendingProgramId,
    data,
  });
};

// Deposit liquidity into a reserve in exchange for collateral. Collateral represents a share
// of the reserve liquidity pool.
//
// Accounts expected by this instruction:
//
//   0. `[writable]` Source liquidity token account.
//                     $authority can transfer $liquidity_amount.
//   1. `[writable]` Destination collateral token account.
//   2. `[writable]` Reserve account.
//   3. `[writable]` Reserve liquidity supply SPL Token account.
//   4. `[writable]` Reserve collateral SPL Token mint.
//   5. `[]` Lending market account.
//   6. `[]` Derived lending market authority.
//   7. `[signer]` User transfer authority ($authority).
//   8. `[]` Clock sysvar.
//   9. `[]` Token program id.
export const depositReserveLiquidityInstruction = (
  liquidityAmount: number | BN,
  srcLiquidityPubkey: PublicKey, // 0
  dstCollateralPubkey: PublicKey, // 1
  reservePubkey: PublicKey, // 2
  reserveLiquiditySupplyPubkey: PublicKey, // 3
  reserveCollateralMintPubkey: PublicKey, // 4
  lendingMarketPubkey: PublicKey, // 5
  lendingMarketAuthorityPubkey: PublicKey, // 6
  transferAuthorityPubkey: PublicKey, // 7
  lendingProgramId: PublicKey = PORT_LENDING
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout_uint64("liquidityAmount"),
  ]);
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.DepositReserveLiquidity,
      liquidityAmount: new BN(liquidityAmount),
    },
    data
  );

  const keys = [
    getAccess(srcLiquidityPubkey, AccessType.WRITE),
    getAccess(dstCollateralPubkey, AccessType.WRITE),
    getAccess(reservePubkey, AccessType.WRITE),
    getAccess(reserveLiquiditySupplyPubkey, AccessType.WRITE),
    getAccess(reserveCollateralMintPubkey, AccessType.WRITE),
    getAccess(lendingMarketPubkey, AccessType.READ),
    getAccess(lendingMarketAuthorityPubkey, AccessType.READ),
    getAccess(transferAuthorityPubkey, AccessType.SIGNER),
    getAccess(SYSVAR_CLOCK_PUBKEY, AccessType.READ),
    getAccess(TOKEN_PROGRAM_ID, AccessType.READ),
  ];

  return new TransactionInstruction({
    keys,
    programId: lendingProgramId,
    data,
  });
};

// Deposit collateral to an obligation. Requires a refreshed reserve.
//
// Accounts expected by this instruction:
//
//   0. `[writable]` Source collateral token account.
//                     Minted by deposit reserve collateral mint.
//                     $authority can transfer $collateral_amount.
//   1. `[writable]` Destination deposit reserve collateral supply SPL Token account.
//   2. `[]` Deposit reserve account - refreshed.
//   3. `[writable]` Obligation account.
//   4. `[]` Lending market account.
//   5. `[]` Derived lending market authority.
//   6. `[signer]` Obligation owner.
//   7. `[signer]` User transfer authority ($authority).
//   8. `[]` Clock sysvar.
//   9. `[]` Token program id.
export const depositObligationCollateralInstruction = (
  collateralAmount: number | BN,
  srcCollateralPubkey: PublicKey, // 0
  dstCollateralPubkey: PublicKey, // 1
  depositReservePubkey: PublicKey, // 2
  obligationPubkey: PublicKey, // 3
  lendingMarketPubkey: PublicKey, // 4
  marketAuthorityPubkey: PublicKey, // 5
  obligationOwnerPubkey: PublicKey, // 6
  transferAuthorityPubkey: PublicKey, // 7
  lendingProgramId: PublicKey = PORT_LENDING,
  stakeAccountPubkey?: PublicKey, // 8
  stakingPoolPubkey?: PublicKey // 9
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout_uint64("collateralAmount"),
  ]);
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.DepositObligationCollateral,
      collateralAmount: new BN(collateralAmount),
    },
    data
  );

  const keys = [
    getAccess(srcCollateralPubkey, AccessType.WRITE),
    getAccess(dstCollateralPubkey, AccessType.WRITE),
    getAccess(depositReservePubkey, AccessType.READ),
    getAccess(obligationPubkey, AccessType.WRITE),
    getAccess(lendingMarketPubkey, AccessType.READ),
    getAccess(marketAuthorityPubkey, AccessType.READ),
    getAccess(obligationOwnerPubkey, AccessType.SIGNER),
    getAccess(transferAuthorityPubkey, AccessType.SIGNER),
    getAccess(SYSVAR_CLOCK_PUBKEY, AccessType.READ),
    getAccess(TOKEN_PROGRAM_ID, AccessType.READ),
  ];

  if (stakeAccountPubkey && stakingPoolPubkey) {
    keys.push(
      getAccess(stakeAccountPubkey, AccessType.WRITE),
      getAccess(stakingPoolPubkey, AccessType.WRITE),
      getAccess(PORT_STAKING, AccessType.READ)
    );
  }

  return new TransactionInstruction({
    keys,
    programId: lendingProgramId,
    data,
  });
};

// Borrow liquidity from a reserve by depositing collateral tokens. Requires a refreshed
// obligation and reserve.
//
// Accounts expected by this instruction:
//
//   0. `[writable]` Source borrow reserve liquidity supply SPL Token account.
//   1. `[writable]` Destination liquidity token account.
//                     Minted by borrow reserve liquidity mint.
//   2. `[writable]` Borrow reserve account - refreshed.
//   3. `[writable]` Borrow reserve liquidity fee receiver account.
//                     Must be the fee account specified at InitReserve.
//   4. `[writable]` Obligation account - refreshed.
//   5. `[]` Lending market account.
//   6. `[]` Derived lending market authority.
//   7. `[signer]` Obligation owner.
//   8. `[]` Clock sysvar.
//   9. `[]` Token program id.
export const borrowObligationLiquidityInstruction = (
  liquidityAmount: number | BN,
  srcLiquidityPubkey: PublicKey, // 0
  dstLiquidityPubkey: PublicKey, // 1
  borrowReservePubkey: PublicKey, // 2
  borrowReserveFeeReceiverPubkey: PublicKey, // 3
  obligationPubkey: PublicKey, // 4
  lendingMarketPubkey: PublicKey, // 5
  marketAuthorityPubkey: PublicKey, // 6
  obligationOwner: PublicKey, // 7
  lendingProgramId: PublicKey = PORT_LENDING
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout_uint64("liquidityAmount"),
  ]);
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.BorrowObligationLiquidity,
      liquidityAmount: new BN(liquidityAmount),
    },
    data
  );

  const keys = [
    getAccess(srcLiquidityPubkey, AccessType.WRITE),
    getAccess(dstLiquidityPubkey, AccessType.WRITE),
    getAccess(borrowReservePubkey, AccessType.WRITE),
    getAccess(borrowReserveFeeReceiverPubkey, AccessType.WRITE),
    getAccess(obligationPubkey, AccessType.WRITE),
    getAccess(lendingMarketPubkey, AccessType.READ),
    getAccess(marketAuthorityPubkey, AccessType.READ),
    getAccess(obligationOwner, AccessType.SIGNER),
    getAccess(SYSVAR_CLOCK_PUBKEY, AccessType.READ),
    getAccess(TOKEN_PROGRAM_ID, AccessType.READ),
  ];

  return new TransactionInstruction({
    keys,
    programId: lendingProgramId,
    data,
  });
};

export class ReserveInfo implements Parsed<ReserveId> {
  private readonly reserveId: ReserveId;
  readonly marketId: MarketId;
  readonly asset: ReserveAssetInfo;
  readonly share: ReserveTokenInfo;
  readonly params: ReserveParams;
  private readonly stakingPoolId: StakingPoolId | undefined;

  // tricky
  readonly proto: ReserveData;

  constructor(
    reserveId: ReserveId,
    marketId: MarketId,
    asset: ReserveAssetInfo,
    share: ReserveTokenInfo,
    params: ReserveParams,
    stakingPoolId: StakingPoolId | undefined,
    proto: ReserveData
  ) {
    this.reserveId = reserveId;
    this.marketId = marketId;
    this.asset = asset;
    this.share = share;
    this.params = params;
    this.stakingPoolId = stakingPoolId;
    this.proto = proto;
  }

  public static fromRaw(raw: RawData): ReserveInfo {
    const buffer = raw.account.data;
    const proto = ReserveLayout.decode(buffer) as ReserveData;

    const marketId = MarketId.of(proto.lendingMarket);
    const asset = ReserveAssetInfo.fromRaw(proto.liquidity);
    const token = ReserveTokenInfo.fromRaw(proto.collateral);
    const params = ReserveParams.fromRaw(asset.getMintId(), proto.config);
    const stakingPoolId = proto.config.stakingPoolId;
    return new ReserveInfo(
      ReserveId.of(raw.pubkey),
      marketId,
      asset,
      token,
      params,
      stakingPoolId,
      proto
    );
  }

  getProto(): ReserveData {
    return this.proto;
  }

  getId(): ReserveId {
    return this.getReserveId();
  }

  public getReserveId(): ReserveId {
    return this.reserveId;
  }

  public getMarketId(): MarketId {
    return this.marketId;
  }

  public getAssetMintId(): MintId {
    return this.asset.getMintId();
  }

  public getAssetBalanceId(): TokenAccountId {
    return this.asset.getSplAccountId();
  }

  public getShareMintId(): MintId {
    return this.share.getMintId();
  }

  public getShareBalanceId(): TokenAccountId {
    return this.share.getSplAccountId();
  }

  public getOracleId(): OracleId | null {
    return this.asset.getOracleId();
  }

  public getFeeBalanceId(): TokenAccountId {
    return this.asset.getFeeAccountId();
  }

  // new input arg
  public getMarketCap(price?: AssetPrice): AssetValue {
    const asset = this.getTotalAsset();
    return new AssetValue(
      asset,
      asset.toValue(price ?? this.getMarkPrice(), this.getQuantityContext())
    );
  }

  public getTotalAsset(): Asset {
    return this.getAvailableAsset().add(this.getBorrowedAsset());
  }

  // new input arg
  public getAvailableAssetValue(price?: AssetPrice): AssetValue {
    const asset = this.getAvailableAsset();
    return new AssetValue(
      asset,
      asset.toValue(price ?? this.getMarkPrice(), this.getQuantityContext())
    );
  }

  public getAvailableAsset(): Asset {
    return this.asset.getAvailableAsset();
  }

  // new input arg
  public getBorrowedAssetValue(price?: AssetPrice): AssetValue {
    const asset = this.getBorrowedAsset();
    return new AssetValue(
      asset,
      asset.toValue(price ?? this.getMarkPrice(), this.getQuantityContext())
    );
  }

  public getBorrowedAsset(): Asset {
    return this.asset.getBorrowedAsset();
  }

  public getQuantityContext(): QuantityContext {
    return this.asset.getQuantityContext();
  }

  public getMarkPrice(): AssetPrice {
    return this.asset.getMarkPrice();
  }

  public getExchangeRatio(): AssetExchangeRate {
    const asset = this.getTotalAsset();
    const share = this.share.getIssuedShare();

    const assetMintId = asset.getMintId();
    const shareMintId = share.getMintId();
    if (asset.isZero()) {
      return new AssetExchangeRate(shareMintId, assetMintId);
    }
    const ratio = Percentage.fromOneBased(share.getRaw().div(asset.getRaw()));
    return new AssetExchangeRate(shareMintId, assetMintId, ratio);
  }

  public getUtilizationRatio(): ReserveUtilizationRatio {
    const total = this.getTotalAsset();
    if (total.isZero()) {
      return ReserveUtilizationRatio.na(total.getMintId());
    }

    const pct = Percentage.fromOneBased(
      this.getBorrowedAsset().getRaw().div(total.getRaw())
    );
    return new ReserveUtilizationRatio(total.getMintId(), pct);
  }

  public getSupplyApy(): Apy {
    const utilizationRatio = this.getUtilizationRatio();
    const borrowApy = this.getBorrowApy();

    if (!utilizationRatio.isPresent() || !borrowApy.isPresent()) {
      return Apy.na();
    }

    const utilizationRatioRaw = utilizationRatio.getUnchecked();
    const borrowApyRaw = borrowApy.getUnchecked();
    return Apy.of(utilizationRatioRaw.mul(borrowApyRaw));
  }

  public getBorrowApy(): Apy {
    const params = this.params;
    const utilizationRatio = this.getUtilizationRatio();
    const optimalUtilizationRatio = params.optimalUtilizationRatio;
    const optimalBorrowRate = params.optimalBorrowRate;

    if (
      !utilizationRatio.isPresent() ||
      !optimalUtilizationRatio.isPresent() ||
      !optimalBorrowRate.isPresent()
    ) {
      return Apy.na();
    }

    const utilizationRatioRaw = utilizationRatio.getUnchecked();
    const optimalUtilizationRatioRaw = optimalUtilizationRatio.getUnchecked();
    const optimalBorrowRateRaw = optimalBorrowRate.getUnchecked();
    if (
      optimalUtilizationRatioRaw.eq(1) ||
      utilizationRatioRaw.lt(optimalUtilizationRatioRaw)
    ) {
      const minBorrowRate = params.minBorrowRate;
      if (!minBorrowRate.isPresent()) {
        return Apy.na();
      }

      const minBorrowRateRaw = minBorrowRate.getUnchecked();
      const normalizedFactor = utilizationRatioRaw.div(
        optimalUtilizationRatioRaw
      );
      const borrowRateDiff = optimalBorrowRateRaw.sub(minBorrowRateRaw);
      return Apy.of(normalizedFactor.mul(borrowRateDiff).add(minBorrowRateRaw));
    }

    const maxBorrowRate = params.maxBorrowRate;
    if (!maxBorrowRate.isPresent()) {
      return Apy.na();
    }

    const maxBorrowRateRaw = maxBorrowRate.getUnchecked();
    const normalizedFactor = utilizationRatioRaw
      .sub(optimalUtilizationRatioRaw)
      .div(new Big(1).sub(optimalUtilizationRatioRaw));
    const borrowRateDiff = maxBorrowRateRaw.sub(optimalBorrowRateRaw);

    return Apy.of(
      normalizedFactor.mul(borrowRateDiff).add(optimalBorrowRateRaw)
    );
  }

  public getStakingPoolId(): StakingPoolId | undefined {
    return this.stakingPoolId;
  }

  // add reserve instructions ,use in Sundial
  public async getMarketAuthority(): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddress(
      [this.getMarketId().toBuffer()],
      PORT_LENDING
    );
  }

  public async depositReserve({
    amount,
    userLiquidityWallet,
    destinationCollateralWallet,
    userTransferAuthority,
  }: {
    amount: BN;
    userLiquidityWallet: PublicKey;
    destinationCollateralWallet: PublicKey;
    userTransferAuthority: PublicKey;
  }): Promise<TransactionInstruction[]> {
    const [authority] = await this.getMarketAuthority();
    const ixs: TransactionInstruction[] = [];

    ixs.push(
      refreshReserveInstruction(
        this.getReserveId(),
        this.getOracleId() ?? null
      ),
      depositReserveLiquidityInstruction(
        amount,
        userLiquidityWallet,
        destinationCollateralWallet,
        this.getReserveId(),
        this.getAssetBalanceId(),
        this.getShareMintId(),
        this.getMarketId(),
        authority,
        userTransferAuthority
      )
    );
    return ixs;
  }

  public async depositObligationCollateral({
    amount,
    userCollateralWallet,
    obligation,
    obligationOwner,
    userTransferAuthority,
  }: {
    amount: BN;
    userCollateralWallet: PublicKey;
    obligation: PublicKey;
    obligationOwner: PublicKey;
    userTransferAuthority: PublicKey;
  }): Promise<TransactionInstruction[]> {
    const [authority] = await this.getMarketAuthority();
    const ixs: TransactionInstruction[] = [];

    ixs.push(
      refreshReserveInstruction(
        this.getReserveId(),
        this.getOracleId() ?? null
      ),
      depositObligationCollateralInstruction(
        amount,
        userCollateralWallet,
        this.getShareBalanceId(),
        this.getReserveId(),
        obligation,
        this.getMarketId(),
        authority,
        obligationOwner,
        userTransferAuthority
      )
    );
    return ixs;
  }

  public async borrowObligationLiquidity({
    amount,
    userWallet,
    owner,
    obligation,
  }: {
    amount: BN;
    userWallet: PublicKey;
    obligation: PublicKey;
    owner: PublicKey;
    userTransferAuthority: PublicKey;
  }): Promise<TransactionInstruction[]> {
    const [authority] = await this.getMarketAuthority();
    const ixs: TransactionInstruction[] = [];

    ixs.push(
      borrowObligationLiquidityInstruction(
        amount,
        this.getAssetBalanceId(),
        userWallet,
        this.getReserveId(),
        this.getFeeBalanceId(),
        obligation,
        this.getMarketId(),
        authority,
        owner
      )
    );
    return ixs;
  }

  public async redeemCollateral({
    amount,
    userCollateralWallet,
    destinationLiquidityWallet,
    userTransferAuthority,
  }: {
    amount: BN;
    userCollateralWallet: PublicKey;
    destinationLiquidityWallet: PublicKey;
    userTransferAuthority: PublicKey;
  }): Promise<TransactionInstruction[]> {
    const [authority] = await this.getMarketAuthority();
    const ixs: TransactionInstruction[] = [];

    ixs.push(
      redeemReserveCollateralInstruction(
        amount,
        userCollateralWallet,
        destinationLiquidityWallet,
        this.getReserveId(),
        this.getShareMintId(),
        this.getAssetBalanceId(),
        this.getMarketId(),
        authority,
        userTransferAuthority
      )
    );
    return ixs;
  }
}

export class ReserveAssetInfo {
  private readonly mintId: MintId;
  private readonly oracleId: OracleId | null;
  private readonly feeAccountId: TokenAccountId;
  private readonly supplyAccountId: TokenAccountId;
  private readonly available: Asset;
  private readonly borrowed: Asset;
  private readonly markPrice: AssetPrice;
  private readonly cumulativeBorrowRate: ExchangeRate;
  private readonly quantityContext: QuantityContext;

  constructor(
    mintId: MintId,
    oracleId: OracleId | null,
    feeBalanceId: TokenAccountId,
    supplyAccountId: TokenAccountId,
    available: Asset,
    borrowed: Asset,
    markPrice: AssetPrice,
    cumulativeBorrowRate: ExchangeRate,
    quantityContext: QuantityContext
  ) {
    this.mintId = mintId;
    this.oracleId = oracleId;
    this.feeAccountId = feeBalanceId;
    this.supplyAccountId = supplyAccountId;
    this.available = available;
    this.borrowed = borrowed;
    this.markPrice = markPrice;
    this.cumulativeBorrowRate = cumulativeBorrowRate;
    this.quantityContext = quantityContext;
  }

  public static fromRaw(raw: ReserveLiquidity): ReserveAssetInfo {
    const mintId = raw.mintPubkey;
    const oracleId =
      raw.oracleOption === 1 ? MintId.of(raw.oraclePubkey) : null;
    const feeAccountId = raw.feeReceiver;
    const supplyBalanceId = raw.supplyPubkey;
    const available = Asset.of(mintId, raw.availableAmount);
    const borrowed = Asset.of(mintId, raw.borrowedAmountWads);
    const markPrice = AssetPrice.of(mintId, raw.marketPrice);
    const cumulativeBorrowRate = raw.cumulativeBorrowRateWads;
    const quantityContext = QuantityContext.fromDecimals(raw.mintDecimals);
    return new ReserveAssetInfo(
      mintId,
      oracleId,
      feeAccountId,
      supplyBalanceId,
      available,
      borrowed,
      markPrice,
      cumulativeBorrowRate,
      quantityContext
    );
  }

  public getMintId(): MintId {
    return this.mintId;
  }

  public getOracleId(): OracleId | null {
    return this.oracleId;
  }

  public getFeeAccountId(): TokenAccountId {
    return this.feeAccountId;
  }

  public getSplAccountId(): TokenAccountId {
    return this.supplyAccountId;
  }

  public getAvailableAsset(): Asset {
    return this.available;
  }

  public getBorrowedAsset(): Asset {
    return this.borrowed;
  }

  public getMarkPrice(): AssetPrice {
    return this.markPrice;
  }

  public getCumulativeBorrowRate(): ExchangeRate {
    return this.cumulativeBorrowRate;
  }

  public getQuantityContext(): QuantityContext {
    return this.quantityContext;
  }
}

export class ReserveTokenInfo {
  private readonly mintId: MintId;
  private readonly splAccountId: TokenAccountId;
  private readonly issuedShare: Share;

  constructor(mintId: MintId, splAccount: TokenAccountId, issuedShare: Share) {
    this.mintId = mintId;
    this.splAccountId = splAccount;
    this.issuedShare = issuedShare;
  }

  public static fromRaw(raw: ReserveCollateral): ReserveTokenInfo {
    const mintId = raw.mintPubkey;
    const splAccountId = raw.supplyPubkey;
    const issuedShare = Share.of(mintId, raw.mintTotalSupply);
    return new ReserveTokenInfo(mintId, splAccountId, issuedShare);
  }

  public getMintId(): MintId {
    return this.mintId;
  }

  public getSplAccountId(): TokenAccountId {
    return this.splAccountId;
  }

  public getIssuedShare(): Share {
    return this.issuedShare;
  }
}

export class ReserveParams {
  loanToValueRatio: Percentage;
  optimalUtilizationRatio: ReserveUtilizationRatio;
  optimalBorrowRate: ReserveBorrowRate;
  minBorrowRate: ReserveBorrowRate;
  maxBorrowRate: ReserveBorrowRate;
  liquidationThreshold: Percentage;
  liquidationPenalty: Percentage;
  borrowFee: Percentage;

  constructor(
    loanToValueRatio: Percentage,
    optimalUtilizationRatio: ReserveUtilizationRatio,
    optimalBorrowRate: ReserveBorrowRate,
    minBorrowRate: ReserveBorrowRate,
    maxBorrowRate: ReserveBorrowRate,
    liquidationThreshold: Percentage,
    liquidationPenalty: Percentage,
    borrowFee: Percentage
  ) {
    this.loanToValueRatio = loanToValueRatio;
    this.optimalUtilizationRatio = optimalUtilizationRatio;
    this.optimalBorrowRate = optimalBorrowRate;
    this.minBorrowRate = minBorrowRate;
    this.maxBorrowRate = maxBorrowRate;
    this.liquidationThreshold = liquidationThreshold;
    this.liquidationPenalty = liquidationPenalty;
    this.borrowFee = borrowFee;
  }

  static fromRaw(mintId: MintId, config: ReserveConfig): ReserveParams {
    const loanToValueRatio = config.loanToValueRatio;
    const optimalUtilizationRatio = new ReserveUtilizationRatio(
      mintId,
      config.optimalUtilizationRate
    );
    const optimalBorrowRate = new ReserveBorrowRate(
      mintId,
      config.optimalBorrowRate
    );
    const minBorrowRate = new ReserveBorrowRate(mintId, config.minBorrowRate);
    const maxBorrowRate = new ReserveBorrowRate(mintId, config.maxBorrowRate);
    const liquidationThreshold = config.liquidationThreshold;
    const liquidationPenalty = config.liquidationBonus;
    const borrowFee = Percentage.fromOneBased(config.fees.borrowFeeWad);
    return new ReserveParams(
      loanToValueRatio,
      optimalUtilizationRatio,
      optimalBorrowRate,
      minBorrowRate,
      maxBorrowRate,
      liquidationThreshold,
      liquidationPenalty,
      borrowFee
    );
  }
}
