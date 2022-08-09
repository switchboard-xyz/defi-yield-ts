import assert from "assert";
import { PublicKey } from "@solana/web3.js";

export type Protocol = "apricot" | "jet" | "mango" | "port" | "solend" | "01";

export type ProtocolRates = {
  protocol: Protocol;
  rates: AssetRate[];
};

export type AssetRate = {
  asset: string;
  mint: PublicKey;
  borrowAmount: number;
  borrowRate: number | undefined;
  depositAmount: number;
  depositRate: number | undefined;
};

export function toRate(rate: string): number {
  assert(rate.endsWith("%"));
  return parseFloat(rate.substring(0, rate.length - 1)) * 0.01;
}
